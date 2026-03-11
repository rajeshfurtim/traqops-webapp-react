import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Card, CardContent } from '@mui/material'
import { Form, Select, Space, Button as AntButton, Row, Col, DatePicker, Table, Spin, Tooltip } from 'antd'
import { FilePdfOutlined } from '@ant-design/icons'
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

export default function Vac() {

    const { user } = useAuth()
    const clientId = user?.client?.id || user?.clientId
    const [form] = Form.useForm()
    const printRef = useRef(null)

    const [filters, setFilters] = useState({})
    const [groupedData, setGroupedData] = useState({})
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
        { id: "AHU", name: "AHU History" },
        { id: "CHILLER", name: "Chiller History" },
        { id: "CT", name: "CT History" },
        { id: "CDWP", name: "CDWP History" },
        { id: "CHWP", name: "CHWP History" }
    ]

    useEffect(() => {
        form.setFieldsValue({
            date: [dayjs().startOf('month'), dayjs()],
        })
    }, [])

    useEffect(() => {
        if (!checklistData?.data) return;

        if (filters.type === "AHU") processData(checklistData.data);
        if (filters.type === "CHILLER") processChillerData(checklistData.data);
        if (filters.type === "CT") processData(checklistData.data);
        if (filters.type === "CDWP") processData(checklistData.data);
        if (filters.type === "CHWP") processData(checklistData.data);

    }, [checklistData, filters.type]);

    const handleFilterChange = (values) => {
        console.log('Filter values:', values)
        const newFilters = {}
        if (values.date) {
            newFilters.fromDate = dayjs(values.date[0]).format('YYYY-MM-DD')
            newFilters.toDate = dayjs(values.date[1]).format('YYYY-MM-DD')
        }
        if (values.location) {
            newFilters.locationId = values.location
            const loc = locationList?.data?.content?.find(l => l.id === values.location)
            setLocationName(loc?.name || "")
        }
        if (values.type === "AHU") newFilters.scheduledId = [54228, 10331188, 10334684, 10385900]
        if (values.type === "CHILLER") newFilters.scheduledId = [44723, 10331112, 10334382, 10385872]
        if (values.type === "CT") newFilters.scheduledId = [54410, 10331506, 10334903, 10385963]
        if (values.type === "CDWP") newFilters.scheduledId = [54446, 10331661, 10335500, 10386152]
        if (values.type === "CHWP") newFilters.scheduledId = [482578, 10332453, 10338638, 10387059]

        newFilters.type = values.type

        setFilters(newFilters)
    }

    const handleResetFilters = () => {
        form.resetFields()
        setFilters({})
    }

    const handlePrint = useReactToPrint({
        contentRef: printRef
    })

    // Checklist Logic
    const getMonthFormat = (val) => dayjs(val).format("MMM-YY")

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

    const processData = (list) => {

        const grouped = {}

        list.forEach(task => {

            task.scheduledAssetsDtos?.forEach(asset => {

                if (!grouped[asset.itemCode]) grouped[asset.itemCode] = []

                task.pmchecklistMapDtos?.forEach(map => {

                    if (map.assetId === asset.assetId) {

                        let row = {
                            fy: getQuarter(task.startDate),
                            sd: task.startDate,
                            ptwNo: task.ptwNo,
                            R: "", Y: "", B: "",
                            "R-Y": "", "Y-B": "", "B-R": "",
                            remarks: ""
                        }

                        map.pmElementsChecklists?.forEach(c => {

                            const id = c.elementsCheckList?.id
                            const val = c.textContent || c.value || ""

                            if (id === 54473) row.R = val
                            if (id === 54474) row.Y = val
                            if (id === 54479) row.B = val
                            if (id === 61080) row["R-Y"] = val
                            if (id === 61099) row["Y-B"] = val
                            if (id === 61145) row["B-R"] = val

                            row.remarks = c.remarks || ""
                        })

                        grouped[asset.itemCode].push(row)
                    }

                })

            })

        })

        setGroupedData(grouped)
    }

    const processChillerData = (reportlist) => {

        const grouped = {};

        if (!reportlist?.length) return;

        const assetList = reportlist[0].scheduledAssetsDtos;

        assetList.forEach(asset => {

            if (!grouped[asset.itemCode]) {
                grouped[asset.itemCode] = [];
            }

            reportlist.forEach(task => {

                task.pmchecklistMapDtos?.forEach(checklistmap => {

                    if (asset.assetId === checklistmap.assetId) {

                        let row = {
                            fy: getQuarter(task.startDate),
                            sd: task.startDate,
                            assetId: asset.assetId,
                            ptwNo: task.ptwNo,

                            initialrunhrs: "",
                            finalrunhrs: "",
                            monthlyrunnhrs: "",
                            runninghrs: "",

                            Refrigerantlevel: "",
                            CompressorOil: "",
                            Suctionpressure: "",
                            Dischargepressure: "",
                            suctionlinetemperature: "",
                            DischargelineTemperature: "",
                            Coolerapproach: "",
                            Condenserapproach: "",
                            evaporator: "",
                            condensor: "",
                            Targetcapacity: "",
                            Fulloadcapacity: "",
                            remarks: ""
                        };

                        checklistmap.pmElementsChecklists?.forEach(checklist => {

                            const id = checklist.elementsCheckList?.id;
                            const val = checklist.textContent || checklist.value || "";

                            if (id === 4023817) row.initialrunhrs = val;
                            if (id === 4023818) row.finalrunhrs = val;
                            if (id === 4023820) row.monthlyrunnhrs = val;
                            if (id === 4023819) row.runninghrs = val;

                            if (id === 18189) row.Refrigerantlevel = val;
                            if (id === 17893) row.CompressorOil = val;
                            if (id === 18198) row.Suctionpressure = val;
                            if (id === 18199) row.Dischargepressure = val;
                            if (id === 4023708) row.suctionlinetemperature = val;
                            if (id === 4023709) row.DischargelineTemperature = val;
                            if (id === 4023815) row.Coolerapproach = val;
                            if (id === 18187) row.Condenserapproach = val;
                            if (id === 4023814) row.evaporator = val;
                            if (id === 4023813) row.condensor = val;
                            if (id === 18212) row.Targetcapacity = val;
                            if (id === 4023816) row.Fulloadcapacity = val;

                            row.remarks = checklist.remarks || "";

                        });

                        grouped[asset.itemCode].push(row);

                    }

                });

            });

        });

        setGroupedData(grouped);

    }

    const renderTable = (title) => (
        <div style={{ overflowX: "auto" }}>
            <table className="checklist-table" cellSpacing="0">

                <thead>

                    <tr>
                        <td colSpan={12}>
                            <b>CMRL-{locationName} STATION {title}</b>
                        </td>
                    </tr>

                    <tr>
                        <td rowSpan={3}><b>Equipment Name</b></td>
                        <td rowSpan={3}><b>Period Of Maintenance</b></td>
                        <td rowSpan={3}><b>Month</b></td>
                        <td rowSpan={3}><b>PTWD No & Date</b></td>
                        <td rowSpan={3}><b>Scope of works/Description of fault</b></td>

                        <td colSpan={6}><b>AHU PARAMETERS</b></td>
                        <td rowSpan={2}><b>Remarks</b></td>
                    </tr>

                    <tr>
                        <td colSpan={3}><b>Amps</b></td>
                        <td colSpan={3}><b>Voltage</b></td>
                    </tr>

                    <tr>
                        <td><b>R</b></td>
                        <td><b>Y</b></td>
                        <td><b>B</b></td>
                        <td><b>RY</b></td>
                        <td><b>YB</b></td>
                        <td><b>BR</b></td>
                        <td></td>
                    </tr>

                </thead>

                <tbody>

                    {Object.entries(groupedData).map(([asset, rows]) =>
                        rows.map((row, i) => (
                            <tr key={i}>

                                {i === 0 && (
                                    <td rowSpan={rows.length}>
                                        <b>{asset}</b>
                                    </td>
                                )}

                                <td>{row.fy}</td>
                                <td>{getMonthFormat(row.sd)}</td>
                                <td>{row.ptwNo}</td>

                                <td>
                                    Checked the physical inspection, Terminal tightness
                                </td>

                                <td>{row.R}</td>
                                <td>{row.Y}</td>
                                <td>{row.B}</td>
                                <td>{row["R-Y"]}</td>
                                <td>{row["Y-B"]}</td>
                                <td>{row["B-R"]}</td>

                                <td>{row.remarks}</td>

                            </tr>
                        ))
                    )}

                </tbody>

            </table>
        </div>
    )

    const renderChillerTable = () => (
        <div style={{ overflowX: "auto" }}>
            <table className="checklist-table" cellSpacing="0">

                <thead>

                    {/* TITLE */}
                    <tr>
                        <td colSpan={22}>
                            <b>CMRL-{locationName} STATION CHILLER HISTORY CARD</b>
                        </td>
                    </tr>

                    {/* MAIN HEADER */}
                    <tr>
                        <td rowSpan={3}><b>Equipment Name</b></td>
                        <td rowSpan={3}><b>Period of Maintenance</b></td>
                        <td rowSpan={3}><b>Month</b></td>
                        <td rowSpan={3}><b>Initial Run Hours</b></td>
                        <td rowSpan={3}><b>Final Run Hours</b></td>
                        <td rowSpan={3}><b>Monthly Cummulative Run Hours</b></td>
                        <td rowSpan={3}><b>PTWD No & Date</b></td>
                        <td rowSpan={3}><b>PM Running Hours</b></td>
                        <td rowSpan={3}><b>Scope of works/Description of fault</b></td>

                        <td></td>

                        <td colSpan={11}><b>CHILLERS - Parameter values</b></td>

                        <td rowSpan={2}><b>Remarks</b></td>
                    </tr>

                    {/* PARAMETER NAMES */}
                    <tr>
                        <td><b>Refrigerant level</b></td>
                        <td><b>Compressor oil level</b></td>
                        <td><b>Suction pressure</b></td>
                        <td><b>Discharge pressure</b></td>
                        <td><b>Suction line temperature</b></td>
                        <td><b>Discharge line Temperature</b></td>
                        <td><b>Cooler approach</b></td>
                        <td><b>Condenser approach</b></td>
                        <td><b>Evaporator ΔT T in -T out</b></td>
                        <td><b>Condenser ΔT T in -T out</b></td>
                        <td><b>Target capacity</b></td>
                        <td><b>Full load capacity</b></td>
                    </tr>

                    {/* UNITS ROW */}
                    <tr>
                        <td><b>MM</b></td>
                        <td><b>%</b></td>
                        <td><b>PSI</b></td>
                        <td><b>PSI</b></td>
                        <td><b>°F</b></td>
                        <td><b>°F</b></td>
                        <td><b>°F</b></td>
                        <td><b>°F</b></td>
                        <td><b>C</b></td>
                        <td><b>C</b></td>
                        <td><b>%</b></td>
                        <td><b>%</b></td>
                        <td></td>
                    </tr>

                </thead>

                <tbody>
                    {Object.entries(groupedData).map(([assetName, rows]) =>
                        rows.map((row, i) => (
                            <tr key={i}>

                                {i === 0 && (
                                    <td rowSpan={rows.length}>
                                        <b>{assetName}</b>
                                    </td>
                                )}

                                <td>{row.fy}</td>
                                <td>{getMonthFormat(row.sd)}</td>
                                <td>{row.initialrunhrs}</td>
                                <td>{row.finalrunhrs}</td>
                                <td>{row.monthlyrunnhrs}</td>
                                <td>{row.ptwNo}</td>
                                <td>{row.runninghrs}</td>
                                <td>Checked the chiller parameters , safety limits and found working normal</td>

                                <td>{row.Refrigerantlevel}</td>
                                <td>{row.CompressorOil}</td>
                                <td>{row.Suctionpressure}</td>
                                <td>{row.Dischargepressure}</td>
                                <td>{row.suctionlinetemperature}</td>
                                <td>{row.DischargelineTemperature}</td>
                                <td>{row.Coolerapproach}</td>
                                <td>{row.Condenserapproach}</td>
                                <td>{row.evaporator}</td>
                                <td>{row.condensor}</td>
                                <td>{row.Targetcapacity}</td>
                                <td>{row.Fulloadcapacity}</td>
                                <td>{row.remarks}</td>

                            </tr>
                        ))
                    )}
                </tbody>

            </table>
        </div>
    )

    const renderCTTable = () => (
        <div style={{ overflowX: "auto" }}>
            <table className="checklist-table" cellSpacing="0">

                <thead>

                    <tr>
                        <td colSpan={14}>
                            <b>CMRL-{locationName} STATION COOLING TOWER HISTORY CARD</b>
                        </td>
                    </tr>

                    <tr>
                        <td rowSpan={3}><b>Equipment Name</b></td>
                        <td rowSpan={3}><b>Period of Manitenance</b></td>
                        <td rowSpan={3}><b>Month</b></td>
                        <td rowSpan={3}><b>PTWD No & Date</b></td>
                        <td rowSpan={3}><b>Scope of works/Description of fault</b></td>

                        <td colSpan={6}><b>Scope of works/Description of fault</b></td>

                        <td rowSpan={3}><b>CT Approach</b></td>
                        <td rowSpan={3}><b>CT BASIN CLEANED Date</b></td>
                        <td rowSpan={3}><b>Remarks</b></td>
                    </tr>

                    <tr>
                        <td colSpan={3}><b>Amps</b></td>
                        <td colSpan={3}><b>Voltage</b></td>
                    </tr>

                    <tr>
                        <td><b>R</b></td>
                        <td><b>Y</b></td>
                        <td><b>B</b></td>
                        <td><b>RY</b></td>
                        <td><b>YB</b></td>
                        <td><b>BR</b></td>
                    </tr>

                </thead>

                <tbody>

                    {Object.entries(groupedData).map(([asset, rows]) =>
                        rows.map((row, i) => (

                            <tr key={i}>

                                {i === 0 && (
                                    <td rowSpan={rows.length}><b>{asset}</b></td>
                                )}

                                <td>{row.fy}</td>
                                <td>{getMonthFormat(row.sd)}</td>
                                <td>{row.ptwNo}</td>

                                <td>CT Fan Blade damaged need to replace</td>

                                <td>{row.R}</td>
                                <td>{row.Y}</td>
                                <td>{row.B}</td>
                                <td>{row["R-Y"]}</td>
                                <td>{row["Y-B"]}</td>
                                <td>{row["B-R"]}</td>

                                <td>-</td>
                                <td>-</td>

                                <td>{row.rm}</td>

                            </tr>

                        ))
                    )}

                </tbody>

            </table>
        </div>
    )

    const renderCDWPTable = () => (
        <div style={{ overflowX: "auto" }}>
            <table className="checklist-table" cellSpacing="0">

                <thead>

                    <tr>
                        <td colSpan={14}>
                            <b>CMRL-{locationName} STATION CONDENSER WATER PUMP HISTORY CARD</b>
                        </td>
                    </tr>

                    <tr>
                        <td rowSpan={3}><b>Equipment Name</b></td>
                        <td rowSpan={3}><b>Period of Manitenance</b></td>
                        <td rowSpan={3}><b>Month</b></td>
                        <td rowSpan={3}><b>PTWD No & Date</b></td>
                        <td rowSpan={3}><b>Scope of works/Description of fault</b></td>

                        <td colSpan={6}><b>CDWP-Parameter values</b></td>

                        <td rowSpan={3}><b>Remarks</b></td>
                    </tr>

                    <tr>
                        <td colSpan={3}><b>Amps</b></td>
                        <td colSpan={3}><b>Voltage</b></td>
                    </tr>

                    <tr>
                        <td><b>R</b></td>
                        <td><b>Y</b></td>
                        <td><b>B</b></td>
                        <td><b>RY</b></td>
                        <td><b>YB</b></td>
                        <td><b>BR</b></td>
                    </tr>

                </thead>

                <tbody>

                    {Object.entries(groupedData).map(([asset, rows]) =>
                        rows.map((row, i) => (

                            <tr key={i}>

                                {i === 0 && (
                                    <td rowSpan={rows.length}><b>{asset}</b></td>
                                )}

                                <td>{row.fy}</td>
                                <td>{getMonthFormat(row.sd)}</td>
                                <td>{row.ptwNo}</td>

                                <td>Checked the physical inspection,Terminal tightness, All Parameters value checked</td>

                                <td>{row.R}</td>
                                <td>{row.Y}</td>
                                <td>{row.B}</td>
                                <td>{row["R-Y"]}</td>
                                <td>{row["Y-B"]}</td>
                                <td>{row["B-R"]}</td>

                                <td>{row.rm}</td>

                            </tr>

                        ))
                    )}

                </tbody>

            </table>
        </div>
    )

    const renderCHWPTable = () => (
        <div style={{ overflowX: "auto" }}>
            <table className="checklist-table" cellSpacing="0">

                <thead>

                    <tr>
                        <td colSpan={14}>
                            <b>CMRL-{locationName} STATION CHILLED WATER PUMP HISTORY CARD</b>
                        </td>
                    </tr>

                    <tr>
                        <td rowSpan={3}><b>Equipment Name</b></td>
                        <td rowSpan={3}><b>Period of Manitenance</b></td>
                        <td rowSpan={3}><b>Month</b></td>
                        <td rowSpan={3}><b>PTWD No & Date</b></td>
                        <td rowSpan={3}><b>Scope of works/Description of fault</b></td>

                        <td colSpan={6}><b>CHWP-Parameter values</b></td>

                        <td rowSpan={3}><b>Remarks</b></td>
                    </tr>

                    <tr>
                        <td colSpan={3}><b>Amps</b></td>
                        <td colSpan={3}><b>Voltage</b></td>
                    </tr>

                    <tr>
                        <td><b>R</b></td>
                        <td><b>Y</b></td>
                        <td><b>B</b></td>
                        <td><b>RY</b></td>
                        <td><b>YB</b></td>
                        <td><b>BR</b></td>
                    </tr>

                </thead>

                <tbody>

                    {Object.entries(groupedData).map(([asset, rows]) =>
                        rows.map((row, i) => (

                            <tr key={i}>

                                {i === 0 && (
                                    <td rowSpan={rows.length}><b>{asset}</b></td>
                                )}

                                <td>{row.fy}</td>
                                <td>{getMonthFormat(row.sd)}</td>
                                <td>{row.ptwNo}</td>

                                <td>Checked the pump running</td>

                                <td>{row.R}</td>
                                <td>{row.Y}</td>
                                <td>{row.B}</td>
                                <td>{row["R-Y"]}</td>
                                <td>{row["Y-B"]}</td>
                                <td>{row["B-R"]}</td>

                                <td>{row.rm}</td>

                            </tr>

                        ))
                    )}

                </tbody>

            </table>
        </div>
    )

    return (
        <>
            <Helmet>
                <title>{getPageTitle('reports/history-card/vac')}</title>
                <meta name="description" content={`${APP_CONFIG.name} - VAC`} />
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
                                            >
                                                Get Report
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
                                <Tooltip title="Export PDF">
                                    <AntButton
                                        type="primary"
                                        icon={<FilePdfOutlined />}
                                        onClick={handlePrint}
                                        disabled={checklistData?.data?.length === 0}
                                        style={{ backgroundColor: 'rgb(240, 42, 45)', color: '#fff' }}
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
                                            {filters.type === "AHU" && renderTable("AHU HISTORY CARD")}
                                            {filters.type === "CHILLER" && renderChillerTable()}
                                            {filters.type === "CT" && renderCTTable()}
                                            {filters.type === "CDWP" && renderCDWPTable()}
                                            {filters.type === "CHWP" && renderCHWPTable()}
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