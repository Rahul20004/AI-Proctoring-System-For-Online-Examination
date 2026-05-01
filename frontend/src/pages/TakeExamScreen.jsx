import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as faceapi from '@vladmandic/face-api';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import Swal from 'sweetalert2';
import { Container, Paper, Typography, Box, Button, Radio, RadioGroup, FormControlLabel, CircularProgress, Grid } from '@mui/material';
import { useGetExamsQuery } from '../slices/examApiSlice';
import { useCreateResultMutation } from '../slices/resultApiSlice';

const TakeExamScreen = () => {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const { examList } = useGetExamsQuery(undefined, {
    selectFromResult: ({ data }) => ({ examList: data }),
  });
  const [createResult] = useCreateResultMutation();

  const [exam, setExam] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeSpent, setTimeSpent] = useState([]);
  const [cheatLogs, setCheatLogs] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Per-question countdown timer
  const [timeLeft, setTimeLeft] = useState(0);       // seconds remaining for current question
  const [timePerQuestion, setTimePerQuestion] = useState(0); // total seconds allocated per question
  const startTimeRef = useRef(Date.now());            // wall-clock start of current question

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const faceModelRef = useRef(null);
  const objModelRef = useRef(null);

  // Stability counters – require N consecutive bad frames before alerting
  const noFaceCountRef    = useRef(0);
  const multiFaceCountRef = useRef(0);
  const FACE_MISS_THRESHOLD = 3; // 3 × 3 s = 9 s of continuous absence

  // Tab-switch detection
  const tabSwitchCountRef  = useRef(0);
  const TAB_SWITCH_LIMIT   = 2;           // max allowed switches before auto-submit
  const [tabSwitchCount, setTabSwitchCount] = useState(0); // for UI display

  // Initialize Exam
  useEffect(() => {
    if (examList) {
      const foundExam = examList.find(e => e._id === examId);
      if (foundExam) setExam(foundExam);
    }
  }, [examList, examId]);

  // Load AI Models
  useEffect(() => {
    const loadModels = async () => {
      await tf.ready();
      await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
      objModelRef.current = await cocoSsd.load();
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  // ── Tab-Switch Detection ──────────────────────────────────────────────────
  useEffect(() => {
    if (!exam) return; // don't monitor until exam is loaded

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        tabSwitchCountRef.current += 1;
        const count = tabSwitchCountRef.current;
        setTabSwitchCount(count);

        console.log(`[TabGuard] Tab switched – count: ${count}/${TAB_SWITCH_LIMIT}`);

        // Log to cheat record
        setCheatLogs(prev => [...prev, { type: `Tab Switch #${count}`, timestamp: new Date() }]);

        if (count > TAB_SWITCH_LIMIT) {
          // ─── AUTO SUBMIT ──────────────────────────────────────────────
          console.warn('[TabGuard] ❌ Limit exceeded – auto-submitting exam');
          Swal.fire({
            icon: 'error',
            title: '🚫 Auto Submitted',
            html: 'You switched tabs too many times.<br/>Your exam has been <b>auto-submitted</b>.',
            timer: 4000,
            timerProgressBar: true,
            showConfirmButton: false,
            allowOutsideClick: false,
          });
          // Submit with current answers after brief display
          setTimeout(() => {
            const timeSpentAmount = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const finalTimeSpent = [...timeSpent, { questionIndex: currentQuestionIndex, timeSpent: timeSpentAmount }];
            submitExamData(finalTimeSpent);
          }, 1500);
        } else {
          // ─── WARNING ─────────────────────────────────────────────────
          const remaining = TAB_SWITCH_LIMIT - count;
          Swal.fire({
            icon: 'warning',
            title: "⚠️ Don't switch tabs!",
            html: `Tab switch <b>#${count}</b> detected.<br/>
                   <span style="color:#e53935;font-weight:700">
                     ${remaining} warning${remaining === 1 ? '' : 's'} remaining before auto-submit.
                   </span>`,
            confirmButtonColor: '#e53935',
            confirmButtonText: 'Return to Exam',
            allowOutsideClick: false,
          });
        }
      }
    };

    // Also catch window blur (alt-tab, minimise, DevTools open, etc.)
    const handleBlur = () => {
      // visibilitychange covers most cases; blur is a secondary safeguard
      // Only fire if visibility is still 'visible' to avoid double-counting
      if (document.visibilityState === 'visible') {
        handleVisibilityChange();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, timeSpent, currentQuestionIndex]);


  // ── Per-Question Timer (merged, ref-based) ───────────────────────────────
  // Single effect so there is NO stale-closure gap between "set time" and
  // "start interval". timeLeftRef keeps the interval callback in sync with
  // the live countdown value without needing it as a dependency.
  const timeLeftRef = useRef(0);

  useEffect(() => {
    if (!exam) return;

    // Equal time slice for every question
    const totalSeconds  = (exam.duration || 10) * 60;
    const questionCount = exam.questions?.length || 1;
    const perQ          = Math.floor(totalSeconds / questionCount);

    // Initialise state + ref together – both see the same value immediately
    timeLeftRef.current = perQ;
    setTimePerQuestion(perQ);
    setTimeLeft(perQ);
    startTimeRef.current = Date.now();

    console.log(`[Timer] Q${currentQuestionIndex + 1} started: ${perQ}s  (${exam.duration}min ÷ ${questionCount}q)`);

    // Interval reads from ref → never stale, never pauses
    const timerId = setInterval(() => {
      timeLeftRef.current -= 1;
      const remaining = timeLeftRef.current;

      setTimeLeft(remaining); // keep UI in sync

      if (remaining <= 0) {
        clearInterval(timerId);
        console.log(`[Timer] Q${currentQuestionIndex + 1} expired – auto-advancing`);
        handleTimeout();
      }
    }, 1000);

    // Cleanup when question changes or component unmounts
    return () => clearInterval(timerId);

  // handleTimeout is defined below but is stable across renders (no deps that change)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, currentQuestionIndex]);



  // Auto-submit timeout handler
  const handleTimeout = () => {
    const timeSpentAmount = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    // Using a callback to ensure we get the latest timeSpent state without closure issues
    setTimeSpent(prev => {
      const updated = [...prev, { questionIndex: currentQuestionIndex, timeSpent: timeSpentAmount }];
      
      // If it's the last question, automatically submit
      if (currentQuestionIndex >= exam.questions.length - 1) {
        submitExamData(updated);
      } else {
        // Otherwise artificially advance index
        setCurrentQuestionIndex(c => c + 1);
      }
      return updated;
    });
  };

  // Function to show alert without spamming
  const triggerAlert = (title) => {
    // We check if an alert is already open so we don't spam the UI
    if (!Swal.isVisible()) {
      Swal.fire({
        icon: 'error',
        title: title,
        text: 'Action has been Recorded',
        confirmButtonColor: '#70c5e8',
        confirmButtonText: 'OK',
        customClass: {
          container: 'procto-alert-container',
        }
      });
    }
  };

  // Proctoring loop
  const detectCheating = useCallback(async () => {
    if (!modelsLoaded || !webcamRef.current?.video || webcamRef.current.video.readyState !== 4) return;
    
    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { videoWidth, videoHeight } = video;
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    ctx.clearRect(0, 0, videoWidth, videoHeight);
    
    try {
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
      const objects = await objModelRef.current.detect(video);
      
      // DEBUG LOG
      console.log('Detected Objects:', objects);

      let eventTitle = null;
      let hasPerson = false;
      let hasSuspiciousObject = false;

      // Draw bounding boxes for faces
      const resizedDetections = faceapi.resizeResults(detections, { width: videoWidth, height: videoHeight });
      faceapi.draw.drawDetections(canvas, resizedDetections);

      // ── Object Detection ─────────────────────────────────────────────────
      // Pass 1a – PROHIBITED  (phone/laptop) → threshold 0.25, red box
      // Pass 1b – SUSPICIOUS  (books/notes)  → threshold 0.30, orange box
      // Pass 2  – General objects             → threshold 0.40, cyan box

      const PROHIBITED_THRESHOLD = 0.25;
      const SUSPICIOUS_THRESHOLD = 0.30;
      const GENERAL_THRESHOLD    = 0.40;

      const PROHIBITED_CLASSES = ['cell phone', 'laptop'];
      const SUSPICIOUS_CLASSES  = [
        'book', 'notebook', 'magazine', 'paper',
        'keyboard', 'mouse', 'remote',
        'earphones', 'headphones', 'airpods',
        'backpack', 'handbag', 'suitcase'
      ];

      objects.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;
        const area  = width * height;
        const score = prediction.score;
        const cls   = prediction.class;

        // Pass 1a: PROHIBITED – sensitive threshold ───────────────────────
        if (PROHIBITED_CLASSES.includes(cls) && score > PROHIBITED_THRESHOLD) {
          console.log(`[Proctor] 📵 PROHIBITED: "${cls}" | confidence: ${(score * 100).toFixed(1)}% | partial: ${score < GENERAL_THRESHOLD}`);

          ctx.strokeStyle = '#ff1744'; // red
          ctx.lineWidth   = 4;
          ctx.strokeRect(x, y, width, height);
          ctx.fillStyle = '#ff1744';
          ctx.font      = 'bold 16px Arial';
          ctx.fillText(
            `🚫 ${cls.toUpperCase()} (${Math.round(score * 100)}%)`,
            x, y > 22 ? y - 6 : 16
          );

          eventTitle = `⚠️ Mobile Detected: ${cls.toUpperCase()}`;
          return;
        }

        // Pass 1b: SUSPICIOUS objects – partial-visibility threshold ──────
        if (SUSPICIOUS_CLASSES.includes(cls) && score > SUSPICIOUS_THRESHOLD) {
          console.log(`[Proctor] 📚 SUSPICIOUS: "${cls}" | confidence: ${(score * 100).toFixed(1)}%`);

          ctx.strokeStyle = '#ff9100'; // orange
          ctx.lineWidth   = 4;
          ctx.strokeRect(x, y, width, height);
          ctx.fillStyle = '#ff9100';
          ctx.font      = 'bold 16px Arial';
          ctx.fillText(
            `⚠️ ${cls.toUpperCase()} (${Math.round(score * 100)}%)`,
            x, y > 22 ? y - 6 : 16
          );

          if (!eventTitle) {
            eventTitle = `⚠️ Object Detected: ${cls.toUpperCase()}`;
          }
          return;
        }

        // Pass 2: General objects – normal threshold ───────────────────────
        if (score > GENERAL_THRESHOLD) {
          ctx.strokeStyle = '#00FFFF'; // cyan
          ctx.lineWidth   = 4;
          ctx.strokeRect(x, y, width, height);
          ctx.fillStyle = '#00FFFF';
          ctx.font      = '18px Arial';
          ctx.fillText(
            `${cls} (${Math.round(score * 100)}%)`,
            x, y > 20 ? y - 5 : 10
          );

          console.log(`[Proctor] 🔍 Detected: "${cls}" | confidence: ${(score * 100).toFixed(1)}% | area: ${Math.round(area)}`);

          if (cls === 'person') {
            hasPerson = true;
          } else if (area > 40000) {
            // Fallback: any large unclassified object near the person is suspicious
            hasSuspiciousObject = true;
          }
        }
      });

      // Fallback: large unclassified object in frame (no specific class match)
      if (!eventTitle && hasSuspiciousObject) {
        console.log('[Proctor] ⚠️ Suspicious large unclassified object in frame');
        eventTitle = '⚠️ Suspicious Object Detected';
      }

      // ── Face Proctoring – stability-gated ───────────────────────────────
      if (detections.length === 0) {
        noFaceCountRef.current += 1;
        multiFaceCountRef.current = 0; // reset the other counter
        console.log(`[Proctor] No face detected – consecutive misses: ${noFaceCountRef.current}/${FACE_MISS_THRESHOLD}`);

        if (noFaceCountRef.current >= FACE_MISS_THRESHOLD) {
          // Confirmed absence over multiple frames
          eventTitle = 'Face Not Visible';
          // Don't reset yet – keep alerting every N frames until face returns
        }
      } else if (detections.length > 1) {
        multiFaceCountRef.current += 1;
        noFaceCountRef.current = 0;
        console.log(`[Proctor] Multiple faces (${detections.length}) – consecutive: ${multiFaceCountRef.current}/${FACE_MISS_THRESHOLD}`);

        if (multiFaceCountRef.current >= FACE_MISS_THRESHOLD) {
          eventTitle = 'Multiple Faces Detected';
        }
      } else {
        // Exactly one face – all good, reset both counters
        noFaceCountRef.current   = 0;
        multiFaceCountRef.current = 0;
        console.log('[Proctor] ✅ Face Visible – counters reset');
      }

      if (eventTitle) {
        setCheatLogs(prev => [...prev, { type: eventTitle, timestamp: new Date() }]);
        triggerAlert(eventTitle);
      }
    } catch (e) {
      console.error(e);
    }
  }, [modelsLoaded]);

  useEffect(() => {
    if (!modelsLoaded) return;
    const intervalId = setInterval(detectCheating, 3000);
    return () => clearInterval(intervalId);
  }, [modelsLoaded, detectCheating]);

  const handleNext = () => {
    const timeSpentAmount = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setTimeSpent(prev => [...prev, { questionIndex: currentQuestionIndex, timeSpent: timeSpentAmount }]);
    
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const calculateScore = () => {
    let score = 0;
    exam.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.options[q.correctOption]) {
        score += 1;
      }
    });
    return score;
  };

  const handleSubmit = async () => {
    const timeSpentAmount = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const finalTimeSpent = [...timeSpent, { questionIndex: currentQuestionIndex, timeSpent: timeSpentAmount }];
    await submitExamData(finalTimeSpent);
  };

  const submitExamData = async (finalTimeSpentData) => {
    const score = calculateScore();
    
    // We already support map logic in our API because we push array identically here
    try {
      await createResult({
        examId,
        score,
        totalQuestions: exam.questions.length,
        timeSpentPerQuestion: finalTimeSpentData,
        cheatLogs,
        selectedAnswers // send per-question answers for the Questions Preview modal
      }).unwrap();
      navigate('/');
    } catch (err) {
      console.error('Failed to submit exam', err);
    }
  };

  if (!exam) return <Container><Typography>Loading...</Typography></Container>;
  
  const question = exam.questions[currentQuestionIndex];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#ffffff', py: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ p: 4, minHeight: '60vh', display: 'flex', flexDirection: 'column', bgcolor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} pb={2} sx={{ borderBottom: '1px solid #e5e7eb' }}>
                <Typography variant="h6" sx={{ color: '#6b7280', fontWeight: 600 }}>
                  Question {currentQuestionIndex + 1} of {exam.questions.length}
                </Typography>

                {/* Per-question countdown in MM:SS */}
                {(() => {
                  const mins = Math.floor(timeLeft / 60);
                  const secs = timeLeft % 60;
                  const pct  = timePerQuestion > 0 ? (timeLeft / timePerQuestion) * 100 : 100;
                  const isUrgent = timeLeft <= 10;
                  return (
                    <Box textAlign="right">
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{ fontFamily: 'monospace', letterSpacing: 2, color: isUrgent ? '#ef4444' : '#6b7280' }}
                      >
                        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                      </Typography>
                      {/* thin progress bar */}
                      <Box
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          bgcolor: '#f3f4f6',
                          mt: 0.5,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${pct}%`,
                            bgcolor: isUrgent ? '#ef4444' : pct < 50 ? '#f59e0b' : '#10b981',
                            transition: 'width 1s linear, background-color 0.3s',
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })()}
              </Box>
              
              <Typography variant="h5" mb={4} sx={{ color: '#111827', fontWeight: 600 }}>
                {question.questionText}
              </Typography>
              
              <RadioGroup 
                value={selectedAnswers[currentQuestionIndex] || ''} 
                onChange={(e) => setSelectedAnswers({...selectedAnswers, [currentQuestionIndex]: e.target.value})}
                sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                {question.options.map((opt, i) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === opt;
                  const optionLetter = String.fromCharCode(65 + i);
                  
                  return (
                    <Box
                      key={i}
                      sx={{
                        border: '1px solid',
                        borderColor: isSelected ? '#7c3aed' : '#e5e7eb',
                        bgcolor: isSelected ? '#ede9fe' : '#ffffff',
                        borderRadius: '8px',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: isSelected ? '#ede9fe' : '#f3f4f6'
                        }
                      }}
                    >
                      <FormControlLabel 
                        value={opt} 
                        control={<Radio sx={{ color: '#9ca3af', '&.Mui-checked': { color: '#7c3aed' } }} />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ fontWeight: 'bold', mr: 1, color: isSelected ? '#7c3aed' : '#4b5563' }}>
                              {optionLetter}.
                            </Typography>
                            <Typography sx={{ color: '#374151', fontWeight: isSelected ? 600 : 400 }}>
                              {opt}
                            </Typography>
                          </Box>
                        } 
                        sx={{ width: '100%', m: 0, px: 2, py: 1.5 }}
                      />
                    </Box>
                  );
                })}
              </RadioGroup>

              <Box mt="auto" pt={4} display="flex" justifyContent="flex-end">
                {currentQuestionIndex < exam.questions.length - 1 ? (
                  <Button 
                    variant="contained" 
                    onClick={handleNext}
                    sx={{
                      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                      color: '#fff',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      borderRadius: '8px',
                      textTransform: 'none',
                      transition: 'all 0.2s',
                      '&:hover': {
                        filter: 'brightness(1.1)',
                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                      }
                    }}
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button 
                    variant="contained" 
                    onClick={handleSubmit}
                    sx={{
                      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                      color: '#fff',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      borderRadius: '8px',
                      textTransform: 'none',
                      transition: 'all 0.2s',
                      '&:hover': {
                        filter: 'brightness(1.1)',
                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                      }
                    }}
                  >
                    Submit Exam
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <Typography variant="subtitle1" fontWeight="600" mb={2} color="#ef4444">
                Proctoring Active
              </Typography>
              <Box position="relative">
                {!modelsLoaded && (
                  <Box position="absolute" top="50%" left="50%" sx={{ transform: 'translate(-50%, -50%)', zIndex: 10, bgcolor: 'rgba(255,255,255,0.8)', p: 2, borderRadius: 2 }}>
                    <CircularProgress size={24} sx={{ color: '#7c3aed' }} />
                    <Typography variant="caption" display="block" sx={{ mt: 1, color: '#374151' }}>Loading AI...</Typography>
                  </Box>
                )}
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  width="100%"
                  style={{ borderRadius: '8px', border: '2px solid #ef4444' }}
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    borderRadius: '8px'
                  }}
                />
              </Box>
              <Box mt={3} pt={2} sx={{ borderTop: '1px solid #e5e7eb' }}>
                <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, mb: 1 }}>
                  Warnings logged: {cheatLogs.length}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: tabSwitchCount >= TAB_SWITCH_LIMIT ? '#ef4444' : tabSwitchCount > 0 ? '#f59e0b' : '#10b981',
                  }}
                >
                  Tab switches: {tabSwitchCount} / {TAB_SWITCH_LIMIT}
                  {tabSwitchCount >= TAB_SWITCH_LIMIT && ' — ⚠️ Next switch = Auto Submit'}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default TakeExamScreen;
