import express from 'express';
import { getExams, createExam, generateQuestions } from '../controllers/examController.js';
import { protect, teacher } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getExams)
  .post(protect, teacher, createExam);

router.post('/generate', protect, teacher, generateQuestions);

export default router;
