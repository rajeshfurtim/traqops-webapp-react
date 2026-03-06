import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Card, CardContent } from '@mui/material'
import { Form, Select, Space, Button as AntButton, Row, Col, DatePicker, Table, Spin, Tooltip } from 'antd'
import { FilePdfOutlined, StepBackwardOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationListQuery } from '../../../store/api/masterSettings.api'
import { useGetDailyChecksChecklistByCategoryQuery } from '../../../store/api/operationChecklist.api'
import { useAuth } from '../../../context/AuthContext'
import { useReactToPrint } from "react-to-print"
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

export default function WaterCooledChillers() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()
    const printRef = useRef(null)
    const navigate = useNavigate()

    const [filters, setFilters] = useState({})

    const { data: locationList, isLoading: locationLoading } = useGetLocationListQuery({ clientId, pageNumber: 1, pageSize: 1000 })
    const { data: checklistData, isLoading: checklistLoading, isFetching } =
        useGetDailyChecksChecklistByCategoryQuery(
            {
                ...filters,
                checklistId: 47774
            },
            {
                skip: !filters.locationId
            }
        )

    const result = checklistData?.data;

    useEffect(() => {
        form.setFieldsValue({
            date: dayjs().subtract(1, "day"),
        })
    }, [])

    const handleFilterChange = (values) => {
        console.log('Filter values:', values)
        const newFilters = {}
        if (values.date) newFilters.date = dayjs(values.date).format('YYYY-MM-DD')
        if (values.location) newFilters.locationId = values.location
        newFilters.assetCategoryId = 11887
        setFilters(newFilters)
    }

    const handleResetFilters = () => {
        form.resetFields()
        setFilters({})
    }

    // Checklist Logic
    const getLocationName = () => {
        return locationList?.data?.content?.find(l => l.id === filters.locationId)?.name || "-";
    }

    const displayValue = (dataRow, asset) => {
        if (!dataRow?.elementData) return "-";

        const element = dataRow.elementData?.[asset?.assets?.id];

        if (!element) return "-";

        const type = dataRow?.clElement?.dataEntryType;

        if (type === "NUMERIC VALUE") {
            return element?.value ?? "-";
        }

        if (type === "TEXT") {
            return element?.textContent ?? "-";
        }

        if (type === "CHECKBOX") {
            return element?.textContent ?? "-";
        }

        return element?.textContent ?? "-";
    };

    const displayValue1 = (dataRow, asset) => {
        if (!dataRow?.elementData) return "-";

        const element = dataRow.elementData?.[asset?.assets?.id];

        if (!element) return "-";

        return element?.remark ?? "-";
    };

    const getPerfomedBy = (asset) => {
        return asset?.performedBy || "-";
    };

    const getVerifiedBymaintaner = (asset) => {
        return asset?.verifiedBy || "-";
    };

    const getStatusValues = (task, type) => {

        const statuses = task?.pmAssetStatus || [];

        for (let status of statuses) {
            if (status.status.name === type) {
                return `${status.userInfo.userName} / ${dayjs(status.createdAt).format(
                    "DD/MM/YY HH:mm"
                )}`;
            }
        }

        return "-";
    };

    const getStatusRemarks = (asset, type) => {
        if (!asset?.pmAssetStatus?.length) return "-";

        const status = asset.pmAssetStatus.find(
            (s) => s?.status?.name === type
        );

        return status?.remarks || "-";
    };

    const getOverallremarks = (asset) => {
        if (!asset?.pmAssetStatus?.length) return "-";

        return asset.pmAssetStatus?.[0]?.remarks || "-";
    };

    const buildColumns = () => {
        const columns = [
            {
                title: "Sl.No",
                render: (_, record, index) => (record.isFooter ? "" : index + 1),
                width: 80,
            },
            {
                title: "Description of Work",
                width: 250,
                render: (_, record) => {
                    if (record.isFooter === "performed") return "Performed By Operator";
                    if (record.isFooter === "completed") return "Completed By / Date";
                    if (record.isFooter === "verifiedMaintainer")
                        return "Verified By Maintainers";
                    if (record.isFooter === "verified") return "Verified By / Date";
                    if (record.isFooter === "overall") return "Overall Remarks";

                    return record.clElement?.name;
                },
            },
        ];

        result?.tasks?.forEach((task) => {
            task.pmAssets?.forEach((asset) => {
                columns.push({
                    title: (
                        <div>
                            {asset.assets.name} - {asset.assets.itemCode}
                            <div>{asset.status?.name}</div>
                            <div>Ptw No: {asset?.ptwNo}</div>
                        </div>
                    ),
                    children: [
                        {
                            title: "Value",
                            width: 120,
                            render: (row) => {
                                if (row.isFooter === "performed") return getPerfomedBy(asset);
                                if (row.isFooter === "completed")
                                    return getStatusValues(asset, "COMPLETED");
                                if (row.isFooter === "verifiedMaintainer")
                                    return getVerifiedBymaintaner(asset);
                                if (row.isFooter === "verified")
                                    return getStatusValues(asset, "VERIFIED");
                                if (row.isFooter === "overall") return getOverallremarks(asset);

                                return displayValue(row, asset);
                            },
                        },
                        {
                            title: "Remarks",
                            width: 200,
                            render: (row) => {
                                if (row.isFooter === "completed")
                                    return getStatusRemarks(asset, "Completed");
                                if (row.isFooter === "verified")
                                    return getStatusRemarks(asset, "Verified");
                                if (row.isFooter === "overall") return getOverallremarks(asset);

                                return displayValue1(row, asset);
                            },
                        },
                    ],
                });
            });
        });

        return columns;
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef
    });

    return (
        <>
            <Helmet>
                <title>{getPageTitle('reports/operation-checklist/water-cooled-chillers')}</title>
                <meta name="description" content={`${APP_CONFIG.name} - Water Cooled Chillers`} />
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
                                        disabled={!result?.data?.length}
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
                                {result && (
                                    <>
                                        <div ref={printRef}>

                                            <Box sx={{ mb: 2 }}>

                                                <table style={{ width: "100%", borderCollapse: "collapse" }}>

                                                    <tbody>

                                                        <tr style={{ height: "100px" }}>

                                                            <th colSpan={6} style={{ border: "1px solid #ddd", textAlign: "left" }}>

                                                                <div style={{ display: "flex", alignItems: "center" }}>

                                                                    <img
                                                                        src="/assets/voltas_logo.png"
                                                                        alt="logo"
                                                                        width={60}
                                                                        height={60}
                                                                        style={{ marginRight: 10 }}
                                                                    />

                                                                    <div>
                                                                        <div>Doc no: UG/VAC & TVS/CAMS/005</div>
                                                                    </div>

                                                                </div>

                                                            </th>

                                                            <th colSpan={12} style={{ border: "1px solid #ddd", textAlign: "center" }}>
                                                                <h3 style={{ margin: 0 }}>
                                                                    DAILY CHECKS FOR WATER COOLED CHILLERS
                                                                </h3>
                                                            </th>

                                                            <th colSpan={6} style={{ border: "1px solid #ddd", textAlign: "right" }}>

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
                                                                            Date: {filters.date ? dayjs(filters.date).format("DD/MM/YYYY") : "-"}
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
                                                    { isFooter: "overall" }
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