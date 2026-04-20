import { apiSlice } from './apiSlice';

const AI_URL = '/api/ai';

export const aiInterviewApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    generateAIQuestions: builder.mutation({
      query: (data) => ({
        url: `${AI_URL}/generate-questions`,
        method: 'POST',
        body: data,
      }),
    }),
    evaluateAIAnswer: builder.mutation({
      query: (data) => ({
        url: `${AI_URL}/evaluate-answer`,
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useGenerateAIQuestionsMutation, useEvaluateAIAnswerMutation } = aiInterviewApiSlice;
