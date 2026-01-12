import { useState, useEffect } from 'react'
import { Tree } from 'antd'
import { FolderOutlined, FolderOpenOutlined } from '@ant-design/icons'
import './FolderTree.css'

const { DirectoryTree } = Tree

export default function FolderTree({ folders, selectedFolder, onFolderSelect }) {
  const [expandedKeys, setExpandedKeys] = useState([])
  const [autoExpandParent, setAutoExpandParent] = useState(true)

  // Create a map to store folder names by ID
  const folderNameMap = {}
  const buildFolderNameMap = (folders) => {
    folders.forEach(folder => {
      folderNameMap[folder.id] = folder.name
      if (folder.children) {
        buildFolderNameMap(folder.children)
      }
    })
  }
  buildFolderNameMap(folders)

  // Convert folder structure to Ant Design Tree format
  const convertToTreeData = (folders) => {
    return folders.map(folder => ({
      title: (
        <span className="folder-title">
          <span className="folder-name">{folder.name}</span>
          <span className="folder-count">({folder.count})</span>
        </span>
      ),
      key: folder.id,
      icon: folder.children && folder.children.length > 0 ? <FolderOutlined /> : <FolderOutlined />,
      children: folder.children ? convertToTreeData(folder.children) : null,
      isLeaf: !folder.children || folder.children.length === 0
    }))
  }

  const treeData = convertToTreeData(folders)

  // Auto-expand first folder on mount
  useEffect(() => {
    if (folders.length > 0 && expandedKeys.length === 0) {
      const firstFolder = folders[0]
      if (firstFolder.children && firstFolder.children.length > 0) {
        setExpandedKeys([firstFolder.id])
        // Auto-select first subfolder
        if (firstFolder.children.length > 0) {
          const firstSubfolder = firstFolder.children[0]
          onFolderSelect(firstSubfolder.id, firstSubfolder.name)
        }
      } else {
        // If no children, select the folder itself
        onFolderSelect(firstFolder.id, firstFolder.name)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folders])

  const onExpand = (expandedKeysValue) => {
    setExpandedKeys(expandedKeysValue)
    setAutoExpandParent(false)
  }

  const onSelect = (selectedKeys, info) => {
    if (selectedKeys.length > 0) {
      const folderId = selectedKeys[0]
      const folderName = folderNameMap[folderId] || folderId
      onFolderSelect(folderId, folderName)
    }
  }

  return (
    <div className="folder-tree-container">
      <div className="folder-tree-header">
        <FolderOutlined style={{ color: '#1890ff', marginRight: 8 }} />
        <span className="folder-tree-title">Folder Root</span>
      </div>
      <DirectoryTree
        className="folder-tree"
        multiple={false}
        defaultExpandAll={false}
        expandedKeys={expandedKeys}
        autoExpandParent={autoExpandParent}
        selectedKeys={selectedFolder ? [selectedFolder] : []}
        onExpand={onExpand}
        onSelect={onSelect}
        treeData={treeData}
        showIcon={true}
      />
    </div>
  )
}

