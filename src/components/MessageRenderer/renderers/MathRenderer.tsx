import React from 'react'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'
import { RenderData } from '../../../types/chat'
import './MathRenderer.css'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

interface MathRendererProps {
  data: RenderData
}

const MathRenderer: React.FC<MathRendererProps> = ({ data }) => {
  if (DEBUG) {
    console.log('[DEBUG] MathRenderer - displayMode:', data.options?.displayMode, 'data:', data.data)
  }

  const { data: mathExpression, options = {} } = data
  const { displayMode = false } = options

  try {
    // Clean the math expression
    const cleanExpression = mathExpression.trim()
    
    if (!cleanExpression) {
      return (
        <div className="math-renderer empty">
          <span className="empty-message">Empty math expression</span>
        </div>
      )
    }

    return (
      <div className="math-renderer">
        {displayMode ? (
          <div className="math-block">
            <BlockMath math={cleanExpression} />
          </div>
        ) : (
          <span className="math-inline">
            <InlineMath math={cleanExpression} />
          </span>
        )}
      </div>
    )
  } catch (error) {
    if (DEBUG) {
      console.error('[DEBUG] MathRenderer error:', error)
    }
    
    return (
      <div className="math-renderer error">
        <div className="error-message">
          Failed to render mathematical expression
        </div>
        
        {DEBUG && (
          <details className="error-details">
            <summary>Error Details (Debug Mode)</summary>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </details>
        )}
        
        {/* Fallback: show raw LaTeX */}
        <div className="fallback-content">
          <code className="raw-latex">
            {displayMode ? `$$${mathExpression}$$` : `$${mathExpression}$`}
          </code>
        </div>
      </div>
    )
  }
}

export default MathRenderer 