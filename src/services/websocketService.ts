// WebSocket Service for Real-time Chat Communication

import { EventEmitter } from 'events'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

// WebSocket connection configuration
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'
const WS_TIMEOUT = parseInt(import.meta.env.VITE_WS_TIMEOUT || '30000')
const HEARTBEAT_INTERVAL = parseInt(import.meta.env.VITE_WS_HEARTBEAT_INTERVAL || '30000') // 30 seconds
const RECONNECT_DELAY = parseInt(import.meta.env.VITE_WS_RECONNECT_DELAY || '3000') // 3 seconds
const MAX_RECONNECT_ATTEMPTS = parseInt(import.meta.env.VITE_WS_MAX_RECONNECT_ATTEMPTS || '5')

interface StreamingMessage {
  messageId: string
  content: string
  isComplete: boolean
  tokens: string[]
}

class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null
  private url: string = ''
  private isConnected: boolean = false
  private isConnecting: boolean = false
  private reconnectAttempts: number = 0
  private heartbeatInterval: number | null = null
  private messageQueue: any[] = []
  private currentStreamingMessage: StreamingMessage | null = null

  constructor() {
    super()
    
    if (DEBUG) {
      console.log('[DEBUG] WebSocketService initialized')
    }
  }

  /**
   * Get authentication tokens from auth service
   */
  private getAuthTokens(): any {
    try {
      if (DEBUG) {
        console.log('[DEBUG] WebSocket: Looking for authentication tokens...')
        console.log('[DEBUG] WebSocket: localStorage keys:', Object.keys(localStorage))
      }
      
      // Method 1: Try to get tokens from individual localStorage keys (authService format)
      const authToken = localStorage.getItem('auth_token')
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (authToken) {
        if (DEBUG) {
          console.log('[DEBUG] WebSocket: Found auth tokens in individual keys')
        }
        return {
          access_token: authToken,
          refresh_token: refreshToken
        }
      }
      
      // Method 2: Try to get tokens from auth_tokens JSON object (apiClient format)
      const authTokensJson = localStorage.getItem('auth_tokens')
      if (authTokensJson) {
        try {
          const authTokensObj = JSON.parse(authTokensJson)
          if (authTokensObj && (authTokensObj.access_token || authTokensObj.auth_token)) {
            if (DEBUG) {
              console.log('[DEBUG] WebSocket: Found auth tokens in JSON object')
            }
            return {
              access_token: authTokensObj.access_token || authTokensObj.auth_token,
              refresh_token: authTokensObj.refresh_token
            }
          }
        } catch (parseError) {
          if (DEBUG) {
            console.error('[DEBUG] WebSocket: Failed to parse auth_tokens JSON:', parseError)
          }
        }
      }
      
      // Method 3: Try to get from any token-related keys as fallback
      const allKeys = Object.keys(localStorage)
      const tokenKeys = allKeys.filter(key => key.toLowerCase().includes('token'))
      
      if (DEBUG) {
        console.log('[DEBUG] WebSocket: Found token-related keys:', tokenKeys)
        tokenKeys.forEach(key => {
          console.log(`[DEBUG] WebSocket: ${key}:`, localStorage.getItem(key)?.substring(0, 20) + '...')
        })
      }
      
      if (DEBUG) {
        console.warn('[DEBUG] WebSocket: No authentication tokens found in localStorage')
      }
      return null
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] WebSocket: Failed to get auth tokens:', error)
      }
      return null
    }
  }

  /**
   * Connect to WebSocket
   */
  async connect(conversationId: string): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      if (DEBUG) {
        console.log('[DEBUG] WebSocket already connecting or connected')
      }
      return
    }

    // Get JWT token from API client
    const authTokens = this.getAuthTokens()
    const token = authTokens?.access_token
    
    if (!token) {
      throw new Error('No authentication token available for WebSocket connection')
    }

    // Include token as query parameter for WebSocket authentication
    this.url = `${WS_BASE_URL}/chat/${conversationId}/?token=${encodeURIComponent(token)}`
    
    return new Promise((resolve, reject) => {
      try {
        if (DEBUG) {
          console.log('[DEBUG] WebSocket connecting to:', this.url.replace(/token=[^&]+/, 'token=***'))
        }

        this.isConnecting = true
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          if (DEBUG) {
            console.log('[DEBUG] WebSocket connected successfully')
          }

          this.isConnecting = false
          this.isConnected = true
          this.reconnectAttempts = 0

          // Start heartbeat
          this.startHeartbeat()

          // Process queued messages
          this.processMessageQueue()

          // Emit connect event
          this.emit('connect', null)

          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event)
        }

        this.ws.onclose = (event) => {
          if (DEBUG) {
            console.log('[DEBUG] WebSocket connection closed:', event.code, event.reason)
          }

          this.isConnected = false
          this.isConnecting = false
          this.stopHeartbeat()

          // Emit disconnect event
          this.emit('disconnect', { code: event.code, reason: event.reason })

          // Attempt reconnection if not intentional
          if (event.code !== 1000 && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            this.attemptReconnect()
          }
        }

        this.ws.onerror = (error) => {
          if (DEBUG) {
            console.error('[DEBUG] WebSocket error:', error)
          }

          this.isConnecting = false
          this.emit('error', error)

          reject(error)
        }

      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  /**
   * Handle incoming WebSocket messages with streaming support
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data)
      
      if (DEBUG) {
        console.log('[DEBUG] WebSocket message received:', data.type)
      }

      switch (data.type) {
        case 'connection_established':
          this.emit('connected', data)
          break
          
        case 'message_received':
          this.emit('message_received', data)
          break
          
        case 'typing_indicator':
          this.emit('typing', data)
          break
          
        case 'stream_start':
          this.handleStreamStart(data)
          break
          
        case 'stream_token':
          this.handleStreamToken(data)
          break
          
        case 'stream_end':
          this.handleStreamEnd(data)
          break
          
        case 'message_saved':
          this.emit('message_saved', data)
          break
          
        case 'error':
          this.emit('error', data)
          break
          
        case 'pong':
          // Heartbeat response - connection is alive
          break
          
        default:
          if (DEBUG) {
            console.log('[DEBUG] Unknown message type:', data.type)
          }
          this.emit('message', data)
      }
      
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Error parsing WebSocket message:', error)
      }
      this.emit('error', { error: 'Failed to parse message' })
    }
  }

  /**
   * Handle stream start event
   */
  private handleStreamStart(data: any): void {
    this.currentStreamingMessage = {
      messageId: Date.now().toString(),
      content: '',
      isComplete: false,
      tokens: []
    }
    
    this.emit('stream_start', {
      messageId: this.currentStreamingMessage.messageId,
      message: data.message
    })
  }

  /**
   * Handle incoming stream token
   */
  private handleStreamToken(data: any): void {
    if (!this.currentStreamingMessage) {
      this.currentStreamingMessage = {
        messageId: Date.now().toString(),
        content: '',
        isComplete: false,
        tokens: []
      }
    }

    // Add token to the message
    this.currentStreamingMessage.tokens.push(data.token)
    this.currentStreamingMessage.content = data.content

    this.emit('stream_token', {
      messageId: this.currentStreamingMessage.messageId,
      token: data.token,
      content: data.content,
      tokens: this.currentStreamingMessage.tokens
    })
  }

  /**
   * Handle stream end event
   */
  private handleStreamEnd(data: any): void {
    if (this.currentStreamingMessage) {
      this.currentStreamingMessage.content = data.final_content
      this.currentStreamingMessage.isComplete = true
      
      this.emit('stream_end', {
        messageId: this.currentStreamingMessage.messageId,
        content: data.final_content,
        message: data.message
      })
      
      // Clear current streaming message
      this.currentStreamingMessage = null
    }
  }

  /**
   * Send message through WebSocket
   */
  send(data: any): void {
    const message = {
      ...data,
      timestamp: new Date().toISOString()
    }

    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message))
        
        if (DEBUG) {
          console.log('[DEBUG] WebSocket message sent:', message.type)
        }
      } catch (error) {
        if (DEBUG) {
          console.error('[DEBUG] WebSocket send error:', error)
        }

        // Queue message for retry
        this.queueMessage(message)
      }
    } else {
      // Queue message if not connected
      this.queueMessage(message)

      if (DEBUG) {
        console.log('[DEBUG] WebSocket not connected, message queued')
      }
    }
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(isTyping: boolean): void {
    this.send({
      type: isTyping ? 'typing_start' : 'typing_stop',
      is_typing: isTyping
    })
  }

  /**
   * Send chat message
   */
  sendChatMessage(message: string, attachments: string[] = []): void {
    this.send({
      type: 'chat_message',
      message,
      attachments
    })
  }

  /**
   * Queue message for later sending
   */
  private queueMessage(message: any): void {
    this.messageQueue.push(message)
    
    // Limit queue size to prevent memory issues
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift()
    }
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift()
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message))
        
        if (DEBUG) {
          console.log('[DEBUG] Queued message sent:', message.type)
        }
      }
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' })
      }
    }, HEARTBEAT_INTERVAL)
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Attempt reconnection
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++
    
    if (DEBUG) {
      console.log(`[DEBUG] Attempting reconnection ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`)
    }

    setTimeout(() => {
      if (!this.isConnected && this.url) {
        this.reconnect()
      }
    }, RECONNECT_DELAY * this.reconnectAttempts)
  }

  /**
   * Reconnect to WebSocket
   */
  private async reconnect(): Promise<void> {
    try {
      // Extract conversation ID from current URL
      const match = this.url.match(/\/chat\/([^\/\?]+)/)
      if (match) {
        const conversationId = match[1]
        await this.connect(conversationId)
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Reconnection failed:', error)
      }
      
      if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        this.attemptReconnect()
      } else {
        this.emit('reconnect_failed', { error: 'Max reconnection attempts reached' })
      }
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (DEBUG) {
      console.log('[DEBUG] WebSocket disconnecting...')
    }

    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    
    this.isConnected = false
    this.isConnecting = false
    this.reconnectAttempts = 0
    this.messageQueue = []
    this.currentStreamingMessage = null
  }

  /**
   * Get connection status
   */
  getStatus(): {
    connected: boolean
    connecting: boolean
    reconnectAttempts: number
    queuedMessages: number
  } {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService() 