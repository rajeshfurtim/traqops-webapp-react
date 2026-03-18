import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { Table, Form, Select, Space, Button as AntButton, Input, DatePicker, Row, Col, message, Spin } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import { useGetLocationListQuery } from '../../store/api/masterSettings.api'
import { useGetCmrlAppReportListQuery } from '../../store/api/historyCards.api'
import { useAuth } from '../../context/AuthContext'
import { exportToExcel, exportToPDF } from '../../utils/exportUtils'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

export default function CmrlAppReports() {

  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId
  const [form] = Form.useForm()

  const [current, setCurrent] = useState(1)
  const [pageSize, setPagesize] = useState(25)
  const [filters, setFilters] = useState({})

  const statusList = [
    { id: -1, name: 'All Status' },
    { id: 1, name: 'OPEN' },
    { id: 2, name: 'CLOSE' }
  ]
  const departmentList = [
    { id: -1, name: 'All Department' },
    { id: 3, name: 'Electrical & Mechanical' },
    { id: 7, name: 'Lifts & Escalator' },
    { id: 5, name: 'Tunnel & Ventilation System' },
    { id: 4, name: 'Ventilation Air Conditioning' }
  ]
  const { data: locationList } = useGetLocationListQuery({ clientId, pageNumber: 1, pageSize: 1000 })
  const { data: appReportList, isLoading: reportLoading, isFetching } =
    useGetCmrlAppReportListQuery(
      {
        ...filters
      },
      {
        skip: !filters.locationId
      }
    )

  useEffect(() => {
    form.setFieldsValue({
      date: [dayjs().startOf('month'), dayjs()],
      location: -1,
      status: -1,
      department: -1
    })
  }, [])

  const handleFilterChange = (values) => {
    console.log('Filter values:', values)
    const newFilters = {}
    if (values.date) {
      newFilters.fromDate = dayjs(values.date[0]).format('YYYY-MM-DD')
      newFilters.toDate = dayjs(values.date[1]).format('YYYY-MM-DD')
    }
    if (values.location) newFilters.locationId = values.location
    if (values.status) newFilters.statusId = values.status
    if (values.department) newFilters.departmentId = values.department
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
  }

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      width: 80,
      render: (_, __, index) => ((current - 1) * pageSize) + index + 1
    },
    {
      title: 'Ref.No',
      dataIndex: 'refNo',
      key: 'refNo',
      sorter: (a, b) => (a?.refNo ?? '').localeCompare(b?.refNo ?? '')
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      sorter: (a, b) => (a?.type ?? '').localeCompare(b?.type ?? '')
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a, b) => (a?.category ?? '').localeCompare(b?.category ?? '')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: (a, b) => (a?.status ?? '').localeCompare(b?.status ?? '')
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      sorter: (a, b) => (a?.location ?? '').localeCompare(b?.location ?? '')
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      sorter: (a, b) => (a?.priority ?? '').localeCompare(b?.priority ?? '')
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => dayjs(a?.createdAt).valueOf() - dayjs(b?.createdAt).valueOf(),
      render: (_, record) => record.createdAt ? dayjs(record.createdAt).format('DD-MM-YYYYTHH:mm') : '-'
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      sorter: (a, b) => (a?.createdBy ?? '').localeCompare(b?.createdBy ?? '')
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      sorter: (a, b) => (a?.department ?? '').localeCompare(b?.department ?? '')
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      sorter: (a, b) => (a?.description ?? '').localeCompare(b?.description ?? '')
    }
  ]

  // Search state
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState(null);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);

    const searchValue = value.toLowerCase().trim();

    if (!searchValue) {
      setFilteredData(null);
      return;
    }

    const filtered = appReportList?.filter((item) =>
      `${item.refNo ?? ''} ${item.type ?? ''} ${item.category ?? ''}
    ${item.status ?? ''} ${item.location ?? ''} ${item.priority ?? ''}
        ${item.createdAt ? dayjs(item.createdAt).format('DD-MM-YYYYTHH:mm') : ''}
         ${item.createdBy ?? ''} ${item.department ?? ''} ${item.description ?? ''}`
        .toLowerCase()
        .includes(searchValue)
    );

    setFilteredData(filtered);
  };

  const [exporting, setExporting] = useState({ excel: false, pdf: false })

  const handleExportPDF = async () => {
    try {
      setExporting(prev => ({ ...prev, pdf: true }))
      const locationName = locationList.data?.content?.filter(loc => loc.id === filters.locationId)
      const statusName = statusList?.filter(loc => loc.id === filters.statusId)
      const departmentName = departmentList?.filter(loc => loc.id === filters.departmentId)

      await exportToPDF(
        columns,
        appReportList,
        `app-report (Date: ${dayjs(filters.fromDate).format('DD/MM/YYYY')} to ${dayjs(filters.toDate).format('DD/MM/YYYY')} - Location: ${locationName[0]?.name ?? 'All'} - Status: ${statusName[0]?.name} - Department: ${departmentName[0]?.name})`
      )

      message.success('PDF exported successfully')
    } catch (err) {
      message.error('PDF export failed')
    } finally {
      setExporting(prev => ({ ...prev, pdf: false }))
    }
  }

  const handleExportExcel = async () => {
    try {
      setExporting(prev => ({ ...prev, excel: true }))
      const locationName = locationList.data?.content?.filter(loc => loc.id === filters.locationId)
      const statusName = statusList?.filter(loc => loc.id === filters.statusId)
      const departmentName = departmentList?.filter(loc => loc.id === filters.departmentId)

      await exportToExcel(
        columns,
        appReportList,
        `app-report (Date: ${dayjs(filters.fromDate).format('DD/MM/YYYY')} to ${dayjs(filters.toDate).format('DD/MM/YYYY')} - Location: ${locationName[0]?.name ?? 'All'} - Status: ${statusName[0]?.name} - Department: ${departmentName[0]?.name})`
      )

      message.success('Excel exported successfully')
    } catch (err) {
      message.error('Excel export failed')
    } finally {
      setExporting(prev => ({ ...prev, excel: false }))
    }
  }

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/cmrl-app-reports')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - CMRL App Reports`} />
      </Helmet>
      <Box>
        {/* <Typography variant="h4" gutterBottom fontWeight="bold">
          Tools Report
        </Typography> */}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form form={form} layout="vertical" onFinish={handleFilterChange}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Date"
                    name="date"
                    rules={[{ required: true, message: 'Please select date range!' }]}
                  >
                    <RangePicker style={{ width: '100%' }}
                      format={'DD/MM/YYYY'}
                      disabledDate={(current) =>
                        current && current > dayjs().endOf('day')
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Location"
                    name="location"
                    rules={[{ required: true, message: 'Please select location!' }]}
                  >
                    <Select
                      placeholder="Select Location"
                    >
                      <Select.Option kry={-1} value={-1}>All Location</Select.Option>
                      {locationList?.data?.content?.map(l => (
                        <Select.Option key={l.id} value={l.id}>
                          {l.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Status"
                    name="status"
                    rules={[{ required: true, message: 'Please select status!' }]}
                  >
                    <Select
                      placeholder="Select Status"
                    >
                      {statusList?.map(l => (
                        <Select.Option key={l.id} value={l.id}>
                          {l.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Department"
                    name="department"
                    rules={[{ required: true, message: 'Please select department!' }]}
                  >
                    <Select
                      placeholder="Select Department"
                    >
                      {departmentList?.map(l => (
                        <Select.Option key={l.id} value={l.id}>
                          {l.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={24} lg={6}>
                  <Form.Item>
                    <Space>
                      <AntButton type="primary" htmlType="submit"
                        icon={<SearchOutlined />}
                        loading={reportLoading || isFetching}
                      >Search</AntButton>
                      <AntButton onClick={handleResetFilters}>Reset</AntButton>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Space>
                <Input
                  placeholder="Search"
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={handleSearch}
                  allowClear
                  style={{ width: 250 }}
                />

                <AntButton
                  icon={<FileExcelOutlined />}
                  onClick={handleExportExcel}
                  disabled={!appReportList || appReportList.length === 0}
                >
                  Export Excel
                </AntButton>

                <AntButton
                  icon={<FilePdfOutlined />}
                  onClick={handleExportPDF}
                  disabled={!appReportList || appReportList.length === 0}
                >
                  Export PDF
                </AntButton>

              </Space>
            </Box>
            {reportLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <Spin />
              </Box>
            ) : (
              <Table
                dataSource={filteredData ?? appReportList}
                columns={columns}
                loading={reportLoading || isFetching}
                rowKey={(record, index) => record.toolsId + "_" + index}
                size="middle"
                scroll={{ x: 'max-content' }}
                pagination={{
                  position: ['bottomRight'],
                  current: current,
                  pageSize: pageSize,
                  onChange: setCurrent,
                  showSizeChanger: true,
                  onShowSizeChange: (current, size) => {
                    setPagesize(size);
                    setCurrent(current);
                  },
                  pageSizeOptions: ['25', '50', '100'],
                  showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} items`,
                  className: "custom-pagination"
                }}
              />
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}