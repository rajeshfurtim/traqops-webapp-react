import { Helmet } from 'react-helmet-async'
import { Box } from '@mui/material'
import { Tabs } from 'antd'
import { ScheduleOutlined, CheckSquareOutlined, AuditOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import CheckListType from './CheckListMenuPages/CheckListType'
import CheckList from './CheckListMenuPages/CheckList'

export default function ChecklistMaster() {

  const onChangeTab = (key) => {
    console.log('Tab changed to:', key)
  }

  const items = [
    {
      key: '1',
      label: 'Check List Type',
      children: <CheckListType />,
      icon: <CheckSquareOutlined />,
    },
    {
      key: '2',
      label: 'Check List',
      children: <CheckList />,
      icon: <ScheduleOutlined />,
    },
    {
      key: '3',
      label: 'Check List Elements',
      children: 'Check List Elements Content',
      icon: <AuditOutlined />,
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('master-settings/checklist')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Checklist Master Settings`} />
      </Helmet>
      <Box>
        <Tabs defaultActiveKey="1" items={items} onChange={onChangeTab} tabBarClassName="custom-tabs" />
      </Box>
    </>
  )
}

