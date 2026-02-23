import { Helmet } from 'react-helmet-async'
import { Box } from '@mui/material'
import { Tabs } from 'antd'
import { DeploymentUnitOutlined, MergeOutlined, PartitionOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import KPIsType from './KPIsMenuPages/KPIsType'
import KPIsCategory from './KPIsMenuPages/KPIsCategory'
import KPIs from './KPIsMenuPages/KPIs'

export default function KPIsMaster() {

  const onChangeTab = (key) => {
    console.log('Tab changed to:', key)
  }

  const items = [
    {
      key: '1',
      label: 'KPIs Type',
      children: <KPIsType />,
      icon: <MergeOutlined />,
    },
    {
      key: '2',
      label: 'KPIs Category',
      children: <KPIsCategory />,
      icon: <PartitionOutlined />,
    },
    {
      key: '3',
      label: 'KPIs',
      children: <KPIs />,
      icon: <DeploymentUnitOutlined />,
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('master-settings/kpis')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - KPIs Master Settings`} />
      </Helmet>
      <Box>
        <Tabs defaultActiveKey="1" items={items} onChange={onChangeTab} tabBarClassName="custom-tabs" />
      </Box>
    </>
  )
}

