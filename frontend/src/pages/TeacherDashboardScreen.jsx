import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useCreateExamMutation, useGenerateQuestionsMutation, useGetExamsQuery } from '../slices/examApiSlice';
import { useGetTeacherResultsQuery } from '../slices/resultApiSlice';
import {
  Container, Typography, Box, Paper, TextField, Button, CircularProgress,
  Grid, Card, CardMedia, CardContent, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, FormControl, InputLabel, Select, MenuItem, Tooltip,
} from '@mui/material';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import StudentDetailModal from '../components/StudentDetailModal';

const inputSx = {
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  '& input:-webkit-autofill': {
    WebkitBoxShadow: '0 0 0px 1000px #ffffff inset !important',
    WebkitTextFillColor: '#111827 !important',
  },
  '& .MuiInputBase-input': {
    color: '#111827',
    '&::placeholder': { color: '#9ca3af', opacity: 1 },
  },
  '& .MuiInputLabel-root': { color: '#666' },
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
    '& fieldset': { borderColor: '#e5e7eb', transition: 'all 0.2s ease' },
    '&:hover fieldset': { borderColor: '#cbd5f5' },
    '&.Mui-focused fieldset': { 
      borderColor: '#7c3aed', 
      borderWidth: '2px', 
      boxShadow: '0 0 0 2px rgba(124, 58, 237, 0.15)' 
    }
  },
  '& .MuiSelect-select': { color: '#111827' }
};

const TeacherDashboardScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { data: exams, isLoading: loadingExams, refetch: refetchExams } = useGetExamsQuery(undefined, { refetchOnMountOrArgChange: true });
  const { data: results, isLoading: loadingResults, refetch: refetchResults } = useGetTeacherResultsQuery(userInfo?._id, { refetchOnMountOrArgChange: true });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  const [generateQuestions, { isLoading: isGenerating }] = useGenerateQuestionsMutation();
  const [createExam, { isLoading: isCreating }] = useCreateExamMutation();

  // ── Student Detail Modal state ──────────────────────────────────────────
  const [selectedResult, setSelectedResult] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openStudentModal = (result) => {
    setSelectedResult(result);
    setModalOpen(true);
  };

  useEffect(() => {
    refetchExams();
    refetchResults();
  }, [refetchExams, refetchResults]);

  const handleGenerate = async () => {
    try {
      const res = await generateQuestions({ topic, difficulty, count: numQuestions }).unwrap();
      setGeneratedQuestions(res.questions);
    } catch (err) {
      console.error('Failed to generate questions', err);
      alert(err?.data?.message || 'Failed to generate questions from AI. See console.');
    }
  };

  const handleCreateExam = async () => {
    try {
      await createExam({
        title,
        description,
        duration: Number(duration),
        questions: generatedQuestions,
      }).unwrap();
      alert('Exam created successfully!');
      setTitle(''); setDescription(''); setDuration(''); setGeneratedQuestions([]);
      refetchExams();
    } catch (err) {
      console.error('Failed to create exam', err);
    }
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 } }}>

          {/* ── 1. Manage Exams ── */}
          <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 700, mb: 3 }}>1. Manage Exams</Typography>
          <Grid container spacing={4} sx={{ mb: 5 }}>
            {/* AI Generator */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: '#ffffff' }}>
                <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600, mb: 3 }}>AI Question Generator</Typography>
                <TextField fullWidth label="Topic (e.g. JavaScript Arrays)" margin="normal" value={topic} onChange={(e) => setTopic(e.target.value)}
                  sx={inputSx} />

                <FormControl fullWidth margin="normal" sx={inputSx}>
                  <InputLabel id="difficulty-label">Difficulty</InputLabel>
                  <Select labelId="difficulty-label" value={difficulty} label="Difficulty" onChange={(e) => setDifficulty(e.target.value)} sx={{ borderRadius: '10px' }}>
                    <MenuItem value="Easy">Easy</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Hard">Hard</MenuItem>
                  </Select>
                </FormControl>

                <TextField fullWidth label="Number of Questions" type="number" margin="normal" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)}
                  sx={inputSx} />

                <Button variant="contained" fullWidth sx={{ mt: 3, py: 1.5, borderRadius: '10px', textTransform: 'none', fontSize: '1rem', fontWeight: 600, color: '#ffffff', background: 'linear-gradient(135deg, #6c63ff, #7f53ac)', '&:hover': { background: 'linear-gradient(135deg, #5b54e5, #6a459b)', transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(108,99,255,0.4)' }, transition: 'all 0.3s ease' }} onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Generate Questions'}
                </Button>
              </Paper>
            </Grid>

            {/* Exam Creation */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: '#ffffff' }}>
                <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600, mb: 3 }}>Create Exam</Typography>
                <TextField fullWidth label="Exam Title" margin="normal" value={title} onChange={(e) => setTitle(e.target.value)}
                  sx={inputSx} />
                <TextField fullWidth label="Description" margin="normal" value={description} onChange={(e) => setDescription(e.target.value)}
                  sx={inputSx} />
                <TextField fullWidth label="Duration (minutes)" type="number" margin="normal" value={duration} onChange={(e) => setDuration(e.target.value)}
                  sx={inputSx} />
                <Typography variant="body2" mt={2} sx={{ color: '#666', fontWeight: 500 }}>
                  Questions prepared: {generatedQuestions.length}
                </Typography>
                <Button variant="contained" fullWidth sx={{ mt: 3, py: 1.5, borderRadius: '10px', textTransform: 'none', fontSize: '1rem', fontWeight: 600, color: '#ffffff', background: 'linear-gradient(135deg, #6c63ff, #7f53ac)', '&:hover': { background: 'linear-gradient(135deg, #5b54e5, #6a459b)', transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(108,99,255,0.4)' }, transition: 'all 0.3s ease' }} onClick={handleCreateExam} disabled={isCreating || generatedQuestions.length === 0}>
                  {isCreating ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Save Exam'}
                </Button>
              </Paper>
            </Grid>
          </Grid>

          {/* ── 2. Active Exams ── */}
          <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 700, mb: 3 }}>2. Active Exams</Typography>
          {loadingExams ? <CircularProgress sx={{ color: '#6c63ff' }} /> : (
            <>
              {(!exams || exams.filter(e => e.teacher?._id === userInfo?._id).length === 0) ? (
                <Paper sx={{ p: 5, borderRadius: '16px', textAlign: 'center', bgcolor: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 5 }}>
                  <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600 }}>No exams created yet.</Typography>
                  <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>Use the AI generator and create form above to build one.</Typography>
                </Paper>
              ) : (
                <Grid container spacing={3} sx={{ mb: 5 }}>
                  {exams?.filter(e => e.teacher?._id === userInfo?._id).map(exam => (
                    <Grid item xs={12} sm={6} md={4} key={exam._id}>
                      <Card sx={{ bgcolor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', transition: 'transform 0.3s ease', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' } }}>
                        <CardMedia component="img" height="140" image="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80" alt="Exam Background" />
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600, mb: 1 }}>{exam.title}</Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ color: '#666' }}>Type</Typography>
                            <Typography variant="body2" sx={{ color: '#333', fontWeight: 500 }}>MCQ</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ color: '#666' }}>Questions</Typography>
                            <Typography variant="body2" sx={{ color: '#333', fontWeight: 500 }}>{exam.questions?.length || 0}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ color: '#666' }}>Duration</Typography>
                            <Typography variant="body2" sx={{ color: '#333', fontWeight: 500 }}>{exam.duration} minutes</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}

          {/* ── 3. Student Final Reports ── */}
          <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 700, mb: 3 }}>3. Student Final Reports</Typography>
          {loadingResults ? <CircularProgress sx={{ color: '#6c63ff' }} /> : (
            <>
              {(!results || results.length === 0) ? (
                <Paper sx={{ p: 5, borderRadius: '16px', textAlign: 'center', bgcolor: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 5 }}>
                  <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600 }}>No student reports available.</Typography>
                  <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>Results will appear here after exams are completed.</Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 5, overflow: 'hidden' }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>Student Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>Exam Title</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>Score</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>AI Summary</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>Time</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>Click to Review</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results?.map((res, index) => {
                        const totalTime = res.timeSpentPerQuestion?.reduce((acc, curr) => acc + curr.timeSpent, 0) || 0;
                        return (
                          <Tooltip key={res._id} title="Click to view detailed report" placement="top" arrow>
                            <TableRow
                              onClick={() => openStudentModal(res)}
                              sx={{
                                bgcolor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                                cursor: 'pointer',
                                transition: '0.15s',
                                '&:hover': { bgcolor: '#f0eeff' },
                              }}
                            >
                              <TableCell sx={{ color: '#1a1a2e', fontWeight: 600, fontSize: '0.85rem' }}>{res.student?.name || 'Unknown'}</TableCell>
                              <TableCell sx={{ color: '#555', fontSize: '0.83rem' }}>{res.exam?.title || 'Unknown'}</TableCell>
                              <TableCell sx={{ color: '#1a1a2e', fontWeight: 700, fontSize: '0.83rem' }}>{res.score} / {res.totalQuestions}</TableCell>
                              <TableCell sx={{ color: res.reportSummary?.includes('0') ? '#2e7d32' : '#d32f2f', fontWeight: 500, fontSize: '0.8rem' }}>
                                {res.reportSummary}
                              </TableCell>
                              <TableCell sx={{ color: '#555', fontSize: '0.8rem' }}>{Math.floor(totalTime / 60)}m {totalTime % 60}s</TableCell>
                              <TableCell sx={{ color: '#6c63ff', fontWeight: 800, fontSize: '1rem' }}>›</TableCell>
                            </TableRow>
                          </Tooltip>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

        </Container>
      </Box>

      {/* ── Student Detail Modal ── */}
      {selectedResult && (
        <StudentDetailModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          result={selectedResult}
        />
      )}
    </Box>
  );
};

export default TeacherDashboardScreen;
