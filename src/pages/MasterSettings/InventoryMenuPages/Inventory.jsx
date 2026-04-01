import { useState } from "react"
import { Box, Card, CardContent, Typography } from "@mui/material"
import { Space, Input, Button as AntButton, Table, Row, Col, Form, Modal, Popconfirm, message, Spin, Select, Upload, Tag, Badge, Tooltip } from "antd"
import { SearchOutlined, PlusOutlined, DeleteOutlined, UploadOutlined, EditOutlined, DownloadOutlined } from "@ant-design/icons"
import { useGetBMRCLInventoryListQuery, useGetLocationByIsStoreQuery, useGetAllInventoryCategoryQuery, useAddInventoryMutation, useDeleteInventoryMutation } from '../../../store/api/masterSettings.api'
import { useGetAllCategoryListQuery } from '../../../store/api/maintenance.api'
import { skipToken } from '@reduxjs/toolkit/query'
import { useAuth } from '../../../context/AuthContext'
import { domainName } from '../../../config/apiConfig'
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from 'jspdf'

export default function Inventory() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()
    const [itemForm] = Form.useForm()

    const [current, setCurrent] = useState(1);
    const [pageSize, setPagesize] = useState(25);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)
    const [fileList, setFileList] = useState([]);
    const [items, setItems] = useState([]);
    const [editIndex, setEditIndex] = useState(null);

    const { data: inventoryData, isLoading: inventoryLoading, isFetching } = useGetBMRCLInventoryListQuery(clientId ? { clientId, pageNumber: 1, pageSize: 1000 } : skipToken)
    const { data: inventoryCategoryData, isLoading: inventoryCategoryLoading } = useGetAllInventoryCategoryQuery({ clientId, pageNumber: 1, pageSize: 1000 })
    const { data: locationData, isLoading: locationLoading } = useGetLocationByIsStoreQuery({ clientId, pageNumber: 1, pageSize: 1000 })
    const { data: assetCategory, isLoading: assetCategoryLoading } = useGetAllCategoryListQuery({ clientId, pageNumber: 1, pageSize: 1000 })

    const [addInventory] = useAddInventoryMutation();
    const [deleteInventory] = useDeleteInventoryMutation();

    const unitsData = [
        { id: 'Ltr', name: 'Ltr' },
        { id: 'Nos', name: 'Nos' },
        { id: 'cm', name: 'cm' },
        { id: 'Meter', name: 'Meter' },
        { id: 'mm', name: 'mm' },
        { id: 'Kgs', name: 'Kgs' },
        { id: 'Sq Mtr', name: 'Sq Mtr' }
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
            render: (_, record) => record?.name || '-',
            sorter: (a, b) => (a?.name ?? '').localeCompare(b?.name ?? '')
        },
        {
            title: 'Inventory Category',
            dataIndex: 'inventoryCategoryName',
            key: 'inventoryCategoryName',
            sorter: (a, b) => (a?.inventoryCategoryName ?? '').localeCompare(b?.inventoryCategoryName ?? '')
        },
        {
            title: 'Asset Category',
            dataIndex: 'categoryName',
            key: 'categoryName',
            render: (_, record) => record?.categoryName || '-',
            sorter: (a, b) => (a?.categoryName ?? '').localeCompare(b?.categoryName ?? '')
        },
        {
            title: 'Location',
            dataIndex: 'locationName',
            key: 'locationName',
            width: 450,
            render: (_, record) => {
                return (
                    <>
                        {Array.isArray(record?.inventoryLocationResponseDtos) &&
                            record.inventoryLocationResponseDtos.length > 0 ? (
                            record.inventoryLocationResponseDtos.map((item) => (
                                <Tag
                                    key={item.id}
                                    style={{
                                        borderRadius: 25,
                                        padding: '4px 10px',
                                        fontSize: 13,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        marginBottom: 4
                                    }}
                                >
                                    {item.locationName}

                                    {/* Quantity Badge */}
                                    <Badge
                                        count={item.quantity}
                                        style={{ backgroundColor: '#1677ff', marginLeft: 6 }}
                                    />
                                </Tag>
                            ))
                        ) : (
                            '-'
                        )}
                    </>
                );
            }
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

        const filtered = inventoryData?.data?.filter((item) =>
            `${item?.name ?? ''} ${item?.inventoryCategoryName ?? ''}
             ${item?.categoryName ?? ''} ${item?.inventoryLocationResponseDtos?.map(loc => loc?.locationName ?? '')?.join(' ') ?? ''}`
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

        setFileList(record?.files ? [{
            uid: '-1',
            name: record.files?.name,
            status: 'done',
            url: record.files?.filePath
        }] : []);

        setItems(
            record?.inventoryLocationResponseDtos?.map((item) => ({
                id: item.id,
                locationId: item.locationId,
                locationName: item.locationName,
                quantity: item.quantity,
                safetyStock: item.safetyStock,
                units: item.units,
            })) || []
        );

        form.setFieldsValue({
            name: record?.name,
            // location: record?.location?.id,
            inventoryCategory: record?.inventoryCategoryId,
            assetCategory: record?.categoryId,
            // quantity: record?.quantity,
            description: record?.description,
            // units: record?.units,
            files: record?.files
                ? [{
                    uid: '-1',
                    name: record.files?.name,
                    status: 'done',
                    url: record.files?.filePath
                }]
                : []
        });
    }

    const handleModalOk = async () => {
        const values = await form.validateFields([
            "name",
            "inventoryCategory",
            "assetCategory",
            "description",
            "files"
        ]);
        console.log('form values:', values);

        const formData = new FormData();
        if (selectedRecord?.id) {
            formData.append("id", selectedRecord.id);
        }

        formData.append("clientId", clientId);
        formData.append("domainName", domainName);
        formData.append("name", values.name);
        formData.append("description", values.description || "");
        // formData.append("quantity", values.quantity || "");
        // formData.append("units", values.units);
        // formData.append("locationId", values.location);
        formData.append("inventoryCategoryId", values.inventoryCategory);
        formData.append("categoryId", values.assetCategory);

        items.forEach((item, index) => {
            if (item.id) {
                formData.append(`inventoryLocationMappingDtos[${index}].id`, item.id);
            }
            formData.append(`inventoryLocationMappingDtos[${index}].locationId`, item.locationId);
            formData.append(`inventoryLocationMappingDtos[${index}].quantity`, item.quantity || 0);
            formData.append(`inventoryLocationMappingDtos[${index}].safetyStock`, item.safetyStock || 0);
            formData.append(`inventoryLocationMappingDtos[${index}].units`, item.units || "");
        });

        if (fileList.length > 0 && fileList[0].originFileObj) {
            formData.append("file", fileList[0].originFileObj);
        }

        console.log("Final FormData:", formData);
        handleSubmit(formData)
    }

    const handleSubmit = async (payload) => {
        try {
            const response = await addInventory(payload).unwrap();
            message.success(response?.message || "Inventory saved successfully");
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to save inventory");
        } finally {
            handleModalCancel()
        }
    }

    const handleModalCancel = () => {
        form.resetFields();
        setItems([]);
        setEditIndex(null);
        setSelectedRecord(null);
        setIsModalOpen(false);
    }

    const handleDelete = async () => {
        try {
            const queryString = selectedRowKeys
                .map(id => `id=${id}`)
                .join('&');
            const response = await deleteInventory(queryString).unwrap();
            message.success(response?.message || "Inventory deleted successfully");
            setSelectedRowKeys([]);
        } catch (error) {
            message.error(error?.data?.message || error?.data?.error || "Failed to delete inventory");
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

    const handleAddItem = async () => {
        try {
            const values = await form.validateFields([
                "location",
                "quantity",
                "safetyStock",
                "units"
            ]);

            const selectedLocation = locationData?.data?.content?.find(
                (l) => l.id === values.location
            );

            const newItem = {
                id: items[editIndex]?.id,
                locationId: values.location,
                locationName: selectedLocation?.name,
                quantity: values.quantity,
                safetyStock: values.safetyStock,
                units: values.units,
            };

            if (editIndex !== null) {
                const updated = [...items];
                updated[editIndex] = newItem;
                setItems(updated);
                setEditIndex(null);
            } else {
                setItems([...items, newItem]);
            }

            // ✅ reset only item fields
            form.setFieldsValue({
                location: null,
                quantity: null,
                safetyStock: null,
                units: null,
            });

        } catch (err) {
            console.log("Item validation failed:", err);
        }
    };

    const handleDownloadQR = () => {
        const canvas = document.getElementById("qr-code-canvas");

        if (!canvas) return;

        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        // Center QR in PDF
        const imgWidth = 60;
        const imgHeight = 60;

        const pageWidth = pdf.internal.pageSize.getWidth();
        const x = (pageWidth - imgWidth) / 2;

        pdf.text(`Asset ID: ${selectedRecord.id}`, x, 95);
        pdf.addImage(imgData, "PNG", x, 30, imgWidth, imgHeight);

        pdf.save(`AST_${selectedRecord.id}.pdf`);
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
                                                title={`Are you sure you want to delete ${selectedRowKeys.length} selected inventory(s)?`}
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
                        {inventoryLoading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <Spin />
                            </Box>
                        ) : (
                            <Table
                                dataSource={filteredData ?? inventoryData?.data}
                                columns={columns}
                                rowSelection={{ type: 'checkbox', ...rowSelection }}
                                loading={inventoryLoading || isFetching}
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
                    title={selectedRecord ? "Edit Inventory" : "Add Inventory"}
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
                                    label="Inventory Category"
                                    name="inventoryCategory"
                                    rules={[{ required: true, message: 'Please select inventory category!' }]}
                                >
                                    <Select
                                        placeholder="Select Inventory Category"
                                    >
                                        {inventoryCategoryData?.data?.content?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Asset Category"
                                    name="assetCategory"
                                    rules={[{ required: true, message: 'Please select asset category!' }]}
                                >
                                    <Select
                                        placeholder="Select Asset Category"
                                    >
                                        {assetCategory?.data?.content?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Description"
                                    name="description"
                                    rules={[{ required: false, message: 'Please enter description!' }]}
                                >
                                    <Input.TextArea rows={2} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Files"
                                    name="files"
                                    rules={[{ required: false }]}
                                >
                                    <Upload
                                        // listType="picture-card"
                                        fileList={fileList}
                                        beforeUpload={(file) => {
                                            const isJpgOrPng =
                                                file.type === "image/jpeg" || file.type === "image/png";

                                            if (!isJpgOrPng) {
                                                message.error("Only JPG/PNG files allowed!");
                                            }

                                            const isLt2M = file.size / 1024 / 1024 < 2;
                                            if (!isLt2M) {
                                                message.error("Image must be smaller than 2MB!");
                                            }

                                            return isJpgOrPng && isLt2M ? false : Upload.LIST_IGNORE;
                                        }}
                                        onChange={({ fileList }) => setFileList(fileList)}
                                        maxCount={1}
                                        accept=".jpg,.jpeg,.png"
                                    >
                                        {/* {fileList.length >= 1 ? null : (
                                            <div>
                                                <PlusOutlined />
                                                <div style={{ marginTop: 8 }}>Upload</div>
                                            </div>
                                        )} */}
                                        <AntButton icon={<UploadOutlined />}>
                                            Click to Upload
                                        </AntButton>
                                    </Upload>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                {selectedRecord?.id && (
                                    <Box sx={{ position: 'relative', width: 'fit-content', mb: 2 }}>

                                        <Tooltip title="Download QR">
                                            <DownloadOutlined
                                                onClick={handleDownloadQR}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    right: 0,
                                                    cursor: 'pointer',
                                                    fontSize: 18,
                                                    background: '#fff',
                                                    borderRadius: '50%',
                                                    padding: 4,
                                                    boxShadow: '0 0 5px rgba(0,0,0,0.2)'
                                                }}
                                            />
                                        </Tooltip>

                                        <Box sx={{ mt: 1, fontWeight: 700 }}>
                                            Inventory Qr Code
                                        </Box>
                                        <QRCodeCanvas
                                            id="qr-code-canvas"
                                            value={`INT_${selectedRecord.id}`}
                                            size={160}
                                        />
                                    </Box>
                                )}
                            </Col>
                        </Row>
                        <Typography variant="medium" fontWeight="bold" color="#42a5f5" gutterBottom={true}>
                            Add Items
                        </Typography>
                        {/* <div>
                        <Form
                            form={itemForm}
                            layout="vertical"
                            onFinish={handleAddItem}
                        > */}
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Location"
                                    name="location"
                                    rules={[{ required: true, message: 'Please select location!' }]}
                                >
                                    <Select
                                        placeholder="Select Location"
                                    >
                                        {locationData?.data?.content?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label="Quantity"
                                    name="quantity"
                                    rules={[{ required: false, message: 'Please enter quantity!' }]}
                                >
                                    <Input type="number" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label="Safety Stock"
                                    name="safetyStock"
                                    rules={[{ required: false, message: 'Please enter safety stock!' }]}
                                >
                                    <Input type="number" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label="Units"
                                    name="units"
                                    rules={[{ required: true, message: 'Please select units!' }]}
                                >
                                    <Select
                                        placeholder="Select Units"
                                    >
                                        {unitsData?.map(l => (
                                            <Select.Option key={l.id} value={l.id}>
                                                {l.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label=" "
                                    name="add"
                                    rules={[{ required: false }]}
                                >
                                    <AntButton type="primary" onClick={handleAddItem}>
                                        {editIndex !== null ? "Update" : "Add"}
                                    </AntButton>
                                </Form.Item>
                            </Col>
                        </Row>
                        {/* </Form>
                        </div> */}
                        <Row gutter={16}>
                            <Col span={24}>
                                {items.length > 0 && (
                                    <Table
                                        dataSource={items}
                                        rowKey={(record, index) => index}
                                        pagination={false}
                                        style={{ marginTop: 16 }}
                                        columns={[
                                            {
                                                title: "Location",
                                                dataIndex: "locationName",
                                            },
                                            {
                                                title: "Quantity",
                                                dataIndex: "quantity",
                                            },
                                            {
                                                title: "Safety Stock",
                                                dataIndex: "safetyStock",
                                            },
                                            {
                                                title: "Units",
                                                dataIndex: "units",
                                                render: (_, record) => record?.units != "null" ? record?.units : '',
                                            },
                                            {
                                                title: "Action",
                                                render: (_, record, index) => (
                                                    <Space>
                                                        <a
                                                            onClick={() => {
                                                                form.setFieldsValue({
                                                                    location: record.locationId,
                                                                    quantity: record.quantity,
                                                                    safetyStock: record.safetyStock,
                                                                    units: record.units,
                                                                });
                                                                setEditIndex(index);
                                                            }}
                                                            style={{ marginRight: 8 }}
                                                        >
                                                            <EditOutlined style={{ color: 'green' }} />
                                                        </a>
                                                        <a
                                                            onClick={() => {
                                                                const updated = items.filter((_, i) => i !== index);
                                                                setItems(updated);
                                                            }}
                                                        >
                                                            <DeleteOutlined style={{ color: 'red' }} />
                                                        </a>
                                                    </Space>
                                                ),
                                            },
                                        ]}
                                    />
                                )}
                            </Col>
                        </Row>
                    </Form>
                </Modal>
            </Box>
        </>
    )
}