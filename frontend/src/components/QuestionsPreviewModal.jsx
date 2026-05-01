import { useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, Chip, Divider, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// ── helpers ────────────────────────────────────────────────────────────────
const getStatus = (question, selectedOption) => {
  if (!selectedOption) return 'notAttempted';
  const correctText = question.options[question.correctOption];
  return selectedOption === correctText ? 'correct' : 'incorrect';
};

const StatusBadge = ({ status }) => {
  const config = {
    correct:     { label: 'CORRECT',       color: '#2e7d32', bg: '#e8f5e9', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
    incorrect:   { label: 'INCORRECT',     color: '#c62828', bg: '#ffebee', icon: <CancelIcon      sx={{ fontSize: 14 }} /> },
    notAttempted:{ label: 'NOT ATTEMPTED', color: '#e65100', bg: '#fff8e1', icon: <RemoveCircleIcon sx={{ fontSize: 14 }} /> },
  };
  const { label, color, bg, icon } = config[status];
  return (
    <Chip
      icon={icon}
      label={label}
      size="small"
      sx={{
        bgcolor: bg,
        color,
        fontWeight: 700,
        fontSize: '0.68rem',
        letterSpacing: '0.04em',
        height: 22,
        border: `1px solid ${color}22`,
        '& .MuiChip-icon': { color },
        ml: 1,
      }}
    />
  );
};

const SummaryBadge = ({ label, value, color, bg }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <Typography variant="caption" sx={{ color: '#555', fontWeight: 600 }}>{label}:</Typography>
    <Chip
      label={value}
      size="small"
      sx={{
        bgcolor: bg,
        color,
        fontWeight: 700,
        height: 20,
        fontSize: '0.72rem',
        border: `1px solid ${color}33`,
      }}
    />
  </Box>
);

// ── main component ─────────────────────────────────────────────────────────
const QuestionsPreviewModal = ({ open, onClose, result }) => {
  const { exam, selectedAnswers } = result || {};
  const questions = exam?.questions || [];

  // selectedAnswers arrives from DB as either a plain object or a Map
  const answersMap = useMemo(() => {
    if (!selectedAnswers) return {};
    if (selectedAnswers instanceof Map) return Object.fromEntries(selectedAnswers);
    // Mongoose Map serialises as a plain object with numeric-string keys
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
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '14px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
          maxHeight: '88vh',
        },
      }}
    >
      {/* ── Header ── */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          pt: 2,
          px: 3,
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a1a2e' }}>
          Questions Preview
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: '#888' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2, overflowY: 'auto' }}>
        {/* ── Summary Bar ── */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 2.5,
            p: '10px 14px',
            bgcolor: '#fafafa',
            borderRadius: '10px',
            border: '1px solid #ebebeb',
          }}
        >
          <SummaryBadge label="Total"        value={stats.total}        color="#37474f" bg="#eceff1" />
          <SummaryBadge label="Correct"      value={stats.correct}      color="#2e7d32" bg="#e8f5e9" />
          <SummaryBadge label="Incorrect"    value={stats.incorrect}    color="#c62828" bg="#ffebee" />
          <SummaryBadge label="Not Attempted"value={stats.notAttempted} color="#e65100" bg="#fff8e1" />
        </Box>

        {/* ── Questions ── */}
        {questions.map((q, idx) => {
          const selected = answersMap[String(idx)];
          const status   = getStatus(q, selected);
          const selectedLetter = selected
            ? LETTERS[q.options.indexOf(selected)]
            : null;

          return (
            <Box key={idx} sx={{ mb: 2.5 }}>
              {/* Question text */}
              <Typography
                sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a2e', mb: 0.8 }}
              >
                {idx + 1}.&nbsp;{q.questionText}
              </Typography>

              {/* Options */}
              <Box sx={{ pl: 1.5, mb: 0.8 }}>
                {q.options.map((opt, oIdx) => {
                  const isCorrect  = oIdx === q.correctOption;
                  const isSelected = opt === selected;
                  return (
                    <Typography
                      key={oIdx}
                      sx={{
                        fontSize: '0.82rem',
                        color: isCorrect ? '#2e7d32' : isSelected ? '#c62828' : '#444',
                        fontWeight: isCorrect || isSelected ? 600 : 400,
                        lineHeight: 1.7,
                      }}
                    >
                      {LETTERS[oIdx]})&nbsp;{opt}
                    </Typography>
                  );
                })}
              </Box>

              {/* Selected Answer row */}
              <Box sx={{ display: 'flex', alignItems: 'center', pl: 1.5 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#555', fontWeight: 600 }}>
                  Select Answer:&nbsp;
                  <span style={{ color: '#1a1a2e', fontWeight: 700 }}>
                    {selectedLetter ?? '—'}
                  </span>
                </Typography>
                <StatusBadge status={status} />
              </Box>

              {idx < questions.length - 1 && (
                <Divider sx={{ mt: 2, borderColor: '#f0f0f0' }} />
              )}
            </Box>
          );
        })}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid #f0f0f0' }}>
        <Button
          onClick={onClose}
          variant="contained"
          size="small"
          sx={{
            bgcolor: '#1a1a2e',
            color: '#fff',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            '&:hover': { bgcolor: '#2d2d44' },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionsPreviewModal;
