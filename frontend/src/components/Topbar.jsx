import { AppBar, Toolbar, Typography, IconButton, Box, Avatar, Button } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../slices/authSlice';

const Topbar = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#ffffff', color: '#2c3e50', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      <Toolbar sx={{ minHeight: '70px !important' }}>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton size="large" aria-label="show new notifications" sx={{ color: '#666', mr: 2 }}>
          <NotificationsIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ background: 'linear-gradient(135deg, #6c63ff, #7f53ac)', width: 38, height: 38, mr: 1.5, boxShadow: '0 4px 10px rgba(108, 99, 255, 0.3)' }}>
            {userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50', mr: 3 }}>
            Hello, {userInfo ? userInfo.name : 'User'}
          </Typography>
          <Button 
            variant="outlined" 
            color="error" 
            size="small" 
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
