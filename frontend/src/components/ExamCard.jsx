import { Card, CardMedia, CardContent, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ExamCard = ({ exam }) => {
  const navigate = useNavigate();

  return (
    <Card sx={{ 
      borderRadius: '16px', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      transition: 'transform 0.3s ease',
      bgcolor: '#ffffff',
      '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }
    }}>
      <CardMedia
        component="img"
        height="140"
        image="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80"
        alt="Exam Background"
      />
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 700, mb: 1 }} noWrap>
          {exam.title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mb: 2, minHeight: '40px' }} 
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {exam.description || 'No description provided by the instructor.'}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ color: '#999' }}>Type</Typography>
          <Typography variant="body2" sx={{ color: '#2c3e50', fontWeight: 600 }}>MCQ</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ color: '#999' }}>Duration</Typography>
          <Typography variant="body2" sx={{ color: '#2c3e50', fontWeight: 600 }}>{exam.duration} mins</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#999' }}>Questions</Typography>
          <Typography variant="body2" sx={{ color: '#2c3e50', fontWeight: 600 }}>{exam.questions?.length || 0}</Typography>
        </Box>

        <Button 
          variant="contained" 
          fullWidth 
          onClick={() => navigate(`/verify-face`, { state: { examId: exam._id } })}
          sx={{ 
            py: 1.5, borderRadius: '10px', textTransform: 'none', fontSize: '1rem', fontWeight: 600,
            background: 'linear-gradient(135deg, #6c63ff, #7f53ac)',
            '&:hover': { background: 'linear-gradient(135deg, #5b54e5, #6a459b)', transform: 'translateY(-2px)' },
            transition: 'all 0.3s ease'
          }}
        >
          Attempt Exam
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExamCard;
