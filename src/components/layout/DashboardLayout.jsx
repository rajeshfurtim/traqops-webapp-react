import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Breadcrumb, Tooltip } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DashboardOutlined,
  ToolOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  DollarOutlined,
  FolderOpenOutlined,
  ThunderboltOutlined,
  DesktopOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  UnorderedListOutlined,
  ApiOutlined,
  LineChartOutlined,
  EnvironmentOutlined,
  SwapOutlined,
  TeamOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  BuildOutlined,
  AppstoreOutlined
} from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'
import { useSidebar } from '../../context/SidebarContext'
import { sidebarMenuConfig, getBreadcrumbsFromPath } from '../../config/sidebarMenu'
import { APP_CONFIG } from '../../config/constants'
import EllipsisTooltip from '../EllipsisTooltip'
import clsx from 'clsx'
import './DashboardLayout.css'

const { Header, Sider, Content } = Layout

// Icon mapping - only valid AntD icons
const iconMap = {
  DashboardOutlined,
  ToolOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  DollarOutlined,
  FolderOpenOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  DesktopOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  UnorderedListOutlined,
  ApiOutlined,
  LineChartOutlined,
  UserOutlined,
  EnvironmentOutlined,
  SwapOutlined,
  TeamOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  BuildOutlined
}

// Fallback icon for missing icons
const DefaultIcon = AppstoreOutlined

// Convert menu config to AntD Menu items format
const convertMenuConfigToItems = (config) => {
  return config.map(item => {
    if (item.type === 'divider') {
      return { type: 'divider' }
    }

    const IconComponent = iconMap[item.icon]
    
    // Safe icon handling with fallback
    if (!IconComponent) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[Sidebar] Icon "${item.icon}" not found in iconMap for menu item "${item.label}". Using fallback icon.`
        )
      }
    }
    
    const menuItem = {
      key: item.key,
      icon: IconComponent ? <IconComponent /> : <DefaultIcon />,
      label: <EllipsisTooltip text={item.label} />
    }

    if (item.children) {
      menuItem.children = convertMenuConfigToItems(item.children)
    }

    return menuItem
  })
}

// Find open keys based on current path
const getOpenKeysFromPath = (pathname) => {
  const openKeys = []
  const pathParts = pathname.split('/').filter(Boolean)
  
  if (pathParts.length > 0) {
    let currentPath = ''
    pathParts.forEach((part, index) => {
      if (index === 0) {
        currentPath = `/${part}`
      } else {
        currentPath += `/${part}`
      }
      openKeys.push(currentPath)
    })
  }
  
  return openKeys
}

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { collapsed, toggleSidebar } = useSidebar()
  const [selectedKeys, setSelectedKeys] = useState([location.pathname])
  const [openKeys, setOpenKeys] = useState(() => getOpenKeysFromPath(location.pathname))

  useEffect(() => {
    setSelectedKeys([location.pathname])
    setOpenKeys(getOpenKeysFromPath(location.pathname))
  }, [location.pathname])

  const handleMenuClick = ({ key }) => {
    const findPathByKey = (items, targetKey) => {
      for (const item of items) {
        if (item.key === targetKey) {
          return item.path
        }
        if (item.children) {
          const found = findPathByKey(item.children, targetKey)
          if (found) return found
        }
      }
      return null
    }

    const path = findPathByKey(sidebarMenuConfig, key)
    if (path) {
      navigate(path)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const breadcrumbs = getBreadcrumbsFromPath(location.pathname)

  const handleUserMenuClick = ({ key }) => {
    if (key === 'profile') {
      navigate('/profile')
    } else if (key === 'settings') {
      navigate('/settings')
    } else if (key === 'logout') {
      handleLogout()
    }
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true
    }
  ]

  const menuItems = convertMenuConfigToItems(sidebarMenuConfig)

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768 && !collapsed) {
        toggleSidebar()
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [collapsed, toggleSidebar])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        collapsedWidth={80}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100
        }}
        className="traqops-sidebar"
      >
        <div className={clsx('sidebar-logo', { collapsed })}>
          {collapsed ? (
            <img src="/assets/traqopsLogo.png" alt="TraqOps Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/assets/traqopsLogo.png" alt="TraqOps Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
              <div className="logo-text">{APP_CONFIG.name}</div>
            </div>
          )}
        </div>
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            height: 'calc(100vh - 64px)',
            borderRight: 0
          }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 99
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Tooltip title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}>
              <div
                onClick={toggleSidebar}
                style={{
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 4,
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </div>
            </Tooltip>
            <Breadcrumb
              items={breadcrumbs.map((crumb, index) => ({
                title: index === 0 ? (
                  <span onClick={() => navigate(crumb.path)} style={{ cursor: 'pointer' }}>
                    {crumb.label}
                  </span>
                ) : index === breadcrumbs.length - 1 ? (
                  <span>{crumb.label}</span>
                ) : (
                  <span onClick={() => navigate(crumb.path)} style={{ cursor: 'pointer', color: '#1890ff' }}>
                    {crumb.label}
                  </span>
                )
              }))}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ display: window.innerWidth > 600 ? 'block' : 'none' }}>{user?.name}</span>
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar style={{ backgroundColor: '#1890ff' }}>
                  {user?.name?.charAt(0)}
                </Avatar>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#f5f5f5',
            minHeight: 'calc(100vh - 112px)',
            borderRadius: 8
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
