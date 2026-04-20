import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../slices/authSlice';
import { BrainCircuit } from 'lucide-react';

const Header = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logoutHandler = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <BrainCircuit color="#6c63ff" size={32} />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              ml: 1,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'Inter',
              fontWeight: 700,
              letterSpacing: '.1rem',
              color: 'inherit',
              textDecoration: 'none',
              flexGrow: 1
            }}
          >
            ProctoAI
          </Typography>

          <Box sx={{ flexGrow: 0 }}>
            {userInfo ? (
              <>
                <Typography variant="body1" display="inline" sx={{ mr: 2 }}>
                  {userInfo.name} ({userInfo.role})
                </Typography>
                <Button onClick={logoutHandler} variant="outlined" color="secondary">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button href="/login" color="inherit" sx={{ mr: 1 }}>Login</Button>
                <Button href="/register" variant="contained" color="primary">Sign Up</Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
