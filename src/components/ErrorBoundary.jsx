import React from 'react'
import { Result, Button, Collapse } from 'antd'
import { HomeOutlined, ReloadOutlined } from '@ant-design/icons'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Always log errors
    console.error('[ErrorBoundary] Caught an error:', error)
    console.error('[ErrorBoundary] Error info:', errorInfo)
    
    // In development, log full stack trace
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Error stack:', error?.stack)
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)
    }
    
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleGoHome = () => {
    this.handleReset()
    window.location.href = '/dashboard'
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state
      const isDev = process.env.NODE_ENV === 'development'

      // Create collapse items for error details (development only)
      const errorDetailsItems = isDev && error ? [
        {
          key: 'error',
          label: 'Error Details (Development Only)',
          children: (
            <>
              <div style={{ marginBottom: 16 }}>
                <strong>Error Message:</strong>
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, overflow: 'auto' }}>
                  {error.toString()}
                </pre>
              </div>
              {error.stack && (
                <div style={{ marginBottom: 16 }}>
                  <strong>Stack Trace:</strong>
                  <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, overflow: 'auto', maxHeight: 300 }}>
                    {error.stack}
                  </pre>
                </div>
              )}
              {errorInfo?.componentStack && (
                <div>
                  <strong>Component Stack:</strong>
                  <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, overflow: 'auto', maxHeight: 300 }}>
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </>
          )
        }
      ] : []

      return (
        <Result
          status="500"
          title="500"
          subTitle="Sorry, something went wrong. Please try refreshing the page or go back to the dashboard."
          extra={[
            <Button
              key="home"
              type="primary"
              icon={<HomeOutlined />}
              onClick={this.handleGoHome}
            >
              Go Home
            </Button>,
            <Button
              key="reload"
              icon={<ReloadOutlined />}
              onClick={this.handleReload}
            >
              Reload Page
            </Button>
          ]}
        >
          {errorDetailsItems.length > 0 && (
            <Collapse 
              items={errorDetailsItems}
              defaultActiveKey={['error']}
              style={{ marginTop: 24, textAlign: 'left' }}
            />
          )}
        </Result>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

