import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Spin, Row, Col, Input, message } from 'antd'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useGettaskReportSummarycmQuery, useGetSystemCategorysQuery } from '../../../store/api/taskReport.api'
import { useGetAllStatusQuery } from '../../../store/api/masterSettings.api'
import { useAuth } from '../../../context/AuthContext'
import { SearchOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils'

const { RangePicker } = DatePicker

export default function ScheduledMaintenanceDetailsReports() {
  const [form] = Form.useForm()
  const { user } = useAuth()

  const clientId = user?.client?.id || user?.clientId

  const [filters, setFilters] = useState({})
  const [selectedSystem, setSelectedSystem] = useState(null)
  const [current, setCurrent] = useState(1)
  const [pageSize, setPagesize] = useState(25)

  const { locations, loading: locationsLoading } = useGetLocationList()
  const { data: statusList, loading: statusLoading } = useGetAllStatusQuery()
  const { data: categoryList, loading: categoryLoading } = useGetSystemCategorysQuery({ clientId, system: selectedSystem }, { skip: !selectedSystem })
  const { data: reportData, isLoading: isInitialLoading, isFetching } = useGettaskReportSummarycmQuery(
    { ...filters, clientId },
    { skip: !filters.fromDate || !filters.toDate || !filters.locationId }
  )

  const queryLoading = isInitialLoading || isFetching

  const requiredStatuses = [640, 631, 15, 16, 808]

  const filteredStatusList = statusList?.data?.filter(item =>
    requiredStatuses.includes(item.id)
  )

  const handleSystemChange = (system) => {
    setSelectedSystem(system)
    form.setFieldsValue({
      category: 'All'
    })
  }

  useEffect(() => {
    form.setFieldsValue({
      dateRange: [dayjs().startOf('month'), dayjs()],
      location: -1,
      statusId: -1,
      system: 'ECS',
      category: 'All'
    })
    handleSystemChange('ECS')
  }, [])

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      width: 80, render: (_, __, index) => ((current - 1) * pageSize) + index + 1
    },
    {
      title: 'Created Name',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (_, record) => record.createdBy?.firstName,
      sorter: (a, b) => a.createdBy?.firstName.localeCompare(b.createdBy?.firstName)
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (_, record) => record?.createdAt ? dayjs(record?.createdAt).format("DD-MM-YYYYTHH:mm") : '-',
      sorter: (a, b) => new Date(a?.createdAt) - new Date(b?.createdAt)
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (_, record) => record?.location?.name ?? '-',
      sorter: (a, b) => a.location?.name.localeCompare(b.location?.name)
    },
    {
      title: 'Fault ID',
      dataIndex: 'cmKey',
      key: 'cmKey',
      sorter: (a, b) => a?.cmKey.localeCompare(b?.cmKey)
    },
    {
      title: 'PTW No',
      dataIndex: 'ptwNo',
      key: 'ptwNo',
      render: (_, record) => record?.breakDownRemarks[0]?.ptwNo ?? '-',
      sorter: (a, b) => a?.breakDownRemarks[0]?.ptwNo.localeCompare(b?.breakDownRemarks[0]?.ptwNo)
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (_, record) => record?.category?.name ?? '-',
      sorter: (a, b) => a.category?.name?.localeCompare(b.category?.name)
    },
    {
      title: 'Asset',
      dataIndex: 'assets',
      key: 'assets',
      render: (_, record) => record?.assets?.name ?? '-',
      sorter: (a, b) => a.assets?.name?.localeCompare(b.assets?.name)
    },
    {
      title: 'Fault Category',
      dataIndex: 'faultCategory',
      key: 'faultCategory',
      render: (_, record) => record?.faultCategory?.name ?? '-',
      sorter: (a, b) => a.faultCategory?.name?.localeCompare(b.faultCategory?.name)
    },
    {
      title: 'Fault Sub Category',
      dataIndex: 'faultSubCategory',
      key: 'faultSubCategory',
      render: (_, record) => record?.faultSubCategory?.name ?? '-',
      sorter: (a, b) => a.faultSubCategory?.name?.localeCompare(b.faultSubCategory?.name)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (_, record) => record?.status?.name ?? '-',
      sorter: (a, b) => a.status?.name?.localeCompare(b.status?.name)
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (_, record) => record?.assignedTo?.firstName ?? '-',
      sorter: (a, b) => a.assignedTo?.firstName?.localeCompare(b.assignedTo?.firstName)
    },
    {
      title: 'Completed By',
      render: (_, record) =>
        getCompletedData(record?.breakDownRemarks, 'performedBy') ?? '-',
      sorter: (a, b) =>
        (getCompletedData(a.breakDownRemarks, 'performedBy') || '')
          .localeCompare(getCompletedData(b.breakDownRemarks, 'performedBy') || '')
    },
    {
      title: 'Completed Date',
      render: (_, record) =>
        getCompletedData(record?.breakDownRemarks, 'date') ?? '-',
      sorter: (a, b) =>
        (getCompletedData(a.breakDownRemarks, 'date') || '')
          .localeCompare(getCompletedData(b.breakDownRemarks, 'date') || '')
    },
    {
      title: 'Completed Remark',
      render: (_, record) =>
        getCompletedData(record?.breakDownRemarks, 'remarks') ?? '-',
      sorter: (a, b) =>
        (getCompletedData(a.breakDownRemarks, 'remarks') || '')
          .localeCompare(getCompletedData(b.breakDownRemarks, 'remarks') || '')
    },
    {
      title: 'Verified By',
      render: (_, record) =>
        getVerifiedData(record?.breakDownRemarks, 'verifiedBy') ?? '-',
      sorter: (a, b) =>
        (getVerifiedData(a.breakDownRemarks, 'verifiedBy') || '')
          .localeCompare(getVerifiedData(b.breakDownRemarks, 'verifiedBy') || '')
    },
    {
      title: 'Verified Date',
      render: (_, record) =>
        getVerifiedData(record?.breakDownRemarks, 'date') ?? '-',
      sorter: (a, b) =>
        (getVerifiedData(a.breakDownRemarks, 'date') || '')
          .localeCompare(getVerifiedData(b.breakDownRemarks, 'date') || '')
    },
    {
      title: 'Verified Remark',
      render: (_, record) =>
        getVerifiedData(record?.breakDownRemarks, 'remarks') ?? '-',
      sorter: (a, b) =>
        (getVerifiedData(a.breakDownRemarks, 'remarks') || '')
          .localeCompare(getVerifiedData(b.breakDownRemarks, 'remarks') || '')
    },
    {
      title: 'Closing Date',
      dataIndex: 'closingDate',
      key: 'closingDate',
      render: (_, record) => record?.updatedAt ? dayjs(record?.updatedAt).format("DD-MM-YYYYTHH:mm") : '-',
      sorter: (a, b) => new Date(a?.updatedAt) - new Date(b?.updatedAt)
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (_, record) => record?.breakDownRemarks[0]?.remarks ?? '-',
      sorter: (a, b) => a.breakDownRemarks[0]?.remarks?.localeCompare(b.breakDownRemarks[0]?.remarks)
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (_, record) => record?.duration + 'Mins' ?? '-',
      sorter: (a, b) => a.duration.localeCompare(b.duration)
    },
  ];

  const getCompletedData = (data, type) => {
    if (!data?.length) return null;

    const lastCompleted = data
      .filter(item => item?.status?.name === 'COMPLETED')
      .pop();

    if (!lastCompleted) return null;

    if (type === 'date') {
      return lastCompleted?.createdAt
        ? dayjs(lastCompleted.createdAt).format('DD/MM/YYYY hh:mm A')
        : null;
    }

    if (type === 'performedBy') {
      return lastCompleted?.performedBy;
    }

    if (type === 'remarks') {
      return lastCompleted?.remarks !== 'null'
        ? lastCompleted?.remarks
        : '';
    }

    return null;
  };

  const getVerifiedData = (data, type) => {
    if (!data?.length) return null;

    const verifiedItem = data.find(
      item => item?.status?.name === 'VERIFIED'
    );

    if (!verifiedItem) return null;

    if (type === 'date') {
      return verifiedItem?.createdAt
        ? dayjs(verifiedItem.createdAt).format('DD/MM/YYYY hh:mm A')
        : null;
    }

    if (type === 'verifiedBy') {
      return verifiedItem?.verifiedBy;
    }

    if (type === 'remarks') {
      return verifiedItem?.remarks !== 'null'
        ? verifiedItem?.remarks
        : '';
    }

    return null;
  };


  const handleApplyFilters = (values) => {
    if (!clientId) {
      alert('Client ID is missing. Please check your user profile.')
      return
    }
    setFilters({
      fromDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      toDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
      locationId: values.location,
      statusId: values.statusId,
      system: values.system,
      categoryId: values.category != 'All' ? values.category : null,
      pn: 1,
      ps: 10000,
    })
  }

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

    const filtered = reportData?.data?.content?.filter((item) => {
      const breakDown = item?.breakDownRemarks?.[0] || {};

      const searchString = [
        item.createdBy?.firstName,
        item.location?.name,
        item.cmKey,
        item.createdAt ? dayjs(item.createdAt).format('DD-MM-YYYYTHH:mm') : '',
        breakDown?.ptwNo,
        item.category?.name,
        item.assets?.name,
        item.faultCategory?.name,
        item.faultSubCategory?.name,
        item.status?.name,
        item.assignedTo?.firstName,
        item.updatedAt ? dayjs(item.updatedAt).format('DD-MM-YYYYTHH:mm') : '',
        breakDown?.remarks,
        breakDown?.verifiedBy,
        breakDown?.performedBy,
        breakDown?.date,
        item.duration
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchString.includes(searchValue);
    });

    setFilteredData(filtered);
  }

  // Export Section
  const [exporting, setExporting] = useState({ excel: false, pdf: false })

  const handleExportPDF = async () => {
    try {
      setExporting(prev => ({ ...prev, pdf: true }))

      await exportToPDF(
        columns,
        reportData?.data?.content,
        `Corrective Maintenance Details Report`,
        {
          orientation: 'landscape',
          format: 'a3'
        }
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
        reportData?.data?.content,
        `Corrective Maintenance Details Report`
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
        <title>{getPageTitle('reports/tasks/correctiveDetails')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Corrective Maintenance Reports Details`} />
      </Helmet>

      <Box>
        {/* <Typography variant="h4" gutterBottom fontWeight="bold">
          Corrective Maintenance Reports Details
        </Typography> */}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleApplyFilters}
            >
              <Row
                gutter={[16, 16]}
                wrap={false}
                style={{ overflowX: 'auto' }}
              >
                <Col span={4}>
                  <Form.Item
                    name="dateRange"
                    label="Date Range"
                    rules={[{ required: true, message: 'Please select date range!' }]}
                  >
                    <RangePicker
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                      disabledDate={(current) =>
                        current && current > dayjs().endOf('day')
                      }
                    />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="location" label="Location"  rules={[{ required: true, message: 'Please select Location!' }]}>
                    <Select loading={locationsLoading}>
                      <Select.Option value={-1}>All Location</Select.Option>
                      {locations?.map((loc) => (
                        <Select.Option key={loc.id} value={loc.id}>
                          {loc.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="system" label="System" rules={[{ required: true, message: 'Please select System!' }]}>
                    <Select onChange={handleSystemChange}>
                      <Select.Option value="TVS">TVS</Select.Option>
                      <Select.Option value="ECS">ECS</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Please select Category!' }]}>
                    <Select loading={categoryLoading}>
                      <Select.Option value="All">All</Select.Option>
                      {categoryList?.data?.map((loc) => (
                        <Select.Option key={loc.id} value={loc.id}>
                          {loc.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="statusId" label="Status" rules={[{ required: true, message: 'Please select Status!' }]}>
                    <Select>
                      <Select.Option value={-1}>All</Select.Option>
                      {filteredStatusList?.map((loc) => (
                        <Select.Option key={loc.id} value={loc.id}>
                          {loc.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item label=" ">
                    <Space>
                      <AntButton
                        type="primary"
                        htmlType="submit"
                        icon={<SearchOutlined />}
                        loading={queryLoading}
                      >
                        Search
                      </AntButton>
                      <AntButton onClick={() => form.resetFields()}>
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
                  disabled={!reportData || reportData?.data?.content?.length === 0}
                >
                  Export Excel
                </AntButton>

                <AntButton
                  icon={<FilePdfOutlined />}
                  onClick={handleExportPDF}
                  disabled={!reportData || reportData?.data?.content?.length === 0}
                >
                  Export PDF
                </AntButton>

              </Space>
            </Box>
            {queryLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <Spin />
              </Box>
            ) : (
              <Table
                dataSource={filteredData || reportData?.data?.content}
                columns={columns}
                rowKey={(record, index) => index}
                bordered
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

      {/* <style>
        {`
          .overdue-row {
            background-color: #fff1f0 !important;
            border-left: 4px solid red;
          }
        `}
      </style> */}
    </>
  )
}