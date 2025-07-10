// Authentication Types for AI Business Analytics & Intelligence Solution

export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'user'
  organizationId: string
  organizationName: string
  isActive: boolean
  preferences: UserPreferences
  lastLogin: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  notifications: NotificationSettings
  personalization: PersonalizationSettings
}

export interface NotificationSettings {
  enabled: boolean
  longRunningTasks: boolean
  systemUpdates: boolean
  securityAlerts: boolean
}

export interface PersonalizationSettings {
  role: string
  biodata: string
  responseStyle: string
  enableSuggestions: boolean
}

export interface LoginRequest {
  username: string
  password: string
  organization_code: string  // Use snake_case to match backend API
}

export interface LoginCredentials {
  username: string
  password: string
  organizationCode: string  // Use camelCase for frontend
}

export interface LoginResponse {
  user: User
  token: string
  refreshToken: string
  expiresAt: Date
}

export interface TokenValidationResponse {
  valid: boolean
  user?: User
  error?: string
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  email?: string
  preferences?: Partial<UserPreferences>
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface Organization {
  id: string
  name: string
  code: string
  domain: string
  isActive: boolean
  settings: OrganizationSettings
  createdAt: Date
  updatedAt: Date
}

export interface OrganizationSettings {
  maxUsers: number
  features: string[]
  customBranding: boolean
  ssoEnabled: boolean
}

export interface AuthError {
  code: string
  message: string
  details?: any
}

// Auth API Error Codes
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ORGANIZATION_NOT_FOUND = 'ORGANIZATION_NOT_FOUND',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
}

// Session Management
export interface Session {
  id: string
  userId: string
  deviceInfo: DeviceInfo
  ipAddress: string
  userAgent: string
  isActive: boolean
  createdAt: Date
  lastActivity: Date
  expiresAt: Date
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet'
  os: string
  browser: string
  fingerprint: string
}

// Security Audit
export interface SecurityAuditLog {
  id: string
  userId: string
  action: SecurityAction
  details: any
  ipAddress: string
  userAgent: string
  timestamp: Date
  success: boolean
}

export enum SecurityAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  PERMISSION_CHECK = 'PERMISSION_CHECK'
} 