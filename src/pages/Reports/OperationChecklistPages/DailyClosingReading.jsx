import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Card, CardContent } from '@mui/material'
import { Form, Select, Space, Button as AntButton, Row, Col, DatePicker, Table, Spin, Tooltip } from 'antd'
import { FilePdfOutlined, StepBackwardOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationListQuery } from '../../../store/api/masterSettings.api'
import { useGetAssetListLocationWiseQuery, useGetDailyChecksChecklistQuery } from '../../../store/api/operationChecklist.api'
import { useAuth } from '../../../context/AuthContext'
import { useReactToPrint } from "react-to-print"
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

export default function DailyClosingReading() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()
    const printRef = useRef(null)
    const navigate = useNavigate()

    const [filters, setFilters] = useState({})
    const [selectedLocationId, setSelectedLocationId] = useState(null)

    const { data: locationList, isLoading: locationLoading } = useGetLocationListQuery({ clientId, pageNumber: 1, pageSize: 1000 })
    const { data: assetList, isLoading: assetsLoading, isFetching: assetsFetching } = useGetAssetListLocationWiseQuery({ locationId: selectedLocationId, categoryId: 612662 }, { skip: !selectedLocationId })
    const { data: checklistData, isLoading: checklistLoading, isFetching } =
        useGetDailyChecksChecklistQuery(
            {
                ...filters,
                checklistId: 612543
            },
            {
                skip: !filters.locationId || !filters.assetId
            }
        )

    const result = checklistData?.data;

    useEffect(() => {
        form.setFieldsValue({
            date: [dayjs().startOf('week'), dayjs()],
        })
    }, [])

    const handleLocationChange = (locationaId) => {
        console.log('locationaId:', locationaId)
        setSelectedLocationId(locationaId)
    }

    const handleFilterChange = (values) => {
        console.log('Filter values:', values)
        const newFilters = {}
        if (values.date) {
            newFilters.fromDate = dayjs(values.date[0]).format('YYYY-MM-DD')
            newFilters.toDate = dayjs(values.date[1]).format('YYYY-MM-DD')
        }
        if (values.location) newFilters.locationId = values.location
        if (assetList?.data[0]?.assetId) newFilters.assetId = assetList?.data[0]?.assetId
        setFilters(newFilters)
    }

    const handleResetFilters = () => {
        form.resetFields()
        setFilters({})
    }

    // Checklist Logic
    const getAssetName = () => {
        return assetList?.data?.find(a => a.assetId === filters.assetId)?.assetName || "-";
    };

    const getLocationName = () => {
        return locationList?.data?.content?.find(l => l.id === filters.locationId)?.name || "-";
    };

    const getTaskName = (task) => {
        return dayjs(task.startDate).format("DD/MM/YY");
    };

    const displayValue = (data, task) => {
        const entry = data.elementData?.[task.id];

        if (!entry) return "-";

        const type = data.clElement?.dataEntryType;

        if (type === "NUMERIC VALUE") return entry.value || "-";
        if (type === "TEXT") return entry.textContent || "-";
        if (type === "CHECKBOX") return entry.textContent || "-";

        return "-";
    };

    const displayValue1 = (data, task) => {
        return data.elementData?.[task.id]?.remark || "-";
    };

    const getPerfomedBy = (task) => {
        if (!task.pmAssets?.length) return "-";

        const asset = task.pmAssets.find(
            (a) => a.assets.id === filters.assetId
        );

        return asset?.performedBy || "-";
    };

    const getStatusValues = (task, type) => {
        const asset = task.pmAssets?.find(
            (a) => a.assets.id === filters.assetId
        );

        const statuses = asset?.pmAssetStatus || [];

        for (let status of statuses) {
            if (status.status.name === type) {
                return `${status.userInfo.userName} / ${dayjs(status.createdAt).format(
                    "DD/MM/YY HH:mm"
                )}`;
            }
        }

        return "-";
    };

    const getStatusRemarks = (task, type) => {
        const statuses = task.pmAssets?.[0]?.pmAssetStatus || [];

        for (let status of statuses) {
            if (status.status.name === type) {
                return status.Remarks || "-";
            }
        }

        return "-";
    };

    const getVerifiedByMaintainer = (task) => {
        const asset = task.pmAssets?.find(
            (a) => a.assets.id === filters.assetId
        );

        return asset?.verifiedBy || "-";
    };

    const getOverallremarks = (task) => {
        const asset = task.pmAssets?.find(
            (a) => a.assets.id === filters.assetId
        );

        return asset?.pmAssetStatus?.[0]?.remarks || "-";
    };

    const buildColumns = () => {
        if (!result?.tasks) return [];

        const taskColumns = result.tasks
            .filter((task) => task.pmAssets?.length > 0)
            .map((task) => ({
                title: (
                    <div style={{ textAlign: "center" }}>
                        {getTaskName(task)}
                        <div>{task.status?.name}</div>
                    </div>
                ),
                children: [
                    {
                        title: "Value",
                        align: "center",
                        render: (_, record) => {
                            if (record.isFooter) {
                                if (record.isFooter === "performed")
                                    return getPerfomedBy(task);

                                if (record.isFooter === "completed")
                                    return getStatusValues(task, "COMPLETED");

                                if (record.isFooter === "verifiedMaintainer")
                                    return getVerifiedByMaintainer(task);

                                if (record.isFooter === "verified")
                                    return getStatusValues(task, "VERIFIED");

                                return "";
                            }

                            return displayValue(record, task);
                        },
                    },
                    {
                        title: "Remarks",
                        align: "center",
                        render: (_, record) => {
                            if (record.isFooter) {
                                if (record.isFooter === "completed")
                                    return getStatusRemarks(task, "COMPLETED");

                                if (record.isFooter === "verified")
                                    return getStatusRemarks(task, "VERIFIED");

                                if (record.isFooter === "overall")
                                    return getOverallremarks(task);

                                return "";
                            }

                            return displayValue1(record, task);
                        },
                    },
                ],
            }));

        return [
            {
                title: "Sl.No",
                render: (_, __, index) => (__.isFooter ? "" : index + 1),
                width: 80,
            },
            {
                title: "Equipment Name",
                render: (_, record) => {
                    if (record.isFooter === "performed") return "Perfomed By Operator";
                    if (record.isFooter === "completed") return "Completed By / Date";
                    if (record.isFooter === "verifiedMaintainer")
                        return "Verified By Maintainers";
                    if (record.isFooter === "verified") return "Verified By / Date";
                    if (record.isFooter === "overall") return "Overall Remarks";

                    return record.clElement?.name;
                },
                width: 250,
            },
            ...taskColumns,
        ];
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef
    });

    return (
        <>
            <Helmet>
                <title>{getPageTitle('reports/operation-checklist/closing-reading')}</title>
                <meta name="description" content={`${APP_CONFIG.name} - Daily Closing Reading`} />
            </Helmet>
            <Box>
                {/* <Typography variant="h4" gutterBottom fontWeight="bold">
          Chiller Monitoring
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
                                        rules={[{ required: true, message: 'Please select date!' }]}
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
                                            onChange={handleLocationChange}
                                        >
                                            {locationList?.data?.content?.map(l => (
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
                                                loading={checklistLoading || isFetching}
                                            >
                                                Get Report
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
                                <Tooltip title="Export PDF">
                                    <AntButton
                                        type="primary"
                                        icon={<FilePdfOutlined />}
                                        onClick={handlePrint}
                                        disabled={checklistData?.data?.data?.length === 0}
                                        style={{ backgroundColor: 'rgb(240, 42, 45)', color: '#fff' }}
                                    >
                                    </AntButton>
                                </Tooltip>
                                <Tooltip title="Back">
                                    <AntButton
                                        type="primary"
                                        icon={<StepBackwardOutlined />}
                                        onClick={() => navigate('/reports/operation-checklist')}
                                        style={{ backgroundColor: 'rgb(99, 156, 210)', color: '#fff' }}
                                    >
                                    </AntButton>
                                </Tooltip>
                            </Space>
                        </Box>
                        {(checklistLoading || isFetching) ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <Spin />
                            </Box>
                        ) : (
                            <>
                                {checklistData?.data && (
                                    <>
                                        <div ref={printRef}>
                                            <Box sx={{ mb: 2 }}>
                                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                    <tbody>
                                                        <tr style={{ height: "100px", backgroundColor: "#fff" }}>
                                                            <th colSpan={6} style={{ textAlign: "left", border: "1px solid #ddd" }}>
                                                                <div style={{ display: "flex", alignItems: "center" }}>
                                                                    <img
                                                                        src="/assets/voltas_logo.png"
                                                                        alt="logo"
                                                                        width={60}
                                                                        height={60}
                                                                        style={{ marginRight: 10 }}
                                                                    />

                                                                    <div>
                                                                        <div>Doc no: UG/VAC & TVS/CAMS/004</div>
                                                                        <div>Asset: {getAssetName()}</div>
                                                                    </div>
                                                                </div>
                                                            </th>

                                                            <th colSpan={12} style={{ textAlign: "center", border: "1px solid #ddd" }}>
                                                                <h3 style={{ margin: 0 }}>
                                                                    DAILY CLOSING READING CHECKLIST
                                                                </h3>
                                                            </th>

                                                            <th colSpan={6} style={{ textAlign: "right", border: "1px solid #ddd" }}>
                                                                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                                                                    <img
                                                                        src="/assets/cmrl.png"
                                                                        alt="logo"
                                                                        width={60}
                                                                        height={60}
                                                                        style={{ marginRight: 15 }}
                                                                    />

                                                                    <div style={{ textAlign: "left" }}>
                                                                        <div>Station: {getLocationName()}</div>
                                                                        <div>
                                                                            Date: {dayjs(filters.date[0]).format("DD/MM/YYYY")}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </th>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </Box>

                                            <Table
                                                columns={buildColumns()}
                                                dataSource={[
                                                    ...(result?.data || []),
                                                    { isFooter: "performed" },
                                                    { isFooter: "completed" },
                                                    { isFooter: "verifiedMaintainer" },
                                                    { isFooter: "verified" },
                                                    { isFooter: "overall" },
                                                ]}
                                                rowKey={(record, index) =>
                                                    record.isFooter ? `footer-${record.isFooter}` : record.id || index
                                                }
                                                bordered
                                                pagination={false}
                                                scroll={{ x: "max-content" }}
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </>
    )
}