import { Helmet } from 'react-helmet-async'
import { Box, Typography } from '@mui/material'
import { Card, Avatar, Tag, Row, Col, Space, Divider, Statistic } from 'antd'
import {
  UserOutlined,
  MailOutlined,
  SafetyOutlined,
  TeamOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  EditOutlined
} from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import { getPageTitle, APP_CONFIG } from '../config/constants'

export default function Profile() {
  const { user } = useAuth()

  return (
    <>
      <Helmet>
        <title>{getPageTitle('profile')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - User Profile`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
          Profile
        </Typography>

        <Row gutter={[24, 24]}>
          {/* Profile Header Card */}
          <Col xs={24}>
            <Card
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: 12,
                overflow: 'hidden'
              }}
              bodyStyle={{ padding: '32px' }}
            >
              <Row gutter={24} align="middle">
                <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
                  <Avatar
                    size={120}
                    style={{
                      backgroundColor: '#fff',
                      color: '#667eea',
                      fontSize: 48,
                      border: '4px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                    icon={<UserOutlined />}
                  >
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                </Col>
                <Col xs={24} sm={16}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div>
                      <Typography
                        variant="h4"
                        sx={{
                          color: '#fff',
                          fontWeight: 'bold',
                          mb: 1,
                          fontSize: { xs: '24px', sm: '28px' }
                        }}
                      >
                        {user?.name || 'User Name'}
                      </Typography>
                      <Tag
                        color="default"
                        style={{
                          fontSize: 14,
                          padding: '4px 16px',
                          borderRadius: 20,
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          color: '#fff',
                          border: 'none'
                        }}
                      >
                        {user?.role || 'User'}
                      </Tag>
                    </div>
                    <Space size="middle" wrap>
                      <Tag
                        icon={<CheckCircleOutlined />}
                        color="success"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 20,
                          padding: '4px 16px'
                        }}
                      >
                        {user?.status || 'Active'}
                      </Tag>
                      <Tag
                        icon={<IdcardOutlined />}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 20,
                          padding: '4px 16px'
                        }}
                      >
                        {user?.userId || 'N/A'}
                      </Tag>
                    </Space>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* User Information Card */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <UserOutlined />
                  <span>Personal Information</span>
                </Space>
              }
              extra={
                <Tag icon={<EditOutlined />} color="blue" style={{ cursor: 'pointer' }}>
                  Edit Profile
                </Tag>
              }
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ color: '#8c8c8c', fontSize: 14, fontWeight: 500 }}>
                      <MailOutlined style={{ marginRight: 8 }} />
                      Email Address
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: '#262626' }}>
                      {user?.email || 'Not provided'}
                    </div>
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ color: '#8c8c8c', fontSize: 14, fontWeight: 500 }}>
                      <TeamOutlined style={{ marginRight: 8 }} />
                      Department
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: '#262626' }}>
                      {user?.department || 'Not provided'}
                    </div>
                  </Space>
                </Col>
                <Col xs={24}>
                  <Divider style={{ margin: '16px 0' }} />
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ color: '#8c8c8c', fontSize: 14, fontWeight: 500 }}>
                      <SafetyOutlined style={{ marginRight: 8 }} />
                      Role
                    </div>
                    <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px', borderRadius: 4 }}>
                      {user?.role || 'User'}
                    </Tag>
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ color: '#8c8c8c', fontSize: 14, fontWeight: 500 }}>
                      <IdcardOutlined style={{ marginRight: 8 }} />
                      User ID
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: '#262626' }}>
                      {user?.userId || 'N/A'}
                    </div>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Quick Stats Card */}
          <Col xs={24} lg={8}>
            <Card
              title="Account Status"
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Statistic
                  title="Account Status"
                  value={user?.status || 'Active'}
                  valueStyle={{ color: user?.status === 'Active' ? '#52c41a' : '#ff4d4f' }}
                  prefix={<CheckCircleOutlined />}
                />
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <div style={{ color: '#8c8c8c', fontSize: 14, marginBottom: 8 }}>Member Since</div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>
                    {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Box>
    </>
  )
}

