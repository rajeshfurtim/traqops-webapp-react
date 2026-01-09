import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Space, Button as AntButton, Tag, Popconfirm, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { mockApi } from '../../services/api'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import MasterEditModal from '../../components/MasterEditModal'

export default function KPIsMaster() {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  useEffect(() => {
    loadKPIs()
  }, [])

  const loadKPIs = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getKPIs()
      setKpis(response.data.kpis || [])
    } catch (error) {
      console.error('Error loading KPIs:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'KPI ID',
      dataIndex: 'kpiId',
      key: 'kpiId',
      width: 120
    },
    {
      title: 'KPI Name',
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
      title: 'Target Value',
      dataIndex: 'targetValue',
      key: 'targetValue',
      width: 120,
      align: 'right'
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
          <Popconfirm title="Delete this KPI?" onConfirm={() => {}}>
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
    loadKPIs()
  }

  const kpiFields = [
    {
      name: 'kpiId',
      label: 'KPI ID',
      type: 'input',
      disabled: true,
      rules: [{ required: true, message: 'KPI ID is required' }]
    },
    {
      name: 'name',
      label: 'KPI Name',
      type: 'input',
      rules: [{ required: true, message: 'KPI name is required' }]
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'Performance', label: 'Performance' },
        { value: 'Quality', label: 'Quality' },
        { value: 'Safety', label: 'Safety' },
        { value: 'Efficiency', label: 'Efficiency' }
      ],
      rules: [{ required: true, message: 'Category is required' }]
    },
    {
      name: 'targetValue',
      label: 'Target Value',
      type: 'input',
      rules: [{ required: true, message: 'Target value is required' }]
    },
    {
      name: 'unit',
      label: 'Unit',
      type: 'select',
      options: [
        { value: '%', label: '%' },
        { value: 'Count', label: 'Count' },
        { value: 'Hours', label: 'Hours' },
        { value: 'Days', label: 'Days' }
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
        <title>{getPageTitle('master-settings/kpis')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - KPIs Master Settings`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          KPIs Master Settings
        </Typography>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <AntButton type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                Add KPI
              </AntButton>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Table
                dataSource={kpis}
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
          onCreate={mockApi.createKPI}
          onUpdate={mockApi.updateKPI}
          fields={kpiFields}
          title={selectedRecord ? 'Edit KPI' : 'Add KPI'}
          successMessage={selectedRecord ? 'KPI updated successfully' : 'KPI created successfully'}
        />
      </Box>
    </>
  )
}

