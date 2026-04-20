import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import {
  Container, Paper, Typography, Button, Box, CircularProgress, Chip
} from '@mui/material';
import { useVerifyFaceMutation } from '../slices/usersApiSlice';
import { useSelector } from 'react-redux';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

const VerifyFace = () => {
  const webcamRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const examId = location.state?.examId;

  const [verifying, setVerifying] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState(null); // null | 'Verified' | 'Not Verified'
  const [errorMsg, setErrorMsg] = useState('');

  const [verifyFaceAPI] = useVerifyFaceMutation();
  const { userInfo } = useSelector((state) => state.auth);

  // ── Load face-api models once on mount ───────────────────────────────────
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log('[VerifyFace] face-api models loaded');
      } catch (err) {
        console.error('[VerifyFace] Model load error:', err);
        setErrorMsg('Failed to load face verification models. Please refresh.');
      }
    };
    loadModels();
  }, []);

  // ── Main verification handler ─────────────────────────────────────────────
  const handleVerify = async () => {
    if (!modelsLoaded || verifying) return;

    setStatus(null);
    setErrorMsg('');
    setVerifying(true);

    // ── Step 1: Capture live webcam frame ────────────────────────────────
    const capturedImage = webcamRef.current?.getScreenshot();
    if (!capturedImage) {
      setErrorMsg('Could not capture webcam image. Please try again.');
      setVerifying(false);
      return;
    }

    // ── Step 2: Fetch stored face descriptor from DB ─────────────────────
    let storedDescriptor = null;
    try {
      const res = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      console.log('[VerifyFace] Profile fetched from DB:', res.data);
      storedDescriptor = res.data.faceDescriptor; // array of 128 floats or null
    } catch (err) {
      console.error('[VerifyFace] Profile fetch error:', err);
      setErrorMsg('Could not fetch your profile. Please re-login and try again.');
      setVerifying(false);
      return;
    }

    // ── Step 3: Guard – no descriptor means not registered ───────────────
    if (!storedDescriptor || storedDescriptor.length !== 128) {
      setStatus('Not Verified');
      setErrorMsg(
        'No face registered. Please re-register with your face photo to enable verification.'
      );
      setVerifying(false);
      return;
    }

    // ── Step 4: Extract live descriptor from webcam frame ────────────────
    try {
      const liveImg = await new Promise((resolve, reject) => {
        const el = new Image();
        el.crossOrigin = 'anonymous';
        el.src = capturedImage;
        el.onload = () => resolve(el);
        el.onerror = reject;
      });

      const liveDetection = await faceapi
        .detectSingleFace(liveImg)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!liveDetection) {
        setStatus('Not Verified');
        setErrorMsg('No face detected in webcam. Adjust lighting and look directly at the camera.');
        setVerifying(false);
        return;
      }

      const liveDescriptor = liveDetection.descriptor; // Float32Array

      // ── Step 5: Compute Euclidean distance ───────────────────────────
      const storedFloat32 = new Float32Array(storedDescriptor);
      const distance = faceapi.euclideanDistance(storedFloat32, liveDescriptor);
      console.log(`[VerifyFace] Euclidean distance: ${distance.toFixed(4)}`);

      // ── Step 6: Decision ─────────────────────────────────────────────
      if (distance < 0.6) {
        // ✅ VERIFIED
        setStatus('Verified');
        console.log('[VerifyFace] ✅ Face matched – proceeding to exam');
        // Non-blocking backend log
        try {
          await verifyFaceAPI({ capturedImage }).unwrap();
        } catch {
          /* non-blocking */
        }
        // Navigate after short delay so user sees "Verified"
        setTimeout(() => navigate(`/exam/${examId}`), 1500);
      } else {
        // ❌ NOT VERIFIED
        console.warn(`[VerifyFace] ❌ Face mismatch – distance ${distance.toFixed(4)} >= 0.6`);
        setStatus('Not Verified');
        setErrorMsg(`Face does not match (distance: ${distance.toFixed(3)}). Exam blocked.`);
        setVerifying(false);
      }
    } catch (err) {
      console.error('[VerifyFace] Verification error:', err);
      setStatus('Not Verified');
      setErrorMsg('Face verification failed unexpectedly. Please try again.');
      setVerifying(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper
        elevation={6}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 3,
          border: '1px solid #e0e0e0',
        }}
      >
        {/* Title */}
        <Typography variant="h5" color="primary" fontWeight="bold" mb={1}>
          Identity Verification
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
          Look directly at the camera and click <strong>Verify Identity</strong>.
        </Typography>

        {/* Model loading indicator */}
        {!modelsLoaded && (
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Loading AI face models…
            </Typography>
          </Box>
        )}

        {/* Webcam feed */}
        <Box
          sx={{
            width: '100%',
            mb: 3,
            borderRadius: 2,
            overflow: 'hidden',
            border:
              status === 'Verified'
                ? '3px solid #4caf50'
                : status === 'Not Verified'
                ? '3px solid #f44336'
                : '2px solid #555',
            transition: 'border-color 0.3s ease',
          }}
        >
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width="100%"
            videoConstraints={{ facingMode: 'user' }}
          />
        </Box>

        {/* Verification result chip */}
        {status && (
          <Chip
            label={status}
            color={status === 'Verified' ? 'success' : 'error'}
            sx={{ mb: 2, fontWeight: 700, fontSize: '1rem', px: 2, py: 0.5 }}
          />
        )}

        {/* Error message */}
        {errorMsg && (
          <Typography
            color="error"
            variant="body2"
            fontWeight="bold"
            textAlign="center"
            mb={2}
          >
            {errorMsg}
          </Typography>
        )}

        {/* Verify button */}
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          size="large"
          onClick={handleVerify}
          disabled={verifying || !modelsLoaded || status === 'Verified'}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '1rem' }}
        >
          {verifying ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} color="inherit" />
              Verifying…
            </Box>
          ) : (
            'Verify Identity'
          )}
        </Button>

        {/* Retry hint */}
        {status === 'Not Verified' && (
          <Typography variant="caption" color="text.secondary" mt={2} textAlign="center">
            Adjust lighting, remove accessories, and try again.
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default VerifyFace;
