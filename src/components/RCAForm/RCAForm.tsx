import React, { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  FileText, 
  Info, 
  Loader2, 
  Plus, 
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { RCAFormData, RCAClientConfig } from '../../types/rca'
import { rcaService } from '../../services/rcaService'
import './RCAForm.css'

interface RCAFormProps {
  onSubmit: (formData: RCAFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  initialData?: Partial<RCAFormData>
}

const RCAForm: React.FC<RCAFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData
}) => {
  const [formData, setFormData] = useState<RCAFormData>({
    problem_description: '',
    data_sources: [],
    context_info: '',
    priority: 'medium',
    client_id: 'demo',
    metadata: {}
  })

  const [clientConfigs, setClientConfigs] = useState<RCAClientConfig[]>([])
  const [configLoadError, setConfigLoadError] = useState<string | null>(null)
  const [newDataSource, setNewDataSource] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isExpanded, setIsExpanded] = useState(false)
  const [loadingConfigs, setLoadingConfigs] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }))
    }
    loadClientConfigs()
  }, [initialData])

  const loadClientConfigs = async () => {
    try {
      setLoadingConfigs(true)
      setConfigLoadError(null)
      const configs = await rcaService.getClientConfigs()
      setClientConfigs(Array.isArray(configs) ? configs : [])
    } catch (error) {
      setConfigLoadError('Failed to load client configurations. Please try again later.')
      setClientConfigs([])
    } finally {
      setLoadingConfigs(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.problem_description.trim()) {
      newErrors.problem_description = 'Problem description is required'
    }

    if (formData.data_sources.length === 0) {
      newErrors.data_sources = 'At least one data source is required'
    }

    if (!formData.client_id) {
      newErrors.client_id = 'Client configuration is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleInputChange = (field: keyof RCAFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addDataSource = () => {
    if (newDataSource.trim() && !formData.data_sources.includes(newDataSource.trim())) {
      setFormData(prev => ({
        ...prev,
        data_sources: [...prev.data_sources, newDataSource.trim()]
      }))
      setNewDataSource('')
    }
  }

  const removeDataSource = (index: number) => {
    setFormData(prev => ({
      ...prev,
      data_sources: prev.data_sources.filter((_, i) => i !== index)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addDataSource()
    }
  }

  return (
    <div className="rca-form-container">
      <div className="rca-form-header">
        <h2>Root Cause Analysis Request</h2>
        <p>Create a new RCA investigation to analyze and identify the root cause of a problem</p>
      </div>

      <form onSubmit={handleSubmit} className="rca-form">
        {/* Problem Description */}
        <div className="form-group">
          <label htmlFor="problem_description" className="form-label">
            Problem Description *
          </label>
          <textarea
            id="problem_description"
            value={formData.problem_description}
            onChange={(e) => handleInputChange('problem_description', e.target.value)}
            placeholder="Describe the problem or issue you want to investigate..."
            className={`form-textarea ${errors.problem_description ? 'error' : ''}`}
            rows={4}
            disabled={isLoading}
          />
          {errors.problem_description && (
            <div className="error-message">
              <AlertTriangle size={16} />
              {errors.problem_description}
            </div>
          )}
        </div>

        {/* Client Configuration */}
        <div className="form-group">
          <label htmlFor="client_id" className="form-label">
            Client Configuration *
          </label>
          <select
            id="client_id"
            value={formData.client_id}
            onChange={(e) => handleInputChange('client_id', e.target.value)}
            className={`form-select ${errors.client_id ? 'error' : ''}`}
            disabled={isLoading || loadingConfigs || !!configLoadError}
          >
            <option value="">Select a client configuration</option>
            {(clientConfigs || []).map(config => (
              <option key={config.client_id} value={config.client_id}>
                {config.name} - {config.description}
              </option>
            ))}
          </select>
          {loadingConfigs && (
            <div className="loading-indicator">
              <Loader2 size={16} className="spinner" />
              Loading configurations...
            </div>
          )}
          {configLoadError && (
            <div className="error-message" style={{ color: 'red', marginTop: 8, fontWeight: 'bold' }}>
              <AlertTriangle size={16} style={{ marginRight: 4 }} />
              {configLoadError}
            </div>
          )}
          {errors.client_id && !configLoadError && (
            <div className="error-message">
              <AlertTriangle size={16} />
              {errors.client_id}
            </div>
          )}
        </div>

        {/* Data Sources */}
        <div className="form-group">
          <label className="form-label">
            Data Sources *
          </label>
          <div className="data-sources-input">
            <input
              type="text"
              value={newDataSource}
              onChange={(e) => setNewDataSource(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter data source (e.g., file path, database, API endpoint)"
              className="form-input"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={addDataSource}
              className="btn btn-secondary btn-sm"
              disabled={isLoading || !newDataSource.trim()}
            >
              <Plus size={16} />
            </button>
          </div>
          
          {formData.data_sources.length > 0 && (
            <div className="data-sources-list">
              {formData.data_sources.map((source, index) => (
                <div key={index} className="data-source-item">
                  <FileText size={16} />
                  <span className="data-source-text">{source}</span>
                  <button
                    type="button"
                    onClick={() => removeDataSource(index)}
                    className="btn btn-icon btn-sm"
                    disabled={isLoading}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {errors.data_sources && (
            <div className="error-message">
              <AlertTriangle size={16} />
              {errors.data_sources}
            </div>
          )}
        </div>

        {/* Priority */}
        <div className="form-group">
          <label htmlFor="priority" className="form-label">
            Priority
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value)}
            className="form-select"
            disabled={isLoading}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Advanced Options */}
        <div className="advanced-section">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="advanced-toggle"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Advanced Options
          </button>
          
          {isExpanded && (
            <div className="advanced-content">
              {/* Context Information */}
              <div className="form-group">
                <label htmlFor="context_info" className="form-label">
                  Additional Context
                </label>
                <textarea
                  id="context_info"
                  value={formData.context_info}
                  onChange={(e) => handleInputChange('context_info', e.target.value)}
                  placeholder="Provide additional context, background information, or constraints..."
                  className="form-textarea"
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              {/* Metadata */}
              <div className="form-group">
                <label className="form-label">
                  Custom Metadata
                </label>
                <div className="metadata-info">
                  <Info size={16} />
                  <span>Add custom key-value pairs for additional context</span>
                </div>
                <textarea
                  value={JSON.stringify(formData.metadata, null, 2)}
                  onChange={(e) => {
                    try {
                      const metadata = JSON.parse(e.target.value)
                      handleInputChange('metadata', metadata)
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='{"key": "value"}'
                  className="form-textarea"
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !!configLoadError || loadingConfigs}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spinner" />
                Creating Request...
              </>
            ) : (
              'Create RCA Request'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default RCAForm 