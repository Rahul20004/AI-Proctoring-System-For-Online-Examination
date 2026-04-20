import express from 'express';
import { createResult, getResultById, getTeacherResults, getMyResults } from '../controllers/resultController.js';
import { protect, teacher } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createResult);

router.route('/teacher/:teacherId')
  .get(protect, teacher, getTeacherResults);

router.route('/my')
  .get(protect, getMyResults);

router.route('/:id')
  .get(protect, getResultById);

export default router;
