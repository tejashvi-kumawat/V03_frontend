import React, { useState, useEffect } from 'react'
import mcpService, { MCPTool, MCPHealthResponse, MCPConfigResponse } from '../../services/mcpService'
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner'
import './MCPToolsManager.css'

interface MCPToolsManagerProps {
  className?: string
}

interface MCPServerHealth {
  status: string
  message: string
  connected: boolean
  tools_count: number
}

const MCPToolsManager: React.FC<MCPToolsManagerProps> = ({ className = '' }) => {
  const [tools, setTools] = useState<MCPTool[]>([])
  const [health, setHealth] = useState<MCPHealthResponse | null>(null)
  const [serverHealth, setServerHealth] = useState<MCPServerHealth | null>(null)
  const [config, setConfig] = useState<MCPConfigResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingTool, setUpdatingTool] = useState<string | null>(null)
  const [showConnectionTest, setShowConnectionTest] = useState(false)
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load tools and apply user preferences
      const toolsResponse = await mcpService.getTools()
      if (toolsResponse.success) {
        const toolPrefs = mcpService.getToolPreferences()
        const toolsWithPrefs = toolsResponse.tools.map(tool => ({
          ...tool,
          id: tool.name, // Use name as ID if no ID provided
          enabled: toolPrefs[tool.name]?.enabled ?? true // Default to enabled
        }))
        setTools(toolsWithPrefs)
      } else {
        setError(toolsResponse.error || 'Failed to load tools')
      }

      // Load other data
      const [healthResponse, configResponse, serverHealthResponse] = await Promise.allSettled([
        mcpService.getHealth(),
        mcpService.getConfig(),
        mcpService.getServerHealth()
      ])

      if (healthResponse.status === 'fulfilled') {
        setHealth(healthResponse.value)
      }
      if (configResponse.status === 'fulfilled') {
        setConfig(configResponse.value)
      }
      if (serverHealthResponse.status === 'fulfilled') {
        setServerHealth(serverHealthResponse.value)
      }

    } catch (err: any) {
      setError('Failed to load MCP data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTool = async (toolId: string, enabled: boolean) => {
    try {
      setUpdatingTool(toolId)
      const result = await mcpService.updateToolStatus(toolId, enabled)
      
      if (result.success) {
        setTools(prevTools => 
          prevTools.map(tool => 
            tool.id === toolId ? { ...tool, enabled } : tool
          )
        )
      } else {
        setError(result.error || 'Failed to update tool status')
      }
    } catch (err: any) {
      setError('Failed to update tool: ' + err.message)
    } finally {
      setUpdatingTool(null)
    }
  }

  const handleTestTool = async (toolName: string) => {
    try {
      setUpdatingTool(toolName)
      // Test tool with basic parameters
      const testParams = { 
        text: "This is a test message for the tool",
        user_dir: "test_user"
      }
      
      const result = await mcpService.callTool(toolName, testParams)
      if (result.success) {
        alert(`Tool ${toolName} test successful!\nResult: ${JSON.stringify(result.result, null, 2)}`)
      } else {
        alert(`Tool ${toolName} test failed: ${result.error}`)
      }
    } catch (err: any) {
      alert(`Tool test error: ${err.message}`)
    } finally {
      setUpdatingTool(null)
    }
  }

  const handleTestConnection = async () => {
    try {
      setShowConnectionTest(true)
      setConnectionTestResult(null)
      
      const result = await mcpService.testConnection()
      setConnectionTestResult(result)
      
      // Refresh data after test
      await loadData()
    } catch (err: any) {
      setConnectionTestResult({
        success: false,
        message: 'Connection test failed: ' + err.message
      })
    }
  }

  const handleRefresh = () => {
    loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const getStatusColor = (status: boolean) => {
    return status ? '#22c55e' : '#ef4444'
  }

  const getStatusText = (status: boolean) => {
    return status ? 'Connected' : 'Disconnected'
  }

  if (loading) {
    return (
      <div className={`mcp-tools-manager loading ${className}`}>
        <LoadingSpinner />
        <p>Loading MCP tools...</p>
      </div>
    )
  }

  return (
    <div className={`mcp-tools-manager ${className}`}>
      <div className="mcp-tools-header">
        <h3>MCP Tools Management</h3>
        <div className="mcp-tools-actions">
          <button 
            onClick={handleTestConnection}
            className="btn btn-secondary"
            disabled={showConnectionTest}
          >
            Test Connection
          </button>
          <button 
            onClick={handleRefresh}
            className="btn btn-primary"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* System Status */}
      <div className="mcp-status-section">
        <h4>System Status</h4>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">MCP Server:</span>
            <span 
              className="status-value"
              style={{ color: getStatusColor(serverHealth?.connected || false) }}
            >
              {getStatusText(serverHealth?.connected || false)}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Server Status:</span>
            <span 
              className="status-value"
              style={{ color: getStatusColor(serverHealth?.status === 'healthy') }}
            >
              {serverHealth?.status || 'Unknown'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Available Tools:</span>
            <span className="status-value">{health?.tools_available || tools.length || 0}</span>
          </div>
          <div className="status-item">
            <span className="status-label">QCN Registry:</span>
            <span className="status-value">{health?.qcn_registry_status || 'Unknown'}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Available QCNs:</span>
            <span className="status-value">{health?.available_qcns || 0}</span>
          </div>
        </div>

        {/* Server Health Message */}
        {serverHealth?.message && (
          <div className="server-health-message">
            <strong>Server Message:</strong> {serverHealth.message}
          </div>
        )}

        {/* API Keys Status */}
        <div className="api-keys-status">
          <h5>API Keys Status</h5>
          <div className="api-key-item">
            <span className="api-key-label">OpenAI:</span>
            <span 
              className="api-key-status"
              style={{ color: getStatusColor(config?.has_openai_key || false) }}
            >
              {config?.has_openai_key ? '✓ Configured' : '✗ Missing'}
            </span>
          </div>
          <div className="api-key-item">
            <span className="api-key-label">Anthropic:</span>
            <span 
              className="api-key-status"
              style={{ color: getStatusColor(config?.has_anthropic_key || false) }}
            >
              {config?.has_anthropic_key ? '✓ Configured' : '✗ Missing'}
            </span>
          </div>
        </div>
      </div>

      {/* Connection Test Results */}
      {showConnectionTest && connectionTestResult && (
        <div className={`connection-test-result ${connectionTestResult.success ? 'success' : 'error'}`}>
          <span className="test-icon">
            {connectionTestResult.success ? '✅' : '❌'}
          </span>
          <span className="test-message">{connectionTestResult.message}</span>
          <button 
            className="close-test-btn"
            onClick={() => setShowConnectionTest(false)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tools List */}
      <div className="tools-section">
        <h4>Available Tools ({tools.length})</h4>
        {tools.length === 0 ? (
          <div className="no-tools">
            <p>No MCP tools available. Check your server connection.</p>
          </div>
        ) : (
          <div className="tools-grid">
            {tools.map((tool) => (
              <div key={tool.id} className={`tool-card ${tool.enabled ? 'enabled' : 'disabled'}`}>
                <div className="tool-header">
                  <h5 className="tool-name">{tool.name}</h5>
                  <div className="tool-toggle">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={tool.enabled}
                        onChange={(e) => handleToggleTool(tool.id, e.target.checked)}
                        disabled={updatingTool === tool.id}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                
                <p className="tool-description">{tool.description}</p>
                
                <div className="tool-meta">
                  <span className="tool-type">{tool.type}</span>
                  <span className={`tool-status ${tool.enabled ? 'enabled' : 'disabled'}`}>
                    {updatingTool === tool.id ? 'Updating...' : (tool.enabled ? 'Enabled' : 'Disabled')}
                  </span>
                </div>

                {tool.schema && (
                  <details className="tool-schema">
                    <summary>Schema</summary>
                    <pre>{JSON.stringify(tool.schema, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debug Information */}
      {config?.mcp_server_mode && (
        <div className="debug-info">
          <details>
            <summary>Debug Information</summary>
            <div className="debug-content">
              <p><strong>Server Mode:</strong> {config.mcp_server_mode}</p>
              <p><strong>Server Available:</strong> {config.mcp_server_available ? 'Yes' : 'No'}</p>
              <p><strong>Available QCNs:</strong> {config.available_qcns.join(', ')}</p>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

export default MCPToolsManager 