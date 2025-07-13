// Browser notification service for RCA analysis completion

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

class BrowserNotificationService {
  private isSupported: boolean
  private permission: NotificationPermission = 'default'

  constructor() {
    this.isSupported = 'Notification' in window
    if (this.isSupported) {
      this.permission = Notification.permission
    }
  }

  /**
   * Check if browser notifications are supported
   */
  isNotificationSupported(): boolean {
    return this.isSupported
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (this.isSupported) {
      this.permission = Notification.permission
    }
    return this.permission
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.warn('Browser notifications are not supported')
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return 'denied'
    }
  }

  /**
   * Check if we have permission to send notifications
   */
  canSendNotifications(): boolean {
    // Always check the current permission status from the browser
    if (this.isSupported) {
      this.permission = Notification.permission
    }
    return this.isSupported && this.permission === 'granted'
  }

  /**
   * Send a notification
   */
  async sendNotification(options: NotificationOptions): Promise<Notification | null> {
    console.log('[DEBUG] sendNotification called with options:', options)
    
    if (!this.canSendNotifications()) {
      console.warn('Cannot send notifications - permission not granted')
      return null
    }

    try {
      console.log('[DEBUG] Creating new Notification with:', {
        title: options.title,
        body: options.body,
        icon: options.icon,
        tag: options.tag,
        requireInteraction: options.requireInteraction
      })
      
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        actions: options.actions
      })

      console.log('[DEBUG] Notification created successfully:', notification)

      // Add click handler
      notification.onclick = (event) => {
        console.log('[DEBUG] Notification clicked:', event)
        event.preventDefault()
        this.handleNotificationClick(notification, options.data)
        notification.close()
      }

      return notification
    } catch (error) {
      console.error('Failed to send notification:', error)
      return null
    }
  }

  /**
   * Send RCA analysis completion notification
   */
  async sendRCAAnalysisCompleteNotification(rcaRequestId: string, problemDescription: string): Promise<Notification | null> {
    console.log('[DEBUG] sendRCAAnalysisCompleteNotification called with:', { rcaRequestId, problemDescription })
    
    const title = '🔍 RCA Analysis Complete'
    const body = `Your root cause analysis for "${problemDescription.substring(0, 50)}${problemDescription.length > 50 ? '...' : ''}" is ready to view.`

    console.log('[DEBUG] Creating notification with:', { title, body, rcaRequestId })
    
    const notification = await this.sendNotification({
      title,
      body,
      icon: '/favicon.ico',
      tag: `rca-complete-${rcaRequestId}`,
      data: {
        type: 'rca_analysis_complete',
        rcaRequestId,
        problemDescription
      },
      requireInteraction: true,
      actions: [
        {
          action: 'view_report',
          title: 'View Report'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    })
    
    console.log('[DEBUG] Notification result:', notification)
    return notification
  }

  /**
   * Handle notification click events
   */
  private handleNotificationClick(notification: Notification, data: any): void {
    if (data?.type === 'rca_analysis_complete') {
      // Emit a custom event that the app can listen to
      const event = new CustomEvent('rcaNotificationClick', {
        detail: {
          rcaRequestId: data.rcaRequestId,
          problemDescription: data.problemDescription
        }
      })
      window.dispatchEvent(event)
    }
  }

  /**
   * Show permission request dialog with explanation
   */
  async showPermissionRequestDialog(): Promise<boolean> {
    if (!this.isSupported) {
      alert('Browser notifications are not supported in your browser.')
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    if (this.permission === 'denied') {
      alert('Notification permission was denied. Please enable notifications in your browser settings to receive updates about your RCA analysis.')
      return false
    }

    // Show a custom dialog explaining why we need notifications
    const shouldRequest = confirm(
      'Would you like to receive notifications when your RCA analysis is complete?\n\n' +
      'This will help you stay updated on your investigation progress without having to constantly check the app.'
    )

    if (shouldRequest) {
      const permission = await this.requestPermission()
      return permission === 'granted'
    }

    return false
  }
}

// Create singleton instance
export const browserNotificationService = new BrowserNotificationService()

// Export convenience functions
export const requestNotificationPermission = () => browserNotificationService.requestPermission()
export const sendRCANotification = (rcaRequestId: string, problemDescription: string) => 
  browserNotificationService.sendRCAAnalysisCompleteNotification(rcaRequestId, problemDescription)
export const canSendNotifications = () => browserNotificationService.canSendNotifications()
export const showPermissionDialog = () => browserNotificationService.showPermissionRequestDialog()

// Test function for debugging
export const testNotification = async () => {
  console.log('[DEBUG] Testing notification system...')
  const result = await browserNotificationService.sendNotification({
    title: 'Test Notification',
    body: 'This is a test notification to verify the system works',
    requireInteraction: false
  })
  console.log('[DEBUG] Test notification result:', result)
  return result
}

// Force refresh notification status
export const refreshNotificationStatus = () => {
  browserNotificationService.getPermissionStatus()
  return browserNotificationService.canSendNotifications()
}

// Make test function available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testRcaNotification = testNotification
  ;(window as any).rcaNotificationService = browserNotificationService
} 