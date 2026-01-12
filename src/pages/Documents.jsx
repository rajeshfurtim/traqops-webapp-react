import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Box, Typography } from '@mui/material'
import { Layout } from 'antd'
import FolderTree from '../components/documents/FolderTree'
import FileList from '../components/documents/FileList'
import { mockApi } from '../services/api'
import { getPageTitle, APP_CONFIG } from '../config/constants'
import './Documents.css'

const { Content } = Layout

export default function Documents() {
  const [loading, setLoading] = useState(true)
  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [selectedFolderName, setSelectedFolderName] = useState(null)

  useEffect(() => {
    loadFolders()
  }, [])

  useEffect(() => {
    if (selectedFolder) {
      loadFiles(selectedFolder)
    }
  }, [selectedFolder])

  const loadFolders = async () => {
    try {
      setLoading(true)
      const response = await mockApi.getDocumentFolders()
      setFolders(response.data)
    } catch (error) {
      console.error('Error loading folders:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFiles = async (folderId) => {
    try {
      setLoading(true)
      const response = await mockApi.getDocumentsByFolder(folderId)
      setFiles(response.data)
    } catch (error) {
      console.error('Error loading files:', error)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  const handleFolderSelect = (folderId, folderName) => {
    setSelectedFolder(folderId)
    setSelectedFolderName(folderName)
  }

  const handleUpload = async (file) => {
    if (!selectedFolder) {
      return Promise.reject(new Error('Please select a folder first'))
    }
    try {
      await mockApi.uploadDocument(selectedFolder, file)
      // Reload files after upload
      await loadFiles(selectedFolder)
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const handleDownload = (file) => {
    // Mock download functionality
    console.log('Downloading file:', file)
    // In real implementation, this would trigger a file download
  }

  const handleDelete = async (file) => {
    if (!selectedFolder) return
    try {
      await mockApi.deleteDocument(selectedFolder, file.id)
      // Reload files after delete
      await loadFiles(selectedFolder)
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  return (
    <>
      <Helmet>
        <title>{getPageTitle('documents')}</title>
        <meta name="description" content={`${APP_CONFIG.name} - Document Management System`} />
      </Helmet>
      <Box className="documents-page">
        <Typography variant="h4" gutterBottom fontWeight="bold" className="documents-title">
          Document Management
        </Typography>

        <Layout className="documents-layout">
          <Content className="documents-content">
            <div className="documents-panels">
              {/* Left Panel - Folder Tree (30%) */}
              <div className="documents-panel-left">
                {loading && folders.length === 0 ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading folders...</p>
                  </div>
                ) : (
                  <FolderTree
                    folders={folders}
                    selectedFolder={selectedFolder}
                    onFolderSelect={handleFolderSelect}
                  />
                )}
              </div>

              {/* Right Panel - File List (70%) */}
              <div className="documents-panel-right">
                <FileList
                  files={files}
                  selectedFolderName={selectedFolderName}
                  onUpload={handleUpload}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  loading={loading}
                />
              </div>
            </div>
          </Content>
        </Layout>
      </Box>
    </>
  )
}
