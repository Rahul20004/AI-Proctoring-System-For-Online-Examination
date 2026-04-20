import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { useDispatch, useSelector } from 'react-redux';
import { useRegisterMutation } from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';
import { Box, Button, TextField, Typography, Container, Paper, Select, MenuItem, InputLabel, FormControl } from '@mui/material';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [faceImage, setFaceImage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const webcamRef = useRef(null);

  const captureFace = useCallback(() => {
    if (webcamRef.current) {
      setFaceImage(webcamRef.current.getScreenshot());
    }
  }, [webcamRef]);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [register, { isLoading }] = useRegisterMutation();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) {
      navigate('/');
    }
  }, [navigate, userInfo]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      if (role === 'student' && !faceImage) {
        setErrorMsg('Please capture your face image to register as a student.');
        return;
      }
      const res = await register({ name, email, password, role, faceImage }).unwrap();
      dispatch(setCredentials({ ...res }));
      navigate('/');
    } catch (err) {
      setErrorMsg(err?.data?.message || err.error);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 6, borderRadius: 3, background: 'rgba(30, 30, 30, 0.8)', backdropFilter: 'blur(10px)' }}>
        <Typography component="h1" variant="h4" fontWeight="bold" color="primary" gutterBottom>
          Sign Up
        </Typography>

        <Box component="form" onSubmit={submitHandler} sx={{ mt: 1 }}>
          <TextField margin="normal" required fullWidth id="name" label="Full Name" name="name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="role-label">Role</InputLabel>
            <Select labelId="role-label" id="role" value={role} label="Role" onChange={(e) => setRole(e.target.value)}>
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="teacher">Teacher</MenuItem>
            </Select>
          </FormControl>

          {role === 'student' && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>Profile Picture (Required for Exams)</Typography>
              {!faceImage ? (
                <>
                  <Box sx={{ width: '100%', borderRadius: 2, overflow: 'hidden', border: '2px solid #555' }}>
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      width="100%"
                      videoConstraints={{ facingMode: "user" }}
                    />
                  </Box>
                  <Button variant="outlined" color="primary" onClick={captureFace} sx={{ mt: 1 }}>Capture Face Profile</Button>
                </>
              ) : (
                <>
                  <Box sx={{ width: '100%', borderRadius: 2, overflow: 'hidden', border: '2px solid #4caf50' }}>
                    <img src={faceImage} alt="Captured" style={{ width: '100%', display: 'block' }} />
                  </Box>
                  <Button variant="outlined" color="warning" onClick={() => setFaceImage('')} sx={{ mt: 1 }}>Retake Picture</Button>
                </>
              )}
            </Box>
          )}

          {errorMsg && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errorMsg}</Typography>}
          
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1.1rem', textTransform: 'none', borderRadius: 2 }} disabled={isLoading}>
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
