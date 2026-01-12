import { useState } from 'react'
import { Upload, Button as AntButton, Popconfirm, Empty, message } from 'antd'
import { UploadOutlined, FilePdfOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons'
import './FileList.css'

export default function FileList({ files, selectedFolderName, onUpload, onDownload, onDelete, loading }) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file) => {
    // Validate PDF only
    if (file.type !== 'application/pdf') {
      message.error('Only PDF files are allowed')
      return false
    }

    setUploading(true)
    try {
      await onUpload(file)
      message.success(`File ${file.name} uploaded successfully`)
    } catch (error) {
      message.error('Failed to upload file')
    } finally {
      setUploading(false)
    }
    return false // Prevent default upload
  }

  const handleDownload = (file) => {
    onDownload(file)
    message.info(`Downloading ${file.name}...`)
  }

  const handleDelete = (file) => {
    onDelete(file)
    message.success(`File ${file.name} deleted successfully`)
  }

  return (
    <div className="file-list-container">
      <div className="file-list-header">
        <div className="file-list-title">
          <span>Files List</span>
          {selectedFolderName && <span className="folder-name-badge"> - ({selectedFolderName})</span>}
        </div>
        <Upload
          beforeUpload={handleUpload}
          showUploadList={false}
          accept=".pdf"
        >
          <AntButton 
            type="primary" 
            icon={<UploadOutlined />}
            loading={uploading}
          >
            Upload
          </AntButton>
        </Upload>
      </div>

      <div className="file-list-content">
        {loading ? (
          <div className="file-list-loading">
            <div className="loading-spinner"></div>
            <p>Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <Empty
            description="No files in this folder"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className="file-list-items">
            {files.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-item-left">
                  <FilePdfOutlined className="file-icon" />
                  <span className="file-name">{file.name}</span>
                </div>
                <div className="file-item-actions">
                  <AntButton
                    type="text"
                    icon={<DownloadOutlined />}
                    className="action-btn download-btn"
                    onClick={() => handleDownload(file)}
                    title="Download"
                  />
                  <Popconfirm
                    title="Delete this file?"
                    description="This action cannot be undone."
                    onConfirm={() => handleDelete(file)}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{ danger: true }}
                  >
                    <AntButton
                      type="text"
                      icon={<DeleteOutlined />}
                      className="action-btn delete-btn"
                      title="Delete"
                    />
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

