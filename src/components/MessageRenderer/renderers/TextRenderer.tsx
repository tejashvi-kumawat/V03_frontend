import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { RenderData } from '../../../types/chat'
import './TextRenderer.css'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

interface TextRendererProps {
  data: RenderData
}

const TextRenderer: React.FC<TextRendererProps> = ({ data }) => {
  if (DEBUG) {
    console.log('[DEBUG] TextRenderer - type:', data.type, 'data length:', data.data?.length)
  }

  const { data: content, options = {} } = data
  const {
    enableGFM = true,
    allowHTML = false
  } = options

  // Handle different text content types
  if (data.type === 'text') {
    return (
      <div className="text-renderer plain-text">
        <pre className="text-content">{content}</pre>
      </div>
    )
  }

  // Render markdown
  try {
    const plugins = []
    const rehypePlugins = []

    if (enableGFM) {
      plugins.push(remarkGfm)
    }

    if (allowHTML) {
      rehypePlugins.push(rehypeRaw)
    }

    return (
      <div className="text-renderer markdown">
        <ReactMarkdown
          remarkPlugins={plugins}
          rehypePlugins={rehypePlugins}
          components={{
            // Custom components for better styling
            code({ node, inline, className, children, ...props }) {
              if (inline) {
                return (
                  <code className="inline-code" {...props}>
                    {children}
                  </code>
                )
              }
              
              // For block code, we'll let CodeRenderer handle it
              const language = className?.replace('language-', '') || ''
              return (
                <div className="code-block-wrapper">
                  <pre className="code-block">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              )
            },
            
            blockquote({ children }) {
              return <blockquote className="custom-blockquote">{children}</blockquote>
            },
            
            table({ children }) {
              return (
                <div className="table-wrapper">
                  <table className="markdown-table">{children}</table>
                </div>
              )
            },
            
            a({ href, children }) {
              return (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="markdown-link"
                >
                  {children}
                </a>
              )
            },

            h1({ children }) {
              return <h1 className="markdown-h1">{children}</h1>
            },

            h2({ children }) {
              return <h2 className="markdown-h2">{children}</h2>
            },

            h3({ children }) {
              return <h3 className="markdown-h3">{children}</h3>
            },

            ul({ children }) {
              return <ul className="markdown-list">{children}</ul>
            },

            ol({ children }) {
              return <ol className="markdown-list numbered">{children}</ol>
            },

            li({ children }) {
              return <li className="markdown-list-item">{children}</li>
            },

            p({ children }) {
              return <p className="markdown-paragraph">{children}</p>
            },

            strong({ children }) {
              return <strong className="markdown-strong">{children}</strong>
            },

            em({ children }) {
              return <em className="markdown-emphasis">{children}</em>
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    )
  } catch (error) {
    if (DEBUG) {
      console.error('[DEBUG] TextRenderer error:', error)
    }
    
    return (
      <div className="text-renderer error">
        <div className="error-message">Failed to render markdown content</div>
        {DEBUG && (
          <details className="error-details">
            <summary>Error Details (Debug Mode)</summary>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </details>
        )}
        <div className="fallback-content">
          <pre>{content}</pre>
        </div>
      </div>
    )
  }
}

export default TextRenderer 