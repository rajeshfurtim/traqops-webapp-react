import { Helmet } from 'react-helmet-async'
import { Box } from '@mui/material'
import { Tabs } from 'antd'
import { FieldTimeOutlined, ScheduleOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import Shift from './ShiftMenuPages/Shift'
import ShiftLocationMapping from './ShiftMenuPages/ShiftLocationMapping'

export default function ShiftsMaster() {

  const onChangeTab = (key) => {
    console.log('Tab changed to:', key)
  }

  const items = [
    {
      key: '1',
      label: 'Shift',
      children: <Shift />,
      icon: <FieldTimeOutlined />,
    },
    {
      key: '2',
      label: 'Shift Location Mapping',
      children: <ShiftLocationMapping />,
      icon: <ScheduleOutlined />,
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('master-settings/shifts')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Shifts Master Settings`} />
      </Helmet>
      <Box>
        <Tabs defaultActiveKey="1" items={items} onChange={onChangeTab} tabBarClassName="custom-tabs" />
      </Box>
    </>
  )
}

