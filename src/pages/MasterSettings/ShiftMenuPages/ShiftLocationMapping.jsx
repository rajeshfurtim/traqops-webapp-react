import { useState } from "react"
import { Box, Card, CardContent, Typography } from "@mui/material"
import { Space, Input, Button as AntButton, Table, Row, Col, Form, Modal, Popconfirm, message, Select, DatePicker, Tag, Spin } from "antd"
import { SearchOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { useGetShiftLocationMappingListQuery, useAddShiftLocationMappingMutation, useDeleteShiftLocationMappingMutation, useGetLocationListQuery, useGetAllUserTypeQuery } from '../../../store/api/masterSettings.api'
import { useGetAllShiftListQuery } from '../../../store/api/maintenance.api'
import { skipToken } from '@reduxjs/toolkit/query'
import { useAuth } from '../../../context/AuthContext'
import { domainName } from '../../../config/apiConfig'
import dayjs from 'dayjs'

export default function ShiftLocationMapping() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()

    const [current, setCurrent] = useState(1);
    const [pageSize, setPagesize] = useState(25);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)

    const { data: shiftLocationMappingListData, isLoading: shiftLocationMappingLoading, isFetching } = useGetShiftLocationMappingListQuery(clientId ? { clientId, pageNumber: 1, pageSize: 1000 } : skipToken)
    const { data: locationList, isLoading: locationListLoading } = useGetLocationListQuery({ clientId, pageNumber: 1, pageSize: 1000 })
    const { data: userTypeList, isLoading: userTypeListLoading } = useGetAllUserTypeQuery({ clientId, pageNumber: 1, pageSize: 1000 })
    const { data: shiftListData, isLoading: shiftListLoading } = useGetAllShiftListQuery({ clientId, pageNumber: 1, pageSize: 1000 })

    const [addShiftLocationMapping] = useAddShiftLocationMappingMutation();
    const [deleteShiftLocationMapping] = useDeleteShiftLocationMappingMutation();

    const columns = [
        {
            title: 'S.No',
            dataIndex: 'sno',
            key: 'sno',
            width: 80,
            render: (_, __, index) => ((current - 1) * pageSize) + index + 1
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (_, record) => dayjs(record?.shiftLocationMapping?.date).format('DD-MM-YYYY') || ''
        },
        {
            title: 'Shift',
            key: 'shift',
            render: (_, record) => {
                const allocations = record?.shiftLocationMapping?.staffAllocation || [];
                const total = record?.totalSecurityCount || 0;

                return (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {allocations.map((item) => (
                            <Tag
                                key={item.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "4px 8px",
                                    borderRadius: 20
                                }}
                            >
                                <span>{item.shift?.name}</span>
                                <span
                                    style={{
                                        marginLeft: 6,
                                        background: "#1890ff",
                                        color: "#fff",
                                        padding: "0px 6px",
                                        borderRadius: 10,
                                        fontSize: 12
                                    }}
                                >
                                    {item.securityCount}
                                </span>
                            </Tag>
                        ))}

                        <Tag
                            color="green"
                            style={{
                                fontWeight: 800,
                                borderRadius: 20,
                                padding: "4px 12px",
                            }}
                        >
                            {total}
                        </Tag>
                    </div>
                );
            }
        },
        {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
            render: (_, record) => record?.shiftLocationMapping?.location?.name || ''
        },
        {
            title: 'UserType',
            dataIndex: 'userType',
            key: 'userType',
            render: (_, record) => record?.shiftLocationMapping?.userType?.name || ''
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

        const filtered = shiftLocationMappingListData?.data?.content?.filter((item) =>
            `${item.totalSecurityCount ?? ''} ${item?.shiftLocationMapping?.date ?? ''}
         ${item?.shiftLocationMapping?.location?.name ?? ''} ${item?.shiftLocationMapping?.userType?.name ?? ''}
         ${item?.shiftLocationMapping?.staffAllocation?.map(s => s.securityCount).join(', ') ?? ''}
         ${item?.shiftLocationMapping?.staffAllocation?.map(s => s.shift?.name).join(', ') ?? ''}`
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

        const mapping = record.shiftLocationMapping;

        const shiftValues = {};
        mapping.staffAllocation?.forEach(item => {
            shiftValues[item.shift.id] = item.securityCount;
        });

        form.setFieldsValue({
            location: mapping.location?.id,
            date: mapping.date ? dayjs(mapping.date).format("DD-MM-YYYY") : null,
            userType: mapping.userType?.id,
            ...shiftValues
        });
    }

    const handleModalOk = async () => {
        const values = await form.validateFields();
        console.log('form values:', values);

        const staffAllocationDtos = shiftListData?.data?.content?.map(shift => ({
            shiftId: shift.id,
            securityCount: Number(values[shift.id] || 0)
        })).filter(item => item.securityCount > 0);

        const payload = {
            ...(selectedRecord?.shiftLocationMapping?.id && {
                id: selectedRecord.shiftLocationMapping.id
            }),

            clientId,
            domainName,
            date: dayjs(values.date).format("YYYY-MM-DD"),
            locationId: values.location,
            userTypeId: values.userType,
            staffAllocationDtos
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
            const response = await addShiftLocationMapping(payload).unwrap();
            message.success(response?.message || " Shift Location Mapping saved successfully");
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to save shift location mapping");
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
            const response = await deleteShiftLocationMapping(queryString).unwrap();
            message.success(response?.message || "Shift Location Mapping deleted successfully");
            setSelectedRowKeys([]);
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to delete shift location mapping");
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
                                                title={`Are you sure you want to delete ${selectedRowKeys.length} selected shift location mapping(s)?`}
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
                        {shiftLocationMappingLoading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <Spin />
                            </Box>
                        ) : (
                            <Table
                                dataSource={filteredData ?? shiftLocationMappingListData?.data?.content}
                                columns={columns}
                                rowSelection={{ type: 'checkbox', ...rowSelection }}
                                loading={shiftLocationMappingLoading || isFetching}
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
                    title={selectedRecord ? "Edit Shift Location Mapping" : "Add Shift Location Mapping"}
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
                                    label="Date"
                                    name="date"
                                    rules={[{ required: true, message: 'Please select date!' }]}
                                >
                                    <DatePicker format="DD-MM-YYYY" style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="User Type"
                                    name="userType"
                                    rules={[{ required: true, message: 'Please select user type!' }]}
                                >
                                    <Select placeholder="Select User Type" allowClear>
                                        {userTypeList?.data?.content?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Typography variant="medium" fontWeight="bold" color="#42a5f5" gutterBottom={true}>
                            Staff Allocation
                        </Typography>
                        <Row gutter={16}>
                            {shiftListData?.data?.content?.map(shift => (
                                <Col span={6} key={shift.id}>
                                    <Form.Item
                                        label={shift.name}
                                        name={shift.id}
                                        rules={[{ required: true, message: 'Please enter security count!' }]}
                                    >
                                        <Input type="number" />
                                    </Form.Item>
                                </Col>
                            ))}
                        </Row>
                    </Form>
                </Modal>
            </Box>
        </>
    )
}