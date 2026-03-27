import { useState } from "react"
import { Box, Card, CardContent } from "@mui/material"
import { Space, Input, Button as AntButton, Table, Row, Col, Form, Modal, Popconfirm, message, Spin, Select } from "antd"
import { SearchOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { useGetFaultSubCategoryListQuery, useGetFaultCategoryListQuery, useAddFaultSubCategoryMutation, useDeleteFaultSubCategoryMutation, useGetAllPriorityListQuery } from '../../../store/api/masterSettings.api'
import { skipToken } from '@reduxjs/toolkit/query'
import { useAuth } from '../../../context/AuthContext'
import { domainName } from '../../../config/apiConfig'

export default function FaultSubCategory() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()

    const [current, setCurrent] = useState(1);
    const [pageSize, setPagesize] = useState(25);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)

    const { data: priorityData, isLoading: priorityLoading } = useGetAllPriorityListQuery(clientId ? { clientId, pageNumber: 1, pageSize: 1000 } : skipToken)
    const { data: faultSubCategoryData, isLoading: faultSubCategoryLoading, isFetching } = useGetFaultSubCategoryListQuery(clientId ? { clientId, pageNumber: 1, pageSize: 1000 } : skipToken)
    const { data: faultCategoryData, isLoading: faultCategoryLoading } = useGetFaultCategoryListQuery({ clientId, pageNumber: 1, pageSize: 1000 })

    const [addFaultSubCategory] = useAddFaultSubCategoryMutation();
    const [deleteFaultSubCategory] = useDeleteFaultSubCategoryMutation();

    const periodTypeData = [
        { id: 'HOURS', name: 'HOURS' },
        { id: 'DAYS', name: 'DAYS' }
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
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => (a?.name ?? '').localeCompare(b?.name ?? '')
        },
        {
            title: 'Fault Category',
            dataIndex: 'faultCategory',
            key: 'faultCategory',
            render: (_, record) => record?.faultCategory?.name || '-',
            sorter: (a, b) => (a?.faultCategory?.name ?? '').localeCompare(b?.faultCategory?.name ?? '')
        },
        {
            title: 'Period Value',
            dataIndex: 'periodValue',
            key: 'periodValue',
            sorter: (a, b) => a?.periodValue - b?.periodValue
        },
        {
            title: 'Period Type',
            dataIndex: 'periodType',
            key: 'periodType',
            sorter: (a, b) => (a?.periodType ?? '').localeCompare(b?.periodType ?? '')
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            render: (_, record) => record?.priority?.name,
            sorter: (a, b) => (a?.priority?.name ?? '').localeCompare(b?.priority?.name ?? '')
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            sorter: (a, b) => (a?.description ?? '').localeCompare(b?.description ?? '')
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

        const filtered = faultSubCategoryData?.data?.content?.filter((item) =>
            `${item.name ?? ''} ${item?.description ?? ''} ${item?.faultCategory?.name ?? ''}
        ${item?.periodValue ?? ''} ${item?.periodType ?? ''}`
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
            name: record?.name,
            faultCategory: record?.faultCategory?.id,
            priority: record?.priority?.id,
            periodValue: record?.periodValue,
            periodType: record?.periodType,
            description: record?.description
        });
    }

    const handleModalOk = async () => {
        const values = await form.validateFields();
        console.log('form values:', values);

        const payload = {
            ...(selectedRecord?.id && { id: selectedRecord.id }),

            clientId,
            domainName,
            name: values.name,
            faultCategoryId: values.faultCategory,
            periodValue: values.periodValue,
            periodType: values.periodType,
            priorityId: values.priority,
            description: values.description
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
            const response = await addFaultSubCategory(payload).unwrap();
            message.success(response?.message || "Fault sub category added successfully");
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to add fault sub category");
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
            const response = await deleteFaultSubCategory(queryString).unwrap();
            message.success(response?.message || "Fault sub category deleted successfully");
            setSelectedRowKeys([]);
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to delete fault sub category");
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
                                                title={`Are you sure you want to delete ${selectedRowKeys.length} selected fault sub category(ies)?`}
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
                        {faultSubCategoryLoading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <Spin />
                            </Box>
                        ) : (
                            <Table
                                dataSource={filteredData ?? faultSubCategoryData?.data?.content}
                                columns={columns}
                                rowSelection={{ type: 'checkbox', ...rowSelection }}
                                loading={faultSubCategoryLoading || isFetching}
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
                    title={selectedRecord ? "Edit Fault Sub Category" : "Add Fault Sub Category"}
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
                                    label="Name"
                                    name="name"
                                    rules={[{ required: true, message: 'Please enter name!' }]}
                                >
                                    <Input type="text" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Fault Category"
                                    name="faultCategory"
                                    rules={[{ required: true, message: 'Please select fault category!' }]}
                                >
                                    <Select
                                        placeholder="Select Fault Category"
                                        loading={faultCategoryLoading}
                                    >
                                        {faultCategoryData?.data?.content?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Period Type"
                                    name="periodType"
                                    rules={[{ required: false, message: 'Please select fault periodType!' }]}
                                >
                                    <Select
                                        placeholder="Select Period Type"
                                    >
                                        {periodTypeData?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Period Value"
                                    name="periodValue"
                                    rules={[{ required: false, message: 'Please enter periodValue!' }]}
                                >
                                    <Input type="number" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Priority"
                                    name="priority"
                                    rules={[{ required: true, message: 'Please select priority!' }]}
                                >
                                    <Select
                                        placeholder="Select Priority"
                                        loading={priorityLoading}
                                    >
                                        {priorityData?.data?.content?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Description"
                                    name="description"
                                    rules={[{ required: false, message: 'Please enter description!' }]}
                                >
                                    <Input.TextArea rows={2} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Modal>
            </Box>
        </>
    )
}