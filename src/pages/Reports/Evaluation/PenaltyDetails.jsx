import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Card, CardContent } from '@mui/material'
import { Table, Form, Select, Space, Button as AntButton, Input, Row, Col, message, Spin, DatePicker, Modal } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationListQuery, useGetAllKPIsTypeQuery, useGetPenaltyCategoryByKpiIdQuery, useGetPenaltyByCategoryIdQuery } from '../../../store/api/masterSettings.api'
import { useGetEvaluationElementsPenaltysQuery, useAddEvaluationPenaltyMutation } from '../../../store/api/reports.api'
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils'
import { useAuth } from '../../../context/AuthContext'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

export default function PenaltyDetails() {

  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId
  const [form] = Form.useForm()
  const [addForm] = Form.useForm()

  const [current, setCurrent] = useState(1)
  const [pageSize, setPagesize] = useState(25)
  const [filters, setFilters] = useState({})
  const [selectedKpiTypeId, setSelectedKpiTypeId] = useState(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: locationList, isLoading: locationLoading } = useGetLocationListQuery({ clientId, pageNumber: 1, pageSize: 1000 })
  const { data: KPIsTypeList, isLoading: KPIsTypeLoading } = useGetAllKPIsTypeQuery({ clientId, pageNumber: 1, pageSize: 1000 })
  const { data: penaltyCategoryList, isLoading: penaltyCategoryLoading, isFetching: penaltyCategoryFetching } = useGetPenaltyCategoryByKpiIdQuery({ kpiTypeId: selectedKpiTypeId }, { skip: !selectedKpiTypeId })
  const { data: penaltyList, isLoading: penaltyLoading, isFetching: penaltyFetching } = useGetPenaltyByCategoryIdQuery({ penaltyCategoryId: selectedCategoryId }, { skip: !selectedCategoryId })
  const { data: evaluationElementsPenaltys, isLoading: penaltysLoading, isFetching } =
    useGetEvaluationElementsPenaltysQuery(
      {
        ...filters,
        pn: 1,
        ps: 1000
      },
      {
        skip: !filters.locationId || !filters.penaltyCategoryId
      }
    )

  const [addEvaluationPenalty] = useAddEvaluationPenaltyMutation();

  useEffect(() => {
    form.setFieldsValue({
      date: [dayjs().startOf('month'), dayjs()],
      location: -1,
      kpiType: -1
    })
  }, [])

  const handleKpiTypeChange = (kpiTypeId) => {
    console.log('kpiTypeId:', kpiTypeId)
    addForm.setFieldsValue({
      penaltyCategory: null,
      penalty: null,
      penaltyAmount: null
    })
    setSelectedKpiTypeId(kpiTypeId)
  }

  const handleCategoryChange = (categoryId) => {
    console.log('categoryId:', categoryId)
    addForm.setFieldsValue({
      penalty: null,
      penaltyAmount: null
    })
    setSelectedCategoryId(kpiTypeId)
  }

  const handlePenaltyAmount = (penaltyId) => {
    console.log('penaltyId:', penaltyId)
    const penaltyAmount = penaltyList.filter((z) => z.id == penaltyId);
    console.log(penaltyAmount)

    addForm.setFieldsValue({
      penaltyAmount: penaltyAmount[0]?.penalty
    })
  }

  const handleFilterChange = (values) => {
    console.log('Filter values:', values)
    const newFilters = {}
    if (values.date) {
      newFilters.fromDate = dayjs(values.date[0]).format('YYYY-MM-DD')
      newFilters.toDate = dayjs(values.date[1]).format('YYYY-MM-DD')
    }
    if (values.kpiType) newFilters.penaltyCategoryId = values.kpiType
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
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (_, record) => record?.date ? dayjs(record?.date).format('DD/MM/YYYY') : '',
      sorter: (a, b) => dayjs(a?.date).valueOf() - dayjs(b?.date).valueOf()
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (_, record) => record?.location?.name,
      sorter: (a, b) => (a?.location?.name ?? '').localeCompare(b?.location?.name ?? '')
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      sorter: (a, b) => (a?.description ?? '').localeCompare(b?.description ?? '')
    },
    {
      title: 'Penalty Amount',
      dataIndex: 'penaltyValue',
      key: 'penaltyValue',
      sorter: (a, b) => a?.penaltyValue - b?.penaltyValue
    },
    {
      title: 'Kpi Type',
      dataIndex: 'kpiType',
      key: 'kpiType',
      render: (_, record) => record?.penalty?.penaltyCategory?.kpiType?.name,
      sorter: (a, b) => (a?.penalty?.penaltyCategory?.kpiType?.name ?? '').localeCompare(b?.penalty?.penaltyCategory?.kpiType?.name ?? '')
    },
    {
      title: 'Penalty Category',
      dataIndex: 'penaltyCategory',
      key: 'penaltyCategory',
      render: (_, record) => record?.penalty?.penaltyCategory?.name,
      sorter: (a, b) => (a?.penalty?.penaltyCategory?.name ?? '').localeCompare(b?.penalty?.penaltyCategory?.name ?? '')
    },
    {
      title: 'Remarks',
      dataIndex: 'remark',
      key: 'remark',
      sorter: (a, b) => a?.remark - b?.remark
    },
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

    const filtered = evaluationElementsPenaltys?.data?.content?.filter((item) =>
      `${item?.date ? dayjs(item?.date).format('DD/MM/YYYY') : ''}
     ${item?.description ?? ''} ${item?.penalty?.penaltyCategory?.kpiType?.name ?? ''}
      ${item?.remark ?? ''} ${item?.penaltyValue ?? ''}
       ${item?.penalty?.penaltyCategory?.name ?? ''}`
        .toLowerCase()
        .includes(searchValue)
    );

    setFilteredData(filtered);
  };

  const [exporting, setExporting] = useState({ excel: false, pdf: false })

  const handleExportPDF = async () => {
    try {
      setExporting(prev => ({ ...prev, pdf: true }))
      const kpiTypeName = KPIsTypeList.data?.content?.filter(loc => loc.id === filters.penaltyCategoryId)
      const locationName = locationList.data?.content?.filter(loc => loc?.id === filters.locationId)

      await exportToPDF(
        columns,
        evaluationElementsPenaltys?.data?.content,
        `penalty-detail-report (Date: ${dayjs(filters.fromDate).format('DD/MM/YYYY')} to ${dayjs(filters.toDate).format('DD/MM/YYYY')} - Location: ${locationName[0]?.name ?? 'All'} - KPI Type: ${kpiTypeName[0]?.name ?? 'All'})`
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
      const kpiTypeName = KPIsTypeList.data?.content?.filter(loc => loc.id === filters.penaltyCategoryId)
      const locationName = locationList.data?.content?.filter(loc => loc?.id === filters.locationId)

      await exportToExcel(
        columns,
        evaluationElementsPenaltys?.data?.content,
        `penalty-detail-report (Date: ${dayjs(filters.fromDate).format('DD/MM/YYYY')} to ${dayjs(filters.toDate).format('DD/MM/YYYY')} - Location: ${locationName[0]?.name ?? 'All'} - KPI Type: ${kpiTypeName[0]?.name ?? 'All'})`
      )

      message.success('Excel exported successfully')
    } catch (err) {
      message.error('Excel export failed')
    } finally {
      setExporting(prev => ({ ...prev, excel: false }))
    }
  }

  const handleAdd = () => {
    setIsModalOpen(true)
  }

  const handleModalCancel = () => {
    addForm.resetFields()
    setSelectedRecord(null)
    setSelectedKpiTypeId(null)
    setSelectedCategoryId(null)
    setIsModalOpen(false)
  }

  const handleEdit = (record) => {
    console.log('on edit:', record)
    setSelectedRecord(record)
    setSelectedKpiTypeId(record?.penalty?.penaltyCategory?.kpiType?.id)
    setSelectedCategoryId(record?.penalty?.penaltyCategory?.id)
    setIsModalOpen(true)

    addForm.setFieldsValue({
      name: record?.name,
      date: record?.date,
      location: record?.location?.id,
      kpiType: record?.penalty?.penaltyCategory?.kpiType?.id,
      penaltyCategory: record?.penalty?.penaltyCategory?.id,
      penalty: record?.penalty?.id,
      penaltyAmount: record.penaltyValue,
      remark: record?.remark
    });

  }

  const handleModalOk = async () => {
    const values = await addForm.validateFields();
    console.log('form values:', values);

    const payload = {
      ...(selectedRecord?.id && { id: selectedRecord.id }),

      name: values.name,
      date: values.date,
      locationId: values.location,
      penaltyId: values.penalty,
      penaltyValue: values.penaltyAmount,
      remark: values.remark
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(
        ([_, value]) =>
          value !== undefined &&
          value !== null &&
          !(Array.isArray(value) && value.length === 0)
      )
    );

    console.log("Final Clean Payload:", cleanPayload);
    handleSubmit(cleanPayload)
  }

  const handleSubmit = async (payload) => {
    try {
      const response = await addEvaluationPenalty(payload).unwrap();
      message.success(response?.message || "Evaluation penalty saved successfully");
    } catch (error) {
      message.error(error?.data?.message || error?.data?.error || "Failed to save evaluation penalty");
    } finally {
      handleModalCancel()
    }
  }

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/evaluation/penalty-details')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Penalty Details`} />
      </Helmet>
      <Box>
        {/* <Typography variant="h4" gutterBottom fontWeight="bold">
          Penalty Details
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
                    label="Location"
                    name="location"
                    rules={[{ required: true, message: 'Please select location!' }]}
                  >
                    <Select
                      placeholder="Select Location"
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
                        loading={penaltysLoading || isFetching}
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
                <AntButton type="primary" icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  Add
                </AntButton>
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
                  disabled={!evaluationElementsPenaltys || evaluationElementsPenaltys?.data?.content?.length === 0}
                >
                  Export Excel
                </AntButton>

                <AntButton
                  icon={<FilePdfOutlined />}
                  onClick={handleExportPDF}
                  disabled={!evaluationElementsPenaltys || evaluationElementsPenaltys?.data?.content?.length === 0}
                >
                  Export PDF
                </AntButton>

              </Space>
            </Box>
            {penaltysLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <Spin />
              </Box>
            ) : (
              <Table
                dataSource={filteredData ?? evaluationElementsPenaltys?.data?.content}
                columns={columns}
                loading={penaltysLoading || isFetching}
                rowKey={(record, index) => record.id + "_" + index}
                size="middle"
                scroll={{ x: 'max-content' }}
                onRow={(record) => ({
                  onClick: () => handleEdit(record),
                  style: { cursor: "pointer" },
                })}
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

        <Modal
          title={selectedRecord ? "Edit Penalty" : "Add Penalty"}
          open={isModalOpen}
          onCancel={handleModalCancel}
          footer={[

            // Cancel Button
            <AntButton key="cancel" onClick={handleModalCancel}>
              Cancel
            </AntButton>,

            // Submit Button
            <AntButton key="submit" type="primary" onClick={handleModalOk}>
              Submit
            </AntButton>,
          ]}
        >
          <Form
            form={addForm}
            layout="vertical"
            style={{ marginTop: 24 }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={12} lg={12}>
                <Form.Item
                  label="Date"
                  name="date"
                  rules={[{ required: true, message: 'Please select date!' }]}
                >
                  <DatePicker format={'DD/MM/YYYY'} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={12} lg={12}>
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
              <Col xs={24} sm={12} md={12} lg={12}>
                <Form.Item
                  label="Name"
                  name="name"
                  rules={[{ required: true, message: 'Please enter name!' }]}
                >
                  <Input type='text' />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={12} lg={12}>
                <Form.Item
                  label="Kpi Type"
                  name="kpiType"
                  rules={[{ required: true, message: 'Please select kpi type!' }]}
                >
                  <Select
                    placeholder="Select Kpi Type"
                    onChange={handleKpiTypeChange}
                  >
                    {KPIsTypeList?.data?.content?.map(l => (
                      <Select.Option key={l.id} value={l.id}>
                        {l.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={12} lg={12}>
                <Form.Item
                  label="Penalty Category"
                  name="penaltyCategory"
                  rules={[{ required: true, message: 'Please select penalty Category!' }]}
                >
                  <Select
                    placeholder="Select Category"
                    onChange={handleCategoryChange}
                    loading={penaltyCategoryLoading || penaltyCategoryFetching} disabled={penaltyCategoryLoading || penaltyCategoryFetching}
                  >
                    {penaltyCategoryList?.data?.content?.map(l => (
                      <Select.Option key={l.id} value={l.id}>
                        {l.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={12} lg={12}>
                <Form.Item
                  label="Penalty"
                  name="penalty"
                  rules={[{ required: true, message: 'Please select penalty!' }]}
                >
                  <Select
                    placeholder="Select Penalty"
                    onChange={handlePenaltyAmount}
                    loading={penaltyLoading || penaltyFetching} disabled={penaltyLoading || penaltyFetching}
                  >
                    {penaltyList?.data?.content?.map(l => (
                      <Select.Option key={l.id} value={l.id}>
                        {l.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={12} lg={12}>
                <Form.Item
                  label="Penalty Amount"
                  name="penaltyAmount"
                  rules={[{ required: true, message: 'Please enter penalty amount!' }]}
                >
                  <Input type='number' />
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={24} lg={24}>
                <Form.Item
                  label="Remark"
                  name="remark"
                  rules={[{ required: false, message: 'Please enter remark!' }]}
                >
                  <Input.TextArea rows={3} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </Box>
    </>
  )
}