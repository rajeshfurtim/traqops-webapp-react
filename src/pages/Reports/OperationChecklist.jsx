import { Helmet } from 'react-helmet-async'
import { Box, Card, CardContent } from '@mui/material'
import { List } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import { useNavigate } from 'react-router-dom'

export default function OperationChecklist() {

  const navigate = useNavigate()

  const data = [
    {
      title: '1. Chiller Monitoring Checklist - Operation',
      path: '/reports/operation-checklist/chiller-monitoring'
    },
    {
      title: '2. Shift Starting Checklist VAC & TVS - Operation',
      path: '/reports/operation-checklist/shift-starting'
    },
    {
      title: '3. Critical Room Temp monitoring - Operation',
      path: '/reports/operation-checklist/critical-temp'
    },
    {
      title: '4. Daily Closing Reading Checklist and Consumption - Operation',
      path: '/reports/operation-checklist/closing-reading'
    },
    {
      title: '5. Daily Checks for Water Cooled Chillers - Operation',
      checklistId: 47774,
      assetCategoryId: [11887]
    },
    {
      title: '6. Daily Checks for Pumps - Operation',
      checklistId: 314742,
      assetCategoryId: [54045, 314516]
    },
    {
      title: '7. Daily Checks for Cooling Tower - Operation',
      checklistId: 61212,
      assetCategoryId: [54027]
    },
    {
      title: '8. Daily Checks for AHU - Operation',
      checklistId: 47900,
      assetCategoryId: [11890]
    },
    {
      title: '9. Daily Checks for all Ventilation Fans - Operation',
      checklistId: 61248,
      assetCategoryId: [313840, 314525, 314550, 314551, 314545]
    },
    {
      title: '10. Daily Checks for FCU- Operation System',
      checklistId: 54700,
      assetCategoryId: [11893]
    },
    {
      title: '11. Daily Electrical Panel Monitoring - Operation',
      path: '/reports/operation-checklist/electrical-panel'
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('reports/operation-checklist')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Operation Checklist`} />
      </Helmet>
      <Box>
        {/* <Typography variant="h4" gutterBottom fontWeight="bold">
          Operation Checklist
        </Typography> */}

        <Card>
          <CardContent>
            <List
              itemLayout="horizontal"
              dataSource={data}
              renderItem={(item) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    if (item.path) {
                      navigate(item.path)
                    } else {
                      navigate(
                        `/reports/operation-checklist/daily-checks/${item.checklistId}/${item.assetCategoryId.join(",")}`
                      )
                    }
                  }}
                  actions={[<ArrowRightOutlined />]}
                  className="checklist-item"
                >
                  <List.Item.Meta
                    title={<span>{item.title}</span>}
                  />
                </List.Item>
              )}
            />
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

