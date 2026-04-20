import asyncHandler from 'express-async-handler';
import Result from '../models/Result.js';
import Exam from '../models/Exam.js';

// @desc    Create new result
// @route   POST /api/results
// @access  Private/Student
const createResult = asyncHandler(async (req, res) => {
  const { examId, score, totalQuestions, timeSpentPerQuestion, cheatLogs } = req.body;

  const cheatLogCount = cheatLogs ? cheatLogs.length : 0;
  const reportSummary = cheatLogCount > 0 ? `Completed with ${cheatLogCount} AI warnings.` : `Completed successfully with 0 warnings.`;
  const cheatingLogId = cheatLogCount > 0 ? `LOG-${Date.now()}` : null;

  const result = new Result({
    student: req.user._id,
    exam: examId,
    score,
    totalQuestions,
    timeSpentPerQuestion,
    cheatLogs,
    reportSummary,
    cheatingLogId
  });

  const createdResult = await result.save();
  console.log('Backend save result:', createdResult._id);
  res.status(201).json(createdResult);
});

// @desc    Get result by ID
// @route   GET /api/results/:id
// @access  Private
const getResultById = asyncHandler(async (req, res) => {
  const result = await Result.findById(req.params.id)
    .populate('student', 'name email')
    .populate('exam', 'title duration');

  if (result) {
    // Only teacher or the student who owns the result can view it
    if (req.user.role === 'teacher' || req.user._id.toString() === result.student._id.toString()) {
      res.json(result);
    } else {
      res.status(401);
      throw new Error('Not authorized to view this result');
    }
  } else {
    res.status(404);
    throw new Error('Result not found');
  }
});

// @desc    Get all results for a teacher's exams
// @route   GET /api/results/teacher/:teacherId
// @access  Private/Teacher
const getTeacherResults = asyncHandler(async (req, res) => {
  const exams = await Exam.find({ teacher: req.params.teacherId });
  const examIds = exams.map(e => e._id);
  
  const results = await Result.find({ exam: { $in: examIds } })
    .populate('student', 'name email')
    .populate('exam', 'title duration');
    
  console.log(`API response: Fetched ${results.length} student results for teacher ${req.params.teacherId}`);
  res.json(results);
});

export { createResult, getResultById, getTeacherResults };
