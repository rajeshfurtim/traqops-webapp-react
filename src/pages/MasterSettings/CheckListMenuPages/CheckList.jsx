import { useState } from "react"
import { Box, Card, CardContent, Typography } from "@mui/material"
import { Space, Input, Button as AntButton, Table, Row, Col, Form, Modal, Popconfirm, message, Select, Spin, TreeSelect, Tag } from "antd"
import { SearchOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { useGetCheckListByClientQuery, useGetCheckListTypeQuery, useGetElementsCheckListQuery, useAddCheckListMutation, useDeleteCheckListMutation } from '../../../store/api/masterSettings.api'
import { skipToken } from '@reduxjs/toolkit/query'
import { useAuth } from '../../../context/AuthContext'
import { domainName } from '../../../config/apiConfig'

const { SHOW_PARENT } = TreeSelect;

export default function CheckList() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()
    const selectedElements = Form.useWatch('elements', form);

    const [current, setCurrent] = useState(1);
    const [pageSize, setPagesize] = useState(25);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)

    const { data: checkListData, isLoading: checkListLoading, isFetching } = useGetCheckListByClientQuery(clientId ? { clientId, pageNumber: 1, pageSize: 1000 } : skipToken)
    const { data: checkListTypeData, isLoading: checkListTypeLoading } = useGetCheckListTypeQuery({ clientId, pageNumber: 1, pageSize: 1000 })
    const { data: elementCheckList, isLoading: elementCheckListLoading } = useGetElementsCheckListQuery({ clientId, pageNumber: 1, pageSize: 2000 })

    const [addCheckList] = useAddCheckListMutation();
    const [deleteCheckList] = useDeleteCheckListMutation();

    const statusData = [
        { id: 'Y', name: 'Enabled' },
        { id: 'N', name: 'Disabled' }
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
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (_, record) => record?.checkListType?.name,
            sorter: (a, b) => (a?.checkListType?.name ?? '').localeCompare(b?.checkListType?.name ?? '')
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (_, record) => record?.status === 'Y' ? "Enabled" : "Disabled",
            sorter: (a, b) => (a?.status ?? '').localeCompare(b?.status ?? '')
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

        const filtered = checkListData?.data?.content?.filter((item) =>
            `${item.name ?? ''} ${item.checkListType?.name ?? ''} ${item.status === 'Y' ? "Enabled" : "Disabled"}`
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
            checkListType: record?.checkListType?.id,
            status: record?.status,
            elements: record?.checklistElementsMapping?.map(e => e.elementsChecklist?.id)
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
            checkListTypeId: values.checkListType,
            status: values.status,
            elementsChecklistMappingDtos: (values.elements || []).map((locId) => ({
                ...(selectedRecord?.checklistElementsMapping?.find(
                    (l) => l.elementsChecklist.id === locId
                )?.id && {
                    id: selectedRecord.checklistElementsMapping.find(
                        (l) => l.elementsChecklist.id === locId
                    )?.id,
                }),
                elementsCheckListId: locId,
            })),
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
            const response = await addCheckList(payload).unwrap();
            message.success(response?.message || "CheckList saved successfully");
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to save CheckList");
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
            const response = await deleteCheckList(queryString).unwrap();
            message.success(response?.message || "CheckList deleted successfully");
            setSelectedRowKeys([]);
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to delete CheckList");
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

    const treeDataElements = [
        {
            title: "Select All Elements",
            value: "all",
            key: "all",
            children: elementCheckList?.data?.content?.map((loc) => ({
                title: loc.name,
                value: loc.id,
                key: loc.id,
            })),
        },
    ];

    const getElementLabel = (id) => {
        const findNode = (data) => {
            for (let item of data) {
                if (item.value === id) return item.title;
                if (item.children) {
                    const found = findNode(item.children);
                    if (found) return found;
                }
            }
            return null;
        };

        return findNode(treeDataElements);
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
                                                title={`Are you sure you want to delete ${selectedRowKeys.length} selected CheckList(s)?`}
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
                        {checkListLoading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <Spin />
                            </Box>
                        ) : (
                            <Table
                                dataSource={filteredData ?? checkListData?.data?.content}
                                columns={columns}
                                rowSelection={{ type: 'checkbox', ...rowSelection }}
                                loading={checkListLoading || isFetching}
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
                    title={selectedRecord ? "Edit Check List" : "Add Check List"}
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
                                    label="Check List Type"
                                    name="checkListType"
                                    rules={[{ required: true, message: 'Please select checkList type!' }]}
                                >
                                    <Select
                                        placeholder="Select CheckList Type"
                                    >
                                        {checkListTypeData?.data?.content?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Status"
                                    name="status"
                                    rules={[{ required: true, message: 'Please select status!' }]}
                                >
                                    <Select
                                        placeholder="Select Status"
                                    >
                                        {statusData?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Typography variant="medium" fontWeight="bold" color="#42a5f5" gutterBottom={true}>
                            Add Elements
                        </Typography>
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    label="Elements"
                                    name="elements"
                                    rules={[{ required: true, message: 'Please select elements!' }]}
                                >
                                    <TreeSelect
                                        style={{ width: "100%" }}
                                        dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                                        treeData={treeDataElements}
                                        placeholder="Select Elements"
                                        treeCheckable
                                        showCheckedStrategy={SHOW_PARENT}
                                        allowClear
                                        showSearch
                                        treeNodeFilterProp="title"
                                        maxTagCount={1}
                                        maxTagPlaceholder={(omittedValues) => `+ ${omittedValues.length} more`}
                                        onChange={(newValue) => {
                                            if (newValue?.includes("all")) {
                                                form.setFieldsValue({
                                                    location: elementCheckList?.data?.content?.map((loc) => loc.id),
                                                });
                                            }
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                {selectedElements?.length > 0 && (
                                    <div style={{
                                        marginTop: 8,
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '6px'
                                    }}
                                    >
                                        {selectedElements.map((id) => (
                                            <Tag
                                                key={id}
                                                closable
                                                onClose={() => {
                                                    const updated = selectedElements.filter(val => val !== id);
                                                    form.setFieldsValue({ elements: updated });
                                                }}
                                                style={{
                                                    borderRadius: 25,
                                                    padding: '4px 6px',
                                                    maxWidth: '100%',
                                                    whiteSpace: 'normal',
                                                    wordBreak: 'break-word',
                                                    margin: '4px'
                                                }}
                                            >
                                                {getElementLabel(id)}
                                            </Tag>
                                        ))}
                                    </div>
                                )}
                            </Col>
                        </Row>
                    </Form>
                </Modal>
            </Box>
        </>
    )
}