import { Helmet } from 'react-helmet-async'
import { Box } from '@mui/material'
import { Tabs } from 'antd'
import { UserAddOutlined, SolutionOutlined, FileSearchOutlined, ToolOutlined, BulbOutlined } from '@ant-design/icons'
import { getPageTitle, APP_CONFIG } from '../../config/constants'
import User from './UserMenuPages/User'
import UserType from './UserMenuPages/UserType'
import Department from './UserMenuPages/Department'
import Skill from './UserMenuPages/Skill'
import SkillLevel from './UserMenuPages/SkillLevel'

export default function UserMaster() {

  const onChangeTab = (key) => {
    console.log('Tab changed to:', key)
  }

  const items = [
    {
      key: '1',
      label: 'User',
      children: <User />,
      icon: <UserAddOutlined />,
    },
    {
      key: '2',
      label: 'User Type',
      children: <UserType />,
      icon: <SolutionOutlined />,
    },
    {
      key: '3',
      label: 'Department',
      children: <Department />,
      icon: <FileSearchOutlined />,
    },
    {
      key: '4',
      label: 'Skill',
      children: <Skill />,
      icon: <ToolOutlined />,
    },
    {
      key: '5',
      label: 'Skill Level',
      children: <SkillLevel />,
      icon: <BulbOutlined />,
    }
  ];

  return (
    <>
      <Helmet>
        <title>{getPageTitle('master-settings/user')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - User Master Settings`} />
      </Helmet>
      <Box>

        <Tabs defaultActiveKey="1" items={items} onChange={onChangeTab} tabBarClassName="custom-tabs" />
      </Box>
    </>
  )
}

