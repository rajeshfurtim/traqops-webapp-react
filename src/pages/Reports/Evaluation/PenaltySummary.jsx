import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Card, CardContent } from '@mui/material'
import { Table, Form, Select, Space, Button as AntButton, Input, Row, Col, message, Spin, DatePicker } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetAllKPIsTypeQuery, useGetPenaltyCategoryByKpiIdQuery } from '../../../store/api/masterSettings.api'
import { useGetPenaltySummaryReportQuery } from '../../../store/api/reports.api'
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils'
import { useAuth } from '../../../context/AuthContext'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

export default function PenaltySummary() {

  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId
  const [form] = Form.useForm()

  const [current, setCurrent] = useState(1)
  const [pageSize, setPagesize] = useState(25)
  const [filters, setFilters] = useState({})
  const [selectedKpiTypeId, setSelectedKpiTypeId] = useState();

  const { data: KPIsTypeList, isLoading: KPIsTypeLoading } = useGetAllKPIsTypeQuery({ clientId, pageNumber: 1, pageSize: 1000 })
  const { data: penaltyCategoryList, isLoading: penaltyCategoryLoading, isFetching: penaltyCategoryFetching } = useGetPenaltyCategoryByKpiIdQuery({ kpiTypeId: selectedKpiTypeId }, { skip: !selectedKpiTypeId })
  const { data: assetHistoryReportData, isLoading: assetHistoryReportLoading, isFetching } =
    useGetPenaltySummaryReportQuery(
      {
        ...filters
      },
      {
        skip: !filters.kpiTypeId || !filters.penaltyCategoryId
      }
    )

  useEffect(() => {
    form.setFieldsValue({
      date: [dayjs().startOf('month'), dayjs()],
    })
  }, [])

  const handleKpiTypeChange = (kpiTypeId) => {
    console.log('kpiTypeId:', kpiTypeId)
    form.setFieldsValue({
      penaltyCategory: -1
    })
    setSelectedKpiTypeId(kpiTypeId)
  }

  const handleFilterChange = (values) => {
    console.log('Filter values:', values)
    const newFilters = {}
    if (values.date) {
      newFilters.fromDate = dayjs(values.date[0]).format('YYYY-MM-DD')
      newFilters.toDate = dayjs(values.date[1]).format('YYYY-MM-DD')
    }
    if (values.kpiType) newFilters.kpiTypeId = values.kpiType
    if (values.penaltyCategory) newFilters.penaltyCategoryId = values.penaltyCategory
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
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (_, record) => record?.date ? dayjs(record?.date).format('DD/MM/YYYY') : '',
      sorter: (a, b) => dayjs(a?.date).valueOf() - dayjs(b?.date).valueOf()
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      sorter: (a, b) => (a?.description ?? '').localeCompare(b?.description ?? '')
    },
    {
      title: 'Penalty',
      dataIndex: 'penalty',
      key: 'penalty',
      sorter: (a, b) => (a?.penalty ?? '').localeCompare(b?.penalty ?? '')
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a?.quantity - b?.quantity
    },
    {
      title: 'Penalty Amount',
      dataIndex: 'penaltyAmount',
      key: 'penaltyAmount',
      sorter: (a, b) => a?.penaltyAmount - b?.penaltyAmount
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a, b) => (a?.category ?? '').localeCompare(b?.category ?? '')
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

    const filtered = assetHistoryReportData?.data?.content?.filter((item) =>
      `${item?.date ? dayjs(item?.date).format('DD/MM/YYYY') : ''}
     ${item?.description ?? ''} ${item?.penalty ?? ''} ${item?.quantity ?? ''}
     ${item?.penaltyAmount ?? ''} ${item?.category ?? ''}`
        .toLowerCase()
        .includes(searchValue)
    );

    setFilteredData(filtered);
  };

  const [exporting, setExporting] = useState({ excel: false, pdf: false })

  const handleExportPDF = async () => {
    try {
      setExporting(prev => ({ ...prev, pdf: true }))
      const kpiTypeName = KPIsTypeList.data?.content?.filter(loc => loc.id === filters.kpiTypeId)
      const penaltyCategoryName = penaltyCategoryList.data?.content?.filter(loc => loc?.id === filters.penaltyCategoryId)
      console.log(kpiTypeName, penaltyCategoryName)

      await exportToPDF(
        columns,
        assetHistoryReportData?.data?.content,
        `penalty-summary-report (Date: ${dayjs(filters.fromDate).format('DD/MM/YYYY')} to ${dayjs(filters.toDate).format('DD/MM/YYYY')} - KPI Type: ${kpiTypeName[0]?.name ?? 'All'} - Penalty Category: ${penaltyCategoryName[0]?.name ?? 'All'})`
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
      const kpiTypeName = KPIsTypeList.data?.content?.filter(loc => loc.id === filters.locationId)
      const penaltyCategoryName = penaltyCategoryList.data?.content?.filter(loc => loc?.id === filters.assetsId)

      await exportToExcel(
        columns,
        assetHistoryReportData?.data?.content,
        `penalty-summary-report (Date: ${dayjs(filters.fromDate).format('DD/MM/YYYY')} to ${dayjs(filters.toDate).format('DD/MM/YYYY')} - KPI Type: ${kpiTypeName[0]?.name ?? 'All'} - Penalty Category: ${penaltyCategoryName[0]?.name ?? 'All'})`
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
        <title>{getPageTitle('reports/evaluation/penalty-summary')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Penalty Summary`} />
      </Helmet>
      <Box>
        {/* <Typography variant="h4" gutterBottom fontWeight="bold">
          Penalty Summary
        </Typography> */}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
              form={form}
              onFinish={handleFilterChange}
              layout="vertical"
            >
              <Row gutter={[16, 16]}>

                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Date"
                    name="date"
                    rules={[{ required: true, message: 'Please select date range!' }]}
                  >
                    <RangePicker
                      style={{ width: "100%" }}
                      format={'DD/MM/YYYY'}
                      disabledDate={(current) =>
                        current && current > dayjs().endOf('day')
                      }
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="KPI Type"
                    name="kpiType"
                    rules={[{ required: true, message: 'Please select kpi type!' }]}
                  >
                    <Select
                      placeholder="Select KPI Type"
                      onChange={handleKpiTypeChange}
                    >
                      {/* <Select.Option value={-1}>
                        All KPI Type
                      </Select.Option> */}
                      {KPIsTypeList?.data?.content?.map(l => (
                        <Select.Option key={l.id} value={l.id}>
                          {l.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Penalty Category"
                    name="penaltyCategory"
                    rules={[{ required: true, message: 'Please select Penalty Category!' }]}
                  >
                    <Select placeholder="Select Penalty Category" loading={penaltyCategoryLoading || penaltyCategoryFetching} disabled={penaltyCategoryLoading || penaltyCategoryFetching}>
                      <Select.Option value={-1}>
                        All Penalty Category
                      </Select.Option>
                      {penaltyCategoryList?.data?.content?.map(l => (
                        <Select.Option key={l.id} value={l.id}>
                          {l.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                {/* Buttons */}
                <Col xs={24} sm={24} md={24} lg={6}>
                  <Form.Item label=" ">
                    <Space>
                      <AntButton
                        type="primary"
                        htmlType="submit"
                        loading={assetHistoryReportLoading || isFetching}
                        icon={<SearchOutlined />}
                      >
                        Search
                      </AntButton>
                      <AntButton onClick={handleResetFilters}>
                        Reset
                      </AntButton>
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
                  disabled={!assetHistoryReportData || assetHistoryReportData?.data?.content?.length === 0}
                >
                  Export Excel
                </AntButton>

                <AntButton
                  icon={<FilePdfOutlined />}
                  onClick={handleExportPDF}
                  disabled={!assetHistoryReportData || assetHistoryReportData?.data?.content?.length === 0}
                >
                  Export PDF
                </AntButton>

              </Space>
            </Box>
            {assetHistoryReportLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <Spin />
              </Box>
            ) : (
              <Table
                dataSource={filteredData ?? assetHistoryReportData?.data?.content}
                columns={columns}
                loading={assetHistoryReportLoading || isFetching}
                rowKey={(record, index) => record.id + "_" + index}
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