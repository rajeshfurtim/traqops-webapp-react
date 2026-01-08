import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { Tabs, Form, Input, Switch, Select, Button as AntButton, Space } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import { getPageTitle, APP_CONFIG } from '../config/constants'

const { Option } = Select

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [generalForm] = Form.useForm()
  const [securityForm] = Form.useForm()
  const [preferencesForm] = Form.useForm()

  const handleGeneralSave = (values) => {
    console.log('General settings:', values)
    // TODO: Implement API call
  }

  const handleSecuritySave = (values) => {
    console.log('Security settings:', values)
    // TODO: Implement API call
  }

  const handlePreferencesSave = (values) => {
    console.log('Preferences:', values)
    // TODO: Implement API call
  }

  const tabItems = [
    {
      key: 'general',
      label: 'General Settings',
      children: (
        <Card>
          <CardContent>
            <Form
              form={generalForm}
              layout="vertical"
              initialValues={{
                name: user?.name || '',
                email: user?.email || '',
                department: user?.department || '',
                language: 'en',
                timezone: 'UTC'
              }}
              onFinish={handleGeneralSave}
            >
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: 'Name is required' }]}
              >
                <Input placeholder="Enter your full name" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input placeholder="Enter your email" />
              </Form.Item>

              <Form.Item label="Department" name="department">
                <Input placeholder="Enter your department" />
              </Form.Item>

              <Form.Item label="Language" name="language">
                <Select>
                  <Option value="en">English</Option>
                  <Option value="es">Spanish</Option>
                  <Option value="fr">French</Option>
                  <Option value="de">German</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Timezone" name="timezone">
                <Select>
                  <Option value="UTC">UTC</Option>
                  <Option value="America/New_York">Eastern Time</Option>
                  <Option value="America/Chicago">Central Time</Option>
                  <Option value="America/Denver">Mountain Time</Option>
                  <Option value="America/Los_Angeles">Pacific Time</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Space>
                  <AntButton type="primary" htmlType="submit" icon={<SaveOutlined />}>
                    Save Changes
                  </AntButton>
                  <AntButton onClick={() => generalForm.resetFields()}>
                    Reset
                  </AntButton>
                </Space>
              </Form.Item>
            </Form>
          </CardContent>
        </Card>
      )
    },
    {
      key: 'security',
      label: 'Security',
      children: (
        <Card>
          <CardContent>
            <Form
              form={securityForm}
              layout="vertical"
              onFinish={handleSecuritySave}
            >
              <Form.Item
                label="Current Password"
                name="currentPassword"
                rules={[{ required: true, message: 'Current password is required' }]}
              >
                <Input.Password placeholder="Enter current password" />
              </Form.Item>

              <Form.Item
                label="New Password"
                name="newPassword"
                rules={[
                  { required: true, message: 'New password is required' },
                  { min: 8, message: 'Password must be at least 8 characters' }
                ]}
              >
                <Input.Password placeholder="Enter new password" />
              </Form.Item>

              <Form.Item
                label="Confirm New Password"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('Passwords do not match'))
                    }
                  })
                ]}
              >
                <Input.Password placeholder="Confirm new password" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <AntButton type="primary" htmlType="submit" icon={<SaveOutlined />}>
                    Update Password
                  </AntButton>
                  <AntButton onClick={() => securityForm.resetFields()}>
                    Cancel
                  </AntButton>
                </Space>
              </Form.Item>
            </Form>
          </CardContent>
        </Card>
      )
    },
    {
      key: 'preferences',
      label: 'Preferences',
      children: (
        <Card>
          <CardContent>
            <Form
              form={preferencesForm}
              layout="vertical"
              initialValues={{
                emailNotifications: true,
                pushNotifications: false
              }}
              onFinish={handlePreferencesSave}
            >
              <Form.Item label="Email Notifications" name="emailNotifications" valuePropName="checked">
                <Switch />
              </Form.Item>

              <Form.Item label="Push Notifications" name="pushNotifications" valuePropName="checked">
                <Switch />
              </Form.Item>

              <Form.Item>
                <Space>
                  <AntButton type="primary" htmlType="submit" icon={<SaveOutlined />}>
                    Save Preferences
                  </AntButton>
                  <AntButton onClick={() => preferencesForm.resetFields()}>
                    Reset
                  </AntButton>
                </Space>
              </Form.Item>
            </Form>
          </CardContent>
        </Card>
      )
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('settings')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Settings`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Settings
        </Typography>

        <Card>
          <CardContent>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              size="large"
            />
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

