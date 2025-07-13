import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useChat } from '../../contexts/ChatContext'
import { useTheme } from '../../contexts/ThemeContext'
import { QpnMode, MessageSuggestion, ToolOption, ModelOption, DataConnector } from '../../types/chat'
import { RCAInvestigationState, RCAFormData, RCAProgressUpdate, RCAResult as RCAResultType } from '../../types/rca'
import MessageRenderer from '../../components/MessageRenderer/MessageRenderer'
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner'
import RCAForm from '../../components/RCAForm/RCAForm'
import RCAProgress from '../../components/RCAProgress/RCAProgress'
import RCAResult from '../../components/RCAResult/RCAResult'
import { apiClient } from '../../services/apiClient'
import { rcaService } from '../../services/rcaService'
import { showSuccess, showError } from '../../utils/notifications'
import { browserNotificationService, sendRCANotification, showPermissionDialog, testNotification, refreshNotificationStatus } from '../../utils/browserNotifications'
import { 
  Send, 
  Paperclip, 
  Database, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  Menu, 
  X, 
  Edit3, 
  Trash2, 
  Share, 
  ChevronLeft, 
  ChevronRight,
  Bot,
  User as UserIcon,
  Lightbulb,
  Zap,
  BarChart3,
  TrendingUp,
  Microscope,
  Folder,
  AlertTriangle,
  Bell
} from 'lucide-react'
import './ChatPage.css'

// @ts-ignore - Vite environment variable access
const DEBUG = import.meta.env?.VITE_DEBUG === 'true'

