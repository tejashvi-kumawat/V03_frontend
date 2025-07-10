// Chat Service for Conversation and Message Management

import { Conversation, Message, QpnMode } from '../types/chat'
import { apiClient } from './apiClient'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

class ChatService {
  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] ChatService.getConversations - fetching conversations')
      }

      const response = await apiClient.get('/chat/conversations/')
      
      if (DEBUG) {
        console.log('[DEBUG] ChatService.getConversations - response:', response)
      }

      // Backend returns { success: true, conversations: [...] }
      if (response.success && response.conversations) {
        const conversations = response.conversations.map((conv: any) => ({
          id: conv.id,
          title: conv.title,
          userId: conv.user?.id || '',
          qpnMode: conv.qpn_mode,
          createdAt: new Date(conv.created_at),
          updatedAt: new Date(conv.updated_at),
          lastMessageAt: conv.last_message_at ? new Date(conv.last_message_at) : null,
          messageCount: conv.message_count || 0,
          isActive: conv.is_active
        }))

        if (DEBUG) {
          console.log('[DEBUG] ChatService.getConversations - loaded', conversations.length, 'conversations')
        }

        return conversations
      }

      return []
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] ChatService.getConversations - failed:', error)
      }
      throw error
    }
  }

  /**
   * Get a specific conversation
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] ChatService.getConversation - fetching:', conversationId)
      }

      const response = await apiClient.get(`/chat/conversations/${conversationId}/`)
      
      if (response.success && response.conversation) {
        const conv = response.conversation
        return {
          id: conv.id,
          title: conv.title,
          userId: conv.user?.id || '',
          qpnMode: conv.qpn_mode,
          createdAt: new Date(conv.created_at),
          updatedAt: new Date(conv.updated_at),
          lastMessageAt: conv.last_message_at ? new Date(conv.last_message_at) : null,
          messageCount: conv.message_count || 0,
          isActive: conv.is_active
        }
      }

      throw new Error('Conversation not found')
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] ChatService.getConversation - failed:', error)
      }
      throw error
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(title?: string, qpnMode: QpnMode = 'simple'): Promise<Conversation> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] ChatService.createConversation - creating with mode:', qpnMode)
      }

      const data = {
        title: title || `New Conversation ${new Date().toLocaleString()}`,
        qpn_mode: qpnMode  // Use snake_case for backend
      }

      const response = await apiClient.post('/chat/conversations/', data)
      
      if (DEBUG) {
        console.log('[DEBUG] ChatService.createConversation - response:', response)
      }

      // Backend returns { success: true, conversation: {...} }
      if (response.success && response.conversation) {
        const conv = response.conversation
        const conversation = {
          id: conv.id,
          title: conv.title,
          userId: conv.user?.id || '',
          qpnMode: conv.qpn_mode,
          createdAt: new Date(conv.created_at),
          updatedAt: new Date(conv.updated_at),
          lastMessageAt: conv.last_message_at ? new Date(conv.last_message_at) : null,
          messageCount: conv.message_count || 0,
          isActive: conv.is_active
        }

        if (DEBUG) {
          console.log('[DEBUG] ChatService.createConversation - created:', conversation.title)
        }

        return conversation
      }

      throw new Error('Failed to create conversation')
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] ChatService.createConversation - failed:', error)
      }
      throw error
    }
  }

  /**
   * Update a conversation
   */
  async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<Conversation> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] ChatService.updateConversation - updating:', conversationId)
      }

      const data: any = {}
      if (updates.title) data.title = updates.title
      if (updates.qpnMode) data.qpn_mode = updates.qpnMode

      const response = await apiClient.put(`/chat/conversations/${conversationId}/`, data)
      
      if (response.success && response.conversation) {
        const conv = response.conversation
        return {
          id: conv.id,
          title: conv.title,
          userId: conv.user?.id || '',
          qpnMode: conv.qpn_mode,
          createdAt: new Date(conv.created_at),
          updatedAt: new Date(conv.updated_at),
          lastMessageAt: conv.last_message_at ? new Date(conv.last_message_at) : null,
          messageCount: conv.message_count || 0,
          isActive: conv.is_active
        }
      }

      throw new Error('Failed to update conversation')
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] ChatService.updateConversation - failed:', error)
      }
      throw error
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] ChatService.deleteConversation - deleting:', conversationId)
      }

      const response = await apiClient.delete(`/chat/conversations/${conversationId}/`)
      
      if (!response.success) {
        throw new Error('Failed to delete conversation')
      }
      
      if (DEBUG) {
        console.log('[DEBUG] ChatService.deleteConversation - deleted successfully')
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] ChatService.deleteConversation - failed:', error)
      }
      throw error
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, page = 1, pageSize = 50): Promise<Message[]> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] ChatService.getMessages - fetching messages for:', conversationId)
      }

      const response = await apiClient.get(`/chat/conversations/${conversationId}/messages/`, {
        params: { page, page_size: pageSize }
      })
      
      if (DEBUG) {
        console.log('[DEBUG] ChatService.getMessages - response:', response)
      }

      // Backend returns { success: true, messages: [...] }
      if (response.success && response.messages) {
        const messages = response.messages.map((msg: any) => ({
          id: msg.id,
          conversationId: msg.conversation,
          userId: msg.user,
          content: msg.content,
          type: msg.message_type,
          timestamp: new Date(msg.created_at),
          editedAt: msg.edited_at ? new Date(msg.edited_at) : undefined,
          qpnMode: msg.qpn_mode,
          processingTime: msg.processing_time,
          metadata: msg.metadata || {},
          attachments: msg.attachments || []
        }))

        if (DEBUG) {
          console.log('[DEBUG] ChatService.getMessages - loaded', messages.length, 'messages')
        }

        return messages
      }

      return []
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] ChatService.getMessages - failed:', error)
      }
      throw error
    }
  }

  /**
   * Send a message (fallback for when WebSocket is not available)
   */
  async sendMessage(conversationId: string, content: string, attachments?: File[]): Promise<Message> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] ChatService.sendMessage - sending message via HTTP API')
      }

      const data = { content }

      const response = await apiClient.post(`/chat/conversations/${conversationId}/messages/`, data)
      
      if (DEBUG) {
        console.log('[DEBUG] ChatService.sendMessage - response:', response)
      }

      // Backend returns both user_message and ai_response
      if (response.success && response.user_message) {
        const msg = response.user_message
        const message = {
          id: msg.id,
          conversationId: msg.conversation,
          userId: msg.user,
          content: msg.content,
          type: msg.message_type,
          timestamp: new Date(msg.created_at),
          editedAt: msg.edited_at ? new Date(msg.edited_at) : undefined,
          qpnMode: msg.qpn_mode,
          processingTime: msg.processing_time,
          metadata: msg.metadata || {},
          attachments: msg.attachments || []
        }

        if (DEBUG) {
          console.log('[DEBUG] ChatService.sendMessage - message sent via HTTP')
        }

        return message
      }

      throw new Error('Failed to send message')
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] ChatService.sendMessage - failed:', error)
      }
      throw error
    }
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, newContent: string): Promise<Message> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] ChatService.editMessage - editing:', messageId)
      }

      // For now, this is a client-side operation
      // In the future, this would call a backend endpoint
      throw new Error('Message editing not yet implemented on backend')
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] ChatService.editMessage - failed:', error)
      }
      throw error
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] ChatService.deleteMessage - deleting:', messageId)
      }

      // For now, this is a client-side operation
      // In the future, this would call a backend endpoint
      throw new Error('Message deletion not yet implemented on backend')
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] ChatService.deleteMessage - failed:', error)
      }
      throw error
    }
  }

  /**
   * Process query with specific QPN mode
   */
  async processQuery(query: string, qpnMode: QpnMode = 'simple', conversationId?: string): Promise<any> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] ChatService.processQuery - processing with mode:', qpnMode)
      }

      const data = {
        query,
        mode: qpnMode,
        conversationId
      }

      const response = await apiClient.post('/qpn/process/', data)
      
      if (DEBUG) {
        console.log('[DEBUG] ChatService.processQuery - query processed')
      }

      return response
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] ChatService.processQuery - failed:', error)
      }
      throw error
    }
  }

  /**
   * Search conversations and messages
   */
  async search(query: string, filters?: any): Promise<any> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] ChatService.search - searching for:', query)
      }

      const params = {
        q: query,
        ...filters
      }

      const response = await apiClient.get('/chat/search/', { params })
      
      if (DEBUG) {
        console.log('[DEBUG] ChatService.search - search completed')
      }

      return response
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] ChatService.search - failed:', error)
      }
      throw error
    }
  }
}

export const chatService = new ChatService() 