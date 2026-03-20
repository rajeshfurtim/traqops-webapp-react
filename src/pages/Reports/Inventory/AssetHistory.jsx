import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Card, CardContent } from '@mui/material'
import { Table, Form, Select, Space, Button as AntButton, Input, Row, Col, message, Spin, DatePicker } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationListQuery, useGetAssetsLocationWiseQuery } from '../../../store/api/masterSettings.api'
import { useGetAssetHistoryReportQuery } from '../../../store/api/reports.api'
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils'
import { useAuth } from '../../../context/AuthContext'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

export default function AssetHistoryReports() {

  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId
  const [form] = Form.useForm()

  const [current, setCurrent] = useState(1)
  const [pageSize, setPagesize] = useState(25)
  const [filters, setFilters] = useState({})
  const [selectedHeaderLocationId, setSelectedHeaderLocationId] = useState(-1);

  const { data: locationList, isLoading: locationLoading } = useGetLocationListQuery({ clientId, pageNumber: 1, pageSize: 1000 })
  const { data: assetsListData, isLoading: assetsListLoading, isFetching: assetsFetching } = useGetAssetsLocationWiseQuery({ clientId, pageNumber: 1, pageSize: 1000, locationId: selectedHeaderLocationId }, { skip: !selectedHeaderLocationId })
  const { data: assetHistoryReportData, isLoading: assetHistoryReportLoading, isFetching } =
    useGetAssetHistoryReportQuery(
      {
        clientId,
        ...filters,
        pn: 1,
        ps: 1000
      },
      {
        skip: !filters.locationId || !filters.assetsId
      }
    )

  useEffect(() => {
    form.setFieldsValue({
      date: [dayjs().startOf('month'), dayjs()],
      location: -1,
      asset: -1
    })
    handleLocationChange(-1)
  }, [])

  const handleLocationChange = (locationId) => {
    console.log('locationId:', locationId)
    form.setFieldsValue({
      asset: -1
    })
    setSelectedHeaderLocationId(locationId)
  }

  const handleFilterChange = (values) => {
    console.log('Filter values:', values)
    const newFilters = {}
    if (values.date) {
      newFilters.fromDate = dayjs(values.date[0]).format('YYYY-MM-DD')
      newFilters.toDate = dayjs(values.date[1]).format('YYYY-MM-DD')
    }
    if (values.location) newFilters.locationId = values.location
    if (values.asset) newFilters.assetsId = values.asset
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
      title: 'Location',
      dataIndex: 'locationName',
      key: 'locationName',
      sorter: (a, b) => (a?.locationName ?? '').localeCompare(b?.locationName ?? '')
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      sorter: (a, b) => (a?.type ?? '').localeCompare(b?.type ?? '')
    },
    {
      title: 'Status',
      dataIndex: 'statusName',
      key: 'statusName',
      sorter: (a, b) => (a?.statusName ?? '').localeCompare(b?.statusName ?? '')
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
     ${item?.locationName ?? ''} ${item?.statusName ?? ''} ${item?.type ?? ''}`
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
      const assetName = assetsListData.data?.content?.filter(loc => loc.assetId === filters.assetsId)
      console.log(locationName, assetName)

      await exportToPDF(
        columns,
        assetHistoryReportData?.data?.content,
        `asset-history-report (Date: ${dayjs(filters.fromDate).format('DD/MM/YYYY')} to ${dayjs(filters.toDate).format('DD/MM/YYYY')} - Location: ${locationName[0]?.name ?? 'All'} - Asset: ${assetName[0]?.name ?? 'All'})`
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
      const assetName = assetsListData.data?.content?.filter(loc => loc.assetId === filters.assetsId)

      await exportToExcel(
        columns,
        assetHistoryReportData?.data?.content,
        `asset-history-report (Date: ${dayjs(filters.fromDate).format('DD/MM/YYYY')} to ${dayjs(filters.toDate).format('DD/MM/YYYY')} - Location: ${locationName[0]?.name ?? 'All'} - Asset: ${assetName[0]?.name ?? 'All'})`
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
        <title>{getPageTitle('reports/tasks/asset-history')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Asset History Reports`} />
      </Helmet>
      <Box>
        {/* <Typography variant="h4" gutterBottom fontWeight="bold">
          Asset History Reports
        </Typography> */}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
              form={form}
              onFinish={handleFilterChange}
              layout="vertical"
            >
              <Row gutter={[16, 16]}>
                {/* Date */}
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
                {/* Location */}
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Location"
                    name="location"
                    rules={[{ required: true, message: 'Please select location!' }]}
                  >
                    <Select
                      placeholder="Select Location"
                      onChange={handleLocationChange}
                    >
                      <Select.Option value={-1}>
                        All Location
                      </Select.Option>
                      {locationList?.data?.content?.map(l => (
                        <Select.Option key={l.id} value={l.id}>
                          {l.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                {/* Inventory */}
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Asset"
                    name="asset"
                    rules={[{ required: true, message: 'Please select Asset!' }]}
                  >
                    <Select placeholder="Select Asset" loading={assetsListLoading || assetsFetching} disabled={assetsListLoading || assetsFetching}>
                      <Select.Option value={-1}>
                        All Asset
                      </Select.Option>
                      {assetsListData?.data?.content?.map(l => (
                        <Select.Option key={l.assetId} value={l.assetId}>
                          {l.assetName}
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