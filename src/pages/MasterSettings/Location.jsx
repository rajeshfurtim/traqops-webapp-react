import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Space, Button as AntButton, Tag, Popconfirm, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { mockApi } from '../../services/api'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import MasterEditModal from '../../components/MasterEditModal'

export default function LocationMaster() {
  const [loading, setLoading] = useState(true)
  const [locations, setLocations] = useState([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getLocations()
      setLocations(response.data.locations || [])
    } catch (error) {
      console.error('Error loading locations:', error)
    } finally {
      setLoading(false)
    }
  }

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
    loadLocations()
  }

  const locationFields = [
    {
      name: 'locationId',
      label: 'Location ID',
      type: 'input',
      disabled: true,
      rules: [{ required: true, message: 'Location ID is required' }]
    },
    {
      name: 'name',
      label: 'Location Name',
      type: 'input',
      rules: [{ required: true, message: 'Location name is required' }]
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea',
      rules: [{ required: true, message: 'Address is required' }]
    },
    {
      name: 'city',
      label: 'City',
      type: 'input',
      rules: [{ required: true, message: 'City is required' }]
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

  const columns = [
    {
      title: 'Location ID',
      dataIndex: 'locationId',
      key: 'locationId',
      width: 120
    },
    {
      title: 'Location Name',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      width: 300
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 150
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
          <Popconfirm title="Delete this location?" onConfirm={() => {}}>
            <AntButton type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('master-settings/location')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Location Master Settings`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Location Master Settings
        </Typography>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <AntButton type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                Add Location
              </AntButton>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Table
                dataSource={locations}
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
          onCreate={mockApi.createLocation}
          onUpdate={mockApi.updateLocation}
          fields={locationFields}
          title={selectedRecord ? 'Edit Location' : 'Add Location'}
          successMessage={selectedRecord ? 'Location updated successfully' : 'Location created successfully'}
        />
      </Box>
    </>
  )
}

