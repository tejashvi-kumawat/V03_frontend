// Authentication Service for AI Business Analytics & Intelligence Solution

import { 
  User, 
  LoginRequest, 
  LoginResponse, 
  TokenValidationResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  AuthError,
  AuthErrorCode 
} from '../types/auth'
import { apiClient } from './apiClient'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'user_data'

class AuthService {
  private token: string | null = null
  private refreshToken: string | null = null

  constructor() {
    // Initialize tokens from localStorage
    this.token = localStorage.getItem(TOKEN_KEY)
    this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    
    if (DEBUG) {
      console.log('[DEBUG] AuthService initialized - token exists:', !!this.token)
    }
  }

  /**
   * Login user with credentials
   */
  async login(username: string, password: string, organizationCode: string): Promise<LoginResponse> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] AuthService.login - attempting login for:', username)
      }

      const loginData: LoginRequest = {
        username,
        password,
        organization_code: organizationCode
      }

      const response = await apiClient.post<LoginResponse>('/auth/login/', loginData)
      
      // Store tokens and user data
      this.setTokens(response.token, response.refreshToken)
      this.storeUserData(response.user)
      
      if (DEBUG) {
        console.log('[DEBUG] AuthService.login - login successful for:', response.user.username)
      }

      return response

    } catch (error: any) {
      if (DEBUG) {
        console.error('[DEBUG] AuthService.login - login failed:', error)
      }
      
      throw this.handleAuthError(error)
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] AuthService.logout - logging out')
      }

      // Call logout API if token exists
      if (this.token && this.refreshToken) {
        try {
          await apiClient.post('/auth/logout/', {
            refresh_token: this.refreshToken  // Use snake_case to match backend API
          })
        } catch (error) {
          if (DEBUG) {
            console.log('[DEBUG] AuthService.logout - API call failed:', error)
          }
          // Continue with local logout even if API fails
        }
      }

      // Clear local storage
      this.clearTokens()
      this.clearUserData()
      
      if (DEBUG) {
        console.log('[DEBUG] AuthService.logout - logout completed')
      }

    } catch (error: any) {
      if (DEBUG) {
        console.error('[DEBUG] AuthService.logout - logout error:', error)
      }
      
      // Even if logout fails, clear local data
      this.clearTokens()
      this.clearUserData()
    }
  }

  /**
   * Validate current token
   */
  async validateToken(): Promise<User> {
    try {
      if (!this.token) {
        throw new Error('No token available')
      }

      if (DEBUG) {
        console.log('[DEBUG] AuthService.validateToken - validating token')
      }

      const response = await apiClient.get<TokenValidationResponse>('/auth/validate/')
      
      if (!response.valid || !response.user) {
        throw new Error('Token validation failed')
      }

      // Update stored user data
      this.storeUserData(response.user)
      
      if (DEBUG) {
        console.log('[DEBUG] AuthService.validateToken - token valid for:', response.user.username)
      }

      return response.user

    } catch (error: any) {
      if (DEBUG) {
        console.error('[DEBUG] AuthService.validateToken - validation failed:', error)
      }
      
      // Clear invalid token
      this.clearTokens()
      this.clearUserData()
      
      throw this.handleAuthError(error)
    }
  }

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<User> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] AuthService.getCurrentUser - fetching user data')
      }

      const response = await apiClient.get<User>('/auth/user/')
      
      // Update stored user data
      this.storeUserData(response)
      
      if (DEBUG) {
        console.log('[DEBUG] AuthService.getCurrentUser - user data fetched:', response.username)
      }

      return response

    } catch (error: any) {
      if (DEBUG) {
        console.error('[DEBUG] AuthService.getCurrentUser - failed to fetch user:', error)
      }
      
      throw this.handleAuthError(error)
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] AuthService.updateProfile - updating profile')
      }

      const response = await apiClient.patch<User>('/auth/profile/', data)
      
      // Update stored user data
      this.storeUserData(response)
      
      if (DEBUG) {
        console.log('[DEBUG] AuthService.updateProfile - profile updated')
      }

      return response

    } catch (error: any) {
      if (DEBUG) {
        console.error('[DEBUG] AuthService.updateProfile - update failed:', error)
      }
      
      throw this.handleAuthError(error)
    }
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      if (DEBUG) {
        console.log('[DEBUG] AuthService.changePassword - changing password')
      }

      await apiClient.post('/auth/change-password/', data)
      
      if (DEBUG) {
        console.log('[DEBUG] AuthService.changePassword - password changed successfully')
      }

    } catch (error: any) {
      if (DEBUG) {
        console.error('[DEBUG] AuthService.changePassword - change failed:', error)
      }
      
      throw this.handleAuthError(error)
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshAuthToken(): Promise<string> {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available')
      }

      if (DEBUG) {
        console.log('[DEBUG] AuthService.refreshAuthToken - refreshing token')
      }

      const response = await apiClient.post<{ token: string, expiresAt: Date }>('/auth/refresh/', {
        refresh_token: this.refreshToken  // Use snake_case to match backend API
      })

      this.setTokens(response.token, this.refreshToken)
      
      if (DEBUG) {
        console.log('[DEBUG] AuthService.refreshAuthToken - token refreshed')
      }

      return response.token

    } catch (error: any) {
      if (DEBUG) {
        console.error('[DEBUG] AuthService.refreshAuthToken - refresh failed:', error)
      }
      
      // Clear tokens if refresh fails
      this.clearTokens()
      this.clearUserData()
      
      // Emit token expired event
      window.dispatchEvent(new CustomEvent('tokenExpired'))
      
      throw this.handleAuthError(error)
    }
  }

  /**
   * Get stored token
   */
  getStoredToken(): string | null {
    return this.token
  }

  /**
   * Store authentication token
   */
  storeToken(token: string): void {
    this.token = token
    localStorage.setItem(TOKEN_KEY, token)
    
    if (DEBUG) {
      console.log('[DEBUG] AuthService.storeToken - token stored')
    }
  }

  /**
   * Clear authentication tokens
   */
  clearToken(): void {
    this.clearTokens()
    this.clearUserData()
    
    if (DEBUG) {
      console.log('[DEBUG] AuthService.clearToken - tokens cleared')
    }
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    try {
      const userData = localStorage.getItem(USER_KEY)
      if (userData) {
        return JSON.parse(userData)
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] AuthService.getStoredUser - failed to parse user data:', error)
      }
    }
    return null
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getStoredUser()
    return user ? user.role === role : false
  }

  /**
   * Private: Set tokens in memory and localStorage
   */
  private setTokens(token: string, refreshToken: string): void {
    this.token = token
    this.refreshToken = refreshToken
    
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }

  /**
   * Private: Clear tokens from memory and localStorage
   */
  private clearTokens(): void {
    this.token = null
    this.refreshToken = null
    
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  /**
   * Private: Store user data in localStorage
   */
  private storeUserData(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }

  /**
   * Private: Clear user data from localStorage
   */
  private clearUserData(): void {
    localStorage.removeItem(USER_KEY)
  }

  /**
   * Private: Handle authentication errors
   */
  private handleAuthError(error: any): AuthError {
    const authError: AuthError = {
      code: AuthErrorCode.SERVER_ERROR,
      message: 'Authentication failed',
      details: error
    }

    // Map specific error codes
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 401:
          authError.code = AuthErrorCode.INVALID_CREDENTIALS
          authError.message = data?.message || 'Invalid credentials'
          break
        case 403:
          authError.code = AuthErrorCode.PERMISSION_DENIED
          authError.message = data?.message || 'Access denied'
          break
        case 404:
          authError.code = AuthErrorCode.ORGANIZATION_NOT_FOUND
          authError.message = data?.message || 'Organization not found'
          break
        case 423:
          authError.code = AuthErrorCode.ACCOUNT_LOCKED
          authError.message = data?.message || 'Account locked'
          break
        default:
          authError.message = data?.message || 'Authentication failed'
      }
    } else if (error.code === 'NETWORK_ERROR') {
      authError.code = AuthErrorCode.NETWORK_ERROR
      authError.message = 'Network connection failed'
    }

    return authError
  }
}

// Export singleton instance
export const authService = new AuthService()

if (DEBUG) {
  console.log('[DEBUG] AuthService module loaded')
} 