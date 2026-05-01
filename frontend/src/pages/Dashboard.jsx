import { Container, Typography, Box, Paper, Grid, Card, CardContent, CardActions, Button, Divider, List, ListItem, ListItemIcon, ListItemText, Chip } from '@mui/material';
import { useGetExamsQuery } from '../slices/examApiSlice';
import { useGetMyResultsQuery } from '../slices/resultApiSlice';
import { useNavigate } from 'react-router-dom';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';

const Dashboard = () => {
  const { data: exams = [] } = useGetExamsQuery();
  const { data: myResults = [] } = useGetMyResultsQuery();
  const navigate = useNavigate();

  const totalExams = exams.length;
  const completedExams = myResults.length;
  const pendingExams = Math.max(totalExams - completedExams, 0);

  const totalScore = myResults.reduce((acc, curr) => acc + curr.score, 0);
  const totalPossible = myResults.reduce((acc, curr) => acc + (curr.exam?.questions?.length || curr.totalQuestions || 0), 0);
  
  let avgScoreStr = '0%';
  if (completedExams > 0 && totalPossible > 0) {
    const avgPct = ((totalScore / totalPossible) * 100).toFixed(0);
    const scoreClean = Number.isInteger(totalScore / completedExams) ? (totalScore / completedExams) : (totalScore / completedExams).toFixed(1);
    const possibleClean = Number.isInteger(totalPossible / completedExams) ? (totalPossible / completedExams) : (totalPossible / completedExams).toFixed(1);
    avgScoreStr = `${scoreClean} / ${possibleClean} (${avgPct}%)`;
  } else if (completedExams > 0 && totalPossible === 0) {
    avgScoreStr = '0%';
  }

  // Extract recent result and pending available exams
  const recentResult = myResults.length > 0 ? [...myResults].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] : null;
  const availableExams = exams.filter(e => !myResults.some(r => r.exam?._id === e._id)).slice(0, 4);

  const cardStyle = { 
    p: 3, 
    bgcolor: '#ffffff', 
    borderRadius: '16px', 
    textAlign: 'center', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)', 
    border: '1px solid #f1f3f6',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease', 
    '&:hover': { 
      transform: 'translateY(-5px)', 
      boxShadow: '0 8px 25px rgba(0,0,0,0.1)' 
    } 
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6, px: { xs: 2, md: 4 } }}>
      <Box mb={4}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 800, mb: 1 }}>
          Student Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: '#666', fontWeight: 500 }}>
          Overview of your performance and pending tasks
        </Typography>
      </Box>

      {/* ── STATS CARDS ── */}
      <Grid container spacing={3} mb={5}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={cardStyle}>
            <Typography variant="h6" sx={{ color: '#666', fontWeight: 600 }}>Total Exams</Typography>
            <Typography variant="h3" sx={{ color: '#6c63ff', fontWeight: 'bold', mt: 1 }}>{totalExams}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={cardStyle}>
            <Typography variant="h6" sx={{ color: '#666', fontWeight: 600 }}>Completed</Typography>
            <Typography variant="h3" sx={{ color: '#2ecc71', fontWeight: 'bold', mt: 1 }}>{completedExams}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={cardStyle}>
            <Typography variant="h6" sx={{ color: '#666', fontWeight: 600 }}>Pending</Typography>
            <Typography variant="h3" sx={{ color: '#e74c3c', fontWeight: 'bold', mt: 1 }}>{pendingExams}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={cardStyle}>
            <Typography variant="h6" sx={{ color: '#666', fontWeight: 600 }}>Avg Score</Typography>
            <Typography variant="h4" sx={{ color: '#f39c12', fontWeight: 'bold', mt: 1 }}>{avgScoreStr}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* ── LEFT COLUMN: Available Exams (2fr via md=8) ── */}
        <Grid item xs={12} md={8}>
          <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 700, mb: 3 }}>Available Exams</Typography>
          <Grid container spacing={3}>
            {availableExams.length > 0 ? availableExams.map(exam => (
              <Grid item xs={12} sm={6} key={exam._id}>
                <Card sx={{ 
                  borderRadius: '16px', 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)', 
                  border: '1px solid #f1f3f6', 
                  transition: 'all 0.2s ease', 
                  bgcolor: '#ffffff',
                  '&:hover': { borderColor: '#6c63ff', transform: 'translateY(-3px)' } 
                }}>
                  <CardContent sx={{ pb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" color="#333" mb={1} noWrap>{exam.title}</Typography>
                    <Box display="flex" justifyContent="space-between" mt={2}>
                      <Typography variant="body2" color="#666" sx={{ bgcolor: '#f8f9fa', px: 1.5, py: 0.5, borderRadius: '6px' }}>
                        ⏳ {exam.duration} mins
                      </Typography>
                      <Typography variant="body2" color="#666" sx={{ bgcolor: '#f8f9fa', px: 1.5, py: 0.5, borderRadius: '6px' }}>
                        📝 {exam.questions?.length || 0} Qs
                      </Typography>
                    </Box>
                  </CardContent>
                  <Divider sx={{ borderColor: '#f1f3f6' }} />
                  <CardActions sx={{ p: 2 }}>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      startIcon={<PlayArrowIcon />}
                      onClick={() => navigate(`/verify-face`, { state: { examId: exam._id } })}
                      sx={{ 
                        background: 'linear-gradient(135deg, #6c63ff, #7f53ac)', 
                        color: '#fff', 
                        borderRadius: '8px', 
                        textTransform: 'none', 
                        fontWeight: 600,
                        boxShadow: 'none',
                        '&:hover': { background: 'linear-gradient(135deg, #574ae8, #6b4494)', boxShadow: '0 4px 12px rgba(108,99,255,0.3)' } 
                      }}
                    >
                      Start Exam
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 5, borderRadius: '16px', textAlign: 'center', bgcolor: '#ffffff', border: '1px dashed #d1d5db', boxShadow: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <SentimentSatisfiedAltIcon sx={{ fontSize: 48, color: '#9ca3af', mb: 2 }} />
                  <Typography variant="h6" color="#374151" fontWeight={600}>No pending exams</Typography>
                  <Typography variant="body2" color="#6b7280" mt={1}>You're all caught up! Check back later for new assignments. 🎉</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Grid>

        {/* ── RIGHT COLUMN: Recent Activity & Quick Actions (1fr via md=4) ── */}
        <Grid item xs={12} md={4}>
          <Box mb={4}>
            <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 700, mb: 3 }}>Recent Activity</Typography>
            <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f1f3f6', bgcolor: '#ffffff' }}>
              {recentResult ? (
                <>
                  <Typography variant="subtitle1" fontWeight="bold" color="#333" mb={2}>{recentResult.exam?.title || 'Unknown Exam'}</Typography>
                  <Box display="flex" justifyContent="space-between" mb={2} alignItems="center">
                    <Typography variant="body2" color="#666" fontWeight="500">Score achieved:</Typography>
                    <Chip 
                      label={`${recentResult.score} / ${recentResult.exam?.questions?.length || recentResult.totalQuestions || 0}`} 
                      sx={{ bgcolor: '#e8f5e9', color: '#2ecc71', fontWeight: 800, borderRadius: '6px' }} 
                      size="small"
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="#666" fontWeight="500">Time Taken:</Typography>
                    <Chip 
                      label={recentResult.timeSpentPerQuestion ? 
                        `${Math.floor(recentResult.timeSpentPerQuestion.reduce((acc, curr) => acc + curr.timeSpent, 0) / 60)}m ${recentResult.timeSpentPerQuestion.reduce((acc, curr) => acc + curr.timeSpent, 0) % 60}s` 
                        : 'N/A'}
                      sx={{ bgcolor: '#f8f9fa', color: '#333', fontWeight: 600, borderRadius: '6px' }} 
                      size="small"
                    />
                  </Box>
                </>
              ) : (
                <Typography variant="body2" color="#666" textAlign="center" py={2}>No recent activity found.</Typography>
              )}
            </Paper>
          </Box>

          <Box>
            <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 700, mb: 3 }}>Quick Actions</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button 
                  fullWidth 
                  variant="contained" 
                  startIcon={<AssignmentIcon />}
                  onClick={() => navigate('/exams')}
                  sx={{ 
                    justifyContent: 'flex-start',
                    px: 3, py: 1.5,
                    background: 'linear-gradient(135deg, #6c63ff, #7f53ac)',
                    color: '#fff', 
                    borderRadius: '12px', 
                    textTransform: 'none', 
                    fontWeight: 600,
                    boxShadow: '0 4px 15px rgba(108,99,255,0.2)',
                    '&:hover': { background: 'linear-gradient(135deg, #574ae8, #6b4494)', boxShadow: '0 6px 20px rgba(108,99,255,0.3)', transform: 'translateY(-2px)' },
                    transition: 'all 0.2s ease'
                  }}
                >
                  View All Exams
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  startIcon={<AssessmentIcon />}
                  onClick={() => navigate('/results')}
                  sx={{ 
                    justifyContent: 'flex-start',
                    px: 3, py: 1.5,
                    borderColor: '#2ecc71',
                    color: '#2ecc71', 
                    bgcolor: '#ffffff',
                    borderRadius: '12px', 
                    textTransform: 'none', 
                    fontWeight: 600,
                    borderWidth: '2px',
                    '&:hover': { bgcolor: '#2ecc71', color: '#ffffff', borderColor: '#2ecc71', transform: 'translateY(-2px)' },
                    transition: 'all 0.2s ease'
                  }}
                >
                  View My Results
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
