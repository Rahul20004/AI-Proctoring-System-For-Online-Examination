import { Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, Box, Divider } from '@mui/material';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const Sidebar = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 260,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 260,
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #eee',
        },
      }}
    >
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ color: '#6c63ff', fontWeight: 800, letterSpacing: 1 }}>ProctoAI</Typography>
      </Box>
      <List sx={{ px: 2 }}>
        <Typography variant="overline" sx={{ px: 2, color: '#888', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '1.2px' }}>HOME</Typography>
        <ListItem 
          button 
          component={Link} 
          to="/teacher"
          sx={{ 
            background: location.pathname === '/teacher' ? 'linear-gradient(135deg, #6c63ff, #7f53ac)' : 'transparent', 
            borderRadius: '10px', 
            mb: 1, 
            '&:hover': { bgcolor: location.pathname === '/teacher' ? '' : '#f1f3f6' }, 
            color: location.pathname === '/teacher' ? '#ffffff' : '#2c3e50', 
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
        >
          <ListItemIcon sx={{ color: location.pathname === '/teacher' ? '#ffffff' : '#6c757d', minWidth: 40 }}><HomeIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" primaryTypographyProps={{ fontWeight: location.pathname === '/teacher' ? 600 : 500 }} />
        </ListItem>

        <Divider sx={{ my: 2, borderColor: '#eee' }} />
        
        <Typography variant="overline" sx={{ px: 2, color: '#888', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '1.2px' }}>STUDENT</Typography>
        <ListItem button sx={{ borderRadius: '10px', mb: 1, '&:hover': { bgcolor: '#f1f3f6' }, color: '#2c3e50', transition: 'all 0.2s ease', cursor: 'pointer' }}>
          <ListItemIcon sx={{ color: '#6c757d', minWidth: 40 }}><AssignmentIcon /></ListItemIcon>
          <ListItemText primary="Exams" primaryTypographyProps={{ fontWeight: 500 }} />
        </ListItem>
        <ListItem button sx={{ borderRadius: '10px', mb: 1, '&:hover': { bgcolor: '#f1f3f6' }, color: '#2c3e50', transition: 'all 0.2s ease', cursor: 'pointer' }}>
          <ListItemIcon sx={{ color: '#6c757d', minWidth: 40 }}><AssessmentIcon /></ListItemIcon>
          <ListItemText primary="Result" primaryTypographyProps={{ fontWeight: 500 }} />
        </ListItem>

        {userInfo?.role === 'teacher' && (
          <>
            <Divider sx={{ my: 2, borderColor: '#eee' }} />

            <Typography variant="overline" sx={{ px: 2, color: '#888', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '1.2px' }}>TEACHER</Typography>
            <ListItem 
              button 
              component={Link}
              to="/teacher/manage-exams"
              sx={{ 
                borderRadius: '10px', mb: 1, 
                background: location.pathname === '/teacher/manage-exams' ? 'linear-gradient(135deg, #6c63ff, #7f53ac)' : 'transparent',
                color: location.pathname === '/teacher/manage-exams' ? '#ffffff' : '#2c3e50',
                '&:hover': { bgcolor: location.pathname === '/teacher/manage-exams' ? '' : '#f1f3f6' }, 
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === '/teacher/manage-exams' ? '#ffffff' : '#6c757d', minWidth: 40 }}><SettingsIcon /></ListItemIcon>
              <ListItemText primary="Manage Exams" primaryTypographyProps={{ fontWeight: location.pathname === '/teacher/manage-exams' ? 600 : 500 }} />
            </ListItem>
            
            <ListItem 
              button 
              component={Link}
              to="/teacher/active-exams"
              sx={{ 
                borderRadius: '10px', mb: 1, 
                background: location.pathname === '/teacher/active-exams' ? 'linear-gradient(135deg, #6c63ff, #7f53ac)' : 'transparent',
                color: location.pathname === '/teacher/active-exams' ? '#ffffff' : '#2c3e50',
                '&:hover': { bgcolor: location.pathname === '/teacher/active-exams' ? '' : '#f1f3f6' }, 
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === '/teacher/active-exams' ? '#ffffff' : '#6c757d', minWidth: 40 }}><FactCheckIcon /></ListItemIcon>
              <ListItemText primary="Active Exams" primaryTypographyProps={{ fontWeight: location.pathname === '/teacher/active-exams' ? 600 : 500 }} />
            </ListItem>

            <ListItem 
              button 
              component={Link}
              to="/teacher/student-reports"
              sx={{ 
                borderRadius: '10px', mb: 1, 
                background: location.pathname === '/teacher/student-reports' ? 'linear-gradient(135deg, #6c63ff, #7f53ac)' : 'transparent',
                color: location.pathname === '/teacher/student-reports' ? '#ffffff' : '#2c3e50',
                '&:hover': { bgcolor: location.pathname === '/teacher/student-reports' ? '' : '#f1f3f6' }, 
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === '/teacher/student-reports' ? '#ffffff' : '#6c757d', minWidth: 40 }}><AnalyticsIcon /></ListItemIcon>
              <ListItemText primary="Students Report" primaryTypographyProps={{ fontWeight: location.pathname === '/teacher/student-reports' ? 600 : 500 }} />
            </ListItem>
          </>
        )}
      </List>
    </Drawer>
  );
};

export default Sidebar;
