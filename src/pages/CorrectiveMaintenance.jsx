import { useState, useMemo, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, Skeleton, Tooltip, useTheme, alpha, Chip, Grid } from '@mui/material'
import { Table, Form, Select, DatePicker, Space, Button as AntButton, Empty, Input, Tag, Descriptions, Row, Col, Tabs, Modal, Upload, Button, message } from 'antd'
import { FileExcelOutlined, FilePdfOutlined, UploadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { FaClipboardList, FaExternalLinkAlt, FaCheckSquare, FaCheckCircle, FaTasks, FaClock } from 'react-icons/fa'
import CountUp from "react-countup"

import { getPageTitle, APP_CONFIG } from '../config/constants'
import { useGetEquipmentRunStatusReportQuery } from '../store/api/reports.api';
import { useGetLocationList } from '../hooks/useGetLocationList';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
const { RangePicker } = DatePicker
import { SearchOutlined } from '@ant-design/icons';
import { correctiveApi } from '../store/api/correctivemaintenance.api';
import { color } from 'framer-motion'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { domainName } from '../config/apiConfig'



export default function CorrectiveMaintenance() {
  const clientId = localStorage.getItem('clientId');
  const [open, setopen] = useState(false)
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(true)
  const [shouldFetch, setShouldFetch] = useState(false)
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filters, setFilters] = useState({})
  const [isViewMode, setIsViewMode] = useState(false)
  // filter form
  const [filterForm] = Form.useForm();

  // modal form
  const [modalForm] = Form.useForm();
  const { locations, loading: locationsLoading } = useGetLocationList();

  const { data: response, isLoading, isFetching } =
    correctiveApi.useGetcorrectivemaintenanceCountListQuery(
      {
        fromdate: filters.startdate,
        todate: filters.enddate,
        locationId: filters.locationIds,
      },
      {
        skip: !filters.startdate || !shouldFetch || !filters.enddate,
      }
    )

  const queryLoading = isLoading || isFetching

  const statusMap = {
    '1': 640, // Open
    '2': 804, // WorkDone
    '3': 631, // Completed
    '4': 15, // Verified
    '5': 808  // Overdue
  };

  useEffect(() => {
    console.log(locations)
    filterForm.setFieldsValue({
      location: -1,
    })
    if (locations?.length) {
      setFilters({
        startdate: dayjs().startOf('month').format('YYYY-MM-DD'),
        enddate: dayjs().endOf('month').format('YYYY-MM-DD'),
        // location: locations.map(x => x.id).join(',')
        location: "-1",
        locationIds: locations.map(x => x.id).join(',') // ✅ ADD THIS

      });
    }
  }, [locations])

  const { data: cmresponse, isLoading: cmqueryLoading, isFetching: cmisFetching } =
    correctiveApi.useGetcorrectivemaintenanceQuery(
      {
        fromdate: filters.startdate,
        todate: filters.enddate,
        locationId: filters.location,
        clientId: clientId,
        statusId: statusMap[activeTab],
      },
      {
        skip: !filters.startdate || !filters.enddate || !filters.location,
      }
    );


  // send a client id while click add button 
  // const [getMaxSequence, { isLoading }] =
  //   correctiveApi.useLazyGetmaximumsequenceQuery();


  const [sequenceNumber, setSequenceNumber] = useState(null);
  const [getMaxSequence] = correctiveApi.useLazyGetmaximumsequenceQuery()

  // UPDATE TICKET FUNCTION
  const updateTicketNumber = (locationId, seqNum) => {
    if (!locationId || !seqNum) return

    const selectedLoc = locations?.find(loc => loc.id === locationId)

    if (selectedLoc) {
      const ticketNo = `${selectedLoc.code}/VAC/TVS/${seqNum}`
      modalForm.setFieldsValue({ ticketno: ticketNo })
    }
  }

  //add 
  const [addOrUpdateBreakdown, { isLoading: saveLoading }] = correctiveApi.useAddOrUpdateBreakdownMutation();
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [retryValues, setRetryValues] = useState(null)


  const addticket = async (values, isRetry = false) => {
    console.log("FORM VALUES:", values)

    try {
      const formData = new FormData()

      if (isEditing && editingRecord?.id) {
        formData.append("id", editingRecord.id)
      }


      formData.append("domainName", domainName)
      formData.append("clientId", clientId)
      formData.append("locationId", values.station || "")
      formData.append("faultCategoryId", values.faultCategory || "")
      formData.append("categoryId", values.equipment || "")
      formData.append("faultSubCategoryId", values.faultsubcategory || "")
      formData.append("priorityId", values.priority || "")
      formData.append("technician", values.user || "")
      formData.append("sequelNumber", sequenceNumber || 0)
      formData.append("cmKey", values.ticketno || "")
      formData.append("assetId", values.itemcode || "")
      formData.append("systemName", values.system || "")
      formData.append("recordedBy", values.faultrecord || "")
      formData.append("description", values.description || "")
      formData.append("assignedTo", values.user || "")
      formData.append("type", "Task")
      formData.append("isWorking", values.workingstatus)
      formData.append("rectificationDetails", values.rectification || "")
      formData.append("reasonForBreakdown", values.breakdownreason || "")
      formData.append("confirmed", isRetry)
      formData.append("statusId", 640)

      formData.append("issueStartTime", dayjs().format("YYYY-MM-DD HH:mm:ss"))
      formData.append("issueEndTime", dayjs().add(3, "day").format("YYYY-MM-DD HH:mm:ss"))

      // Files
      if (values.images?.length) {
        values.images.forEach((file, index) => {
          formData.append(`files[${index}]`, file.originFileObj)
        })
      }

      const res = await addOrUpdateBreakdown(formData).unwrap()

      if (
        res?.message === "CM already exists for this Asset, Location and Date" &&
        !isRetry
      ) {
        setRetryValues(values)
        setConfirmOpen(true)
        return
      }

      message.success("Saved successfully ✅")
      setopen(false)
      modalForm.resetFields()

    } catch (error) {
      console.error(error)

      const errorMessage =
        error?.data?.message || error?.message || ""

      if (
        errorMessage === "CM already exists for this Asset, Location and Date" &&
        !isRetry
      ) {
        setRetryValues(values)
        setConfirmOpen(true)
        return
      }

      message.error("Save failed ❌")
    }
  }

  //add open model
  const handleadd = async () => {
    try {
      const res = await getMaxSequence({ clientId }).unwrap()

      if (res?.success) {
        const nextNumber = (res.data || 0) + 1

        setSequenceNumber(nextNumber)
        setopen(true)

        const currentStation = modalForm.getFieldValue("station")
        if (currentStation) {
          updateTicketNumber(currentStation, nextNumber)
        }
      }
    } catch (error) {
      console.error(error)
    }
  }

  //system change
  const [selectedSystem, setSelectedSystem] = useState(null);
  const { data: categoryList, isLoading: categoryLoading } =
    correctiveApi.useGetcategoryQuery(
      { clientId, system: selectedSystem },
      { skip: !selectedSystem }
    );
  const category = categoryList?.data || [];

  //equipment change 
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const { data: assetResponse, isLoading: assetLoading } =
    correctiveApi.useGetLocationwisedataQuery(
      {
        categoryId: selectedCategory,
        locationId: selectedLocation
      },
      {
        skip: !selectedCategory || !selectedLocation
      }
    );

  const assetList = assetResponse?.data || [];

  const { data: userResponse, isLoading: userLoading } =
    correctiveApi.useGetlistbyUserQuery(
      { LocationId: selectedLocation },
      { skip: !selectedLocation }
    );

  const userList = userResponse?.data || [];

  const { data: faultResponse, isLoading: faultLoading } =
    correctiveApi.useGetbyFaultidQuery(
      { faultCategoryId: selectedEquipment },
      { skip: !selectedEquipment }
    );

  const faultList = faultResponse?.data || [];

  const { data: faultCategoryResponse, isLoading: faultCategoryLoading } =
    correctiveApi.useGetallfaultcategoryListQuery({
      domainName,
      clientId,
      pn: 1,
      ps: 1000
    });
  const faultCategoryList = faultCategoryResponse?.data?.content || [];

  //get piriority
  const { data: priorityResponse, isLoading: priorityLoading } =
    correctiveApi.useGetallpriorityQuery({
      domainName,
      clientId,
    });
  const priorityList = priorityResponse?.data?.content || [];


  //subfault category
  const [selectedFaultCategory, setSelectedFaultCategory] = useState(null);
  const { data: faultSubResponse, isLoading: faultSubLoading } =
    correctiveApi.useByfaultcategoryListQuery(
      { faultCategoryId: selectedFaultCategory },
      { skip: !selectedFaultCategory }
    );

  const faultSubList = faultSubResponse?.data || [];


  const handleFilterChange = (values) => {
    const newFilters = {};
    setShouldFetch(true);

    if (values.dateRange && values.dateRange.length === 2) {
      newFilters.startdate = values.dateRange[0].format('YYYY-MM-DD');
      newFilters.enddate = values.dateRange[1].format('YYYY-MM-DD');
    }

    if (values.location === -1) {
      newFilters.location = "-1"; // for table API
      newFilters.locationIds = locations.map(x => x.id).join(','); // for count API
    } else {
      newFilters.location = values.location;
      newFilters.locationIds = values.location.toString();
    }

    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    filterForm.resetFields()
    setShouldFetch(false)
    setFilters({})
  }

  const locationOptions = [
    { id: -1, name: 'All Locations' },
    ...(Array.isArray(locations) && locations.length > 0 ? locations.map(loc => ({
      id: loc?.id,
      name: loc?.name || 'Unknown'
    })) : [])
  ]
  const reports = useMemo(() => {
    if (queryLoading) return []
    if (!response?.data) return []

    const countlist = response.data;
    const tableDataArr = countlist.map((item) => {
      const location = locations.find(loc => loc?.name?.trim() == item?.locationName?.trim());
      console.log(location)
      return {
        ...item,
        locationcode: location ? location.code : null
      };
    });

    return tableDataArr;
  }, [response, queryLoading]);

  const totalOpen = reports.reduce((sum, item) => sum + (item.openCount || 0), 0)

  const totalCompleted = reports.reduce(
    (sum, item) => sum + (item.completedCount || 0),
    0
  )

  const totalWorkDone = reports.reduce(
    (sum, item) => sum + (item.workDoneCount || 0),
    0
  )

  const totalVerified = reports.reduce(
    (sum, item) => sum + (item.verifiedCount || 0),
    0
  )

  const totalOverdue = reports.reduce(
    (sum, item) => sum + (item.overdueCount || 0),
    0
  )

  const totalTasks = totalOpen + totalCompleted + totalWorkDone + totalVerified + totalOverdue

  const boxes = [
    {
      key: 'total',
      label: 'Total Tasks',
      value: totalTasks,
      color: '#1677ff',
      icon: <FaClipboardList size={32} color="#1677ff" />,
    },
    {
      key: 'open',
      label: 'Open',
      value: totalOpen,
      color: '#21d9e2',
      icon: <FaExternalLinkAlt size={32} color="#fa8c16" />,
    },
    {
      key: 'workdone',
      label: 'Work Done',
      value: totalWorkDone,
      color: '#e998d7',
      icon: <FaExternalLinkAlt size={32} color="#fa8c16" />,
    },
    {
      key: 'completed',
      label: 'Completed',
      value: totalCompleted,
      color: '#7cf441',
      icon: <FaCheckSquare size={32} color="#52c41a" />,
    },
    {
      key: 'verified',
      label: 'Verified',
      value: totalVerified,
      color: '#1d711a',
      icon: <FaCheckCircle size={32} color="#13c2c2" />,
    },
    {
      key: 'overdue',
      label: 'OverDue',
      value: totalOverdue,
      color: '#f15030',
      icon: <FaCheckCircle size={32} color="#13c2c2" />,
    },
  ]
  const Cmreports = useMemo(() => {
    if (cmqueryLoading) return []
    if (!cmresponse?.data?.content) return []
    console.log(cmresponse)
    var tableDataArr = [];
    tableDataArr = cmresponse?.data?.content?.map((result) => {
      return {
        'id': result.id, 'name': result?.name, 'location': result.location.name, 'assets': result.assets?.name, 'cmKey': result?.cmKey,
        'category': result.category != null ? result.category.name : null, 'status': result.status.name, 'technician': result.technician, 'priority': result.priority != null ? result.priority.name : null,
        'faultCategory': result.faultCategory?.name, 'faultSubCategory': result.faultSubCategory?.name, 'time': '23-05-2023 11:31',
        'allData': result, 'startTime': result.issueStartTime, 'endTime': result.issueEndTime, 'assignedTo': result.assignedTo != null ? result.assignedTo.firstName + " " + result.assignedTo.lastName : null, 'assignedId': result.assignedTo?.id

      }
    });
    console.log(tableDataArr)

    return tableDataArr;

  }, [cmresponse, cmqueryLoading]);
  // console.log(Cmreports)
  const handleclicknavigate = (payload, statusType) => {
    navigate('/reports/tasks/ScheduledDetails/Cmreports', {
      state: {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        locationId: payload?.locationId || filters.locationId,
        locationName: payload?.location || null,
        statusType,
      }
    })
  }

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => setSelectedRowKeys(newSelectedRowKeys),
  };
  const isActionEnabled = selectedRowKeys.length > 0;


  //edit 
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const handleEditClick = () => {
    if (selectedRowKeys.length === 1) {
      const record = Cmreports.find(r => r.id === selectedRowKeys[0]);
      if (!record) return;
      console.log("Edit ticket", record)
      const data = record.allData;

      setEditingRecord(record);
      setIsEditing(true);
      setopen(true);
      setSelectedLocation(data?.location?.id);
      setSelectedSystem(data?.systemName);
      setSelectedCategory(data?.category?.id);
      setSelectedEquipment(data?.category?.id);
      setSelectedFaultCategory(data?.faultCategory?.id);

      modalForm.setFieldsValue({
        ticketno: record.cmKey,
        station: data?.location?.id,
        system: data?.systemName,
        workingstatus: data?.isWorking ? "Y" : "N",
        equipment: data?.category?.id,
        itemcode: data?.assets?.id,
        faultCategory: data?.faultCategory?.id,
        faultsubcategory: data?.faultSubCategory?.id,
        user: record.assignedId,
        priority: data?.priority?.id,
        description: data?.description || '',
        faultrecord: data?.recordedBy || '',
        rectification: data?.rectificationDetails || '',
        breakdownreason: data?.reasonForBreakdown || ''
      })
    } else {
      message.warning("Please select only one row to edit");
    }
  };


  //delete
  const [deleteBreakdown, { isLoading: deleteLoading }] = correctiveApi.useDeleteBreakdownMutation()
  const handleDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select at least one row")
      return
    }

    try {
      await deleteBreakdown(selectedRowKeys).unwrap()

      message.success("Deleted successfully ✅")
      setSelectedRowKeys([])

    } catch (error) {
      console.error(error)
      message.error("Delete failed ❌")
    }
  }

  const showDeleteConfirm = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select at least one row")
      return
    }

    Modal.confirm({
      title: "Are you sure?",
      content: `Do you want to delete ${selectedRowKeys.length} record(s)?`,
      okText: "Yes",
      cancelText: "No",
      centered: true,
      okButtonProps: {
        danger: true,
        loading: deleteLoading
      },
      onOk: handleDelete
    })
  }

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 70,
      render: (_, __, index) => index + 1
    },
    {
      title: 'Fault Id',
      dataIndex: 'cmKey',
      key: 'cmKey',
      width: 220
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 180

    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 140
      // width: 120,
      // render: (priority) => (
      //   <Chip
      //     label={priority}
      //     size="small"
      //     sx={{ bgcolor: getPriorityColor(priority), color: 'white', fontWeight: 'bold' }}
      //   />
      // )
    },
    {
      title: 'Date',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 120,
      render: (date) => dayjs(date).format('DD-MM-YYYY HH:mm')
    },

    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 150
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 150
    },

    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const styles = {
          OPEN: {
            color: '#1677ff',
            border: '1px solid #1677ff',
            backgroundColor: '#e6f4ff',
          },
          WORKDONE: {
            color: '#722ed1',
            border: '1px solid #722ed1',
            backgroundColor: '#f9f0ff',
          },
          COMPLETED: {
            color: '#52c41a',
            border: '1px solid #52c41a',
            backgroundColor: '#f6ffed',
          },
          VERIFIED: {
            color: '#13c2c2',
            border: '1px solid #13c2c2',
            backgroundColor: '#e6fffb',
          },
          OVERDUE: {
            color: '#ff4d4f',
            border: '1px solid #ff4d4f',
            backgroundColor: '#fff2f0',

          }
        }

        const key = status?.toUpperCase()?.replace(/\s/g, '')

        return (
          <Tag style={styles[key] || {}}>
            {status}
          </Tag>
        )
      }
    },
  ]

  const items = [
    { key: '1', label: 'Open' },
    { key: '2', label: 'WorkDone' },
    { key: '3', label: 'Completed' },
    { key: '4', label: 'Verified' },
    { key: '5', label: 'Overdue' }
  ].map(tab => ({
    ...tab,
    children: (
      <>
        {tab.key === '1' && (
          <div style={{ marginBottom: 12 }}>
            <Space>
              <AntButton type="primary" icon={<PlusOutlined />} onClick={handleadd}>
                Add
              </AntButton>
              <AntButton icon={<EditOutlined />} disabled={!isActionEnabled}
                onClick={handleEditClick}
              >
                Edit
              </AntButton>
              <AntButton
                danger
                icon={<DeleteOutlined />}
                disabled={!isActionEnabled}
                onClick={showDeleteConfirm}
              >
                Delete
              </AntButton>
            </Space>
          </div>
        )}

        {cmqueryLoading || cmisFetching ? (
          <Box sx={{ width: '100%', mt: 1 }}>
            <Skeleton variant="rounded" width="100%" height={40} sx={{ mb: 1.5 }} />
            <Skeleton variant="rounded" width="100%" height={360} />
          </Box>
        ) : (
          <Table
            rowKey="id"
            dataSource={Cmreports}
            columns={columns}
            rowSelection={rowSelection}
            bordered
            scroll={{ x: 'max-content', y: 400 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              responsive: true,
            }}
            onRow={(record) => ({
              onClick: () => {
                setIsViewMode(true)
                setIsEditing(false)
                setopen(true)

                modalForm.setFieldsValue({
                  ticketno: record.cmKey,
                  station: record.location,
                  system: record.allData?.systemName,
                  equipment: record.category,
                  itemcode: record.assets,
                  faultCategory: record.faultCategory,
                  faultsubcategory: record.faultSubCategory,
                  user: record.assignedId,
                  priority: record.priority,
                  description: record.allData?.description || '',
                  faultrecord: record.allData?.recordedBy || '',
                  rectification: record.allData?.rectificationDetails || '',
                  breakdownreason: record.allData?.reasonForBreakdown || ''
                })
              }
            })}
          />
        )}
      </>
    )
  }))
  return (
    <>
      <Helmet>
        <title>{getPageTitle('corrective-maintenance')}</title>
      </Helmet>

      <Box>
        {/* <Typography variant="h4" gutterBottom fontWeight="bold">
          Corrective Maintenance
        </Typography> */}


        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Form
              form={filterForm}
              layout="inline"
              onFinish={handleFilterChange}
              style={{ marginBottom: 16 }}
              initialValues={{
                dateRange: [dayjs().startOf('month'), dayjs().endOf('month')]
              }}
            >
              <Form.Item name="dateRange" label="Date Range">
                <RangePicker />
              </Form.Item>

              <Form.Item name="location" label="Location">
                <Select style={{ width: '250px' }} loading={locationsLoading} showSearch optionFilterProp="children">
                  {locationOptions.map(location => (
                    <Select.Option key={location.id} value={location.id}>
                      {location.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Space>
                  <AntButton type="primary" htmlType="submit" loading={queryLoading}>
                    Search
                  </AntButton>
                  <AntButton onClick={handleResetFilters}>
                    Reset
                  </AntButton>
                </Space>
              </Form.Item>
            </Form>
          </CardContent>
        </Card>

        <Card style={{ marginTop: '20px' }}>
          <CardContent>
            {!shouldFetch ? (
              <Empty description="Please apply filters to view the report" />
            ) : queryLoading ? (
              <Box sx={{ width: '100%' }}>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Grid item xs={12} sm={6} md={2} key={i}>
                      <Skeleton variant="rounded" height={112} sx={{ borderRadius: 3 }} />
                    </Grid>
                  ))}
                </Grid>
                <Skeleton variant="rounded" width={320} height={40} sx={{ mb: 2, maxWidth: '100%' }} />
                <Skeleton variant="rounded" width="100%" height={400} />
              </Box>
            ) : (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {boxes.map((box) => (
                    <Grid item xs={12} sm={6} md={2} key={box.key}>
                      <Card
                        sx={{
                          height: '100%',
                          borderRadius: 3,
                          border: `1px solid ${box.color}`,
                          backgroundColor: `${box.color}0f`,
                          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.18)',
                          },
                        }}
                      >
                        <CardContent
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <Box
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: '50%',
                              backgroundColor: `${box.color}1a`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {box.icon}
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography
                              variant="subtitle2"
                              sx={{ textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}
                            >
                              {box.label}
                            </Typography>
                            <Typography
                              variant="h5"
                              fontWeight="bold"
                              sx={{ color: box.color, mt: 0.5 }}
                            >
                              {box.value}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                <Tabs items={items} onChange={(key) => setActiveTab(key)} />
              </>

            )}
          </CardContent>
        </Card>
      </Box>
      <Modal
        title={isViewMode ? "View Details" : isEditing ? "Edit Task" : "Add Details"}
        open={open}
        centered
        width={800}
        onCancel={() => {
          setopen(false)
          setIsEditing(false)
          setIsViewMode(false)
          setEditingRecord(null)
          modalForm.resetFields()
        }}
        onOk={() => {
          if (!isViewMode) {
            modalForm.submit()
          } else {
            setopen(false)
          }
        }}
        okText={isViewMode ? "Close" : isEditing ? "Update" : "Add"}
      >
        <Form layout="vertical" form={modalForm} onFinish={addticket} >
          <Row gutter={[16, 16]}>

            {/* Ticket Info */}
            <Col span={12}>
              <Form.Item
                label="Ticket No"
                name="ticketno"
              >
                <Input disabled />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Station"
                name="station"
                rules={[{ required: true, message: "Please select Station" }]}
              >
                <Select
                  placeholder="Select Station"
                  loading={locationsLoading}
                  showSearch
                  optionFilterProp="children"
                  onChange={(value) => {
                    setSelectedLocation(value)
                    modalForm.setFieldsValue({ asset: undefined })
                    if (sequenceNumber) {
                      updateTicketNumber(value, sequenceNumber)
                    }
                  }}
                  disabled={isViewMode}
                >
                  {locations?.map((loc) => (
                    <Select.Option key={loc.id} value={loc.id}>
                      {loc.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Working Status"
                name="workingstatus"
                rules={[{ required: true, message: "Please select Status" }]}
              >
                <Select
                  placeholder="Select Status"
                  showSearch
                  disabled={isViewMode}
                >
                  <Select.Option value={"Y"}>
                    Operational
                  </Select.Option>
                  <Select.Option value={"N"}>
                    Non-Operational
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="System"
                name="system"
                rules={[{ required: true, message: "Please select System" }]}
              >
                <Select
                  placeholder="Select System"
                  optionLabelProp="label"
                  onChange={(value) => {
                    setSelectedSystem(value);
                    modalForm.setFieldsValue({ category: undefined });
                  }}
                  disabled={isViewMode}
                >
                  <Select.Option value="ECS" label="ECS">
                    <Tag color="blue">ECS</Tag> Environmental Control System
                  </Select.Option>

                  <Select.Option value="TVS" label="TVS">
                    <Tag color="green">TVS</Tag> Tunnel Ventilation System
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Equipment"
                name="equipment"
                rules={[{ required: true, message: "Please select equipment" }]}
              >
                <Select
                  placeholder="Select Equipment"
                  showSearch
                  loading={categoryLoading}
                  onChange={(value) => {
                    setSelectedCategory(value);
                    setSelectedEquipment(value);
                    modalForm.setFieldsValue({ asset: undefined, faultcategory: undefined });
                  }}
                  disabled={isViewMode}
                >
                  {category?.map((item) => (
                    <Select.Option key={item.id} value={item.id}>
                      {item.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Assets"
                name="itemcode"
                rules={[{ required: true, message: "Please select Item Code" }]}
              >
                <Select
                  placeholder="Select Asset"
                  loading={assetLoading}
                  showSearch
                  optionFilterProp="children"
                  disabled={isViewMode}
                >
                  {assetList.map((item) => (
                    <Select.Option key={item.assetId} value={item.assetId}>
                      {item.assetName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Fault Details */}
            <Col span={12}>
              <Form.Item
                label="Fault Category"
                name="faultCategory"
                rules={[{ required: true, message: "Please select fault category" }]}
              >
                <Select
                  placeholder="Select Fault Category"
                  loading={faultCategoryLoading}
                  showSearch
                  optionFilterProp="children"
                  onChange={(value) => {
                    setSelectedFaultCategory(value);
                    modalForm.setFieldsValue({ faultsubcategory: undefined });
                  }}
                  disabled={isViewMode}
                >
                  {faultCategoryList.map((item) => (
                    <Select.Option key={item.id} value={item.id}>
                      {item.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Fault Subcategory"
                name="faultsubcategory"
                rules={[{ required: true, message: "Please select subcategory" }]}
              >
                <Select
                  placeholder="Select Fault Subcategory"
                  loading={faultSubLoading}
                  showSearch
                  optionFilterProp="children"
                  disabled={isViewMode}
                >
                  {faultSubList.map((item) => (
                    <Select.Option
                      key={item.faultSubCategoryId}
                      value={item.faultSubCategoryId}
                    >
                      {item.faultSubCategoryName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Assignment */}
            <Col span={12}>
              <Form.Item
                label="Assign to User"
                name="user"
              >
                <Select
                  placeholder="Select User"
                  loading={userLoading}
                  showSearch
                  optionFilterProp="children"
                  disabled={isViewMode}
                >
                  {userList.map((user) => (
                    <Select.Option key={user.userId} value={user.userId}>
                      {user.firstName} - ({user.lastName})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Priority"
                name="priority"
                rules={[{ required: true, message: "Please select priority" }]}
              >
                <Select
                  placeholder="Select Priority"
                  loading={priorityLoading}
                  showSearch
                  optionFilterProp="children"
                  disabled={isViewMode}
                >
                  {Array.isArray(priorityList) && priorityList.map((item) => (
                    <Select.Option key={item.id} value={item.id}>
                      {item.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Corrective/Preventive Action Taken"
                name="faultrecord"
              >
                <Input.TextArea rows={3} placeholder="Enter Action Taken Name " disabled={isViewMode} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Brief Details About Fault"
                name="description"
              >
                <Input.TextArea rows={3} placeholder="Enter description" disabled={isViewMode} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Rectification Details"
                name="rectification"
              >
                <Input.TextArea rows={3} placeholder="Enter Rectification Details" disabled={isViewMode} />
              </Form.Item>
            </Col>


            <Col span={12}>
              <Form.Item
                label="Reason For Breakdown"
                name="breakdownreason"
              >
                <Input.TextArea rows={3} placeholder="Enter Brakdown Reason" disabled={isViewMode} />
              </Form.Item>
            </Col>

            {/* <Col span={12}>
              <Form.Item
                label="Corrective/Preventive Action Taken"
                name="cpactivetaken"
                rules={[{ required: true, message: "Please Enter Corrective/Preventive Action Taken" }]}
              >
                <Input.TextArea rows={3} placeholder="Enter Corrective/Preventive Action Taken" />
              </Form.Item>
            </Col> */}

            <Col span={24}>
              <Form.Item
                label="Upload Image"
                name="images"
                valuePropName="fileList"
                getValueFromEvent={(e) => e?.fileList || []}
                rules={[
                  {
                    validator: (_, fileList) => {
                      if (fileList && fileList.length > 5) {
                        return Promise.reject("Only 5 images allowed");
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Upload
                  listType="picture"
                  beforeUpload={() => false}
                  maxCount={5}
                  multiple
                  accept="image/*"
                  disabled={isViewMode}
                >
                  <Button icon={<UploadOutlined />}>Select Images</Button>
                </Upload>
              </Form.Item>
            </Col>

          </Row>
        </Form>
      </Modal>

      <Modal
        open={confirmOpen}
        centered
        width={750}
        closable={false}
        maskClosable={false}
        footer={null}
        bodyStyle={{ padding: "30px", borderRadius: "12px" }}
      >
        <div style={{ textAlign: "center" }}>

          <img
            src="https://cdn-icons-png.flaticon.com/512/595/595067.png"
            alt="warning"
            style={{ width: "90px", marginBottom: "20px" }}
          />

          <h2 style={{ marginBottom: "10px", fontWeight: "600", color: "#ff4d4f" }}>
            Allready this ticket created
          </h2>

          <p style={{ fontSize: "16px", color: "#555", lineHeight: "1.6" }}>
            CM already exists for this <b>Asset, Location and Date</b>.
            <br />
            Do you want to continue anyway?
          </p>

          <div
            style={{
              marginTop: "30px",
              display: "flex",
              justifyContent: "center",
              gap: "20px"
            }}
          >
            <Button
              type="primary"
              size="large"
              style={{
                padding: "0 30px",
                borderRadius: "8px"
              }}
              onClick={() => {
                setConfirmOpen(false)
                addticket(retryValues, true)
                setopen(false)
              }}
            >
              Yes, Continue
            </Button>

            <Button
              size="large"
              danger
              style={{
                padding: "0 30px",
                borderRadius: "8px"
              }}
              onClick={() => {
                setConfirmOpen(false)
                setopen(false)
                modalForm.resetFields();
              }
              }
            >
              Cancel
            </Button>
          </div>

        </div>
      </Modal>
    </>
  )
}

function SummaryBox({ label, value, color, icon, trend, trendValue = 0, isLoading = false, tooltip, onClick }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === "dark"
  const isPositive = trendValue >= 0

  return (
    <Tooltip title={tooltip || ""} arrow disableHoverListener={!tooltip}>
      <Box
        onClick={onClick}
        sx={{
          flex: { xs: "100%", sm: 1 },
          minWidth: { xs: "100%", sm: 180 },
          position: "relative",
          borderRadius: 4,
          p: 3,
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.35s cubic-bezier(.21,1.02,.73,1)",
          background: isDark
            ? `linear-gradient(135deg, ${alpha(color, 0.25)}, ${alpha(color, 0.15)})`
            : `linear-gradient(135deg, ${color}, ${alpha(color, 0.9)})`,
          color: "#fff",
          backdropFilter: "blur(10px)",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            padding: "1px",
            borderRadius: "inherit",
            background: `linear-gradient(135deg, ${color}, transparent)`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          },
          boxShadow: isDark ? "0 10px 25px rgba(0,0,0,0.5)" : "0 8px 20px rgba(0,0,0,0.08)",
          "&:hover": {
            transform: "translateY(-6px) scale(1.02)",
            boxShadow: isDark ? `0 20px 40px ${alpha(color, 0.4)}` : `0 20px 40px ${alpha(color, 0.25)}`,
          },
          "&:active": { transform: "scale(0.97)" },
        }}
      >
        {isLoading ? (
          <>
            <Skeleton variant="text" width="40%" height={20} sx={{ bgcolor: "rgba(255,255,255,0.3)" }} />
            <Skeleton variant="text" width="60%" height={40} sx={{ mt: 1, bgcolor: "rgba(255,255,255,0.3)" }} />
            <Skeleton variant="circular" width={55} height={55} sx={{ position: "absolute", right: 20, top: 30 }} />
          </>
        ) : (
          <>
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.85, letterSpacing: 1.2, fontWeight: 500 }}>{label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                <CountUp start={0} end={Number(value)} duration={1.5} separator="," />
              </Typography>
              {trend && <Typography variant="caption" sx={{ mt: 1, display: "block", color: isPositive ? "#C8FACC" : "#FFD6D6" }}>{trend}</Typography>}
            </Box>
            <Box sx={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", right: 20, top: 25 }}>
              {icon}
            </Box>
          </>
        )}
      </Box>
    </Tooltip>
  )
}


