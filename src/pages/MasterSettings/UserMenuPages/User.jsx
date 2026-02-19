import { useState, useEffect, useMemo } from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { Table, Space, Button as AntButton, Tag, Input, Select, Modal, Form, Row, Col, Switch, TreeSelect, Popconfirm, message, Spin } from 'antd'
import { PlusOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons'
import { useGetAllRoleListQuery, useGetAllUserListQuery, useGetDepartmentListQuery, useGetSkillListQuery, useGetSkillLevelListQuery, useGetClientListQuery, useGetMobileAuthorizationListQuery, useAddUserMutation, useDeleteUserMutation } from '../../../store/api/masterSettings.api'
import { useAuth } from '../../../context/AuthContext'
import { skipToken } from '@reduxjs/toolkit/query'
import { useGetLocationList } from '../../../hooks/useGetLocationList'
import { useGetAllUserType } from '../../../hooks/useGetAllUserType'

const { SHOW_PARENT } = TreeSelect;

export default function User() {

  const columnOptions = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'userType', label: 'User Type' },
    { value: 'loginUser', label: 'Login User' },
    { value: 'role', label: 'Role' },
  ]

  const [form] = Form.useForm()
  const loginUser = Form.useWatch("loginUser", form);
  const { user } = useAuth()
  const clientId = user?.client?.id || user?.clientId

  const [current, setCurrent] = useState(1);
  const [pageSize, setPagesize] = useState(25);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState(['email', 'phone', 'userType', 'loginUser', 'role'])

  const { locations, loading: locationsLoading } = useGetLocationList()
  const { userTypes, loading: userTypesLoading } = useGetAllUserType()
  const { data: departmentList, isLoading: departmentLoading } = useGetDepartmentListQuery({ clientId, pageNumber: 1, pageSize: 100 })
  const { data: skillList, isLoading: skillLoading } = useGetSkillListQuery({ clientId, pageNumber: 1, pageSize: 100 })
  const { data: skillLevelList, isLoading: skillLevelLoading } = useGetSkillLevelListQuery({ clientId, pageNumber: 1, pageSize: 100 })
  const { data: clientList, isLoading: clientLoading } = useGetClientListQuery({ pageNumber: 1, pageSize: 100 })
  const { data: userRolesData, isLoading: userRolesLoading } = useGetAllRoleListQuery({ clientId, pageNumber: 1, pageSize: 1000 })
  const { data: mobileAuthorizationList, isLoading: mobileAuthorizationLoading } = useGetMobileAuthorizationListQuery(
    { clientId, userRoleId: selectedRoleId },
    { skip: !selectedRoleId } // only call when role selected
  );

  const [addUser] = useAddUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const userRoleOptions = [
    ...(Array.isArray(userRolesData?.data?.content) && userRolesData.data?.content.length > 0 ? userRolesData.data.content.map(ur => ({
      id: ur?.id,
      name: ur?.name || 'Unknown'
    })) : [])
  ]

  const roleIds = useMemo(() => {
    if (!Array.isArray(userRolesData?.data?.content)) return null;

    return userRolesData.data.content
      .map(role => role.id)
      .filter(Boolean)
      .join(',');
  }, [userRolesData]);

  const { data: userListData, isLoading: userListLoading, isFetching } = useGetAllUserListQuery(clientId && roleIds ? { clientId, pageNumber: 1, pageSize: 1000, userRoleId: roleIds } : skipToken)

  const treeDataLocation = [
    {
      title: "Select All Locations",
      value: "all",
      key: "all",
      children: locations.map((loc) => ({
        title: loc.name,
        value: loc.id,
        key: loc.id,
      })),
    },
  ];

  const treeDataClient = [
    {
      title: "Select All Clients",
      value: "all",
      key: "all",
      children: clientList?.data?.content?.map((loc) => ({
        title: loc.name,
        value: loc.id,
        key: loc.id,
      })),
    },
  ];

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      width: 80,
      render: (_, __, index) => ((current - 1) * pageSize) + index + 1
    },
    {
      title: 'Emp ID',
      dataIndex: 'empId',
      key: 'empId',
      width: 120,
      render: (_, record) => record?.userName || ''
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (_, record) => (
        <>
          {record?.firstName} {record?.lastName}
        </>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 250
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 200,
      render: (_, record) => record?.contact || ''
    },
    {
      title: 'User Type',
      dataIndex: 'userType',
      key: 'userType',
      width: 200,
      render: (_, record) => record?.userType?.name || ''
    },
    {
      title: 'Login User',
      dataIndex: 'loginUser',
      key: 'loginUser',
      width: 150,
      render: (_, record) => record?.isLoginUser === 'Y' ? 'Yes' : 'No'
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 200,
      render: (_, record) => record?.userRole?.name || ''
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 350,
      render: (_, record) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {Array.isArray(record?.userMappedLocations) &&
            record?.userMappedLocations.length > 0 ? (
            record.userMappedLocations.map(loc => (
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
    }
  ]

  const handleSelectColumns = (selected) => {
    setSelectedColumns(selected);
  }

  const visibleColumns = useMemo(() => {
    return columns.filter(col =>
      col.dataIndex === 'sno' ||
      col.dataIndex === 'empId' ||
      col.dataIndex === 'name' ||
      col.dataIndex === 'location' ||
      selectedColumns.includes(col.dataIndex)
    );
  }, [columns, selectedColumns]);

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

    const filtered = userListData?.data?.content?.filter((item) =>
      `${item.userName ?? ''} ${item.firstName ?? ''} ${item.lastName ?? ''}
    ${item.email ?? ''} ${item.contact ?? ''} ${item.userType.name ?? ''}
    ${item.isLoginUser ?? ''} ${item.userRole.name ?? ''} ${item.userMappedLocations.map(loc => loc.location?.name || '').join(' ') ?? ''}`
        .toLowerCase()
        .includes(searchValue)
    );

    setFilteredData(filtered);
  };

  const handleAdd = () => {
    setIsModalOpen(true)
  }

  const handleModalOk = async () => {
    const values = await form.validateFields();

    const payload = {
      ...(selectedRecord?.id && { id: selectedRecord.id }),

      clientId,
      userCode: values.userCode,
      userName: values.userName,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      contact: values.phone,
      password: values.password,

      userRoleId: values.role,
      userTypeId: values.userType,
      departmentId: values.department,
      skillId: values.skill,
      skillLevelId: values.skillLevel,

      isLoginUser: values.loginUser ? "Y" : "N",

      userLocationDtos: (values.location || []).map((locId) => ({
        ...(selectedRecord?.userMappedLocations?.find(
          (l) => l.location.id === locId
        )?.id && {
          id: selectedRecord.userMappedLocations.find(
            (l) => l.location.id === locId
          )?.id,
        }),
        locationId: locId,
      })),

      userClientMappingDtos: (values.client || []).map((clientId) => ({
        ...(selectedRecord?.userClientMappings?.find(
          (l) => l.clientIds === clientId
        )?.id && {
          id: selectedRecord.userClientMappings.find(
            (l) => l.clientIds === clientId
          )?.id,
        }),
        clientId: clientId,
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
  };

  const handleSubmit = async (payload) => {
    try {
      const response = await addUser(payload).unwrap();
      message.success(response?.message || "User saved successfully");
    } catch (error) {
      message.error(error?.data?.message || error?.data?.error || "Failed to add user");
    } finally {
      handleModalCancel()
    }
  };

  const handleDelete = async () => {
    try {
      const queryString = selectedRowKeys
        .map(id => `id=${id}`)
        .join('&');
      const response = await deleteUser(queryString).unwrap();
      message.success(response?.message || "User deleted successfully");
      setSelectedRowKeys([]);
    } catch (error) {
      message.error(error?.data?.message || error?.data?.error || "Failed to delete user");
    } finally {
      handleModalCancel()
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    }
  };

  const handleModalCancel = () => {
    form.resetFields();
    setSelectedRecord(null);
    setSelectedRoleId(null);
    setIsModalOpen(false);
  };

  const handleRoleChange = (roleId) => {
    console.log("role id:", roleId)
    setSelectedRoleId(roleId);
  }

  useEffect(() => {
    if (mobileAuthorizationList?.data) {
      const authObj = {};

      mobileAuthorizationList.data.forEach((item) => {
        // If editing → use backend value
        // If adding new → default false
        authObj[item.id] = selectedRecord
          ? item.isActive === "Y"
          : false;
      });

      form.setFieldsValue({
        authorization: authObj,
      });
    }
  }, [mobileAuthorizationList, selectedRecord]);

  const handleEdit = (record) => {
    console.log('onEdit:', record)
    setSelectedRecord(record);
    setSelectedRoleId(record?.userRole?.id); // important for mobile auth API
    setIsModalOpen(true);

    form.setFieldsValue({
      loginUser: record?.isLoginUser === 'Y',
      userCode: record?.userCode,
      email: record?.email,
      userName: record?.userName,
      firstName: record?.firstName,
      lastName: record?.lastName,
      phone: record?.contact,
      role: record?.userRole?.id,
      userType: record?.userType?.id,
      department: record?.department?.id,
      skill: record?.skill?.id,
      skillLevel: record?.skillLevel?.id,

      //Location mapping
      location: record?.userMappedLocations?.map(
        (loc) => loc?.location?.id
      ),

      //Client mapping (if backend has userMappedClients)
      client: record?.userClientMappings?.map(
        (c) => c?.clientIds
      ),
    });
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
                        title={`Are you sure you want to delete ${selectedRowKeys.length} selected user(s)?`}
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
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: 200 }}
                  placeholder="Please choose columns"
                  value={selectedColumns}
                  onChange={handleSelectColumns}
                  options={columnOptions}
                  maxTagCount={1}
                />
                <Input
                  placeholder="Search"
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={handleSearch}
                  allowClear
                  style={{ width: 250 }}
                />
                <AntButton type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                  Add User
                </AntButton>
              </Space>
            </Box>
            {userListLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <Spin />
              </Box>
            ) : (
              <Table
                dataSource={filteredData ?? userListData?.data?.content}
                columns={visibleColumns}
                rowSelection={{ type: 'checkbox', ...rowSelection }}
                loading={userListLoading || isFetching}
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
          title={selectedRecord ? "Edit User" : "Add User"}
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
            <Typography variant="medium" fontWeight="bold" color="#42a5f5" gutterBottom={true}>
              User Information
            </Typography>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Login User"
                  name="loginUser"
                  valuePropName="checked"
                  rules={[{ required: false, message: 'Please enable login user!' }]}
                >
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="User Code"
                  name="userCode"
                  rules={[{ required: true, message: 'Please enter user code!' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            {loginUser && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[{ required: true, message: 'Please enter email!' }]}
                  >
                    <Input type='email' />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="User Name"
                    name="userName"
                    rules={[{ required: true, message: 'Please enter user name!' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            )}
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="First Name"
                  name="firstName"
                  rules={[{ required: true, message: 'Please enter first name!' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Last Name"
                  name="lastName"
                  rules={[{ required: true, message: 'Please enter last name!' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Phone"
                  name="phone"
                  rules={[{ required: true, message: 'Please enter phone number!' }]}
                >
                  <Input type='number' />
                </Form.Item>
              </Col>
            </Row>
            <Typography variant="medium" fontWeight="bold" color="#42a5f5" gutterBottom={true}>
              User Mapping
            </Typography>
            <Row gutter={16}>
              <Col span={16}>
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
                          location: locations.map((loc) => loc.id),
                        });
                      }
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="role"
                  label="Role"
                  rules={[{ required: true, message: 'Please select role!' }]}
                >
                  <Select
                    onChange={(value) => handleRoleChange(value)}
                    placeholder="Select Role"
                  >
                    {userRoleOptions.map(l => (
                      <Select.Option key={l.id} value={l.id}>
                        {l.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="userType"
                  label="User Type"
                  rules={[{ required: true, message: 'Please select user type!' }]}
                >
                  <Select placeholder="Select User Type">
                    {userTypes.map(l => (
                      <Select.Option key={l.id} value={l.id}>
                        {l.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="department"
                  label="Department"
                  rules={[{ required: false, message: 'Please select department!' }]}
                >
                  <Select placeholder="Select Department" allowClear>
                    {departmentList?.data?.content?.map(l => (
                      <Select.Option key={l.id} value={l.id}>
                        {l.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="skill"
                  label="Skill"
                  rules={[{ required: false, message: 'Please select skill!' }]}
                >
                  <Select placeholder="Select Skill" allowClear>
                    {skillList?.data?.content?.map(l => (
                      <Select.Option key={l.id} value={l.id}>
                        {l.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="skillLevel"
                  label="Skill Level"
                  rules={[{ required: false, message: 'Please select skill level!' }]}
                >
                  <Select placeholder="Select Skill Level" allowClear>
                    {skillLevelList?.data?.content?.map(l => (
                      <Select.Option key={l.id} value={l.id}>
                        {l.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item
                  label="Clients"
                  name="client"
                  rules={[{ required: true, message: 'Please select clients!' }]}
                >
                  <TreeSelect
                    style={{ width: "100%" }}
                    dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                    treeData={treeDataClient}
                    placeholder="Select Clients"
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
                          client: clientList?.data?.content?.map((c) => c.id),
                        });
                      }
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
            {loginUser && (
              <>
                <Typography variant="medium" fontWeight="bold" color="#42a5f5" gutterBottom={true}>
                  Credential
                </Typography>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Password"
                      name="password"
                      rules={[{ required: false, message: 'Please enter password!' }]}
                    >
                      <Input type="password" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Confirm Password"
                      name="confirmPassword"
                      dependencies={['password']}
                      rules={[
                        { required: false, message: 'Please confirm password!' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Passwords do not match!'));
                          },
                        }),
                      ]}
                    >
                      <Input type="password" />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
            {selectedRoleId && mobileAuthorizationList?.data?.length > 0 && (
              <>
                <Typography
                  variant="medium"
                  fontWeight="bold"
                  color="#42a5f5"
                  gutterBottom
                >
                  Authorization for Mobile
                </Typography>

                <Form.Item shouldUpdate noStyle>
                  {() => (
                    <Row gutter={16}>
                      <Col span={24}>
                        {mobileAuthorizationList?.data?.map((item) => (
                          <Row
                            key={item.id}
                            justify="space-between"
                            align="middle"
                            style={{
                              padding: "10px 12px",
                              borderBottom: "1px solid #f0f0f0",
                            }}
                          >
                            <Col>
                              <Typography>{item.name}</Typography>
                            </Col>

                            <Col>
                              <Form.Item
                                name={["authorization", String(item.id)]}
                                valuePropName="checked"
                                noStyle
                              >
                                <Switch />
                              </Form.Item>
                            </Col>
                          </Row>
                        ))}
                      </Col>
                    </Row>
                  )}
                </Form.Item>
              </>
            )}
          </Form>

        </Modal>
      </Box>
    </>
  )
}