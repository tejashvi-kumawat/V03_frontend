// Chat Types for AI Business Analytics & Intelligence Solution

export enum QpnMode {
  SIMPLE = 'simple',
  TOOL_ENHANCED = 'simple_tool',
  RCA = 'rca',
  TIME_SERIES = 'time_series',
  EDA = 'eda',
  CUSTOM = 'custom'
}

export type MessageType = 'user' | 'assistant' | 'system' | 'error'

// Missing types that ChatPage.tsx needs
export interface MessageSuggestion {
  id: string
  text: string
  action?: 'send_message' | 'change_mode' | 'upload_file' | 'connect_data'
  metadata?: any
}

export interface ToolOption {
  id: string
  name: string
  description: string
  enabled: boolean
  icon?: string
  type?: string // Type of tool (e.g., 'mcp', 'builtin', 'custom')
}

export interface ModelOption {
  id: string
  name: string
  provider: string
  description: string
  maxTokens?: number
  costPer1k?: number
}

export interface DataConnector {
  id: string
  name: string
  type: 'file_manager' | 'google_sheets' | 'database' | 'api' | 'cloud_storage'
  status: 'connected' | 'disconnected' | 'error' | 'syncing'
  icon: string
  description: string
  config?: any
  lastSync?: Date
}

export interface Conversation {
  id: string
  title: string
  userId: string
  organizationId: string
  qpnMode: QpnMode
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastMessageAt: Date | null
  messageCount: number
  metadata: ConversationMetadata
}

export interface ConversationMetadata {
  tags: string[]
  summary?: string
  language: string
  modelUsed?: string
  averageResponseTime?: number
  userRating?: number
  sharedWith?: string[]
}

export interface Message {
  id: string
  conversationId: string
  userId: string
  content: string
  type: MessageType
  timestamp: Date
  editedAt?: Date
  qpnMode?: QpnMode
  processingTime?: number
  metadata: MessageMetadata
  attachments: Attachment[]
  parentMessageId?: string
  branchIndex?: number
}

export interface MessageMetadata {
  tokens?: number
  model?: string
  temperature?: number
  tools_used?: string[]
  confidence?: number
  citations?: Citation[]
  renderData?: RenderData
}

export interface RenderData {
  type: 'text' | 'markdown' | 'code' | 'chart' | 'table' | 'math' | 'image'
  data: any
  options?: any
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  thumbnail?: string
  uploadedAt: Date
}

export interface Citation {
  id: string
  text: string
  source: string
  url?: string
  confidence: number
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'chat_message' | 'typing_indicator' | 'connection_established' | 'error' | 'ping' | 'pong'
  data: any
  timestamp: Date
}

export interface ChatMessage extends WebSocketMessage {
  type: 'chat_message'
  data: {
    message: string
    user: string
    messageType: MessageType
    attachments?: string[]
  }
}

export interface TypingIndicator extends WebSocketMessage {
  type: 'typing_indicator'
  data: {
    user: string
    isTyping: boolean
  }
}

// QPN (Query Processing Network) Types
export interface QpnConfig {
  mode: QpnMode
  name: string
  description: string
  icon: string
  parameters: QpnParameter[]
  capabilities: string[]
  useCases: string[]
}

export interface QpnParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  default?: any
  description: string
  validation?: any
}

export interface QpnResult {
  success: boolean
  data: any
  processingTime: number
  metadata: {
    steps: QpnStep[]
    totalTokens?: number
    costs?: number
  }
  error?: QpnError
}

export interface QpnStep {
  id: string
  name: string
  description: string
  startTime: Date
  endTime: Date
  input: any
  output: any
  success: boolean
  error?: string
}

export interface QpnError {
  code: string
  message: string
  details?: any
  step?: string
}

// Chat UI Types
export interface ChatState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  isLoading: boolean
  isTyping: boolean
  isConnected: boolean
  selectedQpnMode: QpnMode
  suggestions: Suggestion[]
}

export interface Suggestion {
  id: string
  text: string
  action: 'send_message' | 'change_mode' | 'upload_file' | 'connect_data'
  metadata?: any
}

// File Manager Integration
export interface DataConnection {
  id: string
  name: string
  type: 'file_manager' | 'google_sheets' | 'database' | 'api'
  status: 'connected' | 'disconnected' | 'error'
  config: any
  lastSync?: Date
}

// Chart and Visualization Types
export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'box' | 'histogram'
  data: any
  options: ChartOptions
  interactive: boolean
}

export interface ChartOptions {
  title?: string
  xAxis?: AxisOptions
  yAxis?: AxisOptions
  legend?: LegendOptions
  colors?: string[]
  responsive?: boolean
  animations?: boolean
}

export interface AxisOptions {
  title?: string
  type?: 'linear' | 'log' | 'datetime' | 'category'
  min?: number
  max?: number
  format?: string
}

export interface LegendOptions {
  show?: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
  orientation?: 'horizontal' | 'vertical'
}

// Table Types
export interface TableData {
  columns: TableColumn[]
  rows: any[]
  pagination?: PaginationOptions
  sorting?: SortingOptions
  filtering?: FilteringOptions
}

export interface TableColumn {
  key: string
  title: string
  type: 'string' | 'number' | 'date' | 'boolean'
  sortable?: boolean
  filterable?: boolean
  width?: number
  format?: string
}

export interface PaginationOptions {
  enabled: boolean
  pageSize: number
  currentPage: number
  totalRows: number
}

export interface SortingOptions {
  enabled: boolean
  column?: string
  direction?: 'asc' | 'desc'
}

export interface FilteringOptions {
  enabled: boolean
  filters: Filter[]
}

export interface Filter {
  column: string
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than'
  value: any
}

// Math and Code Rendering
export interface CodeBlock {
  language: string
  code: string
  lineNumbers?: boolean
  highlight?: number[]
  theme?: string
}

export interface MathExpression {
  latex: string
  inline: boolean
  fontSize?: string
}

// Error Types
export interface ChatError {
  code: string
  message: string
  details?: any
  timestamp: Date
  recoverable: boolean
}

export enum ChatErrorCode {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  MESSAGE_SEND_FAILED = 'MESSAGE_SEND_FAILED',
  CONVERSATION_LOAD_FAILED = 'CONVERSATION_LOAD_FAILED',
  WEBSOCKET_ERROR = 'WEBSOCKET_ERROR',
  QPN_EXECUTION_FAILED = 'QPN_EXECUTION_FAILED',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
} 