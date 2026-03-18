import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent } from '@mui/material'
import {
    Table, Form, Select, DatePicker, Space,
    Button as AntButton, Empty, Input,
    Descriptions, Spin, Row, Col
} from 'antd'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../../../config/constants'
import { useGetLocationList } from '../../../../hooks/useGetLocationList'
import { useGettaskReportSummarycmQuery } from '../../../../store/api/taskReport.api'
import { useAuth } from '../../../../context/AuthContext'
import { SearchOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router-dom'

const { RangePicker } = DatePicker

export default function Cmreports() {
    const [form] = Form.useForm()
    const { user } = useAuth()
    const { locations, loading: locationsLoading } = useGetLocationList()
    const locationHook = useLocation()

    const navData = locationHook.state || {}

    const defaultLocationId = 10339
    const clientId = user?.client?.id || user?.clientId

    const [shouldFetch, setShouldFetch] = useState(false)

    /* ---------------- DEFAULT FILTERS ---------------- */
    const defaultFilters = {
        fromDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        toDate: dayjs().format('YYYY-MM-DD'),
        locationId: defaultLocationId,
        statusId: -1,
        system: -1,
        pn: 1,
        ps: 1000,
    }

    const [filters, setFilters] = useState(defaultFilters)

    /* ---------------- STATUS MAP ---------------- */
    const statusMap = {
        open: 640,
        completed: 631,
        verified: 15,
        workDone: 20,
        overdueCount: 30,
    }

    /* ---------------- MERGE NAV DATA ---------------- */
    useEffect(() => {
        if (!navData || Object.keys(navData).length === 0) return

        const statusId = statusMap[navData.statusType] ?? -1

        let locationId = navData.locationId

        // handle "1,2,3"
        if (typeof locationId === 'string' && locationId.includes(',')) {
            locationId = locationId.split(',')[0]
        }

        const mergedFilters = {
            ...defaultFilters,
            fromDate: navData.fromDate || defaultFilters.fromDate,
            toDate: navData.toDate || defaultFilters.toDate,
            locationId: Number(locationId) || defaultFilters.locationId,
            statusId,
            system: navData.system ?? -1,
        }

        setFilters(mergedFilters)
        setShouldFetch(true)

        // ✅ Sync form
        form.setFieldsValue({
            dateRange: [dayjs(mergedFilters.fromDate), dayjs(mergedFilters.toDate)],
            location: mergedFilters.locationId,
            statusId: mergedFilters.statusId,
            system: mergedFilters.system,
        })

    }, [navData])

    /* ---------------- API ---------------- */
    const { data: reportData, isLoading: isInitialLoading, isFetching } =
        useGettaskReportSummarycmQuery(
            { ...filters, clientId },
            {
                skip:
                    !filters.fromDate ||
                    !filters.toDate ||
                    !filters.locationId ||
                    !shouldFetch,
            }
        )

    const queryLoading = isInitialLoading || isFetching

    /* ---------------- TABLE DATA ---------------- */
    const reports = (reportData?.data?.content || []).map((item, index) => {
        const remark = item.breakDownRemarks?.[0] || {}

        return {
            index,
            sno: index + 1,
            raw: item,
            location: item.location?.name || "-",
            faultid: item.cmKey || "-",
            system: item.systemName || "-",
            status: item.status?.name || "-",
            assignedto: item.assignedTo?.firstName || "-",
        }
    })

    /* ---------------- SEARCH ---------------- */
    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
                <Input
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) =>
                        setSelectedKeys(e.target.value ? [e.target.value] : [])
                    }
                    onPressEnter={() => confirm()}
                    style={{ marginBottom: 8 }}
                />
                <Space>
                    <AntButton type="primary" size="small" onClick={() => confirm()} icon={<SearchOutlined />}>
                        Search
                    </AntButton>
                    <AntButton size="small" onClick={() => clearFilters()}>
                        Reset
                    </AntButton>
                </Space>
            </div>
        ),
        onFilter: (value, record) =>
            record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase()),
    })

    /* ---------------- COLUMNS ---------------- */
    const columns = [
        { title: 'S.No', dataIndex: 'sno', key: 'sno', ...getColumnSearchProps('sno') },
        { title: 'Location', dataIndex: 'location', key: 'location', ...getColumnSearchProps('location') },
        { title: 'Fault ID', dataIndex: 'faultid', key: 'faultid', ...getColumnSearchProps('faultid') },
        { title: 'System', dataIndex: 'system', key: 'system', ...getColumnSearchProps('system') },
        { title: 'Status', dataIndex: 'status', key: 'status', ...getColumnSearchProps('status') },
        { title: 'Assigned To', dataIndex: 'assignedto', key: 'assignedto', ...getColumnSearchProps('assignedto') },
    ]

    /* ---------------- EXPAND ---------------- */
    const expandedRowRender = (record) => (
        <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Fault Category">
                {record.raw?.faultCategory?.name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Fault Subcategory">
                {record.raw?.faultSubCategory?.name || "-"}
            </Descriptions.Item>
        </Descriptions>
    )

    /* ---------------- APPLY FILTERS ---------------- */
    const handleApplyFilters = (values) => {
        setShouldFetch(true)

        setFilters(prev => ({
            ...prev,
            fromDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
            toDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
            locationId: values.location ?? prev.locationId,
            statusId: values.statusId ?? prev.statusId,
            system: values.system ?? prev.system,
            pn: 1,
            ps: 1000,
        }))
    }

    return (
        <>
            <Helmet>
                <title>{getPageTitle('reports/tasks/correctiveDetails')}</title>
                <meta name="description" content={`${APP_CONFIG.name} - CM Reports`} />
            </Helmet>

            <Box>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Corrective Maintenance Reports Details
                </Typography>

                {/* FILTER FORM */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleApplyFilters}
                            initialValues={{
                                dateRange: [dayjs().subtract(1, 'day'), dayjs()],
                                location: defaultLocationId,
                                statusId: -1,
                                system: -1,
                            }}
                        >
                            <Row gutter={[16, 16]}>

                                <Col xs={24} sm={12} md={6}>
                                    <Form.Item name="dateRange" label="Date Range">
                                        <RangePicker style={{ width: '100%' }} />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12} md={6}>
                                    <Form.Item name="location" label="Location">
                                        <Select loading={locationsLoading} allowClear>
                                            {locations?.map((loc) => (
                                                <Select.Option key={loc.id} value={loc.id}>
                                                    {loc.name}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12} md={4}>
                                    <Form.Item name="system" label="System">
                                        <Select allowClear>
                                            <Select.Option value={-1}>All</Select.Option>
                                            <Select.Option value={640}>VAC</Select.Option>
                                            <Select.Option value={631}>TVS</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12} md={4}>
                                    <Form.Item name="statusId" label="Status">
                                        <Select allowClear>
                                            <Select.Option value={-1}>All</Select.Option>
                                            <Select.Option value={640}>Open</Select.Option>
                                            <Select.Option value={631}>Completed</Select.Option>
                                            <Select.Option value={15}>Verified</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={24} md={4}>
                                    <Form.Item label=" ">
                                        <Space>
                                            <AntButton type="primary" htmlType="submit" loading={queryLoading}>
                                                Apply
                                            </AntButton>
                                            <AntButton onClick={() => {
                                                form.resetFields()
                                                setShouldFetch(false)
                                            }}>
                                                Reset
                                            </AntButton>
                                        </Space>
                                    </Form.Item>
                                </Col>

                            </Row>
                        </Form>
                    </CardContent>
                </Card>

                {/* TABLE */}
                <Card>
                    <CardContent>
                        {!shouldFetch ? (
                            <Empty description="Please apply filters to view the report" />
                        ) : queryLoading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <Spin />
                            </Box>
                        ) : (
                            <Table
                                dataSource={reports}
                                columns={columns}
                                rowKey={(r, i) => i}
                                expandable={{ expandedRowRender }}
                                pagination={{ pageSize: 20 }}
                                scroll={{ x: 'max-content', y: 450 }}
                            />
                        )}
                    </CardContent>
                </Card>
            </Box>
        </>
    )
}