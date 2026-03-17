import { useState } from "react"
import { Box, Card, CardContent } from "@mui/material"
import { Space, Input, Button as AntButton, Table, Row, Col, Form, Modal, Popconfirm, message, Tag, TreeSelect, Spin } from "antd"
import { SearchOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { useGetCheckListByClientQuery, useAddAssetCategoryMutation, useDeleteAssetCategoryMutation } from '../../../store/api/masterSettings.api'
import { useGetAllCategoryListQuery } from '../../../store/api/maintenance.api'
import { skipToken } from '@reduxjs/toolkit/query'
import { useAuth } from '../../../context/AuthContext'
import { domainName } from '../../../config/apiConfig'

const { SHOW_PARENT } = TreeSelect;

export default function AssetCategory() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()

    const [current, setCurrent] = useState(1);
    const [pageSize, setPagesize] = useState(25);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)

    const { data: assetCategoryListData, isLoading: assetCategoryListLoading, isFetching } = useGetAllCategoryListQuery(clientId ? { clientId, pageNumber: 1, pageSize: 1000 } : skipToken)
    const { data: checkListData, isLoading: checkListLoading } = useGetCheckListByClientQuery({ clientId, pageNumber: 1, pageSize: 1000 })

    const [addAssetCategory] = useAddAssetCategoryMutation();
    const [deleteAssetCategory] = useDeleteAssetCategoryMutation();

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
            width: 250,
            sorter: (a, b) => (a?.name ?? '').localeCompare(b?.name ?? '')
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: 300,
            sorter: (a, b) => (a?.description ?? '').localeCompare(b?.description ?? '')
        },
        {
            title: 'CheckList',
            dataIndex: 'checkList',
            key: 'checkList',
            width: 500,
            render: (_, record) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {Array.isArray(record?.assetsCategoryChecklistMapping) &&
                        record?.assetsCategoryChecklistMapping.length > 0 ? (
                        record.assetsCategoryChecklistMapping.map(loc => (
                            <Tag
                                key={loc.id}
                                style={{
                                    borderRadius: 25,
                                    padding: '4px 8px',
                                    fontSize: 13
                                }}
                            >
                                {loc?.checkList?.name}
                            </Tag>
                        ))
                    ) : (
                        '-'
                    )}
                </div>
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

        const filtered = assetCategoryListData?.data?.content?.filter((item) =>
            `${item.name ?? ''} ${item?.description ?? ''}
         ${item?.assetsCategoryChecklistMapping?.map((checklist) => checklist?.checkList?.name || '').join(', ') || ''}`
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
            description: record?.description,
            checkList: record?.assetsCategoryChecklistMapping?.map(c => c.checkList.id)
        });
    }

    const handleModalOk = async () => {
        const values = await form.validateFields();
        console.log('form values:', values);

        const assetsCategoryChecklistMappingDtos =
            values.checkList?.map(id => ({
                checklistId: id
            })) || [];

        const payload = {
            ...(selectedRecord?.id && { id: selectedRecord.id }),

            clientId,
            domainName,
            name: values.name,
            description: values.description,
            assetsCategoryChecklistMappingDtos
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
            const response = await addAssetCategory(payload).unwrap();
            message.success(response?.message || " Asset Category saved successfully");
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to save asset category");
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
            const response = await deleteAssetCategory(queryString).unwrap();
            message.success(response?.message || "Asset Category deleted successfully");
            setSelectedRowKeys([]);
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to delete asset category");
        } finally {
            handleModalCancel()
        }
    }

    const treeDataCheckList = [
        {
            title: "Select All CheckLists",
            value: "all",
            key: "all",
            children: checkListData?.data?.content?.map((checkList) => ({
                title: checkList.name,
                value: checkList.id,
                key: checkList.id,
            })),
        },
    ];

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
                                                title={`Are you sure you want to delete ${selectedRowKeys.length} selected asset category(s)?`}
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
                        {assetCategoryListLoading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <Spin />
                            </Box>
                        ) : (
                            <Table
                                dataSource={filteredData ?? assetCategoryListData?.data?.content}
                                columns={columns}
                                rowSelection={{ type: 'checkbox', ...rowSelection }}
                                loading={assetCategoryListLoading || isFetching}
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
                    title={selectedRecord ? "Edit Asset Category" : "Add Asset Category"}
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
                                    label="CheckList"
                                    name="checkList"
                                    rules={[{ required: true, message: 'Please select checkList!' }]}
                                >
                                    <TreeSelect
                                        style={{ width: "100%" }}
                                        dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                                        treeData={treeDataCheckList}
                                        placeholder="Select CheckList"
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
                                                    checkList: checkListData?.data?.content?.map((loc) => loc.id),
                                                });
                                            }
                                        }}
                                    />
                                </Form.Item>
                            </Col>
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