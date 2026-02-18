import { Helmet } from 'react-helmet-async'
import { Box } from '@mui/material'
import { Tabs } from 'antd'
import { ProjectOutlined, ShoppingCartOutlined, QrcodeOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import AssetCategory from './AssetManuPages/AssetCategory'
import Asset from './AssetManuPages/Asset'

export default function AssetsMaster() {

  const onChangeTab = (key) => {
    console.log('Tab changed to:', key)
  }

  const items = [
    {
      key: '1',
      label: 'Asset - Category',
      children: <AssetCategory />,
      icon: <ProjectOutlined />,
    },
    {
      key: '2',
      label: 'Asset',
      children: <Asset />,
      icon: <ShoppingCartOutlined />,
    },
    {
      key: '3',
      label: 'Asset QR Codes',
      children: 'Asset QR Codes Content',
      icon: <QrcodeOutlined />,
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('master-settings/assets')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Assets Master Settings`} />
      </Helmet>
      <Box>
        <Tabs defaultActiveKey="1" items={items} onChange={onChangeTab} tabBarClassName="custom-tabs" />
      </Box>
    </>
  )
}

