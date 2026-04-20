import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ExamTable = ({ exams, resultsData }) => {
  const navigate = useNavigate();

  return (
    <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e0e0e0', bgcolor: '#ffffff' }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead sx={{ bgcolor: '#f8f9fa' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, color: '#333' }}>Sno</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#333' }}>Exam Name</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#333' }}>Total Questions</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#333' }}>Duration</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#333' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#333', textAlign: 'center' }}>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {exams.map((exam, index) => {
            // Optional basic completion tie-in check if provided
            const isCompleted = resultsData ? resultsData.some(res => res.exam?._id === exam._id) : false;

            return (
              <TableRow 
                key={exam._id}
                sx={{ 
                  '&:hover': { bgcolor: '#f9fafb' }, 
                  transition: 'all 0.2s ease', 
                  '&:last-child td, &:last-child th': { border: 0 } 
                }}
              >
                <TableCell sx={{ color: '#555', fontWeight: 600 }}>{index + 1}</TableCell>
                <TableCell sx={{ color: '#333', fontWeight: 600 }}>{exam.title}</TableCell>
                <TableCell sx={{ color: '#555', fontWeight: 500 }}>{exam.questions?.length || 0}</TableCell>
                <TableCell sx={{ color: '#555', fontWeight: 500 }}>{exam.duration} mins</TableCell>
                <TableCell>
                  <Chip 
                    label={isCompleted ? "Completed" : "Available"} 
                    size="small" 
                    sx={{ 
                      bgcolor: isCompleted ? '#e8f5e9' : '#e3f2fd', 
                      color: isCompleted ? '#2e7d32' : '#1565c0', 
                      fontWeight: 700,
                      borderRadius: '6px'
                    }} 
                  />
                </TableCell>
                <TableCell align="center">
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => navigate(`/verify-face`, { state: { examId: exam._id } })}
                    disabled={isCompleted}
                    sx={{ 
                      borderRadius: '6px', 
                      textTransform: 'none', 
                      fontWeight: 600,
                      px: 3,
                      bgcolor: isCompleted ? '#bdbdbd' : '#4f46e5',
                      '&:hover': { bgcolor: isCompleted ? '#bdbdbd' : '#4338ca' },
                      boxShadow: 'none'
                    }}
                  >
                    Start Exam
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ExamTable;
