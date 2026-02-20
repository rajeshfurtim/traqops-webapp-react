import { useState } from "react"
import { Box, Card, CardContent } from "@mui/material"
import { Space, Input, Button as AntButton, Table, Row, Col, Form, Modal, Popconfirm, message, Spin, Select, Upload } from "antd"
import { SearchOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { useGetInventoryListQuery, useGetLocationByIsStoreQuery, useGetAllInventoryCategoryQuery, useAddInventoryMutation, useDeleteInventoryMutation } from '../../../store/api/masterSettings.api'
import { skipToken } from '@reduxjs/toolkit/query'
import { useAuth } from '../../../context/AuthContext'
import { domainName } from '../../../config/apiConfig'
import { QRCodeCanvas } from "qrcode.react";

export default function Inventory() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()

    const [current, setCurrent] = useState(1);
    const [pageSize, setPagesize] = useState(25);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)
    const [fileList, setFileList] = useState([]);

    const { data: inventoryData, isLoading: inventoryLoading, isFetching } = useGetInventoryListQuery(clientId ? { clientId, pageNumber: 1, pageSize: 1000 } : skipToken)
    const { data: inventoryCategoryData, isLoading: inventoryCategoryLoading } = useGetAllInventoryCategoryQuery({ clientId, pageNumber: 1, pageSize: 1000 })
    const { data: locationData, isLoading: locationLoading } = useGetLocationByIsStoreQuery({ clientId, pageNumber: 1, pageSize: 1000 })

    const [addInventory] = useAddInventoryMutation();
    const [deleteInventory] = useDeleteInventoryMutation();

    const unitsData = [
        { id: 'Ltr', name: 'Ltr' },
        { id: 'Nos', name: 'Nos' },
        { id: 'cm', name: 'cm' },
        { id: 'Meter', name: 'Meter' },
        { id: 'mm', name: 'mm' },
        { id: 'Kgs', name: 'Kgs' },
        { id: 'Sq Mtr', name: 'Sq Mtr' }
    ]

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
            dataIndex: 'location',
            key: 'location',
            render: (_, record) => record?.location?.name || '-'
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name'
        },
        {
            title: 'Category',
            dataIndex: 'inventoryCategory',
            key: 'inventoryCategory',
            render: (_, record) => record?.inventoryCategory?.name || '-'
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'quantity'
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

        const filtered = inventoryData?.data?.content?.filter((item) =>
            `${item?.name ?? ''} ${item?.quantity ?? ''}
             ${item?.location?.name ?? ''} ${item?.inventoryCategory?.name ?? ''}`
                .toLowerCase()
                .includes(searchValue)
        );

        setFilteredData(filtered);
    };

    const handleAdd = () => {
        setIsModalOpen(true)
    }

    const handleEdit = (record) => {
        console.log('on edit:', record)
        setSelectedRecord(record)
        setIsModalOpen(true)

        setFileList(record?.files ? [{
            uid: '-1',
            name: record.files?.name,
            status: 'done',
            url: record.files?.filePath
        }] : []);

        form.setFieldsValue({
            name: record?.name,
            location: record?.location?.id,
            inventoryCategory: record?.inventoryCategory?.id,
            quantity: record?.quantity,
            description: record?.description,
            units: record?.units,
            files: record?.files
                ? [{
                    uid: '-1',
                    name: record.files?.name,
                    status: 'done',
                    url: record.files?.filePath
                }]
                : []
        });
    }

    const handleModalOk = async () => {
        const values = await form.validateFields();
        console.log('form values:', values);

        const formData = new FormData();
        if (selectedRecord?.id) {
            formData.append("id", selectedRecord.id);
        }

        formData.append("clientId", clientId);
        formData.append("domainName", domainName);
        formData.append("name", values.name);
        formData.append("description", values.description || "");
        formData.append("quantity", values.quantity || "");
        formData.append("units", values.units);
        formData.append("locationId", values.location);
        formData.append("inventoryCategoryId", values.inventoryCategory);

        if (fileList.length > 0 && fileList[0].originFileObj) {
            formData.append("file", fileList[0].originFileObj);
        }

        console.log("Final FormData:", formData);
        handleSubmit(formData)
    }

    const handleSubmit = async (payload) => {
        try {
            const response = await addInventory(payload).unwrap();
            message.success(response?.message || "Inventory saved successfully");
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to save inventory");
        } finally {
            handleModalCancel()
        }
    }

    const handleModalCancel = () => {
        form.resetFields();
        setSelectedRecord(null);
        setIsModalOpen(false);
    }

    const handleDelete = async () => {
        try {
            const queryString = selectedRowKeys
                .map(id => `id=${id}`)
                .join('&');
            const response = await deleteInventory(queryString).unwrap();
            message.success(response?.message || "Inventory deleted successfully");
            setSelectedRowKeys([]);
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to delete inventory");
        } finally {
            handleModalCancel()
        }
    }

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys) => {
            setSelectedRowKeys(newSelectedRowKeys);
        }
    };

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
                                                title={`Are you sure you want to delete ${selectedRowKeys.length} selected inventory(s)?`}
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
                        {inventoryLoading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <Spin />
                            </Box>
                        ) : (
                            <Table
                                dataSource={filteredData ?? inventoryData?.data?.content}
                                columns={columns}
                                rowSelection={{ type: 'checkbox', ...rowSelection }}
                                loading={inventoryLoading || isFetching}
                                rowKey="id"
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
                    title={selectedRecord ? "Edit Inventory" : "Add Inventory"}
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
                                        placeholder="Select Location"
                                    >
                                        {locationData?.data?.content?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Name"
                                    name="name"
                                    rules={[{ required: true, message: 'Please enter name!' }]}
                                >
                                    <Input type="text" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Inventory Category"
                                    name="inventoryCategory"
                                    rules={[{ required: true, message: 'Please select inventory category!' }]}
                                >
                                    <Select
                                        placeholder="Select Inventory Category"
                                    >
                                        {inventoryCategoryData?.data?.content?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Quantity"
                                    name="quantity"
                                    rules={[{ required: false, message: 'Please enter quantity!' }]}
                                >
                                    <Input type="number" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Units"
                                    name="units"
                                    rules={[{ required: true, message: 'Please select units!' }]}
                                >
                                    <Select
                                        placeholder="Select Units"
                                    >
                                        {unitsData?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Description"
                                    name="description"
                                    rules={[{ required: false, message: 'Please enter description!' }]}
                                >
                                    <Input.TextArea rows={2} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Files"
                                    name="files"
                                    rules={[{ required: false }]}
                                >
                                    <Upload
                                        listType="picture-card"
                                        fileList={fileList}
                                        beforeUpload={(file) => {
                                            const isJpgOrPng =
                                                file.type === "image/jpeg" || file.type === "image/png";

                                            if (!isJpgOrPng) {
                                                message.error("Only JPG/PNG files allowed!");
                                            }

                                            const isLt2M = file.size / 1024 / 1024 < 2;
                                            if (!isLt2M) {
                                                message.error("Image must be smaller than 2MB!");
                                            }

                                            return isJpgOrPng && isLt2M ? false : Upload.LIST_IGNORE;
                                        }}
                                        onChange={({ fileList }) => setFileList(fileList)}
                                        maxCount={1}
                                        accept=".jpg,.jpeg,.png"
                                    >
                                        {fileList.length >= 1 ? null : (
                                            <div>
                                                <PlusOutlined />
                                                <div style={{ marginTop: 8 }}>Upload</div>
                                            </div>
                                        )}
                                    </Upload>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                {selectedRecord?.id && (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
                                        <Box sx={{ mt: 1, fontWeight: 700 }}>
                                            Inventory Qr Code
                                        </Box>
                                        <QRCodeCanvas
                                            value={`INT_${selectedRecord.id}`}
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