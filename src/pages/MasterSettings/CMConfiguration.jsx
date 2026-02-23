import { Helmet } from 'react-helmet-async'
import { Box } from '@mui/material'
import { Tabs } from 'antd'
import { BellOutlined, ApartmentOutlined, BlockOutlined, ContactsOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import FaultCategory from './CmConfigMenuPages/FaultCategory'
import FaultSubCategory from './CmConfigMenuPages/FaultSubCategory'
import ExternalVendor from './CmConfigMenuPages/ExternalVendor'
import Priority from './CmConfigMenuPages/Priority'

export default function CMConfiguration() {

  const onChangeTab = (key) => {
    console.log('Tab changed to:', key)
  }

  const items = [
    {
      key: '1',
      label: 'Fault Category',
      children: <FaultCategory />,
      icon: <BlockOutlined />,
    },
    {
      key: '2',
      label: 'Fault Sub Category',
      children: <FaultSubCategory />,
      icon: <ApartmentOutlined />,
    },
    {
      key: '3',
      label: 'External Vendor',
      children: <ExternalVendor />,
      icon: <ContactsOutlined />,
    },
    {
      key: '4',
      label: 'Priority',
      children: <Priority />,
      icon: <BellOutlined />,
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('master-settings/cm-configuration')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - CM Configuration Settings`} />
      </Helmet>
      <Box>
        <Tabs defaultActiveKey="1" items={items} onChange={onChangeTab} tabBarClassName="custom-tabs" />
      </Box>
    </>
  )
}

