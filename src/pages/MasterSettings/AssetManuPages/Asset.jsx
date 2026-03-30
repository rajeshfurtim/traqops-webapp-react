import { useState, useEffect } from "react"
import { Box, Card, CardContent } from "@mui/material"
import { Space, Input, Button as AntButton, Table, Row, Col, Form, Modal, Popconfirm, message, Tag, DatePicker, Switch, Select, Spin, Tooltip } from "antd"
import { SearchOutlined, PlusOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons"
import { useAddAssetMutation, useDeleteAssetMutation, useGetAssetsLocationWiseQuery, useGetLocationListQuery, useGetAreaByLocationQuery, useGetSubAreaByAreaQuery } from '../../../store/api/masterSettings.api'
import { useGetAllCategoryListQuery } from '../../../store/api/maintenance.api'
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from '../../../context/AuthContext'
import { domainName } from '../../../config/apiConfig'
import jsPDF from 'jspdf'
import dayjs from "dayjs"

export default function Asset() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()

    const [current, setCurrent] = useState(1);
    const [pageSize, setPagesize] = useState(25);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)
    const [selectedLocationId, setSelectedLocationId] = useState(null);
    const [selectedHeaderLocationId, setSelectedHeaderLocationId] = useState(null);
    const [selectedAreaId, setSelectedAreaId] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    const { data: assetsListData, isLoading: assetsListLoading, isFetching } = useGetAssetsLocationWiseQuery({ clientId, pageNumber: 1, pageSize: 1000, locationId: selectedHeaderLocationId }, { skip: !selectedHeaderLocationId })
    const { data: locationList, loading: locationListLoading } = useGetLocationListQuery({ clientId, pageNumber: 1, pageSize: 1000 })
    const { data: categoryList, loading: categoryListLoading } = useGetAllCategoryListQuery({ clientId, pageNumber: 1, pageSize: 1000 })
    const { data: areaList, isLoading: areaListLoading } = useGetAreaByLocationQuery(
        { locationId: selectedLocationId },
        { skip: !selectedLocationId }
    );
    const { data: subAreaList, isLoading: subAreaListLoading } = useGetSubAreaByAreaQuery(
        { areaId: selectedAreaId },
        { skip: !selectedAreaId }
    );

    const [addAsset] = useAddAssetMutation();
    const [deleteAsset] = useDeleteAssetMutation();

    useEffect(() => {
        const list = locationList?.data?.content;

        if (list?.length > 0) {
            setSelectedHeaderLocationId(list[0]?.id)
        }
    }, [locationList])

    const columns = [
        {
            title: 'S.No',
            dataIndex: 'sno',
            key: 'sno',
            width: 80,
            render: (_, __, index) => ((current - 1) * pageSize) + index + 1
        },
        {
            title: 'Location',
            dataIndex: 'locationName',
            key: 'locationName',
            sorter: (a, b) => (a?.locationName ?? '').localeCompare(b?.locationName ?? '')
        },
        {
            title: 'Category',
            dataIndex: 'categoryName',
            key: 'categoryName',
            sorter: (a, b) => (a?.categoryName ?? '').localeCompare(b?.categoryName ?? '')
        },
        {
            title: 'Item Name',
            dataIndex: 'assetName',
            key: 'assetName',
            sorter: (a, b) => (a?.assetName ?? '').localeCompare(b?.assetName ?? '')
        },
        {
            title: 'Item Code',
            dataIndex: 'itemCode',
            key: 'itemCode',
            sorter: (a, b) => (a?.itemCode ?? '').localeCompare(b?.itemCode ?? '')
        },
        {
            title: 'Status',
            dataIndex: 'action',
            key: 'action',
            render: (_, record) => (
                <Tag color={record.action === 'Y' ? 'green' : 'red'}
                    style={{
                        borderRadius: 25,
                        padding: '4px 8px',
                        fontSize: 13
                    }}>
                    {record.action === 'Y' ? 'Active' : 'Inactive'}
                </Tag>
            ),
            sorter: (a, b) => (a?.action ?? '').localeCompare(b?.action ?? '')
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            sorter: (a, b) => a?.itemCode - b?.itemCode
        },
        {
            title: 'Make',
            dataIndex: 'make',
            key: 'make',
            sorter: (a, b) => (a?.make ?? '').localeCompare(b?.make ?? '')
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

        const filtered = assetsListData?.data?.content?.filter((item) =>
            `${item?.locationName ?? ''} ${item?.categoryName ?? ''} ${item?.quantity ?? ''} ${item?.make ?? ''}
         ${item?.assetName ?? ''} ${item?.itemCode ?? ''} ${item?.action ?? ''}`
                .toLowerCase()
                .includes(searchValue)
        );

        setFilteredData(filtered);
    };

    const handleAdd = () => {
        if (selectedHeaderLocationId != -1) {
            form.setFieldsValue({
                location: selectedHeaderLocationId
            })
            setSelectedLocationId(selectedHeaderLocationId);
        }
        setIsModalOpen(true)
    }

    const handleEdit = (record) => {
        console.log('on edit:', record)
        setSelectedRecord(record)
        setSelectedLocationId(record?.locationId);
        setSelectedAreaId(record?.areaId);
        setIsModalOpen(true)

        form.setFieldsValue({
            location: record.locationId,
            area: record.areaId,
            subArea: record?.subAreaId,
            category: record.categoryId,
            itemName: record.assetName,
            itemCode: record.itemCode,
            quantity: record.quantity,
            make: record.make,
            model: record.model,
            capacity: record.capacity,
            date: record.date ? dayjs(record.date) : null,
            dateOfCommission: record.dateOfCommission ? dayjs(record.dateOfCommission) : null,
            status: record.action === 'Y' ? true : false,
        });
    }

    const handleModalOk = async () => {
        const values = await form.validateFields();
        console.log('form values:', values);

        const payload = {
            ...(selectedRecord?.assetId && { id: selectedRecord.assetId }),

            clientId,
            domainName,
            locationId: values.location,
            areaId: values.area,
            subAreaId: values.subArea,
            categoryId: values.category,
            name: values.itemName,
            itemCode: values.itemCode,
            quantity: values.quantity,
            make: values.make,
            model: values.model,
            Capacity: values.capacity,
            date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : null,
            dateOfCommission: values.dateOfCommission ? dayjs(values.dateOfCommission).format('YYYY-MM-DD') : null,
            action: values.status ? 'Y' : 'N'
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
            const response = await addAsset(payload).unwrap();
            message.success(response?.message || " Asset saved successfully");
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to save asset");
        } finally {
            handleModalCancel()
        }
    }

    const handleModalCancel = () => {
        form.resetFields();
        setSelectedRecord(null);
        setSelectedLocationId(null);
        setSelectedAreaId(null);
        setIsModalOpen(false);
    }

    const handleDelete = async () => {
        try {
            const queryString = selectedRowKeys
                .map(id => `id=${id}`)
                .join('&');
            const response = await deleteAsset(queryString).unwrap();
            message.success(response?.message || "Asset deleted successfully");
            setSelectedRowKeys([]);
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to delete asset");
        } finally {
            handleModalCancel()
        }
    }

    const handleLocationChange = (roleId) => {
        console.log("role id:", roleId)
        setSelectedLocationId(roleId);
    }

    const handleHeaderLocationChange = (roleId) => {
        console.log("role id:", roleId)
        setSelectedHeaderLocationId(roleId);
    }

    const handleAreaChange = (roleId) => {
        console.log("role id:", roleId)
        setSelectedAreaId(roleId);
    }

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys) => {
            setSelectedRowKeys(newSelectedRowKeys);
        }
    };

    const handleDownloadQR = () => {
        const canvas = document.getElementById("qr-code-canvas");

        if (!canvas) return;

        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        // Center QR in PDF
        const imgWidth = 60;
        const imgHeight = 60;

        const pageWidth = pdf.internal.pageSize.getWidth();
        const x = (pageWidth - imgWidth) / 2;

        pdf.text(`Asset ID: ${selectedRecord.assetId}`, x, 95);
        pdf.addImage(imgData, "PNG", x, 30, imgWidth, imgHeight);

        pdf.save(`AST_${selectedRecord.assetId}.pdf`);
    }

    return (
        <>
            <Box>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Space>
                                <>
                                    {selectedRowKeys.length > 0 && (
                                        <>
                                            <Popconfirm
                                                title={`Are you sure you want to delete ${selectedRowKeys.length} selected asset(s)?`}
                                                onConfirm={handleDelete}
                                                okText="Confirm"
                                                cancelText="Cancel"
                                            >
                                                <AntButton danger icon={<DeleteOutlined />} style={{ color: '#ffff', backgroundColor: '#f73b3b' }}>
                                                    ({selectedRowKeys.length})
                                                </AntButton>
                                            </Popconfirm>
                                        </>
                                    )}
                                </>
                                <Select
                                    value={selectedHeaderLocationId}
                                    onChange={(value) => handleHeaderLocationChange(value)}
                                    placeholder="Select Location"
                                    style={{ width: 220 }}
                                >
                                    <Select.Option key={-1} value={-1}>All Location</Select.Option>
                                    {locationList?.data?.content?.map(l => (
                                        <Select.Option key={l.id} value={l.id}>
                                            {l.name}
                                        </Select.Option>
                                    ))}
                                </Select>
                                <Input
                                    placeholder="Search"
                                    prefix={<SearchOutlined />}
                                    value={searchText}
                                    onChange={handleSearch}
                                    allowClear
                                    style={{ width: 250 }}
                                />
                                <AntButton type="primary" icon={<PlusOutlined />}
                                    onClick={handleAdd}
                                >
                                    Add
                                </AntButton>
                            </Space>
                        </Box>
                        {assetsListLoading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <Spin />
                            </Box>
                        ) : (
                            <Table
                                dataSource={filteredData ?? assetsListData?.data?.content}
                                columns={columns}
                                rowSelection={{ type: 'checkbox', ...rowSelection }}
                                loading={assetsListLoading || isFetching}
                                rowKey="assetId"
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
                    title={selectedRecord ? "Edit Asset" : "Add Asset"}
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
                        form={form}
                        layout="vertical"
                        style={{ marginTop: 24 }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Location"
                                    name="location"
                                    rules={[{ required: true, message: 'Please select location!' }]}
                                >
                                    <Select
                                        onChange={(value) => handleLocationChange(value)}
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
                            <Col span={12}>
                                <Form.Item
                                    label="Area"
                                    name="area"
                                    rules={[{ required: false, message: 'Please select area!' }]}
                                >
                                    <Select
                                        onChange={(value) => handleAreaChange(value)}
                                        placeholder="Select Area"
                                        loading={areaListLoading}
                                    >
                                        {areaList?.data?.map(l => (
                                            <Select.Option key={l.areaId} value={l.areaId}>
                                                {l.areaName}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Sub Area"
                                    name="subArea"
                                    rules={[{ required: false, message: 'Please select sub area!' }]}
                                >
                                    <Select
                                        placeholder="Select Sub Area"
                                        loading={subAreaListLoading}
                                    >
                                        {subAreaList?.data?.map(l => (
                                            <Select.Option key={l.subAreaId} value={l.subAreaId}>
                                                {l.subAreaName}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Category"
                                    name="category"
                                    rules={[{ required: true, message: 'Please select category!' }]}
                                >
                                    <Select
                                        placeholder="Select Category"
                                    >
                                        {categoryList?.data?.content?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Item Name"
                                    name="itemName"
                                    rules={[{ required: true, message: 'Please enter item name!' }]}
                                >
                                    <Input type="text" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Item Code"
                                    name="itemCode"
                                    rules={[{ required: true, message: 'Please enter item code!' }]}
                                >
                                    <Input type="text" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Quantity"
                                    name="quantity"
                                    rules={[{ required: true, message: 'Please enter quantity!' }]}
                                >
                                    <Input type="number" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Make"
                                    name="make"
                                    rules={[{ required: false, message: 'Please enter make!' }]}
                                >
                                    <Input type="text" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Model"
                                    name="model"
                                    rules={[{ required: false, message: 'Please enter model!' }]}
                                >
                                    <Input type="text" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Capacity"
                                    name="capacity"
                                    rules={[{ required: false, message: 'Please enter capacity!' }]}
                                >
                                    <Input type="text" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Date"
                                    name="date"
                                    rules={[{ required: false, message: 'Please select date!' }]}
                                >
                                    <DatePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Date of Commission"
                                    name="dateOfCommission"
                                    rules={[{ required: false, message: 'Please select date of commission!' }]}
                                >
                                    <DatePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Status"
                                    name="status"
                                    rules={[{ required: true, message: 'Please select status!' }]}
                                >
                                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                {selectedRecord?.assetId && (
                                    <Box sx={{ position: 'relative', width: 'fit-content', mb: 2 }}>

                                        <Tooltip title="Download QR">
                                            <DownloadOutlined
                                                onClick={handleDownloadQR}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    right: 0,
                                                    cursor: 'pointer',
                                                    fontSize: 18,
                                                    background: '#fff',
                                                    borderRadius: '50%',
                                                    padding: 4,
                                                    boxShadow: '0 0 5px rgba(0,0,0,0.2)'
                                                }}
                                            />
                                        </Tooltip>

                                        <Box sx={{ mt: 1, fontWeight: 700 }}>
                                            Asset Qr Code
                                        </Box>
                                        <QRCodeCanvas
                                            id="qr-code-canvas"
                                            value={`AST_${selectedRecord.assetId}`}
                                            size={160}
                                        />
                                    </Box>
                                )}
                            </Col>
                        </Row>
                    </Form>
                </Modal>
            </Box>
        </>
    )
}