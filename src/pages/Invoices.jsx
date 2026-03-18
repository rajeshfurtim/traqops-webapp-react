import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Card, CardContent } from '@mui/material'
import { Table, Form, Select, Space, Button as AntButton, Input, Row, Col, message, Spin, Tag } from 'antd'
import { SearchOutlined, EditOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../config/constants'
import { useGetAllKPIsTypeQuery } from '../store/api/masterSettings.api'
import { useGetInvoiceSummaryQuery, useInvoiceGenerateMutation } from '../store/api/reports.api'
import { useAuth } from '../context/AuthContext'
import dayjs from 'dayjs'

export default function Invoices() {

  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId
  const [form] = Form.useForm()

  const [current, setCurrent] = useState(1)
  const [pageSize, setPagesize] = useState(25)
  const [filters, setFilters] = useState({})

  const { data: KPIsTypeList, isLoading: KPIsTypeLoading } = useGetAllKPIsTypeQuery({ clientId, pageNumber: 1, pageSize: 1000 })
  const { data: invoiceList, isLoading: invoiceLoading, isFetching } = useGetInvoiceSummaryQuery(
    {
      clientId,
      ...filters,
      pn: 1,
      ps: 1000
    },
    {
      skip: !filters.kpiTypeId
    }
  )

  const [invoiceGenerate] = useInvoiceGenerateMutation();

  useEffect(() => {
    form.setFieldsValue({
      kpiType: -1
    })
  }, [])

  const handleFilterChange = (values) => {
    console.log('Filter values:', values)
    const newFilters = {}
    if (values.kpiType) newFilters.kpiTypeId = values.kpiType
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
      title: 'Month',
      dataIndex: 'date',
      key: 'date',
      render: (_, record) => record?.date ? dayjs(record?.date).format('DD/MM/YYYY') : '',
      sorter: (a, b) => dayjs(a?.date).valueOf() - dayjs(b?.date).valueOf()
    },
    {
      title: 'Kpi Type',
      dataIndex: 'kpiType',
      key: 'kpiType',
      render: (_, record) => record?.kpiType?.name,
      sorter: (a, b) => (a?.kpiType?.name ?? '').localeCompare(b?.kpiType?.name ?? '')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (_, record) => <Tag style={{ borderRadius: 25, padding: '4px 8px', fontSize: 11, color: '#ffff', backgroundColor: '#108ee9' }}>{record?.status?.name}</Tag>,
      sorter: (a, b) => (a?.status?.name ?? '').localeCompare(b?.status?.name ?? '')
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (_, record) => (
        <>
          <AntButton
            type="primary"
            onClick={() => handleInvoice(record)}
            style={{ color: '#ffff', backgroundColor: '#32c448' }}
          >
            <EditOutlined />
          </AntButton>
        </>
      )
    },
  ]

  const handleInvoice = async (record) => {
    console.log('edit: ', record)
    try {
      const response = await invoiceGenerate({ id: record.id }).unwrap();
      message.success(response?.message || "Invoice generated successfully");
    } catch (error) {
      message.error(error?.data?.message || error?.data?.error || "Failed to generate invoice");
    }
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

    const filtered = invoiceList?.data?.content?.filter((item) =>
      `${item?.date ? dayjs(item?.date).format('DD/MM/YYYY') : ''}
     ${item?.kpiType?.name ?? ''} ${item?.status?.name ?? ''}`
        .toLowerCase()
        .includes(searchValue)
    );

    setFilteredData(filtered);
  };

  return (
    <>
      <Helmet>
        <title>{getPageTitle('invoices')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Invoice Management System`} />
      </Helmet>
      <Box>
        {/* <Typography variant="h4" gutterBottom fontWeight="bold">
          Invoice Management
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
                    label="KPI Type"
                    name="kpiType"
                    rules={[{ required: true, message: 'Please select kpi type!' }]}
                  >
                    <Select
                      placeholder="Select KPI Type"
                    >
                      <Select.Option value={-1}>
                        All Type
                      </Select.Option>
                      {KPIsTypeList?.data?.content?.map(l => (
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
                        loading={invoiceLoading || isFetching}
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
              </Space>
            </Box>
            {invoiceLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <Spin />
              </Box>
            ) : (
              <Table
                dataSource={filteredData ?? invoiceList?.data?.content}
                columns={columns}
                loading={invoiceLoading || isFetching}
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