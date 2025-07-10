import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { apiClient } from '../../services/apiClient'
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  Edit3, 
  Plus, 
  ArrowUp, 
  Home, 
  Search, 
  MoreHorizontal,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Eye,
  Copy,
  RefreshCw,
  HardDrive,
  FolderPlus
} from 'lucide-react'
import './FileManagerPage.css'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

interface FileItem {
  id?: string
  name: string
  type: 'file' | 'folder'
  path: string
  size?: number
  modified?: number
  file_type?: string
  mime_type?: string
  extension?: string
  is_processed?: boolean
  items_count?: number
  is_parent?: boolean
}

interface DirectoryInfo {
  quota: number
  used: number
  available: number
  usage_percentage: number
}

type ViewMode = 'grid' | 'list'
type SortBy = 'name' | 'size' | 'modified' | 'type'
type SortOrder = 'asc' | 'desc'

const FileManagerPage: React.FC = () => {
  const { user } = useAuth()
  
  // State
  const [currentPath, setCurrentPath] = useState('')
  const [items, setItems] = useState<FileItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [directoryInfo, setDirectoryInfo] = useState<DirectoryInfo | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, item?: FileItem} | null>(null)
  const [showUploadZone, setShowUploadZone] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Path breadcrumbs
  const pathSegments = currentPath ? currentPath.split('/').filter(Boolean) : []

  if (DEBUG) {
    console.log('[DEBUG] FileManagerPage - currentPath:', currentPath, 'items:', items.length)
  }

  useEffect(() => {
    loadDirectory(currentPath)
  }, [currentPath])

  const loadDirectory = async (path: string) => {
    try {
      setLoading(true)
      
      const response = await apiClient.get(`/files/list/?path=${encodeURIComponent(path)}`)
      
      if (response.success) {
        setItems(response.items || [])
        setDirectoryInfo(response.directory_info)
        setSelectedItems(new Set())
        
        if (DEBUG) {
          console.log('[DEBUG] Directory loaded:', response)
        }
      } else {
        throw new Error(response.error || 'Failed to load directory')
      }
    } catch (error) {
      console.error('Error loading directory:', error)
      if (DEBUG) {
        console.error('[DEBUG] Directory load error:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleItemClick = (item: FileItem, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      const newSelected = new Set(selectedItems)
      if (newSelected.has(item.path)) {
        newSelected.delete(item.path)
      } else {
        newSelected.add(item.path)
      }
      setSelectedItems(newSelected)
    } else if (item.type === 'folder') {
      // Navigate to folder
      if (item.is_parent) {
        setCurrentPath(item.path)
      } else {
        setCurrentPath(item.path)
      }
    } else {
      // Single select file
      setSelectedItems(new Set([item.path]))
    }
  }

  const handleItemDoubleClick = (item: FileItem) => {
    if (item.type === 'folder') {
      setCurrentPath(item.path)
    } else {
      // Download file
      handleDownload(item)
    }
  }

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Root
      setCurrentPath('')
    } else {
      // Navigate to specific segment
      const newPath = pathSegments.slice(0, index + 1).join('/')
      setCurrentPath(newPath)
    }
  }

  const handleContextMenu = (event: React.MouseEvent, item?: FileItem) => {
    event.preventDefault()
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      item
    })
  }

  const closeContextMenu = () => {
    setContextMenu(null)
  }

  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name:')
    if (!name) return

    try {
      const response = await apiClient.post('/files/create-folder/', {
        name,
        path: currentPath
      })

      if (response.success) {
        loadDirectory(currentPath)
        if (DEBUG) {
          console.log('[DEBUG] Folder created:', name)
        }
      } else {
        alert(response.error || 'Failed to create folder')
      }
    } catch (error) {
      console.error('Error creating folder:', error)
      alert('Failed to create folder')
    }
    closeContextMenu()
  }

  const handleUpload = () => {
    fileInputRef.current?.click()
    closeContextMenu()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    await uploadFiles(files)
  }

  const uploadFiles = async (files: File[]) => {
    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })
      formData.append('path', currentPath)

      // Use post method with proper FormData config
      const response = await apiClient.post('/files/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      })

      if (response.success) {
        loadDirectory(currentPath)
        if (DEBUG) {
          console.log('[DEBUG] Files uploaded:', files.length)
        }
      } else {
        alert(response.error || 'Failed to upload files')
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Failed to upload files')
    }
  }

  const handleDownload = async (item: FileItem) => {
    try {
      await apiClient.download(`/files/download/?path=${encodeURIComponent(item.path)}`, item.name)
      
      if (DEBUG) {
        console.log('[DEBUG] File downloaded:', item.name)
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Failed to download file')
    }
    closeContextMenu()
  }

  const handleDelete = async (item: FileItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return

    try {
      const response = await apiClient.delete('/files/delete/', {
        data: {
          path: item.path,
          type: item.type
        }
      })

      if (response.success) {
        loadDirectory(currentPath)
        if (DEBUG) {
          console.log('[DEBUG] Item deleted:', item.name)
        }
      } else {
        alert(response.error || 'Failed to delete item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    }
    closeContextMenu()
  }

  const handleRename = async (item: FileItem) => {
    const newName = prompt('Enter new name:', item.name)
    if (!newName || newName === item.name) return

    try {
      const response = await apiClient.post('/files/rename/', {
        old_path: item.path,
        new_name: newName
      })

      if (response.success) {
        loadDirectory(currentPath)
        if (DEBUG) {
          console.log('[DEBUG] Item renamed:', item.name, 'to', newName)
        }
      } else {
        alert(response.error || 'Failed to rename item')
      }
    } catch (error) {
      console.error('Error renaming item:', error)
      alert('Failed to rename item')
    }
    closeContextMenu()
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setDragCounter(prev => prev + 1)
    setShowUploadZone(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragCounter(prev => prev - 1)
    if (dragCounter <= 1) {
      setShowUploadZone(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setShowUploadZone(false)
    setDragCounter(0)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      uploadFiles(files)
    }
  }

  // Sort and filter items
  const sortedAndFilteredItems = React.useMemo(() => {
    let filtered = items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    filtered.sort((a, b) => {
      let comparison = 0
      
      // Always show parent directory first
      if (a.is_parent) return -1
      if (b.is_parent) return 1
      
      // Then show folders before files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          comparison = (a.size || 0) - (b.size || 0)
          break
        case 'modified':
          comparison = (a.modified || 0) - (b.modified || 0)
          break
        case 'type':
          comparison = (a.file_type || '').localeCompare(b.file_type || '')
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [items, searchTerm, sortBy, sortOrder])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getFileIcon = (item: FileItem) => {
    if (item.type === 'folder') {
      return <Folder size={20} />
    }

    // Different icons for different file types
    const iconMap: { [key: string]: React.ReactNode } = {
      '.jpg': '🖼️', '.jpeg': '🖼️', '.png': '🖼️', '.gif': '🖼️',
      '.pdf': '📄', '.doc': '📝', '.docx': '📝', '.txt': '📝',
      '.xls': '📊', '.xlsx': '📊', '.csv': '📊',
      '.zip': '📦', '.rar': '📦', '.7z': '📦',
      '.mp4': '🎬', '.avi': '🎬', '.mov': '🎬',
      '.mp3': '🎵', '.wav': '🎵', '.flac': '🎵'
    }

    const icon = iconMap[item.extension || '']
    return icon ? <span style={{ fontSize: '16px' }}>{icon}</span> : <File size={20} />
  }

  return (
    <div 
      className="file-manager-page"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={closeContextMenu}
    >
      {/* Toolbar */}
      <div className="file-manager-toolbar">
        <div className="toolbar-section">
          <button onClick={() => loadDirectory(currentPath)} className="toolbar-btn" title="Refresh">
            <RefreshCw size={16} />
            Refresh
          </button>
          
          <button onClick={handleCreateFolder} className="toolbar-btn" title="New Folder">
            <FolderPlus size={16} />
            New Folder
          </button>
          
          <button onClick={handleUpload} className="toolbar-btn" title="Upload">
            <Upload size={16} />
            Upload
          </button>
        </div>

        <div className="toolbar-section">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="toolbar-section">
          <div className="view-controls">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Grid View"
            >
              <Grid3X3 size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>

          <div className="sort-controls">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="modified">Modified</option>
              <option value="type">Type</option>
            </select>
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="sort-order-btn"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-nav">
        <button onClick={() => handleBreadcrumbClick(-1)} className="breadcrumb-item">
          <Home size={16} />
          Home
        </button>
        {pathSegments.map((segment, index) => (
          <React.Fragment key={index}>
            <span className="breadcrumb-separator">/</span>
            <button 
              onClick={() => handleBreadcrumbClick(index)} 
              className="breadcrumb-item"
            >
              {segment}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Storage Info */}
      {directoryInfo && (
        <div className="storage-info">
          <div className="storage-bar">
            <div 
              className="storage-used" 
              style={{ width: `${directoryInfo.usage_percentage}%` }}
            ></div>
          </div>
          <span className="storage-text">
            {formatFileSize(directoryInfo.used)} of {formatFileSize(directoryInfo.quota)} used
          </span>
        </div>
      )}

      {/* File List */}
      <div className={`file-list ${viewMode}`}>
        {loading ? (
          <div className="loading-state">
            <RefreshCw className="spinning" size={24} />
            Loading...
          </div>
        ) : sortedAndFilteredItems.length === 0 ? (
          <div className="empty-state">
            <Folder size={48} />
            <p>This folder is empty</p>
          </div>
        ) : (
          <div className={`file-grid ${viewMode}`}>
            {viewMode === 'list' && (
              <div className="list-header">
                <div className="column-name">Name</div>
                <div className="column-size">Size</div>
                <div className="column-type">Type</div>
                <div className="column-modified">Modified</div>
              </div>
            )}
            
            {sortedAndFilteredItems.map((item) => (
              <div
                key={item.path}
                className={`file-item ${selectedItems.has(item.path) ? 'selected' : ''} ${item.is_parent ? 'parent' : ''}`}
                onClick={(e) => handleItemClick(item, e)}
                onDoubleClick={() => handleItemDoubleClick(item)}
                onContextMenu={(e) => handleContextMenu(e, item)}
              >
                <div className="file-icon">
                  {getFileIcon(item)}
                </div>
                
                <div className="file-info">
                  <div className="file-name" title={item.name}>
                    {item.name}
                    {item.type === 'folder' && item.items_count !== undefined && (
                      <span className="items-count">({item.items_count} items)</span>
                    )}
                  </div>
                  
                  {viewMode === 'list' && (
                    <>
                      <div className="file-size">
                        {item.type === 'file' && item.size ? formatFileSize(item.size) : '-'}
                      </div>
                      <div className="file-type">
                        {item.file_type || item.type}
                      </div>
                      <div className="file-modified">
                        {item.modified ? formatDate(item.modified) : '-'}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Zone Overlay */}
      {showUploadZone && (
        <div className="upload-zone-overlay">
          <div className="upload-zone">
            <Upload size={48} />
            <h3>Drop files here to upload</h3>
            <p>Release to upload files to this folder</p>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.item ? (
            // Item context menu
            <>
              {contextMenu.item.type === 'file' && (
                <button onClick={() => handleDownload(contextMenu.item!)}>
                  <Download size={16} />
                  Download
                </button>
              )}
              <button onClick={() => handleRename(contextMenu.item!)}>
                <Edit3 size={16} />
                Rename
              </button>
              <button onClick={() => handleDelete(contextMenu.item!)} className="danger">
                <Trash2 size={16} />
                Delete
              </button>
            </>
          ) : (
            // Empty space context menu
            <>
              <button onClick={handleCreateFolder}>
                <FolderPlus size={16} />
                New Folder
              </button>
              <button onClick={handleUpload}>
                <Upload size={16} />
                Upload Files
              </button>
              <button onClick={() => loadDirectory(currentPath)}>
                <RefreshCw size={16} />
                Refresh
              </button>
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default FileManagerPage 