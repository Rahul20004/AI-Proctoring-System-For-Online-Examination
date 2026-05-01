import { useState } from 'react';
import {
  Box, Container, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Button, CircularProgress,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import QuestionsPreviewModal from '../components/QuestionsPreviewModal';
import { useGetMyResultsQuery } from '../slices/resultApiSlice';

// ── helpers ────────────────────────────────────────────────────────────────
const pct = (score, total) =>
  total > 0 ? Math.round((score / total) * 100) : 0;

const gradeColor = (p) =>
  p >= 75 ? '#2e7d32' : p >= 50 ? '#e65100' : '#c62828';

const gradeBg = (p) =>
  p >= 75 ? '#e8f5e9' : p >= 50 ? '#fff8e1' : '#ffebee';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── component ──────────────────────────────────────────────────────────────
const StudentReports = () => {
  const { data: results, isLoading, error } = useGetMyResultsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  const openModal = (result) => {
    setSelectedResult(result);
    setModalOpen(true);
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 } }}>

          {/* ── Page Title ── */}
          <Box mb={4}>
            <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 800, mb: 0.5 }}>
              My Exam Reports
            </Typography>
            <Typography variant="body2" sx={{ color: '#888' }}>
              Review your submitted exams and inspect each question's answer.
            </Typography>
          </Box>

          {/* ── States ── */}
          {isLoading && (
            <Box display="flex" justifyContent="center" mt={8}>
              <CircularProgress sx={{ color: '#6c63ff' }} />
            </Box>
          )}

          {error && (
            <Typography color="error" mt={3} fontWeight={600}>
              Failed to load results. Please refresh or restart the server.
            </Typography>
          )}

          {/* ── Results Table ── */}
          {!isLoading && !error && results && (
            results.length === 0 ? (
              <Paper
                sx={{
                  p: 5, borderRadius: '16px', textAlign: 'center',
                  bgcolor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  border: '1px dashed #e0e0e0',
                }}
              >
                <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                  No results yet.
                </Typography>
                <Typography variant="body2" sx={{ color: '#888', mt: 1 }}>
                  Complete an exam to see your report here.
                </Typography>
              </Paper>
            ) : (
              <TableContainer
                component={Paper}
                sx={{
                  borderRadius: '14px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                  border: '1px solid #ebebeb',
                  overflow: 'hidden',
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#1a1a2e' }}>
                      {['#', 'Exam', 'Score', 'Total Qs', 'Percentage', 'Warnings', 'Date', 'Review'].map((h) => (
                        <TableCell
                          key={h}
                          sx={{
                            color: '#fff', fontWeight: 700,
                            fontSize: '0.8rem', py: 1.5,
                            borderBottom: 'none',
                          }}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {results.map((r, i) => {
                      const p = pct(r.score, r.totalQuestions);
                      return (
                        <TableRow
                          key={r._id}
                          sx={{
                            bgcolor: i % 2 === 0 ? '#fff' : '#fafafa',
                            '&:hover': { bgcolor: '#f0f0ff' },
                            transition: 'background 0.15s',
                          }}
                        >
                          <TableCell sx={{ color: '#888', fontSize: '0.8rem' }}>{i + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.85rem' }}>
                            {r.exam?.title ?? '—'}
                          </TableCell>
                          <TableCell sx={{ color: '#333', fontSize: '0.83rem' }}>
                            {r.score} / {r.totalQuestions}
                          </TableCell>
                          <TableCell sx={{ color: '#555', fontSize: '0.83rem' }}>
                            {r.totalQuestions}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${p}%`}
                              size="small"
                              sx={{
                                bgcolor: gradeBg(p),
                                color: gradeColor(p),
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                height: 22,
                                border: `1px solid ${gradeColor(p)}33`,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={r.cheatLogs?.length ?? 0}
                              size="small"
                              sx={{
                                bgcolor: r.cheatLogs?.length > 0 ? '#ffebee' : '#e8f5e9',
                                color: r.cheatLogs?.length > 0 ? '#c62828' : '#2e7d32',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                height: 22,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: '#666', fontSize: '0.8rem' }}>
                            {fmtDate(r.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                              onClick={() => openModal(r)}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                color: '#6c63ff',
                                bgcolor: '#f0eeff',
                                borderRadius: '8px',
                                px: 1.5,
                                py: 0.5,
                                '&:hover': { bgcolor: '#e0d8ff' },
                              }}
                            >
                              Preview
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}
        </Container>
      </Box>

      {/* ── Questions Preview Modal ── */}
      {selectedResult && (
        <QuestionsPreviewModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          result={selectedResult}
        />
      )}
    </Box>
  );
};

export default StudentReports;
