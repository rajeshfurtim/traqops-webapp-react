import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Card, CardContent } from '@mui/material'
import { Form, Select, Space, Button as AntButton, Row, Col, DatePicker, Table, Spin } from 'antd'
import { FilePdfOutlined, SearchOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../../config/constants'
import { useGetLocationListQuery } from '../../../store/api/masterSettings.api'
import { useGetHistoryCardsChecklistQuery } from '../../../store/api/historyCards.api'
import { useAuth } from '../../../context/AuthContext'
import { useReactToPrint } from "react-to-print"
import dayjs from 'dayjs'
import isBetween from "dayjs/plugin/isBetween"
import "./style.css"

dayjs.extend(isBetween)
const { RangePicker } = DatePicker

export default function Tvs() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()
    const printRef = useRef(null)

    const [filters, setFilters] = useState({})

    const [tvsdampers, setTvsdampers] = useState(false)
    const [TefORTvs, setTefORTvs] = useState(false)
    const [historyOutput, setHistoryOutput] = useState({})
    const [historyOutputtvstef, setHistoryOutputtvstef] = useState({})
    const [locationName, setLocationName] = useState("")

    const { data: locationList } = useGetLocationListQuery({ clientId, pageNumber: 1, pageSize: 1000 })
    const { data: checklistData, isLoading: checklistLoading, isFetching } =
        useGetHistoryCardsChecklistQuery(
            {
                ...filters
            },
            {
                skip: !filters.locationId || !filters.scheduledId
            }
        )

    const typeList = [
        { id: "TVSDAMPERS", name: "TVS DAMPERS" },
        { id: "TEF_TVS", name: "TEF/TVS" }
    ]

    useEffect(() => {
        form.setFieldsValue({
            date: [dayjs().startOf('month'), dayjs()],
        })
    }, [])

    const handleFilterChange = (values) => {
        console.log('Filter values:', values)
        const newFilters = {}
        if (values.date) {
            newFilters.fromDate = dayjs(values.date[0]).format('YYYY-MM-DD')
            newFilters.toDate = dayjs(values.date[1]).format('YYYY-MM-DD')
        }
        if (values.location) newFilters.locationId = values.location

        const location = locationList?.data?.content?.find(
            (l) => l.id === values.location
        )
        setLocationName(location?.name || "")

        if (values.type == "TVSDAMPERS") {
            newFilters.scheduledId = [608719, 10332680, 10339711, 10387301]
        } else if (values.type == "TEF_TVS") {
            newFilters.scheduledId = [490960, 10332145, 10338788, 10386851]
        }
        setFilters(newFilters)
    }

    const handleResetFilters = () => {
        form.resetFields()
        setFilters({})
    }

    // Checklist Logic
    const getMonthFormat = (val) => {
        return dayjs(val).format("MMM-YY")
    }

    const populateResultTvsdamper = (reportlist) => {
        let result = {}

        if (reportlist?.length > 0) {

            const assetList = reportlist[0].scheduledAssetsDtos

            assetList.forEach(asset => {

                if (!result[asset.itemCode]) {
                    result[asset.itemCode] = []
                }

                reportlist.forEach(task => {

                    task.pmchecklistMapDtos?.forEach(checklistmap => {

                        if (asset.assetId === checklistmap.assetId) {

                            checklistmap.pmElementsChecklists?.forEach(checklist => {

                                if (checklist.elementsCheckList.id === 18036) {

                                    const working = checklist.textContent ? "OK" : ""
                                    const notWorking = checklist.textContent ? "" : "NOT OK"

                                    result[asset.itemCode].push({
                                        fy: "Q",
                                        sd: task.startDate,
                                        ptwNo: task.ptwNo,
                                        wk: working,
                                        nwk: notWorking,
                                        rm: checklist.remarks
                                    })
                                }
                            })
                        }
                    })
                })
            })
        }

        setHistoryOutput(result)
    }

    const populateResultTEFTVS = (reportlist) => {

        let result = {}

        if (reportlist?.length > 0) {

            const assetList = reportlist[0].scheduledAssetsDtos

            assetList.forEach(asset => {

                if (!result[asset.itemCode]) {
                    result[asset.itemCode] = []
                }

                reportlist.forEach(task => {

                    let ry = "", yb = "", br = "", r = "", y = "", b = "", rpm = ""

                    task.pmchecklistMapDtos?.forEach(map => {

                        if (asset.assetId === map.assetId) {

                            map.pmElementsChecklists?.forEach(check => {

                                if (check.elementsCheckList.id === 61080) ry = check.textContent
                                if (check.elementsCheckList.id === 61099) yb = check.textContent
                                if (check.elementsCheckList.id === 61145) br = check.textContent
                                if (check.elementsCheckList.id === 54473) r = check.textContent
                                if (check.elementsCheckList.id === 54474) y = check.textContent
                                if (check.elementsCheckList.id === 54479) b = check.textContent
                                if (check.elementsCheckList.id === 6776724) rpm = check.textContent

                            })

                            result[asset.itemCode].push({
                                fy: "Q",
                                sd: task.startDate,
                                ptwNo: task.ptwNo,
                                "R-Y": ry,
                                "Y-B": yb,
                                "B-R": br,
                                "R": r,
                                "Y": y,
                                "B": b,
                                RPM: rpm,
                                remarks: map?.remarks
                            })
                        }

                    })

                })

            })

        }

        setHistoryOutputtvstef(result)
    }

    useEffect(() => {

        if (!checklistData?.data) return

        const reportlist = checklistData.data

        if (filters?.scheduledId?.includes(608719)) {
            setTvsdampers(true)
            setTefORTvs(false)
            populateResultTvsdamper(reportlist)
        }
        else {
            setTvsdampers(false)
            setTefORTvs(true)
            populateResultTEFTVS(reportlist)
        }

    }, [checklistData])

    const getQuarter = (dateValue) => {

        const d = dayjs(dateValue)

        if (d.isBetween("2022-09-01", "2022-11-30", null, "[]")) return "Q1"
        else if (d.isBetween("2022-12-01", "2023-02-28", null, "[]")) return "Q2"
        else if (d.isBetween("2023-03-01", "2023-05-31", null, "[]")) return "Q3"
        else if (d.isBetween("2023-06-01", "2023-08-31", null, "[]")) return "Q4"
        else if (d.isBetween("2023-09-01", "2023-11-30", null, "[]")) return "Q5"
        else if (d.isBetween("2023-12-01", "2024-02-29", null, "[]")) return "Q6"
        else if (d.isBetween("2024-03-01", "2024-05-31", null, "[]")) return "Q7"
        else if (d.isBetween("2024-06-01", "2024-08-31", null, "[]")) return "Q8"
        else if (d.isBetween("2024-09-01", "2024-11-30", null, "[]")) return "Q9"
        else if (d.isBetween("2024-12-01", "2025-02-28", null, "[]")) return "Q10"
        else if (d.isBetween("2025-03-01", "2025-05-31", null, "[]")) return "Q11"
        else if (d.isBetween("2025-06-01", "2025-08-31", null, "[]")) return "Q12"
        else if (d.isBetween("2025-09-01", "2025-11-30", null, "[]")) return "Q13"
        else if (d.isBetween("2025-12-01", "2026-02-28", null, "[]")) return "Q14"
        else if (d.isBetween("2026-03-01", "2026-05-31", null, "[]")) return "Q15"
        else if (d.isBetween("2026-06-01", "2026-08-31", null, "[]")) return "Q16"
        else if (d.isBetween("2026-09-01", "2026-11-30", null, "[]")) return "Q17"
        else if (d.isBetween("2026-12-01", "2027-02-28", null, "[]")) return "Q18"
        else if (d.isBetween("2027-03-01", "2027-05-31", null, "[]")) return "Q19"
        else if (d.isBetween("2027-06-01", "2027-08-31", null, "[]")) return "Q20"

        return ""
    }

    const handlePrint = useReactToPrint({
        contentRef: printRef
    });

    return (
        <>
            <Helmet>
                <title>{getPageTitle('reports/history-card/tvs')}</title>
                <meta name="description" content={`${APP_CONFIG.name} - TVS`} />
            </Helmet>

            <Box>

                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Form
                            form={form}
                            onFinish={handleFilterChange}
                            layout="vertical"
                        >
                            <Row gutter={[16, 16]}>

                                <Col xs={24} sm={12} md={8} lg={6}>
                                    <Form.Item
                                        label="Date"
                                        name="date"
                                        rules={[{ required: true, message: 'Please select date range!' }]}
                                    >
                                        <RangePicker
                                            style={{ width: "100%" }}
                                            format={'DD/MM/YYYY'}
                                            disabledDate={(current) =>
                                                current && current > dayjs().endOf('day')
                                            }
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12} md={8} lg={6}>
                                    <Form.Item
                                        label="Location"
                                        name="location"
                                        rules={[{ required: true, message: 'Please select location!' }]}
                                    >
                                        <Select
                                            placeholder="Select Location"
                                        >
                                            {locationList?.data?.content?.map(l => (
                                                <Select.Option key={l.id} value={l.id}>
                                                    {l.name}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12} md={8} lg={6}>
                                    <Form.Item
                                        label="Type"
                                        name="type"
                                        rules={[{ required: true, message: 'Please select type!' }]}
                                    >
                                        <Select
                                            placeholder="Select Type"
                                        >
                                            {typeList?.map(l => (
                                                <Select.Option key={l.id} value={l.id}>
                                                    {l.name}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>

                                {/* Buttons */}
                                <Col xs={24} sm={24} md={24} lg={6}>
                                    <Form.Item label=" ">
                                        <Space>
                                            <AntButton
                                                type="primary"
                                                htmlType="submit"
                                                loading={checklistLoading || isFetching}
                                                icon={<SearchOutlined />}
                                            >
                                                Search
                                            </AntButton>
                                            <AntButton onClick={handleResetFilters}>
                                                Reset
                                            </AntButton>
                                        </Space>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Space>

                                <AntButton
                                    icon={<FilePdfOutlined />}
                                    onClick={handlePrint}
                                    disabled={!checklistData || checklistData?.data?.length === 0}
                                >
                                    Export PDF
                                </AntButton>

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

                                            {tvsdampers && (

                                                <div className="col-xl-12">

                                                    <div className="card" id="tvsdamper">

                                                        <div style={{ overflowX: "auto" }}>
                                                            <table className="checklist-table" cellSpacing="0">

                                                                <tr>
                                                                    <td colSpan={2} rowSpan={2} height="118">
                                                                        <img src="/assets/voltas1.png" width="60" height="60" />
                                                                    </td>

                                                                    <td colSpan={9} rowSpan={2}>
                                                                        <b>CMRL-{locationName} STATION TVS DAMPERS HISTORY CARD</b>
                                                                    </td>

                                                                    <td colSpan={2} rowSpan={2}>
                                                                        <img src="/assets/cmrl.png" width="60" height="60" />
                                                                    </td>
                                                                </tr>

                                                                <tr></tr>

                                                                <tr>
                                                                    <td height="59"><b>STATION NAME</b></td>
                                                                    <td><b>{locationName}</b></td>

                                                                    <td rowSpan={4}><b>PERIOD OF MAINTENANCE</b></td>
                                                                    <td rowSpan={4}><b>MONTH</b></td>
                                                                    <td rowSpan={4}><b>PTWD No & Date</b></td>

                                                                    <td colSpan={8}><b>TRACKWAY EXHAUST DAMPERS</b></td>
                                                                </tr>

                                                                <tr>
                                                                    <td height="59"><b>MAKE</b></td>
                                                                    <td><b>TROCKS</b></td>

                                                                    <td rowSpan={3}><b>SCOPE OF WORKS/DESCRIPTION OF FAULTS</b></td>

                                                                    <td colSpan={2} rowSpan={2}>
                                                                        <b>STATUS (Working or Not Working)</b>
                                                                    </td>

                                                                    <td rowSpan={3}><b>SPARE REPLACED IF ANY</b></td>

                                                                    <td rowSpan={3} colSpan={4}>
                                                                        <b>REMARKS (For Not working Dampers)</b>
                                                                    </td>
                                                                </tr>

                                                                <tr>
                                                                    <td height="59"><b>MODEL.NO</b></td>
                                                                    <td></td>
                                                                </tr>

                                                                <tr>
                                                                    <td height="59"><b>LOCATION</b></td>
                                                                    <td><b>M10</b></td>

                                                                    <td><b>OK</b></td>
                                                                    <td><b>NOT OK</b></td>
                                                                </tr>


                                                                {/* DATA ROWS */}

                                                                {Object.entries(historyOutput).map(([key, value]) =>
                                                                    value.map((row, i) => (
                                                                        <tr key={i}>

                                                                            {i === 0 && (
                                                                                <td colSpan={2} rowSpan={value.length}>
                                                                                    <b>{key}</b>
                                                                                </td>
                                                                            )}

                                                                            <td>{getQuarter(row.sd)}</td>
                                                                            <td>{getMonthFormat(row.sd)}</td>
                                                                            <td>{row.ptwNo}</td>

                                                                            <td>
                                                                                Checked Damper operations & Physical appearance & linkage assembly & mountings
                                                                            </td>

                                                                            <td>{row.wk}</td>
                                                                            <td>{row.nwk}</td>

                                                                            <td>-</td>

                                                                            <td colSpan={4}>{row.rm}</td>

                                                                        </tr>
                                                                    ))
                                                                )}

                                                            </table>
                                                        </div>

                                                    </div>

                                                </div>

                                            )}

                                            {TefORTvs && (

                                                <div className="col-xl-12">

                                                    <div className="card" id="teftvs">

                                                        <div style={{ overflowX: "auto" }}>
                                                            <table className="checklist-table" cellSpacing="0">

                                                                <tr>
                                                                    <td colSpan={2} rowSpan={2} height="118">
                                                                        <img src="/assets/voltas1.png" width="60" height="60" />
                                                                    </td>

                                                                    <td colSpan={13} rowSpan={2}>
                                                                        <b>CMRL-{locationName} STATION TEF/TVS HISTORY CARD</b>
                                                                    </td>

                                                                    <td colSpan={2} rowSpan={2}>
                                                                        <img src="/assets/cmrl.png" width="60" height="60" />
                                                                    </td>
                                                                </tr>

                                                                <tr></tr>

                                                                <tr>
                                                                    <td height="59"><b>STATION NAME</b></td>
                                                                    <td><b>{locationName}</b></td>
                                                                    <td></td>

                                                                    <td rowSpan={4}><b>MONTH</b></td>
                                                                    <td rowSpan={4}><b>PTWD No & Date</b></td>

                                                                    <td colSpan={12}><b>TRACKWAY EXHAUST FANS</b></td>
                                                                </tr>

                                                                <tr>
                                                                    <td height="59"><b>MAKE</b></td>
                                                                    <td><b>FLAKTWOODS</b></td>
                                                                    <td></td>

                                                                    <td rowSpan={3}>
                                                                        <b>SCOPE OF WORKS/DESCRIPTION OF FAULTS</b>
                                                                    </td>

                                                                    <td colSpan={7}><b>PARAMETERS</b></td>

                                                                    <td colSpan={2}><b>BREAKDOWN TIME</b></td>

                                                                    <td rowSpan={3}><b>SPARE REPLACED IF ANY</b></td>

                                                                    <td rowSpan={3}><b>Remarks</b></td>
                                                                </tr>

                                                                <tr>
                                                                    <td height="59"><b>MODEL.NO</b></td>
                                                                    <td></td>
                                                                    <td></td>

                                                                    <td colSpan={3}><b>LINE VOLTAGE(V)</b></td>

                                                                    <td colSpan={3}><b>LINE CURRENT(I)</b></td>

                                                                    <td rowSpan={2}><b>SPEED (RPM)</b></td>

                                                                    <td rowSpan={2}><b>FAULT DATE</b></td>

                                                                    <td rowSpan={2}><b>RECTIFIED DATE</b></td>
                                                                </tr>

                                                                <tr>
                                                                    <td height="59"><b>LOCATION</b></td>
                                                                    <td><b>M09</b></td>
                                                                    <td></td>

                                                                    <td><b>R-Y</b></td>
                                                                    <td><b>Y-B</b></td>
                                                                    <td><b>B-R</b></td>

                                                                    <td><b>R</b></td>
                                                                    <td><b>Y</b></td>
                                                                    <td><b>B</b></td>
                                                                </tr>


                                                                {/* DATA */}

                                                                {Object.entries(historyOutputtvstef).map(([key, value]) =>
                                                                    value.map((row, i) => (
                                                                        <tr key={i}>

                                                                            {i === 0 && (
                                                                                <td colSpan={2} rowSpan={value.length}>
                                                                                    <b>{key}</b>
                                                                                </td>
                                                                            )}

                                                                            <td>{getQuarter(row.sd)}</td>
                                                                            <td>{getMonthFormat(row.sd)}</td>
                                                                            <td>{row.ptwNo}</td>

                                                                            <td>
                                                                                Checked Terminal status & Canvas, Cone Status, Fan Mountings & noise status
                                                                            </td>

                                                                            <td>{row["R-Y"]}</td>
                                                                            <td>{row["Y-B"]}</td>
                                                                            <td>{row["B-R"]}</td>

                                                                            <td>{row["R"]}</td>
                                                                            <td>{row["Y"]}</td>
                                                                            <td>{row["B"]}</td>

                                                                            <td>{row.RPM}</td>

                                                                            <td>-</td>
                                                                            <td>-</td>

                                                                            <td>-</td>

                                                                            <td>{row.remarks}</td>

                                                                        </tr>
                                                                    ))
                                                                )}

                                                            </table>
                                                        </div>

                                                    </div>

                                                </div>

                                            )}

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