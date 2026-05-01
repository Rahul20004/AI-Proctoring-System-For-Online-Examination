import { useState } from 'react';
import { Container, Typography, Box, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, CircularProgress } from '@mui/material';
import { useGetMyResultsQuery } from '../slices/resultApiSlice';
import QuestionsPreviewModal from '../components/QuestionsPreviewModal';

const Results = () => {
  const { data: myResults = [], isLoading, error } = useGetMyResultsQuery();
  const [selectedResult, setSelectedResult] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenModal = (result) => {
    setSelectedResult(result);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress sx={{ color: '#6c63ff' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography color="error">Failed to load results.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 } }}>
      <Box mb={4}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 800, mb: 1 }}>
          My Results
        </Typography>
        <Typography variant="body1" sx={{ color: '#666', fontWeight: 500 }}>
          View your past exam performance
        </Typography>
      </Box>

      {myResults.length > 0 ? (
        <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 'bold', color: '#2c3e50' }}>Exam Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#2c3e50' }}>Score</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#2ecc71' }}>Correct</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#e74c3c' }}>Incorrect</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#f39c12' }}>Not Attempted</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myResults.map((result) => {
                const totalQuestions = result.exam?.questions?.length || 0;
                // Basic estimation if correct/incorrect aren't available in result schema
                const correctCount = result.score; // Assuming 1 point per correct answer
                const attemptedCount = result.answers ? result.answers.length : 0;
                const notAttempted = totalQuestions - attemptedCount;
                const incorrectCount = attemptedCount - correctCount;

                return (
                  <TableRow 
                    key={result._id} 
                    sx={{ 
                      bgcolor: '#ffffff',
                      '&:hover': { bgcolor: '#f5f7fb' },
                      transition: 'all 0.2s ease',
                      borderBottom: '1px solid #eee'
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500, color: '#333' }}>{result.exam?.title || 'Unknown Exam'}</TableCell>
                    <TableCell sx={{ color: '#333', fontWeight: 500 }}>{result.score}</TableCell>
                    <TableCell align="center" sx={{ color: '#2ecc71', fontWeight: 600 }}>{correctCount}</TableCell>
                    <TableCell align="center" sx={{ color: '#e74c3c', fontWeight: 600 }}>{incorrectCount > 0 ? incorrectCount : 0}</TableCell>
                    <TableCell align="center" sx={{ color: '#f39c12', fontWeight: 600 }}>{notAttempted > 0 ? notAttempted : 0}</TableCell>
                    <TableCell align="center">
                      <Button 
                        variant="outlined" 
                        size="small" 
                        sx={{ 
                          borderColor: '#6c63ff', 
                          color: '#6c63ff', 
                          textTransform: 'none', 
                          borderRadius: '8px',
                          '&:hover': { bgcolor: '#6c63ff', color: '#ffffff' }
                        }}
                        onClick={() => handleOpenModal(result)}
                      >
                        Detailed Report
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 5, borderRadius: '16px', textAlign: 'center', bgcolor: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mt: 3, border: '1px dashed #e0e0e0' }}>
          <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600 }}>
            No results found.
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
            You haven't completed any exams yet.
          </Typography>
        </Paper>
      )}

      {selectedResult && (
        <QuestionsPreviewModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          result={selectedResult}
        />
      )}
    </Container>
  );
};

export default Results;
