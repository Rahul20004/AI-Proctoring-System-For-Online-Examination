import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { useDispatch, useSelector } from 'react-redux';
import { useRegisterMutation } from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';
import * as faceapi from '@vladmandic/face-api';
import {
  Box, Button, TextField, Typography, Container, Paper,
  Select, MenuItem, InputLabel, FormControl, CircularProgress
} from '@mui/material';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [faceImage, setFaceImage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [descriptorReady, setDescriptorReady] = useState(false);
  const faceDescriptorRef = useRef(null); // stores Float32Array → will be sent as Array
  const webcamRef = useRef(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) navigate('/');
  }, [navigate, userInfo]);

  // Load face-api models only when student role is selected
  useEffect(() => {
    if (role !== 'student' || modelsLoaded) return;
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log('[Register] face-api models loaded');
      } catch (err) {
        console.error('[Register] Model load failed:', err);
        setErrorMsg('Failed to load face models. Please refresh the page.');
      }
    };
    loadModels();
  }, [role]);

  // Capture webcam snapshot AND extract 128-d descriptor
  const captureFace = useCallback(async () => {
    if (!webcamRef.current) return;
    if (!modelsLoaded) {
      setErrorMsg('Face AI models are still loading. Please wait.');
      return;
    }

    setExtracting(true);
    setErrorMsg('');
    setDescriptorReady(false);

    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) {
      setErrorMsg('Could not capture webcam. Please allow camera access.');
      setExtracting(false);
      return;
    }

    // Create an HTMLImageElement from the base64 screenshot
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.src = screenshot;
      el.onload = () => resolve(el);
      el.onerror = reject;
    });

    // Extract the descriptor
    const detection = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setErrorMsg('No face detected in the captured image. Adjust lighting and try again.');
      setExtracting(false);
      return;
    }

    faceDescriptorRef.current = Array.from(detection.descriptor); // Float32Array → plain Array
    console.log(`[Register] Face descriptor extracted (${faceDescriptorRef.current.length} dims)`);
    setFaceImage(screenshot);
    setDescriptorReady(true);
    setExtracting(false);
  }, [modelsLoaded]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (role === 'student') {
      if (!faceImage) {
        setErrorMsg('Please capture your face image to register as a student.');
        return;
      }
      if (!descriptorReady || !faceDescriptorRef.current) {
        setErrorMsg('Face descriptor not ready. Please re-capture your face.');
        return;
      }
    }

    try {
      const payload = {
        name,
        email,
        password,
        role,
        faceImage: role === 'student' ? faceImage : null,
        faceDescriptor: role === 'student' ? faceDescriptorRef.current : null,
      };
      const res = await register(payload).unwrap();
      dispatch(setCredentials({ ...res }));
      navigate('/');
    } catch (err) {
      setErrorMsg(err?.data?.message || err.error);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={6}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: 6,
          borderRadius: 3,
          background: 'rgba(30, 30, 30, 0.8)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography component="h1" variant="h4" fontWeight="bold" color="primary" gutterBottom>
          Sign Up
        </Typography>

        <Box component="form" onSubmit={submitHandler} sx={{ mt: 1, width: '100%' }}>
          <TextField margin="normal" required fullWidth id="name" label="Full Name" name="name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <FormControl fullWidth margin="normal">
            <InputLabel id="role-label">Role</InputLabel>
            <Select labelId="role-label" id="role" value={role} label="Role" onChange={(e) => { setRole(e.target.value); setFaceImage(''); setDescriptorReady(false); }}>
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="teacher">Teacher</MenuItem>
            </Select>
          </FormControl>

          {role === 'student' && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Face Photo — Required for Exam Identity Verification
              </Typography>

              {/* Loading models indicator */}
              {!modelsLoaded && (
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <CircularProgress size={14} />
                  <Typography variant="caption" color="textSecondary">Loading face AI models…</Typography>
                </Box>
              )}

              {!faceImage ? (
                <>
                  <Box sx={{ width: '100%', borderRadius: 2, overflow: 'hidden', border: '2px solid #555' }}>
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      width="100%"
                      videoConstraints={{ facingMode: 'user' }}
                    />
                  </Box>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={captureFace}
                    disabled={!modelsLoaded || extracting}
                    sx={{ mt: 1 }}
                  >
                    {extracting ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <CircularProgress size={14} color="inherit" />
                        Extracting descriptor…
                      </Box>
                    ) : 'Capture Face Profile'}
                  </Button>
                </>
              ) : (
                <>
                  <Box sx={{ width: '100%', borderRadius: 2, overflow: 'hidden', border: descriptorReady ? '2px solid #4caf50' : '2px solid #f44336' }}>
                    <img src={faceImage} alt="Captured" style={{ width: '100%', display: 'block' }} />
                  </Box>
                  {descriptorReady && (
                    <Typography variant="caption" color="success.main" sx={{ mt: 0.5 }}>
                      ✅ Face descriptor extracted (128-d vector ready)
                    </Typography>
                  )}
                  <Button variant="outlined" color="warning" onClick={() => { setFaceImage(''); setDescriptorReady(false); faceDescriptorRef.current = null; }} sx={{ mt: 1 }}>
                    Retake Picture
                  </Button>
                </>
              )}
            </Box>
          )}

          {errorMsg && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errorMsg}</Typography>}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1.1rem', textTransform: 'none', borderRadius: 2 }}
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Register'}
          </Button>
          <Button fullWidth variant="text" onClick={() => navigate('/login')} sx={{ textTransform: 'none' }}>
            Already have an account? Log In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterScreen;
