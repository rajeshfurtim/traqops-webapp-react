import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Table, Tabs, Form, DatePicker, Select, Button, Row, Col } from "antd";
import { Skeleton, Empty } from "antd";
import dayjs from "dayjs";
import { mockApi } from "../services/api";
import { getPageTitle, APP_CONFIG } from "../config/constants";
import {
  useGetLocationListQuery,
  useGetAllShiftQuery,
  useGetAllStatusQuery,
  useGetAllFrequencyQuery,
  useGetAllUserTypeQuery,
} from "../store/api/masterSettings.api";
import {
  useLazyGetFailureRateSystemQuery,
  useLazyGetTopAssetsFailureQuery,
  useLazyGetTopUsedSparesQuery,
  useLazyGetSpareConsumptionByLocationTrendQuery,
  useLazyGetLowStockSparesQuery,
  useLazyGetPmCountByFrequencyQuery,
  useLazyGetCmGraphCountQuery,
  useLazyGetAttendanceCountByShiftQuery,
} from "../store/api/dashboard.api";
import { useAuth } from "../context/AuthContext";
import { domainName as fallbackDomainName } from "../config/apiConfig";
import { UserOutlined } from "@ant-design/icons";
import RechartsResponsiveBox from "../components/charts/RechartsResponsiveBox";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function Dashboard() {
  const [filterForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState("consolidate");
  const [consolidateChartsLoading, setConsolidateChartsLoading] = useState(false);
  const [ecsFailureRateBySystemData, setEcsFailureRateBySystemData] = useState([]);
  const [tvsFailureRateBySystemData, setTvsFailureRateBySystemData] = useState([]);
  const [ecsTop10AssetsByFailureData, setEcsTop10AssetsByFailureData] = useState([]);
  const [tvsTop10AssetsByFailureData, setTvsTop10AssetsByFailureData] = useState([]);
  const [topUsedSparesData, setTopUsedSparesData] = useState([]);
  const [spareConsumptionTrendByStationData, setSpareConsumptionTrendByStationData] = useState([]);
  const [lowStockSparesAcrossStationsData, setLowStockSparesAcrossStationsData] = useState([]);
  const [attendanceEngineerData, setAttendanceEngineerData] = useState([]);
  const [attendanceTechnicianData, setAttendanceTechnicianData] = useState([]);
  const [attendanceTeamLeaderData, setAttendanceTeamLeaderData] = useState([]);
  const [attendanceHelpdeskData, setAttendanceHelpdeskData] = useState([]);
  const [attendanceChartsLoading, setAttendanceChartsLoading] = useState(false);
  const { user } = useAuth();
  const [triggerGetFailureRateSystem] = useLazyGetFailureRateSystemQuery();
  const [triggerGetTopAssetsFailureSystem] = useLazyGetTopAssetsFailureQuery();
  const [triggerGetTopUsedSpares] = useLazyGetTopUsedSparesQuery();
  const [triggerGetSpareConsumptionByLocationTrend] = useLazyGetSpareConsumptionByLocationTrendQuery();
  const [triggerGetLowStockSpares] = useLazyGetLowStockSparesQuery();
  const [triggerGetPmCountByFrequency] = useLazyGetPmCountByFrequencyQuery();
  const [triggerGetCmGraphCount] = useLazyGetCmGraphCountQuery();
  const [triggerGetAttendanceCountByShift] = useLazyGetAttendanceCountByShiftQuery();

  const clientId = user?.client?.id || user?.clientId;
  const domainNameParam = user?.domain?.name || fallbackDomainName;

  const { data: locationListResponse, isLoading: locationsLoading } =
    useGetLocationListQuery(
      { domainName: domainNameParam, clientId, pageNumber: 1, pageSize: 1000 },
      { skip: !clientId },
    );

  const locationOptions = locationListResponse?.data?.content ?? [];

  const { data: shiftListResponse, isLoading: shiftsLoading } =
    useGetAllShiftQuery(
      { domainName: domainNameParam, clientId, pageNumber: 1, pageSize: 1000 },
      { skip: !clientId },
    );

  const shiftOptions = shiftListResponse?.data?.content ?? [];

  const { data: userTypeListResponse } = useGetAllUserTypeQuery(
    { clientId, pageNumber: 1, pageSize: 1000 },
    { skip: !clientId }
  );
  const userTypeOptions = userTypeListResponse?.data?.content ?? [];

  const { data: frequenciesResponse, isLoading: frequenciesLoading } =
    useGetAllFrequencyQuery();
  const frequencyOptions =
    frequenciesResponse?.success && Array.isArray(frequenciesResponse.data)
      ? frequenciesResponse.data
      : [];

  const { data: statusResponse, isLoading: statusesLoading } =
    useGetAllStatusQuery();

  const statusOptions = Array.isArray(statusResponse?.data)
    ? statusResponse.data
    : [];

  const correctiveStatusSelectOptions = statusOptions
    .filter((s) =>
      ["OPEN", "COMPLETED", "VERIFIED"].includes((s?.value || s?.name || "").trim())
    )
    .map((s) => {
      const v = (s?.value || s?.name || "").trim();
      return { label: v, value: v };
    })

    .reduce((acc, opt) => {
      if (!acc.some((x) => x.value === opt.value)) acc.push(opt);
      return acc;
    }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!locationOptions?.length) return;

    filterForm.submit();
    handleScheduleTaskSubmit()
    handleCorrectiveTaskSubmit()

  }, [locationOptions]);

  const loadDashboardData = async () => {
    try {
      const response = await mockApi.getDashboardData();
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatHrsMins = (totalMinutes) => {
    const mins = Number(totalMinutes || 0);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h <= 0) return `${m} mins`;
    return `${h} hrs ${m} mins`;
  };

  const tabItems = [
    { key: "consolidate", label: "Consolidate" },
    { key: "locationWise", label: "Location Wise" },
  ];

  const getAttendanceChartData = async ({
    date,
    locationIds,
    userTypeId,
    clientId,
    shiftId,
    tabKey,
  }) => {
    const attendanceRes = await triggerGetAttendanceCountByShift({
      date,
      locationId: locationIds,
      userTypeId,
      clientId,
      shiftId,
      tabKey,
    }).unwrap();

    return (attendanceRes?.data || []).map((row) => ({
      label: String(row?.locationName || row?.locationId || "").trim(),
      value: Number(row?.userTypeAttendance?.[0]?.presentCount || 0),
    }));
  };

  const getUserTypeIdByName = (targetName) => {
    const normalizedTarget = String(targetName || "").trim().toLowerCase();
    const match = userTypeOptions.find(
      (u) => String(u?.name || "").trim().toLowerCase() === normalizedTarget
    );
    return match?.id;
  };

  const handleSearch = (values, tabKeyOverride) => {
    console.log(values, tabKeyOverride)
    const fromDate = values?.fromDate?.startOf?.("month")?.format?.("YYYY-MM-DD")
    const toDate = values?.fromDate?.endOf?.("month")?.format?.("YYYY-MM-DD")
    const attendanceDate = values?.fromDate?.format?.("YYYY-MM-DD")
    const rawLocationIds = Array.isArray(values?.locationIds) ? values.locationIds : []
    const wantsAllLocations =
      rawLocationIds?.some((id) => String(id) === "-1") ?? false
    const locationIds = wantsAllLocations
      ? locationOptions.map((l) => l?.id).filter((id) => id !== undefined && id !== null)
      : rawLocationIds.filter((id) => String(id) !== "-1")
    const shiftId = values?.shiftId
    const tabKey = tabKeyOverride || activeTab

    const yearFromDate = dayjs().startOf("year").format("YYYY-MM-DD")
    const yearToDate = dayjs().endOf("year").format("YYYY-MM-DD")

    console.log("Dashboard filters", {
      fromDate,
      toDate,
      shiftId,
      locationIds,
      tabKey,
    })

    if (!fromDate || !toDate || !locationIds.length) return

      ; (async () => {
        setConsolidateChartsLoading(true)
        setAttendanceChartsLoading(true)
        try {
          const engineerUserTypeId = getUserTypeIdByName("ENGINEER");
          const technicianUserTypeId = getUserTypeIdByName("TECHNICIAN");
          const teamLeaderUserTypeId = getUserTypeIdByName("Team Leader");
          const helpdeskUserTypeId = getUserTypeIdByName("Helpdesk");

          const [
            ecsFailureRes,
            tvsFailureRes,
            ecsTopRes,
            tvsTopRes,
            topSparesRes,
            spareTrendRes,
            lowStockRes,
            engineerAttendanceRes,
            technicianAttendanceRes,
            teamLeaderAttendanceRes,
            helpdeskAttendanceRes,
          ] = await Promise.all([
            triggerGetFailureRateSystem({
              system: "ECS",
              fromDate,
              toDate,
              locationId: locationIds,
              tabKey,
              shiftId,
            }).unwrap(),
            triggerGetFailureRateSystem({
              system: "TVS",
              fromDate,
              toDate,
              locationId: locationIds,
              tabKey,
              shiftId,
            }).unwrap(),
            triggerGetTopAssetsFailureSystem({
              system: "ECS",
              fromDate,
              toDate,
              locationId: locationIds,
              tabKey,
              shiftId,
            }).unwrap(),
            triggerGetTopAssetsFailureSystem({
              system: "TVS",
              fromDate,
              toDate,
              locationId: locationIds,
              tabKey,
              shiftId,
            }).unwrap(),
            triggerGetTopUsedSpares({
              fromDate,
              toDate,
              locationIds,
              tabKey,
              shiftId,
            }).unwrap(),
            triggerGetSpareConsumptionByLocationTrend({
              fromDate: yearFromDate,
              toDate: yearToDate,
              locationIds,
              tabKey,
              shiftId,
            }).unwrap(),
            triggerGetLowStockSpares({
              locationId: locationIds,
              tabKey,
              shiftId,
            }).unwrap(),
            engineerUserTypeId
              ? getAttendanceChartData({
                date: attendanceDate,
                locationIds,
                userTypeId: engineerUserTypeId,
                clientId,
                shiftId: shiftId ?? -1,
                tabKey,
              })
              : Promise.resolve([]),
            technicianUserTypeId
              ? getAttendanceChartData({
                date: attendanceDate,
                locationIds,
                userTypeId: technicianUserTypeId,
                clientId,
                shiftId: shiftId ?? -1,
                tabKey,
              })
              : Promise.resolve([]),
            teamLeaderUserTypeId
              ? getAttendanceChartData({
                date: attendanceDate,
                locationIds,
                userTypeId: teamLeaderUserTypeId,
                clientId,
                shiftId: shiftId ?? -1,
                tabKey,
              })
              : Promise.resolve([]),
            helpdeskUserTypeId
              ? getAttendanceChartData({
                date: attendanceDate,
                locationIds,
                userTypeId: helpdeskUserTypeId,
                clientId,
                shiftId: shiftId ?? -1,
                tabKey,
              })
              : Promise.resolve([]),
          ])

          setEcsFailureRateBySystemData(
            (ecsFailureRes?.data || []).map((x) => ({
              system: x?.categoryName,
              failureRate: x?.count,
            }))
          )

          setTvsFailureRateBySystemData(
            (tvsFailureRes?.data || []).map((x) => ({
              system: x?.categoryName,
              failureRate: x?.count,
            }))
          )

          setEcsTop10AssetsByFailureData(
            (ecsTopRes?.data || []).map((x) => ({
              asset: x?.assetName,
              failures: x?.count,
            }))
          )

          setTvsTop10AssetsByFailureData(
            (tvsTopRes?.data || []).map((x) => ({
              asset: x?.assetName,
              failures: x?.count,
            }))
          )

          setTopUsedSparesData(
            (topSparesRes?.data || []).map((x) => ({
              sparePart: x?.spareName,
              timesUsed: x?.usedCount,
            }))
          )

          const trendRows = spareTrendRes?.data || []
          if (trendRows.length) {
            setSpareConsumptionTrendByStationData(
              trendRows.map((row) => {
                const stations = row?.stations || {}
                return {
                  month: row?.month,
                  ...Object.fromEntries(
                    Object.entries(stations).map(([k, v]) => [
                      k,
                      Number(v ?? 0),
                    ])
                  ),
                }
              })
            )
          } else {
            setSpareConsumptionTrendByStationData([])
          }

          const lowStockItems = lowStockRes?.data || []
          if (lowStockItems.length) {
            const normalizeLocationName = (name) =>
              String(name || "Unknown").replace(/\r?\n/g, " ").trim()

            const shortageByStation = {}
            lowStockItems.forEach((it) => {
              const stationName = normalizeLocationName(it?.locationName)
              const shortage = Number(it?.shortage || 0)
              shortageByStation[stationName] =
                (shortageByStation[stationName] || 0) + shortage
            })

            const topStations = Object.entries(shortageByStation)
              .sort((a, b) => b[1] - a[1])
              .map(([name]) => name)
              .filter((name) => name && name !== "undefined" && name !== "null")
              .slice(0, 3)

            if (!topStations.length) {
              setLowStockSparesAcrossStationsData([])
            } else {
              const [stationAName, stationBName, stationCName] = topStations

              const spareMap = new Map()
              lowStockItems.forEach((it) => {
                const spareName = it?.spareName || ""
                if (!spareName) return

                if (!spareMap.has(spareName)) {
                  const baseRow = { sparePart: spareName }
                  if (stationAName) baseRow[stationAName] = 0
                  if (stationBName) baseRow[stationBName] = 0
                  if (stationCName) baseRow[stationCName] = 0
                  spareMap.set(spareName, baseRow)
                }

                const row = spareMap.get(spareName)
                const stationName = normalizeLocationName(it?.locationName)
                const shortage = Number(it?.shortage || 0)

                if (stationAName && stationName === stationAName) row[stationAName] += shortage
                else if (stationBName && stationName === stationBName)
                  row[stationBName] += shortage
                else if (stationCName && stationName === stationCName)
                  row[stationCName] += shortage
              })

              const chartRows = Array.from(spareMap.values())
                .map((r) => ({
                  ...r,
                  __total:
                    (stationAName ? r[stationAName] || 0 : 0) +
                    (stationBName ? r[stationBName] || 0 : 0) +
                    (stationCName ? r[stationCName] || 0 : 0),
                }))
                .sort((a, b) => b.__total - a.__total)
                .slice(0, 6)
                .map(({ __total, ...rest }) => rest)

              setLowStockSparesAcrossStationsData(chartRows)
            }
          } else {
            setLowStockSparesAcrossStationsData([])
          }

          setAttendanceEngineerData(engineerAttendanceRes)
          setAttendanceTechnicianData(technicianAttendanceRes)
          setAttendanceTeamLeaderData(teamLeaderAttendanceRes)
          setAttendanceHelpdeskData(helpdeskAttendanceRes)
        } catch (err) {
          console.error("Failure rate API error:", err)
        } finally {
          setConsolidateChartsLoading(false)
          setAttendanceChartsLoading(false)
        }
      })()
  };

  const ecs = dashboardData?.ecs || {};

  const availability = ecs.availability ?? 0;
  const reliability = ecs.reliability ?? 0;
  const avgMtbfMins = ecs.avgMtbfMins ?? ecs.avgMtbfMinutes ?? 0;
  const avgMttrMins = ecs.avgMttrMins ?? ecs.avgMttrMinutes ?? 0;

  const failureRateBySystem = ecsFailureRateBySystemData
  const top10AssetsByFailure = ecsTop10AssetsByFailureData

  const ecsMetricBoxes = [
    { label: "Availability", value: `${availability}%` },
    { label: "Avg MTBF", value: formatHrsMins(avgMtbfMins) },
    { label: "Avg MTTR", value: `${avgMttrMins} mins` },
    { label: "Reliability", value: `${reliability}%` },
  ];

  const tvs = dashboardData?.tvs || {};

  const tvsAvailability = tvs.availability ?? 0;
  const tvsReliability = tvs.reliability ?? 0;
  const tvsAvgMtbfMins = tvs.avgMtbfMins ?? tvs.avgMtbfMinutes ?? 0;
  const tvsAvgMttrMins = tvs.avgMttrMins ?? tvs.avgMttrMinutes ?? 0;

  const tvsFailureRateBySystem = tvsFailureRateBySystemData
  const tvsTop10AssetsByFailure = tvsTop10AssetsByFailureData

  const tvsMetricBoxes = [
    { label: "Availability", value: `${tvsAvailability}%` },
    { label: "Avg MTBF", value: formatHrsMins(tvsAvgMtbfMins) },
    { label: "Avg MTTR", value: `${tvsAvgMttrMins} mins` },
    { label: "Reliability", value: `${tvsReliability}%` },
  ];

  const [scheduleTaskFrequency, setScheduleTaskFrequency] = useState("DAILY");
  const [scheduleTaskDate, setScheduleTaskDate] = useState(dayjs());
  const [scheduleTaskView, setScheduleTaskView] = useState(() => ({
    totals: { total: 0, open: 0, completed: 0, verified: 0 },
    chartData: [],
  }));

  const [scheduleTaskPmCountLoading, setScheduleTaskPmCountLoading] =
    useState(false);

  const scheduleTaskMetricBoxes = [
    { label: "Total", value: scheduleTaskView.totals.total, color: "#1677ff" },
    { label: "Open", value: scheduleTaskView.totals.open, color: "#fa8c16" },
    {
      label: "Completed",
      value: scheduleTaskView.totals.completed,
      color: "#52c41a",
    },
    {
      label: "Verified",
      value: scheduleTaskView.totals.verified,
      color: "#13c2c2",
    },
  ];

  const [scheduleTaskChartFilter, setScheduleTaskChartFilter] = useState(null);

  const scheduleTaskChartData = scheduleTaskChartFilter
    ? scheduleTaskView.chartData.filter(
      (d) => d.label === scheduleTaskChartFilter,
    )
    : scheduleTaskView.chartData;

  const handleScheduleTaskBarClick = (payload) => {
    const label = payload?.label;
    if (!label) return;
    setScheduleTaskChartFilter((prev) => (prev === label ? null : label));
  };

  const handleScheduleTaskLabelClick = (label) => {
    if (!label) return;
    setScheduleTaskChartFilter((prev) => (prev === label ? null : label));
  };

  const ScheduleTaskXAxisTick = (props) => {
    const { x, y, payload } = props;
    const label = payload?.value;
    const isActive = scheduleTaskChartFilter === label;

    return (
      <g transform={`translate(${x},${y})`} style={{ cursor: "pointer" }}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill={isActive ? "#1677ff" : "#666"}
          fontSize={12}
          fontWeight={isActive ? 700 : 400}
          onClick={() => handleScheduleTaskLabelClick(label)}
        >
          {label}
        </text>
      </g>
    );
  };

  const [correctiveTaskStatus, setCorrectiveTaskStatus] = useState("COMPLETED");
  const [correctiveTaskView, setCorrectiveTaskView] = useState(() => ({
    totals: { total: 0, open: 0, completed: 0, verified: 0 },
    chartData: [],
  }));
  const [correctiveCmGraphCountLoading, setCorrectiveCmGraphCountLoading] =
    useState(false);

  const correctiveTaskMetricBoxes = [
    {
      label: "Total",
      value: correctiveTaskView.totals.total,
      color: "#1677ff",
    },
    { label: "Open", value: correctiveTaskView.totals.open, color: "#fa8c16" },
    {
      label: "Completed",
      value: correctiveTaskView.totals.completed,
      color: "#52c41a",
    },
    {
      label: "Verified",
      value: correctiveTaskView.totals.verified,
      color: "#13c2c2",
    },
  ];

  const correctiveTaskChartData = correctiveTaskView.chartData;

  const handleCorrectiveTaskSubmit = () => {
    const selectedStatusObj = statusOptions.find(
      (s) =>
        (s?.value || s?.name || "").trim() ===
        (correctiveTaskStatus || "").trim()
    );

    const statusId = selectedStatusObj?.id;

    const selectedLocationIds =
      filterForm?.getFieldValue?.("locationIds") ?? [];

    const locationIds =
      Array.isArray(selectedLocationIds) && selectedLocationIds.length > 0
        ? selectedLocationIds
        : Array.isArray(locationOptions)
          ? locationOptions
            .map((l) => l?.id)
            .filter((id) => id !== undefined && id !== null)
          : [];

    if (!clientId || locationIds.length === 0 || !statusId) {
      setCorrectiveTaskView({
        totals: { total: 0, open: 0, completed: 0, verified: 0 },
        chartData: [],
      });
      return;
    }

    setCorrectiveCmGraphCountLoading(true);
    (async () => {
      try {
        const response = await triggerGetCmGraphCount({
          clientId,
          locationId: locationIds,
          statusId,
          tabKey: activeTab,
        }).unwrap();

        const rows = Array.isArray(response?.data) ? response.data : [];

        const chartData = rows.map((r) => ({
          label: String(r?.locationName ?? r?.locationId ?? "").trim(),
          open: r?.openCount ?? 0,
          completed: r?.completedCount ?? 0,
          verified: r?.verifiedCount ?? 0,
        }));

        const totals = chartData.reduce(
          (acc, d) => {
            acc.open += d.open || 0;
            acc.completed += d.completed || 0;
            acc.verified += d.verified || 0;
            return acc;
          },
          { open: 0, completed: 0, verified: 0 }
        );

        const total = totals.open + totals.completed + totals.verified;

        setCorrectiveTaskView({
          totals: { total, ...totals },
          chartData,
        });
      } catch (err) {
        console.error("Failed to load cmgraphcount:", err);
        setCorrectiveTaskView({
          totals: { total: 0, open: 0, completed: 0, verified: 0 },
          chartData: [],
        });
      } finally {
        setCorrectiveCmGraphCountLoading(false);
      }
    })();
  };

  const handleScheduleTaskSubmit = async () => {
    const fromDate = scheduleTaskDate?.format?.("YYYY-MM-DD");
    const toDate = scheduleTaskDate?.format?.("YYYY-MM-DD");

    const frequencyObj =
      frequencyOptions?.find((f) => f?.name === scheduleTaskFrequency) ??
      null;
    const frequencyId = frequencyObj?.id;

    const selectedLocationIds =
      filterForm?.getFieldValue?.("locationIds") ?? [];

    const locationIds =
      Array.isArray(selectedLocationIds) && selectedLocationIds.length > 0
        ? selectedLocationIds
        : Array.isArray(locationOptions)
          ? locationOptions
            .map((l) => l?.id)
            .filter((id) => id !== undefined && id !== null)
          : [];

    if (!fromDate || !toDate || !frequencyId || locationIds.length === 0) {
      setScheduleTaskView({
        totals: { total: 0, open: 0, completed: 0, verified: 0 },
        chartData: [],
      });
      setScheduleTaskChartFilter(null);
      return;
    }

    setScheduleTaskPmCountLoading(true);
    try {
      const response = await triggerGetPmCountByFrequency({
        fromDate,
        toDate,
        locationId: locationIds,
        frequencyId,
        tabKey: activeTab,
      }).unwrap();

      const rows = Array.isArray(response?.data) ? response.data : [];

      const totals = rows.reduce(
        (acc, row) => {
          acc.open += row?.openCount ?? 0;
          acc.completed += row?.completedCount ?? 0;
          acc.verified += row?.verifiedCount ?? 0;
          return acc;
        },
        { open: 0, completed: 0, verified: 0 }
      );

      const total = totals.open + totals.completed + totals.verified;

      setScheduleTaskView({
        totals: { total, ...totals },
        chartData:
          total > 0
            ? [
              { label: "Open", value: totals.open },
              { label: "Completed", value: totals.completed },
              { label: "Verified", value: totals.verified },
            ]
            : [],
      });
      setScheduleTaskChartFilter(null);
    } catch (err) {
      console.error("Failed to load PM count by frequency:", err);
      setScheduleTaskView({
        totals: { total: 0, open: 0, completed: 0, verified: 0 },
        chartData: [],
      });
      setScheduleTaskChartFilter(null);
    } finally {
      setScheduleTaskPmCountLoading(false);
    }
  };

  const handleScheduleTaskExportPdf = () => {
    console.log("Schedule Task export PDF", {
      frequency: scheduleTaskFrequency,
      date: scheduleTaskDate?.format?.("YYYY-MM-DD"),
    });
  };

  const engineerRoleBoxes = [
    { label: "ENGINEER (P/A)", value: "0/0", color: "#1677ff" },
    { label: "Helpdesk (P/A)", value: "0/0", color: "#722ed1" },
    { label: "TECHNICIAN (P/A)", value: "0/0", color: "#fa8c16" },
  ];

  const top10MostUsedSpares = topUsedSparesData;

  const spareConsumptionTrendByStation = spareConsumptionTrendByStationData;
  const spareConsumptionStationKeys =
    spareConsumptionTrendByStationData?.[0] &&
      typeof spareConsumptionTrendByStationData[0] === "object"
      ? Object.keys(spareConsumptionTrendByStationData[0]).filter(
        (k) => k !== "month"
      )
      : [];

  const spareConsumptionStationColors = [
    "#722ed1",
    "#1677ff",
    "#52c41a",
    "#fa8c16",
    "#13c2c2",
    "#eb2f96",
    "#595959",
  ];

  const lowStockSparesAcrossStations = lowStockSparesAcrossStationsData;
  const lowStockStationKeys = Array.isArray(lowStockSparesAcrossStations) &&
    lowStockSparesAcrossStations.length > 0
    ? Object.keys(lowStockSparesAcrossStations[0]).filter(
      (k) =>
        k !== "sparePart" &&
        k !== "undefined" &&
        k !== "null" &&
        k?.trim?.() !== ""
    )
    : [];

  const lowStockStationColors = [
    "#1677ff",
    "#722ed1",
    "#52c41a",
    "#fa8c16",
    "#13c2c2",
    "#595959",
  ];

  useEffect(() => {
    if (
      !scheduleTaskDate ||
      !scheduleTaskFrequency ||
      !frequencyOptions?.length ||
      !correctiveTaskStatus ||
      !statusOptions?.length
    ) {
      return;
    }

    handleScheduleTaskSubmit();
    handleCorrectiveTaskSubmit();

  }, [scheduleTaskDate, scheduleTaskFrequency, frequencyOptions, correctiveTaskStatus, statusOptions]);

  return (
    <>
      <Helmet>
        <title>{getPageTitle("dashboard")}</title>
        <meta
          name="description"
          content={`${APP_CONFIG.name} Dashboard - ${APP_CONFIG.description}`}
        />
      </Helmet>
      <Box>
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
          >
            <CircularProgress />
          </Box>
        ) : !dashboardData ? (
          <Typography>No data available</Typography>
        ) : (
          <>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Dashboard
            </Typography>

            <Tabs
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key);
                handleSearch(filterForm.getFieldsValue(), key);
                handleScheduleTaskSubmit();
                handleCorrectiveTaskSubmit();
              }}
              items={tabItems}
              style={{ marginBottom: 16 }}
            />

            <Card style={{ marginBottom: 16 }}>
              <CardContent>
                <Form
                  form={filterForm}
                  layout="inline"
                  onFinish={handleSearch}
                  initialValues={{
                    fromDate: dayjs().startOf("month"),
                    shiftId: -1,
                    locationIds: [-1],
                  }}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <Form.Item
                    name="fromDate"
                    label="From Date"
                    style={{ marginBottom: 0 }}
                    rules={[
                      { required: true, message: "Please select From Date" },
                    ]}
                  >
                    <DatePicker style={{ width: 180 }} />
                  </Form.Item>

                  <Form.Item name="shiftId" label="Shift">
                    <Select
                      placeholder="Select Shift"
                      allowClear
                      style={{ width: 200 }}
                      loading={shiftsLoading}
                      options={[
                        { label: "ALL", value: -1 },
                        ...shiftOptions.map((s) => ({
                          label: s.name,
                          value: s.id,
                        })),
                      ]}
                    />
                  </Form.Item>

                  <Form.Item name="locationIds" label="Location">
                    <Select
                      mode="multiple"
                      placeholder="Select Location"
                      allowClear
                      optionFilterProp="label"
                      maxTagCount="responsive"
                      maxTagTextLength={18}
                      loading={locationsLoading}
                      style={{ width: 360 }}
                      options={[
                        { label: "ALL", value: -1 },
                        ...locationOptions.map((l) => ({
                          label: (l.name || "").trim(),
                          value: l.id,
                        })),
                      ]}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="primary" htmlType="submit">
                      Search
                    </Button>
                  </Form.Item>
                </Form>
              </CardContent>
            </Card>

            <Box>
              <Grid container spacing={2}>
                {/* ECS Section */}
                <Grid item xs={12} md={6}>
                  <Card style={{ marginBottom: 16 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom fontWeight="bold">
                        ECS
                      </Typography>
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        {ecsMetricBoxes.map((m) => (
                          <Grid item xs={12} sm={6} md={3} key={m.label}>
                            <Card
                              sx={{
                                borderRadius: 2,
                                border: "1px solid #e5e7eb",
                                boxShadow: "none",
                                background: "#fafafa",
                              }}
                            >
                              <CardContent sx={{ py: 2 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    textTransform: "uppercase",
                                    letterSpacing: 0.6,
                                  }}
                                >
                                  {m.label}
                                </Typography>
                                <Typography
                                  variant="h6"
                                  fontWeight="bold"
                                  sx={{ mt: 0.5 }}
                                >
                                  {m.value}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>

                      <Grid container spacing={2}>
                        <Grid item xs={24} md={12}>
                          <Card
                            sx={{
                              borderRadius: 2,
                              border: "1px solid #eef2f7",
                              boxShadow: "none",
                            }}
                          >
                            <CardContent>
                              <Typography
                                variant="subtitle1"
                                gutterBottom
                                fontWeight="bold"
                              >
                                Failure Rate by System
                              </Typography>
                              {consolidateChartsLoading ? (
                                <Skeleton active style={{ height: 280 }} />
                              ) : failureRateBySystem?.length ? (
                                <RechartsResponsiveBox height={280}>
                                  <BarChart
                                    data={failureRateBySystem}
                                    margin={{
                                      top: 10,
                                      right: 20,
                                      left: 0,
                                      bottom: 10,
                                    }}
                                  >
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke="#f0f0f0"
                                    />
                                    <XAxis
                                      dataKey="system"
                                      tick={{ fontSize: 12 }}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar
                                      dataKey="failureRate"
                                      fill="#1677ff"
                                      radius={[6, 6, 0, 0]}
                                    />
                                  </BarChart>
                                </RechartsResponsiveBox>
                              ) : (
                                <Empty description="No data" />
                              )}
                            </CardContent>
                          </Card>
                        </Grid>

                        <Grid item xs={24} md={12}>
                          <Card
                            sx={{
                              borderRadius: 2,
                              border: "1px solid #eef2f7",
                              boxShadow: "none",
                            }}
                          >
                            <CardContent>
                              <Typography
                                variant="subtitle1"
                                gutterBottom
                                fontWeight="bold"
                              >
                                Top 10 Asset by Failure Count
                              </Typography>
                              {consolidateChartsLoading ? (
                                <Skeleton active style={{ height: 280 }} />
                              ) : top10AssetsByFailure?.length ? (
                                <RechartsResponsiveBox height={280}>
                                  <BarChart
                                    layout="vertical"
                                    data={top10AssetsByFailure}
                                    margin={{
                                      top: 10,
                                      right: 20,
                                      left: 10,
                                      bottom: 10,
                                    }}
                                  >
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke="#f0f0f0"
                                    />
                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                    <YAxis
                                      type="category"
                                      dataKey="asset"
                                      width={120}
                                      tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip />
                                    <Bar
                                      dataKey="failures"
                                      fill="#52c41a"
                                      radius={[0, 8, 8, 0]}
                                      barSize={14}
                                    />
                                  </BarChart>
                                </RechartsResponsiveBox>
                              ) : (
                                <Empty description="No data" />
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* TVS Section */}
                <Grid item xs={12} md={6}>
                  <Card style={{ marginBottom: 16 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom fontWeight="bold">
                        TVS
                      </Typography>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        {tvsMetricBoxes.map((m) => (
                          <Grid item xs={12} sm={6} md={3} key={m.label}>
                            <Card
                              sx={{
                                borderRadius: 2,
                                border: "1px solid #e5e7eb",
                                boxShadow: "none",
                                background: "#fafafa",
                              }}
                            >
                              <CardContent sx={{ py: 2 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    textTransform: "uppercase",
                                    letterSpacing: 0.6,
                                  }}
                                >
                                  {m.label}
                                </Typography>
                                <Typography
                                  variant="h6"
                                  fontWeight="bold"
                                  sx={{ mt: 0.5 }}
                                >
                                  {m.value}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>

                      <Grid container spacing={2}>
                        <Grid item xs={24} md={12}>
                          <Card
                            sx={{
                              borderRadius: 2,
                              border: "1px solid #eef2f7",
                              boxShadow: "none",
                            }}
                          >
                            <CardContent>
                              <Typography
                                variant="subtitle1"
                                gutterBottom
                                fontWeight="bold"
                              >
                                Failure Rate by System
                              </Typography>
                              {consolidateChartsLoading ? (
                                <Skeleton active style={{ height: 280 }} />
                              ) : tvsFailureRateBySystem?.length ? (
                                <RechartsResponsiveBox height={280}>
                                  <BarChart
                                    data={tvsFailureRateBySystem}
                                    margin={{
                                      top: 10,
                                      right: 20,
                                      left: 0,
                                      bottom: 10,
                                    }}
                                  >
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke="#f0f0f0"
                                    />
                                    <XAxis
                                      dataKey="system"
                                      tick={{ fontSize: 12 }}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar
                                      dataKey="failureRate"
                                      fill="#722ed1"
                                      radius={[6, 6, 0, 0]}
                                    />
                                  </BarChart>
                                </RechartsResponsiveBox>
                              ) : (
                                <Empty description="No data" />
                              )}
                            </CardContent>
                          </Card>
                        </Grid>

                        <Grid item xs={24} md={12}>
                          <Card
                            sx={{
                              borderRadius: 2,
                              border: "1px solid #eef2f7",
                              boxShadow: "none",
                            }}
                          >
                            <CardContent>
                              <Typography
                                variant="subtitle1"
                                gutterBottom
                                fontWeight="bold"
                              >
                                Top 10 Asset by Failure Count
                              </Typography>
                              {consolidateChartsLoading ? (
                                <Skeleton active style={{ height: 280 }} />
                              ) : tvsTop10AssetsByFailure?.length ? (
                                <RechartsResponsiveBox height={280}>
                                  <BarChart
                                    layout="vertical"
                                    data={tvsTop10AssetsByFailure}
                                    margin={{
                                      top: 10,
                                      right: 20,
                                      left: 10,
                                      bottom: 10,
                                    }}
                                  >
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke="#f0f0f0"
                                    />
                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                    <YAxis
                                      type="category"
                                      dataKey="asset"
                                      width={120}
                                      tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip />
                                    <Bar
                                      dataKey="failures"
                                      fill="#fa8c16"
                                      radius={[0, 8, 8, 0]}
                                      barSize={14}
                                    />
                                  </BarChart>
                                </RechartsResponsiveBox>
                              ) : (
                                <Empty description="No data" />
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Schedule Task Section */}
              <Card style={{ marginBottom: 16 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold" sx={{ m: 0 }}>
                      Schedule Task
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Form
                      layout="inline"
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        alignItems: "end",
                      }}
                    >
                      <Form.Item
                        label="Frequency"
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          value={scheduleTaskFrequency}
                          onChange={setScheduleTaskFrequency}
                          loading={frequenciesLoading}
                          options={(frequencyOptions?.length
                            ? frequencyOptions
                            : [{ name: scheduleTaskFrequency }]
                          ).map((f) => ({
                            label: f.name,
                            value: f.name,
                          }))}
                          style={{ width: 170 }}
                        />
                      </Form.Item>

                      <Form.Item label="Date" style={{ marginBottom: 0 }}>
                        <DatePicker
                          value={scheduleTaskDate}
                          onChange={(val) => setScheduleTaskDate(val)}
                          style={{ width: 170 }}
                        />
                      </Form.Item>

                      <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                          type="primary"
                          onClick={handleScheduleTaskSubmit}
                        >
                          Submit
                        </Button>
                      </Form.Item>

                      <Form.Item style={{ marginBottom: 0 }}>
                        <Button onClick={handleScheduleTaskExportPdf}>
                          Export PDF
                        </Button>
                      </Form.Item>
                    </Form>
                  </Box>

                  <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    {scheduleTaskMetricBoxes.map((m) => (
                      <Grid item xs={12} sm={6} md={3} key={m.label}>
                        <Card
                          sx={{
                            borderRadius: 2,
                            border: `1px solid ${m.color}26`,
                            background: `${m.color}0f`,
                            boxShadow: "none",
                          }}
                        >
                          <CardContent sx={{ py: 1.2, px: 1.6 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {m.label}
                            </Typography>
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              sx={{ color: m.color, lineHeight: 1.2 }}
                            >
                              {m.value}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  <Card
                    sx={{
                      borderRadius: 2,
                      border: "1px solid #eef2f7",
                      boxShadow: "none",
                    }}
                  >
                    <CardContent>
                      {scheduleTaskPmCountLoading ? (
                        <Skeleton active style={{ height: 320 }} />
                      ) : scheduleTaskChartData?.length ? (
                        <RechartsResponsiveBox height={320}>
                          <BarChart
                            data={scheduleTaskChartData}
                            margin={{
                              top: 10,
                              right: 20,
                              left: 0,
                              bottom: 10,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f0f0f0"
                            />
                            <XAxis
                              dataKey="label"
                              tick={ScheduleTaskXAxisTick}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar
                              dataKey="value"
                              fill="#1677ff"
                              radius={[6, 6, 0, 0]}
                              style={{ cursor: "pointer" }}
                              onClick={(data) =>
                                handleScheduleTaskBarClick(data?.payload)
                              }
                            />
                          </BarChart>
                        </RechartsResponsiveBox>
                      ) : (
                        <Empty />
                      )}
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Corrective Task - Upto Date */}
              <Card style={{ marginBottom: 16 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      mb: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold" sx={{ m: 0 }}>
                      Corrective Task
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Form
                      layout="inline"
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        alignItems: "end",
                      }}
                    >
                      <Form.Item
                        label="Status"
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          value={correctiveTaskStatus}
                          onChange={setCorrectiveTaskStatus}
                          loading={statusesLoading}
                          style={{ width: 200 }}
                          options={
                            correctiveStatusSelectOptions?.length
                              ? correctiveStatusSelectOptions
                              : [
                                { label: "OPEN", value: "OPEN" },
                                { label: "COMPLETED", value: "COMPLETED" },
                                { label: "VERIFIED", value: "VERIFIED" },
                              ]
                          }
                        />
                      </Form.Item>

                      <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                          type="primary"
                          onClick={handleCorrectiveTaskSubmit}
                        >
                          Submit
                        </Button>
                      </Form.Item>
                    </Form>
                  </Box>

                  <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    {correctiveTaskMetricBoxes.map((m) => (
                      <Grid item xs={12} sm={6} md={3} key={m.label}>
                        <Card
                          sx={{
                            borderRadius: 2,
                            border: `1px solid ${m.color}26`,
                            background: `${m.color}0f`,
                            boxShadow: "none",
                          }}
                        >
                          <CardContent sx={{ py: 1.2, px: 1.6 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {m.label}
                            </Typography>
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              sx={{ color: m.color, lineHeight: 1.2 }}
                            >
                              {m.value}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  <Card
                    sx={{
                      borderRadius: 2,
                      border: "1px solid #eef2f7",
                      boxShadow: "none",
                    }}
                  >
                    <CardContent>
                      {correctiveCmGraphCountLoading ? (
                        <Skeleton active style={{ height: 320 }} />
                      ) : correctiveTaskChartData?.length ? (
                        <RechartsResponsiveBox height={320}>
                          <BarChart
                            data={correctiveTaskChartData}
                            margin={{
                              top: 10,
                              right: 20,
                              left: 0,
                              bottom: 10,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f0f0f0"
                            />
                            <XAxis
                              dataKey="label"
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar
                              dataKey="open"
                              stackId="a"
                              fill="#fa8c16"
                              radius={[6, 6, 0, 0]}
                            />
                            <Bar
                              dataKey="completed"
                              stackId="a"
                              fill="#52c41a"
                            />
                            <Bar
                              dataKey="verified"
                              stackId="a"
                              fill="#13c2c2"
                            />
                          </BarChart>
                        </RechartsResponsiveBox>
                      ) : (
                        <Empty />
                      )}
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Spares Usage & Trend */}
              <Card style={{ marginBottom: 16 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Card
                        sx={{
                          borderRadius: 2,
                          border: "1px solid #eef2f7",
                          boxShadow: "none",
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            gutterBottom
                            fontWeight="bold"
                          >
                            Top 10 Most Used Spares
                          </Typography>
                          {consolidateChartsLoading ? (
                            <Skeleton active style={{ height: 340 }} />
                          ) : top10MostUsedSpares?.length ? (
                            <RechartsResponsiveBox height={340}>
                              <BarChart
                                layout="vertical"
                                data={top10MostUsedSpares}
                                margin={{
                                  top: 10,
                                  right: 20,
                                  left: 10,
                                  bottom: 10,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#f0f0f0"
                                />
                                <XAxis
                                  type="number"
                                  domain={[0, 60]}
                                  ticks={[0, 20, 40, 60]}
                                  tick={{ fontSize: 12 }}
                                  label={{
                                    value: "Number of time used",
                                    position: "insideBottom",
                                    offset: -6,
                                  }}
                                />
                                <YAxis
                                  type="category"
                                  dataKey="sparePart"
                                  width={140}
                                  tick={{ fontSize: 12 }}
                                  label={{
                                    value: "Spare part",
                                    angle: -90,
                                    position: "insideLeft",
                                  }}
                                />
                                <Tooltip />
                                <Bar
                                  dataKey="timesUsed"
                                  fill="#1677ff"
                                  radius={[0, 8, 8, 0]}
                                  barSize={14}
                                />
                              </BarChart>
                            </RechartsResponsiveBox>
                          ) : (
                            <Empty description="No data" />
                          )}
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Card
                        sx={{
                          borderRadius: 2,
                          border: "1px solid #eef2f7",
                          boxShadow: "none",
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            gutterBottom
                            fontWeight="bold"
                          >
                            Spare Consumption Trend by Station
                          </Typography>
                          {consolidateChartsLoading ? (
                            <Skeleton active style={{ height: 340 }} />
                          ) : spareConsumptionTrendByStation?.length ? (
                            <RechartsResponsiveBox height={340}>
                              <LineChart
                                data={spareConsumptionTrendByStation}
                                margin={{
                                  top: 10,
                                  right: 20,
                                  left: 0,
                                  bottom: 10,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#f0f0f0"
                                />
                                <XAxis
                                  dataKey="month"
                                  tick={{ fontSize: 12 }}
                                  label={{
                                    value: "Month",
                                    position: "insideBottom",
                                    offset: -6,
                                  }}
                                />
                                <YAxis
                                  tick={{ fontSize: 12 }}
                                  ticks={[0, 8, 16, 24, 32]}
                                  label={{
                                    value: "Units consumed",
                                    angle: -90,
                                    position: "insideLeft",
                                  }}
                                />
                                <Tooltip />
                                {spareConsumptionStationKeys.map(
                                  (stationKey, idx) => (
                                    <Line
                                      key={stationKey}
                                      type="monotone"
                                      dataKey={stationKey}
                                      name={stationKey}
                                      stroke={
                                        spareConsumptionStationColors[
                                        idx %
                                        spareConsumptionStationColors
                                          .length
                                        ]
                                      }
                                      strokeWidth={2}
                                      dot={{ r: 2 }}
                                      activeDot={{ r: 4 }}
                                    />
                                  )
                                )}
                              </LineChart>
                            </RechartsResponsiveBox>
                          ) : (
                            <Empty description="No data" />
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card style={{ marginBottom: 16 }}>
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    fontWeight="bold"
                  >
                    Low in Stock Spares Across Stations
                  </Typography>
                  {consolidateChartsLoading ? (
                    <Skeleton active style={{ height: 340 }} />
                  ) : lowStockSparesAcrossStations?.length ? (
                    <RechartsResponsiveBox height={340}>
                      <BarChart
                        layout="vertical"
                        data={lowStockSparesAcrossStations}
                        margin={{ top: 10, right: 20, left: 40, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={{ fontSize: 12 }}
                          label={{
                            value: "Quantity (units)",
                            position: "insideBottom",
                            offset: -10,
                          }}
                        />
                        <YAxis
                          type="category"
                          dataKey="sparePart"
                          tick={{ fontSize: 12 }}
                          width={150}   // 👈 increase if names are long
                        />
                        <Tooltip />
                        {lowStockStationKeys.map((stationKey, idx) => (
                          <Bar
                            key={stationKey}
                            dataKey={stationKey}
                            name={stationKey}
                            fill={
                              lowStockStationColors[
                              idx % lowStockStationColors.length
                              ]
                            }
                            radius={[0, 10, 10, 0]}
                            barSize={12}
                          />
                        ))}
                      </BarChart>
                    </RechartsResponsiveBox>
                  ) : (
                    <Empty description="No data" />
                  )}
                </CardContent>
              </Card>

              {/* Attendance charts */}
              <Card style={{ marginBottom: 16 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Card
                        sx={{
                          borderRadius: 2,
                          border: "1px solid #eef2f7",
                          boxShadow: "none",
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            gutterBottom
                            fontWeight="bold"
                          >
                            Attendance / ENGINEER
                          </Typography>
                          {attendanceChartsLoading ? (
                            <Skeleton active style={{ height: 260 }} />
                          ) : attendanceEngineerData?.length ? (
                            <RechartsResponsiveBox height={260}>
                              <BarChart
                                data={attendanceEngineerData}
                                margin={{
                                  top: 10,
                                  right: 20,
                                  left: 0,
                                  bottom: 10,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#f0f0f0"
                                />
                                <XAxis
                                  dataKey="label"
                                  tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                  tick={{ fontSize: 12 }}
                                  domain={[0, 2]}
                                  ticks={[0.0, 0.4, 0.8, 1.2, 1.6, 2.0]}
                                />
                                <Tooltip />
                                <Bar
                                  dataKey="value"
                                  fill="#1677ff"
                                  radius={[10, 10, 0, 0]}
                                />
                              </BarChart>
                            </RechartsResponsiveBox>
                          ) : (
                            <Empty />
                          )}
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Card
                        sx={{
                          borderRadius: 2,
                          border: "1px solid #eef2f7",
                          boxShadow: "none",
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            gutterBottom
                            fontWeight="bold"
                          >
                            Attendance / TECHNICIAN
                          </Typography>
                          {attendanceChartsLoading ? (
                            <Skeleton active style={{ height: 260 }} />
                          ) : attendanceTechnicianData?.length ? (
                            <RechartsResponsiveBox height={260}>
                              <BarChart
                                data={attendanceTechnicianData}
                                margin={{
                                  top: 10,
                                  right: 20,
                                  left: 0,
                                  bottom: 10,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#f0f0f0"
                                />
                                <XAxis
                                  dataKey="label"
                                  tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                  tick={{ fontSize: 12 }}
                                  domain={[0, 2]}
                                  ticks={[0.0, 0.4, 0.8, 1.2, 1.6, 2.0]}
                                />
                                <Tooltip />
                                <Bar
                                  dataKey="value"
                                  fill="#52c41a"
                                  radius={[10, 10, 0, 0]}
                                />
                              </BarChart>
                            </RechartsResponsiveBox>
                          ) : (
                            <Empty />
                          )}
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Card
                        sx={{
                          borderRadius: 2,
                          border: "1px solid #eef2f7",
                          boxShadow: "none",
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            gutterBottom
                            fontWeight="bold"
                          >
                            Attendance / Team Leader
                          </Typography>
                          {attendanceChartsLoading ? (
                            <Skeleton active style={{ height: 260 }} />
                          ) : attendanceTeamLeaderData?.length ? (
                            <RechartsResponsiveBox height={260}>
                              <BarChart
                                data={attendanceTeamLeaderData}
                                margin={{
                                  top: 10,
                                  right: 20,
                                  left: 0,
                                  bottom: 10,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#f0f0f0"
                                />
                                <XAxis
                                  dataKey="label"
                                  tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                  tick={{ fontSize: 12 }}
                                  domain={[0, 2]}
                                  ticks={[0.0, 0.4, 0.8, 1.2, 1.6, 2.0]}
                                />
                                <Tooltip />
                                <Bar
                                  dataKey="value"
                                  fill="#722ed1"
                                  radius={[10, 10, 0, 0]}
                                />
                              </BarChart>
                            </RechartsResponsiveBox>
                          ) : (
                            <Empty />
                          )}
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Card
                        sx={{
                          borderRadius: 2,
                          border: "1px solid #eef2f7",
                          boxShadow: "none",
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            gutterBottom
                            fontWeight="bold"
                          >
                            Attendance / Helpdesk
                          </Typography>
                          {attendanceChartsLoading ? (
                            <Skeleton active style={{ height: 260 }} />
                          ) : attendanceHelpdeskData?.length ? (
                            <RechartsResponsiveBox height={260}>
                              <BarChart
                                data={attendanceHelpdeskData}
                                margin={{
                                  top: 10,
                                  right: 20,
                                  left: 0,
                                  bottom: 10,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#f0f0f0"
                                />
                                <XAxis
                                  dataKey="label"
                                  tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                  tick={{ fontSize: 12 }}
                                  domain={[0, 2]}
                                  ticks={[0.0, 0.4, 0.8, 1.2, 1.6, 2.0]}
                                />
                                <Tooltip />
                                <Bar
                                  dataKey="value"
                                  fill="#13c2c2"
                                  radius={[10, 10, 0, 0]}
                                />
                              </BarChart>
                            </RechartsResponsiveBox>
                          ) : (
                            <Empty />
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* ENGINEER Section */}
              <Card style={{ marginBottom: 16 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    {engineerRoleBoxes.map((m) => (
                      <Grid item xs={12} md={4} key={m.label}>
                        <Card
                          sx={{
                            borderRadius: 3,
                            border: `1px solid ${m.color}40`,
                            boxShadow: "none",
                            background: `linear-gradient(135deg, ${m.color}14 0%, rgba(255,255,255,0.85) 55%, ${m.color}10 100%)`,
                            backdropFilter: "blur(8px)",
                          }}
                        >
                          <CardContent
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              py: 1.4,
                            }}
                          >
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                background: `${m.color}22`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <UserOutlined
                                style={{ fontSize: 18, color: m.color }}
                              />
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                minWidth: 0,
                              }}
                            >
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                sx={{ lineHeight: 1.2 }}
                              >
                                {m.label}
                              </Typography>
                              <Typography
                                variant="h6"
                                fontWeight="bold"
                                sx={{
                                  mt: 0.5,
                                  lineHeight: 1.1,
                                  color: m.color,
                                }}
                              >
                                {m.value}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          </>
        )}
      </Box>
    </>
  );
}
