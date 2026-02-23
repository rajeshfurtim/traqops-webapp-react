import { useState } from "react"
import { Box, Card, CardContent } from "@mui/material"
import { Space, Input, Button as AntButton, Table, Row, Col, Form, Modal, Popconfirm, message, Spin } from "antd"
import { SearchOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { useGetExternalVendorListQuery, useAddExternalVendorMutation, useDeleteExternalVendorMutation } from '../../../store/api/masterSettings.api'
import { skipToken } from '@reduxjs/toolkit/query'
import { useAuth } from '../../../context/AuthContext'
import { domainName } from '../../../config/apiConfig'

export default function ExternalVendor() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()

    const [current, setCurrent] = useState(1);
    const [pageSize, setPagesize] = useState(25);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)

    const { data: externalVendorData, isLoading: externalVendorLoading, isFetching } = useGetExternalVendorListQuery(clientId ? { clientId, pageNumber: 1, pageSize: 1000 } : skipToken)

    const [addExternalVendor] = useAddExternalVendorMutation();
    const [deleteExternalVendor] = useDeleteExternalVendorMutation();

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
            dataIndex: 'vendorName',
            key: 'vendorName'
        },
        {
            title: 'Service Name',
            dataIndex: 'service',
            key: 'service'
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description'
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

        const filtered = externalVendorData?.data?.content?.filter((item) =>
            `${item.vendorName ?? ''} ${item?.description ?? ''} ${item?.service ?? ''}`
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
            name: record?.vendorName,
            serviceName: record?.service,
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
            vendorName: values.name,
            service: values.serviceName,
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
            const response = await addExternalVendor(payload).unwrap();
            message.success(response?.message || "External vendor added successfully");
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to add external vendor");
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
            const response = await deleteExternalVendor(queryString).unwrap();
            message.success(response?.message || "External vendor deleted successfully");
            setSelectedRowKeys([]);
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to delete external vendor");
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
                                                title={`Are you sure you want to delete ${selectedRowKeys.length} selected external vendor(s)?`}
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
                        {externalVendorLoading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <Spin />
                            </Box>
                        ) : (
                            <Table
                                dataSource={filteredData ?? externalVendorData?.data?.content}
                                columns={columns}
                                rowSelection={{ type: 'checkbox', ...rowSelection }}
                                loading={externalVendorLoading || isFetching}
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
                    title={selectedRecord ? "Edit External Vendor" : "Add External Vendor"}
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
                            <Col span={24}>
                                <Form.Item
                                    label="Name"
                                    name="name"
                                    rules={[{ required: true, message: 'Please enter name!' }]}
                                >
                                    <Input type="text" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Service Name"
                                    name="serviceName"
                                    rules={[{ required: true, message: 'Please enter service name!' }]}
                                >
                                    <Input type="text" />
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