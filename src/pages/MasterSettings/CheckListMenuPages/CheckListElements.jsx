import { useState } from "react"
import { Box, Card, CardContent, Typography } from "@mui/material"
import { Space, Input, Button as AntButton, Table, Row, Col, Form, Modal, Popconfirm, message, Select, Spin, TreeSelect } from "antd"
import { SearchOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { useGetElementsCheckListQuery, useAddCheckListElementsMutation, useDeleteCheckListElementsMutation } from '../../../store/api/masterSettings.api'
import { skipToken } from '@reduxjs/toolkit/query'
import { useAuth } from '../../../context/AuthContext'
import { domainName } from '../../../config/apiConfig'

const { SHOW_PARENT } = TreeSelect;

export default function CheckListElements() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()

    const [current, setCurrent] = useState(1);
    const [pageSize, setPagesize] = useState(25);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)
    const [elementType, setElementType] = useState(null)
    const [dataEntryType, setDataEntryType] = useState(null)

    const { data: elementCheckList, isLoading: elementCheckListLoading, isFetching } = useGetElementsCheckListQuery(clientId ? { clientId, pageNumber: 1, pageSize: 2000 } : skipToken)

    const [addCheckListElements] = useAddCheckListElementsMutation();
    const [deleteCheckListElements] = useDeleteCheckListElementsMutation();

    const elementsTypeData = [
        { id: 'RADIO', name: 'RADIO' },
        { id: 'CHECKBOX', name: 'CHECKBOX' },
        { id: 'DATA ENTRY', name: 'DATA ENTRY' },
    ]

    const dataEntryData = [
        { id: 'TEXT', name: 'TEXT' },
        { id: 'NUMERIC VALUE', name: 'NUMERIC VALUE' }
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
            width: 300
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            width: 200,
            render: (_, record) => (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>

                    <Typography variant="body4">
                        {record?.dataEntryType}
                    </Typography>

                    {record?.dataEntryType === "NUMERIC VALUE" && (
                        <>
                            <Typography variant="body4">
                                Min : {record?.minimumValue}
                            </Typography>

                            <Typography variant="body4">
                                Max : {record?.maximumValue}
                            </Typography>
                        </>
                    )}

                </div>
            )
        },
        {
            title: 'Units',
            dataIndex: 'units',
            key: 'units',
            width: 200
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: 400
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

        const filtered = elementCheckList?.data?.content?.filter((item) =>
            `${item.name ?? ''} ${item.elementsType ?? ''} ${item?.units ?? ''} ${item?.description ?? ''}
        ${item?.minimumValue ?? ''} ${item?.maximumValue ?? ''}`
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
        setElementType(record?.elementsType)
        setDataEntryType(record?.dataEntryType)
        setIsModalOpen(true)

        form.setFieldsValue({
            name: record?.name,
            units: record?.units,
            elementsType: record?.elementsType,
            dataEntry: record?.dataEntryType,
            minimumValue: record?.minimumValue,
            maximumValue: record?.maximumValue,
            description: record?.description
        });
    }

    const handleModalOk = async () => {
        const values = await form.validateFields();
        console.log('form values:', values);

        const payload = {
            ...(selectedRecord?.id && { id: selectedRecord.id }),

            clientId,
            name: values.name,
            units: values.units,
            elementsType: values.elementsType,
            dataEntryType: values.dataEntry,
            minimumValue: values.minimumValue,
            maximumValue: values.maximumValue,
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
            const response = await addCheckListElements(payload).unwrap();
            message.success(response?.message || "CheckList Elements saved successfully");
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to save CheckList Elements");
        } finally {
            handleModalCancel()
        }
    }

    const handleModalCancel = () => {
        form.resetFields();
        setSelectedRecord(null);
        setDataEntryType(null)
        setElementType(null)
        setIsModalOpen(false);
    }

    const handleDelete = async () => {
        try {
            const queryString = selectedRowKeys
                .map(id => `id=${id}`)
                .join('&');
            const response = await deleteCheckListElements(queryString).unwrap();
            message.success(response?.message || "CheckList Elements deleted successfully");
            setSelectedRowKeys([]);
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to delete CheckList Elements");
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
                                                title={`Are you sure you want to delete ${selectedRowKeys.length} selected CheckList Element(s)?`}
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
                        {elementCheckListLoading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <Spin />
                            </Box>
                        ) : (
                            <Table
                                dataSource={filteredData ?? elementCheckList?.data?.content}
                                columns={columns}
                                rowSelection={{ type: 'checkbox', ...rowSelection }}
                                loading={elementCheckListLoading || isFetching}
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
                    title={selectedRecord ? "Edit CheckList Element" : "Add CheckList Element"}
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
                            <Col span={12}>
                                <Form.Item
                                    label="Units"
                                    name="units"
                                    rules={[{ required: false, message: 'Please enter units!' }]}
                                >
                                    <Input type="text" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Elements Type"
                                    name="elementsType"
                                    rules={[{ required: true, message: 'Please select elements type!' }]}
                                >
                                    <Select
                                        placeholder="Select Elements Type"
                                        onChange={(data) => {
                                            setDataEntryType(null)
                                            setElementType(data)
                                            form.resetFields(['dataEntry', 'minimumValue', 'maximumValue'])
                                        }}
                                    >
                                        {elementsTypeData?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            {elementType === 'DATA ENTRY' &&
                                <Col span={12}>
                                    <Form.Item
                                        label="Data Entry"
                                        name="dataEntry"
                                        rules={[{ required: true, message: 'Please select data entry!' }]}
                                    >
                                        <Select
                                            placeholder="Select Data Entry"
                                            onChange={(data) => setDataEntryType(data)}
                                        >
                                            {dataEntryData?.map(l => (
                                                <Select.Option key={l.id} value={l.id}>
                                                    {l.name}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            }
                            {dataEntryType === 'NUMERIC VALUE' &&
                                <>
                                    <Col span={6}>
                                        <Form.Item
                                            label="Min Value"
                                            name="minimumValue"
                                            rules={[{ required: true, message: 'Please enter minimum value!' }]}
                                        >
                                            <Input type="number" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            label="Max Value"
                                            name="maximumValue"
                                            rules={[{ required: true, message: 'Please enter maximum value!' }]}
                                        >
                                            <Input type="number" />
                                        </Form.Item>
                                    </Col>
                                </>
                            }
                            <Col span={24}>
                                <Form.Item
                                    label="Description"
                                    name="description"
                                    rules={[{ required: false, message: 'Please enter description!' }]}
                                >
                                    <Input.TextArea rows={3} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Modal>
            </Box>
        </>
    )
}