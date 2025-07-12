// RCA (Root Cause Analysis) Types for AI Business Analytics & Intelligence Solution

export interface RCARequest {
  id: string
  user: {
    id: string
    username: string
    email: string
    first_name: string
    last_name: string
  }
  organization: string | null
  client_id: string
  problem_description: string
  data_sources: string[]
  context_info: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  started_at: string | null
  completed_at: string | null
  duration_minutes: number | null
  session?: RCASession
  result?: RCAResult
}

export interface RCARequestCreate {
  client_id: string
  problem_description: string
  data_sources: string[]
  context_info?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Record<string, any>
}

export interface RCARequestUpdate {
  problem_description?: string
  data_sources?: string[]
  context_info?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Record<string, any>
}

export interface RCASession {
  id: string
  session_id: string
  request: string
  phase: string
  iteration_count: number
  agent_config: Record<string, any>
  client_config: Record<string, any>
  current_hypotheses: any[]
  tools_used: string[]
  created_at: string
  updated_at: string
  hypotheses?: RCAHypothesis[]
  logs?: RCALog[]
  result?: RCAResult
}

export interface RCAResult {
  id: string
  request: string
  session: string
  root_cause: string | null
  confidence: number | null
  confidence_percentage: string
  findings: any[]
  recommendations: any[]
  hypotheses_tested: any[]
  test_results: any[]
  report: string
  duration_minutes: number | null
  created_at: string
  updated_at: string
}

export interface RCAHypothesis {
  id: string
  session: string
  hypothesis_id: string
  title: string
  description: string
  category: string
  status: 'active' | 'testing' | 'validated' | 'eliminated' | 'inconclusive'
  confidence: number
  confidence_percentage: string
  likelihood: number
  impact: 'low' | 'medium' | 'high' | 'critical'
  linked_stage: string
  tests_performed: any[]
  test_results: any[]
  created_at: string
  updated_at: string
}

export interface RCALog {
  id: string
  session: string
  step_type: 'INITIALIZATION' | 'SYMPTOM_ANALYSIS' | 'HYPOTHESIS_GENERATION' | 'TEST_PLANNING' | 'TEST_EXECUTION' | 'RESULT_ANALYSIS' | 'ITERATION' | 'CONCLUSION' | 'ERROR'
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  message: string
  data: Record<string, any>
  error: string
  tool_name: string
  tool_input: Record<string, any>
  tool_output: Record<string, any>
  duration_ms: number | null
  timestamp: string
}

export interface RCAStats {
  total_requests: number
  completed_requests: number
  failed_requests: number
  pending_requests: number
  average_duration: number
  success_rate: number
  priority_distribution: Record<string, number>
  status_distribution: Record<string, number>
  recent_requests: RCARequest[]
}

export interface RCADashboard {
  stats: RCAStats
  active_sessions: RCASession[]
  recent_results: RCAResult[]
  requests_timeline: any[]
  success_rate_timeline: any[]
  duration_distribution: any[]
}

export interface RCAToolStatus {
  tool_name: string
  status: string
  version: string
  capabilities: string[]
  last_used: string
  usage_count: number
  error_rate: number
}

export interface RCAClientConfig {
  client_id: string
  name: string
  description: string
  steps: number
  available: boolean
}

export interface RCAMessage {
  type: 'rca_request' | 'rca_progress' | 'rca_result' | 'rca_error'
  data: RCARequest | RCASession | RCAResult | { error: string }
  timestamp: string
}

export interface RCAPagination {
  page: number
  page_size: number
  total_count: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export interface RCAResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  error_code?: string
  pagination?: RCAPagination
}

// RCA Investigation States
export enum RCAInvestigationState {
  IDLE = 'idle',
  CREATING_REQUEST = 'creating_request',
  STARTING_INVESTIGATION = 'starting_investigation',
  INVESTIGATING = 'investigating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// RCA Chat Integration
export interface RCAChatContext {
  isRCAMode: boolean
  currentRequest: RCARequest | null
  investigationState: RCAInvestigationState
  progress: {
    phase: string
    iteration: number
    totalIterations: number
    percentage: number
  }
  result: RCAResult | null
  error: string | null
}

export interface RCAChatMessage {
  id: string
  type: 'user' | 'assistant' | 'rca_progress' | 'rca_result' | 'rca_error'
  content: string
  timestamp: string
  metadata?: {
    rca_request_id?: string
    rca_session_id?: string
    rca_phase?: string
    rca_progress?: number
    rca_hypotheses?: RCAHypothesis[]
    rca_logs?: RCALog[]
  }
}

// RCA Form Data
export interface RCAFormData {
  problem_description: string
  data_sources: string[]
  context_info: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  client_id: string
  metadata: Record<string, any>
}

// RCA Progress Updates
export interface RCAProgressUpdate {
  request_id: string
  session_id: string
  phase: string
  iteration: number
  total_iterations: number
  current_hypothesis?: string
  tools_used: string[]
  progress_percentage: number
  estimated_time_remaining?: number
  status_message: string
}

// RCA Error Types
export enum RCAErrorCode {
  REQUEST_CREATION_FAILED = 'REQUEST_CREATION_FAILED',
  INVESTIGATION_START_FAILED = 'INVESTIGATION_START_FAILED',
  INVESTIGATION_FAILED = 'INVESTIGATION_FAILED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INVALID_DATA_SOURCES = 'INVALID_DATA_SOURCES',
  OPENAI_API_ERROR = 'OPENAI_API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}

export interface RCAError {
  code: RCAErrorCode
  message: string
  details?: any
  timestamp: string
  recoverable: boolean
} 