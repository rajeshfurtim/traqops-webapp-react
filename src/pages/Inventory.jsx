import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Grid, Typography, Card, CardContent, CircularProgress, LinearProgress, Chip } from '@mui/material'
import { Table, Tag, Progress } from 'antd'
import { mockApi } from '../services/api'
import { getPageTitle, APP_CONFIG } from '../config/constants'

export default function Inventory() {
  const [loading, setLoading] = useState(true)
  const [inventoryData, setInventoryData] = useState(null)

  useEffect(() => {
    loadInventoryData()
  }, [])

  const loadInventoryData = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getInventoryData()
      setInventoryData(response.data)
    } catch (error) {
      console.error('Error loading inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (!inventoryData) {
    return <Typography>No data available</Typography>
  }

  const getStockStatus = (item) => {
    if (item.quantity === 0) return { status: 'Out of Stock', color: 'error' }
    if (item.quantity < item.minQuantity) return { status: 'Low Stock', color: 'warning' }
    return { status: 'In Stock', color: 'success' }
  }

  const getStockPercentage = (item) => {
    return Math.round((item.quantity / item.maxQuantity) * 100)
  }

  const summaryCards = [
    {
      title: 'Total Items',
      value: inventoryData.summary.totalItems.toLocaleString(),
      color: '#1976d2'
    },
    {
      title: 'Total Value',
      value: `$${inventoryData.summary.totalValue.toLocaleString()}`,
      color: '#2e7d32'
    },
    {
      title: 'Low Stock Items',
      value: inventoryData.summary.lowStockItems,
      color: '#ed6c02'
    },
    {
      title: 'Out of Stock',
      value: inventoryData.summary.outOfStockItems,
      color: '#d32f2f'
    }
  ]

  const columns = [
    {
      title: 'Item ID',
      dataIndex: 'id',
      key: 'id',
      width: 120
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category) => <Tag color="blue">{category}</Tag>
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      sorter: (a, b) => a.quantity - b.quantity
    },
    {
      title: 'Stock Level',
      key: 'stockLevel',
      width: 200,
      render: (_, record) => {
        const percentage = getStockPercentage(record)
        const status = getStockStatus(record)
        return (
          <Box>
            <Progress
              percent={percentage}
              status={status.status === 'Out of Stock' ? 'exception' : 'active'}
              size="small"
            />
            <Typography variant="caption" color="text.secondary">
              {record.quantity} / {record.maxQuantity}
            </Typography>
          </Box>
        )
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, record) => {
        const stockInfo = getStockStatus(record)
        return (
          <Chip
            label={stockInfo.status}
            color={stockInfo.color}
            size="small"
          />
        )
      }
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      render: (price) => `$${price.toFixed(2)}`
    },
    {
      title: 'Total Value',
      dataIndex: 'totalValue',
      key: 'totalValue',
      width: 120,
      render: (value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 200
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('inventory')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Inventory Management System`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Inventory Management
        </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  {card.title}
                </Typography>
                <Typography variant="h4" component="div" sx={{ color: card.color, fontWeight: 'bold' }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Inventory Table */}
      <Card>
        <CardContent>
          <Table
            dataSource={inventoryData.items}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        </CardContent>
      </Card>
      </Box>
    </>
  )
}

