import { useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, Chip, Divider, Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

const getStatus = (question, selectedOption) => {
  if (!selectedOption) return 'notAttempted';
  const correctText = question.options[question.correctOption];
  return selectedOption === correctText ? 'correct' : 'incorrect';
};

const STATUS_CONFIG = {
  correct: { label: 'CORRECT', color: '#16a34a' },
  incorrect: { label: 'INCORRECT', color: '#dc2626' },
  notAttempted: { label: 'NOT ATTEMPTED', color: '#f59e0b' },
};

const QuestionsPreviewModal = ({ open, onClose, result }) => {
  const { exam, selectedAnswers } = result || {};
  const questions = exam?.questions || [];

  const answersMap = useMemo(() => {
    if (!selectedAnswers) return {};
    if (selectedAnswers instanceof Map) return Object.fromEntries(selectedAnswers);
    return selectedAnswers;
  }, [selectedAnswers]);

  const stats = useMemo(() => {
    let correct = 0, incorrect = 0, notAttempted = 0;
    questions.forEach((q, idx) => {
      const status = getStatus(q, answersMap[String(idx)]);
      if (status === 'correct') correct++;
      else if (status === 'incorrect') incorrect++;
      else notAttempted++;
    });
    return { correct, incorrect, notAttempted, total: questions.length };
  }, [questions, answersMap]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
          bgcolor: '#ffffff',
          maxHeight: '85vh',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', p: 3 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '1.25rem', color: '#111827' }}>
          Questions Preview
        </Typography>
        <CloseIcon onClick={onClose} sx={{ cursor: 'pointer', color: '#6b7280' }} />
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#ffffff' }}>
        <Stack direction="row" spacing={1} mb={4}>
          <Chip label={`Total: ${stats.total}`} size="small" sx={{ bgcolor: '#f3f4f6', color: '#374151', fontWeight: 600 }} />
          <Chip label={`Correct: ${stats.correct}`} size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 600 }} />
          <Chip label={`Not Attempted: ${stats.notAttempted}`} size="small" sx={{ bgcolor: '#fef3c7', color: '#f59e0b', fontWeight: 600 }} />
          <Chip label={`Incorrect: ${stats.incorrect}`} size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 600 }} />
        </Stack>

        <Box>
          {questions.map((q, idx) => {
            const selected = answersMap[String(idx)];
            const status = getStatus(q, selected);
            const selectedLetter = selected ? LETTERS[q.options.indexOf(selected)] : 'None';
            const statusColor = STATUS_CONFIG[status].color;

            return (
              <Box key={idx} sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 500, color: '#111827', mb: 2 }}>
                  Q{idx + 1}. {q.questionText}
                </Typography>

                <Box sx={{ ml: 1, mb: 2 }}>
                  {q.options.map((opt, oIdx) => (
                    <Typography key={oIdx} sx={{ color: '#374151', mb: 0.5, fontSize: '0.95rem' }}>
                      <span style={{ fontWeight: 600 }}>{LETTERS[oIdx]})</span> {opt}
                    </Typography>
                  ))}
                </Box>

                <Typography sx={{ fontWeight: 500, color: '#374151' }}>
                  Select Answer: {selectedLetter} <span style={{ color: statusColor, fontWeight: 700, marginLeft: '8px' }}>[{STATUS_CONFIG[status].label}]</span>
                </Typography>

                {idx < questions.length - 1 && <Divider sx={{ mt: 3, borderColor: '#e5e7eb' }} />}
              </Box>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #e5e7eb' }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: '#dc2626',
            color: '#fff',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            '&:hover': { bgcolor: '#b91c1c' },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionsPreviewModal;
