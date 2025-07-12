// RCA Service for AI Business Analytics & Intelligence Solution

import { apiClient } from './apiClient'
import {
  RCARequest,
  RCARequestCreate,
  RCARequestUpdate,
  RCASession,
  RCAResult,
  RCAHypothesis,
  RCALog,
  RCAStats,
  RCADashboard,
  RCAToolStatus,
  RCAClientConfig,
  RCAResponse,
  RCAPagination,
  RCAInvestigationState,
  RCAProgressUpdate,
  RCAError,
  RCAErrorCode
} from '../types/rca'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

class RCAService {
  private baseUrl = '/rca'

  // Request Management
  async createRequest(requestData: RCARequestCreate): Promise<RCARequest> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] Creating RCA request:', requestData)
      }

      const response = await apiClient.post<any>(
        `${this.baseUrl}/requests/`,
        requestData
      )

      if (DEBUG) {
        console.log('[DEBUG] createRequest response:', response)
      }

      if (!response.success) {
        if (DEBUG) {
          console.error('[DEBUG] createRequest backend error:', response.error)
        }
        throw new Error(response.error || 'Failed to create RCA request')
      }

      const requestObj = response.request || response.data
      if (DEBUG) {
        console.log('[DEBUG] RCA request created:', requestObj)
      }

      return requestObj!
    } catch (error: any) {
      if (DEBUG) {
        console.error('[DEBUG] Error creating RCA request:', error)
      }
      // Surface backend error message if available
      if (error?.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      throw this.handleError(error, RCAErrorCode.REQUEST_CREATION_FAILED)
    }
  }

  async getRequests(params?: {
    page?: number
    page_size?: number
    search?: string
    status?: string
    priority?: string
  }): Promise<{ requests: RCARequest[]; pagination: RCAPagination }> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString())
      if (params?.search) queryParams.append('search', params.search)
      if (params?.status) queryParams.append('status', params.status)
      if (params?.priority) queryParams.append('priority', params.priority)

      const url = `${this.baseUrl}/requests/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await apiClient.get<RCAResponse<{
        requests: RCARequest[]
        pagination: RCAPagination
      }>>(url)

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch RCA requests')
      }

      return response.data!
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Error fetching RCA requests:', error)
      }
      throw this.handleError(error, RCAErrorCode.REQUEST_CREATION_FAILED)
    }
  }

  async getRequest(requestId: string): Promise<RCARequest> {
    try {
      const response = await apiClient.get<RCAResponse<RCARequest>>(
        `${this.baseUrl}/requests/${requestId}/`
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch RCA request')
      }

      return response.data!
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Error fetching RCA request:', error)
      }
      throw this.handleError(error, RCAErrorCode.REQUEST_CREATION_FAILED)
    }
  }

  async updateRequest(requestId: string, updateData: RCARequestUpdate): Promise<RCARequest> {
    try {
      const response = await apiClient.put<RCAResponse<RCARequest>>(
        `${this.baseUrl}/requests/${requestId}/`,
        updateData
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to update RCA request')
      }

      return response.data!
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Error updating RCA request:', error)
      }
      throw this.handleError(error, RCAErrorCode.REQUEST_CREATION_FAILED)
    }
  }

  async deleteRequest(requestId: string): Promise<void> {
    try {
      const response = await apiClient.delete<RCAResponse<void>>(
        `${this.baseUrl}/requests/${requestId}/`
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete RCA request')
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Error deleting RCA request:', error)
      }
      throw this.handleError(error, RCAErrorCode.REQUEST_CREATION_FAILED)
    }
  }

  // Investigation Control
  async startInvestigation(requestId: string): Promise<RCARequest> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] Starting RCA investigation for request:', requestId)
      }

      const response = await apiClient.post<RCAResponse<RCARequest>>(
        `${this.baseUrl}/requests/${requestId}/start/`
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to start RCA investigation')
      }

      if (DEBUG) {
        console.log('[DEBUG] RCA investigation started:', response.data)
      }

      return response.data!
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Error starting RCA investigation:', error)
      }
      throw this.handleError(error, RCAErrorCode.INVESTIGATION_START_FAILED)
    }
  }

  async getSession(requestId: string): Promise<RCASession> {
    try {
      const response = await apiClient.get<RCAResponse<RCASession>>(
        `${this.baseUrl}/requests/${requestId}/session/`
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch RCA session')
      }

      return response.data!
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Error fetching RCA session:', error)
      }
      throw this.handleError(error, RCAErrorCode.INVESTIGATION_FAILED)
    }
  }

  async getResult(requestId: string): Promise<RCAResult> {
    try {
      const response = await apiClient.get<RCAResponse<RCAResult>>(
        `${this.baseUrl}/requests/${requestId}/result/`
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch RCA result')
      }

      return response.data!
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Error fetching RCA result:', error)
      }
      throw this.handleError(error, RCAErrorCode.INVESTIGATION_FAILED)
    }
  }

  // Session Details
  async getSessionLogs(sessionId: string, params?: {
    page?: number
    page_size?: number
    level?: string
    step_type?: string
  }): Promise<{ logs: RCALog[]; pagination: RCAPagination }> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString())
      if (params?.level) queryParams.append('level', params.level)
      if (params?.step_type) queryParams.append('step_type', params.step_type)

      const url = `${this.baseUrl}/sessions/${sessionId}/logs/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await apiClient.get<RCAResponse<{
        logs: RCALog[]
        pagination: RCAPagination
      }>>(url)

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch session logs')
      }

      return response.data!
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Error fetching session logs:', error)
      }
      throw this.handleError(error, RCAErrorCode.INVESTIGATION_FAILED)
    }
  }

  async getSessionHypotheses(sessionId: string, params?: {
    status?: string
  }): Promise<RCAHypothesis[]> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.status) queryParams.append('status', params.status)

      const url = `${this.baseUrl}/sessions/${sessionId}/hypotheses/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await apiClient.get<RCAResponse<RCAHypothesis[]>>(url)

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch session hypotheses')
      }

      return response.data!
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Error fetching session hypotheses:', error)
      }
      throw this.handleError(error, RCAErrorCode.INVESTIGATION_FAILED)
    }
  }

  // Analytics and Dashboard
  async getStats(): Promise<RCAStats> {
    try {
      const response = await apiClient.get<RCAResponse<RCAStats>>(
        `${this.baseUrl}/stats/`
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch RCA stats')
      }

      return response.data!
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Error fetching RCA stats:', error)
      }
      throw this.handleError(error, RCAErrorCode.INVESTIGATION_FAILED)
    }
  }

  async getDashboard(): Promise<RCADashboard> {
    try {
      const response = await apiClient.get<RCAResponse<RCADashboard>>(
        `${this.baseUrl}/dashboard/`
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch RCA dashboard')
      }

      return response.data!
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Error fetching RCA dashboard:', error)
      }
      throw this.handleError(error, RCAErrorCode.INVESTIGATION_FAILED)
    }
  }

  // Configuration
  async getToolsStatus(): Promise<{
    tools: RCAToolStatus[]
    service_available: boolean
  }> {
    try {
      const response = await apiClient.get<RCAResponse<{
        tools: RCAToolStatus[]
        service_available: boolean
      }>>(`${this.baseUrl}/tools/`)

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch tools status')
      }

      return response.data!
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Error fetching tools status:', error)
      }
      throw this.handleError(error, RCAErrorCode.SERVICE_UNAVAILABLE)
    }
  }

  async getClientConfigs(): Promise<RCAClientConfig[]> {
    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/configs/`
      )
      if (DEBUG) {
        console.log('[DEBUG] getClientConfigs response:', response)
      }
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch client configs')
      }
      // Use response.configurations if present, else fallback to response.data
      return response.configurations || response.data || []
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Error fetching client configs:', error)
      }
      throw this.handleError(error, RCAErrorCode.SERVICE_UNAVAILABLE)
    }
  }

  // Utility Methods
  async checkServiceAvailability(): Promise<boolean> {
    try {
      const response = await this.getToolsStatus()
      return response.service_available
    } catch (error) {
      if (DEBUG) {
        console.log('[DEBUG] RCA service not available:', error)
      }
      return false
    }
  }

  async pollInvestigationProgress(requestId: string, onProgress?: (progress: RCAProgressUpdate) => void): Promise<RCAResult> {
    const maxAttempts = 60 // 5 minutes with 5-second intervals
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const request = await this.getRequest(requestId)
        
        if (request.status === 'completed') {
          const result = await this.getResult(requestId)
          return result
        } else if (request.status === 'failed') {
          throw new Error('RCA investigation failed')
        }

        // Get session for progress details
        try {
          const session = await this.getSession(requestId)
          if (onProgress && session) {
            const progress: RCAProgressUpdate = {
              request_id: requestId,
              session_id: session.session_id,
              phase: session.phase,
              iteration: session.iteration_count,
              total_iterations: 10, // Default, could be configurable
              tools_used: session.tools_used,
              progress_percentage: Math.min((session.iteration_count / 10) * 100, 95),
              status_message: `Phase: ${session.phase}, Iteration: ${session.iteration_count}`
            }
            onProgress(progress)
          }
        } catch (sessionError) {
          // Session might not be available yet, continue polling
          if (DEBUG) {
            console.log('[DEBUG] Session not available yet, continuing to poll')
          }
        }

        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000))
        attempts++
      } catch (error) {
        if (DEBUG) {
          console.error('[DEBUG] Error polling investigation progress:', error)
        }
        throw this.handleError(error, RCAErrorCode.INVESTIGATION_FAILED)
      }
    }

    throw new Error('Investigation timeout - took longer than expected')
  }

  // Error Handling
  private handleError(error: any, defaultCode: RCAErrorCode): RCAError {
    let errorCode = defaultCode
    let message = 'An unexpected error occurred'
    let details = null

    if (error.response?.data?.error_code) {
      errorCode = error.response.data.error_code as RCAErrorCode
    }

    if (error.response?.data?.error) {
      message = error.response.data.error
    } else if (error.message) {
      message = error.message
    }

    if (error.response?.data?.details) {
      details = error.response.data.details
    }

    return {
      code: errorCode,
      message,
      details,
      timestamp: new Date().toISOString(),
      recoverable: errorCode !== RCAErrorCode.PERMISSION_DENIED
    }
  }

  // Helper Methods
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical': return '#dc2626'
      case 'high': return '#ea580c'
      case 'medium': return '#d97706'
      case 'low': return '#059669'
      default: return '#6b7280'
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return '#059669'
      case 'in_progress': return '#d97706'
      case 'failed': return '#dc2626'
      case 'cancelled': return '#6b7280'
      case 'pending': return '#3b82f6'
      default: return '#6b7280'
    }
  }

  formatDuration(minutes: number | null): string {
    if (!minutes) return 'N/A'
    
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  formatConfidence(confidence: number | null): string {
    if (confidence === null) return 'N/A'
    return `${Math.round(confidence * 100)}%`
  }
}

// Export singleton instance
export const rcaService = new RCAService() 