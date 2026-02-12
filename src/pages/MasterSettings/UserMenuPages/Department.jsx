import { useState, useMemo } from "react"
import { Box, Card, CardContent, CircularProgress } from "@mui/material"
import { Space, Input, Button as AntButton, Table, Row, Col, Form, Modal, Popconfirm, message } from "antd"
import { SearchOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { useGetDepartmentListQuery, useAddDepartmentMutation, useDeleteDepartmentMutation } from '../../../store/api/masterSettings.api'
import { skipToken } from '@reduxjs/toolkit/query'
import { useAuth } from '../../../context/AuthContext'
import { domainName } from '../../../config/apiConfig'

export default function Department() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)

    const { data: departmentListData, isLoading: departmentListLoading, isFetching } = useGetDepartmentListQuery(clientId ? { clientId, pageNumber: 1, pageSize: 1000 } : skipToken)

    const [addDepartment] = useAddDepartmentMutation();
    const [deleteDepartment] = useDeleteDepartmentMutation();

    const columns = [
        {
            title: 'Name',
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

        const filtered = departmentListData?.data?.content?.filter((item) =>
            `${item.name ?? ''}`
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
            name: record?.name
        });
    }

    const handleModalOk = async () => {
        const values = await form.validateFields();
        console.log('form values:', values);

        const payload = {
            ...(selectedRecord?.id && { id: selectedRecord.id }),

            clientId,
            domainName,
            name: values.name
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
            const response = await addDepartment(payload).unwrap();
            message.success(response?.message || "Department saved successfully");
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to save department");
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
            const response = await deleteDepartment(selectedRecord.id).unwrap();
            message.success(response?.message || "Department deleted successfully");
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to delete department");
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
                        {(departmentListLoading || isFetching) ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Table
                                dataSource={filteredData ?? departmentListData?.data?.content}
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
                    title="Department"
                    open={isModalOpen}
                    onCancel={handleModalCancel}
                    footer={[
                        selectedRecord && (
                            <Popconfirm
                                key="delete"
                                title="Are you sure you want to delete this department?"
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
                                    label="Name"
                                    name="name"
                                    rules={[{ required: true, message: 'Please enter name!' }]}
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