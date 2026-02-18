import { useState } from "react"
import { Box, Card, CardContent, CircularProgress } from "@mui/material"
import { Space, Input, Button as AntButton, Table, Row, Col, Form, Modal, Popconfirm, message, Tag, TreeSelect, DatePicker, Switch, Select } from "antd"
import { SearchOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { useAddAssetMutation, useDeleteAssetMutation, useGetAssetsLocationWiseQuery, useGetLocationListQuery, useGetAreaByLocationQuery, useGetSubAreaByAreaQuery } from '../../../store/api/masterSettings.api'
import { useGetAllCategoryListQuery } from '../../../store/api/maintenance.api'
import { skipToken } from '@reduxjs/toolkit/query'
import { useAuth } from '../../../context/AuthContext'
import { domainName } from '../../../config/apiConfig'
import dayjs from "dayjs"

export default function Asset() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)
    const [selectedLocationId, setSelectedLocationId] = useState(null);
    const [selectedAreaId, setSelectedAreaId] = useState(null);

    const { data: assetsListData, isLoading: assetsListLoading, isFetching } = useGetAssetsLocationWiseQuery(clientId ? { clientId, pageNumber: 1, pageSize: 1000, locationId: 10339 } : skipToken)
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

    const columns = [
        {
            title: 'S.No',
            dataIndex: 'sno',
            key: 'sno',
            width: 80,
            render: (_, __, index) => index + 1
        },
        {
            title: 'Location',
            dataIndex: 'locationName',
            key: 'locationName'
        },
        {
            title: 'Category',
            dataIndex: 'categoryName',
            key: 'categoryName'
        },
        {
            title: 'Item Name',
            dataIndex: 'itemCode',
            key: 'itemCode'
        },
        {
            title: 'Item Code',
            dataIndex: 'itemCode',
            key: 'itemCode'
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
            )
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
            `${item?.locationName ?? ''} ${item?.categoryName ?? ''}
         ${item?.itemCode ?? ''} ${item?.action ?? ''}`
                .toLowerCase()
                .includes(searchValue)
        );

        setFilteredData(filtered);
    };

    const handleAdd = () => {
        form.setFieldsValue({
            location: 10339
        })
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
            const response = await deleteAsset(selectedRecord.assetId).unwrap();
            message.success(response?.message || "Asset deleted successfully");
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

    const handleAreaChange = (roleId) => {
        console.log("role id:", roleId)
        setSelectedAreaId(roleId);
    }

    return (
        <>
            <Box>
                <Card>
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
                                <AntButton type="primary" icon={<PlusOutlined />}
                                    onClick={handleAdd}
                                >
                                    Add
                                </AntButton>
                            </Space>
                        </Box>
                        {assetsListLoading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Table
                                dataSource={filteredData ?? assetsListData?.data?.content}
                                columns={columns}
                                loading={assetsListLoading || isFetching}
                                rowKey="id"
                                pagination={{ pageSize: 20 }}
                                size="middle"
                                scroll={{ x: 'max-content' }}
                                onRow={(record) => ({
                                    onClick: () => handleEdit(record),
                                    style: { cursor: "pointer" },
                                })}
                            />
                        )}
                    </CardContent>
                </Card>

                <Modal
                    title="Asset"
                    open={isModalOpen}
                    onCancel={handleModalCancel}
                    footer={[
                        selectedRecord && (
                            <Popconfirm
                                key="delete"
                                title="Are you sure you want to delete this asset?"
                                onConfirm={handleDelete}
                                okText="Confirm"
                                cancelText="Cancel"
                                placement="top"
                            >
                                <AntButton danger style={{ float: "left", backgroundColor: '#fd4141', color: '#ffff' }}>
                                    <DeleteOutlined />
                                </AntButton>
                            </Popconfirm>
                        ),

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
                        </Row>
                    </Form>
                </Modal>
            </Box>
        </>
    )
}