import { useRef, useState } from "react"
import { Box, Card, CardContent } from "@mui/material"
import { Space, Input, Button as AntButton, Table, Row, Col, Form, Modal, Popconfirm, message, Typography, Switch, Select, Grid, Spin } from "antd"
import { SearchOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { useGetLocationListQuery, useGetLocationGroupListQuery, useAddLocationMutation, useDeleteLocationMutation } from '../../../store/api/masterSettings.api'
import { skipToken } from '@reduxjs/toolkit/query'
import { useAuth } from '../../../context/AuthContext'
import { domainName } from '../../../config/apiConfig'
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api"

const { TextArea } = Input;

export default function Location() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()

    const { useBreakpoint } = Grid
    const screens = useBreakpoint()

    const [current, setCurrent] = useState(1);
    const [pageSize, setPagesize] = useState(25);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)
    const [mapCenter, setMapCenter] = useState({ lat: 13.0827, lng: 80.2707 })
    const [markerPosition, setMarkerPosition] = useState(null)

    const { data: locationListData, isLoading: locationLoading, isFetching } = useGetLocationListQuery(clientId ? { clientId, pageNumber: 1, pageSize: 1000 } : skipToken)
    const { data: locationGroupListData, isLoading: locationGroupLoading } = useGetLocationGroupListQuery({ clientId, pageNumber: 1, pageSize: 1000 })

    const [addLocation] = useAddLocationMutation();
    const [deleteLocation] = useDeleteLocationMutation();

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
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography.Text>{record?.code || ''} - {record?.name || ''}</Typography.Text>
                    <Typography.Text style={{ color: record?.locationGroup?.color || '#000000' }}>{record?.locationGroup?.name || ''}</Typography.Text>
                </div>
            ),
            sorter: (a, b) => (a?.name ?? '').localeCompare(b?.name ?? '')
        },
        {
            title: 'Device Id',
            dataIndex: 'deviceId',
            key: 'deviceId',
            sorter: (a, b) => a?.deviceId - b?.deviceId
        },
        {
            title: 'Device Number',
            dataIndex: 'deviceSerialNumber',
            key: 'deviceSerialNumber',
            sorter: (a, b) => (a?.deviceSerialNumber ?? '').localeCompare(b?.deviceSerialNumber ?? '')
        },
        {
            title: 'Is Store',
            dataIndex: 'isStore',
            key: 'isStore',
            render: (_, record) => record?.isStore === 'Y' ? 'Yes' : 'No',
            sorter: (a, b) => (a?.isStore ?? '').localeCompare(b?.isStore ?? '')
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            sorter: (a, b) => (a?.address ?? '').localeCompare(b?.address ?? '')
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

        const filtered = locationListData?.data?.content?.filter((item) =>
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

        const lat = record?.latitude
        const lng = record?.longitude

        if (lat && lng) {
            setMapCenter({ lat, lng })
            setMarkerPosition({ lat, lng })
        }

        form.setFieldsValue({
            locationGroup: record?.locationGroup?.id,
            code: record?.code,
            name: record?.name,
            deviceId: record?.deviceId,
            deviceSerialNumber: record?.deviceSerialNumber,
            isStore: record?.isStore === 'Y',
            address: record?.address,
            lattitude: lat,
            longitude: lng
        });
    }

    const handleModalOk = async () => {
        const values = await form.validateFields();
        console.log('form values:', values);

        const payload = {
            ...(selectedRecord?.id && { id: selectedRecord.id }),

            clientId,
            domainName,
            locationGroupId: values.locationGroup,
            code: values.code,
            name: values.name,
            deviceId: values.deviceId,
            deviceSerialNumber: values.deviceSerialNumber,
            isStore: values.isStore ? 'Y' : 'N',
            address: values.address,
            latitude: values.lattitude,
            longitude: values.longitude
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
            const response = await addLocation(payload).unwrap();
            message.success(response?.message || "Location saved successfully");
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to save location");
        } finally {
            handleModalCancel()
        }
    }

    const handleModalCancel = () => {
        form.resetFields();
        setSelectedRecord(null);
        setIsModalOpen(false);
        setMarkerPosition(null)
        setMapCenter({ lat: 13.0827, lng: 80.2707 })
    }

    const handleDelete = async () => {
        try {
            const queryString = selectedRowKeys
                .map(id => `id=${id}`)
                .join('&');
            const response = await deleteLocation(queryString).unwrap();
            message.success(response?.message || "Location deleted successfully");
            setSelectedRowKeys([]);
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to delete location");
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

    // Google Map
    const debounceRef = useRef(null)

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: "AIzaSyC_n7TsFkgBmoWy_r1r4TY4-cT0QUVHi6Q",
    })

    const handleAddressInput = (value) => {
        clearTimeout(debounceRef.current)

        if (!value.trim()) {
            setMarkerPosition(null)
            setMapCenter({ lat: 13.0827, lng: 80.2707 })

            form.setFieldsValue({
                lattitude: undefined,
                longitude: undefined
            })

            return
        }

        debounceRef.current = setTimeout(() => {
            handleAddressChange(value)
        }, 800) // 800ms delay
    }

    const handleAddressChange = async (address) => {
        if (!window.google || !address) return

        const geocoder = new window.google.maps.Geocoder()

        geocoder.geocode({ address }, (results, status) => {
            if (status === "OK" && results[0]) {
                const location = results[0].geometry.location
                const lat = location.lat()
                const lng = location.lng()

                setMapCenter({ lat, lng })
                setMarkerPosition({ lat, lng })

                form.setFieldsValue({
                    lattitude: lat,
                    longitude: lng
                })
            }
        })
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
                                                title={`Are you sure you want to delete ${selectedRowKeys.length} selected location(s)?`}
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
                        {locationLoading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <Spin />
                            </Box>
                        ) : (
                            <Table
                                dataSource={filteredData ?? locationListData?.data?.content}
                                columns={columns}
                                rowSelection={{ type: 'checkbox', ...rowSelection }}
                                loading={locationLoading || isFetching}
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
                    title={selectedRecord ? "Edit Location" : "Add Location"}
                    open={isModalOpen}
                    onCancel={handleModalCancel}
                    // width={
                    //     screens.xxl ? 1000 :
                    //         screens.xl ? 900 :
                    //             screens.lg ? 800 :
                    //                 screens.md ? 700 :
                    //                     screens.sm ? 600 :
                    //                         "95%"
                    // }
                    // style={{ top: 20 }}
                    // bodyStyle={{ maxHeight: "75vh", overflowY: "auto" }}
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
                                    label="Location Group"
                                    name="locationGroup"
                                    rules={[{ required: true, message: 'Please select location group!' }]}
                                >
                                    <Select
                                        placeholder="Select Location Group"
                                        allowClear
                                        showSearch
                                        optionFilterProp="children"
                                    >
                                        {locationGroupListData?.data?.content?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Code"
                                    name="code"
                                    rules={[{ required: true, message: 'Please enter code!' }]}
                                >
                                    <Input type="text" />
                                </Form.Item>
                            </Col>
                        </Row>
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
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Device Id"
                                    name="deviceId"
                                    rules={[{ required: false, message: 'Please enter device id!' }]}
                                >
                                    <Input type="text" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Device Serial Number"
                                    name="deviceSerialNumber"
                                    rules={[{ required: false, message: 'Please enter device serial number!' }]}
                                >
                                    <Input type="text" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item
                                    label="Is Store"
                                    name="isStore"
                                    rules={[{ required: false, message: 'Please switch is store!' }]}
                                >
                                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                                </Form.Item>
                            </Col>
                            <Col span={18}>
                                <Form.Item
                                    label="Address"
                                    name="address"
                                    rules={[{ required: false, message: 'Please enter address!' }]}
                                >
                                    <TextArea rows={2} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Lattitude"
                                    name="lattitude"
                                    rules={[{ required: false, message: 'Please enter lattitude!' }]}
                                >
                                    <Input disabled type="text" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Longitude"
                                    name="longitude"
                                    rules={[{ required: false, message: 'Please enter longitude!' }]}
                                >
                                    <Input disabled type="text" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    label=""
                                    name="professionalAddress"
                                    rules={[{ required: false, message: 'Please enter professional address!' }]}
                                >
                                    <Input
                                        placeholder="Enter Your Professional Address"
                                        allowClear
                                        prefix={<SearchOutlined />}
                                        onChange={(e) => handleAddressInput(e.target.value)}
                                        type="text"
                                    />
                                </Form.Item>
                                {isLoaded && (
                                    <div style={{ height: "300px", width: "100%", marginTop: 16 }}>
                                        <GoogleMap
                                            zoom={15}
                                            center={mapCenter}
                                            mapContainerStyle={{ width: "100%", height: "100%" }}
                                            onClick={(e) => {
                                                const lat = e.latLng.lat()
                                                const lng = e.latLng.lng()

                                                setMarkerPosition({ lat, lng })

                                                form.setFieldsValue({
                                                    lattitude: lat,
                                                    longitude: lng
                                                })
                                            }}
                                        >
                                            {markerPosition && <Marker position={markerPosition} />}
                                        </GoogleMap>
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