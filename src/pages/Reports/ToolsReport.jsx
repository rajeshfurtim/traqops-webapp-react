import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { Table, Form, Select, Space, Button as AntButton, Input, DatePicker, Row, Col, Tooltip, message, Spin } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import { useGetLocationByIsStoreQuery } from '../../store/api/masterSettings.api'
import { useGetToolsReportQuery } from '../../store/api/reports.api'
import { useAuth } from '../../context/AuthContext'
import { exportToExcel, exportToPDF } from '../../utils/exportUtils'

const { RangePicker } = DatePicker

export default function ToolsReport() {

  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId
  const [form] = Form.useForm()

  const [current, setCurrent] = useState(1)
  const [pageSize, setPagesize] = useState(25)
  const [filters, setFilters] = useState({})

  const { data: locationList, isLoading: locationLoading } = useGetLocationByIsStoreQuery({ clientId, pageNumber: 1, pageSize: 1000 })
  const { data: toolsList, isLoading: toolsLoading, isFetching } =
    useGetToolsReportQuery(
      {
        ...filters,
        pn: 1,
        ps: 1000
      },
      {
        skip: !filters.locationId
      }
    )

  useEffect(() => {
    form.setFieldsValue({
      date: [dayjs().startOf('month'), dayjs()],
      location: 10339
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
      title: 'Location',
      dataIndex: 'locationName',
      key: 'locationName',
      sorter: (a, b) => (a?.locationName ?? '').localeCompare(b?.locationName ?? '')
    },
    {
      title: 'Tools Name',
      dataIndex: 'toolsName',
      key: 'toolsName',
      sorter: (a, b) => (a?.toolsName ?? '').localeCompare(b?.toolsName ?? '')
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (_, record) => record.date ? dayjs(record.date).format('DD/MM/YYYY') : '-',
      sorter: (a, b) => dayjs(a?.date).valueOf() - dayjs(b?.date).valueOf()
    },
    {
      title: 'Required Quantity',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      sorter: (a, b) => a?.totalQuantity - b?.totalQuantity
    },
    {
      title: 'Actual Quantity',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      sorter: (a, b) => a?.availableQuantity - b?.availableQuantity
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      sorter: (a, b) => (a?.remarks ?? '').localeCompare(b?.remarks ?? '')
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

    const filtered = toolsList?.data?.filter((item) =>
      `${item.locationName ?? ''} ${item.toolsName ?? ''} ${item.remarks ?? ''}
        ${item.date ? dayjs(item.date).format('DD/MM/YYYY') : ''} ${item.totalQuantity ?? ''} ${item.availableQuantity ?? ''}`
        .toLowerCase()
        .includes(searchValue)
    );

    setFilteredData(filtered);
  };

  const [exporting, setExporting] = useState({ excel: false, pdf: false })

  const handleExportPDF = async () => {
    try {
      console.log("adhsgvuiav bjhav")
      setExporting(prev => ({ ...prev, pdf: true }))
      const locationName = locationList.data?.content?.filter(loc => loc.id === filters.locationId)

      await exportToPDF(
        columns,
        toolsList?.data,
        `tools-report (Date: ${dayjs(filters.fromDate).format('DD/MM/YYYY')} to ${dayjs(filters.toDate).format('DD/MM/YYYY')} - Location: ${locationName[0]?.name ?? 'All'})`
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

      await exportToExcel(
        columns,
        toolsList?.data,
        `tools-report-${dayjs(filters.fromDate).format('DD-MM-YYYY')}-${dayjs(filters.toDate).format('DD-MM-YYYY')}`
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
        <title>{getPageTitle('reports/tools')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Tools Report`} />
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
                      {locationList?.data?.content?.map(l => (
                        <Select.Option key={l.id} value={l.id}>
                          {l.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={24} lg={6}>
                  <Form.Item label=" ">
                    <Space>
                      <AntButton type="primary" htmlType="submit">Filter</AntButton>
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
                <Tooltip title="Export Excel">
                  <AntButton
                    type="primary"
                    icon={<FileExcelOutlined />}
                    onClick={handleExportExcel}
                    disabled={toolsList?.data?.length === 0}
                    style={{ backgroundColor: '#5bd71c', color: '#fff' }}
                  >
                  </AntButton>
                </Tooltip>
                <Tooltip title="Export PDF">
                  <AntButton
                    type="primary"
                    icon={<FilePdfOutlined />}
                    onClick={handleExportPDF}
                    disabled={toolsList?.data?.length === 0}
                    style={{ backgroundColor: 'rgb(240, 42, 45)', color: '#fff' }}
                  >
                  </AntButton>
                </Tooltip>
              </Space>
            </Box>
            {toolsLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <Spin />
              </Box>
            ) : (
              <Table
                dataSource={filteredData ?? toolsList?.data}
                columns={columns}
                loading={toolsLoading || isFetching}
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

