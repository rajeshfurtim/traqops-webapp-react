import { Helmet } from 'react-helmet-async'
import { Box } from '@mui/material'
import { Tabs } from 'antd'
import { EnvironmentOutlined, TagsOutlined, PushpinOutlined, BulbOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import LocationGroups from './LocationMenuPages/LocationGroups'
import Location from './LocationMenuPages/Location'

export default function LocationMaster() {

  const onChangeTab = (key) => {
    console.log('Tab changed to:', key)
  }

  const items = [
    {
      key: '1',
      label: 'Location Groups',
      children: <LocationGroups />,
      icon: <TagsOutlined />,
    },
    {
      key: '2',
      label: 'Location',
      children: <Location />,
      icon: <EnvironmentOutlined />,
    },
    {
      key: '3',
      label: 'Area',
      children: 'Area',
      icon: <PushpinOutlined />,
    },
    {
      key: '4',
      label: 'Sub Area',
      children: 'Sub Area',
      icon: <BulbOutlined />,
    }
  ];

  return (
    <>
      <Helmet>
        <title>{getPageTitle('master-settings/location')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Location Master Settings`} />
      </Helmet>
      <Box>
        <Tabs defaultActiveKey="1" items={items} onChange={onChangeTab} tabBarClassName="custom-tabs" />
      </Box>
    </>
  )
}

