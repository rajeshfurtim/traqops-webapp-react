import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Space, Button as AntButton, Tag, Popconfirm, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { mockApi } from '../../services/api'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import MasterEditModal from '../../components/MasterEditModal'

export default function ShiftsMaster() {
  const [loading, setLoading] = useState(true)
  const [shifts, setShifts] = useState([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  useEffect(() => {
    loadShifts()
  }, [])

  const loadShifts = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getShifts()
      setShifts(response.data.shifts || [])
    } catch (error) {
      console.error('Error loading shifts:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Shift ID',
      dataIndex: 'shiftId',
      key: 'shiftId',
      width: 120
    },
    {
      title: 'Shift Name',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: 'Duration (Hours)',
      dataIndex: 'duration',
      key: 'duration',
      width: 130
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
          <Popconfirm title="Delete this shift?" onConfirm={() => {}}>
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
    loadShifts()
  }

  const shiftFields = [
    {
      name: 'shiftId',
      label: 'Shift ID',
      type: 'input',
      disabled: true,
      rules: [{ required: true, message: 'Shift ID is required' }]
    },
    {
      name: 'name',
      label: 'Shift Name',
      type: 'input',
      rules: [{ required: true, message: 'Shift name is required' }]
    },
    {
      name: 'startTime',
      label: 'Start Time',
      type: 'input',
      placeholder: 'HH:mm (e.g., 06:00)',
      rules: [{ required: true, message: 'Start time is required' }]
    },
    {
      name: 'endTime',
      label: 'End Time',
      type: 'input',
      placeholder: 'HH:mm (e.g., 14:00)',
      rules: [{ required: true, message: 'End time is required' }]
    },
    {
      name: 'duration',
      label: 'Duration (Hours)',
      type: 'input',
      rules: [{ required: true, message: 'Duration is required' }]
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
        <title>{getPageTitle('master-settings/shifts')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Shifts Master Settings`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Shifts Master Settings
        </Typography>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <AntButton type="primary" icon={<PlusOutlined />}>
                Add Shift
              </AntButton>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Table
                dataSource={shifts}
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
          onUpdate={mockApi.updateShift}
          fields={shiftFields}
          title="Edit Shift"
          successMessage="Shift updated successfully"
        />
      </Box>
    </>
  )
}

