import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Card, CardContent, CardHeader, Grid } from '@mui/material'
import { Table, Form, Select, Space, Button as AntButton, Input, DatePicker, Row, Col, message, Spin, TreeSelect } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import { useGetLocationListQuery } from '../../store/api/masterSettings.api'
import { useGetCyclicCheckDetailedReportQuery, useGetCyclicCheckReportQuery, useGetCyclicCheckStatusQuery } from '../../store/api/reports.api'
import { useAuth } from '../../context/AuthContext'
import { exportToExcel, exportToPDF } from '../../utils/exportUtils'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const { RangePicker } = DatePicker
const { SHOW_PARENT } = TreeSelect

export default function CyclicCheckReport() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()

    const [current, setCurrent] = useState(1)
    const [pageSize, setPagesize] = useState(25)
    const [current2, setCurrent2] = useState(1)
    const [pageSize2, setPagesize2] = useState(25)
    const [filters, setFilters] = useState({})

    const { data: locationList, isLoading: locationLoading } = useGetLocationListQuery({ clientId, pageNumber: 1, pageSize: 1000 })
    const { data: detailedReportList, isLoading: detailedReportLoading, isFetching: detailedReportFetching } =
        useGetCyclicCheckDetailedReportQuery({ ...filters }, { skip: !filters.locationId })
    const { data: reportList, isLoading: reportLoading, isFetching: reportFetching } =
        useGetCyclicCheckReportQuery({ ...filters }, { skip: !filters.locationId })
    const { data: cyclicStatus, isLoading: cyclicLoading, isFetching: cyclicFetching } =
        useGetCyclicCheckStatusQuery({ ...filters }, { skip: !filters.locationId })

    const total = (cyclicStatus?.data?.verifiedCount || 0) + (cyclicStatus?.data?.nonverifiedcount || 0);

    const IsLoading = detailedReportLoading || detailedReportFetching || reportLoading || reportFetching || cyclicLoading || cyclicFetching

    useEffect(() => {
        form.setFieldsValue({
            date: [dayjs().startOf('month'), dayjs()]
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
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (_, record) => record.createdAt ? dayjs(record.createdAt).format('DD/MM/YYYY') : '-',
            sorter: (a, b) => dayjs(a?.createdAt).valueOf() - dayjs(b?.createdAt).valueOf()
        },
        {
            title: 'Station Code',
            dataIndex: 'stationCode',
            key: 'stationCode',
            sorter: (a, b) => (a?.stationCode ?? '').localeCompare(b?.stationCode ?? '')
        },
        {
            title: 'Raised By',
            dataIndex: 'raisedBy',
            key: 'raisedBy',
            sorter: (a, b) => (a?.raisedBy ?? '').localeCompare(b?.raisedBy ?? '')
        },
        {
            title: 'Problem Description',
            dataIndex: 'description',
            key: 'description',
            sorter: (a, b) => (a?.description ?? '').localeCompare(b?.description ?? '')
        },
        {
            title: 'Category',
            dataIndex: 'categoryName',
            key: 'categoryName',
            sorter: (a, b) => (a?.categoryName ?? '').localeCompare(b?.categoryName ?? '')
        },
        {
            title: 'Equipment Name',
            dataIndex: 'equipment',
            key: 'equipment',
            sorter: (a, b) => (a?.equipment ?? '').localeCompare(b?.equipment ?? '')
        },
        {
            title: 'Request Approved By',
            dataIndex: 'approvedBy',
            key: 'approvedBy',
            sorter: (a, b) => (a?.approvedBy ?? '').localeCompare(b?.approvedBy ?? '')
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            sorter: (a, b) => (a?.status ?? '').localeCompare(b?.status ?? '')
        },
        {
            title: 'Remarks',
            dataIndex: 'remarks',
            key: 'remarks',
            sorter: (a, b) => (a?.remarks ?? '').localeCompare(b?.remarks ?? '')
        }
    ]

    const cyclicColumns = [
        {
            title: 'S.No',
            dataIndex: 'sno',
            key: 'sno',
            width: 80,
            render: (_, __, index) => ((current2 - 1) * pageSize2) + index + 1
        },
        {
            title: 'Equipment',
            dataIndex: 'equipment',
            key: 'equipment',
            sorter: (a, b) => (a?.equipment ?? '').localeCompare(b?.equipment ?? '')
        },
        {
            title: 'Station',
            dataIndex: 'locationCode',
            key: 'locationCode',
            sorter: (a, b) => (a?.locationCode ?? '').localeCompare(b?.locationCode ?? '')
        },
        {
            title: 'Last Maintenance Date',
            dataIndex: 'lastMaintenanceDate',
            key: 'lastMaintenanceDate',
            render: (_, record) => record.lastMaintenanceDate ? dayjs(record.lastMaintenanceDate).format('DD/MM/YYYY') : '-',
            sorter: (a, b) => dayjs(a?.lastMaintenanceDate).valueOf() - dayjs(b?.lastMaintenanceDate).valueOf()
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            sorter: (a, b) => (a?.status ?? '').localeCompare(b?.status ?? '')
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

        const filtered = detailedReportList?.data?.filter((item) =>
            `${item.stationCode ?? ''} ${item?.raisedBy ?? ''} ${item.description ?? ''}
        ${item.createdAt ? dayjs(item.createdAt).format('DD/MM/YYYY') : ''} ${item.categoryName ?? ''}
         ${item.equipment ?? ''} ${item?.approvedBy ?? ''} ${item?.status ?? ''} ${item.remarks ?? ''}`
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

            await exportToPDF(
                columns,
                detailedReportList?.data,
                `cyclic-check-report (Date: ${dayjs(filters.fromDate).format('DD/MM/YYYY')} to ${dayjs(filters.toDate).format('DD/MM/YYYY')} - Location: ${locationName[0]?.name ?? 'All'})`
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
                detailedReportList?.data,
                `cyclic-check-report-${dayjs(filters.fromDate).format('DD-MM-YYYY')}-${dayjs(filters.toDate).format('DD-MM-YYYY')}`
            )

            message.success('Excel exported successfully')
        } catch (err) {
            message.error('Excel export failed')
        } finally {
            setExporting(prev => ({ ...prev, excel: false }))
        }
    }

    const treeDataLocationList = [
        {
            title: "Select All Location",
            value: "all",
            key: "all",
            children: locationList?.data?.content?.map((location) => ({
                title: location.name,
                value: location.id,
                key: location.id,
            })),
        },
    ];

    return (
        <>
            <Helmet>
                <title>{getPageTitle('reports/cyclic-check-report')}</title>
                <meta name="description" content={`${APP_CONFIG.name} - Cyclic Check Report`} />
            </Helmet>
            <Box>

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
                                        <TreeSelect
                                            style={{ width: "100%" }}
                                            dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                                            treeData={treeDataLocationList}
                                            placeholder="Select Location"
                                            treeCheckable
                                            showCheckedStrategy={SHOW_PARENT}
                                            allowClear
                                            showSearch
                                            treeNodeFilterProp="title"
                                            maxTagCount={1}
                                            maxTagPlaceholder={(omittedValues) => `+ ${omittedValues.length} more`}
                                            onChange={(newValue) => {
                                                if (newValue?.includes("all")) {
                                                    form.setFieldsValue({
                                                        location: locationList?.data?.content?.map((loc) => loc.id),
                                                    });
                                                }
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={24} md={24} lg={6}>
                                    <Form.Item label=" ">
                                        <Space>
                                            <AntButton type="primary" htmlType="submit"
                                                icon={<SearchOutlined />}
                                                loading={IsLoading}
                                            >Search</AntButton>
                                            <AntButton onClick={handleResetFilters}>Reset</AntButton>
                                        </Space>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </CardContent>
                </Card>

                {/* <Card> */}
                <Grid container spacing={2} alignItems="stretch">
                    <Grid item xs={12} md={6}>
                        <Card style={{ marginBottom: 20, height: "100%" }}
                            sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}
                        >
                            <CardHeader title="Cyclic Check Report Status" />

                            <CardContent sx={{ flex: 1 }}>
                                {IsLoading ? (
                                    <Spin />
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    {
                                                        name: "Verified",
                                                        value: cyclicStatus?.data?.verifiedCount || 0,
                                                    },
                                                    {
                                                        name: "Non Verified",
                                                        value: cyclicStatus?.data?.nonverifiedcount || 0,
                                                    },
                                                ]}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={60}   // 🔥 donut effect
                                                outerRadius={100}
                                                paddingAngle={3}
                                                label
                                            >
                                                <Cell fill="#52c41a" />   {/* Green */}
                                                <Cell fill="#ff4d4f" />   {/* Red */}
                                            </Pie>

                                            <Tooltip />
                                            <Legend />
                                            <text
                                                x="50%"
                                                y="50%"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                style={{ fontSize: 18, fontWeight: "bold" }}
                                            >
                                                {total}
                                            </text>
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card style={{ marginBottom: 20, height: "100%" }} sx={{ display: "flex", flexDirection: "column" }}>
                            <CardHeader title="Cyclic Check Report" />
                            <CardContent sx={{ flex: 1, overflow: "auto" }}>
                                <Table
                                    dataSource={reportList?.data}
                                    columns={cyclicColumns}
                                    loading={IsLoading}
                                    rowKey={(record, index) => record.toolsId + "_" + index}
                                    size="middle"
                                    scroll={{ x: 'max-content' }}
                                    pagination={{
                                        position: ['bottomRight'],
                                        current: current2,
                                        pageSize: pageSize2,
                                        onChange: setCurrent2,
                                        showSizeChanger: true,
                                        onShowSizeChange: (current, size) => {
                                            setPagesize2(size);
                                            setCurrent2(current);
                                        },
                                        pageSizeOptions: ['25', '50', '100'],
                                        showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} items`,
                                        className: "custom-pagination"
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Card style={{ marginTop: 20 }}>
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
                                    disabled={!detailedReportList || detailedReportList?.data?.length === 0}
                                >
                                    Export Excel
                                </AntButton>

                                <AntButton
                                    icon={<FilePdfOutlined />}
                                    onClick={handleExportPDF}
                                    disabled={!detailedReportList || detailedReportList?.data?.length === 0}
                                >
                                    Export PDF
                                </AntButton>

                            </Space>
                        </Box>
                        {IsLoading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <Spin />
                            </Box>
                        ) : (
                            <Table
                                dataSource={filteredData ?? detailedReportList?.data}
                                columns={columns}
                                loading={IsLoading}
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
                {/* </Card> */}

            </Box>
        </>
    )
}