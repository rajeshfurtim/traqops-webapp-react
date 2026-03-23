import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { Table, Form, Select, Space, Button as AntButton, DatePicker, Row, Col, Spin, Tabs, message } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined, AuditOutlined, BarsOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import { useGetAuditReportQuery, useGetKpiReportQuery } from '../../store/api/reports.api'
import { useGetAllKPIsTypeQuery } from '../../store/api/masterSettings.api'
import { useAuth } from '../../context/AuthContext'
import dayjs from 'dayjs'
import './audit.css'

export default function AuditReport() {

  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId

  const [form] = Form.useForm()
  const [filters, setFilters] = useState({})
  const [monthName, setMonthName] = useState('')

  const [kpiCateAndAttributes, setKpiCateAndAttributes] = useState([])
  const [kpiCategoriesDate, setKpiCategoriesDate] = useState([])
  const [reportList, setReportList] = useState([])

  const [accordionRes, setAccordionRes] = useState([])
  const [accordionDate, setAccordionDate] = useState(null)
  const [hideForm, setHideForm] = useState(true)
  const [selectTab, setSelectTab] = useState(1)

  const { data: typeList } = useGetAllKPIsTypeQuery({ clientId, pageNumber: 1, pageSize: 1000 })
  const { data: reportData, isLoading: reportLoading, isFetching } =
  useGetAuditReportQuery(
      {
        ...filters
      },
      {
        skip: !filters.kpiTypeId || !filters.fromDate || !filters.toDate
      }
    )
    const { data: kpiData, isLoading: kpiLoading, isFetching: kpiFetching } =
    useGetKpiReportQuery(
      {
        pn: 1,
        ps: 1000,
        clientId,
        ...filters
      },
      {
        skip: !filters.kpiTypeId
      }
    )

    // Set KPI categories
  useEffect(() => {
    if (kpiData?.data) {
      setKpiCateAndAttributes(kpiData.data)
    }
  }, [kpiData])

  // Set Report Data
  useEffect(() => {
    if (reportData?.data) {
      const res = reportData.data.map((value, index) => ({
        index: index + 1,
        id: value.id,
        date: dayjs(value.date).format('DD-MM-YYYY'),
        auditCategory: value.auditCatgeory,
        location: value.location
      }))

      setReportList(res)
      setKpiCategoriesDate(res)
    }
  }, [reportData])

  // Helpers
  const getName = (id) => {
    const item = typeList?.data?.content?.find(x => x.id === id)
    return item?.name || ''
  }

  const getPassPercentage = (date, categoryId, locationId) => {
    const res = reportList.filter(
      x => x.date === date && x.location.id === locationId
    )

    if (res.length) {
      const res2 = res[0].auditCategory?.filter(
        obj => obj.kpisCategory.id === categoryId
      )

      if (res2?.length && res2[0].total != null) {
        return res2[0].total
      }
    }

    return 0
  }

  // Filters
  const handleFilterChange = (values) => {
    const newFilters = {}

    if (values.month) {
      const start = dayjs(values.month).startOf('month')
      const end = dayjs(values.month).endOf('month')

      newFilters.fromDate = start.format('YYYY-MM-DD')
      newFilters.toDate = end.format('YYYY-MM-DD')

      setMonthName(start.format('MMMM - YY'))
    }

    if (values.type) newFilters.kpiTypeId = values.type

    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    form.resetFields()
    setFilters({})
    setReportList([])
    setKpiCateAndAttributes([])
  }

  // Accordion
  const submitAccordion = () => {
    if (!accordionDate) return

    const [date, stationId] = accordionDate.split(',')

    const filterRes = reportList.filter(
      x => x.date === date && x.location.id == stationId
    )

    if (filterRes.length) {
      setAccordionRes(filterRes[0].auditCategory)
    } else {
      message.error('Invalid Date or Station')
    }
  }

  // ---------------- TABLE VIEW ----------------
  const tableView = (
    <div id="printKpiTable" className="table-container">
      <table className="audit-table">
  
        <thead>
          <tr>
            <th colSpan={3 + kpiCategoriesDate.length} className="title">
              {getName(filters.kpiTypeId)} - Audit Evaluation Sheet for the month of {monthName}
            </th>
          </tr>
  
          <tr>
            <th rowSpan={2} className="center">KPI Category</th>
  
            <th rowSpan={2}>
              <div className="header-grid">
                <div></div>
                <div>Attributes</div>
                <div>Critical</div>
              </div>
            </th>
  
            <th rowSpan={2} className="center">Deduction Rate</th>
  
            {kpiCategoriesDate.map((kpi, i) => (
              <th key={i} className="center">
                {kpi.date}
                <br />
                ({kpi.location.code})
              </th>
            ))}
          </tr>
  
          <tr>
            {kpiCategoriesDate.map((_, i) => (
              <th key={i} className="center">Pass %</th>
            ))}
          </tr>
        </thead>
  
        <tbody>
          {kpiCateAndAttributes.map((kpi, i) => (
            <tr key={i}>
              
              <td className="center">{kpi.kpisCategoryName}</td>
  
              <td>
                {kpi.kpis.map((el, j) => (
                  <div key={j} className="row-grid">
                    <div>{j + 1}</div>
                    <div>{el.name}</div>
                    <div>{el.isCritical === 'Y' ? 'Y' : 'N'}</div>
                  </div>
                ))}
              </td>
  
              <td className="center">{kpi.deductionRate}%</td>
  
              {kpiCategoriesDate.map((cat, j) => (
                <td key={j} className="center">
                  {getPassPercentage(cat.date, kpi.kpisCategoryId, cat.location.id).toFixed(2)}%
                </td>
              ))}
            </tr>
          ))}
        </tbody>
  
      </table>
    </div>
  )

  // ---------------- DETAILED VIEW ----------------
  const detailedView = (
    <div id="printKpi" className="table-container">
  
      {/* Filter */}
      <div className="filter-row">
        <Select
          placeholder="Select Date"
          style={{ width: 300 }}
          value={accordionDate}
          onChange={setAccordionDate}
        >
          {reportList.map((res, i) => (
            <Select.Option
              key={i}
              value={`${res.date},${res.location.id},${res.location.name}`}
            >
              {res.date} - {res.location.code}
            </Select.Option>
          ))}
        </Select>
  
        <AntButton type="primary" onClick={submitAccordion}>
          Go
        </AntButton>
      </div>
  
      <table className="audit-table">
  
        <thead>
          <tr>
            <th colSpan={4} className="title">
  
              <div>
                {accordionDate
                  ? `Date: ${accordionDate.split(',')[0]} - ${accordionDate.split(',')[2]}`
                  : 'Date:'}
              </div>
  
              <div>
                {getName(filters.kpiTypeId)} - Audit Evaluation Sheet for the month of {monthName}
              </div>
  
            </th>
          </tr>
  
          <tr>
            <th className="center">KPI Category</th>
  
            <th>
              <div className="header-grid-5">
                <div></div>
                <div>Attributes</div>
                <div>Critical</div>
                <div>Audit Rate</div>
                <div>Remarks</div>
              </div>
            </th>
  
            <th className="center">Deduction Rate</th>
            <th className="center">Pass %</th>
          </tr>
        </thead>
  
        <tbody>
          {accordionRes.map((x, i) => (
            <tr key={i}>
              
              <td className="center">{x.kpisCategory.name}</td>
  
              <td>
                {x.evaluationElements.map((res, j) => (
                  <div key={j} className="row-grid-5">
  
                    <div>{j + 1}</div>
                    <div>{res.kpis.name}</div>
                    <div>{res.kpis.isCritical}</div>
                    <div>{res.action}</div>
                    <div>{res.remarks || '-'}</div>
  
                  </div>
                ))}
              </td>
  
              <td className="center">{x.kpisCategory.deductionRate}%</td>
              <td className="center">{x.total}%</td>
  
            </tr>
          ))}
        </tbody>
  
      </table>
    </div>
  )

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/evaluation/audit')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Audit Report`} />
      </Helmet>
      <Box>
        {/* <Typography variant="h4" gutterBottom fontWeight="bold">
          Audit Report
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
                    label="Month"
                    name="month"
                    rules={[{ required: true, message: 'Please select month!' }]}
                  >
                    <DatePicker
                    picker="month"
                      style={{ width: "100%" }}
                      format={'MMMM YYYY'}
                      disabledDate={(current) =>
                        current && current > dayjs().endOf('month')
                      }
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    label="Type"
                    name="type"
                    rules={[{ required: true, message: 'Please select type!' }]}
                  >
                    <Select
                      placeholder="Select Type"
                    >
                      <Select.Option value={-1}>All</Select.Option>
                      {typeList?.data?.content?.map(l => (
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
                        loading={reportLoading || isFetching}
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
            {reportLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <Spin />
              </Box>
            ) : (
              <Tabs
                defaultActiveKey="1"
                onChange={(key) => setSelectTab(Number(key))}
                items={[
                  { key: '1', label: 'Table View', children: tableView },
                  { key: '2', label: 'Detailed View', children: detailedView }
                ]}
              />
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

