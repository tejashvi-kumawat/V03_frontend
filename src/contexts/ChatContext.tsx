import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { chatService } from '../services/chatService'
import { websocketService } from '../services/websocketService'
import { Conversation, Message, QpnMode } from '../types/chat'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

interface ChatContextType {
  // Conversations
  conversations: Conversation[]
  currentConversation: Conversation | null
  loading: boolean
  
  // Messages
  messages: Message[]
  isTyping: boolean
  streamingMessage: {
    messageId: string
    content: string
    isStreaming: boolean
  } | null
  
  // WebSocket
  isConnected: boolean
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  
  // Actions
  createConversation: (title?: string, qpnMode?: QpnMode) => Promise<Conversation>
  selectConversation: (conversationId: string) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  renameConversation: (conversationId: string, newTitle: string) => Promise<void>
  
  // Messages
  sendMessage: (content: string, attachments?: File[]) => Promise<void>
  editMessage: (messageId: string, newContent: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  
  // WebSocket
  connectWebSocket: (conversationId: string) => Promise<void>
  disconnectWebSocket: () => void
  
  // Utility
  clearChat: () => void
  refreshConversations: () => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const useChat = () => {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

interface ChatProviderProps {
  children: ReactNode
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user } = useAuth()
  
  // State
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [streamingMessage, setStreamingMessage] = useState<{
    messageId: string
    content: string
    isStreaming: boolean
  } | null>(null)

  // Initialize chat data when user logs in
  useEffect(() => {
    if (user) {
      refreshConversations()
    } else {
      // Clear chat data when user logs out
      setConversations([])
      setCurrentConversation(null)
      setMessages([])
      setStreamingMessage(null)
      disconnectWebSocket()
    }
  }, [user])

  // WebSocket event handlers
  useEffect(() => {
    const handleConnected = (data: any) => {
      if (DEBUG) {
        console.log('[DEBUG] WebSocket connected:', data)
      }
      setIsConnected(true)
      setConnectionStatus('connected')
    }

    const handleMessageReceived = (data: any) => {
      if (DEBUG) {
        console.log('[DEBUG] Message received acknowledgment:', data)
      }
      // Message was received by server, no UI action needed
    }

    const handleStreamStart = (data: any) => {
      if (DEBUG) {
        console.log('[DEBUG] Stream starting:', data)
      }
      
      setStreamingMessage({
        messageId: data.messageId,
        content: '',
        isStreaming: true
      })
      setIsTyping(true)
    }

    const handleStreamToken = (data: any) => {
      if (DEBUG) {
        console.log('[DEBUG] Stream token received:', data.token)
      }
      
      setStreamingMessage(prev => ({
        messageId: data.messageId,
        content: data.content,
        isStreaming: true
      }))
    }

    const handleStreamEnd = (data: any) => {
      if (DEBUG) {
        console.log('[DEBUG] Stream ended:', data.content.length, 'chars')
      }
      
      // Add the completed AI message to the messages list
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: data.content,
        type: 'assistant',
        timestamp: new Date(),
        userId: 'assistant',
        conversationId: currentConversation?.id || ''
      }
      
      setMessages(prev => [...prev, aiMessage])
      setStreamingMessage(null)
      setIsTyping(false)
    }

    const handleMessageSaved = (data: any) => {
      if (DEBUG) {
        console.log('[DEBUG] Messages saved:', data)
      }
      // Messages saved to database, no UI action needed
    }

    const handleTyping = (data: any) => {
      if (DEBUG) {
        console.log('[DEBUG] Typing indicator:', data)
      }
      setIsTyping(data.is_typing)
    }

    const handleConnect = () => {
      if (DEBUG) {
        console.log('[DEBUG] WebSocket connection established')
      }
      setIsConnected(true)
      setConnectionStatus('connected')
    }

    const handleDisconnect = () => {
      if (DEBUG) {
        console.log('[DEBUG] WebSocket disconnected')
      }
      setIsConnected(false)
      setConnectionStatus('disconnected')
      setStreamingMessage(null)
      setIsTyping(false)
    }

    const handleError = (error: any) => {
      if (DEBUG) {
        console.error('[DEBUG] WebSocket error:', error)
      }
      setConnectionStatus('error')
      setStreamingMessage(null)
      setIsTyping(false)
    }

    const handleReconnectFailed = (data: any) => {
      if (DEBUG) {
        console.error('[DEBUG] WebSocket reconnection failed:', data)
      }
      setConnectionStatus('error')
    }

    // Set up WebSocket event listeners
    websocketService.on('connected', handleConnected)
    websocketService.on('message_received', handleMessageReceived)
    websocketService.on('stream_start', handleStreamStart)
    websocketService.on('stream_token', handleStreamToken)
    websocketService.on('stream_end', handleStreamEnd)
    websocketService.on('message_saved', handleMessageSaved)
    websocketService.on('typing', handleTyping)
    websocketService.on('connect', handleConnect)
    websocketService.on('disconnect', handleDisconnect)
    websocketService.on('error', handleError)
    websocketService.on('reconnect_failed', handleReconnectFailed)

    return () => {
      // Clean up event listeners
      websocketService.off('connected', handleConnected)
      websocketService.off('message_received', handleMessageReceived)
      websocketService.off('stream_start', handleStreamStart)
      websocketService.off('stream_token', handleStreamToken)
      websocketService.off('stream_end', handleStreamEnd)
      websocketService.off('message_saved', handleMessageSaved)
      websocketService.off('typing', handleTyping)
      websocketService.off('connect', handleConnect)
      websocketService.off('disconnect', handleDisconnect)
      websocketService.off('error', handleError)
      websocketService.off('reconnect_failed', handleReconnectFailed)
    }
  }, [currentConversation, user])

  const createConversation = async (title?: string, qpnMode?: QpnMode): Promise<Conversation> => {
    try {
      setLoading(true)
      
      if (DEBUG) {
        console.log('[DEBUG] Creating conversation with title:', title, 'mode:', qpnMode)
      }

      const conversation = await chatService.createConversation(title, qpnMode || QpnMode.SIMPLE)
      
      // Add to conversations list
      setConversations(prev => [conversation, ...prev])
      
      // Auto-select the new conversation
      setCurrentConversation(conversation)
      setMessages([])
      
      if (DEBUG) {
        console.log('[DEBUG] Conversation created and selected:', conversation.id)
      }

      return conversation
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to create conversation:', error)
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  const selectConversation = async (conversationId: string): Promise<void> => {
    try {
      setLoading(true)
      
      if (DEBUG) {
        console.log('[DEBUG] Selecting conversation:', conversationId)
      }

      // Find conversation in current list
      const conversation = conversations.find(c => c.id === conversationId)
      if (!conversation) {
        throw new Error('Conversation not found')
      }

      setCurrentConversation(conversation)
      
      // Load messages for this conversation
      const messages = await chatService.getMessages(conversationId)
      setMessages(messages)
      
      // Connect WebSocket for real-time updates
      await connectWebSocket(conversationId)
      
      if (DEBUG) {
        console.log('[DEBUG] Conversation selected with', messages.length, 'messages')
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to select conversation:', error)
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteConversation = async (conversationId: string): Promise<void> => {
    try {
      if (DEBUG) {
        console.log('[DEBUG] Deleting conversation:', conversationId)
      }

      await chatService.deleteConversation(conversationId)
      
      // Remove from conversations list
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      
      // If this was the current conversation, clear it
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null)
        setMessages([])
        disconnectWebSocket()
      }
      
      if (DEBUG) {
        console.log('[DEBUG] Conversation deleted successfully')
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to delete conversation:', error)
      }
      throw error
    }
  }

  const renameConversation = async (conversationId: string, newTitle: string): Promise<void> => {
    try {
      if (DEBUG) {
        console.log('[DEBUG] Renaming conversation:', conversationId, 'to:', newTitle)
      }

      const updatedConversation = await chatService.updateConversation(conversationId, { title: newTitle })
      
      // Update conversations list
      setConversations(prev => 
        prev.map(c => c.id === conversationId ? updatedConversation : c)
      )
      
      // Update current conversation if it's the one being renamed
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(updatedConversation)
      }
      
      if (DEBUG) {
        console.log('[DEBUG] Conversation renamed successfully')
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to rename conversation:', error)
      }
      throw error
    }
  }

  const sendMessage = async (content: string, attachments?: File[]) => {
    try {
      if (!currentConversation) {
        throw new Error('No conversation selected')
      }

      if (DEBUG) {
        console.log('[DEBUG] Sending message:', content.substring(0, 50) + '...')
      }

      // Add user message to UI immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        type: 'user',
        timestamp: new Date(),
        userId: user?.id || '',
        conversationId: currentConversation.id
      }
      setMessages(prev => [...prev, userMessage])

      // Send via WebSocket if connected, otherwise fallback to HTTP
      if (isConnected) {
        websocketService.sendChatMessage(content, attachments?.map(f => f.name) || [])
      } else {
        // Fallback to HTTP API
        await chatService.sendMessage(currentConversation.id, content, attachments)
        
        // For HTTP fallback, we don't get streaming, so refresh messages
        const updatedMessages = await chatService.getMessages(currentConversation.id)
        setMessages(updatedMessages)
      }
      
      if (DEBUG) {
        console.log('[DEBUG] Message sent')
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to send message:', error)
      }
      throw error
    }
  }

  const editMessage = async (messageId: string, newContent: string) => {
    try {
      if (DEBUG) {
        console.log('[DEBUG] Editing message:', messageId)
      }

      // This would create a new branch in the conversation
      // For now, just update the message content
      setMessages(prev => 
        prev.map(m => m.id === messageId ? { ...m, content: newContent } : m)
      )
      
      if (DEBUG) {
        console.log('[DEBUG] Message edited')
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to edit message:', error)
      }
      throw error
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      if (DEBUG) {
        console.log('[DEBUG] Deleting message:', messageId)
      }

      setMessages(prev => prev.filter(m => m.id !== messageId))
      
      if (DEBUG) {
        console.log('[DEBUG] Message deleted')
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to delete message:', error)
      }
      throw error
    }
  }

  const connectWebSocket = async (conversationId: string) => {
    try {
      if (DEBUG) {
        console.log('[DEBUG] Connecting WebSocket for conversation:', conversationId)
      }

      setConnectionStatus('connecting')
      await websocketService.connect(conversationId)
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] WebSocket connection failed:', error)
      }
      setConnectionStatus('error')
      throw error
    }
  }

