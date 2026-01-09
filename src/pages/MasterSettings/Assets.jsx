import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Space, Button as AntButton, Tag, Popconfirm, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { mockApi } from '../../services/api'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import MasterEditModal from '../../components/MasterEditModal'

export default function AssetsMaster() {
  const [loading, setLoading] = useState(true)
  const [assets, setAssets] = useState([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getAssets()
      setAssets(response.data.assets || [])
    } catch (error) {
      console.error('Error loading assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Asset ID',
      dataIndex: 'assetId',
      key: 'assetId',
      width: 120
    },
    {
      title: 'Asset Name',
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
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
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
          <Popconfirm title="Delete this asset?" onConfirm={() => {}}>
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
    loadAssets()
  }

  const assetFields = [
    {
      name: 'assetId',
      label: 'Asset ID',
      type: 'input',
      disabled: true,
      rules: [{ required: true, message: 'Asset ID is required' }]
    },
    {
      name: 'name',
      label: 'Asset Name',
      type: 'input',
      rules: [{ required: true, message: 'Asset name is required' }]
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'Equipment', label: 'Equipment' },
        { value: 'Vehicle', label: 'Vehicle' },
        { value: 'Building', label: 'Building' },
        { value: 'IT', label: 'IT' }
      ],
      rules: [{ required: true, message: 'Category is required' }]
    },
    {
      name: 'location',
      label: 'Location',
      type: 'input',
      rules: [{ required: true, message: 'Location is required' }]
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
        <title>{getPageTitle('master-settings/assets')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Assets Master Settings`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Assets Master Settings
        </Typography>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <AntButton type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                Add Asset
              </AntButton>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Table
                dataSource={assets}
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
          onCreate={mockApi.createAsset}
          onUpdate={mockApi.updateAsset}
          fields={assetFields}
          title={selectedRecord ? 'Edit Asset' : 'Add Asset'}
          successMessage={selectedRecord ? 'Asset updated successfully' : 'Asset created successfully'}
        />
      </Box>
    </>
  )
}

