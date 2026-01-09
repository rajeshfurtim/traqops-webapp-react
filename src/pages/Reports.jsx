import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Form, Select, DatePicker, Button as AntButton, Space } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { mockApi } from '../services/api'
import { getPageTitle, APP_CONFIG } from '../config/constants'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const { RangePicker } = DatePicker

const COLORS = ['#dc3545', '#28a745', '#3498db', '#e74c3c', '#f39c12', '#9b59b6']

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [reportsData, setReportsData] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadReportsData()
  }, [])

  const loadReportsData = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getReportsData()
      setReportsData(response.data)
    } catch (error) {
      console.error('Error loading reports data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    // Mock download functionality
    console.log('Downloading report...')
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (!reportsData) {
    return <Typography>No data available</Typography>
  }

  // Create gradient function for bar charts
  const createGradient = (ctx, colorStart, colorMid, colorEnd) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400)
    gradient.addColorStop(0, colorStart)
    gradient.addColorStop(0.5, colorMid)
    gradient.addColorStop(1, colorEnd)
    return gradient
  }

  const createHorizontalGradient = (ctx, colorStart, colorEnd) => {
    const gradient = ctx.createLinearGradient(0, 0, 400, 0)
    gradient.addColorStop(0, colorStart)
    gradient.addColorStop(1, colorEnd)
    return gradient
  }

  // Maintenance Costs Chart
  const maintenanceCostsConfig = {
    labels: reportsData.maintenanceCosts.map(item => item.month),
    datasets: [
      {
        label: 'Corrective Maintenance',
        data: reportsData.maintenanceCosts.map(item => item.corrective),
        backgroundColor: (context) => {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) return '#dc3545'
          return createGradient(ctx, '#dc3545', '#c82333', '#bd2130')
        },
        borderColor: '#c82333',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      },
      {
        label: 'Scheduled Maintenance',
        data: reportsData.maintenanceCosts.map(item => item.scheduled),
        backgroundColor: (context) => {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) return '#28a745'
          return createGradient(ctx, '#28a745', '#218838', '#1e7e34')
        },
        borderColor: '#218838',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }
    ]
  }

  const maintenanceCostsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 15,
          font: { size: 13, weight: 500 },
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#e0e0e0',
        borderWidth: 2,
        padding: 12,
        titleFont: { size: 15, weight: 'bold' },
        bodyFont: { size: 14 },
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: { size: 12 },
          color: '#666',
          maxRotation: 45,
          minRotation: 45
        },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: 12 },
          color: '#666',
          callback: (value) => `$${value.toLocaleString()}`
        },
        title: {
          display: true,
          text: 'Cost ($)',
          font: { size: 13, weight: 500 },
          color: '#666'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart',
      delay: (context) => context.dataIndex * 100
    }
  }

  // Ticket Status Pie Chart
  const ticketStatusTotal = reportsData.ticketStatus.reduce((sum, item) => sum + item.count, 0)
  const ticketStatusConfig = {
    labels: reportsData.ticketStatus.map(item => item.status),
    datasets: [
      {
        label: 'Ticket Status',
        data: reportsData.ticketStatus.map(item => item.count),
        backgroundColor: COLORS,
        borderColor: COLORS.map(color => color),
        borderWidth: 3,
        hoverBorderWidth: 5,
        hoverOffset: 10
      }
    ]
  }

  const ticketStatusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 13, weight: 500 },
          usePointStyle: true,
          generateLabels: (chart) => {
            const data = chart.data
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0]
                const value = dataset.data[i]
                const percentage = ticketStatusTotal > 0 ? ((value / ticketStatusTotal) * 100).toFixed(1) : 0
                return {
                  text: `${label}: ${value} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor[i],
                  lineWidth: dataset.borderWidth,
                  hidden: false,
                  index: i
                }
              })
            }
            return []
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#e0e0e0',
        borderWidth: 2,
        padding: 12,
        titleFont: { size: 16, weight: 'bold' },
        bodyFont: { size: 14 },
        callbacks: {
          label: (context) => {
            const label = context.label || ''
            const value = context.parsed || 0
            const percentage = ticketStatusTotal > 0 ? ((value / ticketStatusTotal) * 100).toFixed(1) : 0
            return [
              `${label}: ${value.toLocaleString()}`,
              `Percentage: ${percentage}%`
            ]
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeOutQuart'
    }
  }

  // Category Breakdown Horizontal Bar Chart
  const categoryBreakdownConfig = {
    labels: reportsData.categoryBreakdown.map(item => item.category),
    datasets: [
      {
        label: 'Count',
        data: reportsData.categoryBreakdown.map(item => item.count),
        backgroundColor: (context) => {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) return '#3498db'
          return createHorizontalGradient(ctx, '#3498db', '#2980b9')
        },
        borderColor: '#2980b9',
        borderWidth: 2,
        borderRadius: 8
      },
      {
        label: 'Cost ($)',
        data: reportsData.categoryBreakdown.map(item => item.cost),
        backgroundColor: (context) => {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) return '#e74c3c'
          return createHorizontalGradient(ctx, '#e74c3c', '#c0392b')
        },
        borderColor: '#c0392b',
        borderWidth: 2,
        borderRadius: 8
      }
    ]
  }

  const categoryBreakdownOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 15,
          font: { size: 13, weight: 500 },
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#e0e0e0',
        borderWidth: 2,
        padding: 12,
        titleFont: { size: 15, weight: 'bold' },
        bodyFont: { size: 14 },
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || ''
            const value = context.parsed.x || 0
            if (label === 'Cost ($)') {
              return `${label}: $${value.toLocaleString()}`
            }
            return `${label}: ${value.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          font: { size: 12 },
          color: '#666',
          callback: (value) => value.toLocaleString()
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      },
      y: {
        ticks: {
          font: { size: 12 },
          color: '#666'
        },
        grid: { display: false }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart',
      delay: (context) => context.dataIndex * 100
    }
  }

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Reports & Analytics`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Reports & Analytics
        </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Form
            form={form}
            layout="inline"
            style={{ marginBottom: 16 }}
          >
            <Form.Item name="reportType" label="Report Type">
              <Select placeholder="Select Report Type" style={{ width: 200 }}>
                <Select.Option value="maintenance">Maintenance Report</Select.Option>
                <Select.Option value="inventory">Inventory Report</Select.Option>
                <Select.Option value="financial">Financial Report</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="dateRange" label="Date Range">
              <RangePicker />
            </Form.Item>
            <Form.Item>
              <Space>
                <AntButton type="primary">Generate</AntButton>
                <AntButton icon={<DownloadOutlined />} onClick={handleDownload}>
                  Download
                </AntButton>
              </Space>
            </Form.Item>
          </Form>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 2 }}>
              Maintenance Costs Over Time
            </Typography>
            <div style={{ height: 400, position: 'relative' }}>
              <Bar data={maintenanceCostsConfig} options={maintenanceCostsOptions} />
            </div>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 2 }}>
                Ticket Status Distribution
              </Typography>
              <div style={{ height: 400, position: 'relative' }}>
                <Pie data={ticketStatusConfig} options={ticketStatusOptions} />
              </div>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 2 }}>
                Maintenance by Category
              </Typography>
              <div style={{ height: 400, position: 'relative' }}>
                <Bar data={categoryBreakdownConfig} options={categoryBreakdownOptions} />
              </div>
            </CardContent>
          </Card>
        </Box>
      </Box>
      </Box>
    </>
  )
}
