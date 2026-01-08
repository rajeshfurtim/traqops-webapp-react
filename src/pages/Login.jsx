import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
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

  // Parallax effect on mouse move
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const springY = useSpring(mouseY, { damping: 20 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window
      mouseX.set((clientX / innerWidth - 0.5) * 20)
      mouseY.set((clientY / innerHeight - 0.5) * 20)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

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

  // Container animations
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
        ease: 'easeOut'
      }
    }
  }

  const cardVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  }

  const textVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    }
  }

  return (
    <>
      <Helmet>
        <title>{getPageTitle('login')}</title>
        <meta name="description" content={APP_CONFIG.description} />
      </Helmet>
      <div className="login-vibrant-container">
        {/* Dynamic Animated Background */}
        <div className="login-vibrant-background">
          <div className="gradient-mesh gradient-mesh-1"></div>
          <div className="gradient-mesh gradient-mesh-2"></div>
          <div className="gradient-mesh gradient-mesh-3"></div>
          <div className="floating-blob blob-1"></div>
          <div className="floating-blob blob-2"></div>
          <div className="floating-blob blob-3"></div>
          <motion.div
            className="aurora-layer"
            style={{
              x: springX,
              y: springY
            }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key="login"
            className="login-vibrant-wrapper"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: 20, transition: { duration: 0.3 } }}
          >
          {/* Centered Glassmorphism Card */}
          <motion.div
            className="login-vibrant-card"
            variants={cardVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            {/* Logo & Title */}
            <motion.div
              className="login-vibrant-header"
              variants={textVariants}
            >
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
            </motion.div>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Alert
                  message={error}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setError('')}
                  className="login-vibrant-error"
                />
              </motion.div>
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
                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Input
                    prefix={<UserOutlined className="login-vibrant-input-icon" />}
                    placeholder="Email address"
                    className="login-vibrant-input"
                    autoFocus
                  />
                </motion.div>
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: 'Password is required' },
                  { min: 3, message: 'Password must be at least 3 characters' }
                ]}
                className="login-vibrant-form-item"
              >
                <motion.div
                  className="login-password-wrapper"
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Input.Password
                    prefix={<LockOutlined className="login-vibrant-input-icon" />}
                    placeholder="Password"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    className="login-vibrant-input"
                  />
                </motion.div>
              </Form.Item>

              {/* Forgot Password Link */}
              <div className="login-forgot-password-link">
                <Link to="/forgot-password" className="login-forgot-link-text">
                  Forgot password?
                </Link>
              </div>

              <Form.Item className="login-vibrant-button-item">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={loading}
                    className="login-vibrant-button"
                  >
                    {loading ? (
                      <span className="login-button-loading-content">
                        <span className="login-button-gradient-flow"></span>
                        <span className="login-button-text">Signing in...</span>
                      </span>
                    ) : (
                      'Sign in to TraqOps'
                    )}
                  </Button>
                </motion.div>
              </Form.Item>
            </Form>

            {/* Footer */}
            <div className="login-vibrant-footer">
              <p className="login-vibrant-footer-text">
                Demo mode: Use any email and password
              </p>
            </div>
          </motion.div>
        </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}
