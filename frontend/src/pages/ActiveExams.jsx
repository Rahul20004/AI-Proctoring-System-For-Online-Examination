import { Box, Container, Typography } from '@mui/material';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const ActiveExams = () => {
  return (
    <Box sx={{ display: 'flex', bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 } }}>
          <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 700, mb: 2 }}>
            Active Exams
          </Typography>
          <Typography variant="body1" sx={{ color: '#666' }}>
            Basic JSX initially - View your generated exams here.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default ActiveExams;
