import React, { useState } from 'react'
import Plot from 'react-plotly.js'
import { Line, Bar, Pie, Scatter } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { RenderData, ChartData } from '../../../types/chat'
import { useTheme } from '../../../contexts/ThemeContext'
import { Download, Maximize2 } from 'lucide-react'
import './ChartRenderer.css'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

interface ChartRendererProps {
  data: RenderData
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ data }) => {
  const { theme } = useTheme()
  const [isFullscreen, setIsFullscreen] = useState(false)

  if (DEBUG) {
    console.log('[DEBUG] ChartRenderer - type:', data.options?.chartType, 'library:', (data.data as ChartData)?.type)
  }

  const { data: chartData, options = {} } = data
  const {
    chartType = 'line',
    interactive = true,
    width = 600,
    height = 400
  } = options

  const chart = chartData as ChartData

  // Handle chart download
  const handleDownload = async () => {
    try {
      if (DEBUG) {
        console.log('[DEBUG] Chart download requested')
      }
      // Implementation for chart download would go here
      // This would depend on the chart library being used
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to download chart:', error)
      }
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    if (DEBUG) {
      console.log('[DEBUG] Chart fullscreen toggled:', !isFullscreen)
    }
  }

  // Get chart colors based on theme
  const getThemeColors = () => {
    if (theme === 'dark') {
      return {
        background: '#1F2937',
        text: '#F9FAFB',
        grid: '#374151',
        accent: '#3B82F6'
      }
    } else {
      return {
        background: '#FFFFFF',
        text: '#111827',
        grid: '#E5E7EB',
        accent: '#3B82F6'
      }
    }
  }

  // Render Plotly chart
  const renderPlotlyChart = () => {
    const colors = getThemeColors()
    
    const plotlyLayout = {
      ...chart.layout,
      paper_bgcolor: colors.background,
      plot_bgcolor: colors.background,
      font: {
        color: colors.text,
        ...chart.layout?.font
      },
      xaxis: {
        gridcolor: colors.grid,
        ...chart.layout?.xaxis
      },
      yaxis: {
        gridcolor: colors.grid,
        ...chart.layout?.yaxis
      },
      width: isFullscreen ? undefined : width,
      height: isFullscreen ? undefined : height,
      autosize: isFullscreen
    }

    const plotlyConfig = {
      displayModeBar: interactive,
      responsive: true,
      ...chart.config
    }

    return (
      <Plot
        data={chart.data}
        layout={plotlyLayout}
        config={plotlyConfig}
        style={{ width: '100%', height: '100%' }}
      />
    )
  }

  // Render Chart.js chart
  const renderChartJSChart = () => {
    const colors = getThemeColors()
    
    const chartJSOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: colors.text
          }
        },
        tooltip: {
          backgroundColor: colors.background,
          titleColor: colors.text,
          bodyColor: colors.text,
          borderColor: colors.grid,
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: {
            color: colors.grid
          },
          ticks: {
            color: colors.text
          }
        },
        y: {
          grid: {
            color: colors.grid
          },
          ticks: {
            color: colors.text
          }
        }
      },
      ...chart.data.options
    }

    const chartComponent = {
      line: Line,
      bar: Bar,
      pie: Pie,
      scatter: Scatter
    }[chartType] || Line

    const ChartComponent = chartComponent

    return (
      <ChartComponent
        data={chart.data}
        options={chartJSOptions}
      />
    )
  }

  try {
    return (
      <div className={`chart-renderer ${isFullscreen ? 'fullscreen' : ''}`}>
        {/* Chart Header */}
        <div className="chart-header">
          <div className="chart-title">
            {chart.layout?.title?.text || `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`}
          </div>
          
          <div className="chart-actions">
            <button
              onClick={toggleFullscreen}
              className="chart-action-btn"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              <Maximize2 size={16} />
            </button>
            
            <button
              onClick={handleDownload}
              className="chart-action-btn"
              title="Download chart"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Chart Content */}
        <div className="chart-content">
          {chart.type === 'plotly' ? renderPlotlyChart() : renderChartJSChart()}
        </div>

        {/* Fullscreen overlay */}
        {isFullscreen && (
          <div className="chart-fullscreen-overlay" onClick={toggleFullscreen}>
            <div className="chart-fullscreen-content" onClick={(e) => e.stopPropagation()}>
              <div className="chart-fullscreen-header">
                <h3>{chart.layout?.title?.text || 'Chart'}</h3>
                <button onClick={toggleFullscreen} className="close-fullscreen">×</button>
              </div>
              <div className="chart-fullscreen-body">
                {chart.type === 'plotly' ? renderPlotlyChart() : renderChartJSChart()}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    if (DEBUG) {
      console.error('[DEBUG] ChartRenderer error:', error)
    }
    
    return (
      <div className="chart-renderer error">
        <div className="chart-header">
          <div className="chart-title">Chart (Error)</div>
        </div>
        
        <div className="error-message">Failed to render chart</div>
        
        {DEBUG && (
          <details className="error-details">
            <summary>Error Details (Debug Mode)</summary>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </details>
        )}
        
        {/* Fallback: show chart data */}
        <div className="fallback-content">
          <pre className="chart-data">{JSON.stringify(chart, null, 2)}</pre>
        </div>
      </div>
    )
  }
}

export default ChartRenderer 