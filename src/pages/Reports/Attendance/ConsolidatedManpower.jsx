import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, message } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetAllUserType } from '../../../hooks/useGetAllUserType'
import { useAuth } from '../../../context/AuthContext'
import { useGetConsolidateManpowerReportQuery } from '../../../store/api/reports.api'

const { RangePicker } = DatePicker

export default function ConsolidatedManpowerReport() {
  const [form] = Form.useForm()
  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId

  const [filters, setFilters] = useState({
    fromDate: null,
    toDate: null,
    userTypeId: null,
  })

  const { userTypes, loading: userTypesLoading } = useGetAllUserType()

  /* ---- INITIAL LOAD ---- */
  useEffect(() => {
    const today = dayjs()

    form.setFieldsValue({
      dateRange: [today, today],
      type: 261586,
    })

    setFilters({
      fromDate: today.format('YYYY-MM-DD'),
      toDate: today.format('YYYY-MM-DD'),
      userTypeId: 261586,
    })
  }, [])

  /* ---- FILTER SUBMIT ---- */
  const handleFilterChange = values => {
    const [from, to] = values.dateRange || []

    setFilters({
      fromDate: from?.format('YYYY-MM-DD'),
      toDate: to?.format('YYYY-MM-DD'),
      userTypeId: values.type,
    })
  }

  /* ---- API CALL ---- */
  const { data: response, isLoading, isFetching } =
    useGetConsolidateManpowerReportQuery(
      {
        ...filters,
        clientId,
      },
      {
        skip: !clientId || !filters.fromDate || !filters.toDate,
      }
    )

  /* ---- BUILD TABLE ROWS ---- */
  const reports = useMemo(() => {
    if (!Array.isArray(response?.data)) return []

    return response.data.map(item => {
      const row = {
        id: item.locationId,
        location: item.locationName,
        totalDuties: 0,
      }

      Object.entries(item.counts || {}).forEach(([date, count]) => {
        row[date] = count
        row.totalDuties += count
      })

      return row
    })
  }, [response])

  /* ---- DATE COLUMNS ---- */
  const dateColumns = useMemo(() => {
    if (!filters.fromDate || !filters.toDate) return []

    const start = dayjs(filters.fromDate)
    const end = dayjs(filters.toDate)
    const cols = []

    let current = start

    while (current.isBefore(end, 'day') || current.isSame(end, 'day')) {
      const fullDate = current.format('YYYY-MM-DD')

      cols.push({
        title: current.format('DD-MM-YY'),
        dataIndex: fullDate,
        key: fullDate,
        align: 'center',
        width: 80,
        render: v => v ?? 0,
      })

      current = current.add(1, 'day')
    }

    return cols
  }, [filters])

  /* ---- BUILD DATA WITH TOTAL ROW ---- */
  const reportsWithTotal = useMemo(() => {
    if (!reports.length) return []

    const totalRow = { id: 'total', location: 'Total', totalDuties: 0 }
    dateColumns.forEach(col => {
      totalRow[col.dataIndex] = 0
    })

    reports.forEach(row => {
      totalRow.totalDuties += row.totalDuties || 0
      dateColumns.forEach(col => {
        totalRow[col.dataIndex] += row[col.dataIndex] || 0
      })
    })

    return [...reports, totalRow]
  }, [reports, dateColumns])

  /* ---- TABLE COLUMNS ---- */
  const columns = [
    {
      title: 'Location',
      dataIndex: 'location',
      width: 250,
      fixed: 'left',
    },
    {
      title: 'Total Duty',
      dataIndex: 'totalDuties',
      width: 120,
      align: 'center',
      fixed: 'left',
    },
    ...dateColumns,
  ]

  /* ---- EXPORT PLACEHOLDERS ---- */
  const handleExportExcel = () => message.info('Excel export coming soon')
  const handleExportPDF = () => message.info('PDF export coming soon')

  /* ---- UI ---- */
  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/attendance/consolidated-manpower')}</title>
        <meta
          name="description"
          content={`${APP_CONFIG.name} - Consolidated Manpower Report`}
        />
      </Helmet>

      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Consolidated Manpower Report
        </Typography>

        {/*  FILTERS  */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
              form={form}
              layout="inline"
              onFinish={handleFilterChange}
            >
              <Form.Item name="dateRange" label="Date Range">
                <RangePicker
                  format="DD-MM-YYYY"
                  allowClear={false}
                  disabledDate={d => d && d > dayjs().endOf('day')}
                />
              </Form.Item>

              <Form.Item name="type" label="Type" style={{ width: 250 }}>
                <Select loading={userTypesLoading}>
                  {userTypes?.map(type => (
                    <Select.Option key={type.id} value={type.id}>
                      {type.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <AntButton type="primary" htmlType="submit">
                  Apply Filters
                </AntButton>
              </Form.Item>
            </Form>
          </CardContent>
        </Card>

        {/*  TABLE */}
        <Card>
          <CardContent>
            {isLoading || isFetching ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography fontWeight="bold">
                    Total Duty:{' '}
                    <span style={{ color: '#52c41a' }}>
                      {reportsWithTotal.find(r => r.id === 'total')?.totalDuties || 0}
                    </span>
                  </Typography>

                  <Space style={{ marginLeft: 'auto' }} size={12}>
                  <AntButton
                    type="default"
                    icon={<FileExcelOutlined />}
                    onClick={handleExportExcel}
                    disabled={reports.length === 0}
                    style={{ backgroundColor: '#52c41a', color: '#fff', borderColor: '#52c41a' }}
                  >Export Excel
                  </AntButton>
                  <AntButton
                    type="default"
                    icon={<FilePdfOutlined />}
                    onClick={handleExportPDF}
                    disabled={reports.length === 0}
                    style={{ backgroundColor: '#ff4d4f', color: '#fff', borderColor: '#ff4d4f' }}
                  >Export PDF
                  </AntButton>
                </Space>
                </Box>

                <Table
                  rowKey="id"
                  dataSource={reportsWithTotal}
                  columns={columns}
                  pagination={{ pageSize: 20 }}
                  scroll={{ x: 'max-content' }}
                  size="small"
                  bordered
                  rowClassName={record =>
                    record.id === 'total' ? 'ant-table-row-total' : ''
                  }
                />
              </>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Optional CSS for total row */}
      <style>{`
        .ant-table-row-total {
          font-weight: bold;
          background: #fafafa;
        }
      `}</style>
    </>
  )
}
