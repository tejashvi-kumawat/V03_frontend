import React, { useState } from 'react'
import { 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Download, 
  Copy, 
  Share2,
  BarChart3,
  Target,
  Lightbulb,
  Clock,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { RCAResult as RCAResultType, RCAHypothesis } from '../../types/rca'
import { rcaService } from '../../services/rcaService'
import './RCAResult.css'

interface RCAResultProps {
  result: RCAResultType
  onExport?: (format: 'pdf' | 'json' | 'csv') => void
  onShare?: () => void
}

const RCAResult: React.FC<RCAResultProps> = ({
  result,
  onExport,
  onShare
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']))
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const getConfidenceColor = (confidence: number | null) => {
    if (!confidence) return '#6b7280'
    if (confidence >= 0.8) return '#059669'
    if (confidence >= 0.6) return '#d97706'
    return '#dc2626'
  }

  const getConfidenceLabel = (confidence: number | null) => {
    if (!confidence) return 'Unknown'
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Medium'
    return 'Low'
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A'
    
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="rca-result-container">
      {/* Header */}
      <div className="result-header">
        <div className="result-title">
          <CheckCircle size={24} className="result-icon" />
          <h2>Root Cause Analysis Complete</h2>
        </div>
        <div className="result-actions">
          <button
            onClick={() => onExport?.('pdf')}
            className="btn btn-secondary btn-sm"
            title="Export as PDF"
          >
            <Download size={16} />
            PDF
          </button>
          <button
            onClick={() => onExport?.('json')}
            className="btn btn-secondary btn-sm"
            title="Export as JSON"
          >
            <FileText size={16} />
            JSON
          </button>
          <button
            onClick={onShare}
            className="btn btn-secondary btn-sm"
            title="Share Results"
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="result-summary">
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-icon">
              <Target size={20} />
            </div>
            <div className="summary-content">
              <div className="summary-label">Root Cause</div>
              <div className="summary-value">
                {result.root_cause || 'Not identified'}
              </div>
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-icon">
              <BarChart3 size={20} />
            </div>
            <div className="summary-content">
              <div className="summary-label">Confidence</div>
              <div 
                className="summary-value"
                style={{ color: getConfidenceColor(result.confidence) }}
              >
                {rcaService.formatConfidence(result.confidence)} ({getConfidenceLabel(result.confidence)})
              </div>
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-icon">
              <Clock size={20} />
            </div>
            <div className="summary-content">
              <div className="summary-label">Duration</div>
              <div className="summary-value">
                {formatDuration(result.duration_minutes)}
              </div>
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-icon">
              <Lightbulb size={20} />
            </div>
            <div className="summary-content">
              <div className="summary-label">Hypotheses Tested</div>
              <div className="summary-value">
                {result.hypotheses_tested?.length || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="result-sections">
        {/* Root Cause */}
        <div className="result-section">
          <button
            className="section-header"
            onClick={() => toggleSection('root-cause')}
          >
            <div className="section-title">
              <Target size={20} />
              <span>Root Cause Analysis</span>
            </div>
            {expandedSections.has('root-cause') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.has('root-cause') && (
            <div className="section-content">
              {result.root_cause ? (
                <div className="root-cause-content">
                  <p className="root-cause-text">{result.root_cause}</p>
                  <button
                    onClick={() => copyToClipboard(result.root_cause!, 'Root cause')}
                    className="btn btn-icon btn-sm"
                    title="Copy to clipboard"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              ) : (
                <div className="no-root-cause">
                  <AlertTriangle size={20} />
                  <p>No root cause was identified with sufficient confidence.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Findings */}
        <div className="result-section">
          <button
            className="section-header"
            onClick={() => toggleSection('findings')}
          >
            <div className="section-title">
              <BarChart3 size={20} />
              <span>Key Findings ({result.findings?.length || 0})</span>
            </div>
            {expandedSections.has('findings') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.has('findings') && (
            <div className="section-content">
              {result.findings && result.findings.length > 0 ? (
                <div className="findings-list">
                  {result.findings.map((finding, index) => (
                    <div key={index} className="finding-item">
                      <div className="finding-number">{index + 1}</div>
                      <div className="finding-content">
                        <p>{typeof finding === 'string' ? finding : finding.description || finding.message}</p>
                        {typeof finding === 'object' && finding.evidence && (
                          <div className="finding-evidence">
                            <strong>Evidence:</strong> {finding.evidence}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No findings were recorded.</p>
              )}
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="result-section">
          <button
            className="section-header"
            onClick={() => toggleSection('recommendations')}
          >
            <div className="section-title">
              <TrendingUp size={20} />
              <span>Recommendations ({result.recommendations?.length || 0})</span>
            </div>
            {expandedSections.has('recommendations') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.has('recommendations') && (
            <div className="section-content">
              {result.recommendations && result.recommendations.length > 0 ? (
                <div className="recommendations-list">
                  {result.recommendations.map((recommendation, index) => (
                    <div key={index} className="recommendation-item">
                      <div className="recommendation-number">{index + 1}</div>
                      <div className="recommendation-content">
                        <p>{typeof recommendation === 'string' ? recommendation : recommendation.description || recommendation.action}</p>
                        {typeof recommendation === 'object' && recommendation.priority && (
                          <div className="recommendation-priority">
                            <strong>Priority:</strong> {recommendation.priority}
                          </div>
                        )}
                        {typeof recommendation === 'object' && recommendation.impact && (
                          <div className="recommendation-impact">
                            <strong>Expected Impact:</strong> {recommendation.impact}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No recommendations were generated.</p>
              )}
            </div>
          )}
        </div>

        {/* Test Results */}
        <div className="result-section">
          <button
            className="section-header"
            onClick={() => toggleSection('test-results')}
          >
            <div className="section-title">
              <Award size={20} />
              <span>Test Results ({result.test_results?.length || 0})</span>
            </div>
            {expandedSections.has('test-results') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.has('test-results') && (
            <div className="section-content">
              {result.test_results && result.test_results.length > 0 ? (
                <div className="test-results-list">
                  {result.test_results.map((test, index) => (
                    <div key={index} className="test-result-item">
                      <div className="test-result-header">
                        <span className="test-name">
                          {typeof test === 'string' ? `Test ${index + 1}` : test.name || test.hypothesis || `Test ${index + 1}`}
                        </span>
                        <span className={`test-status test-${typeof test === 'object' ? test.status || 'unknown' : 'completed'}`}>
                          {typeof test === 'object' ? test.status || 'Completed' : 'Completed'}
                        </span>
                      </div>
                      <div className="test-result-content">
                        <p>{typeof test === 'string' ? test : test.result || test.description || 'Test completed'}</p>
                        {typeof test === 'object' && test.confidence && (
                          <div className="test-confidence">
                            Confidence: {Math.round(test.confidence * 100)}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No test results were recorded.</p>
              )}
            </div>
          )}
        </div>

        {/* Full Report */}
        <div className="result-section">
          <button
            className="section-header"
            onClick={() => toggleSection('full-report')}
          >
            <div className="section-title">
              <FileText size={20} />
              <span>Full Report</span>
            </div>
            {expandedSections.has('full-report') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.has('full-report') && (
            <div className="section-content">
              <div className="full-report">
                <div className="report-header">
                  <button
                    onClick={() => copyToClipboard(result.report, 'Full report')}
                    className="btn btn-secondary btn-sm"
                    title="Copy full report"
                  >
                    <Copy size={16} />
                    Copy Report
                  </button>
                </div>
                <div className="report-content">
                  <pre>{result.report}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="result-section">
          <button
            className="section-header"
            onClick={() => toggleSection('metadata')}
          >
            <div className="section-title">
              <FileText size={20} />
              <span>Investigation Details</span>
            </div>
            {expandedSections.has('metadata') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.has('metadata') && (
            <div className="section-content">
              <div className="metadata-grid">
                <div className="metadata-item">
                  <strong>Request ID:</strong> {result.request}
                </div>
                <div className="metadata-item">
                  <strong>Session ID:</strong> {result.session}
                </div>
                <div className="metadata-item">
                  <strong>Created:</strong> {formatDate(result.created_at)}
                </div>
                <div className="metadata-item">
                  <strong>Updated:</strong> {formatDate(result.updated_at)}
                </div>
                <div className="metadata-item">
                  <strong>Duration:</strong> {formatDuration(result.duration_minutes)}
                </div>
                <div className="metadata-item">
                  <strong>Confidence:</strong> {rcaService.formatConfidence(result.confidence)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Copy Success Message */}
      {copiedText && (
        <div className="copy-success">
          <CheckCircle size={16} />
          {copiedText} copied to clipboard
        </div>
      )}
    </div>
  )
}

export default RCAResult 