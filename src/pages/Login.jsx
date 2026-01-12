import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Input, Button, Form, Alert } from 'antd'
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import { APP_CONFIG, getPageTitle } from '../config/constants'
import './Login.css'

export default function Login() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (values) => {
    setError('')
    setLoading(true)

    try {
      await login({ email: values.email, password: values.password })
      setTimeout(() => {
        navigate('/dashboard')
      }, 800)
    } catch (err) {
      setError('Invalid credentials. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>{getPageTitle('login')}</title>
        <meta name="description" content={APP_CONFIG.description} />
      </Helmet>
      <div className="login-vibrant-container">
        {/* Background */}
        <div className="login-vibrant-background">
          <div className="gradient-mesh gradient-mesh-1"></div>
          <div className="gradient-mesh gradient-mesh-2"></div>
          <div className="gradient-mesh gradient-mesh-3"></div>
          <div className="floating-blob blob-1"></div>
          <div className="floating-blob blob-2"></div>
          <div className="floating-blob blob-3"></div>
          <div className="aurora-layer" />
        </div>

        <div className="login-vibrant-wrapper">
          {/* Centered Glassmorphism Card */}
          <div className="login-vibrant-card">
            {/* Logo & Title */}
            <div className="login-vibrant-header">
              <img
                src="/assets/traqopsLogo.png"
                alt="TraqOps Logo"
                className="login-vibrant-logo"
              />
              <h1 className="login-vibrant-title">
                <span className="gradient-text">Welcome back to TraqOps</span>
              </h1>
              <p className="login-vibrant-subtitle">
                Operations. Maintenance. Control.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div>
                <Alert
                  message={error}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setError('')}
                  className="login-vibrant-error"
                />
              </div>
            )}

            {/* Login Form */}
            <Form
              form={form}
              name="login"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
              autoComplete="off"
              className="login-vibrant-form"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
                className="login-vibrant-form-item"
              >
                <Input
                  prefix={<UserOutlined className="login-vibrant-input-icon" />}
                  placeholder="Email address"
                  className="login-vibrant-input"
                  autoFocus
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: 'Password is required' },
                  { min: 3, message: 'Password must be at least 3 characters' }
                ]}
                className="login-vibrant-form-item"
              >
                <div className="login-password-wrapper">
                  <Input.Password
                    prefix={<LockOutlined className="login-vibrant-input-icon" />}
                    placeholder="Password"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    className="login-vibrant-input"
                  />
                </div>
              </Form.Item>

              {/* Forgot Password Link */}
              <div className="login-forgot-password-link">
                <Link to="/forgot-password" className="login-forgot-link-text">
                  Forgot password?
                </Link>
              </div>

              <Form.Item className="login-vibrant-button-item">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  className="login-vibrant-button"
                >
                  {loading ? 'Signing in...' : 'Sign in to TraqOps'}
                </Button>
              </Form.Item>
            </Form>

            {/* Footer */}
            {/* <div className="login-vibrant-footer">
              <p className="login-vibrant-footer-text">
                Demo mode: Use any email and password
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </>
  )
}
