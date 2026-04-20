import { apiSlice } from './apiSlice';

const EXAMS_URL = '/api/exams';

export const examApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getExams: builder.query({
      query: () => ({
        url: `${EXAMS_URL}`,
      }),
      keepUnusedDataFor: 5,
    }),
    createExam: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}`,
        method: 'POST',
        body: data,
      }),
    }),
    generateQuestions: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}/generate`,
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useGetExamsQuery, useCreateExamMutation, useGenerateQuestionsMutation } = examApiSlice;