const ChatPage: React.FC = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const { 
    conversations, 
    currentConversation, 
    messages, 
    isConnected, 
    connectionStatus, 
    isTyping,
    streamingMessage,
    createConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    sendMessage,
    editMessage,
    loading
  } = useChat()

  // UI State
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [dataConnectorVisible, setDataConnectorVisible] = useState(false)
  const [googleSheetsModalVisible, setGoogleSheetsModalVisible] = useState(false)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const [selectedQpnMode, setSelectedQpnMode] = useState<QpnMode | null>(null)
  const [qpnModeSelectable, setQpnModeSelectable] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4')
  
  // Google Sheets connection state
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('')
  const [googleSheetsName, setGoogleSheetsName] = useState('')
  const [connectingSheets, setConnectingSheets] = useState(false)
  const [dataConnectors, setDataConnectors] = useState<DataConnector[]>([])
  
  // Conversation editing state
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  
  // Message editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingMessageContent, setEditingMessageContent] = useState('')

  // RCA State
  const [rcaInvestigationState, setRcaInvestigationState] = useState<RCAInvestigationState>(RCAInvestigationState.IDLE)
  const [rcaRequest, setRcaRequest] = useState<any>(null)
  const [rcaProgress, setRcaProgress] = useState<RCAProgressUpdate | null>(null)
  const [rcaResult, setRcaResult] = useState<RCAResultType | null>(null)
  const [rcaError, setRcaError] = useState<string | null>(null)
  const [showRcaForm, setShowRcaForm] = useState(false)
  const [showNotificationBanner, setShowNotificationBanner] = useState(false)

  // Refs
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  if (DEBUG) {
    console.log('[DEBUG] ChatPage render - user:', user?.username, 'connected:', isConnected)
  }

  // Mock data for demonstration
  const qpnModes = [
    { mode: QpnMode.SIMPLE, name: 'Simple', description: 'Basic query processing', icon: '🔄' },
    { mode: QpnMode.TOOL_ENHANCED, name: 'Tool Enhanced', description: 'With tool integration', icon: '🛠️' },
    { mode: QpnMode.RCA, name: 'Root Cause Analysis', description: 'Deep problem analysis', icon: '🔍' },
    { mode: QpnMode.TIME_SERIES, name: 'Time Series', description: 'Temporal data analysis', icon: '📈' },
    { mode: QpnMode.EDA, name: 'Exploratory Data Analysis', description: 'Data exploration', icon: '📊' }
  ]

  const messageSuggestions: MessageSuggestion[] = [
    { id: '1', text: 'Analyze the latest sales data trends' },
    { id: '2', text: 'Generate a monthly performance report' },
    { id: '3', text: 'What are the key metrics for this quarter?' }
  ]

  // Dynamic state for MCP tools
  const [availableTools, setAvailableTools] = useState<ToolOption[]>([
    { id: 'python', name: 'Python Code Executor', description: 'Run Python scripts', enabled: true, type: 'builtin' },
    { id: 'data_analysis', name: 'Data Analysis', description: 'Analyze datasets', enabled: true, type: 'builtin' },
    { id: 'chart_generator', name: 'Chart Generator', description: 'Create visualizations', enabled: false, type: 'builtin' }
  ])
  const [mcpConnected, setMcpConnected] = useState(false)
  const [mcpError, setMcpError] = useState<string | null>(null)

  const availableModels: ModelOption[] = [
    { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Most capable model' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast and efficient' },
    { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic', description: 'Great for analysis' }
  ]

  // Load data sources and MCP tools on component mount
  useEffect(() => {
    loadDataSources()
    loadMcpTools()
    
      // Check notification permission and show banner if needed
  console.log('[DEBUG] Checking notification status on mount:', {
    isSupported: browserNotificationService.isNotificationSupported(),
    canSend: browserNotificationService.canSendNotifications(),
    permission: browserNotificationService.getPermissionStatus()
  })
  
  if (browserNotificationService.isNotificationSupported() && 
      !browserNotificationService.canSendNotifications() &&
      browserNotificationService.getPermissionStatus() !== 'denied') {
    setShowNotificationBanner(true)
  }
    
    // Set up notification click listener
    const handleNotificationClick = (event: CustomEvent) => {
      const { rcaRequestId, problemDescription } = event.detail
      
      // Find the RCA request and show the result
      if (rcaRequestId) {
        handleRCANotificationClick(rcaRequestId, problemDescription)
      }
    }

    window.addEventListener('rcaNotificationClick', handleNotificationClick as EventListener)
    
    return () => {
      window.removeEventListener('rcaNotificationClick', handleNotificationClick as EventListener)
    }
  }, [])

  const loadDataSources = async () => {
    try {
      // Set default data loaders first
      setDataConnectors([
        { id: 'file_manager', name: 'File Manager', type: 'file_manager', status: 'connected', icon: '📁', description: 'Browse and manage your files' },
        { id: 'google_sheets', name: 'Google Sheets', type: 'google_sheets', status: 'disconnected', icon: '📊', description: 'Import spreadsheet data' }
      ])

      // Load actual data sources from API
      try {
        const response = await apiClient.get('/files/data-sources/')
        if (response.success) {
          // Update status based on actual connections
          setDataConnectors(prev => prev.map(connector => {
            const apiConnector = response.data_sources.find((ds: any) => ds.type === connector.type)
            return apiConnector ? { ...connector, status: apiConnector.status } : connector
          }))
          
          if (DEBUG) {
            console.log('[DEBUG] Data sources loaded:', response.data_sources)
          }
        }
      } catch (apiError) {
        // Silently handle API errors - use default disconnected status
        if (DEBUG) {
          console.log('[DEBUG] Could not load data sources from API, using defaults')
        }
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to load data sources:', error)
      }
    }
  }

  const loadMcpTools = async () => {
    try {
      if (DEBUG) {
        console.log('[DEBUG] Loading MCP tools...')
      }
      
      const response = await apiClient.get('/mcp/tools/')
      
      if (response.success) {
        setMcpConnected(response.connected)
        setMcpError(response.error || null)
        
        if (response.connected && response.tools.length > 0) {
          // Add MCP tools to the existing tools list
          setAvailableTools(prev => {
            // Remove any existing MCP tools to avoid duplicates
            const nonMcpTools = prev.filter(tool => tool.type !== 'mcp')
            
            // Add new MCP tools
            const mcpTools = response.tools.map((tool: any) => ({
              id: tool.id,
              name: tool.name,
              description: tool.description,
              enabled: tool.enabled,
              type: tool.type || 'mcp'
            }))
            
            return [...nonMcpTools, ...mcpTools]
          })
          
          if (DEBUG) {
            console.log('[DEBUG] MCP tools loaded:', response.tools.length, 'tools')
          }
        } else {
          if (DEBUG) {
            console.log('[DEBUG] MCP server not connected or no tools available')
          }
        }
      } else {
        setMcpConnected(false)
        setMcpError(response.error || 'Failed to fetch MCP tools')
        
        if (DEBUG) {
          console.log('[DEBUG] Failed to load MCP tools:', response.error)
        }
      }
    } catch (error: any) {
      setMcpConnected(false)
      setMcpError(error.message || 'Error connecting to MCP server')
      
      if (DEBUG) {
        console.error('[DEBUG] Error loading MCP tools:', error)
      }
    }
  }

  const handleConnectGoogleSheets = () => {
    setGoogleSheetsModalVisible(true)
    setDataConnectorVisible(false)
  }

  const handleGoogleSheetsSubmit = async () => {
    if (!googleSheetsUrl.trim()) return

    try {
      setConnectingSheets(true)
      
      // Call backend API to connect Google Sheets
      const response = await apiClient.post('/files/data-sources/connect-google-sheets/', {
        url: googleSheetsUrl,
        name: googleSheetsName || undefined
      })

      if (response.success) {
        // Update the data connector status
        setDataConnectors(prev => prev.map(connector =>
          connector.type === 'google_sheets'
            ? { ...connector, status: 'connected' }
            : connector
        ))
        
        setGoogleSheetsModalVisible(false)
        setGoogleSheetsUrl('')
        setGoogleSheetsName('')
        setConnectingSheets(false)
        
        if (DEBUG) {
          console.log('[DEBUG] Google Sheets connected successfully:', response.data_source)
        }
        
        // TODO: Show success message to user
      } else {
        setConnectingSheets(false)
        // TODO: Show error message to user
        if (DEBUG) {
          console.error('[DEBUG] Failed to connect Google Sheets:', response.error)
        }
      }
    } catch (error: any) {
      setConnectingSheets(false)
      if (DEBUG) {
        console.error('[DEBUG] Failed to connect Google Sheets:', error)
      }
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.error || error.message || 'Failed to connect Google Sheets'
      alert(`Error: ${errorMessage}`)
    }
  }

  const handleConnectorAction = (connector: DataConnector) => {
    if (connector.type === 'google_sheets') {
      if (connector.status === 'connected') {
        // TODO: Show manage options
        console.log('Manage Google Sheets')
      } else {
        handleConnectGoogleSheets()
      }
    } else if (connector.type === 'file_manager') {
      handleOpenFileManager()
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle QPN mode selection (only once per conversation)
  useEffect(() => {
    if (currentConversation && messages.length > 0) {
      setQpnModeSelectable(false)
    } else {
      setQpnModeSelectable(true)
    }
  }, [currentConversation, messages])

  const handleNewConversation = async () => {
    try {
      await createConversation()
      setSelectedQpnMode(null)
      setQpnModeSelectable(true)
      if (DEBUG) {
        console.log('[DEBUG] New conversation created')
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to create conversation:', error)
      }
    }
  }

  // RCA Functions
  const startRCAInvestigation = async (problemDescription: string) => {
    try {
      setRcaInvestigationState(RCAInvestigationState.CREATING_REQUEST)
      setRcaError(null)

      // Add user message to conversation
      if (currentConversation) {
        await sendMessage(`🔍 **RCA Investigation Started**\n\n**Problem Description:**\n${problemDescription}`, [])
      }

      // Create RCA request
      const requestData: RCAFormData = {
        problem_description: problemDescription,
        data_sources: ['demo_data'],
        context_info: '',
        priority: 'medium',
        client_id: 'client_demo', // Use correct client_id
        metadata: {}
      }

      const request = await rcaService.createRCARequest(requestData)
      setRcaRequest(request)

      // Add investigation start message
      if (currentConversation) {
        await sendMessage(`🚀 **Investigation Created**\n\n**Request ID:** ${request.id}\n**Status:** ${request.status}\n**Priority:** ${request.priority}`, [])
      }

      // Start investigation
      setRcaInvestigationState(RCAInvestigationState.STARTING_INVESTIGATION)
      const startedRequest = await rcaService.startRCAInvestigation(request.id)
      setRcaRequest(startedRequest)

      // Add investigation progress message
      if (currentConversation) {
        await sendMessage(`⚡ **Investigation In Progress**\n\nAnalyzing problem and generating hypotheses...`, [])
      }

      // Poll for progress
      setRcaInvestigationState(RCAInvestigationState.INVESTIGATING)
      const completedRequest = await rcaService.pollRCAInvestigation(
        request.id,
        (requestProgress) => {
          // Convert RCARequest to RCAProgressUpdate
          const progress: RCAProgressUpdate = {
            request_id: requestProgress.id,
            session_id: '', // Will be populated when session is available
            phase: 'investigating',
            iteration: 0,
            total_iterations: 10,
            tools_used: [],
            progress_percentage: requestProgress.status === 'completed' ? 100 : 
                                requestProgress.status === 'in_progress' ? 50 : 0,
            status_message: `Status: ${requestProgress.status}`
          }
          setRcaProgress(progress)
        }
      )

      // Get the final result
      const result = await rcaService.getRCAResult(request.id)
      setRcaResult(result as any)
      setRcaInvestigationState(RCAInvestigationState.COMPLETED)
      setRcaProgress(null)

      // Add investigation results to conversation
      if (currentConversation) {
        const resultMessage = formatRCAResultForChat(result)
        await sendMessage(resultMessage, [])
      }

      if (DEBUG) {
        console.log('[DEBUG] RCA investigation completed:', result)
      }
    } catch (error) {
      console.error('[DEBUG] RCA investigation failed:', error)
      setRcaError(error instanceof Error ? error.message : 'RCA investigation failed')
      setRcaInvestigationState(RCAInvestigationState.FAILED)
      
      // Add error message to conversation
      if (currentConversation) {
        const errorMessage = `❌ **RCA Investigation Failed**\n\n**Error:** ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support.`
        await sendMessage(errorMessage, [])
      }
    }
  }

  const handleRCAFormSubmit = async (formData: RCAFormData) => {
    try {
      setRcaInvestigationState(RCAInvestigationState.CREATING_REQUEST)
      setRcaError(null)

      // Request notification permission if not already granted
      console.log('[DEBUG] Checking notification permission before RCA...')
      if (!browserNotificationService.canSendNotifications()) {
        console.log('[DEBUG] Permission not granted, requesting...')
        const permissionGranted = await showPermissionDialog()
        if (!permissionGranted) {
          console.log('[DEBUG] Notification permission not granted, continuing without notifications')
        } else {
          console.log('[DEBUG] Notification permission granted!')
          refreshNotificationStatus()
        }
      } else {
        console.log('[DEBUG] Notification permission already granted')
      }

      setShowRcaForm(false)

      // Add user message to conversation
      if (currentConversation) {
        await sendMessage(`🔍 **RCA Investigation Request**\n\n**Problem:** ${formData.problem_description}\n**Client:** ${formData.client_id}\n**Priority:** ${formData.priority}`, [])
      }

      const request = await rcaService.createRCARequest(formData)
      if (!request || !request.id) {
        console.error('[DEBUG] RCA createRequest returned invalid response:', request)
        setRcaError('Failed to create RCA request. Please try again.')
        setRcaInvestigationState(RCAInvestigationState.FAILED)
        return
      }
      setRcaRequest(request)

      // Add investigation start message
      if (currentConversation) {
        await sendMessage(`🚀 **Investigation Created**\n\n**Request ID:** ${request.id}\n**Status:** ${request.status}\n**Priority:** ${request.priority}`, [])
      }

      // Start investigation
      setRcaInvestigationState(RCAInvestigationState.STARTING_INVESTIGATION)
      const startedRequest = await rcaService.startRCAInvestigation(request.id)
      if (!startedRequest || !startedRequest.id) {
        console.error('[DEBUG] RCA startRCAInvestigation returned invalid response:', startedRequest)
        setRcaError('Failed to start RCA investigation. Please try again.')
        setRcaInvestigationState(RCAInvestigationState.FAILED)
        return
      }
      setRcaRequest(startedRequest)

      // Add investigation progress message
      if (currentConversation) {
        await sendMessage(`⚡ **Investigation In Progress**\n\nAnalyzing problem and generating hypotheses...`, [])
      }

      // Poll for progress
      setRcaInvestigationState(RCAInvestigationState.INVESTIGATING)
      const completedRequest = await rcaService.pollRCAInvestigation(
        request.id,
        (requestProgress) => {
          // Convert RCARequest to RCAProgressUpdate
          const progress: RCAProgressUpdate = {
            request_id: requestProgress.id,
            session_id: '', // Will be populated when session is available
            phase: 'investigating',
            iteration: 0,
            total_iterations: 10,
            tools_used: [],
            progress_percentage: requestProgress.status === 'completed' ? 100 : 
                                requestProgress.status === 'in_progress' ? 50 : 0,
            status_message: `Status: ${requestProgress.status}`
          }
          setRcaProgress(progress)
        }
      )

      // Get the final result
      const result = await rcaService.getRCAResult(request.id)
      setRcaResult(result as any)
      setRcaInvestigationState(RCAInvestigationState.COMPLETED)
      setRcaProgress(null)

      // Send browser notification if permission granted
      console.log('[DEBUG] Notification permission check:', {
        isSupported: browserNotificationService.isNotificationSupported(),
        canSend: browserNotificationService.canSendNotifications(),
        permission: browserNotificationService.getPermissionStatus()
      })
      
      let notificationSent = false
      if (browserNotificationService.canSendNotifications()) {
        console.log('[DEBUG] Sending RCA notification for request:', request.id)
        try {
          await sendRCANotification(request.id, formData.problem_description)
          console.log('[DEBUG] RCA notification sent successfully')
          notificationSent = true
        } catch (error) {
          console.error('[DEBUG] Failed to send RCA notification:', error)
        }
      } else {
        console.log('[DEBUG] Cannot send notifications - permission not granted')
      }
      
      // Show in-app notification if browser notification failed
      if (!notificationSent) {
        showSuccess(`RCA analysis completed! Check the results above.`)
      }

      // Add investigation results to conversation
      if (currentConversation) {
        const resultMessage = formatRCAResultForChat(result)
        await sendMessage(resultMessage, [])
      }

      if (DEBUG) {
        console.log('[DEBUG] RCA investigation completed:', result)
      }
    } catch (error) {
      console.error('[DEBUG] RCA investigation failed:', error)
      setRcaError(error instanceof Error ? error.message : 'RCA investigation failed')
      setRcaInvestigationState(RCAInvestigationState.FAILED)
      
      // Add error message to conversation
      if (currentConversation) {
        const errorMessage = `❌ **RCA Investigation Failed**\n\n**Error:** ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support.`
        await sendMessage(errorMessage, [])
      }
    }
  }

  const formatRCAResultForChat = (result: any): string => {
    let message = `🎯 **RCA Investigation Complete**\n\n`
    
    if (result.root_cause) {
      message += `**🔍 Root Cause:**\n${result.root_cause}\n\n`
    }
    
    if (result.confidence !== null && result.confidence !== undefined) {
      message += `**📊 Confidence:** ${Math.round(result.confidence * 100)}%\n\n`
    }
    
    if (result.findings && result.findings.length > 0) {
      message += `**📋 Key Findings:**\n`
      result.findings.forEach((finding, index) => {
        message += `${index + 1}. ${finding}\n`
      })
      message += `\n`
    }
    
    if (result.recommendations && result.recommendations.length > 0) {
      message += `**💡 Recommendations:**\n`
      result.recommendations.forEach((rec, index) => {
        message += `${index + 1}. ${rec}\n`
      })
      message += `\n`
    }
    
    if (result.duration_minutes) {
      message += `**⏱️ Duration:** ${Math.round(result.duration_minutes)} minutes\n\n`
    }
    
    message += `**📈 Status:** ${result.status || 'completed'}`
    
    return message
  }

  const handleRCACancel = () => {
    setRcaInvestigationState(RCAInvestigationState.IDLE)
    setRcaRequest(null)
    setRcaProgress(null)
    setRcaResult(null)
    setRcaError(null)
    setShowRcaForm(false)
  }

  const handleRCANotificationClick = async (rcaRequestId: string, problemDescription: string) => {
    try {
      // Fetch the RCA result
      const result = await rcaService.getRCAResult(rcaRequestId)
      setRcaResult(result as any)
      setRcaInvestigationState(RCAInvestigationState.COMPLETED)
      
      // Show success message
      showSuccess(`RCA analysis for "${problemDescription.substring(0, 50)}..." loaded successfully`)
    } catch (error) {
      console.error('Failed to load RCA result from notification:', error)
      showError('Failed to load RCA analysis result')
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() && selectedFiles.length === 0) return

    try {
      // If no conversation exists, create one automatically
      if (!currentConversation) {
        if (DEBUG) {
          console.log('[DEBUG] No conversation exists, creating new one automatically')
        }
        
        // Create a new conversation with auto-generated title based on message content
        const title = messageText.length > 50 
          ? messageText.substring(0, 47) + '...' 
          : messageText || 'New Conversation'
        
        await createConversation(title, selectedQpnMode || QpnMode.SIMPLE)
        
        // Wait a moment for the conversation to be created and selected
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Check if RCA mode is enabled
      if (selectedQpnMode === QpnMode.RCA) {
        // Start RCA investigation
        await startRCAInvestigation(messageText)
      } else {
        // Normal chat message
      await sendMessage(messageText, selectedFiles)
      }

      setMessageText('')
      setSelectedFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Disable QPN mode selection after first message
      if (qpnModeSelectable && selectedQpnMode) {
        setQpnModeSelectable(false)
      }
      
      if (DEBUG) {
        console.log('[DEBUG] Message sent')
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to send message:', error)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
    if (DEBUG) {
      console.log('[DEBUG] Files selected:', files.length)
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSuggestionClick = (suggestion: MessageSuggestion) => {
    setMessageText(suggestion.text)
    messageInputRef.current?.focus()
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] ChatPage - logout failed:', error)
      }
    }
  }

  const handleOpenFileManager = () => {
    if (DEBUG) {
      console.log('[DEBUG] Opening File Manager')
    }
    // Navigate to file manager page using React Router
    navigate('/files')
  }

  // Conversation editing functions
  const handleStartRename = (conversationId: string, currentTitle: string) => {
    setEditingConversationId(conversationId)
    setEditingTitle(currentTitle)
    // Focus the input after state update
    setTimeout(() => editInputRef.current?.focus(), 100)
  }

  const handleSaveRename = async () => {
    if (!editingConversationId || !editingTitle.trim()) return
    
    try {
      await renameConversation(editingConversationId, editingTitle.trim())
      setEditingConversationId(null)
      setEditingTitle('')
      if (DEBUG) {
        console.log('[DEBUG] Conversation renamed successfully')
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to rename conversation:', error)
      }
      // Keep editing state active on error
    }
  }

  const handleCancelRename = () => {
    setEditingConversationId(null)
    setEditingTitle('')
  }

  const handleRenameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelRename()
    }
  }

  const handleShare = (conversationId: string) => {
    // TODO: Implement sharing functionality
    if (DEBUG) {
      console.log('[DEBUG] Sharing conversation:', conversationId)
    }
    // For now, just copy conversation URL to clipboard
    const shareUrl = `${window.location.origin}/chat?conversation=${conversationId}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      // You could show a toast notification here
      console.log('Share URL copied to clipboard:', shareUrl)
    }).catch(err => {
      console.error('Failed to copy share URL:', err)
    })
  }

  // Delete confirmation functions
  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return
    
    try {
      await deleteConversation(conversationToDelete)
      setDeleteConfirmVisible(false)
      setConversationToDelete(null)
      if (DEBUG) {
        console.log('[DEBUG] Conversation deleted successfully')
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to delete conversation:', error)
      }
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmVisible(false)
    setConversationToDelete(null)
  }

  // Message editing functions
  const handleStartMessageEdit = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId)
    setEditingMessageContent(currentContent)
    if (DEBUG) {
      console.log('[DEBUG] Starting message edit:', messageId)
    }
  }

  const handleSaveMessageEdit = async () => {
    if (!editingMessageId || !editingMessageContent.trim()) return
    
    try {
      // This will create a new branch from this message
      await editMessage(editingMessageId, editingMessageContent.trim())
      setEditingMessageId(null)
      setEditingMessageContent('')
      if (DEBUG) {
        console.log('[DEBUG] Message edited successfully - new branch created')
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to edit message:', error)
      }
      // Keep editing state active on error
    }
  }

  const handleCancelMessageEdit = () => {
    setEditingMessageId(null)
    setEditingMessageContent('')
  }

  const handleMessageEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveMessageEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelMessageEdit()
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getQpnModeIcon = (mode: QpnMode) => {
    const icons = {
      [QpnMode.SIMPLE]: <Zap size={16} />,
      [QpnMode.TOOL_ENHANCED]: <Bot size={16} />,
      [QpnMode.RCA]: <Microscope size={16} />,
      [QpnMode.TIME_SERIES]: <TrendingUp size={16} />,
      [QpnMode.EDA]: <BarChart3 size={16} />
    }
    return icons[mode] || <Zap size={16} />
  }

  const getMessageIcon = (type: 'user' | 'assistant' | 'system') => {
    switch (type) {
      case 'user':
        return <UserIcon size={20} />
      case 'assistant':
        return <Bot size={20} />
      default:
        return <Bot size={20} />
    }
  }

  return (
    <div className="chat-page">
      {/* Sidebar */}
      <div className={`chat-sidebar ${sidebarVisible ? 'visible' : 'hidden'}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-main">
            <h2>AI Analyst</h2>
            <div className={`connection-status ${connectionStatus}`}>
              <span className="status-indicator"></span>
              {connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 
               connectionStatus === 'error' ? 'Connection Error' : 'Disconnected'}
            </div>
          </div>
          <button
            onClick={() => setSidebarVisible(false)}
            className="hide-sidebar-btn"
            title="Hide sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* New Conversation Button */}
        <div className="new-conversation-section">
          <button
            onClick={handleNewConversation}
            className="new-conversation-btn"
            disabled={loading}
            title="Start a new conversation"
          >
            <Plus size={16} />
            New Conversation
          </button>
        </div>

        {/* Search */}
        <div className="search-section">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="conversations-section">
          <div className="conversations-list">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`conversation-item ${currentConversation?.id === conversation.id ? 'active' : ''}`}
                onClick={() => selectConversation(conversation.id)}
              >
                <div className="conversation-main">
                  {editingConversationId === conversation.id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={handleRenameKeyPress}
                      onBlur={handleSaveRename}
                      className="conversation-title-input"
                      autoFocus
                    />
                  ) : (
                    <span className="conversation-title">{conversation.title}</span>
                  )}
                </div>
                
                <div className="conversation-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartRename(conversation.id, conversation.title)
                    }}
                    className="conversation-action-btn"
                    title="Rename"
                  >
                    <Edit3 size={12} />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleShare(conversation.id)
                    }}
                    className="conversation-action-btn"
                    title="Share"
                  >
                    <Share size={12} />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setConversationToDelete(conversation.id)
                      setDeleteConfirmVisible(true)
                    }}
                    className="conversation-action-btn delete"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Section */}
        <div className="user-section">
          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="username">{user?.username}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
          
          <div className="user-actions">
            <button
              onClick={() => setSettingsVisible(true)}
              className="user-action-btn"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            
            <button
              onClick={handleLogout}
              className="user-action-btn"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {/* Chat Header */}
        <div className="chat-header">
          {!sidebarVisible && (
            <button
              onClick={() => setSidebarVisible(true)}
              className="show-sidebar-btn"
              title="Show sidebar"
            >
              <Menu size={20} />
            </button>
          )}
          
          <div className="chat-title">
            {currentConversation ? (
              <>
                <h1>{currentConversation.title.replace(/ \d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{1,2}:\d{1,2}/, '')}</h1>
                <div className="chat-subtitle">
                  <span className="qpn-mode">QPN Mode: {currentConversation.qpnMode}</span>
                  <span className="conversation-date">{new Date(currentConversation.createdAt).toLocaleDateString()} {new Date(currentConversation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </>
            ) : (
              <h1>AI Business Analytics & Intelligence</h1>
            )}
          </div>
          
          <div className="chat-header-actions">
            <button 
              onClick={handleOpenFileManager} 
              className="file-manager-btn"
              title="File Manager"
            >
              <Folder size={20} />
            </button>
            <button 
              onClick={() => setSettingsVisible(true)} 
              className="settings-btn"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={toggleTheme} 
              className="theme-toggle-btn"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Notification Permission Banner */}
        {showNotificationBanner && (
          <div className="notification-banner">
            <div className="notification-banner-content">
              <Bell size={16} />
              <span>Enable notifications to get updates when your RCA analysis is complete</span>
              <div className="notification-banner-actions">
                <button
                  onClick={async () => {
                    const granted = await showPermissionDialog()
                    if (granted) {
                      refreshNotificationStatus()
                      setShowNotificationBanner(false)
                    }
                  }}
                  className="btn btn-primary btn-sm"
                >
                  Enable
                </button>
                <button
                  onClick={() => setShowNotificationBanner(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Dismiss
                </button>
                <button
                  onClick={async () => {
                    console.log('[DEBUG] Testing notification...')
                    await testNotification()
                    refreshNotificationStatus()
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                >
                  Test
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="messages-area">
          {loading ? (
            <div className="loading-container">
              <LoadingSpinner message="Loading conversations..." />
            </div>
          ) : currentConversation ? (
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="welcome-message">
                  <h2>Welcome to {currentConversation.title}</h2>
                  <p>Choose a QPN mode to get started with specific analysis capabilities.</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message ${message.type}`}
                    >
 
                      <div className="message-content">
                        {editingMessageId === message.id ? (
                          <div className="message-edit-form">
                            <textarea
                              value={editingMessageContent}
                              onChange={(e) => setEditingMessageContent(e.target.value)}
                              onKeyDown={handleMessageEditKeyPress}
                              className="message-edit-input"
                              autoFocus
                              rows={3}
                              placeholder="Edit your message..."
                            />
                            <div className="message-edit-actions">
                              <button onClick={handleSaveMessageEdit} className="save-edit-btn">
                                Save & Create Branch
                              </button>
                              <button onClick={handleCancelMessageEdit} className="cancel-edit-btn">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <MessageRenderer content={message.content} />
                        )}
                      </div>
                      <div className="message-header">
                      <div className="message-header-actions">
                        {message.type === 'user' && (
                          <button
                            onClick={() => handleStartMessageEdit(message.id, message.content)}
                            className="message-action-btn"
                            title="Edit message to create new branch"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                      </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Streaming AI Response */}
                  {streamingMessage && (
                    <div className="message assistant streaming">
                      <div className="message-header">
                        <span className="message-author">
                          <Bot size={16} />
                          AI Assistant
                        </span>
                        <span className="streaming-indicator">
                          <span className="streaming-dot"></span>
                          Generating...
                        </span>
                      </div>
                      <div className="message-content streaming-content">
                        <MessageRenderer content={streamingMessage.content} />
                        <span className="cursor-blink">|</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Typing Indicator */}
                  {isTyping && !streamingMessage && (
                    <div className="message assistant typing">
                      <div className="message-header">
                        <span className="message-author">
                          <Bot size={16} />
                          AI Assistant
                        </span>
                      </div>
                      <div className="message-content">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="welcome-message">
              <h2>Welcome to AI Business Analytics & Intelligence</h2>
              <p>Create a new conversation to get started with intelligent data analysis.</p>
              
              <div className="getting-started">
                <h3>What can you do here?</h3>
                <ul>
                  <li>🔍 <strong>Root Cause Analysis</strong> - Deep dive into problems and find solutions</li>
                  <li>📈 <strong>Time Series Analysis</strong> - Analyze trends and patterns over time</li>
                  <li>📊 <strong>Exploratory Data Analysis</strong> - Discover insights in your data</li>
                  <li>🛠️ <strong>Tool Enhanced Mode</strong> - Leverage integrated analytical tools</li>
                  <li>💬 <strong>Simple Chat</strong> - Ask questions and get intelligent responses</li>
                </ul>
                
                <button
                  onClick={handleNewConversation}
                  className="create-conversation-btn"
                  disabled={loading}
                >
                  <Plus size={20} />
                  Start New Conversation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Message Input Area */}
        <div className="message-input-area">
          {/* Suggestions */}
          {messageSuggestions.length > 0 && messages.length === 0 && (
            <div className="suggestions-section">
              <div className="suggestions-header">
                <Lightbulb size={16} />
                <span>Suggestions</span>
              </div>
              <div className="suggestions-list">
                {messageSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="suggestion-item"
                  >
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QPN Mode Selector */}
          {qpnModeSelectable && (
            <div className="qpn-mode-section">
              <div className="qpn-mode-header">
                <span>Select Processing Mode</span>
                <span className="qpn-mode-note">(Can only be set once per conversation)</span>
              </div>
              <div className="qpn-modes-list">
                {qpnModes.map((mode) => (
                  <button
                    key={mode.mode}
                    onClick={() => setSelectedQpnMode(mode.mode)}
                    className={`qpn-mode-item ${selectedQpnMode === mode.mode ? 'selected' : ''}`}
                  >
                    <div className="qpn-mode-icon">
                      {getQpnModeIcon(mode.mode)}
                    </div>
                    <div className="qpn-mode-info">
                      <span className="qpn-mode-name">{mode.name}</span>
                      <span className="qpn-mode-desc">{mode.description}</span>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* RCA Form Button */}
              {selectedQpnMode === QpnMode.RCA && (
                <div className="rca-form-section">
                  <button
                    onClick={() => setShowRcaForm(true)}
                    className="rca-form-btn"
                  >
                    <Microscope size={16} />
                    Configure RCA Investigation
                  </button>
                  <p className="rca-form-note">
                    Set up detailed parameters for your root cause analysis investigation
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="selected-files">
              {selectedFiles.map((file, index) => (
                <div key={index} className="selected-file">
                  <span className="file-name">{file.name}</span>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="remove-file-btn"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Message Input Controls */}
          <div className="message-input-controls">
            {/* Tool and Model Selectors */}
            <div className="input-controls-row">
              <div className="control-group">
                <label>Tools</label>
                <select
                  value={selectedTool || ''}
                  onChange={(e) => setSelectedTool(e.target.value || null)}
                  className="control-select"
                >
                  <option value="">No tool</option>
                  {availableTools.filter(tool => tool.enabled).map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="control-group">
                <label>Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="control-select"
                >
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Main Input */}
            <div className="message-input-main">
              <div className="input-actions-left">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="input-action-btn"
                  title="Attach file"
                >
                  <Paperclip size={18} />
                </button>
                
                <button
                  onClick={() => setDataConnectorVisible(true)}
                  className="input-action-btn"
                  title="Open Data Loader"
                >
                  <Database size={18} />
                </button>
              </div>

              <textarea
                ref={messageInputRef}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="message-input"
                rows={1}
                style={{
                  minHeight: '44px',
                  maxHeight: '120px',
                  resize: 'none'
                }}
              />

              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim() && selectedFiles.length === 0}
                className="send-btn"
                title="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Settings Modal */}
      {settingsVisible && (
        <div className="modal-overlay" onClick={() => setSettingsVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Settings</h3>
              <button
                onClick={() => setSettingsVisible(false)}
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="settings-section">
                <h4>General</h4>
                <div className="setting-item">
                  <label>Theme</label>
                  <select value={theme} onChange={(e) => {
                    const newTheme = e.target.value as 'light' | 'dark'
                    if (newTheme !== theme) {
                      toggleTheme()
                    }
                  }}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </div>
              
              <div className="settings-section">
                <h4>Personalization</h4>
                <div className="setting-item">
                  <label>Your Role</label>
                  <input type="text" placeholder="e.g., Data Analyst, Manager" />
                </div>
                <div className="setting-item">
                  <label>Bio</label>
                  <textarea placeholder="Tell us about yourself..."></textarea>
                </div>
                <div className="setting-item">
                  <label>Response Style</label>
                  <textarea placeholder="How would you like responses formatted?"></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Loader Modal */}
      {dataConnectorVisible && (
        <div className="modal-overlay" onClick={() => setDataConnectorVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Data Loader</h3>
              <button
                onClick={() => setDataConnectorVisible(false)}
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="data-connectors-list">
                {dataConnectors.map((connector) => (
                  <div key={connector.id} className="data-connector-item">
                    <div className="connector-icon">{connector.icon}</div>
                    <div className="connector-info">
                      <span className="connector-name">{connector.name}</span>
                      <span className="connector-description">{connector.description}</span>
                    </div>
                    <div className={`connector-status ${connector.status}`}>
                      {connector.status}
                    </div>
                    <button 
                      className="connector-action-btn"
                      onClick={() => handleConnectorAction(connector)}
                    >
                      {connector.status === 'connected' ? 'Manage' : 'Load Data'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversation Editing Modal */}
      {editingConversationId && (
        <div className="modal-overlay" onClick={() => setEditingConversationId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Rename Conversation</h3>
              <button
                onClick={() => setEditingConversationId(null)}
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="rename-input-group">
                <label htmlFor="rename-input">New Title:</label>
                <input
                  type="text"
                  id="rename-input"
                  ref={editInputRef}
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyPress={handleRenameKeyPress}
                  className="rename-input"
                />
              </div>
              <div className="rename-actions">
                <button onClick={handleSaveRename} className="save-rename-btn">Save</button>
                <button onClick={handleCancelRename} className="cancel-rename-btn">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmVisible && conversationToDelete && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button
                onClick={() => setDeleteConfirmVisible(false)}
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to delete this conversation?</p>
              <p>This action cannot be undone.</p>
              <div className="modal-actions">
                <button
                  onClick={handleDeleteConfirm}
                  className="confirm-delete-btn"
                >
                  Delete
                </button>
                <button
                  onClick={handleDeleteCancel}
                  className="cancel-delete-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Data Loader Modal */}
      {googleSheetsModalVisible && (
        <div className="modal-overlay" onClick={() => setGoogleSheetsModalVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Load Google Sheets Data</h3>
              <button
                onClick={() => setGoogleSheetsModalVisible(false)}
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="google-sheets-form">
                <div className="form-group">
                  <label htmlFor="sheets-url">Google Sheets URL *</label>
                  <input
                    type="url"
                    id="sheets-url"
                    value={googleSheetsUrl}
                    onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="sheets-url-input"
                    required
                  />
                  <small>Paste the link to your Google Sheets document</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="sheets-name">Custom Name (optional)</label>
                  <input
                    type="text"
                    id="sheets-name"
                    value={googleSheetsName}
                    onChange={(e) => setGoogleSheetsName(e.target.value)}
                    placeholder="My Sales Data"
                    className="sheets-name-input"
                  />
                  <small>Give your data source a friendly name</small>
                </div>

                <div className="form-note">
                  <h4>📋 How to get the Google Sheets URL:</h4>
                  <ol>
                    <li>Open your Google Sheets document</li>
                    <li>Click "Share" and set to "Anyone with the link can view"</li>
                    <li>Copy the URL from your browser's address bar</li>
                    <li>Paste it in the field above</li>
                  </ol>
                </div>

                <div className="modal-actions">
                  <button
                    onClick={() => setGoogleSheetsModalVisible(false)}
                    className="cancel-sheets-btn"
                    disabled={connectingSheets}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGoogleSheetsSubmit}
                    disabled={!googleSheetsUrl.trim() || connectingSheets}
                    className="connect-sheets-btn"
                  >
                    {connectingSheets ? 'Loading...' : 'Download & Load Data'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RCA Form Modal */}
      {showRcaForm && (
        <div className="modal-overlay" onClick={() => setShowRcaForm(false)}>
          <div className="modal-content rca-modal" onClick={(e) => e.stopPropagation()}>
            <RCAForm
              onSubmit={handleRCAFormSubmit}
              onCancel={() => setShowRcaForm(false)}
              isLoading={rcaInvestigationState === RCAInvestigationState.CREATING_REQUEST}
            />
          </div>
        </div>
      )}

      {/* RCA Progress Modal */}
      {rcaInvestigationState === RCAInvestigationState.INVESTIGATING && rcaProgress && (
        <div className="modal-overlay">
          <div className="modal-content rca-modal" onClick={(e) => e.stopPropagation()}>
            <RCAProgress
              progress={rcaProgress}
              onCancel={handleRCACancel}
            />
          </div>
        </div>
      )}

      {/* RCA Result Modal */}
      {rcaInvestigationState === RCAInvestigationState.COMPLETED && rcaResult && (
        <div className="modal-overlay" onClick={handleRCACancel}>
          <div className="modal-content rca-modal" onClick={(e) => e.stopPropagation()}>
            <RCAResult
              result={rcaResult}
              onExport={async (format) => {
                try {
                  if (format === 'csv') {
                    showError('CSV export not yet implemented')
                    return
                  }
                  await rcaService.exportResult(rcaResult, format)
                  showSuccess(`RCA result exported as ${format.toUpperCase()} successfully`)
                } catch (error) {
                  console.error('Failed to export RCA result:', error)
                  showError(`Failed to export RCA result as ${format.toUpperCase()}: ${error}`)
                }
              }}
              onShare={() => {
                console.log('Share RCA result')
                // TODO: Implement share functionality
              }}
            />
            <div className="modal-actions">
              <button onClick={handleRCACancel} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RCA Error Modal */}
      {rcaInvestigationState === RCAInvestigationState.FAILED && rcaError && (
        <div className="modal-overlay" onClick={handleRCACancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>RCA Investigation Failed</h3>
              <button onClick={handleRCACancel} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="error-message">
                <AlertTriangle size={20} />
                <p>{rcaError}</p>
              </div>
              <div className="modal-actions">
                <button onClick={handleRCACancel} className="btn btn-secondary">
                  Close
                </button>
                <button onClick={() => setShowRcaForm(true)} className="btn btn-primary">
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatPage 