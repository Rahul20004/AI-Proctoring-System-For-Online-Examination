import { useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, Chip, Stack, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// ── status helpers ─────────────────────────────────────────────────────────
const getStatus = (question, selectedText) => {
  if (!selectedText) return 'NOT ATTEMPTED';
  return selectedText === question.options[question.correctOption] ? 'CORRECT' : 'INCORRECT';
};

const STATUS_CONFIG = {
  'CORRECT': { color: '#16a34a', bg: '#dcfce7' },
  'INCORRECT': { color: '#dc2626', bg: '#fee2e2' },
  'NOT ATTEMPTED': { color: '#f59e0b', bg: '#fef3c7' },
};

const StudentDetailModal = ({ open, onClose, result }) => {
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
      const s = getStatus(q, answersMap[String(idx)]);
      if (s === 'CORRECT') correct++;
      else if (s === 'INCORRECT') incorrect++;
      else notAttempted++;
    });
    return { correct, incorrect, notAttempted };
  }, [questions, answersMap]);

  if (!result) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '70%',
          bgcolor: '#ffffff',
          borderRadius: '12px',
          maxHeight: '80vh',
          m: 'auto'
        },
      }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #e5e7eb',
        p: 2
      }}>
        <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '1.25rem' }}>
          Questions Preview
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: '#6b7280' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#ffffff' }}>
        {/* SUMMARY BADGES */}
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          <Chip label={`Total: ${questions.length}`} size="small" sx={{ bgcolor: '#f3f4f6', color: '#374151', fontWeight: 500 }} />
          <Chip label={`Correct: ${stats.correct}`} size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 500 }} />
          <Chip label={`Not Attempted: ${stats.notAttempted}`} size="small" sx={{ bgcolor: '#fef3c7', color: '#f59e0b', fontWeight: 500 }} />
          <Chip label={`Incorrect: ${stats.incorrect}`} size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 500 }} />
        </Stack>

        {/* QUESTION LIST */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {questions.map((q, idx) => {
            const selectedText = answersMap[String(idx)];
            const status = getStatus(q, selectedText);
            const statusStyle = STATUS_CONFIG[status];
            
            return (
              <Box key={idx} sx={{ 
                py: '12px',
                borderBottom: '1px solid #e5e7eb',
                '&:last-child': { borderBottom: 'none' }
              }}>
                <Typography sx={{ fontWeight: 500, color: '#111827', mb: 1.5 }}>
                  Q{idx + 1}. {q.questionText}
                </Typography>
                
                <Stack spacing={0.5} sx={{ mb: 2, ml: 1 }}>
                  {q.options.map((opt, optIdx) => (
                    <Typography key={optIdx} sx={{ color: '#374151', fontSize: '0.9rem' }}>
                      {LETTERS[optIdx]}) {opt}
                    </Typography>
                  ))}
                </Stack>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
                    Selected Answer: {selectedText ? `${LETTERS[q.options.indexOf(selectedText)]}` : 'None'}
                  </Typography>
                  <Typography sx={{ 
                    fontWeight: 700, 
                    fontSize: '0.8rem',
                    color: statusStyle.color,
                  }}>
                    [{status}]
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </DialogContent>

      {/* FOOTER */}
      <DialogActions sx={{ p: 2, borderTop: '1px solid #e5e7eb' }}>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{ 
            bgcolor: '#dc2626', 
            color: 'white',
            textTransform: 'none',
            borderRadius: '6px',
            px: 3,
            '&:hover': { bgcolor: '#b91c1c' }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentDetailModal;
