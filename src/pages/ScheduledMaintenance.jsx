import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Tag, Button, Modal, Form, Input, Select, Switch, Space, Spin, Row, Col, notification } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { apiService } from '../services/api'
import { getPageTitle, APP_CONFIG } from '../config/constants'
import { useGetLocationList } from '../hooks/useGetLocationList'
import { useAuth } from '../context/AuthContext'
import { domainName } from '../config/apiConfig'

export default function ScheduledMaintenance() {
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewingRecord, setViewingRecord] = useState(null)
  const [editingRecord, setEditingRecord] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [assetCategories, setAssetCategories] = useState([])
  const [assetCategoriesLoading, setAssetCategoriesLoading] = useState(false)
  const [checklists, setChecklists] = useState([])
  const [checklistsLoading, setChecklistsLoading] = useState(false)
  const [scheduleChecklistData, setScheduleChecklistData] = useState([])
  const [editingCategory, setEditingCategory] = useState(null)
  const [frequencies, setFrequencies] = useState([])
  const [frequenciesLoading, setFrequenciesLoading] = useState(false)
  const [userRoles, setUserRoles] = useState([])
  const [userRolesLoading, setUserRolesLoading] = useState(false)
  const [months, setMonths] = useState([])
  const [monthsLoading, setMonthsLoading] = useState(false)
  const [shiftFrequencies, setShiftFrequencies] = useState([])
  const [shiftFrequenciesLoading, setShiftFrequenciesLoading] = useState(false)
  const [customFrequencies, setCustomFrequencies] = useState([])
  const [customFrequenciesLoading, setCustomFrequenciesLoading] = useState(false)
  const [form] = Form.useForm()
  const { user } = useAuth()
  
  // Fetch locations from API using custom hook
  const { locations, loading: locationsLoading } = useGetLocationList()

  useEffect(() => {
    loadFrequencies()
    loadMonths()
    if (user?.client?.id || user?.clientId) {
      loadShiftFrequencies()
    }
    loadCustomFrequencies()
  }, [])

  // Load schedules when user context or pagination changes
  useEffect(() => {
    if (user?.client?.id || user?.clientId) {
      loadSchedules(pagination.current, pagination.pageSize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.client?.id, user?.clientId, user?.domain?.name, pagination.current, pagination.pageSize])

  // Reset to page 1 when user context changes
  useEffect(() => {
    if (user?.client?.id || user?.clientId) {
      setPagination(prev => ({ ...prev, current: 1 }))
    }
  }, [user?.client?.id, user?.clientId, user?.domain?.name])

  useEffect(() => {
    if (user?.client?.id || user?.clientId) {
      loadAssetCategories()
      loadUserRoles()
    }
  }, [user?.client?.id, user?.clientId, user?.domain?.name])

  const loadAssetCategories = async () => {
    try {
      setAssetCategoriesLoading(true)
      const clientId = user?.client?.id || user?.clientId
      const domainNameParam = user?.domain?.name || domainName

      if (!clientId) {
        setAssetCategories([])
        setAssetCategoriesLoading(false)
        return
      }

      const response = await apiService.getAllCategoryList({
        domainName: domainNameParam,
        clientId: clientId,
        pageNumber: 1,
        pageSize: 1000
      })

      if (response.success && response.data?.content) {
        const categories = Array.isArray(response.data.content) ? response.data.content : []
        setAssetCategories(categories)
      } else {
        setAssetCategories([])
      }
    } catch (error) {
      console.error('Error loading asset categories:', error)
      setAssetCategories([])
    } finally {
      setAssetCategoriesLoading(false)
    }
  }

  const loadFrequencies = async () => {
    try {
      setFrequenciesLoading(true)
      const response = await apiService.getAllFrequency()
      
      if (response.success && Array.isArray(response.data)) {
        setFrequencies(response.data)
      } else {
        setFrequencies([])
      }
    } catch (error) {
      setFrequencies([])
    } finally {
      setFrequenciesLoading(false)
    }
  }

  const loadMonths = async () => {
    try {
      setMonthsLoading(true)
      const response = await apiService.getScheduleMonthList()

      if (response.success && Array.isArray(response.data)) {
        setMonths(response.data)
      } else {
        setMonths([])
      }
    } catch (error) {
      setMonths([])
    } finally {
      setMonthsLoading(false)
    }
  }

  const loadShiftFrequencies = async () => {
    try {
      setShiftFrequenciesLoading(true)
      const clientId = user?.client?.id || user?.clientId
      const domainNameParam = user?.domain?.name || domainName

      if (!clientId) {
        setShiftFrequencies([])
        setShiftFrequenciesLoading(false)
        return
      }

      const response = await apiService.getAllShiftList({
        domainName: domainNameParam,
        clientId,
        pageNumber: 1,
        pageSize: 1000
      })

      if (response.success && response.data?.content) {
        const shifts = Array.isArray(response.data.content) ? response.data.content : []
        setShiftFrequencies(shifts)
      } else {
        setShiftFrequencies([])
      }
    } catch (error) {
      setShiftFrequencies([])
    } finally {
      setShiftFrequenciesLoading(false)
    }
  }

  const loadCustomFrequencies = async () => {
    try {
      setCustomFrequenciesLoading(true)

      const response = await apiService.getAllCustomFrequencyList({
        pageNumber: 1,
        pageSize: 1000
      })

      if (response.success && response.data?.content) {
        const items = Array.isArray(response.data.content) ? response.data.content : []
        setCustomFrequencies(items)
      } else {
        setCustomFrequencies([])
      }
    } catch (error) {
      setCustomFrequencies([])
    } finally {
      setCustomFrequenciesLoading(false)
    }
  }

  const loadUserRoles = async () => {
    try {
      setUserRolesLoading(true)
      const clientId = user?.client?.id || user?.clientId
      const domainNameParam = user?.domain?.name || domainName

      if (!clientId) {
        setUserRoles([])
        setUserRolesLoading(false)
        return
      }

      const response = await apiService.getUserRoleList({
        domainName: domainNameParam,
        clientId: clientId,
        pageNumber: 1,
        pageSize: 1000
      })

      if (response.success && response.data?.content) {
        setUserRoles(response.data.content)
      } else {
        setUserRoles([])
      }
    } catch (error) {
      setUserRoles([])
    } finally {
      setUserRolesLoading(false)
    }
  }

  const loadSchedules = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true)
      const clientId = user?.client?.id || user?.clientId
      const domainNameParam = user?.domain?.name || domainName

      if (!clientId) {
        setSchedules([])
        setLoading(false)
        return
      }

      const response = await apiService.getAllScheduleMaintenanceTasks({
        domainName: domainNameParam,
        clientId: clientId,
        pageNumber: page,
        pageSize: pageSize
      })

      if (response.success && response.data?.content) {
        // Transform the data for table display
        const transformedData = response.data.content.map((item, index) => {
          // Extract locations - comma-separated if multiple
          const locations = (item.scheduleLocationMapping || [])
            .map(mapping => mapping?.location?.name)
            .filter(Boolean)
          const locationDisplay = locations.length > 0 ? locations.join(', ') : '-'

          // Extract checklists from scheduleChecklistMapping - comma-separated if multiple
          const checklists = (item.scheduleChecklistMapping || [])
            .map(mapping => mapping?.checkList?.name)
            .filter(Boolean)
          const checklistDisplay = checklists.length > 0 ? checklists.join(', ') : '-'

          // Extract user roles - comma-separated if multiple
          const userRoles = (item.scheduleUserRoleMapping || [])
            .map(mapping => mapping?.userRole?.name)
            .filter(Boolean)
          const userRoleDisplay = userRoles.length > 0 ? userRoles.join(', ') : '-'

          // Calculate serial number based on current page
          const serialNumber = (page - 1) * pageSize + index + 1

          return {
            key: item.id || `${page}-${index}`,
            id: item.id,
            serialNumber: serialNumber,
            location: locationDisplay,
            task: item.name || '-',
            frequency: item.frequency?.name || '-',
            category: item.category?.name || '-',
            checklist: checklistDisplay,
            userRole: userRoleDisplay,
            // Store full item data for editing
            rawData: item
          }
        })

        setSchedules(transformedData)
        
        // Update pagination info
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize: pageSize,
          total: response.data?.totalElements || 0
        }))
      } else {
        setSchedules([])
        setPagination(prev => ({
          ...prev,
          total: 0
        }))
      }
    } catch (error) {
      console.error('Error loading schedules:', error)
      setSchedules([])
      setPagination(prev => ({
        ...prev,
        total: 0
      }))
    } finally {
      setLoading(false)
    }
  }


  // Asset Category options from API - filter by isCategory === "Y" and map name to label
  // Also include editing category if it exists (for editing mode)
  const assetCategoryOptions = (() => {
    const apiOptions = Array.isArray(assetCategories) && assetCategories.length > 0
      ? assetCategories
          .filter(category => category?.isCategory === 'Y')
          .map(category => {
            const categoryName = category?.name || 'Unknown'
            const categoryId = category?.id
            return {
              label: categoryName,
              value: categoryId
            }
          })
      : []
    
    // Add editing category if it's not already in the options
    if (editingCategory && editingCategory.id && editingCategory.name) {
      const exists = apiOptions.find(opt => 
        opt.value === editingCategory.id ||
        String(opt.value) === String(editingCategory.id)
      )
      if (!exists) {
        apiOptions.push({
          label: editingCategory.name,
          value: editingCategory.id
        })
      }
    }
    
    return apiOptions
  })()

  // Checklist options from API - map checklistName to label
  // Also include schedule checklists if they exist (for editing mode)
  const checklistOptions = (() => {
    const apiOptions = Array.isArray(checklists) && checklists.length > 0
      ? checklists.map(checklist => ({ 
          label: checklist?.checklistName || 'Unknown', 
          value: checklist?.checklistId 
        }))
      : []
    
    // Add schedule checklists if they're not already in the options
    // This ensures the names from scheduleChecklistMapping are available
    if (scheduleChecklistData.length > 0) {
      scheduleChecklistData.forEach(scheduleChecklist => {
        const exists = apiOptions.find(opt => 
          opt.value === scheduleChecklist.id ||
          String(opt.value) === String(scheduleChecklist.id)
        )
        if (!exists && scheduleChecklist.id && scheduleChecklist.name) {
          apiOptions.push({
            label: scheduleChecklist.name,
            value: scheduleChecklist.id
          })
        }
      })
    }
    
    return apiOptions
  })()

  // Load checklists when asset category changes
  const loadChecklistsByCategory = async (assetsCategoryId) => {
    if (!assetsCategoryId) {
      setChecklists([])
      form.setFieldsValue({ checklist: undefined })
      return
    }

    try {
      setChecklistsLoading(true)
      const response = await apiService.getChecklistByAssetCategory({
        assetsCategoryId: assetsCategoryId
      })

      if (response.success && Array.isArray(response.data)) {
        setChecklists(response.data)

        if (scheduleChecklistData.length > 0) {
          const scheduleNames = scheduleChecklistData
            .map(item => item.name)
            .filter(Boolean)

          const mappedIds = response.data
            .filter(cl => scheduleNames.includes(cl.checklistName))
            .map(cl => cl.checklistId)

          if (mappedIds.length > 0) {
            form.setFieldsValue({ checklist: mappedIds })
          }
        }
      } else {
        setChecklists([])
      }
    } catch (error) {
      setChecklists([])
    } finally {
      setChecklistsLoading(false)
    }
  }

  // Handle asset category change
  const handleAssetCategoryChange = (categoryId) => {
    form.setFieldsValue({ checklist: undefined })
    loadChecklistsByCategory(categoryId)
  }

  // User Role options from API - map name to label
  const userOptions = Array.isArray(userRoles) && userRoles.length > 0
    ? userRoles.map(role => ({ 
        label: role?.name || 'Unknown', 
        value: role?.id 
      }))
    : []

  // Frequency options from API - map name to label
  const frequencyOptions = Array.isArray(frequencies) && frequencies.length > 0
    ? frequencies.map(frequency => ({ 
        label: frequency?.name || 'Unknown', 
        value: frequency?.id 
      }))
    : []

  // Month options from API - map name to label
  const monthOptions = Array.isArray(months) && months.length > 0
    ? months.map(month => ({
        label: month?.name || 'Unknown',
        value: month?.id
      }))
    : []

  // Shift Frequency options from API - map name to label
  const shiftFrequencyOptions = Array.isArray(shiftFrequencies) && shiftFrequencies.length > 0
    ? shiftFrequencies.map(shift => ({
        label: shift?.name || 'Unknown',
        value: shift?.id
      }))
    : []

  // Daily Custom Hours options from API - map hours to label
  const dailyCustomHourOptions = Array.isArray(customFrequencies) && customFrequencies.length > 0
    ? customFrequencies.map(item => ({
        label: item?.hours || 'Unknown',
        value: item?.id
      }))
    : []


  // Location options from API
  const locationOptions = Array.isArray(locations) && locations.length > 0
    ? locations.map(loc => ({ label: loc?.name || 'Unknown', value: loc?.id }))
    : []

  const handleAdd = () => {
    setEditingRecord(null)
    setIsModalOpen(true)
    setScheduleChecklistData([]) // Clear schedule checklist data for new entry
    setEditingCategory(null) // Clear editing category for new entry
    form.resetFields()
    form.setFieldsValue({ status: true })
  }

  const handleRowClick = async (record) => {
    try {
      setModalLoading(true)
      setIsModalOpen(true)
      setEditingRecord(record.rawData)

      const item = record.rawData

      // Store category data for options (similar to how table shows category name)
      if (item.category) {
        setEditingCategory({
          id: item.category.id,
          name: item.category.name
        })
      }

      // Ensure asset categories are loaded before setting form values
      if (assetCategories.length === 0 && (user?.client?.id || user?.clientId)) {
        await loadAssetCategories()
      }

      // Extract location IDs
      const locationIds = (item.scheduleLocationMapping || [])
        .map(mapping => mapping?.location?.id)
        .filter(Boolean)

      // Extract checklist data from scheduleChecklistMapping
      // Store both ID and name for reference
      const scheduleChecklists = (item.scheduleChecklistMapping || [])
        .map(mapping => ({
          id: mapping?.checkList?.id,
          name: mapping?.checkList?.name
        }))
        .filter(cl => cl.id)
      
      const scheduleChecklistIds = scheduleChecklists.map(cl => cl.id)

      // Extract completed by user role IDs
      const completedByIds = (item.scheduleUserRoleMapping || [])
        .filter(mapping => mapping?.isVerified === 'N')
        .map(mapping => mapping?.userRole?.id)
        .filter(Boolean)

      // Extract verified by user role IDs
      const verifiedByIds = (item.scheduleUserRoleMapping || [])
        .filter(mapping => mapping?.isVerified === 'Y')
        .map(mapping => mapping?.userRole?.id)
        .filter(Boolean)

      // Store schedule checklist data FIRST so options are available immediately
      setScheduleChecklistData(scheduleChecklists)
      
      // Set form values - ensure asset category ID is set correctly
      const assetCategoryId = item.category?.id
      
      // Extract month IDs from scheduleMonthMapping
      const monthIds = (item.scheduleMonthMapping || [])
        .map(mapping => mapping?.id)
        .filter(Boolean)

      // Extract shift frequency IDs from scheduleShiftMapping
      const shiftFrequencyIds = (item.scheduleShiftMapping || [])
        .map(mapping => mapping?.shiftId)
        .filter(Boolean)

      // Extract custom frequency IDs from scheduleCustomMapping
      const dailyCustomHourIds = (item.scheduleCustomMapping || [])
        .map(mapping => mapping?.customFrequency?.id || mapping?.customMappingId)
        .filter(Boolean)

      // Set form values - checklist will be set after checklists load
      form.setFieldsValue({
        location: locationIds,
        assetCategory: assetCategoryId,
        task: item.name || '',
        frequency: item.frequency?.id,
        completedBy: completedByIds,
        verifiedBy: verifiedByIds,
        description: item.description || '',
        status: item.action === 'Y',
        month: monthIds.length > 0 ? monthIds : undefined,
        shiftFrequency: shiftFrequencyIds.length > 0 ? shiftFrequencyIds : undefined,
        dailyCustomHours: dailyCustomHourIds.length > 0 ? dailyCustomHourIds : undefined
      })
      
      // Set checklist value after a short delay to ensure options are rendered
      // Use scheduleChecklistIds directly since they're in scheduleChecklistData options
      setTimeout(() => {
        if (scheduleChecklistIds.length > 0) {
          form.setFieldsValue({ checklist: scheduleChecklistIds })
        }
      }, 300)
      
      // Load checklists if asset category exists
      if (item.category?.id) {
        await loadChecklistsByCategory(item.category.id)
      } else {
        // If no category, set checklist directly using scheduleChecklistIds
        // These IDs should match the values in scheduleChecklistData
        setTimeout(() => {
          form.setFieldsValue({ checklist: scheduleChecklistIds })
        }, 100)
      }
    } catch (error) {
      console.error('Error loading record data:', error)
    } finally {
      setModalLoading(false)
    }
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    setEditingRecord(null)
    setEditingCategory(null)
    form.resetFields()
  }

  const handleSubmit = async (values) => {
    try {
      setModalLoading(true)
      
      const clientId = user?.client?.id || user?.clientId
      const domainNameParam = user?.domain?.name || domainName
      
      if (!clientId) {
        notification.error({
          message: 'Error',
          description: 'Client ID is required',
          placement: 'topRight'
        })
        return
      }

      // Get selected frequency to determine payload structure
      const selectedFrequencyId = values.frequency
      const selectedFrequency = frequencies.find(f => f.id === selectedFrequencyId)
      const frequencyName = selectedFrequency?.name?.toUpperCase()

      // Build location data
      const locationIds = Array.isArray(values.location) ? values.location : []
      const locationData = locationIds.map(locId => {
        const location = locations.find(l => l.id === locId)
        return {
          id: locId,
          name: location?.name || ''
        }
      })
      const scheduleLocationMappingDtos = locationIds.map(locId => ({ locationId: locId }))

      // Build checklist data
      const checklistIds = Array.isArray(values.checklist) ? values.checklist : []
      const checklistData = checklistIds.map(checklistId => {
        const checklist = checklists.find(c => c.checklistId === checklistId)
        return {
          id: checklistId,
          name: checklist?.checklistName || ''
        }
      })
      const scheduleChecklistMappingDtos = checklistIds.map(checklistId => ({ checklistId: checklistId }))

      // Build user role data
      const completedByIds = Array.isArray(values.completedBy) ? values.completedBy : []
      const verifiedByIds = Array.isArray(values.verifiedBy) ? values.verifiedBy : []
      
      const userCompletId = completedByIds.map(roleId => {
        const role = userRoles.find(r => r.id === roleId)
        return {
          id: roleId,
          name: role?.name || ''
        }
      })
      
      const userVerifiedId = verifiedByIds.map(roleId => {
        const role = userRoles.find(r => r.id === roleId)
        return {
          id: roleId,
          name: role?.name || ''
        }
      })

      const scheduleUserRoleMappingDtos = [
        ...completedByIds.map(roleId => ({ userRoleId: roleId, isVerified: 'N' })),
        ...verifiedByIds.map(roleId => ({ userRoleId: roleId, isVerified: 'Y' }))
      ]

      // Build base payload
      const payload = {
        locationIds: locationData,
        name: values.task || '',
        frequencyId: String(selectedFrequencyId),
        userCompletId: userCompletId,
        userVerifiedId: userVerifiedId,
        description: values.description || '',
        categoryId: String(values.assetCategory),
        checkListIds: checklistData,
        domainName: domainNameParam,
        clientId: String(clientId),
        scheduleLocationMappingDtos: scheduleLocationMappingDtos,
        scheduleChecklistMappingDtos: scheduleChecklistMappingDtos,
        scheduleUserRoleMappingDtos: scheduleUserRoleMappingDtos,
        action: values.status ? 'Y' : 'N',
        frequencyGenerated: 'N'
      }

      // Add frequency-specific fields
      const showMonthField = ['MONTHLY', 'QUARTERLY', 'HALFYEARLY', 'YEARLY'].includes(frequencyName)
      const showShiftFrequencyField = frequencyName === 'SHIFT'
      const showDailyCustomField = frequencyName === 'CUSTOM'

      if (showMonthField) {
        const monthIds = Array.isArray(values.month) ? values.month : []
        const monthData = monthIds.map(monthId => {
          const month = months.find(m => m.id === monthId)
          return {
            idField: monthId,
            textField: month?.name || ''
          }
        })
        payload.month = monthData
        payload.scheduleMonthMappingDtos = monthIds.map(monthId => ({ id: monthId }))
      } else {
        payload.scheduleMonthMappingDtos = []
      }

      if (showShiftFrequencyField) {
        const shiftFrequencyIds = Array.isArray(values.shiftFrequency) ? values.shiftFrequency : []
        const shiftFrequencyData = shiftFrequencyIds.map(shiftId => {
          const shift = shiftFrequencies.find(s => s.id === shiftId)
          return {
            id: shiftId,
            name: shift?.name || ''
          }
        })
        payload.shiftFrequencyIds = shiftFrequencyData
        payload.scheduleShiftMappingDtos = shiftFrequencyIds.map(shiftId => ({ shiftId: shiftId }))
      }

      if (showDailyCustomField) {
        const customFrequencyIds = Array.isArray(values.dailyCustomHours) ? values.dailyCustomHours : []
        const customFrequencyData = customFrequencyIds.map(customId => {
          const custom = customFrequencies.find(c => c.id === customId)
          return {
            id: customId,
            hours: custom?.hours || ''
          }
        })
        payload.customFrequencyIds = customFrequencyData
        payload.scheduleCustomMappingDtos = customFrequencyIds.map(customId => ({ customMappingId: customId }))
      }

      // Add id for update mode
      if (editingRecord?.id) {
        payload.id = editingRecord.id
      }

      // Call API
      const response = await apiService.createOrUpdateScheduleMaintenance(payload)

      if (response.success) {
        notification.success({
          message: 'Success',
          description: response.message || (editingRecord ? 'Schedule maintenance updated successfully' : 'Schedule maintenance created successfully'),
          placement: 'topRight'
        })

        // Close modal and reload data
        setIsModalOpen(false)
        setEditingRecord(null)
        setEditingCategory(null)
        form.resetFields()
        
        // Reload schedules
        await loadSchedules(pagination.current, pagination.pageSize)
      } else {
        throw new Error(response.message || 'Failed to save schedule maintenance')
      }
    } catch (error) {
      console.error('Error submitting schedule maintenance:', error)
      notification.error({
        message: 'Error',
        description: error.message || 'Failed to save schedule maintenance. Please try again.',
        placement: 'topRight'
      })
    } finally {
      setModalLoading(false)
    }
  }

  const handleView = (record) => {
    setViewingRecord(record.rawData)
    setIsViewModalOpen(true)
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setViewingRecord(null)
  }

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center'
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 200,
      ellipsis: true
    },
    {
      title: 'Task',
      dataIndex: 'task',
      key: 'task',
      ellipsis: true
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 120,
      render: (frequency) => (
        <Tag color="blue">{frequency}</Tag>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      ellipsis: true,
      render: (category) => <Tag color="green">{category}</Tag>
    },
    {
      title: 'Checklist',
      dataIndex: 'checklist',
      key: 'checklist',
      width: 200,
      ellipsis: true
    },
    {
      title: 'User Role',
      dataIndex: 'userRole',
      key: 'userRole',
      width: 150,
      ellipsis: true
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            handleView(record)
          }}
          title="View Details"
        />
      )
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('scheduled-maintenance')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Scheduled Maintenance Management`} />
      </Helmet>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight="bold">
          Scheduled Maintenance
        </Typography>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="large"
          >
            Add Scheduled Maintenance
          </Button>
        </Box>

      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Table
              dataSource={schedules}
              columns={columns}
              rowKey="key"
              loading={loading}
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                style: { cursor: 'pointer' }
              })}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                pageSizeOptions: ['10', '20', '50', '100'],
                onChange: (page, pageSize) => {
                  setPagination(prev => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize
                  }))
                }
              }}
              size="middle"
            />
          )}
        </CardContent>
      </Card>

      <Modal
        title={editingRecord ? "Edit Scheduled Maintenance" : "Add Scheduled Maintenance"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={700}
        centered
        maskClosable={true}
        confirmLoading={modalLoading}
      >
        <Spin spinning={modalLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              status: true
            }}
          >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Location"
                name="location"
                rules={[{ required: true, message: 'Please select location(s)' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select Location(s)"
                  loading={locationsLoading}
                  options={locationOptions}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Asset Category"
                name="assetCategory"
                rules={[{ required: true, message: 'Please select asset category' }]}
              >
                <Select
                  placeholder="Select Asset Category"
                  options={assetCategoryOptions}
                  loading={assetCategoriesLoading}
                  showSearch
                  onChange={handleAssetCategoryChange}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Checklist"
                name="checklist"
              >
                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) =>
                    prevValues.assetCategory !== currentValues.assetCategory
                  }
                >
                  {({ getFieldValue }) => (
                    <Select
                      mode="multiple"
                      placeholder="Select Checklist"
                      options={checklistOptions}
                      loading={checklistsLoading}
                      showSearch
                      disabled={!getFieldValue('assetCategory')}
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  )}
                </Form.Item>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Task"
                name="task"
                rules={[{ required: true, message: 'Please enter task name' }]}
              >
                <Input placeholder="Enter Task Name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Frequency"
                name="frequency"
                rules={[{ required: true, message: 'Please select frequency' }]}
              >
                <Select
                  placeholder="Select Frequency"
                  options={frequencyOptions}
                  loading={frequenciesLoading}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>

            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.frequency !== currentValues.frequency}>
              {() => {
                const selectedFrequencyId = form.getFieldValue('frequency')
                const selectedFrequency = frequencies.find(f => f.id === selectedFrequencyId)
                const frequencyName = selectedFrequency?.name?.toUpperCase()
                const showMonthField = ['MONTHLY', 'QUARTERLY', 'HALFYEARLY', 'YEARLY'].includes(frequencyName)
                const showShiftFrequencyField = frequencyName === 'SHIFT'
                const showDailyCustomField = frequencyName === 'CUSTOM'

                // Clear dependent fields when not applicable
                if (!showMonthField) {
                  form.setFieldsValue({ month: undefined })
                }
                if (!showShiftFrequencyField) {
                  form.setFieldsValue({ shiftFrequency: undefined })
                }
                 if (!showDailyCustomField) {
                  form.setFieldsValue({ dailyCustomHours: undefined })
                }

                return (
                  <>
                    {showMonthField && (
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Month"
                          name="month"
                          rules={[{ required: true, message: 'Please select month(s)' }]}
                        >
                          <Select
                            mode="multiple"
                            placeholder="Select Month(s)"
                            options={monthOptions}
                            loading={monthsLoading}
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                          />
                        </Form.Item>
                      </Col>
                    )}

                    {showDailyCustomField && (
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Daily Custom Hours"
                          name="dailyCustomHours"
                          rules={[{ required: true, message: 'Please select custom hours' }]}
                        >
                          <Select
                            mode="multiple"
                            placeholder="Select Daily Custom Hours"
                            options={dailyCustomHourOptions}
                            loading={customFrequenciesLoading}
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                          />
                        </Form.Item>
                      </Col>
                    )}

                    {showShiftFrequencyField && (
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Shift Frequency"
                          name="shiftFrequency"
                          rules={[{ required: true, message: 'Please select shift frequency' }]}
                        >
                          <Select
                            mode="multiple"
                            placeholder="Select Shift Frequency"
                            options={shiftFrequencyOptions}
                            loading={shiftFrequenciesLoading}
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                          />
                        </Form.Item>
                      </Col>
                    )}
                  </>
                )
              }}
            </Form.Item>

            <Col xs={24} md={12}>
              <Form.Item
                label="Completed By"
                name="completedBy"
              >
                <Select
                  mode="multiple"
                  placeholder="Select Completed By"
                  options={userOptions}
                  loading={userRolesLoading}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Verified By"
                name="verifiedBy"
              >
                <Select
                  mode="multiple"
                  placeholder="Select Verified By"
                  options={userOptions}
                  loading={userRolesLoading}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Status"
                name="status"
                valuePropName="checked"
              >
                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) =>
                    prevValues.status !== currentValues.status
                  }
                >
                  {({ getFieldValue }) => {
                    const statusValue = getFieldValue('status')
                    return (
                      <Space>
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                        <span>{statusValue ? 'Active' : 'Inactive'}</span>
                      </Space>
                    )
                  }}
                </Form.Item>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Description"
                name="description"
              >
                <Input.TextArea rows={3} placeholder="Enter description (optional)" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Space>
          </Form.Item>
        </Form>
        </Spin>
      </Modal>

      {/* View Modal */}
      <Modal
        title="View Scheduled Maintenance Details"
        open={isViewModalOpen}
        onCancel={handleCloseViewModal}
        footer={[
          <Button key="close" onClick={handleCloseViewModal}>
            Close
          </Button>
        ]}
        width={800}
        centered
        maskClosable={true}
      >
        {viewingRecord && (
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <strong>Task Name:</strong>
                <div style={{ marginTop: 4 }}>{viewingRecord.name || '-'}</div>
              </div>

              <div>
                <strong>Description:</strong>
                <div style={{ marginTop: 4 }}>{viewingRecord.description || '-'}</div>
              </div>

              <div>
                <strong>Location(s):</strong>
                <div style={{ marginTop: 4 }}>
                  {viewingRecord.scheduleLocationMapping && viewingRecord.scheduleLocationMapping.length > 0
                    ? viewingRecord.scheduleLocationMapping.map((mapping, index) => (
                        <Tag key={index} color="blue" style={{ marginTop: 4 }}>
                          {mapping?.location?.name || '-'}
                        </Tag>
                      ))
                    : '-'}
                </div>
              </div>

              <div>
                <strong>Asset Category:</strong>
                <div style={{ marginTop: 4 }}>
                  <Tag color="green">{viewingRecord.category?.name || '-'}</Tag>
                </div>
              </div>

              <div>
                <strong>Checklist:</strong>
                <div style={{ marginTop: 4 }}>
                  {viewingRecord.scheduleChecklistMapping && viewingRecord.scheduleChecklistMapping.length > 0
                    ? viewingRecord.scheduleChecklistMapping.map((mapping, index) => (
                        <Tag key={index} color="purple" style={{ marginTop: 4 }}>
                          {mapping?.checkList?.name || '-'}
                        </Tag>
                      ))
                    : '-'}
                </div>
              </div>

              <div>
                <strong>Frequency:</strong>
                <div style={{ marginTop: 4 }}>
                  <Tag color="blue">{viewingRecord.frequency?.name || '-'}</Tag>
                </div>
              </div>

              <div>
                <strong>Completed By:</strong>
                <div style={{ marginTop: 4 }}>
                  {viewingRecord.scheduleUserRoleMapping && viewingRecord.scheduleUserRoleMapping.length > 0
                    ? viewingRecord.scheduleUserRoleMapping
                        .filter(mapping => mapping?.isVerified === 'N')
                        .map((mapping, index) => (
                          <Tag key={index} color="orange" style={{ marginTop: 4 }}>
                            {mapping?.userRole?.name || '-'}
                          </Tag>
                        ))
                    : '-'}
                </div>
              </div>

              <div>
                <strong>Verified By:</strong>
                <div style={{ marginTop: 4 }}>
                  {viewingRecord.scheduleUserRoleMapping && viewingRecord.scheduleUserRoleMapping.length > 0
                    ? viewingRecord.scheduleUserRoleMapping
                        .filter(mapping => mapping?.isVerified === 'Y')
                        .map((mapping, index) => (
                          <Tag key={index} color="cyan" style={{ marginTop: 4 }}>
                            {mapping?.userRole?.name || '-'}
                          </Tag>
                        ))
                    : '-'}
                </div>
              </div>

              <div>
                <strong>Status:</strong>
                <div style={{ marginTop: 4 }}>
                  <Tag color={viewingRecord.action === 'Y' ? 'success' : 'default'}>
                    {viewingRecord.action === 'Y' ? 'Active' : 'Inactive'}
                  </Tag>
                </div>
              </div>
            </Space>
          </div>
        )}
      </Modal>
      </Box>
    </>
  )
}

