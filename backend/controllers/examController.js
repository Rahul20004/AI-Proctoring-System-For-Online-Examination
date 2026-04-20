import asyncHandler from 'express-async-handler';
import Exam from '../models/Exam.js';
import { GoogleGenAI } from '@google/genai';

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private (Students & Teachers)
const getExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find({}).populate('teacher', 'name email');
  res.json(exams);
});

// @desc    Create an exam
// @route   POST /api/exams
// @access  Private/Teacher
const createExam = asyncHandler(async (req, res) => {
  const { title, description, duration, timerMode, durationPerQuestion, questions } = req.body;

  const exam = new Exam({
    teacher: req.user._id,
    title,
    description,
    duration,
    timerMode: timerMode || 'global',
    durationPerQuestion,
    questions,
  });

  const createdExam = await exam.save();
  res.status(201).json(createdExam);
});

// @desc    Generate Questions using AI
// @route   POST /api/exams/generate
// @access  Private/Teacher
const generateQuestions = asyncHandler(async (req, res) => {
  const { topic, difficulty, count } = req.body;
  
  const prompt = `You are an expert exam question generator. 
Generate exactly ${count} multiple-choice questions about the topic "${topic}" with a difficulty level of "${difficulty}".
Respond ONLY with a valid JSON array of objects representing the questions. Ensure no extra text or markdown formatting.
Each object MUST have the exact following structure:
{
  "questionText": "The question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctOption": 0,
  "difficulty": "${difficulty}"
}
`;

  try {
    let questionsText = '';

    if (process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      questionsText = response.text;
    } else {
      console.warn("No GEMINI_API_KEY found, falling back to free Pollinations.ai API");
      const pollResponse = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          seed: Math.floor(Math.random() * 100000),
          jsonMode: true
        })
      });
      
      if (!pollResponse.ok) {
        throw new Error('Fallback AI generation failed');
      }
      
      questionsText = await pollResponse.text();
    }

    // Strip markdown formatting if any from the API
    questionsText = questionsText.replace(/^```json/mi, '').replace(/```$/m, '').trim();

    const questions = JSON.parse(questionsText);

    if (!Array.isArray(questions)) {
      throw new Error('AI did not return an array of questions');
    }

    res.json({ questions });
  } catch (err) {
    console.error('AI Generation Error:', err);
    res.status(500);
    throw new Error('Failed to generate questions using AI. Please try again.');
  }
});

export { getExams, createExam, generateQuestions };
