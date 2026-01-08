import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { Table, Tabs, Upload, Button as AntButton, Tag, message } from 'antd'
import { UploadOutlined, FileTextOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockApi } from '../services/api'
import { getPageTitle, APP_CONFIG } from '../config/constants'

export default function Documents() {
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    loadDocuments()
  }, [activeCategory])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getDocuments(activeCategory)
      setDocuments(response.data.documents)
      setCategories(response.data.categories)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = (file) => {
    // Mock upload functionality
    message.success(`File ${file.name} uploaded successfully (mock)`)
    return false // Prevent actual upload
  }

  const handleDownload = (document) => {
    // Mock download functionality
    message.info(`Downloading ${document.name}...`)
  }

  const getCategoryColor = (category) => {
    const colors = {
      'Safety': 'red',
      'Maintenance': 'blue',
      'Inventory': 'green',
      'Compliance': 'orange',
      'Training': 'purple'
    }
    return colors[category] || 'default'
  }

  const columns = [
    {
      title: 'Document Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileTextOutlined />
          <span>{text}</span>
        </Box>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => <Tag color={getCategoryColor(category)}>{category}</Tag>
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 100
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 100
    },
    {
      title: 'Uploaded By',
      dataIndex: 'uploadedBy',
      key: 'uploadedBy',
      width: 150
    },
    {
      title: 'Uploaded At',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 180,
      render: (text) => dayjs(text).format('MMM DD, YYYY HH:mm')
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <AntButton
          type="link"
          onClick={() => handleDownload(record)}
        >
          Download
        </AntButton>
      )
    }
  ]

  return (
    <>
      <Helmet>
        <title>{getPageTitle('documents')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Document Management System`} />
      </Helmet>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Document Management
        </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Upload Document</Typography>
            <Upload
              beforeUpload={handleUpload}
              showUploadList={false}
            >
              <AntButton icon={<UploadOutlined />}>Upload Document</AntButton>
            </Upload>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Tabs
            activeKey={activeCategory}
            onChange={setActiveCategory}
            items={categories.map(category => ({
              key: category,
              label: category
            }))}
            style={{ marginBottom: 16 }}
          />

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Table
              dataSource={documents}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="middle"
            />
          )}
        </CardContent>
      </Card>
      </Box>
    </>
  )
}

