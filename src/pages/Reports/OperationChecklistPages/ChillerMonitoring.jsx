import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Card, CardContent } from '@mui/material'
import { Form, Select, Space, Button as AntButton, Row, Col, DatePicker, Table, Spin, Tooltip } from 'antd'
import { FilePdfOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationListQuery } from '../../../store/api/masterSettings.api'
import { useGetAssetListLocationWiseQuery, useGetChillerMonitoringChecklistQuery } from '../../../store/api/operationChecklist.api'
import { useAuth } from '../../../context/AuthContext'
import { useReactToPrint } from "react-to-print";
import dayjs from 'dayjs'
import "./print.css";

export default function ChillerMonitoring() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()
    const printRef = useRef(null);

    const [filters, setFilters] = useState({})
    const selectedAssetId = filters.assetId;
    const [selectedLocationId, setSelectedLocationId] = useState(null)

    const { data: locationList, isLoading: locationLoading } = useGetLocationListQuery({ clientId, pageNumber: 1, pageSize: 1000 })
    const { data: assetList, isLoading: assetsLoading, isFetching: assetsFetching } = useGetAssetListLocationWiseQuery({ locationId: selectedLocationId, categoryId: 11887 }, { skip: !selectedLocationId })
    const { data: checklistData, isLoading: checklistLoading, isFetching } =
        useGetChillerMonitoringChecklistQuery(
            {
                ...filters,
                checklistId: 44679
            },
            {
                skip: !filters.locationId || !filters.assetId
            }
        )

    useEffect(() => {
        form.setFieldsValue({
            date: dayjs(),
        })
    }, [])

    const handleLocationChange = (locationaId) => {
        console.log('locationaId:', locationaId)
        form.setFieldsValue({
            asset: null
        })
        setSelectedLocationId(locationaId)
    }

    const handleFilterChange = (values) => {
        console.log('Filter values:', values)
        const newFilters = {}
        if (values.date) newFilters.date = dayjs(values.date).format('YYYY-MM-DD')
        if (values.location) newFilters.locationId = values.location
        if (values.asset) newFilters.assetId = values.asset
        setFilters(newFilters)
    }

    const handleResetFilters = () => {
        form.resetFields()
        setFilters({})
    }

    // Checklist Logic
    const buildColumns = () => {
        if (!checklistData?.data?.data) return [];

        const baseColumns = [
            {
                title: "Sl.No",
                render: (_, record, index) => {
                    if (record.isFooter === "performed") return "";
                    if (record.isFooter === "completed") return "";
                    if (record.isFooter === "verifiedMaintainer") return "";
                    if (record.isFooter === "verified") return "";
                    if (record.isFooter === "overall") return "";
                    return index + 1;
                }
            },
            {
                title: "Equipment Name",
                render: (_, record) => {
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

                    return record.clElement?.name;
                }
            },
            {
                title: "Min/Max Level",
                dataIndex: ["clElement", "description"],
                width: 150
            },
            {
                title: "Units",
                dataIndex: ["clElement", "units"],
                width: 100
            }
        ];

        const dynamicTaskColumns = checklistData?.data?.tasks
            ?.filter(task => task.pmAssets?.length > 0)
            ?.map(task => ({
                title: (
                    <div style={{ textAlign: "center" }}>
                        <div>{dayjs(task.startDate).format("HH:00")}</div>
                        <div style={{ fontSize: 12 }}>
                            {task?.status?.name}
                        </div>
                    </div>
                ),
                children: [
                    {
                        title: "Value",
                        render: (_, record) => {
                            if (record.isFooter === "performed") {
                                return getPerformedBy(task);
                            }

                            if (record.isFooter === "completed") {
                                return getStatusValues(task, "COMPLETED");
                            }

                            if (record.isFooter === "verifiedMaintainer") {
                                return getVerifiedByMaintainer(task);
                            }

                            if (record.isFooter === "verified") {
                                return getStatusValues(task, "VERIFIED");
                            }

                            if (record.isFooter === "overall") {
                                return getOverall(task);
                            }

                            return displayValue(record, task);
                        }
                    },
                    {
                        title: "Remarks",
                        render: (_, record) => {
                            if (record.isFooter === "completed") {
                                return getStatusRemarks(task, "COMPLETED");
                            }

                            if (record.isFooter === "verified") {
                                return getStatusRemarks(task, "VERIFIED");
                            }

                            if (record.isFooter === "overall") {
                                return getOverall(task);
                            }

                            if (record.isFooter) return "";

                            return displayRemark(record, task);
                        }
                    }
                ]
            })) || [];

        return [...baseColumns, ...dynamicTaskColumns];
    };

    const displayValue = (data, task) => {
        const element = data.elementData?.[task.id];

        if (!element) return "-";

        if (data.clElement?.dataEntryType === "NUMERIC VALUE") {
            return element.value ?? "-";
        }

        if (data.clElement?.dataEntryType === "TEXT") {
            return element.textContent ?? "-";
        }

        if (data.clElement?.dataEntryType === "CHECKBOX") {
            return element.textContent ?? "-";
        }

        return "-";
    };

    const displayRemark = (data, task) => {
        return data.elementData?.[task.id]?.remark ?? "-";
    };

    const getPerformedBy = (task) => {

        if (!task?.pmAssets?.length) return "-";

        for (let asset of task.pmAssets) {
            if (asset?.assets?.id === selectedAssetId) {
                return asset?.performedBy ?? "-";
            }
        }

        return "-";
    };

    const getStatusValues = (task, type) => {

        if (!task?.pmAssets?.length) return "-";

        for (let asset of task.pmAssets) {
            if (
                asset?.assets?.id === selectedAssetId &&
                asset?.pmAssetStatus?.length
            ) {
                for (let status of asset.pmAssetStatus) {
                    if (status?.status?.name === type) {
                        const date = dayjs(status?.createdAt);
                        return `${status?.userInfo?.userName} / ${date.format("DD/MM/YY HH:mm")}`;
                    }
                }
            }
        }

        return "-";
    };

    const getStatusRemarks = (task, type) => {

        if (!task?.pmAssets?.length) return "-";

        for (let asset of task.pmAssets) {
            if (
                asset?.assets?.id === selectedAssetId &&
                asset?.pmAssetStatus?.length
            ) {
                for (let status of asset.pmAssetStatus) {
                    if (status?.status?.name === type) {
                        return status?.remarks ?? "-";
                    }
                }
            }
        }

        return "-";
    };

    const getVerifiedByMaintainer = (task) => {

        if (!task?.pmAssets?.length) return "-";

        for (let asset of task.pmAssets) {
            if (asset?.assets?.id === selectedAssetId) {
                return asset?.verifiedBy ?? "-";
            }
        }

        return "-";
    };

    const getOverall = (task) => {

        if (!task?.pmAssets?.length) return "-";

        for (let asset of task.pmAssets) {
            if (asset?.assets?.id === selectedAssetId) {
                return asset?.pmAssetStatus?.[0]?.remarks ?? "-";
            }
        }

        return "-";
    };

    const getAssetName = () => {
        return assetList?.data?.find(a => a.assetId === filters.assetId)?.assetName || "-";
    };

    const getLocationName = () => {
        return locationList?.data?.content?.find(l => l.id === filters.locationId)?.name || "-";
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        // documentTitle: `Routine_Monitoring_Checklist_${dayjs(filters.date).format("DD-MM-YYYY")}_${getLocationName()}_${getAssetName()}`,
    });

    return (
        <>
            <Helmet>
                <title>{getPageTitle('reports/operation-checklist/chiller-monitoring')}</title>
                <meta name="description" content={`${APP_CONFIG.name} - Chiller Monitoring`} />
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

                                <Col xs={24} sm={12} md={8} lg={6}>
                                    <Form.Item
                                        label="Asset"
                                        name="asset"
                                        rules={[{ required: true, message: 'Please select asset!' }]}
                                    >
                                        <Select
                                            placeholder="Select Asset"
                                            loading={assetsFetching || assetsLoading}
                                            disabled={assetsFetching || assetsLoading}
                                        >
                                            {assetList?.data?.map(l => (
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

                                                            {/* LEFT SECTION (colspan 3) */}
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
                                                                        <div>
                                                                            Doc no: <>UG/VAC & TVS/CAMS/001</>
                                                                        </div>
                                                                        <div>
                                                                            Asset: <>{getAssetName()}</>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </th>

                                                            {/* CENTER SECTION (colspan 9) */}
                                                            <th colSpan={12} style={{ textAlign: "center", border: "1px solid #ddd" }}>
                                                                <h3 style={{ margin: 0 }}>
                                                                    <>ROUTINE MONITORING CHECKLIST FOR CHILLER SYSTEM</>
                                                                </h3>
                                                            </th>

                                                            {/* RIGHT SECTION (colspan 4) */}
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
                                                                        <div>
                                                                            Station: <>{getLocationName()}</>
                                                                        </div>
                                                                        <div>
                                                                            Date: <>{dayjs(form.getFieldValue("date")).format("DD/MM/YYYY")}</>
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
                                                    ...checklistData?.data?.data || [],
                                                    { isFooter: "performed" },
                                                    { isFooter: "completed" },
                                                    { isFooter: "verifiedMaintainer" },
                                                    { isFooter: "verified" },
                                                    { isFooter: "overall" }
                                                ]}
                                                rowKey={(record, index) =>
                                                    record.isFooter ? `footer-${record.isFooter}` : record.id || index
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