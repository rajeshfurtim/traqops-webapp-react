import { useState, useEffect, useRef, useMemo } from 'react'
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

export default function CriticalRoomTemp() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()
    const printRef = useRef(null);

    const [filters, setFilters] = useState({})
    const selectedAssetId = filters.assetId;
    const [selectedLocationId, setSelectedLocationId] = useState(null)

    const { data: locationList, isLoading: locationLoading } = useGetLocationListQuery({ clientId, pageNumber: 1, pageSize: 1000 })
    const { data: assetList, isLoading: assetsLoading, isFetching: assetsFetching } = useGetAssetListLocationWiseQuery({ locationId: selectedLocationId, categoryId: 314394 }, { skip: !selectedLocationId })
    const { data: checklistData, isLoading: checklistLoading, isFetching } =
        useGetChillerMonitoringChecklistQuery(
            {
                ...filters,
                checklistId: 314373
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

    // Checklist Logic
    const getTaskName = (task) => {
        const time = dayjs(task.startDate).format("HH:00");
        if (task.name?.includes("WBT")) return `${time} (WBT)`;
        if (task.name?.includes("DBT")) return `${time} (DBT)`;
        return time;
    };

    const displayValue = (data, task) => {
        const element = data?.elementData?.[task?.id];
        if (!element) return "-";

        const type = data?.clElement?.dataEntryType;

        if (type === "NUMERIC VALUE") return element.value ?? "-";
        if (type === "TEXT") return element.textContent ?? "-";
        if (type === "CHECKBOX") return element.textContent ?? "-";

        return "-";
    };

    const displayValue1 = (data, task) => {
        return data?.elementData?.[task?.id]?.remark ?? "-";
    };

    const getStatusValues = (task, type) => {
        if (!task?.pmAssets?.length) return "-";

        for (const asset of task.pmAssets) {
            if (asset.assets.id === filters.assetId) {
                const statuses = asset.pmAssetStatus || [];
                for (const status of statuses) {
                    if (status.status.name === type) {
                        return `${status.userInfo.userName} / ${dayjs(
                            status.createdAt
                        ).format("DD/MM/YY HH:mm")}`;
                    }
                }
            }
        }
        return "-";
    };

    const getStatusRemarks = (task, type) => {
        if (!task?.pmAssets?.length) return "-";

        for (const asset of task.pmAssets) {
            if (asset.assets.id === filters.assetId) {
                const statuses = asset.pmAssetStatus || [];
                for (const status of statuses) {
                    if (status.status.name === type) {
                        return status.Remarks ?? "-";
                    }
                }
            }
        }
        return "-";
    };

    const getVerifiedBymaintaner = (task) => {
        if (!task?.pmAssets?.length) return "-";

        for (const asset of task.pmAssets) {
            if (asset.assets.id === filters.assetId) {
                return asset.verifiedBy ?? "-";
            }
        }
        return "-";
    };

    const getPerfomedBy = (task) => {
        if (!task?.pmAssets?.length) return "-";

        for (const asset of task.pmAssets) {
            if (asset.assets.id === filters.assetId) {
                return asset.performedBy ?? "-";
            }
        }
        return "-";
    };

    const getOverallremarks = (task) => {
        if (!task?.pmAssets?.length) return "-";

        for (const asset of task.pmAssets) {
            if (asset.assets.id === filters.assetId) {
                return asset.pmAssetStatus?.[0]?.remarks ?? "-";
            }
        }
        return "-";
    };

    const buildColumns = () => {
        if (!result?.tasks) return [];

        const taskColumns = result.tasks
            .filter((task) => task.pmAssets?.length > 0)
            .map((task) => ({
                title: `${getTaskName(task)} - ${task.status?.name}`,
                children: [
                    {
                        title: "Value",
                        render: (record) =>
                            record.isFooter
                                ? renderFooterValue(record, task)
                                : displayValue(record, task),
                    },
                    {
                        title: "Remarks",
                        render: (record) =>
                            record.isFooter
                                ? renderFooterRemarks(record, task)
                                : displayValue1(record, task),
                    },
                ],
            }));

        return [
            {
                title: "S.No",
                render: (_, __, index) =>
                    __.isFooter ? "" : index + 1,
                width: 70,
            },
            {
                title: "Equipment Name",
                render: (record) =>
                    record.isFooter ? record.footerTitle : record.clElement?.name,
                width: 250,
            },
            ...taskColumns,
        ];
    };

    const renderFooterValue = (record, task) => {
        switch (record.isFooter) {
            case "performed":
                return getPerfomedBy(task);
            case "completed":
                return getStatusValues(task, "COMPLETED");
            case "verifiedMaintainer":
                return getVerifiedBymaintaner(task);
            case "verified":
                return getStatusValues(task, "VERIFIED");
            case "overall":
                return getOverallremarks(task);
            default:
                return "";
        }
    };

    const renderFooterRemarks = (record, task) => {
        switch (record.isFooter) {
            case "completed":
                return getStatusRemarks(task, "COMPLETED");
            case "verified":
                return getStatusRemarks(task, "VERIFIED");
            default:
                return "";
        }
    };

    const buildDataSource = () => {
        if (!result?.data) return [];

        return [
            ...result.data,
            { isFooter: "performed", footerTitle: "Perfomed By Operator" },
            { isFooter: "completed", footerTitle: "Completed By / Date" },
            { isFooter: "verifiedMaintainer", footerTitle: "Verified By Maintaners" },
            { isFooter: "verified", footerTitle: "Verified By / Date" },
            { isFooter: "overall", footerTitle: "Overall Remarks" },
        ];
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef
    });

    return (
        <>
            <Helmet>
                <title>{getPageTitle('reports/operation-checklist/critical-temp')}</title>
                <meta name="description" content={`${APP_CONFIG.name} - Critical Room Temp`} />
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

                                            {/* HEADER TABLE */}
                                            <Box sx={{ mb: 2 }}>
                                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                    <tbody>
                                                        <tr style={{ height: "100px", backgroundColor: "#fff" }}>
                                                            <th colSpan={3} style={{ border: "1px solid #ddd" }}>
                                                                <div style={{ display: "flex", alignItems: "center" }}>
                                                                    <img src="/assets/voltas_logo.png" width={60} height={60} />
                                                                    <div style={{ marginLeft: 10 }}>
                                                                        Doc no: <b>UG/VAC & TVS/CAMS/003</b>
                                                                    </div>
                                                                </div>
                                                            </th>

                                                            <th colSpan={9} style={{ textAlign: "center", border: "1px solid #ddd" }}>
                                                                <h3 style={{ margin: 0 }}>
                                                                    <b>CRITICAL EQUIPMENT ROOM TEMPERATURE CHECKLIST</b>
                                                                </h3>
                                                            </th>

                                                            <th colSpan={4} style={{ border: "1px solid #ddd" }}>
                                                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                                                    <img src="/assets/cmrl.png" width={60} height={60} />
                                                                    <div style={{ marginLeft: 15 }}>
                                                                        <div>
                                                                            Station: <b>{getLocationName()}</b>
                                                                        </div>
                                                                        <div>
                                                                            Date: <b>{dayjs(filters.date).format("DD/MM/YY")}</b>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </th>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </Box>

                                            <Table
                                                bordered
                                                pagination={false}
                                                scroll={{ x: "max-content" }}
                                                columns={buildColumns()}
                                                dataSource={buildDataSource()}
                                                rowKey={(record, index) =>
                                                    record.isFooter ? `footer-${record.isFooter}` : index
                                                }
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