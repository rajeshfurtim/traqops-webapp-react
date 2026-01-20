import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Tag, Button, Modal, Form, Input, Select, Switch, Space, Spin } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { apiService } from '../services/api'
import { getPageTitle, APP_CONFIG } from '../config/constants'
import { useGetLocationList } from '../hooks/useGetLocationList'
import { useAuth } from '../context/AuthContext'
import { domainName } from '../config/apiConfig'

export default function ScheduledMaintenance() {
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
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
  const [form] = Form.useForm()
  const { user } = useAuth()
  
  // Fetch locations from API using custom hook
  const { locations, loading: locationsLoading } = useGetLocationList()

  useEffect(() => {
    loadFrequencies()
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
        // If there are pending checklist IDs, map them correctly
        if (pendingChecklistIds.length > 0) {
          setTimeout(() => {
            // Map checkList.id from scheduleChecklistMapping to checklistId from API
            const mappedIds = []
            
            pendingChecklistIds.forEach(scheduleId => {
              // Try to find exact match first
              let found = response.data.find(cl => 
                cl.checklistId === scheduleId || 
                cl.id === scheduleId
              )
              
              // If not found, try string comparison
              if (!found) {
                found = response.data.find(cl => 
                  String(cl.checklistId) === String(scheduleId) ||
                  String(cl.id) === String(scheduleId)
                )
              }
              
              // Use the checklistId from API if found, otherwise use scheduleId directly
              if (found) {
                mappedIds.push(found.checklistId || found.id)
              } else {
                // If not found in API response, use scheduleId directly
                // The scheduleChecklistData should have this ID in options
                mappedIds.push(scheduleId)
              }
            })
            
            // Set the form field with mapped IDs
            if (mappedIds.length > 0) {
              form.setFieldsValue({ checklist: mappedIds })
            } else if (pendingChecklistIds.length > 0) {
              // If mapping failed, use scheduleChecklistIds directly
              // They should work since scheduleChecklistData has them in options
              form.setFieldsValue({ checklist: pendingChecklistIds })
            }
            setPendingChecklistIds([])
          }, 600)
        } else {
          // Even if no pending IDs, ensure form is updated after checklists load
          // This helps if checklist was set before checklists loaded
          setTimeout(() => {
            const currentChecklist = form.getFieldValue('checklist')
            if (currentChecklist && Array.isArray(currentChecklist)) {
              form.setFieldsValue({ checklist: currentChecklist })
            }
          }, 100)
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
      
      // Set form values - checklist will be set after checklists load
      form.setFieldsValue({
        location: locationIds,
        assetCategory: assetCategoryId,
        task: item.name || '',
        frequency: item.frequency?.id,
        completedBy: completedByIds,
        verifiedBy: verifiedByIds,
        description: item.description || '',
        status: item.action === 'Y'
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
        // Store checklist IDs to set after checklists are loaded
        setPendingChecklistIds(scheduleChecklistIds)
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

  const handleSubmit = (values) => {
    const payload = {
      ...values,
      status: values.status ? 'Active' : 'Inactive'
    }
    console.log('Form payload:', payload)
    // TODO: Call API to create scheduled maintenance
    setIsModalOpen(false)
    form.resetFields()
    // Optionally reload schedules after successful creation
    // loadSchedules()
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
        maskClosable={false}
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

          <Form.Item
            label="Checklist"
            name="checklist"
          >
            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.assetCategory !== currentValues.assetCategory}>
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

          <Form.Item
            label="Task"
            name="task"
            rules={[{ required: true, message: 'Please enter task name' }]}
          >
            <Input placeholder="Enter Task Name" />
          </Form.Item>

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

          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea rows={3} placeholder="Enter description (optional)" />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            valuePropName="checked"
          >
            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}>
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
      </Box>
    </>
  )
}

