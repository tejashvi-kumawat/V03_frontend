/**
 * MCP (Model Context Protocol) Service
 * Handles API calls related to MCP server tools and configuration
 */

import { apiClient } from './apiClient'

export interface MCPTool {
  id: string
  name: string
  description: string
  enabled: boolean
  type: 'mcp' | 'mcp_mock'
  schema?: Record<string, any>
  inputSchema?: Record<string, any>
}

export interface MCPToolsResponse {
  success: boolean
  tools: MCPTool[]
  total_tools: number
  mcp_server_connected: boolean
  server_url?: string
  error?: string
  error_code?: string
}

export interface MCPConfigResponse {
  success: boolean
  has_openai_key: boolean
  has_anthropic_key: boolean
  mcp_server_mode: string
  mcp_server_available: boolean
  available_qcns: string[]
  error?: string
}

export interface MCPHealthResponse {
  success: boolean
  mcp_available: boolean
  qcn_registry_status: string
  available_qcns: number
  tools_available: number
  server_connected: boolean
  error?: string
}

export interface QCNMode {
  name: string
  available: boolean
  type: string
  description: string
  error?: string
}

export interface QCNsResponse {
  success: boolean
  qcns: Record<string, QCNMode>
  total_qcns: number
  error?: string
}

class MCPService {
  /**
   * Get all available MCP tools from the server
   */
  async getTools(): Promise<MCPToolsResponse> {
    try {
      const response = await apiClient.get<{
        success: boolean
        tools: MCPTool[]
        connected: boolean
        server_path?: string
        server_url?: string
        tools_count?: number
        error?: string
      }>('/mcp/tools/')
      
      return {
        success: response.success,
        tools: response.tools || [],
        total_tools: response.tools?.length || 0,
        mcp_server_connected: response.connected || false,
        server_url: response.server_path || response.server_url || 'Not configured',
        error: response.error
      }
    } catch (error: any) {
      console.error('Error fetching MCP tools:', error)
      return {
        success: false,
        tools: [],
        total_tools: 0,
        mcp_server_connected: false,
        error: error.response?.data?.error || 'Failed to fetch MCP tools'
      }
    }
  }

  /**
   * Get MCP server health status
   */
  async getServerHealth(): Promise<{
    status: string
    message: string
    connected: boolean
    tools_count: number
  }> {
    try {
      const response = await apiClient.get<{
        status: string
        message: string
        connected: boolean
        tools_count: number
      }>('/mcp/healthy/')
      
      return response
    } catch (error: any) {
      console.error('Error fetching MCP server health:', error)
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to check server health',
        connected: false,
        tools_count: 0
      }
    }
  }

  /**
   * Get MCP configuration and API key status
   */
  async getConfig(): Promise<MCPConfigResponse> {
    try {
      const response = await apiClient.get<MCPConfigResponse>('/mcp/config/api-keys/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching MCP config:', error)
      return {
        success: false,
        has_openai_key: false,
        has_anthropic_key: false,
        mcp_server_mode: 'unknown',
        mcp_server_available: false,
        available_qcns: [],
        error: error.response?.data?.error || 'Failed to fetch MCP configuration'
      }
    }
  }

  /**
   * Get system health status including MCP and QCN information
   */
  async getHealth(): Promise<MCPHealthResponse> {
    try {
      const response = await apiClient.get<MCPHealthResponse>('/mcp/health/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching MCP health:', error)
      return {
        success: false,
        mcp_available: false,
        qcn_registry_status: 'error',
        available_qcns: 0,
        tools_available: 0,
        server_connected: false,
        error: error.response?.data?.error || 'Failed to fetch system health'
      }
    }
  }

  /**
   * Get available QCN modes
   */
  async getQCNs(): Promise<QCNsResponse> {
    try {
      const response = await apiClient.get<QCNsResponse>('/mcp/config/qcns/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching QCNs:', error)
      return {
        success: false,
        qcns: {},
        total_qcns: 0,
        error: error.response?.data?.error || 'Failed to fetch QCN modes'
      }
    }
  }

  /**
   * Update tool enabled/disabled status
   */
  async updateToolStatus(toolId: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      // Store tool preferences in localStorage for now
      const toolPrefs = JSON.parse(localStorage.getItem('mcp_tool_preferences') || '{}')
      toolPrefs[toolId] = { enabled, updatedAt: new Date().toISOString() }
      localStorage.setItem('mcp_tool_preferences', JSON.stringify(toolPrefs))
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MCP] Tool ${toolId} ${enabled ? 'enabled' : 'disabled'}`)
      }
      
      return { success: true }
    } catch (error: any) {
      console.error('Error updating tool status:', error)
      return {
        success: false,
        error: error.message || 'Failed to update tool status'
      }
    }
  }

  /**
   * Get tool preferences from localStorage
   */
  getToolPreferences(): Record<string, { enabled: boolean; updatedAt: string }> {
    try {
      return JSON.parse(localStorage.getItem('mcp_tool_preferences') || '{}')
    } catch {
      return {}
    }
  }

  /**
   * Test MCP server connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const response = await apiClient.post<{
        success: boolean
        message: string
        connected: boolean
        tools_available: number
        test_results?: Array<{ tool: string; success: boolean }>
        error?: string
      }>('/mcp/test-connection/')
      
      return {
        success: response.success,
        message: response.message,
        error: response.error
      }
    } catch (error: any) {
      console.error('Error testing MCP connection:', error)
      return {
        success: false,
        message: 'Connection test failed',
        error: error.response?.data?.error || error.message || 'Failed to test connection'
      }
    }
  }

  /**
   * Call a specific MCP tool directly
   */
  async callTool(toolName: string, parameters: Record<string, any>): Promise<{
    success: boolean
    result?: any
    error?: string
  }> {
    try {
      const response = await apiClient.post<{
        success: boolean
        result: any
        error?: string
      }>(`/mcp/tools/${toolName}/call/`, parameters)
      
      return {
        success: response.success,
        result: response.result,
        error: response.error
      }
    } catch (error: any) {
      console.error(`Error calling tool ${toolName}:`, error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || `Failed to call ${toolName}`
      }
    }
  }

  /**
   * Get tool usage statistics (future enhancement)
   */
  async getToolStats(): Promise<Record<string, number>> {
    try {
      // TODO: Implement backend endpoint for tool usage statistics
      // For now, return mock data
      return {
        'read_file': 45,
        'write_file': 23,
        'list_files': 67,
        'analyze_csv': 12,
        'text_summary': 89,
        'create_directory': 8
      }
    } catch (error) {
      console.error('Error fetching tool stats:', error)
      return {}
    }
  }
}

export const mcpService = new MCPService()
export default mcpService 