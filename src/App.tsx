import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useTheme } from './contexts/ThemeContext'
import LoginPage from './pages/LoginPage/LoginPage'
import ChatPage from './pages/ChatPage/ChatPage'
import AdminPage from './pages/AdminPage/AdminPage'
import FileManagerPage from './pages/FileManagerPage/FileManagerPage'
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner'
import './App.css'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

function App() {
  const { user, isAuthenticated, loading } = useAuth()
  const { theme } = useTheme()

  if (DEBUG) {
    console.log('[DEBUG] App render - user:', user?.username, 'isAuthenticated:', isAuthenticated, 'loading:', loading, 'theme:', theme)
  }

  if (loading) {
    return <LoadingSpinner message="Loading application..." />
  }

  return (
    <div className={`app ${theme}`}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/chat" replace /> : <LoginPage />} 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/chat/*" 
          element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" replace />} 
        />
        
        <Route 
          path="/admin" 
          element={isAuthenticated && user?.role === 'admin' ? <AdminPage /> : <Navigate to="/chat" replace />} 
        />
        
        <Route 
          path="/files" 
          element={isAuthenticated ? <FileManagerPage /> : <Navigate to="/login" replace />} 
        />
        
        {/* Default Redirect */}
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/chat" : "/login"} replace />} 
        />
        
        {/* 404 - Not Found */}
        <Route 
          path="*" 
          element={<Navigate to={isAuthenticated ? "/chat" : "/login"} replace />} 
        />
      </Routes>
    </div>
  )
}

export default App 