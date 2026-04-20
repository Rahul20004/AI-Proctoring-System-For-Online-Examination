import asyncHandler from 'express-async-handler';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Interview from '../models/Interview.js';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Generate interview questions from resume
// @route   POST /api/ai/generate-questions
// @access  Private
const generateQuestions = asyncHandler(async (req, res) => {
  const { resumeText } = req.body;

  if (!resumeText) {
    res.status(400);
    throw new Error('Please provide resume text');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
    You are an expert interviewer. Based on the following resume text, generate 5 interview questions.
    The questions should be a mix of:
    1. Technical questions based on skills
    2. Project-based questions
    3. HR/Behavioral questions
    
    Resume Text: ${resumeText}
    
    Return the response as a valid JSON array of strings only. 
    Example: ["Question 1", "Question 2", ...]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonString = text.replace(/```json|```/g, '').trim();
    const questions = JSON.parse(jsonString);
    
    // Maintain a new interview session in DB
    const interview = await Interview.create({
       user: req.user._id,
       resumeText,
       interactions: []
    });

    res.json({ questions, interviewId: interview._id });
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error('Failed to generate questions from Gemini');
  }
});

// @desc    Evaluate interview answer
// @route   POST /api/ai/evaluate-answer
// @access  Private
const evaluateAnswer = asyncHandler(async (req, res) => {
  const { interviewId, question, answer } = req.body;

  if (!question || !answer) {
    res.status(400);
    throw new Error('Please provide question and answer');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
    Evaluate the following interview answer for the given question.
    Question: ${question}
    Answer: ${answer}
    
    Provide an evaluation in JSON format with the following keys:
    - accuracy: (0-10 score)
    - communication: (0-10 score)
    - confidence: (0-10 score)
    - feedback: (detailed feedback string)
    - correctAnswerSuggestion: (a better version of the answer)

    Return ONLY the JSON object.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonString = text.replace(/```json|```/g, '').trim();
    const evaluation = JSON.parse(jsonString);

    // Update DB
    const interview = await Interview.findById(interviewId);
    if (interview) {
      interview.interactions.push({
        question,
        answer,
        ...evaluation
      });
      // Simple average overall score update logic
      const totalAcc = interview.interactions.reduce((acc, curr) => acc + curr.accuracy, 0);
      interview.overallScore = Math.round(totalAcc / interview.interactions.length);
      await interview.save();
    }
    
    res.json(evaluation);
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error('Failed to evaluate answer with Gemini');
  }
});

export { generateQuestions, evaluateAnswer };
