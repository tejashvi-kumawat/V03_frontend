import React, { useEffect, useState } from 'react'
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  FileText, 
  Loader2, 
  AlertTriangle,
  BarChart3,
  Target,
  Zap,
  Brain,
  TestTube,
  Lightbulb
} from 'lucide-react'
import { RCAProgressUpdate, RCASession, RCALog, RCAHypothesis } from '../../types/rca'
import './RCAProgress.css'

interface RCAProgressProps {
  progress: RCAProgressUpdate
  session?: RCASession
  logs?: RCALog[]
  hypotheses?: RCAHypothesis[]
  onCancel?: () => void
}

const RCAProgress: React.FC<RCAProgressProps> = ({
  progress,
  session,
  logs = [],
  hypotheses = [],
  onCancel
}) => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const getPhaseIcon = (phase: string) => {
    switch (phase.toLowerCase()) {
      case 'initialization':
        return <Zap size={20} />
      case 'symptom_analysis':
        return <Target size={20} />
      case 'hypothesis_generation':
        return <Lightbulb size={20} />
      case 'test_planning':
        return <BarChart3 size={20} />
      case 'test_execution':
        return <TestTube size={20} />
      case 'result_analysis':
        return <Brain size={20} />
      case 'conclusion':
        return <CheckCircle size={20} />
      default:
        return <Activity size={20} />
    }
  }

  const getPhaseColor = (phase: string) => {
    switch (phase.toLowerCase()) {
      case 'initialization':
        return '#3b82f6'
      case 'symptom_analysis':
        return '#8b5cf6'
      case 'hypothesis_generation':
        return '#f59e0b'
      case 'test_planning':
        return '#10b981'
      case 'test_execution':
        return '#ef4444'
      case 'result_analysis':
        return '#06b6d4'
      case 'conclusion':
        return '#059669'
      default:
        return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Activity size={16} className="status-icon active" />
      case 'testing':
        return <TestTube size={16} className="status-icon testing" />
      case 'validated':
        return <CheckCircle size={16} className="status-icon validated" />
      case 'eliminated':
        return <AlertTriangle size={16} className="status-icon eliminated" />
      case 'inconclusive':
        return <Clock size={16} className="status-icon inconclusive" />
      default:
        return <Activity size={16} className="status-icon" />
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const recentLogs = logs.slice(-5).reverse()
  const activeHypotheses = hypotheses.filter(h => h.status === 'active' || h.status === 'testing')

  return (
    <div className="rca-progress-container">
      {/* Header */}
      <div className="progress-header">
        <div className="progress-title">
          <Activity size={24} />
          <h3>RCA Investigation in Progress</h3>
        </div>
        <div className="progress-status">
          <div className="status-badge">
            <Loader2 size={16} className="spinner" />
            Investigating
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress.progress_percentage}%` }}
            />
          </div>
          <div className="progress-text">
            {Math.round(progress.progress_percentage)}% Complete
          </div>
        </div>
      </div>

      {/* Current Phase */}
      <div className="progress-section">
        <div className="phase-info">
          <div className="phase-icon" style={{ color: getPhaseColor(progress.phase) }}>
            {getPhaseIcon(progress.phase)}
          </div>
          <div className="phase-details">
            <h4>Current Phase: {progress.phase.replace(/_/g, ' ').toUpperCase()}</h4>
            <p>Iteration {progress.iteration} of {progress.total_iterations}</p>
            <p className="status-message">{progress.status_message}</p>
          </div>
        </div>
      </div>

      {/* Investigation Stats */}
      <div className="progress-section">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon">
              <Target size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{progress.iteration}</div>
              <div className="stat-label">Current Iteration</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">
              <Lightbulb size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{activeHypotheses.length}</div>
              <div className="stat-label">Active Hypotheses</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">
              <Zap size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{progress.tools_used.length}</div>
              <div className="stat-label">Tools Used</div>
            </div>
          </div>
          
          {progress.estimated_time_remaining && (
            <div className="stat-item">
              <div className="stat-icon">
                <Clock size={20} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{formatDuration(progress.estimated_time_remaining)}</div>
                <div className="stat-label">Est. Time Remaining</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Hypotheses */}
      {activeHypotheses.length > 0 && (
        <div className="progress-section">
          <h4>Active Hypotheses</h4>
          <div className="hypotheses-list">
            {activeHypotheses.map((hypothesis, index) => (
              <div key={hypothesis.id} className="hypothesis-item">
                <div className="hypothesis-header">
                  {getStatusIcon(hypothesis.status)}
                  <span className="hypothesis-title">{hypothesis.title}</span>
                  <div className="hypothesis-confidence">
                    {Math.round(hypothesis.confidence * 100)}%
                  </div>
                </div>
                <p className="hypothesis-description">{hypothesis.description}</p>
                <div className="hypothesis-meta">
                  <span className="impact-badge impact-{hypothesis.impact}">
                    Impact: {hypothesis.impact}
                  </span>
                  <span className="likelihood-badge">
                    Likelihood: {Math.round(hypothesis.likelihood * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentLogs.length > 0 && (
        <div className="progress-section">
          <h4>Recent Activity</h4>
          <div className="activity-list">
            {recentLogs.map((log, index) => (
              <div key={log.id} className="activity-item">
                <div className="activity-icon">
                  {getPhaseIcon(log.step_type)}
                </div>
                <div className="activity-content">
                  <div className="activity-message">{log.message}</div>
                  <div className="activity-meta">
                    <span className="activity-tool">{log.tool_name}</span>
                    <span className="activity-time">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="activity-level">
                  <span className={`level-badge level-${log.level.toLowerCase()}`}>
                    {log.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tools Used */}
      {progress.tools_used.length > 0 && (
        <div className="progress-section">
          <h4>Tools Used</h4>
          <div className="tools-list">
            {progress.tools_used.map((tool, index) => (
              <div key={index} className="tool-item">
                <Zap size={16} />
                <span>{tool}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {onCancel && (
        <div className="progress-actions">
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel Investigation
          </button>
        </div>
      )}
    </div>
  )
}

export default RCAProgress 