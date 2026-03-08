import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Row, Col } from 'antd'
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '../../../context/AuthContext'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useGetLocationwiseSheduledQuery } from '../../../store/api/taskReport.api'
import { useGetconsolitadeReportQuery } from '../../../store/api/taskReport.api'
import { freeze } from '@reduxjs/toolkit'

const { RangePicker } = DatePicker

export default function ConsolidatedScheduledMaintenanceReport() {
  const [form] = Form.useForm()
  const { user } = useAuth()
  const clientId = user?.clientId || user?.client?.id

  const { locations, loading: locationsLoading } = useGetLocationList()
  const [selectedLocationId, setSelectedLocationId] = useState(null)

  const [filters, setFilters] = useState({
    fromDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    toDate: dayjs().format('YYYY-MM-DD'),
    locationId: '',
    pn: '1',
    ps: '1000'
  })

  // Auto select first location 
  useEffect(() => {
    if (!locationsLoading && locations?.length > 0) {
      const firstId = locations[0].id
      setSelectedLocationId(firstId)

      form.setFieldsValue({
        location: firstId,
        dateRange: [dayjs().subtract(1, 'day'), dayjs()]
      })

      // setFilters(prev => ({
      //   ...prev,
      //   locationId: firstId
      // }))
    }
  }, [locationsLoading, locations])

  const handleFilterChange = (values) => {
    setFilters({
      fromDate: values.dateRange
        ? values.dateRange[0].format('YYYY-MM-DD')
        : null,
      toDate: values.dateRange
        ? values.dateRange[1].format('YYYY-MM-DD')
        : null,
      locationId: values.location || null,
      pn: '1',
      ps: '1000'
    })
  }

  const handleReset = () => {
    const defaultFrom = dayjs().subtract(1, 'day')
    const defaultTo = dayjs()

    form.resetFields()

    form.setFieldsValue({
      dateRange: [defaultFrom, defaultTo],
      location: selectedLocationId
    })

    setFilters({
      fromDate: defaultFrom.format('YYYY-MM-DD'),
      toDate: defaultTo.format('YYYY-MM-DD'),
      locationId: selectedLocationId,
      pn: '1',
      ps: '1000'
    })
  }

  const { data: reportData, isLoading } =
    useGetLocationwiseSheduledQuery(
      { ...filters, clientId },
      {
        skip:
          !filters.fromDate ||
          !filters.toDate ||
          !filters.locationId ||
          !clientId
      }
    )

  const { data: consolidatedReporstData, isLoading: isConsolidatedReportLoading }
    = useGetconsolitadeReportQuery({ ...filters },
      {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        locationId: filters.locationId,

      },
      {
        skip:
          !filters.fromDate ||
          !filters.toDate ||
          !filters.locationId
      }
    )
  console.log('Consolidated Report Data:', reportData)

  const monthname = dayjs().month(Number(filters.fromDate?.split('-')[1]) - 1).format('MMMM').toUpperCase();

  const reports = (reportData?.data?.content || []).map((item, index) => {
    const consolidatedItem = consolidatedReporstData?.data?.content?.[index] || {};
    console.log('sdlbvahfc', consolidatedReporstData?.data)

    return {
      key: index,
      sno: index + 1,
      equipmentname: item.assetName,
      equipmentCode: item.itemCode,
      locationName: item.locationName,
      frequency: `${consolidatedItem[monthname]?.frequency || "-"}`,
      preventiveMaintenance: consolidatedItem[monthname]?.preventiveMaintenance || "-",
      ptwNo: consolidatedItem[monthname]?.ptwNo || "-",
      performedByMaintainer: consolidatedItem[monthname]?.performedByMaintainer || "-",
      verifiedByEngineer: consolidatedItem[monthname]?.verifiedByEngineer || "-",
      remarks: consolidatedItem[monthname]?.remarks || "-",
      pte: consolidatedItem.pte || "-",
    };
  });

  const columns = [
    { title: "S.NO", width: 30, dataIndex: "sno", key: "sno" },
    { title: "Equipment Name", dataIndex: "equipmentname", key: "equipmentname", width: 60 },
    { title: "Equipment Code", dataIndex: "equipmentCode", key: "equipmentCode", width: 60 },
    { title: "Location", dataIndex: "locationName", key: "locationName", width: 100 },
    {
      title: monthname,
      children: [
        { title: "Frequency (M/Q/H/A)", dataIndex: "frequency", key: `${monthname}-frequency`, width: 60 },
        { title: "PREVENTIVE MAINTENANCE", dataIndex: "preventiveMaintenance", key: `${monthname}-preventiveMaintenance`, width: 60 },
        { title: "PTW NO", dataIndex: "ptwNo", key: `${monthname}-ptwNo`, width: 60 },
        { title: "PERFORMED BY MAINTAINER", dataIndex: "performedByMaintainer", key: `${monthname}-performedByMaintainer`, width: 60 },
        { title: "VERIFIED BY ENGINEER", dataIndex: "verifiedByEngineer", key: `${monthname}-verifiedByEngineer`, width: 60 },
        { title: "REMARKS", dataIndex: "remarks", key: `${monthname}-remarks`, width: 60 },
      ],
    }
  ]
  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/tasks/scheduled-consolidated')}</title>
        <meta
          name="description"
          content={`${APP_CONFIG.name} - Consolidated Scheduled Maintenance Report`}
        />
      </Helmet>

      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Consolidated Scheduled Maintenance Report
        </Typography>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFilterChange}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="dateRange" label="Date Range">
                    <RangePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="location" label="Location">
                    <Select
                      style={{ width: '100%' }}
                      allowClear
                      loading={locationsLoading}
                    >
                      {locations?.map((loc) => (
                        <Select.Option key={loc.id} value={loc.id}>
                          {loc.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6} style={{ display: 'flex', alignItems: 'center' }}>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Space wrap>
                      <AntButton type="primary" htmlType="submit">
                        Apply Filters
                      </AntButton>
                      <AntButton onClick={handleReset}>
                        Reset
                      </AntButton>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </CardContent>
        </Card>

        {/* Report Table */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Space>
                <AntButton icon={<FileExcelOutlined />}>
                  Export Excel
                </AntButton>
                <AntButton icon={<FilePdfOutlined />}>
                  Export PDF
                </AntButton>
              </Space>
            </Box>

            {isLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Table
                // dataSource={reportData?.data || []}
                dataSource={reports}
                columns={columns}
                rowKey={(record) => record.id || record.month}
                pagination={{ pageSize: 20 }}
                size="middle"
                bordered
              />
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}