import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Breadcrumb, Tooltip, Select, Tag, Spin } from 'antd'
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
import { useClient } from '../../context/ClientContext'
import { sidebarMenuConfig, getBreadcrumbsFromPath } from '../../config/sidebarMenu'
import { APP_CONFIG } from '../../config/constants'
import { apiService } from '../../services/api'
import { domainName } from '../../config/apiConfig'
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
  const { clientId, changeClient, isChanging } = useClient()
  const [selectedKeys, setSelectedKeys] = useState([location.pathname])
  const [openKeys, setOpenKeys] = useState(() => getOpenKeysFromPath(location.pathname))
  const [clients, setClients] = useState([])
  const [clientsLoading, setClientsLoading] = useState(true)

  // Use menu config directly without client filtering
  const filteredMenuConfig = sidebarMenuConfig

  useEffect(() => {
    setSelectedKeys([location.pathname])
    setOpenKeys(getOpenKeysFromPath(location.pathname))
  }, [location.pathname])

  // Fetch clients from API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setClientsLoading(true)
        const domainNameParam = user?.domain?.name || domainName
        
        const response = await apiService.getAllClientList({
          domainName: domainNameParam,
          pageNumber: 1,
          pageSize: 1000
        })

        if (response.success && response.data?.content) {
          setClients(response.data.content)
        } else {
          console.error('Failed to fetch clients:', response.message)
          setClients([])
        }
      } catch (error) {
        console.error('Error fetching clients:', error)
        setClients([])
      } finally {
        setClientsLoading(false)
      }
    }

    if (user) {
      fetchClients()
    }
  }, [user])

  // Default client selection:
  // If API returns clients and no client is selected yet, auto-select the first client.
  useEffect(() => {
    if (!clientsLoading && !isChanging && !clientId && Array.isArray(clients) && clients.length > 0) {
      const firstClientId = Number(clients[0]?.id)
      if (firstClientId !== undefined && firstClientId !== null) {
        changeClient(firstClientId)
      }
    }
  }, [clientsLoading, isChanging, clientId, clients, changeClient])


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

    const path = findPathByKey(filteredMenuConfig, key)
    if (path) {
      navigate(path)
    }
  }

  const handleClientChange = (value) => {
    if (value !== undefined && value !== null) {
      // value is expected to be the numeric clientId (e.g., 1090)
      changeClient(value)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Use full menu config for breadcrumbs to ensure accuracy
  const breadcrumbs = getBreadcrumbsFromPath(location.pathname, sidebarMenuConfig)

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

  const menuItems = convertMenuConfigToItems(filteredMenuConfig)

  // Render sidebar menu (always show menu since "All" is default)
  const renderSidebarContent = () => {
    return (
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
    )
  }

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
        {renderSidebarContent()}
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
            {/* Client Selection Dropdown */}
            <Select
              placeholder="Select Client"
              value={clientId}
              onChange={handleClientChange}
              style={{ minWidth: 180 }}
              loading={clientsLoading}
              options={clients.map(client => ({
                label: client.name,
                // Store numeric client ID in state/localStorage (e.g., 1090)
                value: Number(client.id)
              }))}
            />
            
            {/* Client Badge */}
            {clientId && (
              <Tag color="blue" style={{ margin: 0 }}>
                {
                  clients.find(c => Number(c.id) === Number(clientId))?.name
                  || `Client ID: ${clientId}`
                }
              </Tag>
            )}

            {/* Loading indicator */}
            {isChanging && (
              <Spin size="small" />
            )}

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
            borderRadius: 8,
            transition: 'opacity 0.3s ease',
            opacity: isChanging ? 0.6 : 1
          }}
        >
          {isChanging ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '400px' 
            }}>
              <Spin size="large" tip="Switching client..." />
            </div>
          ) : (
            <Outlet />
          )}
        </Content>
      </Layout>
    </Layout>
  )
}
