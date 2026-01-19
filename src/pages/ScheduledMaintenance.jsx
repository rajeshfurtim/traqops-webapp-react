import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress, Chip } from '@mui/material'
import { Table, Tag, Button, Modal, Form, Input, Select, Checkbox, Switch, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi, apiService } from '../services/api'
import { getPageTitle, APP_CONFIG } from '../config/constants'
import { useGetLocationList } from '../hooks/useGetLocationList'
import { useAuth } from '../context/AuthContext'
import { domainName } from '../config/apiConfig'

export default function ScheduledMaintenance() {
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [assetCategories, setAssetCategories] = useState([])
  const [assetCategoriesLoading, setAssetCategoriesLoading] = useState(false)
  const [checklists, setChecklists] = useState([])
  const [checklistsLoading, setChecklistsLoading] = useState(false)
  const [frequencies, setFrequencies] = useState([])
  const [frequenciesLoading, setFrequenciesLoading] = useState(false)
  const [userRoles, setUserRoles] = useState([])
  const [userRolesLoading, setUserRolesLoading] = useState(false)
  const [form] = Form.useForm()
  const { user } = useAuth()
  
  // Fetch locations from API using custom hook
  const { locations, loading: locationsLoading } = useGetLocationList()

  useEffect(() => {
    loadSchedules()
    loadFrequencies()
  }, [])

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
        setAssetCategories(response.data.content)
      } else {
        setAssetCategories([])
      }
    } catch (error) {
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

  const loadSchedules = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getScheduledMaintenance()
      setSchedules(response.data.schedules)
    } catch (error) {
      console.error('Error loading schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Scheduled': 'success',
      'Overdue': 'error',
      'In Progress': 'info',
      'Completed': 'default'
    }
    return colors[status] || 'default'
  }

  const getFrequencyColor = (frequency) => {
    const colors = {
      'Monthly': '#1976d2',
      'Quarterly': '#2e7d32',
      'Semi-Annual': '#ed6c02',
      'Annual': '#9c27b0'
    }
    return colors[frequency] || '#000'
  }

  // Asset Category options from API - filter by isCategory === "Y" and map name to label
  const assetCategoryOptions = Array.isArray(assetCategories) && assetCategories.length > 0
    ? assetCategories
        .filter(category => category?.isCategory === 'Y')
        .map(category => ({ 
          label: category?.name || 'Unknown', 
          value: category?.id 
        }))
    : []

  // Checklist options from API - map checklistName to label
  const checklistOptions = Array.isArray(checklists) && checklists.length > 0
    ? checklists.map(checklist => ({ 
        label: checklist?.checklistName || 'Unknown', 
        value: checklist?.checklistId 
      }))
    : []

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
    setIsModalOpen(true)
    form.setFieldsValue({ status: true, checklist: [] })
  }

  const handleCancel = () => {
    setIsModalOpen(false)
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
      title: 'Schedule ID',
      dataIndex: 'id',
      key: 'id',
      width: 150
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 120,
      render: (frequency) => (
        <Chip
          label={frequency}
          size="small"
          sx={{ bgcolor: getFrequencyColor(frequency), color: 'white', fontWeight: 'bold' }}
        />
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Chip label={status} color={getStatusColor(status)} size="small" />
      )
    },
    {
      title: 'Next Due',
      dataIndex: 'nextDue',
      key: 'nextDue',
      width: 150,
      render: (text) => dayjs(text).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.nextDue).unix() - dayjs(b.nextDue).unix()
    },
    {
      title: 'Last Completed',
      dataIndex: 'lastCompleted',
      key: 'lastCompleted',
      width: 150,
      render: (text) => dayjs(text).format('MMM DD, YYYY')
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 150
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 200
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => <Tag color="blue">{category}</Tag>
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
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="middle"
            />
          )}
        </CardContent>
      </Card>

      <Modal
        title="Add Scheduled Maintenance"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={700}
        centered
        maskClosable={false}
      >
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
      </Modal>
      </Box>
    </>
  )
}

