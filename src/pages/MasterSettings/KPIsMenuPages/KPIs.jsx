import { useState } from "react"
import { Box, Card, CardContent } from "@mui/material"
import { Space, Input, Button as AntButton, Table, Row, Col, Form, Modal, Popconfirm, message, Spin, Select, Switch } from "antd"
import { SearchOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { useGetAllKPIsListQuery, useGetAllKPIsCategoryQuery, useGetAllTypeListQuery, useGetAllFrequencyQuery, useAddKPIsMutation, useDeleteKPIsMutation } from '../../../store/api/masterSettings.api'
import { skipToken } from '@reduxjs/toolkit/query'
import { useAuth } from '../../../context/AuthContext'
import { domainName } from '../../../config/apiConfig'

export default function KPIs() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()

    const [current, setCurrent] = useState(1);
    const [pageSize, setPagesize] = useState(25);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)

    const { data: KPIsData, isLoading: KPIsLoading, isFetching } = useGetAllKPIsListQuery(clientId ? { clientId, pageNumber: 1, pageSize: 1000 } : skipToken)
    const { data: KPIsCategoryData, isLoading: KPIsCategoryLoading } = useGetAllKPIsCategoryQuery({ clientId, pageNumber: 1, pageSize: 1000 })
    const { data: typeData, isLoading: typeLoading } = useGetAllTypeListQuery()
    const { data: frequencyData, isLoading: frequencyLoading } = useGetAllFrequencyQuery()

    const [addKPIs] = useAddKPIsMutation();
    const [deleteKPIs] = useDeleteKPIsMutation();

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
            key: 'name'
        },
        {
            title: 'KPIs Type',
            dataIndex: 'kpiType',
            key: 'kpiType',
            render: (_, report) => report?.kpisCategory?.kpiType?.name || ''
        },
        {
            title: 'Category',
            dataIndex: 'kpisCategory',
            key: 'kpisCategory',
            render: (_, report) => report?.kpisCategory?.name || ''
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (_, report) => report?.type?.name || ''
        },
        {
            title: 'Score',
            dataIndex: 'score',
            key: 'score'
        },
        {
            title: 'Frequency',
            dataIndex: 'frequency',
            key: 'frequency',
            render: (_, report) => report?.frequency?.name || ''
        },
        {
            title: 'Critical Attributes',
            dataIndex: 'isCritical',
            key: 'isCritical',
            render: (_, record) => record?.isCritical === 'Y' ? 'Yes' : 'No'
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

        const filtered = KPIsData?.data?.content?.filter((item) =>
            `${item.name ?? ''} ${item?.kpisCategory?.kpiType?.name ?? ''}
         ${item?.kpisCategory?.name ?? ''} ${item?.type?.name ?? ''} ${item?.score ?? ''}
         ${item?.frequency?.name ?? ''} ${item?.isCritical === 'Y' ? 'Yes' : 'No' ?? ''}`
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
            category: record?.kpisCategory?.id,
            type: record?.type?.id,
            frequency: record?.frequency?.id,
            score: record?.score,
            criticalAttributes: record?.isCritical === 'Y' ? 'Yes' : 'No'
        });
    }

    const handleModalOk = async () => {
        const values = await form.validateFields();
        console.log('form values:', values);

        const payload = {
            ...(selectedRecord?.id && { id: selectedRecord.id }),

            domainName,
            name: values.name,
            kpisCategoryId: values.category,
            typeId: values.type,
            frequencyId: values.frequency,
            score: values.score,
            isCritical: values.criticalAttributes === 'Yes' ? 'Y' : 'N'
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
            const response = await addKPIs(payload).unwrap();
            message.success(response?.message || "KPIs saved successfully");
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to save KPIs");
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
            const response = await deleteKPIs(queryString).unwrap();
            message.success(response?.message || "KPIs deleted successfully");
            setSelectedRowKeys([]);
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to delete KPIs");
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
                                                title={`Are you sure you want to delete ${selectedRowKeys.length} selected KPI(s)?`}
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
                        {KPIsLoading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <Spin />
                            </Box>
                        ) : (
                            <Table
                                dataSource={filteredData ?? KPIsData?.data?.content}
                                columns={columns}
                                rowSelection={{ type: 'checkbox', ...rowSelection }}
                                loading={KPIsLoading || isFetching}
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
                    title={selectedRecord ? "Edit KPIs Category" : "Add KPIs Category"}
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
                                    <Input.TextArea rows={2} />
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
                                        {KPIsCategoryData?.data?.content?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Type"
                                    name="type"
                                    rules={[{ required: true, message: 'Please select type!' }]}
                                >
                                    <Select
                                        placeholder="Select Type"
                                    >
                                        {typeData?.data?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Frequency"
                                    name="frequency"
                                    rules={[{ required: true, message: 'Please select frequency!' }]}
                                >
                                    <Select
                                        placeholder="Select Frequency"
                                    >
                                        {frequencyData?.data?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Score"
                                    name="score"
                                    rules={[{ required: true, message: 'Please enter score!' }]}
                                >
                                    <Input type="number" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Critical Attributes"
                                    name="criticalAttributes"
                                    rules={[{ required: false, message: 'Please switch critical attributes!' }]}
                                >
                                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Modal>
            </Box>
        </>
    )
}