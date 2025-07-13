// RCA Service for Root Cause Analysis Management

import { apiClient } from './apiClient'

const DEBUG = true // Set to true for debugging

export interface RCARequest {
  id: string
  user: {
    id: string
    username: string
    email: string
  }
  organization: string
  client_id: string
  problem_description: string
  data_sources: string[]
  context_info: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  started_at?: string
  completed_at?: string
  duration_minutes?: number
}

export interface RCAResult {
  id: string
  root_cause: string
  confidence: number
  confidence_percentage: string
  findings: string[]
  recommendations: string[]
  hypotheses_tested: Array<{
    id: string
    text: string
    rationale: string
    confidence: number
    status: 'active' | 'validated' | 'refuted' | 'inconclusive'
    tests_planned: string[]
    test_results: Array<{
      test_name: string
      tool: string
      success: boolean
      output: string
      error: string
      variables?: Record<string, any>
      duration_ms: number
    }>
    evidence: string[]
    created_at: string
    updated_at: string
  }>
  test_results: Array<{
    hypothesis_id: string
    test_name: string
    tool: string
    status: string
    result: string
    error: string
    duration_ms: number
  }>
  report: string
  duration_minutes: number
  created_at: string
  updated_at: string
}

export interface RCASession {
  id: string
  session_id: string
  phase: string
  iteration_count: number
  agent_config: Record<string, any>
  client_config: Record<string, any>
  current_hypotheses: any[]
  tools_used: string[]
  created_at: string
  updated_at: string
}

