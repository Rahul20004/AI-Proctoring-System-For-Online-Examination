import express from 'express';
import { generateQuestions, evaluateAnswer } from '../controllers/aiInterviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate-questions', protect, generateQuestions);
router.post('/evaluate-answer', protect, evaluateAnswer);

export default router;
