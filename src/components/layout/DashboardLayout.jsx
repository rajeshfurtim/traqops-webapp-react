import { useState, useEffect, useMemo } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Breadcrumb, Tooltip, Select, Tag, Spin, Badge, ConfigProvider } from 'antd'
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
  AppstoreOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'
import { useSidebarNotifications } from '../../context/SidebarNotificationContext'
import { useSidebar } from '../../context/SidebarContext'
import { useClient } from '../../context/ClientContext'
import { sidebarMenuConfig, getBreadcrumbsFromPath } from '../../config/sidebarMenu'
import { APP_CONFIG } from '../../config/constants'
import { domainName } from '../../config/apiConfig'
import { useGetAllClientListQuery } from '../../store/api/masterSettings.api'
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
  BuildOutlined,
  SyncOutlined
}

// Fallback icon for missing icons
const DefaultIcon = AppstoreOutlined

/**
 * Icon + optional badge (collapsed). Subscribes to sidebar + notifications context
 * so the Menu `items` tree stays stable — avoids rebuilding the whole menu on toggle (major perf win).
 */
function SidebarMenuItemIcon({ menuItem }) {
  const { collapsed } = useSidebar()
  const { badgeCounts } = useSidebarNotifications()
  const IconComponent = iconMap[menuItem.icon]

  if (!IconComponent && process.env.NODE_ENV === 'development') {
    console.warn(
      `[Sidebar] Icon "${menuItem.icon}" not found in iconMap for menu item "${menuItem.label}". Using fallback icon.`
    )
  }

  const rawIcon = IconComponent ? <IconComponent /> : <DefaultIcon />
  const badgeCount = menuItem.path ? badgeCounts[menuItem.path] : undefined
  const showBadge = typeof badgeCount === 'number' && badgeCount > 0
  if (collapsed && showBadge) {
    return (
      <Badge
        className="sidebar-menu-collapsed-badge"
        count={badgeCount}
        size="small"
        overflowCount={99}
      >
        <span className="sidebar-menu-icon-badge-wrap">{rawIcon}</span>
      </Badge>
    )
  }
  return rawIcon
}

/** Label row + optional end badge (expanded). Same stable-items pattern as icon. */
function SidebarMenuItemLabel({ menuItem }) {
  const { collapsed } = useSidebar()

  if (collapsed) {
    return (
      <Tooltip title={menuItem.label} placement="right">
        <span>{menuItem.label}</span>
      </Tooltip>
    )
  }

  return <span>{menuItem.label}</span>
}

const SIDEBAR_SUBMENU_POPUP_CLASS = 'traqops-sidebar-submenu-popup'

const SIDEBAR_MENU_THEME = 'dark'

// Convert menu config to AntD Menu items — stable reference unless sidebarMenuConfig changes
const convertMenuConfigToItems = (config) => {
  return config.map((item) => {
    if (item.type === 'divider') {
      return { type: 'divider' }
    }

    const menuItem = {
      key: item.key,
      icon: <SidebarMenuItemIcon menuItem={item} />,
      label: <SidebarMenuItemLabel menuItem={item} />
    }

    if (item.children) {
      menuItem.popupClassName = SIDEBAR_SUBMENU_POPUP_CLASS
      menuItem.children = convertMenuConfigToItems(item.children)
    }

    return menuItem
  })
}

const normalizePathForMenu = (pathname) => {
  if (pathname.startsWith('/reports/tasks/ScheduledDetails')) {
    return '/reports/tasks/scheduled'
  }

  return pathname
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
  const [selectedKeys, setSelectedKeys] = useState([normalizePathForMenu(location.pathname)])
  const [openKeys, setOpenKeys] = useState(() =>
    getOpenKeysFromPath(normalizePathForMenu(location.pathname))
  )
  const [clients, setClients] = useState([])

  // Use menu config directly without client filtering
  const filteredMenuConfig = sidebarMenuConfig

  useEffect(() => {
    setSelectedKeys([normalizePathForMenu(location.pathname)])
    setOpenKeys(getOpenKeysFromPath(normalizePathForMenu(location.pathname)))
  }, [location.pathname])

  const domainNameParam = user?.domain?.name || domainName

  // Fetch clients via RTK Query
  const {
    data: clientsResponse,
    isLoading: clientsLoading,
  } = useGetAllClientListQuery({
    domainName: domainNameParam,
    pageNumber: 1,
    pageSize: 1000,
  })

  // Keep local clients array for existing logic
  useEffect(() => {
    if (clientsResponse?.success && clientsResponse.data?.content) {
      setClients(clientsResponse.data.content)
    } else if (clientsResponse) {
      setClients([])
    }
  }, [clientsResponse])

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

  const breadcrumbs = getBreadcrumbsFromPath(normalizePathForMenu(location.pathname), sidebarMenuConfig)

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

  // Do not depend on `collapsed` or badgeCounts here — wrappers read context (smooth toggle, fewer Menu reconciliations)
  const menuItems = useMemo(() => convertMenuConfigToItems(filteredMenuConfig), [filteredMenuConfig])

  // Render sidebar menu (always show menu since "All" is default)
  const renderSidebarContent = () => {
    return (
      <ConfigProvider
        theme={{
          components: {
            Menu: {
              darkItemColor: 'rgba(255, 255, 255, 0.92)',
              darkItemHoverColor: '#ffffff',
              darkItemSelectedColor: '#ffffff',
              darkGroupTitleColor: 'rgba(255, 255, 255, 0.65)',
              darkPopupBg: '#001529',
              darkSubMenuItemBg: '#000c17',
            },
          },
        }}
      >
        <Menu
          mode="inline"
          theme={SIDEBAR_MENU_THEME}
          rootClassName="traqops-sidebar-menu-root"
          inlineCollapsed={collapsed}
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
      </ConfigProvider>
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
          overflowX: collapsed ? 'visible' : 'auto',
          overflowY: 'auto',
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
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 260,
          transition: 'margin-left 0.2s cubic-bezier(0.2, 0, 0, 1)'
        }}
      >
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
                  <span onClick={() => crumb.path && navigate(crumb.path)} style={{ cursor: 'pointer' }}>
                    {crumb.label}
                  </span>
                ) : index === breadcrumbs.length - 1 ? (
                  <span>{crumb.label}</span>
                ) : (
                  <span
                    onClick={() => crumb.path && navigate(crumb.path)}
                    style={{ cursor: crumb.path ? 'pointer' : 'default', color: crumb.path ? '#1890ff' : undefined }}
                  >
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
