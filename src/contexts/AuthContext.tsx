import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, LoginCredentials } from '../types/auth'
import { apiClient } from '../services/apiClient'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize auth state from stored tokens
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (DEBUG) {
          console.log('[DEBUG] Initializing auth state...')
        }

        // Check if API client has tokens
        if (apiClient.isAuthenticated()) {
          if (DEBUG) {
            console.log('[DEBUG] Found stored tokens, validating...')
          }

          // Validate tokens with backend
          const response = await apiClient.get('/auth/validate/')
          
          if (response.success && response.valid && response.user) {
            if (DEBUG) {
              console.log('[DEBUG] Token validation successful, restoring user:', response.user.username)
            }
            
            setUser(response.user)
            setIsAuthenticated(true)
          } else {
            if (DEBUG) {
              console.log('[DEBUG] Token validation failed, clearing tokens')
            }
            apiClient.clearAuthTokens()
          }
        } else {
          if (DEBUG) {
            console.log('[DEBUG] No stored tokens found')
          }
        }
      } catch (error) {
        if (DEBUG) {
          console.error('[DEBUG] Auth initialization failed:', error)
        }
        // Clear invalid tokens
        apiClient.clearAuthTokens()
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      if (DEBUG) {
        console.log('[DEBUG] Attempting login for user:', credentials.username)
      }

      // Call login API
      const response = await apiClient.post('/auth/login/', {
        username: credentials.username,
        password: credentials.password,
        organization_code: credentials.organizationCode
      })

      if (response.success && response.tokens && response.user) {
        // Store tokens in API client
        apiClient.setAuthTokens({
          access_token: response.tokens.access_token,
          refresh_token: response.tokens.refresh_token,
          token_type: response.tokens.token_type || 'Bearer'
        })

        // Update auth state
        setUser(response.user)
        setIsAuthenticated(true)
        
        if (DEBUG) {
          console.log('[DEBUG] Login successful for user:', response.user.username)
        }
      } else {
        throw new Error(response.error || 'Login failed')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed'
      setError(errorMessage)
      
      if (DEBUG) {
        console.error('[DEBUG] Login failed:', errorMessage)
      }
      
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      if (DEBUG) {
        console.log('[DEBUG] Logging out user')
      }

      // Call logout API if authenticated
      if (isAuthenticated) {
        try {
          await apiClient.post('/auth/logout/')
        } catch (error) {
          // Continue with logout even if API call fails
          if (DEBUG) {
            console.error('[DEBUG] Logout API call failed:', error)
          }
        }
      }

      // Clear tokens and state
      apiClient.clearAuthTokens()
      setUser(null)
      setIsAuthenticated(false)
      setError(null)
      
      if (DEBUG) {
        console.log('[DEBUG] Logout completed')
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Logout error:', error)
      }
      // Force logout even on error
      apiClient.clearAuthTokens()
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const refreshToken = async (): Promise<void> => {
    try {
      if (DEBUG) {
        console.log('[DEBUG] Refreshing auth token')
      }

      const tokens = apiClient.getAuthTokens()
      if (!tokens?.refresh_token) {
        throw new Error('No refresh token available')
      }

      const response = await apiClient.post('/auth/refresh/', {
        refresh_token: tokens.refresh_token
      })

      if (response.success && response.tokens) {
        apiClient.setAuthTokens({
          access_token: response.tokens.access_token,
          refresh_token: response.tokens.refresh_token,
          token_type: response.tokens.token_type || 'Bearer'
        })
        
        if (DEBUG) {
          console.log('[DEBUG] Token refresh successful')
        }
      } else {
        throw new Error('Token refresh failed')
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Token refresh failed:', error)
      }
      
      // Clear tokens and redirect to login
      await logout()
      throw error
    }
  }

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    try {
      setLoading(true)
      
      if (DEBUG) {
        console.log('[DEBUG] Updating user profile')
      }

      const response = await apiClient.put('/auth/profile/', updates)
      
      if (response.success && response.user) {
        setUser(response.user)
        
        if (DEBUG) {
          console.log('[DEBUG] Profile updated successfully')
        }
      } else {
        throw new Error(response.error || 'Profile update failed')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Profile update failed'
      setError(errorMessage)
      
      if (DEBUG) {
        console.error('[DEBUG] Profile update failed:', errorMessage)
      }
      
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  // Set up token expiration handler
  useEffect(() => {
    const handleTokenExpiration = () => {
      if (DEBUG) {
        console.log('[DEBUG] Token expired, logging out...')
      }
      logout()
    }

    // Listen for token expiration events
    window.addEventListener('tokenExpired', handleTokenExpiration)
    
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpiration)
    }
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    refreshToken,
    updateProfile,
    clearError
  }

  if (DEBUG) {
    console.log('[DEBUG] AuthProvider render - user:', user?.username, 'loading:', loading)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 