  const disconnectWebSocket = () => {
    if (DEBUG) {
      console.log('[DEBUG] Disconnecting WebSocket')
    }

    websocketService.disconnect()
    setIsConnected(false)
    setConnectionStatus('disconnected')
    setStreamingMessage(null)
    setIsTyping(false)
  }

  const clearChat = () => {
    if (DEBUG) {
      console.log('[DEBUG] Clearing chat data')
    }

    setConversations([])
    setCurrentConversation(null)
    setMessages([])
    setStreamingMessage(null)
    disconnectWebSocket()
  }

  const refreshConversations = async (): Promise<void> => {
    try {
      setLoading(true)
      
      if (DEBUG) {
        console.log('[DEBUG] Refreshing conversations list')
      }

      const conversations = await chatService.getConversations()
      setConversations(conversations)
      
      if (DEBUG) {
        console.log('[DEBUG] Conversations refreshed:', conversations.length, 'conversations')
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to refresh conversations:', error)
      }
      // Don't throw here - allow the app to continue working with cached data
    } finally {
      setLoading(false)
    }
  }

  const value: ChatContextType = {
    conversations,
    currentConversation,
    loading,
    messages,
    isTyping,
    streamingMessage,
    isConnected,
    connectionStatus,
    createConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    connectWebSocket,
    disconnectWebSocket,
    clearChat,
    refreshConversations
  }

  if (DEBUG) {
    console.log('[DEBUG] ChatProvider render - conversations:', conversations.length, 'current:', currentConversation?.id, 'connected:', isConnected)
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
} 