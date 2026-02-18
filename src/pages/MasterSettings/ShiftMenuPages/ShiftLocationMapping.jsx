import { useState } from "react"
import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material"
import { Space, Input, Button as AntButton, Table, Row, Col, Form, Modal, Popconfirm, message, Select, DatePicker, Tag } from "antd"
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
            render: (_, __, index) => index + 1
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
            const response = await deleteShiftLocationMapping(selectedRecord?.shiftLocationMapping?.id).unwrap();
            message.success(response?.message || "Shift Location Mapping deleted successfully");
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to delete shift location mapping");
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
                        {(shiftLocationMappingLoading || isFetching) ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Table
                                dataSource={filteredData ?? shiftLocationMappingListData?.data?.content}
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
                    title="Shift Location Mapping"
                    open={isModalOpen}
                    onCancel={handleModalCancel}
                    footer={[
                        selectedRecord && (
                            <Popconfirm
                                key="delete"
                                title="Are you sure you want to delete this shift location mapping?"
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