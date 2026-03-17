import { useState } from "react"
import { Box, Card, CardContent } from "@mui/material"
import { Space, Input, Button as AntButton, Table, Row, Col, Form, Modal, Popconfirm, message, TreeSelect, Spin, Tag } from "antd"
import { SearchOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { useGetToolsListQuery, useAddToolsMutation, useDeleteToolsMutation, useGetLocationByIsStoreQuery } from '../../store/api/masterSettings.api'
import { skipToken } from '@reduxjs/toolkit/query'
import { useAuth } from '../../context/AuthContext'
import { domainName } from '../../config/apiConfig'

const { SHOW_PARENT } = TreeSelect;

export default function ToolsMaster() {

  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId
  const [form] = Form.useForm()

  const [current, setCurrent] = useState(1);
  const [pageSize, setPagesize] = useState(25);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const { data: toolsListData, isLoading: toolsListLoading, isFetching } = useGetToolsListQuery(clientId ? { clientId, pageNumber: 1, pageSize: 1000 } : skipToken)
  const { data: locationList, isLoading: locationLoading } = useGetLocationByIsStoreQuery({ clientId, pageNumber: 1, pageSize: 1000 })

  const [addTools] = useAddToolsMutation();
  const [deleteTools] = useDeleteToolsMutation();

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      width: 80,
      render: (_, __, index) => ((current - 1) * pageSize) + index + 1
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 450,
      render: (_, record) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {Array.isArray(record?.toolsLocationMapping) &&
            record?.toolsLocationMapping.length > 0 ? (
            record.toolsLocationMapping.map(loc => (
              <Tag
                key={loc.id}
                style={{
                  borderRadius: 25,
                  padding: '4px 8px',
                  fontSize: 13
                }}
              >
                {loc?.location?.name}
              </Tag>
            ))
          ) : (
            '-'
          )}
        </div>
      )
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => (a?.name ?? '').localeCompare(b?.name ?? '')
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a?.quantity - b?.quantity
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      sorter: (a, b) => (a?.description ?? '').localeCompare(b?.description ?? '')
    },
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

    const filtered = toolsListData?.data?.content?.filter((item) =>
      `${item.name ?? ''} ${item?.description ?? ''} ${item?.quantity ?? ''}
            ${item?.toolsLocationMapping?.map(loc => loc?.location?.name ?? '')?.join(' ') ?? ''}`
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
      location: record?.toolsLocationMapping?.map(loc => loc?.location?.id) || null,
      description: record?.description,
      quantity: record?.quantity
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
      description: values.description,
      quantity: values.quantity,
      toolsLocationMappingDtos: (values.location || []).map((locId) => ({
        ...(selectedRecord?.toolsLocationMapping?.find(
          (l) => l.location.id === locId
        )?.id && {
          id: selectedRecord.toolsLocationMapping.find(
            (l) => l.location.id === locId
          )?.id,
        }),
        locationId: locId,
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
      const response = await addTools(payload).unwrap();
      message.success(response?.message || "Tools saved successfully");
    } catch (error) {
      message.error(error?.data?.message || error?.data?.error || "Failed to save tools");
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
      const response = await deleteTools(queryString).unwrap();
      message.success(response?.message || "Tools deleted successfully");
      setSelectedRowKeys([]);
    } catch (error) {
      message.error(error?.data?.message || error?.data?.error || "Failed to delete tools");
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

  const treeDataLocation = [
    {
      title: "Select All Locations",
      value: "all",
      key: "all",
      children: locationList?.data?.content?.map((loc) => ({
        title: loc.name,
        value: loc.id,
        key: loc.id,
      })),
    },
  ];

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
                        title={`Are you sure you want to delete ${selectedRowKeys.length} selected tool(s)?`}
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
            {toolsListLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <Spin />
              </Box>
            ) : (
              <Table
                dataSource={filteredData ?? toolsListData?.data?.content}
                columns={columns}
                rowSelection={{ type: 'checkbox', ...rowSelection }}
                loading={toolsListLoading || isFetching}
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
          title={selectedRecord ? "Edit Tool" : "Add Tool"}
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
                  <TreeSelect
                    style={{ width: "100%" }}
                    dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                    treeData={treeDataLocation}
                    placeholder="Select Location"
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
                          location: locationList?.data?.content?.map((loc) => loc.id),
                        });
                      }
                    }}
                  />
                </Form.Item>
              </Col>
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
                  label="Quantity"
                  name="quantity"
                  rules={[{ required: true, message: 'Please enter quantity!' }]}
                >
                  <Input type="number" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="Description"
                  name="description"
                  rules={[{ required: false, message: 'Please enter description!' }]}
                >
                  <Input.TextArea rows={4} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </Box>
    </>
  )
}