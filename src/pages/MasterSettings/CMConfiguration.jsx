import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Space, Button as AntButton, Tag, Popconfirm, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { mockApi } from '../../services/api'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import MasterEditModal from '../../components/MasterEditModal'

export default function CMConfiguration() {
  const [loading, setLoading] = useState(true)
  const [configs, setConfigs] = useState([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getCMConfigurations()
      setConfigs(response.data.configs || [])
    } catch (error) {
      console.error('Error loading CM configurations:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Config ID',
      dataIndex: 'configId',
      key: 'configId',
      width: 120
    },
    {
      title: 'Configuration Name',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 150
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      width: 200
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <AntButton 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm title="Delete this configuration?" onConfirm={() => {}}>
            <AntButton type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  const handleAdd = () => {
    setSelectedRecord(null)
    setIsEditModalOpen(true)
  }

  const handleEdit = (record) => {
    setSelectedRecord(record)
    setIsEditModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setSelectedRecord(null)
  }

  const handleUpdateSuccess = () => {
    loadConfigs()
  }

  const configFields = [
    {
      name: 'configId',
      label: 'Config ID',
      type: 'input',
      disabled: true,
      rules: [{ required: true, message: 'Config ID is required' }]
    },
    {
      name: 'name',
      label: 'Configuration Name',
      type: 'input',
      rules: [{ required: true, message: 'Configuration name is required' }]
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'System', label: 'System' },
        { value: 'Workflow', label: 'Workflow' },
        { value: 'Notification', label: 'Notification' },
        { value: 'Integration', label: 'Integration' }
      ],
      rules: [{ required: true, message: 'Category is required' }]
    },
    {
      name: 'value',
      label: 'Value',
      type: 'input',
      rules: [{ required: true, message: 'Value is required' }]
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' }
      ],
      rules: [{ required: true, message: 'Status is required' }]
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('master-settings/cm-configuration')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - CM Configuration Settings`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          CM Configuration Settings
        </Typography>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <AntButton type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                Add Configuration
              </AntButton>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Table
                dataSource={configs}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 20 }}
                size="middle"
              />
            )}
          </CardContent>
        </Card>

        <MasterEditModal
          open={isEditModalOpen}
          record={selectedRecord}
          onClose={handleCloseModal}
          onSuccess={handleUpdateSuccess}
          onCreate={mockApi.createCMConfiguration}
          onUpdate={mockApi.updateCMConfiguration}
          fields={configFields}
          title={selectedRecord ? 'Edit CM Configuration' : 'Add CM Configuration'}
          successMessage={selectedRecord ? 'Configuration updated successfully' : 'Configuration created successfully'}
        />
      </Box>
    </>
  )
}

