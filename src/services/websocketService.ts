// WebSocket Service for Real-time Chat Communication

import { WebSocketMessage } from '../types/chat'
import { apiClient } from './apiClient'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

// WebSocket Configuration
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000/ws'
const RECONNECT_DELAY = 3000 // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5
const HEARTBEAT_INTERVAL = 30000 // 30 seconds

type EventHandler = (data: any) => void

interface QueuedMessage {
  data: any
  timestamp: Date
}

class WebSocketService {
  private ws: WebSocket | null = null
  private url: string = ''
  private isConnecting: boolean = false
  private isConnected: boolean = false
  private reconnectAttempts: number = 0
  private heartbeatInterval: NodeJS.Timeout | null = null
  private messageQueue: QueuedMessage[] = []
  private eventHandlers: Map<string, EventHandler[]> = new Map()

  constructor() {
    if (DEBUG) {
      console.log('[DEBUG] WebSocketService initialized')
    }
  }

  /**
   * Get authentication tokens from API client
   */
  private getAuthTokens() {
    return apiClient.getAuthTokens()
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
          try {
            const data = JSON.parse(event.data)
            
            if (DEBUG) {
              console.log('[DEBUG] WebSocket message received:', data)
            }

            // Handle ping/pong
            if (data.type === 'ping') {
              this.send({ type: 'pong', timestamp: new Date().toISOString() })
              return
            }

            // Emit message event
            this.emit('message', data)

          } catch (error) {
            if (DEBUG) {
              console.error('[DEBUG] WebSocket message parse error:', error)
            }
          }
        }

        this.ws.onclose = (event) => {
          if (DEBUG) {
            console.log('[DEBUG] WebSocket closed:', event.code, event.reason)
          }

          this.isConnecting = false
          this.isConnected = false
          this.stopHeartbeat()

          // Emit disconnect event
          this.emit('disconnect', { code: event.code, reason: event.reason })

          // Attempt reconnection if not intentional
          if (event.code !== 1000 && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          if (DEBUG) {
            console.error('[DEBUG] WebSocket error:', error)
          }

          this.isConnecting = false

          // Emit error event
          this.emit('error', error)

          reject(error)
        }

      } catch (error) {
        this.isConnecting = false
        if (DEBUG) {
          console.error('[DEBUG] WebSocket connection failed:', error)
        }
        reject(error)
      }
    })
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
          console.log('[DEBUG] WebSocket message sent:', message)
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
   * Add event listener
   */
  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)

    if (DEBUG) {
      console.log('[DEBUG] WebSocket event handler added:', event)
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }

    if (DEBUG) {
      console.log('[DEBUG] WebSocket event handler removed:', event)
    }
  }

  /**
   * Get connection status
   */
  getStatus(): {
    isConnected: boolean
    isConnecting: boolean
    reconnectAttempts: number
    url: string
  } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      url: this.url
    }
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(isTyping: boolean): void {
    this.send({
      type: 'typing_indicator',
      is_typing: isTyping
    })
  }

  /**
   * Send ping to keep connection alive
   */
  ping(): void {
    this.send({
      type: 'ping'
    })
  }

  /**
   * Private: Emit event to handlers
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          if (DEBUG) {
            console.error('[DEBUG] WebSocket event handler error:', error)
          }
        }
      })
    }
  }

  /**
   * Private: Queue message for sending when connected
   */
  private queueMessage(message: any): void {
    // Remove old messages (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    this.messageQueue = this.messageQueue.filter(msg => msg.timestamp > fiveMinutesAgo)

    // Add new message
    this.messageQueue.push({
      data: message,
      timestamp: Date.now()
    })

    // Limit queue size
    if (this.messageQueue.length > 100) {
      this.messageQueue = this.messageQueue.slice(-100)
    }
  }

  /**
   * Private: Process queued messages
   */
  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) {
      return
    }

    if (DEBUG) {
      console.log('[DEBUG] Processing', this.messageQueue.length, 'queued messages')
    }

    const messages = [...this.messageQueue]
    this.messageQueue = []

    messages.forEach(queuedMessage => {
      this.send(queuedMessage.data)
    })
  }

  /**
   * Private: Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++
    
    const delay = RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff
    
    if (DEBUG) {
      console.log(`[DEBUG] WebSocket scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)
    }

    setTimeout(() => {
      if (!this.isConnected && !this.isConnecting) {
        const conversationId = this.url.split('/').slice(-2, -1)[0] // Extract conversation ID from URL
        this.connect(conversationId).catch(error => {
          if (DEBUG) {
            console.error('[DEBUG] WebSocket reconnect failed:', error)
          }
        })
      }
    }, delay)
  }

  /**
   * Private: Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.ping()
      }
    }, HEARTBEAT_INTERVAL)

    if (DEBUG) {
      console.log('[DEBUG] WebSocket heartbeat started')
    }
  }

  /**
   * Private: Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (DEBUG) {
      console.log('[DEBUG] WebSocket heartbeat stopped')
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService()

if (DEBUG) {
  console.log('[DEBUG] WebSocketService module loaded')
} 