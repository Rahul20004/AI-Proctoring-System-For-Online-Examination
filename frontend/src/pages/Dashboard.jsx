import { Container, Typography, Box, Paper, Grid } from '@mui/material';
import { useGetExamsQuery } from '../slices/examApiSlice';
import { useGetMyResultsQuery } from '../slices/resultApiSlice';

const Dashboard = () => {
  const { data: exams = [] } = useGetExamsQuery();
  const { data: myResults = [] } = useGetMyResultsQuery();

  const totalExams = exams.length;
  const completedExams = myResults.length;
  const pendingExams = Math.max(totalExams - completedExams, 0);

  const averageScore = completedExams > 0 
    ? (myResults.reduce((acc, curr) => acc + curr.score, 0) / completedExams).toFixed(1) 
    : 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 } }}>
      <Box mb={4}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 800, mb: 1 }}>
          Student Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: '#666', fontWeight: 500 }}>
          Overview of your performance and pending tasks
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 4, bgcolor: '#ffffff', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ color: '#666', fontWeight: 600 }}>Total Exams</Typography>
            <Typography variant="h3" sx={{ color: '#6c63ff', fontWeight: 'bold', mt: 1 }}>{totalExams}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 4, bgcolor: '#ffffff', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ color: '#666', fontWeight: 600 }}>Completed</Typography>
            <Typography variant="h3" sx={{ color: '#2ecc71', fontWeight: 'bold', mt: 1 }}>{completedExams}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 4, bgcolor: '#ffffff', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ color: '#666', fontWeight: 600 }}>Pending</Typography>
            <Typography variant="h3" sx={{ color: '#e74c3c', fontWeight: 'bold', mt: 1 }}>{pendingExams}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 4, bgcolor: '#ffffff', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ color: '#666', fontWeight: 600 }}>Avg Score</Typography>
            <Typography variant="h3" sx={{ color: '#f39c12', fontWeight: 'bold', mt: 1 }}>{averageScore}</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
