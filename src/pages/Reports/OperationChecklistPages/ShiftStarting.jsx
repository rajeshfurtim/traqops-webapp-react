import { useState, useEffect, useRef, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Card, CardContent } from '@mui/material'
import { Form, Select, Space, Button as AntButton, Row, Col, DatePicker, Table, Spin } from 'antd'
import { FilePdfOutlined, StepBackwardOutlined, SearchOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationListQuery } from '../../../store/api/masterSettings.api'
import { useGetAssetListLocationWiseQuery, useGetChillerMonitoringChecklistQuery } from '../../../store/api/operationChecklist.api'
import { useAuth } from '../../../context/AuthContext'
import { useReactToPrint } from "react-to-print"
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

export default function ShiftStarting() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()
    const printRef = useRef(null)
    const navigate = useNavigate()

    const [filters, setFilters] = useState({})
    const selectedAssetId = filters.assetId;
    const [selectedLocationId, setSelectedLocationId] = useState(null)

    const { data: locationList, isLoading: locationLoading } = useGetLocationListQuery({ clientId, pageNumber: 1, pageSize: 1000 })
    const { data: assetList, isLoading: assetsLoading, isFetching: assetsFetching } = useGetAssetListLocationWiseQuery({ locationId: selectedLocationId, categoryId: 314029 }, { skip: !selectedLocationId })
    const { data: checklistData, isLoading: checklistLoading, isFetching } =
        useGetChillerMonitoringChecklistQuery(
            {
                ...filters,
                checklistId: 313990
            },
            {
                skip: !filters.locationId || !filters.assetId
            }
        )

    const result = checklistData?.data;

    useEffect(() => {
        form.setFieldsValue({
            date: dayjs(),
        })
    }, [])

    const handleLocationChange = (locationaId) => {
        console.log('locationaId:', locationaId)
        setSelectedLocationId(locationaId)
    }

    const handleFilterChange = (values) => {
        console.log('Filter values:', values)
        const newFilters = {}
        if (values.date) newFilters.date = dayjs(values.date).format('YYYY-MM-DD')
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

    const handlePrint = useReactToPrint({
        contentRef: printRef
    });

    // SHIFT FUNCTION
    const getShift = (date) => {
        const hour = dayjs(date).format("HH");
        if (hour === "06") return "Shift A";
        if (hour === "14") return "Shift B";
        if (hour === "22") return "Shift C";
        return "Shift A";
    };

    // VALUE DISPLAY
    const displayValue = (data, task) => {
        const name = data?.clElement?.name?.trim();
        const element = data?.elementData?.[task?.id];
        if (!element) return "";

        if (
            [
                "CHILLER RUNNING",
                "CONDENSER PUMP RUNNING",
                "CHILLER PUMP RUNNING",
                "COOLING TOWER FAN RUNNING",
                "CHILLED WATER PUMP",
            ].includes(name)
        ) {
            return element.textContent;
        }

        if (
            [
                "CHILLER PRESSURIZATION UNIT",
                "VAC PANEL -2 STATUS",
                "VAC PANEL -1 STATUS",
                "MCC PANEL -1 STATUS",
                "MCC PANEL -2 STATUS",
                "MCC PANEL -3 STATUS",
                "HYDRO PNEUMATIC PUMP STATUS",
                "CHILLER DOSING PUMPS",
                "CONDENSER DOSING PUMPS",
            ].includes(name)
        ) {
            return element.action === "Y" ? "ON" : "OFF";
        }

        if (name === "COOLING TOWER WATER LEVEL") {
            return element.action === "Y" ? "OK" : "NOT OK";
        }

        if (name === "TVS Normal mode Status") {
            return element.action === "Y" ? "SUCCESS" : "NOT SUCCESS";
        }

        if (
            name === "TEF FANS UPLINE RUNNING STATUS" ||
            name === "TEF FANS DNLINE RUNNING STATUS"
        ) {
            return element.action === "Y" ? "RUNNING" : "NOT RUNNING";
        }

        if (
            [
                "WRITE THE CURRENT VAC MODE RUNNING IN SCADA",
                "VAC SCADA IBP, EBI WORKING STATUS",
                "VAC SCADA WORKING STATUS",
                "TVS LCP WORKING STATUS",
                "TEF FANS WORKING STATUS",
                "TVS SCADA HMI AT SCR STATUS",
                "BLOW DOWN WATER FLOW METER STATUS",
                "COND WATER FLOW METER STATUS",
                "CHILLED WATER FLOW METER STATUS",
                "C1 TVS Status",
                "C1 TVS UPLINE RUNNING",
                "C1 TVS DNLINE RUNNING",
                "C2 TVS STATUS",
                "C2 TVS UPLINE RUNNING",
                "C2 TVS DNLINE RUNNING",
            ].includes(name)
        ) {
            return element.action === "Y" ? "WORKING" : "NOT WORKING";
        }

        if (name === "BLOW DOWN VALVE STATUS") {
            return element.action === "Y" ? "Open" : "Close";
        }

        return element.textContent;
    };

    const displayValue1 = (data, task) =>
        data?.elementData?.[task?.id]?.remark || "";

    // STATUS HELPERS
    const getStatusValues = (task, type) => {
        const statuses = task?.pmAssets?.[0]?.pmAssetStatus;
        if (!statuses) return "-";

        const found = statuses.find((s) => s.status?.name === type);
        if (!found) return "-";

        return `${found.userInfo?.userName} / ${dayjs(found.createdAt).format(
            "DD/MM/YY HH:mm"
        )}`;
    };

    const getStatusRemarks = (task, type) => {
        const statuses = task?.pmAssets?.[0]?.pmAssetStatus;
        if (!statuses) return "-";

        const found = statuses.find((s) => s.status?.name === type);
        return found?.Remarks || "-";
    };

    const getPerformedBy = (task) => {
        const asset = task?.pmAssets?.find(
            (a) => a.assets?.id === selectedAssetId
        );
        return asset?.performedBy || "-";
    };

    const getVerifiedByMaintainer = (task) => {
        const asset = task?.pmAssets?.find(
            (a) => a.assets?.id === selectedAssetId
        );
        return asset?.verifiedBy || "-";
    };

    const getOverallRemarks = (task) => {
        const asset = task?.pmAssets?.find(
            (a) => a.assets?.id === selectedAssetId
        );
        return asset?.pmAssetStatus?.[0]?.remarks || "-";
    };

    // BUILD COLUMNS
    const buildColumns = useMemo(() => {
        if (!result) return [];

        const tasks =
            result.tasks?.filter((t) => t?.pmAssets?.length > 0) || [];

        const dynamicColumns = tasks.map((task) => ({
            title: `${getShift(task.startDate)} - ${task?.status?.name}`,
            align: "center",
            children: [
                {
                    title: "Value",
                    align: "center",
                    render: (_, record) => {
                        if (record.isFooter === "performed")
                            return getPerformedBy(task);
                        if (record.isFooter === "completed")
                            return getStatusValues(task, "COMPLETED");
                        if (record.isFooter === "verifiedMaintainer")
                            return getVerifiedByMaintainer(task);
                        if (record.isFooter === "verified")
                            return getStatusValues(task, "VERIFIED");
                        if (record.isFooter === "overall")
                            return getOverallRemarks(task);
                        if (record.isFooter) return "";

                        return displayValue(record, task);
                    },
                },
                {
                    title: "Remarks",
                    align: "center",
                    render: (_, record) => {
                        if (record.isFooter === "completed")
                            return getStatusRemarks(task, "COMPLETED");
                        if (record.isFooter === "verified")
                            return getStatusRemarks(task, "VERIFIED");
                        if (record.isFooter) return "";

                        return displayValue1(record, task);
                    },
                },
            ],
        }));

        return [
            {
                title: "Sl.No",
                width: 80,
                render: (_, record, index) =>
                    record.isFooter ? "" : index + 1,
            },
            {
                title: "Equipment Name",
                width: 250,
                render: (_, record) => {
                    if (!record.isFooter) return record?.clElement?.name;

                    if (record.isFooter === "performed")
                        return "Performed By Operator";
                    if (record.isFooter === "completed")
                        return "Completed By / Date";
                    if (record.isFooter === "verifiedMaintainer")
                        return "Verified By Maintainers";
                    if (record.isFooter === "verified")
                        return "Verified By / Date";
                    if (record.isFooter === "overall")
                        return "Overall Remarks";
                },
            },
            ...dynamicColumns,
        ];
    }, [result, selectedAssetId]);

    // TABLE DATA
    const tableData = [
        ...(result?.data || []),
        { isFooter: "performed" },
        { isFooter: "completed" },
        { isFooter: "verifiedMaintainer" },
        { isFooter: "verified" },
        { isFooter: "overall" },
    ];

    return (
        <>
            <Helmet>
                <title>{getPageTitle('reports/operation-checklist/shift-starting')}</title>
                <meta name="description" content={`${APP_CONFIG.name} - Shift Starting`} />
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
                                        <DatePicker
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

                                <AntButton
                                    icon={<FilePdfOutlined />}
                                    onClick={handlePrint}
                                    disabled={!checklistData || checklistData?.data?.data?.length === 0}
                                >
                                    Export PDF
                                </AntButton>

                                <AntButton
                                    icon={<StepBackwardOutlined />}
                                    onClick={() => navigate('/reports/operation-checklist')}
                                >
                                    Back
                                </AntButton>

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
                                                            <th colSpan={6} style={{ border: "1px solid #ddd" }}>
                                                                <div style={{ display: "flex", alignItems: "center" }}>
                                                                    <img
                                                                        src="/assets/voltas_logo.png"
                                                                        width={60}
                                                                        alt="logo"
                                                                    />
                                                                    <div style={{ marginLeft: 5 }}>
                                                                        <div>Doc no: UG/VAC & TVS/CAMS/002</div>
                                                                        {/* <div>Asset: {getAssetName()}</div> */}
                                                                    </div>
                                                                </div>
                                                            </th>

                                                            <th colSpan={12} style={{ border: "1px solid #ddd" }}>
                                                                <h3 style={{ margin: 0 }}>
                                                                    ROUTINE SHIFT CHECKLIST FOR VAC & TVS EQUIPMENT RUNNING STATUS
                                                                </h3>
                                                            </th>

                                                            <th colSpan={6} style={{ border: "1px solid #ddd" }}>
                                                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                                                    <img
                                                                        src="/assets/cmrl.png"
                                                                        width={60}
                                                                        alt="logo"
                                                                    />
                                                                    <div style={{ marginLeft: 5 }}>
                                                                        <div>Station: {getLocationName()}</div>
                                                                        <div>
                                                                            Date:{" "}
                                                                            {dayjs(form.getFieldValue("date")).format(
                                                                                "DD/MM/YYYY"
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </th>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </Box>

                                            <Table
                                                columns={buildColumns}
                                                dataSource={tableData}
                                                rowKey={(record, index) =>
                                                    record.isFooter
                                                        ? `footer-${record.isFooter}`
                                                        : record.id || index
                                                }
                                                bordered
                                                scroll={{ x: "max-content" }}
                                                pagination={false}
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