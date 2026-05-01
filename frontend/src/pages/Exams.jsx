import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Container, Typography, Box, Paper, CircularProgress, TextField, MenuItem, Select, FormControl, InputLabel, InputAdornment, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useGetExamsQuery } from '../slices/examApiSlice';
import { useGetMyResultsQuery } from '../slices/resultApiSlice';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import ExamTable from '../components/ExamTable';
import QuestionsPreviewModal from '../components/QuestionsPreviewModal';

const Exams = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const theme = useTheme();
  // We specify polling interval if we want dynamic updates, but let RTK naturally refetch on mount.
  const { data: exams, isLoading, error, refetch } = useGetExamsQuery(undefined, { refetchOnMountOrArgChange: true });
  const { data: myResults } = useGetMyResultsQuery(undefined, { refetchOnMountOrArgChange: true });

  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');

  const [selectedResult, setSelectedResult] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenModal = (examId) => {
    const result = myResults?.find(r => r.exam?._id === examId);
    if (result) {
      setSelectedResult(result);
      setModalOpen(true);
    }
  };

  useEffect(() => {
    // If the data was wiped by the memory server, it helps to refetch
    refetch();
    if (userInfo?.role === 'teacher') {
      navigate('/teacher');
    }
  }, [userInfo, navigate, refetch, exams]);

  // Handle generic search and subject filter dynamically
  const filteredExams = exams ? exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchedSubject = subjectFilter === 'All' || exam.title.toLowerCase().includes(subjectFilter.toLowerCase());
    return matchesSearch && matchedSubject;
  }) : [];

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 } }}>
          <Box mb={4}>
            <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 800, mb: 1 }}>
              Exams
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', fontWeight: 500 }}>
              View and take your available exams
            </Typography>
          </Box>

          {/* Filter Bar */}
          <Paper sx={{ 
            p: '16px', 
            mb: 4, 
            borderRadius: '12px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
            display: 'flex', 
            gap: 3, 
            flexWrap: 'wrap', 
            alignItems: 'center', 
            bgcolor: '#ffffff',
            border: '1px solid #eee'
          }}>
             <TextField 
                size="small" 
                placeholder="Search exams by name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ 
                  flex: 1, 
                  minWidth: '250px', 
                  bgcolor: '#f9fafb',
                  borderRadius: '8px',
                  input: { color: "#333" },
                  '& .MuiInputBase-input::placeholder': { color: "#999", opacity: 1 },
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: '8px',
                    '& fieldset': { borderColor: "#ddd" },
                    '&:hover fieldset': { borderColor: "#6c63ff" },
                    '&.Mui-focused fieldset': { borderColor: "#6c63ff" }
                  } 
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#6c757d' }} /></InputAdornment>,
                }}
             />
             <FormControl size="small" sx={{ 
               minWidth: 200,
               bgcolor: '#ffffff',
               borderRadius: '8px',
               '& .MuiInputLabel-root': { color: '#666' },
               '& .MuiOutlinedInput-root': {
                 '& fieldset': { borderColor: "#ddd" },
                 '&:hover fieldset': { borderColor: "#6c63ff" },
                 '&.Mui-focused fieldset': { borderColor: "#6c63ff" }
               },
               '& .MuiSelect-select': { color: '#333' }
             }}>
               <InputLabel>Category</InputLabel>
               <Select
                 value={subjectFilter}
                 label="Category"
                 onChange={(e) => setSubjectFilter(e.target.value)}
                 sx={{ borderRadius: '8px' }}
               >
                 <MenuItem value="All">All Categories</MenuItem>
                 <MenuItem value="Computer Science">Computer Science</MenuItem>
                 <MenuItem value="Mathematics">Mathematics</MenuItem>
                 <MenuItem value="Aptitude">Aptitude</MenuItem>
                 <MenuItem value="JavaScript">JavaScript</MenuItem>
               </Select>
             </FormControl>
          </Paper>

          <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 700, mb: 3 }}>My Exams</Typography>

          {isLoading ? (
            <Box display="flex" justifyContent="center" mt={5}>
              <CircularProgress sx={{ color: '#6c63ff' }} />
            </Box>
          ) : error ? (
            <Typography color="error" mt={3} fontWeight={600}>Failed to load exams automatically. (Server may have restarted).</Typography>
          ) : filteredExams.length > 0 ? (
             <ExamTable exams={filteredExams} resultsData={myResults} onRowClick={handleOpenModal} />
          ) : (
             <Paper sx={{ p: 5, borderRadius: '16px', textAlign: 'center', bgcolor: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mt: 3, border: '1px dashed #e0e0e0' }}>
               <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                 No exams match your criteria. 
               </Typography>
               <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                 Clear your filters or check back later when an instructor publishes a new exam.
               </Typography>
             </Paper>
          )}

        </Container>
      {/* Modal */}
      {selectedResult && (
        <QuestionsPreviewModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          result={selectedResult}
        />
      )}
    </>
  );
};

export default Exams;
