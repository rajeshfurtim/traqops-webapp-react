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
      path: '/reports/operation-checklist/water-cooled-chillers'
    },
    {
      title: '6. Daily Checks for Pumps - Operation',
      path: '/reports/operation-checklist/chiller-monitoring'
    },
    {
      title: '7. Daily Checks for Cooling Tower - Operation',
      path: '/reports/operation-checklist/chiller-monitoring'
    },
    {
      title: '8. Daily Checks for AHU - Operation',
      path: '/reports/operation-checklist/chiller-monitoring'
    },
    {
      title: '9. Daily Checks for all Ventilation Fans - Operation',
      path: '/reports/operation-checklist/chiller-monitoring'
    },
    {
      title: '10. Daily Checks for FCU- Operation System',
      path: '/reports/operation-checklist/chiller-monitoring'
    },
    {
      title: '11. Daily Electrical Panel Monitoring - Operation',
      path: '/reports/operation-checklist/chiller-monitoring'
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
                  onClick={() => navigate(item.path)}
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

