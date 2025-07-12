import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import MCPToolsManager from '../../components/MCPToolsManager/MCPToolsManager'
import './AdminPage.css'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

const AdminPage: React.FC = () => {
  const { user, logout } = useAuth()
  const [activeSection, setActiveSection] = useState('users')

  if (DEBUG) {
    console.log('[DEBUG] AdminPage render - user:', user?.username)
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] AdminPage - logout failed:', error)
      }
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Administration Panel</h1>
        <div className="admin-user-info">
          <span>{user?.firstName} {user?.lastName}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-sidebar">
          <nav className="admin-nav">
            <button 
              className={`nav-item ${activeSection === 'users' ? 'active' : ''}`}
              onClick={() => setActiveSection('users')}
            >
              Users
            </button>
            <button 
              className={`nav-item ${activeSection === 'organizations' ? 'active' : ''}`}
              onClick={() => setActiveSection('organizations')}
            >
              Organizations
            </button>
            <button 
              className={`nav-item ${activeSection === 'mcp-tools' ? 'active' : ''}`}
              onClick={() => setActiveSection('mcp-tools')}
            >
              MCP Tools
            </button>
            <button 
              className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveSection('settings')}
            >
              Settings
            </button>
            <button 
              className={`nav-item ${activeSection === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveSection('analytics')}
            >
              Analytics
            </button>
            <button 
              className={`nav-item ${activeSection === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveSection('logs')}
            >
              Audit Logs
            </button>
          </nav>
        </div>

        <div className="admin-main">
          {activeSection === 'users' && (
            <div className="admin-section">
              <h2>User Management</h2>
              <p>Manage users, their roles, and access permissions within your organization.</p>
              
              <div className="admin-actions">
                <button className="btn btn-primary">Add New User</button>
                <button className="btn btn-secondary">Export Users</button>
              </div>

              <div className="admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{user?.firstName} {user?.lastName}</td>
                      <td>{user?.email}</td>
                      <td className="role-badge admin">{user?.role}</td>
                      <td className="status-badge active">Active</td>
                      <td>Just now</td>
                      <td>
                        <button className="btn-small">Edit</button>
                        <button className="btn-small danger">Disable</button>
                      </td>
                    </tr>
                    <tr>
                      <td>John Doe</td>
                      <td>john.doe@company.com</td>
                      <td className="role-badge user">user</td>
                      <td className="status-badge active">Active</td>
                      <td>2 hours ago</td>
                      <td>
                        <button className="btn-small">Edit</button>
                        <button className="btn-small danger">Disable</button>
                      </td>
                    </tr>
                    <tr>
                      <td>Jane Smith</td>
                      <td>jane.smith@company.com</td>
                      <td className="role-badge user">user</td>
                      <td className="status-badge inactive">Inactive</td>
                      <td>1 week ago</td>
                      <td>
                        <button className="btn-small">Edit</button>
                        <button className="btn-small success">Enable</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'organizations' && (
            <div className="admin-section">
              <h2>Organization Management</h2>
              <p>Manage organizational settings, departments, and hierarchy.</p>
              <div className="placeholder-content">
                <p>Organization management features coming soon...</p>
              </div>
            </div>
          )}

          {activeSection === 'mcp-tools' && (
            <div className="admin-section">
              <h2>MCP Tools Management</h2>
              <p>Configure and manage Model Context Protocol (MCP) tools for enhanced AI capabilities.</p>
              <MCPToolsManager />
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="admin-section">
              <h2>System Settings</h2>
              <p>Configure system-wide settings and preferences.</p>
              <div className="placeholder-content">
                <p>System settings panel coming soon...</p>
              </div>
            </div>
          )}

          {activeSection === 'analytics' && (
            <div className="admin-section">
              <h2>Analytics Dashboard</h2>
              <p>View system analytics, usage statistics, and performance metrics.</p>
              <div className="placeholder-content">
                <p>Analytics dashboard coming soon...</p>
              </div>
            </div>
          )}

          {activeSection === 'logs' && (
            <div className="admin-section">
              <h2>Audit Logs</h2>
              <p>Review system audit logs and user activity.</p>
              <div className="placeholder-content">
                <p>Audit logs viewer coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminPage 