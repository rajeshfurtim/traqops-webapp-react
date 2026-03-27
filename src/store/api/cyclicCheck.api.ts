import { baseApi, API_BASE_URL } from './baseApi'

export const cyclicCheck = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getCyclicCheck: build.query({
      query: (clientId: string | number) => ({
        url: `${API_BASE_URL}/cmrlem/getcycliccheck`,
        method: 'GET',
        params: {
          clientId: String(clientId),
        },
      }),
      providesTags: ['CyclicCheck'],
    }),

    deleteCyclicCheck: build.mutation({
      query: (id: number | string) => ({
        url: `${API_BASE_URL}/cmrlem/delete/cycliccheck/${id}`,
        method: 'DELETE',   
      }),
      invalidatesTags: ['CyclicCheck'], 
    }),

  }),
})

export const {
  useGetCyclicCheckQuery,
  useDeleteCyclicCheckMutation,
} = cyclicCheck