import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { 
  User, 
  CreditRequest, 
  Credit,
  PersonalCreditRequest,
  BusinessCreditRequest 
} from '../types';

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['User', 'CreditRequest', 'Credit'],
  endpoints: (builder) => ({
    // Users
    getUsers: builder.query<User[], void>({
      query: () => 'users',
      providesTags: ['User'],
    }),

    // Credit Requests
    getCreditRequests: builder.query<CreditRequest[], void>({
      query: () => 'credit-requests',
      providesTags: ['CreditRequest'],
    }),
    
    createPersonalCreditRequest: builder.mutation<PersonalCreditRequest, Partial<PersonalCreditRequest>>({
      query: (body) => ({
        url: 'credit-requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CreditRequest'],
    }),

    createBusinessCreditRequest: builder.mutation<BusinessCreditRequest, Partial<BusinessCreditRequest>>({
      query: (body) => ({
        url: 'credit-requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CreditRequest'],
    }),

    // Credits
    getCredits: builder.query<Credit[], void>({
      query: () => 'credits',
      providesTags: ['Credit'],
    }),
  }),
});