import { baseApi, API_BASE_URL } from './baseApi'
import { domainName } from '../../config/apiConfig'

/**
 * Master Settings API endpoints
 */
export const masterSettingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLocationList: build.query({
      query: (params) => {
        const {
          domainName: domainNameParam,
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getLocationList')
        }

        return {
          url: `${API_BASE_URL}/location/getlocationlist`,
          method: 'GET',
          params: {
            domainName: domainNameParam || domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['Location'],
    }),

    getAllUserType: build.query({
      query: (params) => {
        const {
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getAllUserType')
        }

        return {
          url: `${API_BASE_URL}/usertype/getallusertype`,
          method: 'GET',
          params: {
            domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['UserType'],
    }),

    getAllClientList: build.query({
      query: (params = {}) => {
        const { domainName: domainNameParam, pageNumber = 1, pageSize = 1000 } = params

        return {
          url: `${API_BASE_URL}/client/getallclientlist`,
          method: 'GET',
          params: {
            domainName: domainNameParam || domainName,
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['Client'],
    }),

    getAllRoleList: build.query({
      query: (params) => {
        const {
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getAllUserType')
        }

        return {
          url: `${API_BASE_URL}/userrole/getuserrolelist`,
          method: 'GET',
          params: {
            domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['UserRole'],
    }),

    getDepartmentList: build.query({
      query: (params) => {
        const {
          clientId,
          pageNumber = 1,
          pageSize = 100,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getAllUserType')
        }

        return {
          url: `${API_BASE_URL}/department/getalldepartmentlist`,
          method: 'GET',
          params: {
            domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['Department'],
    }),

    getSkillList: build.query({
      query: (params) => {
        const {
          clientId,
          pageNumber = 1,
          pageSize = 100,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getAllUserType')
        }

        return {
          url: `${API_BASE_URL}/skill/getlist`,
          method: 'GET',
          params: {
            domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['Skill'],
    }),

    getSkillLevelList: build.query({
      query: (params) => {
        const {
          clientId,
          pageNumber = 1,
          pageSize = 100,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getAllUserType')
        }

        return {
          url: `${API_BASE_URL}/skilllevel/getlevellist`,
          method: 'GET',
          params: {
            domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['SkillLevel'],
    }),

    getClientList: build.query({
      query: (params) => {
        const {
          pageNumber = 1,
          pageSize = 100,
        } = params

        return {
          url: `${API_BASE_URL}/client/getallclientlist`,
          method: 'GET',
          params: {
             domainName,
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['Client'],
    }),

    getMobileAuthorizationList: build.query({
      query: (params) => {
        const {
          clientId,
          userRoleId,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getAllUserType')
        }

        return {
          url: `${API_BASE_URL}/mobile/useraccess/getbyuserrole`,
          method: 'GET',
          params: {
            domainName,
            clientId: clientId.toString(),
            userRoleId: userRoleId.toString(),
          },
        }
      },
      providesTags: ['Mobile'],
    }),

    getAllUserList: build.query({
      query: (params) => {
        const {
          clientId,
          pageNumber = 1,
          pageSize = 1000,
          userRoleId
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getAllUserType')
        }

        return {
          url: `${API_BASE_URL}/userInfo/getuserrolelist`,
          method: 'GET',
          params: {
            domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
            userRoleId: userRoleId?.toString() ?? '',
          },
        }
      },
      providesTags: ['UserInfo'],
    }),

    addUser: build.mutation({
  query: (payload) => {
    if (!payload?.clientId) {
      throw new Error("clientId is required for addUser");
    }

    return {
      url: `${API_BASE_URL}/user/addd`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["UserInfo"], // refresh user list after add
}),

deleteUser: build.mutation({
  query: (id) => ({
    url: `${API_BASE_URL}/userinfo/delete?idd=${id}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["UserInfo"],
}),

addUserType: build.mutation({
  query: (payload) => {
    if (!payload?.clientId) {
      throw new Error("clientId is required for addUserType");
    }

    return {
      url: `${API_BASE_URL}/usertype/addorupdatee`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["UserType"], 
}),

deleteUserType: build.mutation({
  query: (id) => ({
    url: `${API_BASE_URL}/delete/usertype?idd=${id}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["UserType"],
}),

addDepartment: build.mutation({
  query: (payload) => {
    if (!payload?.clientId) {
      throw new Error("clientId is required for addUserType");
    }

    return {
      url: `${API_BASE_URL}/department/addorupdatee`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["Department"], 
}),

deleteDepartment: build.mutation({
  query: (id) => ({
    url: `${API_BASE_URL}/delete/department?idd=${id}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["Department"],
}),

  }),
  overrideExisting: false,
})

export const {
  useGetLocationListQuery,
  useGetAllUserTypeQuery,
  useGetAllClientListQuery,
  useGetAllRoleListQuery,
  useGetDepartmentListQuery,
  useGetSkillListQuery,
  useGetSkillLevelListQuery,
  useGetClientListQuery,
  useGetAllUserListQuery,
  useGetMobileAuthorizationListQuery,
  useAddUserMutation,
  useDeleteUserMutation,
  useAddUserTypeMutation,
  useDeleteUserTypeMutation,
  useAddDepartmentMutation,
  useDeleteDepartmentMutation
} = masterSettingsApi
