import { useState, useEffect, useRef } from "react"
import { Box, Card, CardContent } from "@mui/material"
import { Space, Select, Spin, Button as AntButton } from "antd"
import { FilePdfOutlined } from "@ant-design/icons"
import { useGetAssetsLocationWiseQuery, useGetLocationListQuery } from '../../../store/api/masterSettings.api'
import { useAuth } from '../../../context/AuthContext'
import { useReactToPrint } from "react-to-print"
import { QRCodeCanvas } from "qrcode.react"

export default function AssetQrCode() {

    const { user } = useAuth()
    const printRef = useRef(null)
    const clientId = user?.client?.id || user?.clientId

    const [selectedHeaderLocationId, setSelectedHeaderLocationId] = useState(null);

    const { data: assetsListData, isLoading: assetsListLoading, isFetching } = useGetAssetsLocationWiseQuery({ clientId, pageNumber: 1, pageSize: 1000, locationId: selectedHeaderLocationId }, { skip: !selectedHeaderLocationId })
    const { data: locationList, loading: locationListLoading } = useGetLocationListQuery({ clientId, pageNumber: 1, pageSize: 1000 })

    useEffect(() => {
        const list = locationList?.data?.content;

        if (list?.length > 0) {
            setSelectedHeaderLocationId(list[0]?.id)
        }
    }, [locationList])

    const handleHeaderLocationChange = (roleId) => {
        console.log("role id:", roleId)
        setSelectedHeaderLocationId(roleId);
    }

    const handlePrint = useReactToPrint({
        contentRef: printRef
    });

    return (
        <>
            <Box>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Space>
                                <Select
                                    onChange={(value) => handleHeaderLocationChange(value)}
                                    placeholder="Select Location"
                                    style={{ width: 220 }}
                                    value={selectedHeaderLocationId}
                                >
                                    <Select.Option key={-1} value={-1}>All Location</Select.Option>
                                    {locationList?.data?.content?.map(l => (
                                        <Select.Option key={l.id} value={l.id}>
                                            {l.name}
                                        </Select.Option>
                                    ))}
                                </Select>
                                <AntButton
                                    icon={<FilePdfOutlined />}
                                    onClick={handlePrint}
                                    disabled={!assetsListData || assetsListData?.data?.content?.length === 0}
                                >
                                    Export PDF
                                </AntButton>
                            </Space>
                        </Box>
                        {(assetsListLoading || isFetching) ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <Spin />
                            </Box>
                        ) : (
                            <div ref={printRef}>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(4, 1fr)",
                                    gap: 4
                                }}
                            >
                                {assetsListData?.data?.content?.map((asset) => (
                                    <Box
                                        key={asset.assetId}
                                        sx={{
                                            border: "1px solid #eee",
                                            borderRadius: 2,
                                            padding: 2,
                                            textAlign: "center",
                                            backgroundColor: "#fff"
                                        }}
                                    >
                                        <QRCodeCanvas
                                            value={`AST_${asset.assetId}`}
                                            size={140}
                                        />

                                        <Box sx={{ mt: 2, fontWeight: 600 }}>
                                            {asset.locationName}
                                        </Box>

                                        <Box sx={{ fontSize: 13, color: "#555" }}>
                                            {asset.assetName}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </>
    )
}