import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './AdminPage.css'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

const AdminPage: React.FC = () => {
  const { user, logout } = useAuth()

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
            <a href="#users" className="nav-item active">Users</a>
            <a href="#organizations" className="nav-item">Organizations</a>
            <a href="#settings" className="nav-item">Settings</a>
            <a href="#analytics" className="nav-item">Analytics</a>
            <a href="#logs" className="nav-item">Audit Logs</a>
          </nav>
        </div>

        <div className="admin-main">
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
        </div>
      </div>
    </div>
  )
}

export default AdminPage 