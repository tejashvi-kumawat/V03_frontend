// API Client for AI Business Analytics & Intelligence Solution

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

const DEBUG = (import.meta as any).env?.VITE_DEBUG === 'true'

// API Configuration
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api'
const REQUEST_TIMEOUT = 12000000 // 2 minutes for long-running operations like RCA

interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
  timestamp: string
}

interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

class ApiClient {
  private axiosInstance: AxiosInstance
  private authTokens: AuthTokens | null = null

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Load tokens from localStorage on initialization
    this.loadTokensFromStorage()

    // Request interceptor to add auth headers
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (DEBUG) {
          console.log('[DEBUG] API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            hasToken: !!this.authTokens?.access_token
          })
        }

        // Add auth token if available
        if (this.authTokens?.access_token) {
          config.headers.Authorization = `Bearer ${this.authTokens.access_token}`
        }

        // Add request ID for debugging
        config.headers['x-request-id'] = this.generateRequestId()

        return config
      },
      (error) => {
        if (DEBUG) {
          console.error('[DEBUG] API Request Error:', error)
        }
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => {
        if (DEBUG) {
          console.log('[DEBUG] API Response:', {
            status: response.status,
            url: response.config.url,
            success: response.data?.success
          })
        }
        return response
      },
      async (error) => {
        const originalRequest = error.config

        if (DEBUG) {
          console.error('[DEBUG] API Response Error:', {
            status: error.response?.status,
            url: error.config?.url,
            message: error.response?.data?.error || error.message
          })
        }

        // Handle 401 Unauthorized - try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry && this.authTokens?.refresh_token) {
          originalRequest._retry = true

          try {
            if (DEBUG) {
              console.log('[DEBUG] Attempting token refresh...')
            }

            const refreshResponse = await this.axiosInstance.post('/auth/refresh/', {
              refresh_token: this.authTokens.refresh_token
            })

            if (refreshResponse.data.success) {
              this.setAuthTokens(refreshResponse.data.tokens)
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${this.authTokens!.access_token}`
              return this.axiosInstance(originalRequest)
            }
          } catch (refreshError) {
            if (DEBUG) {
              console.error('[DEBUG] Token refresh failed:', refreshError)
            }
            this.clearAuthTokens()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  private loadTokensFromStorage(): void {
    try {
      const storedTokens = localStorage.getItem('auth_tokens')
      if (storedTokens) {
        this.authTokens = JSON.parse(storedTokens)
        if (DEBUG) {
          console.log('[DEBUG] Loaded tokens from localStorage')
        }
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to load tokens from localStorage:', error)
      }
      this.clearAuthTokens()
    }
  }

  private saveTokensToStorage(): void {
    try {
      if (this.authTokens) {
        localStorage.setItem('auth_tokens', JSON.stringify(this.authTokens))
        if (DEBUG) {
          console.log('[DEBUG] Saved tokens to localStorage')
        }
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to save tokens to localStorage:', error)
      }
    }
  }

  public setAuthTokens(tokens: AuthTokens): void {
    this.authTokens = tokens
    this.saveTokensToStorage()
    
    if (DEBUG) {
      console.log('[DEBUG] Auth tokens set and saved')
    }
  }

  public clearAuthTokens(): void {
    this.authTokens = null
    localStorage.removeItem('auth_tokens')
    
    if (DEBUG) {
      console.log('[DEBUG] Auth tokens cleared')
    }
  }

  public getAuthTokens(): AuthTokens | null {
    return this.authTokens
  }

  public isAuthenticated(): boolean {
    return !!this.authTokens?.access_token
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.get(url, config)
      return response.data
    } catch (error) {
      this.handleApiError(error as AxiosError)
      throw error
    }
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config)
      return response.data
    } catch (error) {
      this.handleApiError(error as AxiosError)
      throw error
    }
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.put(url, data, config)
      return response.data
    } catch (error) {
      this.handleApiError(error as AxiosError)
      throw error
    }
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.patch(url, data, config)
      return response.data
    } catch (error) {
      this.handleApiError(error as AxiosError)
      throw error
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.delete(url, config)
      return response.data
    } catch (error) {
      this.handleApiError(error as AxiosError)
      throw error
    }
  }

  // File upload helper
  async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        },
      }

      const response: AxiosResponse<T> = await this.axiosInstance.post(url, formData, config)
      return response.data
    } catch (error) {
      this.handleApiError(error as AxiosError)
      throw error
    }
  }

  // File download helper
  async download(url: string, filename?: string): Promise<void> {
    try {
      const response = await this.axiosInstance.get(url, {
        responseType: 'blob',
      })

      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      this.handleApiError(error as AxiosError)
      throw error
    }
  }

  private handleApiError(error: AxiosError): void {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const data = error.response.data as any

      if (DEBUG) {
        console.error('[DEBUG] API Error Response:', {
          status,
          error: data?.error || 'Unknown error',
          url: error.config?.url
        })
      }

      // Handle specific error cases
      switch (status) {
        case 401:
          if (DEBUG) {
            console.log('[DEBUG] Unauthorized - redirecting to login')
          }
          break
        case 403:
          if (DEBUG) {
            console.log('[DEBUG] Forbidden - insufficient permissions')
          }
          break
        case 429:
          if (DEBUG) {
            console.log('[DEBUG] Rate limited')
          }
          break
        case 500:
          if (DEBUG) {
            console.error('[DEBUG] Server error')
          }
          break
      }
    } else if (error.request) {
      // Network error
      if (DEBUG) {
        console.error('[DEBUG] Network Error:', error.message)
      }
    } else {
      // Other error
      if (DEBUG) {
        console.error('[DEBUG] Request Error:', error.message)
      }
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

if (DEBUG) {
  console.log('[DEBUG] ApiClient initialized with base URL:', API_BASE_URL)
} 