// Simple notification utility for showing success and error messages

export const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  // Create notification element
  const notification = document.createElement('div')
  notification.className = `notification notification-${type}`
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    max-width: 400px;
    word-wrap: break-word;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `

  // Set background color based on type
  switch (type) {
    case 'success':
      notification.style.backgroundColor = '#10b981'
      break
    case 'error':
      notification.style.backgroundColor = '#ef4444'
      break
    case 'info':
      notification.style.backgroundColor = '#3b82f6'
      break
  }

  notification.textContent = message

  // Add to DOM
  document.body.appendChild(notification)

  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)'
  }, 100)

  // Remove after 4 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)'
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 300)
  }, 4000)
}

export const showSuccess = (message: string) => showNotification(message, 'success')
export const showError = (message: string) => showNotification(message, 'error')
export const showInfo = (message: string) => showNotification(message, 'info') 