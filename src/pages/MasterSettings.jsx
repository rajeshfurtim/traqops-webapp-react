import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress, Button, Chip } from '@mui/material'
import { Table, Tabs, Modal, Form, Input, Switch, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { mockApi } from '../services/api'
import { getPageTitle, APP_CONFIG } from '../config/constants'

export default function MasterSettings() {
  const [loading, setLoading] = useState(true)
  const [settingsData, setSettingsData] = useState(null)
  const [activeTab, setActiveTab] = useState('categories')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getMasterSettings()
      setSettingsData(response.data)
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalOpen(true)
  }

  const handleDelete = async (id, type) => {
    try {
      await mockApi.deleteCategory(id)
      message.success('Item deleted successfully')
      loadSettings()
    } catch (error) {
      message.error('Failed to delete item')
    }
  }

  const handleSave = async (values) => {
    try {
      if (editingItem) {
        await mockApi.updateCategory(editingItem.id, values)
        message.success('Item updated successfully')
      } else {
        await mockApi.createCategory(values)
        message.success('Item created successfully')
      }
      setModalOpen(false)
      form.resetFields()
      loadSettings()
    } catch (error) {
      message.error('Failed to save item')
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (!settingsData) {
    return <Typography>No data available</Typography>
  }

  const categoryColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      width: 100,
      render: (active) => (
        <Chip
          label={active ? 'Active' : 'Inactive'}
          color={active ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this item?"
            onConfirm={() => handleDelete(record.id, 'category')}
            okText="Yes"
            cancelText="No"
          >
            <Button
              size="small"
              color="error"
              startIcon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Box>
      )
    }
  ]

  const priorityColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
      width: 100,
      render: (color) => (
        <Box
          sx={{
            width: 30,
            height: 20,
            bgcolor: color,
            borderRadius: 1
          }}
        />
      )
    },
    {
      title: 'SLA (Hours)',
      dataIndex: 'slaHours',
      key: 'slaHours',
      width: 120
    }
  ]

  const locationColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address'
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      width: 100,
      render: (active) => (
        <Chip
          label={active ? 'Active' : 'Inactive'}
          color={active ? 'success' : 'default'}
          size="small"
        />
      )
    }
  ]

  const supplierColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Contact',
      dataIndex: 'contact',
      key: 'contact'
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      width: 100,
      render: (active) => (
        <Chip
          label={active ? 'Active' : 'Inactive'}
          color={active ? 'success' : 'default'}
          size="small"
        />
      )
    }
  ]

  const tabItems = useMemo(() => [
    {
      key: 'categories',
      label: 'Categories',
      children: (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add Category
            </Button>
          </Box>
          <Table
            dataSource={settingsData.categories}
            columns={categoryColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        </>
      )
    },
    {
      key: 'priorities',
      label: 'Priorities',
      children: (
        <Table
          dataSource={settingsData.priorities}
          columns={priorityColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      )
    },
    {
      key: 'locations',
      label: 'Locations',
      children: (
        <Table
          dataSource={settingsData.locations}
          columns={locationColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      )
    },
    {
      key: 'suppliers',
      label: 'Suppliers',
      children: (
        <Table
          dataSource={settingsData.suppliers}
          columns={supplierColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      )
    }
  ], [settingsData, categoryColumns, priorityColumns, locationColumns, supplierColumns, handleAdd])

  return (
    <>
      <Helmet>
        <title>{getPageTitle('master-settings')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Master Settings Configuration`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Master Settings
        </Typography>

      <Card>
        <CardContent>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            style={{ marginBottom: 16 }}
          />
        </CardContent>
      </Card>

      <Modal
        title={editingItem ? 'Edit Category' : 'Add Category'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        okText="Save"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={3} placeholder="Enter description" />
          </Form.Item>
          <Form.Item
            name="active"
            label="Active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
      </Box>
    </>
  )
}

