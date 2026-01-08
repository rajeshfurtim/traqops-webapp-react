import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Form, Select, DatePicker, Button as AntButton, Space } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { mockApi } from '../services/api'
import { getPageTitle, APP_CONFIG } from '../config/constants'

const { RangePicker } = DatePicker

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

  const maintenanceCostsOptions = {
    chart: {
      type: 'column',
      height: 400
    },
    title: {
      text: 'Maintenance Costs Over Time'
    },
    xAxis: {
      categories: reportsData.maintenanceCosts.map(item => item.month),
      crosshair: true
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Cost ($)'
      }
    },
    tooltip: {
      headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
      pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
        '<td style="padding:0"><b>${point.y:,.0f}</b></td></tr>',
      footerFormat: '</table>',
      shared: true,
      useHTML: true
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0
      }
    },
    series: [
      {
        name: 'Corrective Maintenance',
        data: reportsData.maintenanceCosts.map(item => item.corrective),
        color: '#dc3545'
      },
      {
        name: 'Scheduled Maintenance',
        data: reportsData.maintenanceCosts.map(item => item.scheduled),
        color: '#28a745'
      }
    ]
  }

  const ticketStatusOptions = {
    chart: {
      type: 'pie',
      height: 400
    },
    title: {
      text: 'Ticket Status Distribution'
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.y}</b> ({point.percentage:.1f}%)'
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.y}'
        }
      }
    },
    series: [{
      name: 'Tickets',
      colorByPoint: true,
      data: reportsData.ticketStatus.map(item => ({
        name: item.status,
        y: item.count
      }))
    }]
  }

  const categoryBreakdownOptions = {
    chart: {
      type: 'bar',
      height: 400
    },
    title: {
      text: 'Maintenance by Category'
    },
    xAxis: {
      categories: reportsData.categoryBreakdown.map(item => item.category),
      title: {
        text: null
      }
    },
    yAxis: [
      {
        title: { text: 'Count' },
        opposite: false
      },
      {
        title: { text: 'Cost ($)' },
        opposite: true
      }
    ],
    tooltip: {
      valueSuffix: ''
    },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true
        }
      }
    },
    series: [
      {
        name: 'Count',
        data: reportsData.categoryBreakdown.map(item => item.count),
        color: '#3498db'
      },
      {
        name: 'Cost ($)',
        data: reportsData.categoryBreakdown.map(item => item.cost),
        color: '#e74c3c',
        yAxis: 1
      }
    ]
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
            <HighchartsReact highcharts={Highcharts} options={maintenanceCostsOptions} />
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <HighchartsReact highcharts={Highcharts} options={ticketStatusOptions} />
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <HighchartsReact highcharts={Highcharts} options={categoryBreakdownOptions} />
            </CardContent>
          </Card>
        </Box>
      </Box>
      </Box>
    </>
  )
}

