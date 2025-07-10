import React, { useState, useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { RenderData, TableData } from '../../../types/chat'
import { Search, ChevronUp, ChevronDown, Download, Maximize2 } from 'lucide-react'
import './TableRenderer.css'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

interface TableRendererProps {
  data: RenderData
}

interface SortConfig {
  key: number
  direction: 'asc' | 'desc'
}

const TableRenderer: React.FC<TableRendererProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  if (DEBUG) {
    console.log('[DEBUG] TableRenderer - rows:', (data.data as TableData)?.rows?.length, 'headers:', (data.data as TableData)?.headers?.length)
  }

  const { data: tableData, options = {} } = data
  const {
    searchable = true,
    sortable = true,
    paginated = true,
    maxHeight = 400
  } = options

  const table = tableData as TableData
  const pageSize = table.metadata?.pageSize || 50

  // Filter and sort data
  const processedData = useMemo(() => {
    let filteredRows = [...table.rows]

    // Apply search filter
    if (searchTerm && searchable) {
      filteredRows = filteredRows.filter(row =>
        row.some(cell => 
          cell?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply sorting
    if (sortConfig && sortable) {
      filteredRows.sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]
        
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
        }
        
        const aStr = aVal.toString()
        const bStr = bVal.toString()
        
        if (sortConfig.direction === 'asc') {
          return aStr.localeCompare(bStr)
        } else {
          return bStr.localeCompare(aStr)
        }
      })
    }

    return filteredRows
  }, [table.rows, searchTerm, sortConfig, searchable, sortable])

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize)
  const paginatedData = paginated 
    ? processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : processedData

  // Handle sort
  const handleSort = (columnIndex: number) => {
    if (!sortable) return

    let direction: 'asc' | 'desc' = 'asc'
    
    if (sortConfig && sortConfig.key === columnIndex && sortConfig.direction === 'asc') {
      direction = 'desc'
    }

    setSortConfig({ key: columnIndex, direction })
    
    if (DEBUG) {
      console.log('[DEBUG] Table sorted by column', columnIndex, 'direction:', direction)
    }
  }

  // Handle download
  const handleDownload = () => {
    try {
      // Convert table to CSV
      const csvContent = [
        table.headers.join(','),
        ...processedData.map(row => row.map(cell => 
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = 'table_data.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      if (DEBUG) {
        console.log('[DEBUG] Table downloaded as CSV')
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to download table:', error)
      }
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    if (DEBUG) {
      console.log('[DEBUG] Table fullscreen toggled:', !isFullscreen)
    }
  }

  // Row renderer for virtual scrolling
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = paginatedData[index]
    
    return (
      <div style={style} className="table-row">
        {row.map((cell, cellIndex) => (
          <div key={cellIndex} className="table-cell">
            {cell?.toString() || ''}
          </div>
        ))}
      </div>
    )
  }

  try {
    const shouldUseVirtualScrolling = paginatedData.length > 100

    return (
      <div className={`table-renderer ${isFullscreen ? 'fullscreen' : ''}`}>
        {/* Table Header */}
        <div className="table-header">
          <div className="table-title">
            Data Table ({processedData.length} rows)
          </div>
          
          <div className="table-actions">
            {searchable && (
              <div className="table-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search table..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            )}
            
            <button
              onClick={toggleFullscreen}
              className="table-action-btn"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              <Maximize2 size={16} />
            </button>
            
            <button
              onClick={handleDownload}
              className="table-action-btn"
              title="Download as CSV"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div 
          className="table-content"
          style={{ maxHeight: isFullscreen ? 'calc(100vh - 120px)' : maxHeight }}
        >
          {/* Headers */}
          <div className="table-headers">
            {table.headers.map((header, index) => (
              <div
                key={index}
                className={`table-header-cell ${sortable ? 'sortable' : ''}`}
                onClick={() => handleSort(index)}
              >
                <span className="header-text">{header}</span>
                {sortable && (
                  <span className="sort-indicator">
                    {sortConfig?.key === index ? (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    ) : (
                      <div className="sort-placeholder" />
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Table Body */}
          <div className="table-body">
            {shouldUseVirtualScrolling ? (
              <List
                height={Math.min(maxHeight - 60, paginatedData.length * 40)}
                itemCount={paginatedData.length}
                itemSize={40}
                width="100%"
              >
                {Row}
              </List>
            ) : (
              <div className="table-rows">
                {paginatedData.map((row, rowIndex) => (
                  <div key={rowIndex} className="table-row">
                    {row.map((cell, cellIndex) => (
                      <div key={cellIndex} className="table-cell">
                        {cell?.toString() || ''}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {paginated && totalPages > 1 && (
          <div className="table-pagination">
            <div className="pagination-info">
              Page {currentPage} of {totalPages} ({processedData.length} total rows)
            </div>
            
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                First
              </button>
              
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
              
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Last
              </button>
            </div>
          </div>
        )}

        {/* Fullscreen overlay */}
        {isFullscreen && (
          <div className="table-fullscreen-overlay" onClick={toggleFullscreen}>
            <div className="table-fullscreen-content" onClick={(e) => e.stopPropagation()}>
              <div className="table-fullscreen-header">
                <h3>Data Table</h3>
                <button onClick={toggleFullscreen} className="close-fullscreen">×</button>
              </div>
              <div className="table-fullscreen-body">
                {/* Same table content but in fullscreen */}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    if (DEBUG) {
      console.error('[DEBUG] TableRenderer error:', error)
    }
    
    return (
      <div className="table-renderer error">
        <div className="table-header">
          <div className="table-title">Table (Error)</div>
        </div>
        
        <div className="error-message">Failed to render table</div>
        
        {DEBUG && (
          <details className="error-details">
            <summary>Error Details (Debug Mode)</summary>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </details>
        )}
        
        {/* Fallback: show raw data */}
        <div className="fallback-content">
          <pre className="table-data">{JSON.stringify(table, null, 2)}</pre>
        </div>
      </div>
    )
  }
}

export default TableRenderer 