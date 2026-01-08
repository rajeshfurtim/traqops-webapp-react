import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Input, Button, Form, Alert, message } from 'antd'
import { UserOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { APP_CONFIG, getPageTitle } from '../config/constants'
import './Login.css'

export default function ForgotPassword() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (values) => {
    setError('')
    setLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      // Success state
      setSuccess(true)
      message.success('Password reset link sent to your email!')
      
      // Navigate back to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError('Failed to send reset link. Please try again.')
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/login')
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
        ease: 'easeIn'
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
        ease: [0.16, 1, 0.3, 1],
        delay: 0.1
      }
    }
  }

  const textVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    }
  }

  return (
    <>
      <Helmet>
        <title>{getPageTitle('forgot-password')}</title>
        <meta name="description" content="Reset your TraqOps password" />
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
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key="forgot-password"
            className="login-vibrant-wrapper"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
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
                  <span className="gradient-text">Reset your password</span>
                </h1>
                <p className="login-vibrant-subtitle">
                  Enter your registered email address
                </p>
              </motion.div>

              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="forgot-password-success"
                >
                  <Alert
                    message="Reset link sent!"
                    description="We've sent a password reset link to your email. Please check your inbox."
                    type="success"
                    showIcon
                    className="login-vibrant-error"
                  />
                </motion.div>
              )}

              {/* Error Alert */}
              {error && !success && (
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

              {/* Reset Form */}
              {!success && (
                <Form
                  form={form}
                  name="forgot-password"
                  onFinish={handleSubmit}
                  layout="vertical"
                  size="large"
                  autoComplete="off"
                  className="login-vibrant-form"
                >
                  <Form.Item
                    name="email"
                    label="Email"
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
                            <span className="login-button-text">Sending...</span>
                          </span>
                        ) : (
                          'Send reset link'
                        )}
                      </Button>
                    </motion.div>
                  </Form.Item>
                </Form>
              )}

              {/* Back to Login */}
              <motion.div
                className="forgot-password-back"
                variants={textVariants}
              >
                <motion.button
                  type="button"
                  onClick={handleBackToLogin}
                  className="forgot-password-back-button"
                  whileHover={{ x: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeftOutlined className="forgot-password-back-icon" />
                  <span>Back to Login</span>
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}

