import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner'
import './LoginPage.css'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

const LoginPage: React.FC = () => {
  const { login, loading, error, clearError } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [organizationCode, setOrganizationCode] = useState('')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  if (DEBUG) {
    console.log('[DEBUG] LoginPage render - loading:', loading)
  }

  // Mouse tracking for 3D effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Clear error when component mounts or when user starts typing
  useEffect(() => {
    clearError()
  }, [clearError])

  const handleInputChange = () => {
    if (error) {
      clearError()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !password || !organizationCode) {
      return
    }

    try {
      await login({
        username: username.trim(),
        password,
        organizationCode: organizationCode.trim()
      })
      
      if (DEBUG) {
        console.log('[DEBUG] Login successful, redirecting...')
      }
    } catch (error: any) {
      if (DEBUG) {
        console.error('[DEBUG] Login error:', error)
      }
    }
  }

  return (
    <div className="login-page">
      {/* Animated Background Elements */}
      <div className="background-effects">
        <div className="floating-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
          <div className="orb orb-4"></div>
          <div className="orb orb-5"></div>
        </div>
        
        <div className="geometric-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        
        <div className="particle-system">
          {[...Array(50)].map((_, i) => (
            <div key={i} className={`particle particle-${i % 5}`}></div>
          ))}
        </div>
        
        <div className="grid-overlay"></div>
      </div>

      <div 
        className="login-container"
        style={{
          transform: `perspective(1000px) rotateX(${mousePosition.y * 5}deg) rotateY(${mousePosition.x * 5}deg)`
        }}
      >
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-3d">
              <div className="logo-face logo-front">
                <div className="logo-symbol">AI</div>
              </div>
              <div className="logo-face logo-back">
                <div className="logo-symbol">BI</div>
              </div>
              <div className="logo-face logo-right"></div>
              <div className="logo-face logo-left"></div>
              <div className="logo-face logo-top"></div>
              <div className="logo-face logo-bottom"></div>
            </div>
            <div className="logo-glow"></div>
          </div>
          
          <h1 className="glitch-text" data-text="AI Business Analytics & Intelligence">
            AI Business Analytics & Intelligence
          </h1>
          <p className="subtitle-animated">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message error-animated">
              <div className="error-icon">⚠️</div>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username" className="floating-label">Username</label>
            <div className="input-container">
              <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); handleInputChange() }}
                placeholder="Enter your username"
                disabled={loading}
                required
                className="futuristic-input"
              />
              <div className="input-glow"></div>
              <div className="input-border"></div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="floating-label">Password</label>
            <div className="input-container">
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); handleInputChange() }}
                placeholder="Enter your password"
                disabled={loading}
                required
                className="futuristic-input"
              />
              <div className="input-glow"></div>
              <div className="input-border"></div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="organizationCode" className="floating-label">Organization Code</label>
            <div className="input-container">
              <input
                type="text"
                id="organizationCode"
                name="organizationCode"
                value={organizationCode}
                onChange={(e) => { setOrganizationCode(e.target.value); handleInputChange() }}
                placeholder="Enter your organization code"
                disabled={loading}
                required
                className="futuristic-input"
              />
              <div className="input-glow"></div>
              <div className="input-border"></div>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-button cyber-button"
            disabled={loading}
          >
            <div className="button-content">
              {loading ? (
                <LoadingSpinner size="small" message="" />
              ) : (
                <>
                  <span className="button-text">SIGN IN</span>
                  <div className="button-effects">
                    <div className="button-glow"></div>
                    <div className="button-particles"></div>
                  </div>
                </>
              )}
            </div>
            <div className="button-border"></div>
          </button>
        </form>

        <div className="login-footer">
          <p className="footer-text">
            Need help? Contact your administrator for access credentials.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
