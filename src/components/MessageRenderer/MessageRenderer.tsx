import React from 'react'
import { RenderData } from '../../types/chat'
import TextRenderer from './renderers/TextRenderer'
import CodeRenderer from './renderers/CodeRenderer'
import MathRenderer from './renderers/MathRenderer'
import ChartRenderer from './renderers/ChartRenderer'
import TableRenderer from './renderers/TableRenderer'
import ImageRenderer from './renderers/ImageRenderer'
import './MessageRenderer.css'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

/**
 * Abstract base class for all message renderers.
 * Provides common interface and functionality for different content types.
 */
export abstract class RendererBase {
  abstract type: string
  abstract canRender(data: RenderData): boolean
  abstract render(data: RenderData, options?: any): React.ReactElement
  
  protected logDebug(message: string) {
    if (DEBUG) {
      console.log(`[DEBUG] ${this.type}Renderer: ${message}`)
    }
  }
  
  protected handleError(error: any, fallback?: React.ReactElement): React.ReactElement {
    this.logDebug(`Error rendering: ${error.message}`)
    return fallback || <div className="render-error">Failed to render {this.type} content</div>
  }
}

interface MessageRendererProps {
  content: string
  renderData?: RenderData[]
  className?: string
}

const MessageRenderer: React.FC<MessageRendererProps> = ({ 
  content, 
  renderData = [], 
  className = '' 
}) => {
  if (DEBUG) {
    console.log('[DEBUG] MessageRenderer - content length:', content.length, 'renderData items:', renderData.length)
  }

  // If no render data, just render as text/markdown
  if (renderData.length === 0) {
    return (
      <div className={`message-renderer ${className}`}>
        <TextRenderer data={{ type: 'markdown', data: content }} />
      </div>
    )
  }

  return (
    <div className={`message-renderer ${className}`}>
      {/* Render main content */}
      {content && (
        <div className="message-content">
          <TextRenderer data={{ type: 'markdown', data: content }} />
        </div>
      )}
      
      {/* Render additional data items */}
      {renderData.map((item, index) => (
        <div key={index} className="render-item">
          {renderItem(item)}
        </div>
      ))}
    </div>
  )
}

/**
 * Render a single data item based on its type
 */
const renderItem = (data: RenderData): React.ReactElement => {
  try {
    switch (data.type) {
      case 'text':
      case 'markdown':
        return <TextRenderer data={data} />
      
      case 'code':
        return <CodeRenderer data={data} />
      
      case 'math':
        return <MathRenderer data={data} />
      
      case 'chart':
        return <ChartRenderer data={data} />
      
      case 'table':
        return <TableRenderer data={data} />
      
      case 'image':
        return <ImageRenderer data={data} />
      
      default:
        if (DEBUG) {
          console.warn(`[DEBUG] Unknown render type: ${data.type}`)
        }
        return <TextRenderer data={{ type: 'text', data: JSON.stringify(data) }} />
    }
  } catch (error) {
    if (DEBUG) {
      console.error('[DEBUG] MessageRenderer error:', error)
    }
    return (
      <div className="render-error">
        <span>Failed to render {data.type} content</span>
        {DEBUG && <pre>{JSON.stringify(error, null, 2)}</pre>}
      </div>
    )
  }
}

export default MessageRenderer 