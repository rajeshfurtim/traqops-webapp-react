import { useState, useEffect, Children } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { Table, Form, Button as AntButton, Empty, Spin, Tag } from 'antd'
import { getPageTitle, APP_CONFIG } from '../../../../config/constants'
import { useGetallpmtasklistQuery } from '../../../../store/api/taskReport.api'
import { useLocation } from "react-router-dom"


export default function TaskReportDetails() {
    const [form] = Form.useForm()
    const [filters, setFilters] = useState({})
    const [shouldFetch, setShouldFetch] = useState(false)
    const location = useLocation()
    const navstate = location.state || {}

    useEffect(() => {
        if (navstate?.pmTaskId) {
            setFilters({
                pmTaskId: navstate.pmTaskId
            })
            setShouldFetch(true)
        }
    }, [navstate])

    useEffect(() => {
        console.log("Received pmTaskId:", navstate.pmTaskId)
    }, [navstate])

    const id = location.state?.pmTaskId

    const { data: reportData, isLoading: queryLoading } = useGetallpmtasklistQuery(
        { id },
        { skip: !id }
    )

    const reports = (reportData?.data || []).map((item, index) => {
        const asset = item.pmAssets?.[0]?.assets || {}
        const status = item.pmAssets?.[0]?.status || {}
        return {
            index,
            sno: index + 1,
            raw: item,
            assetname: asset.name || "-",
            assetcode: asset.itemCode || "-",
            assetstatus: status.name || "-",
            view: 'Asset Details'
        }
    })

    const stringSorter = (key) => (a, b) =>
        (a[key] || "").localeCompare(b[key] || "");


    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
                <input
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => confirm()}
                    style={{ marginBottom: 8, width: '100%' }}
                />
                <Box display="flex" gap={8}>
                    <AntButton type="primary" size="small" onClick={confirm}>Search</AntButton>
                    <AntButton size="small" onClick={clearFilters}>Reset</AntButton>
                </Box>
            </div>
        ),
        onFilter: (value, record) =>
            record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase())
    })

    const columns = [
        { title: 'S.No', dataIndex: 'sno', key: 'sno', ...getColumnSearchProps('sno'), sorter: (a, b) => a.sno - b.sno },
        { title: 'Asset Name', dataIndex: 'assetname', key: 'task', ...getColumnSearchProps('assetname'), sorter: stringSorter("assetname") },
        { title: 'Code', dataIndex: 'assetcode', key: 'assetcode', ...getColumnSearchProps('assetcode'), sorter: stringSorter("assetcode") },
        {
            title: 'Status',
            dataIndex: 'assetstatus',
            key: 'assetstatus',
            ...getColumnSearchProps('assetstatus'),
            sorter: stringSorter("assetstatus"),
            render: (status) => {
                let color = "default"

                if (status === "NOTLIVE") color = "red"
                if (status === "OPEN") color = "orange"
                if (status === "COMPLETED") color = "green"
                if (status === "VERIFIED") color = "blue"

                return (
                    <Tag color={color}>
                        {status || "-"}
                    </Tag>
                )
            }
        },
        {
            title: 'View', dataIndex: 'view', key: 'view',
            render: () => (
                <Tag color="blue">
                    View
                </Tag>
            )
        }
    ]
    return (
        <>
            <Helmet>
                <title>{getPageTitle('reports/tasks/ScheduledDetaisPages/TaskReportDetails')}</title>
                <meta name="description" content={`${APP_CONFIG.name} - TaskReportDetails`} />
            </Helmet>

            <Box>
                <Typography variant="h4" gutterBottom fontWeight="bold">Task Report Details</Typography>
                <Card>
                    <CardContent>
                        {!shouldFetch ? <Empty description="Please apply filters to view the report" /> :
                            queryLoading ? <Box display="flex" justifyContent="center" p={4}><Spin /></Box> :
                                <Table dataSource={reports} columns={columns} rowKey={(record, index) => index} pagination={{ pageSize: 20 }} scroll={{ x: 'max-content', y: 450 }} bordered />}
                    </CardContent>
                </Card>
            </Box>
        </>
    )
}
