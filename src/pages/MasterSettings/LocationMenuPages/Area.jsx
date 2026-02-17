import { useState } from "react"
import { Box, Card, CardContent, CircularProgress } from "@mui/material"
import { Space, Input, Button as AntButton, Table, Row, Col, Form, Modal, Popconfirm, message, Select } from "antd"
import { SearchOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { useGetAreaListQuery, useAddAreaMutation, useDeleteAreaMutation, useGetLocationListQuery } from '../../../store/api/masterSettings.api'
import { skipToken } from '@reduxjs/toolkit/query'
import { useAuth } from '../../../context/AuthContext'
import { domainName } from '../../../config/apiConfig'

export default function Area() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)

    const { data: areaListData, isLoading: areaListLoading, isFetching } = useGetAreaListQuery(clientId ? { clientId, pageNumber: 1, pageSize: 1000 } : skipToken)
    const { data: locationList, isLoading: locationLoading } = useGetLocationListQuery({ clientId, pageNumber: 1, pageSize: 1000 })

    const [addArea] = useAddAreaMutation();
    const [deleteArea] = useDeleteAreaMutation();

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
            dataIndex: 'location',
            key: 'location',
            render: (_, record) => record?.location?.name || ''
        },
        {
            title: 'Area',
            dataIndex: 'name',
            key: 'name'
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

        const filtered = areaListData?.data?.content?.filter((item) =>
            `${item.name ?? ''} ${item.location?.name ?? ''}`
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

        form.setFieldsValue({
            area: record?.name,
            location: record?.location?.id
        });
    }

    const handleModalOk = async () => {
        const values = await form.validateFields();
        console.log('form values:', values);

        const payload = {
            ...(selectedRecord?.id && { id: selectedRecord.id }),

            clientId,
            domainName,
            name: values.area,
            locationId: values.location
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
            const response = await addArea(payload).unwrap();
            message.success(response?.message || "Area saved successfully");
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to save area");
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
            const response = await deleteArea(selectedRecord.id).unwrap();
            message.success(response?.message || "Area deleted successfully");
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to delete area");
        } finally {
            handleModalCancel()
        }
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
                        {(areaListLoading || isFetching) ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Table
                                dataSource={filteredData ?? areaListData?.data?.content}
                                columns={columns}
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
                    title="Area"
                    open={isModalOpen}
                    onCancel={handleModalCancel}
                    footer={[
                        selectedRecord && (
                            <Popconfirm
                                key="delete"
                                title="Are you sure you want to delete this area?"
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
                            <Col span={24}>
                                <Form.Item
                                    label="Location"
                                    name="location"
                                    rules={[{ required: true, message: 'Please select location!' }]}
                                >
                                    <Select placeholder="Select Location" allowClear>
                                        {locationList?.data?.content?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Area"
                                    name="area"
                                    rules={[{ required: true, message: 'Please enter area!' }]}
                                >
                                    <Input type="text" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Modal>
            </Box>
        </>
    )
}