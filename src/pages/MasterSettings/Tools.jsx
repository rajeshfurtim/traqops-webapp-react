import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Space, Button as AntButton, Tag, Popconfirm, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { mockApi } from '../../services/api'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import MasterEditModal from '../../components/MasterEditModal'

export default function ToolsMaster() {
  const [loading, setLoading] = useState(true)
  const [tools, setTools] = useState([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  useEffect(() => {
    loadTools()
  }, [])

  const loadTools = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getTools()
      setTools(response.data.tools || [])
    } catch (error) {
      console.error('Error loading tools:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Tool ID',
      dataIndex: 'toolId',
      key: 'toolId',
      width: 120
    },
    {
      title: 'Tool Name',
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={status === 'Available' ? 'green' : 'orange'}>{status}</Tag>
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
          <Popconfirm title="Delete this tool?" onConfirm={() => {}}>
            <AntButton type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  const handleEdit = (record) => {
    setSelectedRecord(record)
    setIsEditModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setSelectedRecord(null)
  }

  const handleUpdateSuccess = () => {
    loadTools()
  }

  const toolFields = [
    {
      name: 'toolId',
      label: 'Tool ID',
      type: 'input',
      disabled: true,
      rules: [{ required: true, message: 'Tool ID is required' }]
    },
    {
      name: 'name',
      label: 'Tool Name',
      type: 'input',
      rules: [{ required: true, message: 'Tool name is required' }]
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'Hand Tools', label: 'Hand Tools' },
        { value: 'Power Tools', label: 'Power Tools' },
        { value: 'Measuring', label: 'Measuring' },
        { value: 'Safety', label: 'Safety' }
      ],
      rules: [{ required: true, message: 'Category is required' }]
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'Available', label: 'Available' },
        { value: 'In Use', label: 'In Use' }
      ],
      rules: [{ required: true, message: 'Status is required' }]
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('master-settings/tools')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Tools Master Settings`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Tools Master Settings
        </Typography>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <AntButton type="primary" icon={<PlusOutlined />}>
                Add Tool
              </AntButton>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Table
                dataSource={tools}
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
          onUpdate={mockApi.updateTool}
          fields={toolFields}
          title="Edit Tool"
          successMessage="Tool updated successfully"
        />
      </Box>
    </>
  )
}

