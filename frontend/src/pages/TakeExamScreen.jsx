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
  const [currentTimer, setCurrentTimer] = useState(0);
  const [cheatLogs, setCheatLogs] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

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


  // Timer configuration
  const [timeLeft, setTimeLeft] = useState(0);
  const startTimeRef = useRef(Date.now());

  // Setup timer per question
  useEffect(() => {
    if (exam && exam.timerMode === 'per_question') {
      setTimeLeft(exam.durationPerQuestion || 60); // default to 60s if not set
      startTimeRef.current = Date.now();
    } else if (exam) {
      startTimeRef.current = Date.now();
      setCurrentTimer(0);
    }
  }, [currentQuestionIndex, exam]);

  // Main timer countdown loop
  useEffect(() => {
    if (!exam) return;

    if (exam.timerMode === 'per_question') {
      const timerId = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerId);
            handleTimeout();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerId);
    } else {
      const timerId = setInterval(() => {
        setCurrentTimer(t => t + 1);
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [currentQuestionIndex, exam]);

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
        cheatLogs
      }).unwrap();
      navigate('/');
    } catch (err) {
      console.error('Failed to submit exam', err);
    }
  };

  if (!exam) return <Container><Typography>Loading...</Typography></Container>;
  
  const question = exam.questions[currentQuestionIndex];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 4, minHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="h6">Question {currentQuestionIndex + 1} of {exam.questions.length}</Typography>
              <Typography 
                variant="h6" 
                color={exam.timerMode === 'per_question' && timeLeft <= 5 ? 'error' : 'secondary'}
              >
                {exam.timerMode === 'per_question' ? `Time Left: ${timeLeft}s` : `Timer: ${currentTimer}s`}
              </Typography>
            </Box>
            
            <Typography variant="h5" mb={4}>{question.questionText}</Typography>
            
            <RadioGroup 
              value={selectedAnswers[currentQuestionIndex] || ''} 
              onChange={(e) => setSelectedAnswers({...selectedAnswers, [currentQuestionIndex]: e.target.value})}
            >
              {question.options.map((opt, i) => (
                <FormControlLabel key={i} value={opt} control={<Radio />} label={opt} />
              ))}
            </RadioGroup>

            <Box mt="auto" display="flex" justifyContent="flex-end">
              {currentQuestionIndex < exam.questions.length - 1 ? (
                <Button variant="contained" onClick={handleNext}>Next Question</Button>
              ) : (
                <Button variant="contained" color="secondary" onClick={handleSubmit}>Submit Exam</Button>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={2} color="error">
              Proctoring Active
            </Typography>
            <Box position="relative">
              {!modelsLoaded && (
                <Box position="absolute" top="50%" left="50%" sx={{ transform: 'translate(-50%, -50%)' }}>
                  <CircularProgress size={24} />
                  <Typography variant="caption" display="block">Loading AI...</Typography>
                </Box>
              )}
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                width="100%"
                style={{ borderRadius: '8px', border: '2px solid red' }}
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
            <Box mt={2}>
              <Typography variant="caption" color="textSecondary" display="block">
                Warnings logged: {cheatLogs.length}
              </Typography>
              <Typography
                variant="caption"
                display="block"
                sx={{
                  mt: 0.5,
                  fontWeight: 700,
                  color: tabSwitchCount >= TAB_SWITCH_LIMIT ? '#e53935' : tabSwitchCount > 0 ? '#ff9800' : '#4caf50',
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
  );
};

export default TakeExamScreen;
