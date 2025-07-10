import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

export type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check local storage first
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    
    // Default to light
    return 'light'
  })

  // Apply theme to document body
  useEffect(() => {
    const root = document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    
    // Add current theme class
    root.classList.add(theme)
    
    // Store in localStorage
    localStorage.setItem('theme', theme)
    
    if (DEBUG) {
      console.log('[DEBUG] Theme applied:', theme)
    }
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      const hasManualPreference = localStorage.getItem('theme')
      if (!hasManualPreference) {
        const newTheme = e.matches ? 'dark' : 'light'
        setThemeState(newTheme)
        
        if (DEBUG) {
          console.log('[DEBUG] System theme changed to:', newTheme)
        }
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setThemeState(newTheme)
    
    if (DEBUG) {
      console.log('[DEBUG] Theme toggled to:', newTheme)
    }
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    
    if (DEBUG) {
      console.log('[DEBUG] Theme set to:', newTheme)
    }
  }

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme
  }

  if (DEBUG) {
    console.log('[DEBUG] ThemeProvider render - theme:', theme)
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
} 