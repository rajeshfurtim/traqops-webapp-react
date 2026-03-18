import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Card, CardContent } from '@mui/material'
import { Form, Select, Space, Button as AntButton, Row, Col, DatePicker, Table, Spin, Tooltip } from 'antd'
import { FilePdfOutlined, StepBackwardOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../../../config/constants'
import { useGetallpmtasklistQuery, useGetPmCheckListQuery, useGetElementsByCheckListIdQuery } from '../../../../store/api/taskReport.api'
import { useAuth } from '../../../../context/AuthContext'
import { useReactToPrint } from "react-to-print"
import { useNavigate, useLocation } from 'react-router-dom'
import dayjs from 'dayjs'

export default function TaskCheckList() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const printRef = useRef(null)
    const navigate = useNavigate()
    const location = useLocation()

    const navstate = location.state || {}
    const pmtaskId = navstate?.pmTaskId
    const checkListId = navstate?.checkListId

    const [filters, setFilters] = useState({})
    const [selectedLocationId, setSelectedLocationId] = useState(null)

    const { data: allPmTaskList, isLoading: allPmTaskLoading } = useGetallpmtasklistQuery({ id: pmtaskId }, { skip: !pmtaskId })
    const { data: pmCheckList, isLoading: pmCheckListLoading } = useGetPmCheckListQuery({ pmTaskId: pmtaskId }, { skip: !pmtaskId })
    const { data: checklistData, isLoading: checklistLoading, isFetching } =
        useGetElementsByCheckListIdQuery(
            {
                checkListId: checkListId
            },
            {
                skip: !checkListId
            }
        )

    // Checklist Logic
    const handlePrint = useReactToPrint({
        contentRef: printRef
    });

    return (
        <>
            <Helmet>
                <title>{getPageTitle('/reports/tasks/ScheduledDetails/task-checklist')}</title>
                <meta name="description" content={`${APP_CONFIG.name} - Task CheckList`} />
            </Helmet>
            <Box>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Space>
                                <Tooltip title="Export PDF">
                                    <AntButton
                                        type="primary"
                                        icon={<FilePdfOutlined />}
                                        onClick={handlePrint}
                                        disabled={checklistData?.data?.data?.length === 0}
                                        style={{ backgroundColor: 'rgb(240, 42, 45)', color: '#fff' }}
                                    >
                                    </AntButton>
                                </Tooltip>
                                <Tooltip title="Back">
                                    <AntButton
                                        type="primary"
                                        icon={<StepBackwardOutlined />}
                                        onClick={() => navigate(-1)}
                                        style={{ backgroundColor: 'rgb(99, 156, 210)', color: '#fff' }}
                                    >
                                    </AntButton>
                                </Tooltip>
                            </Space>
                        </Box>
                        {(checklistLoading || isFetching) ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <Spin />
                            </Box>
                        ) : (
                            <>
                                {checklistData?.data && (
                                    <>
                                        <div ref={printRef}>

                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </>
    )
}