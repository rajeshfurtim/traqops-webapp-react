import { Helmet } from 'react-helmet-async'
import { Box } from '@mui/material'
import { Tabs } from 'antd'
import { HddOutlined, FormatPainterOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import InventoryCategory from './InventoryMenuPages/InventoryCategory'
import Inventory from './InventoryMenuPages/Inventory'

export default function InventoryMaster() {

  const onChangeTab = (key) => {
    console.log('Tab changed to:', key)
  }

  const items = [
    {
      key: '1',
      label: 'Inventory Category',
      children: <InventoryCategory />,
      icon: <HddOutlined />,
    },
    {
      key: '2',
      label: 'Inventory',
      children: <Inventory />,
      icon: <FormatPainterOutlined />,
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('master-settings/inventory')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Inventory Master Settings`} />
      </Helmet>
      <Box>
        <Tabs defaultActiveKey="1" items={items} onChange={onChangeTab} tabBarClassName="custom-tabs" />
      </Box>
    </>
  )
}

