import { apiSlice } from './apiSlice';

const RESULTS_URL = '/api/results';

export const resultApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createResult: builder.mutation({
      query: (data) => ({
        url: `${RESULTS_URL}`,
        method: 'POST',
        body: data,
      }),
    }),
    getResult: builder.query({
      query: (id) => ({
        url: `${RESULTS_URL}/${id}`,
      }),
    }),
    getTeacherResults: builder.query({
      query: (teacherId) => ({
        url: `${RESULTS_URL}/teacher/${teacherId}`,
      }),
      keepUnusedDataFor: 5,
    }),
    getMyResults: builder.query({
      query: () => ({
        url: `${RESULTS_URL}/my`,
      }),
      keepUnusedDataFor: 5,
    }),
  }),
});

export const { useCreateResultMutation, useGetResultQuery, useGetTeacherResultsQuery, useGetMyResultsQuery } = resultApiSlice;
