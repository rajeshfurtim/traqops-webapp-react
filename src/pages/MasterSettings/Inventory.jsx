import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Space, Button as AntButton, Tag, Popconfirm, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { mockApi } from '../../services/api'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import MasterEditModal from '../../components/MasterEditModal'

export default function InventoryMaster() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getInventoryItems()
      setItems(response.data.items || [])
    } catch (error) {
      console.error('Error loading inventory items:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 120
    },
    {
      title: 'Item Name',
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
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      width: 100
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
          <Popconfirm title="Delete this item?" onConfirm={() => {}}>
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
    loadInventory()
  }

  const inventoryFields = [
    {
      name: 'itemCode',
      label: 'Item Code',
      type: 'input',
      disabled: true,
      rules: [{ required: true, message: 'Item code is required' }]
    },
    {
      name: 'name',
      label: 'Item Name',
      type: 'input',
      rules: [{ required: true, message: 'Item name is required' }]
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'Spare Parts', label: 'Spare Parts' },
        { value: 'Tools', label: 'Tools' },
        { value: 'Consumables', label: 'Consumables' },
        { value: 'Equipment', label: 'Equipment' }
      ],
      rules: [{ required: true, message: 'Category is required' }]
    },
    {
      name: 'unit',
      label: 'Unit',
      type: 'select',
      options: [
        { value: 'Pcs', label: 'Pcs' },
        { value: 'Kg', label: 'Kg' },
        { value: 'Liters', label: 'Liters' },
        { value: 'Units', label: 'Units' }
      ],
      rules: [{ required: true, message: 'Unit is required' }]
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
        <title>{getPageTitle('master-settings/inventory')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Inventory Master Settings`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Inventory Master Settings
        </Typography>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <AntButton type="primary" icon={<PlusOutlined />}>
                Add Item
              </AntButton>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Table
                dataSource={items}
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
          onUpdate={mockApi.updateInventoryItem}
          fields={inventoryFields}
          title="Edit Inventory Item"
          successMessage="Inventory item updated successfully"
        />
      </Box>
    </>
  )
}

