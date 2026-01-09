import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Space, Button as AntButton, Tag, Popconfirm, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { mockApi } from '../../services/api'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import MasterEditModal from '../../components/MasterEditModal'

export default function ChecklistMaster() {
  const [loading, setLoading] = useState(true)
  const [checklists, setChecklists] = useState([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  useEffect(() => {
    loadChecklists()
  }, [])

  const loadChecklists = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getChecklists()
      setChecklists(response.data.checklists || [])
    } catch (error) {
      console.error('Error loading checklists:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Checklist ID',
      dataIndex: 'checklistId',
      key: 'checklistId',
      width: 120
    },
    {
      title: 'Checklist Name',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 150
    },
    {
      title: 'Items Count',
      dataIndex: 'itemsCount',
      key: 'itemsCount',
      width: 120,
      align: 'right'
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
          <Popconfirm title="Delete this checklist?" onConfirm={() => {}}>
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
    loadChecklists()
  }

  const checklistFields = [
    {
      name: 'checklistId',
      label: 'Checklist ID',
      type: 'input',
      disabled: true,
      rules: [{ required: true, message: 'Checklist ID is required' }]
    },
    {
      name: 'name',
      label: 'Checklist Name',
      type: 'input',
      rules: [{ required: true, message: 'Checklist name is required' }]
    },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'Maintenance', label: 'Maintenance' },
        { value: 'Operation', label: 'Operation' },
        { value: 'Safety', label: 'Safety' },
        { value: 'Inspection', label: 'Inspection' }
      ],
      rules: [{ required: true, message: 'Type is required' }]
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
        <title>{getPageTitle('master-settings/checklist')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Checklist Master Settings`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Checklist Master Settings
        </Typography>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <AntButton type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                Add Checklist
              </AntButton>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Table
                dataSource={checklists}
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
          onCreate={mockApi.createChecklist}
          onUpdate={mockApi.updateChecklist}
          fields={checklistFields}
          title={selectedRecord ? 'Edit Checklist' : 'Add Checklist'}
          successMessage={selectedRecord ? 'Checklist updated successfully' : 'Checklist created successfully'}
        />
      </Box>
    </>
  )
}