class RCAService {
  /**
   * Get all RCA requests for the current user
   */
  async getRCARequests(page = 1, pageSize = 20, search = '', status = '', priority = ''): Promise<{
    requests: RCARequest[]
    pagination: {
      page: number
      page_size: number
      total_count: number
      total_pages: number
      has_next: boolean
      has_previous: boolean
    }
  }> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] RCAService.getRCARequests - fetching requests')
      }

      const params: Record<string, any> = { page, page_size: pageSize }
      if (search) params.search = search
      if (status) params.status = status
      if (priority) params.priority = priority

      const response = await apiClient.get('/rca/requests/', { params })
      
      if (DEBUG) {
        console.log('[DEBUG] RCAService.getRCARequests - response:', response)
      }

      if (response.success && response.data) {
        return {
          requests: response.data.requests,
          pagination: response.data.pagination
        }
      }

      return { requests: [], pagination: { page: 1, page_size: 20, total_count: 0, total_pages: 0, has_next: false, has_previous: false } }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] RCAService.getRCARequests - failed:', error)
      }
      throw error
    }
  }

  /**
   * Create a new RCA request
   */
  async createRCARequest(data: {
    client_id: string
    problem_description: string
    data_sources?: string[]
    context_info?: string
    priority?: 'low' | 'medium' | 'high' | 'critical'
    metadata?: Record<string, any>
  }): Promise<RCARequest> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] RCAService.createRCARequest - creating request:', data)
      }

      const response = await apiClient.post('/rca/requests/', data)
      
      if (DEBUG) {
        console.log('[DEBUG] RCAService.createRCARequest - response:', response)
      }

      if (response.success && response.data) {
        return response.data
      }

      throw new Error('Failed to create RCA request')
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] RCAService.createRCARequest - failed:', error)
      }
      throw error
    }
  }

  /**
   * Get a specific RCA request
   */
  async getRCARequest(requestId: string): Promise<RCARequest> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] RCAService.getRCARequest - fetching request:', requestId)
      }

      const response = await apiClient.get(`/rca/requests/${requestId}/`)
      
      if (DEBUG) {
        console.log('[DEBUG] RCAService.getRCARequest - response:', response)
      }

      if (response.success && response.data) {
        return response.data
      }

      throw new Error('Failed to get RCA request')
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] RCAService.getRCARequest - failed:', error)
      }
      throw error
    }
  }

  /**
   * Start an RCA investigation
   */
  async startRCAInvestigation(requestId: string): Promise<RCARequest> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] RCAService.startRCAInvestigation - starting investigation:', requestId)
      }

      const response = await apiClient.post(`/rca/requests/${requestId}/start/`)
      
      if (DEBUG) {
        console.log('[DEBUG] RCAService.startRCAInvestigation - response:', response)
      }

      if (response.success && response.data) {
        return response.data
      }

      throw new Error('Failed to start RCA investigation')
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] RCAService.startRCAInvestigation - failed:', error)
      }
      throw error
    }
  }

  /**
   * Get RCA result for a request
   */
  async getRCAResult(requestId: string): Promise<RCAResult> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] RCAService.getRCAResult - fetching result:', requestId)
      }

      const response = await apiClient.get(`/rca/requests/${requestId}/result/`)
      
      if (DEBUG) {
        console.log('[DEBUG] RCAService.getRCAResult - response:', response)
      }

      if (response.success && response.data) {
        return response.data
      }

      throw new Error('Failed to get RCA result')
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] RCAService.getRCAResult - failed:', error)
      }
      throw error
    }
  }

  /**
   * Get RCA session for a request
   */
  async getRCASession(requestId: string): Promise<RCASession> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] RCAService.getRCASession - fetching session:', requestId)
      }

      const response = await apiClient.get(`/rca/requests/${requestId}/session/`)
      
      if (DEBUG) {
        console.log('[DEBUG] RCAService.getRCASession - response:', response)
      }

      if (response.success && response.data) {
        return response.data
      }

      throw new Error('Failed to get RCA session')
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] RCAService.getRCASession - failed:', error)
      }
      throw error
    }
  }

  /**
   * Get available client configurations
   */
  async getClientConfigs(): Promise<Array<{
    client_id: string
    name: string
    description: string
    steps: number
    available: boolean
  }>> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] RCAService.getClientConfigs - fetching client configurations')
        console.log('[DEBUG] RCAService.getClientConfigs - API_BASE_URL:', (import.meta as any).env?.VITE_API_BASE_URL || '/api')
        console.log('[DEBUG] RCAService.getClientConfigs - isAuthenticated:', apiClient.isAuthenticated())
        console.log('[DEBUG] RCAService.getClientConfigs - authTokens:', apiClient.getAuthTokens())
      }

      const response = await apiClient.get('/rca/configs/')
      
      if (DEBUG) {
        console.log('[DEBUG] RCAService.getClientConfigs - response:', response)
      }

      if (response.success && response.configurations) {
        return response.configurations
      }

      return []
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] RCAService.getClientConfigs - failed:', error)
        console.error('[DEBUG] RCAService.getClientConfigs - error response:', (error as any).response?.data)
        console.error('[DEBUG] RCAService.getClientConfigs - error status:', (error as any).response?.status)
      }
      throw error
    }
  }

  /**
   * Get RCA statistics
   */
  async getRCAStats(): Promise<any> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] RCAService.getRCAStats - fetching stats')
      }

      const response = await apiClient.get('/rca/stats/')
      
      if (DEBUG) {
        console.log('[DEBUG] RCAService.getRCAStats - response:', response)
      }

      if (response.success && response.data) {
        return response.data
      }

      throw new Error('Failed to get RCA stats')
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] RCAService.getRCAStats - failed:', error)
      }
      throw error
    }
  }

  /**
   * Get RCA dashboard data
   */
  async getRCADashboard(): Promise<any> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] RCAService.getRCADashboard - fetching dashboard data')
      }

      const response = await apiClient.get('/rca/dashboard/')
      
      if (DEBUG) {
        console.log('[DEBUG] RCAService.getRCADashboard - response:', response)
      }

      if (response.success && response.data) {
        return response.data
      }

      throw new Error('Failed to get RCA dashboard data')
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] RCAService.getRCADashboard - failed:', error)
      }
      throw error
    }
  }

  /**
   * Format confidence value as percentage
   */
  formatConfidence(confidence: number | null): string {
    if (confidence === null || confidence === undefined) {
      return 'N/A'
    }
    return `${(confidence * 100).toFixed(1)}%`
  }

  /**
   * Format RCA result for chat display
   */
  formatRCAResultForChat(result: RCAResult): string {
    const parts: string[] = []
    
    // Header
    parts.push('🔍 **Root Cause Analysis Complete**')
    parts.push('')
    
    // Root cause
    if (result.root_cause) {
      parts.push(`**Root Cause**: ${result.root_cause}`)
      parts.push(`**Confidence**: ${result.confidence_percentage}`)
    } else {
      parts.push('**Root Cause**: No definitive root cause identified')
    }
    
    parts.push('')
    
    // Key findings
    if (result.findings.length > 0) {
      parts.push('**Key Findings**:')
      for (const finding of result.findings.slice(0, 3)) {
        parts.push(`• ${finding}`)
      }
      if (result.findings.length > 3) {
        parts.push(`• ... and ${result.findings.length - 3} more findings`)
      }
      parts.push('')
    }
    
    // Recommendations
    if (result.recommendations.length > 0) {
      parts.push('**Top Recommendations**:')
      for (let i = 0; i < Math.min(3, result.recommendations.length); i++) {
        const rec = result.recommendations[i].replace('Action: ', '').replace(' -', '').trim()
        parts.push(`${i + 1}. ${rec}`)
      }
      if (result.recommendations.length > 3) {
        parts.push(`... and ${result.recommendations.length - 3} more recommendations`)
      }
      parts.push('')
    }
    
    // Hypothesis summary
    if (result.hypotheses_tested.length > 0) {
      const validatedCount = result.hypotheses_tested.filter(h => h.status === 'validated').length
      const refutedCount = result.hypotheses_tested.filter(h => h.status === 'refuted').length
      const totalCount = result.hypotheses_tested.length
      
      parts.push('**Investigation Summary**:')
      parts.push(`• ${totalCount} hypotheses tested`)
      parts.push(`• ${validatedCount} validated`)
      parts.push(`• ${refutedCount} refuted`)
      parts.push('')
    }
    
    // Duration
    if (result.duration_minutes) {
      parts.push(`**Investigation Duration**: ${result.duration_minutes.toFixed(1)} minutes`)
      parts.push('')
    }
    
    // Call to action
    parts.push('💡 **Next Steps**:')
    parts.push('• Review the detailed report for complete analysis')
    parts.push('• Implement the recommended actions')
    parts.push('• Monitor for similar issues in the future')
    parts.push('')
    parts.push('📊 *Full report available in the RCA dashboard*')
    
    return parts.join('\n')
  }

  /**
   * Poll for RCA investigation completion
   */
  async pollRCAInvestigation(requestId: string, onProgress?: (request: RCARequest) => void): Promise<RCARequest> {
    const maxAttempts = 60 // 5 minutes with 5-second intervals
    let attempts = 0
    
    while (attempts < maxAttempts) {
      try {
        const request = await this.getRCARequest(requestId)
        
        if (onProgress) {
          onProgress(request)
        }
        
        if (request.status === 'completed' || request.status === 'failed') {
          return request
        }
        
        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000))
        attempts++
        
      } catch (error) {
        if (DEBUG) {
          console.error('[DEBUG] RCAService.pollRCAInvestigation - poll failed:', error)
        }
        attempts++
      }
    }
    
    throw new Error('RCA investigation polling timeout')
  }
}

export const rcaService = new RCAService() 