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

   getAllFrequency: build.query({
      query: () =>({
        url:`http://voltas.local.site:4200/unsecure/frequency/getallfrequency`,
        // url:`${API_BASE_URL}/frequency/getallfrequency`,
        method:'GET',
      }),
      providesTags:['Frequency'],
    }),

    getLocationByIsStore: build.query({
      query: (params) => {
        const { clientId, pageNumber = 1, pageSize = 1000 } = params ?? {}

        if (!clientId) {
          throw new Error('ClientId is required for getLocationByIsStore')
        }

        return {
          url: `${API_BASE_URL}/location/getbyisstore`,
          method: 'GET',
          params: {
            clientId: String(clientId),
            pn: String(pageNumber),
            ps: String(pageSize),
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
      url: `${API_BASE_URL}/user/add/poov`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["UserInfo"], // refresh user list after add
}),

deleteUser: build.mutation({
  query: (queryString) => ({
    url: `${API_BASE_URL}/userinfo/delete/poov?${queryString}`,
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
      url: `${API_BASE_URL}/usertype/addorupdate/poov`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["UserType"], 
}),

deleteUserType: build.mutation({
  query: (queryString) => ({
    url: `${API_BASE_URL}/delete/usertype/poov?${queryString}`,
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
      url: `${API_BASE_URL}/department/addorupdate/poov`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["Department"], 
}),

deleteDepartment: build.mutation({
  query: (queryString) => ({
    url: `${API_BASE_URL}/delete/department/poov?${queryString}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["Department"],
}),

addSkill: build.mutation({
  query: (payload) => {
    if (!payload?.clientId) {
      throw new Error("clientId is required for add skill");
    }

    return {
      url: `${API_BASE_URL}/skill/addorupadate/poov`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["Skill"], 
}),

deleteSkill: build.mutation({
  query: (queryString) => ({
    url: `${API_BASE_URL}/delete/skill/poov?${queryString}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["Skill"],
}),

addSkillLevel: build.mutation({
  query: (payload) => {
    if (!payload?.clientId) {
      throw new Error("clientId is required for add skill level");
    }

    return {
      url: `${API_BASE_URL}/skilllevel/addorupadate/poov`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["SkillLevel"], 
}),

deleteSkillLevel: build.mutation({
  query: (queryString) => ({
    url: `${API_BASE_URL}/delete/skilllevel/poov?${queryString}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["SkillLevel"],
}),

getLocationGroupList: build.query({
      query: (params) => {
        const {
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getLocationGroupList')
        }

        return {
          url: `${API_BASE_URL}/locationgroup/getlocationgrouplist`,
          method: 'GET',
          params: {
            domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['LocationGroup'],
    }),

    addLocationGroup: build.mutation({
  query: (payload) => {
    if (!payload?.clientId) {
      throw new Error("clientId is required for add location group");
    }

    return {
      url: `${API_BASE_URL}/locationgroup/addorupdate/poov`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["LocationGroup"], 
}),

deleteLocationGroup: build.mutation({
  query: (queryString) => ({
    url: `${API_BASE_URL}/delete/locationgroup/poov?${queryString}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["LocationGroup"],
}),

addLocation: build.mutation({
  query: (payload) => {
    if (!payload?.clientId) {
      throw new Error("clientId is required for add location");
    }

    return {
      url: `${API_BASE_URL}/location/addLocation/poov`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["Location"], 
}),

deleteLocation: build.mutation({
  query: (queryString) => ({
    url: `${API_BASE_URL}/delete/location/poov?${queryString}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["Location"],
}),

getAreaList: build.query({
      query: (params) => {
        const {
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getAreaList')
        }

        return {
          url: `${API_BASE_URL}/area/getallarealist`,
          method: 'GET',
          params: {
            domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['Area'],
    }),

    addArea: build.mutation({
  query: (payload) => {
    if (!payload?.clientId) {
      throw new Error("clientId is required for add area");
    }

    return {
      url: `${API_BASE_URL}/area/addorupdate/poov`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["Area"], 
}),

deleteArea: build.mutation({
  query: (queryString) => ({
    url: `${API_BASE_URL}/delete/area/poov?${queryString}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["Area"],
}),

getSubAreaList: build.query({
      query: (params) => {
        const {
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getSubAreaList')
        }

        return {
          url: `${API_BASE_URL}/subarea/getallsubarealist`,
          method: 'GET',
          params: {
            domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['SubArea'],
    }),

    addSubArea: build.mutation({
  query: (payload) => {
    if (!payload?.clientId) {
      throw new Error("clientId is required for add sub area");
    }

    return {
      url: `${API_BASE_URL}/subarea/addorupdate/poov`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["SubArea"], 
}),

deleteSubArea: build.mutation({
  query: (queryString) => ({
    url: `${API_BASE_URL}/delete/subarea/poov?${queryString}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["SubArea"],
}),

    addShift: build.mutation({
  query: (payload) => {
    if (!payload?.clientId) {
      throw new Error("clientId is required for add shift");
    }

    return {
      url: `${API_BASE_URL}/shift/addorupdate/poov`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["Shift"], 
}),

deleteShift: build.mutation({
  query: (queryString) => ({
    url: `${API_BASE_URL}/delete/shiftbyid/poov?${queryString}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["Shift"],
}),

getShiftLocationMappingList: build.query({
      query: (params) => {
        const {
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getShiftLocationMappingList')
        }

        return {
          url: `${API_BASE_URL}/shiftlocationmapping/getalllist`,
          method: 'GET',
          params: {
            domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['ShiftLocationMapping'],
    }),

addShiftLocationMapping: build.mutation({
  query: (payload) => {
    if (!payload?.clientId) {
      throw new Error("clientId is required for add shift location mapping");
    }

    return {
      url: `${API_BASE_URL}/shiftlocation/mapping/poov`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["ShiftLocationMapping"], 
}),

deleteShiftLocationMapping: build.mutation({
  query: (queryString) => ({
    url: `${API_BASE_URL}/delete/shiftmapping/poov?${queryString}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["ShiftLocationMapping"],
}),

getCheckListByClient: build.query({
      query: (params) => {
        const {
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getCheckListByClient')
        }

        return {
          url: `${API_BASE_URL}/checklist/getlist/byclient`,
          method: 'GET',
          params: {
            domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['CheckList'],
    }),

addAssetCategory: build.mutation({
  query: (payload) => {
    if (!payload?.clientId) {
      throw new Error("clientId is required for add asset category");
    }

    return {
      url: `${API_BASE_URL}/category/addorupdate/poov`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["Category"], 
}),

deleteAssetCategory: build.mutation({
  query: (queryString) => ({
    url: `${API_BASE_URL}/category/delete/poov?${queryString}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["Category"],
}),

getAssetsLocationWise: build.query({
      query: (params) => {
        const {
          clientId,
          pageNumber = 1,
          pageSize = 1000,
          locationId
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getAssetsLocationWise')
        }

        return {
          url: `${API_BASE_URL}/assets/getassetsfilter/locationwise`,
          method: 'GET',
          params: {
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
            locationId: locationId?.toString() ?? '',
          },
        }
      },
      providesTags: ['Assets'],
    }),

getAreaByLocation: build.query({
      query: (params) => {
        const {
          locationId
        } = params

        if (!locationId) {
          throw new Error('LocationId is required for getAreaByLocation')
        }

        return {
          url: `${API_BASE_URL}/assets/getarea/bylocation`,
          method: 'GET',
          params: {
            locationId: locationId.toString()
          },
        }
      },
      providesTags: ['Assets'],
    }),

getSubAreaByArea: build.query({
      query: (params) => {
        const {
          areaId
        } = params

        if (!areaId) {
          throw new Error('AreaId is required for getSubAreaByArea')
        }

        return {
          url: `${API_BASE_URL}/assets/getsubarea/byarea`,
          method: 'GET',
          params: {
            areaId: areaId.toString()
          },
        }
      },
      providesTags: ['Assets'],
    }),

addAsset: build.mutation({
  query: (payload) => {
    if (!payload?.clientId) {
      throw new Error("clientId is required for add asset");
    }

    return {
      url: `${API_BASE_URL}/assets/addorupdate/poov`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["Assets"], 
}),

deleteAsset: build.mutation({
  query: (queryString) => ({
    url: `${API_BASE_URL}/assets/delete/poov?${queryString}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["Assets"],
}),

getAllInventoryCategory: build.query({
      query: (params) => {
        const {
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getAllInventoryCategory')
        }

        return {
          url: `${API_BASE_URL}/inventorycatgegory/getallinventorycategory`,
          method: 'GET',
          params: {
            domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['InventoryCategory'],
    }),

addInventoryCategory: build.mutation({
  query: (payload) => {
    if (!payload?.clientId) {
      throw new Error("clientId is required for add inventory category");
    }

    return {
      url: `${API_BASE_URL}/inventorycategory/addorupdate/poov`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["InventoryCategory"], 
}),

deleteInventoryCategory: build.mutation({
  query: (queryString) => ({
    url: `${API_BASE_URL}/delete/inventorycategory/poov?${queryString}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["InventoryCategory"],
}),

getInventoryList: build.query({
      query: (params) => {
        const {
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getInventoryList')
        }

        return {
          url: `${API_BASE_URL}/inventory/getinventorylist`,
          method: 'GET',
          params: {
            domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['Inventory'],
    }),

addInventory: build.mutation({
  query: (payload) => {
    if (!payload?.get?.("clientId")) {
        throw new Error("clientId is required for add inventory");
      }

    return {
      url: `${API_BASE_URL}/inventory/addorupdate/poov`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["Inventory"], 
}),

deleteInventory: build.mutation({
  query: (queryString) => ({
    url: `${API_BASE_URL}/delete/inventory/poov?${queryString}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["Inventory"],
}),

getToolsList: build.query({
      query: (params) => {
        const {
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getToolsList')
        }

        return {
          url: `${API_BASE_URL}/tools/gettoolslist`,
          method: 'GET',
          params: {
            domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['Tools'],
    }),

addTools: build.mutation({
  query: (payload) => {
    if (!payload?.clientId) {
      throw new Error("clientId is required for add tools");
    }

    return {
      url: `${API_BASE_URL}/tools/addorupdate/poov`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["Tools"], 
}),

deleteTools: build.mutation({
  query: (queryString) => ({
    url: `${API_BASE_URL}/delete/tools/poov?${queryString}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["Tools"],
}),

getCheckListType: build.query({
      query: (params) => {
        const {
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getCheckListType')
        }

        return {
          url: `${API_BASE_URL}/checklisttype/getalllist/byclient`,
          method: 'GET',
          params: {
            domainName,
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['CheckListType'],
    }),

addCheckListType: build.mutation({
  query: (payload) => {
    if (!payload?.clientId) {
      throw new Error("clientId is required for add check list type");
    }

    return {
      url: `${API_BASE_URL}/checklisttype/addorupdate/poov`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["CheckListType"], 
}),

deleteCheckListType: build.mutation({
  query: (queryString) => ({
    url: `${API_BASE_URL}/delete/checklisttype/poov?${queryString}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["CheckListType"],
}),

getElementsCheckList: build.query({
      query: (params) => {
        const {
          clientId,
          pageNumber = 1,
          pageSize = 1000,
        } = params

        if (!clientId) {
          throw new Error('ClientId is required for getElementsCheckList')
        }

        return {
          url: `${API_BASE_URL}/elementschecklist/getlist`,
          method: 'GET',
          params: {
            clientId: clientId.toString(),
            pn: pageNumber.toString(),
            ps: pageSize.toString(),
          },
        }
      },
      providesTags: ['ElementsCheckList'],
    }),

addCheckList: build.mutation({
  query: (payload) => {
    if (!payload?.clientId) {
      throw new Error("clientId is required for add check list");
    }

    return {
      url: `${API_BASE_URL}/checklist/addorupdate/poov`,
      method: "POST",
      body: payload,
    };
  },
  invalidatesTags: (result, error) =>
    error ? [] :["CheckList"], 
}),

deleteCheckList: build.mutation({
  query: (queryString) => ({
    url: `${API_BASE_URL}/delete/checklist/poov?${queryString}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, error) =>
    error ? [] :["CheckList"],
}),

  }),
  overrideExisting: false,
})

export const {
  useGetLocationListQuery,
  useGetAllFrequencyQuery,
  useGetLocationByIsStoreQuery,
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
  useDeleteDepartmentMutation,
  useAddSkillMutation,
  useDeleteSkillMutation,
  useAddSkillLevelMutation,
  useDeleteSkillLevelMutation,
  useGetLocationGroupListQuery,
  useAddLocationGroupMutation,
  useDeleteLocationGroupMutation,
  useAddLocationMutation,
  useDeleteLocationMutation,
  useGetAreaListQuery,
  useAddAreaMutation,
  useDeleteAreaMutation,
  useGetSubAreaListQuery,
  useAddSubAreaMutation,
  useDeleteSubAreaMutation,
  useAddShiftMutation,
  useDeleteShiftMutation,
  useGetShiftLocationMappingListQuery,
  useAddShiftLocationMappingMutation,
  useDeleteShiftLocationMappingMutation,
  useGetCheckListByClientQuery,
  useAddAssetCategoryMutation,
  useDeleteAssetCategoryMutation,
  useGetAssetsLocationWiseQuery,
  useGetAreaByLocationQuery,
  useGetSubAreaByAreaQuery,
  useAddAssetMutation,
  useDeleteAssetMutation,
  useGetAllInventoryCategoryQuery,
  useAddInventoryCategoryMutation,
  useDeleteInventoryCategoryMutation,
  useGetInventoryListQuery,
  useAddInventoryMutation,
  useDeleteInventoryMutation,
  useGetToolsListQuery,
  useAddToolsMutation,
  useDeleteToolsMutation,
  useGetCheckListTypeQuery,
  useAddCheckListTypeMutation,
  useDeleteCheckListTypeMutation,
  useGetElementsCheckListQuery,
  useAddCheckListMutation,
  useDeleteCheckListMutation
} = masterSettingsApi
