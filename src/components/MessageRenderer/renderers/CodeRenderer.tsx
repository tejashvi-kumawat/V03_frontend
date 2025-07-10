import React, { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from '../../../contexts/ThemeContext'
import { RenderData } from '../../../types/chat'
import { Copy, Check, Download } from 'lucide-react'
import './CodeRenderer.css'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

interface CodeRendererProps {
  data: RenderData
}

const CodeRenderer: React.FC<CodeRendererProps> = ({ data }) => {
  const { theme } = useTheme()
  const [copied, setCopied] = useState(false)

  if (DEBUG) {
    console.log('[DEBUG] CodeRenderer - language:', data.options?.language, 'data length:', data.data?.length)
  }

  const { data: code, options = {} } = data
  const {
    language = 'text',
    showLineNumbers = true,
    highlightLines = []
  } = options

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      
      if (DEBUG) {
        console.log('[DEBUG] Code copied to clipboard')
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to copy code:', error)
      }
    }
  }

  // Handle download
  const handleDownload = () => {
    try {
      const fileExtension = getFileExtension(language)
      const filename = `code_snippet.${fileExtension}`
      const blob = new Blob([code], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      if (DEBUG) {
        console.log('[DEBUG] Code downloaded as:', filename)
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to download code:', error)
      }
    }
  }

  // Get file extension based on language
  const getFileExtension = (lang: string): string => {
    const extensions: { [key: string]: string } = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'cs',
      php: 'php',
      ruby: 'rb',
      go: 'go',
      rust: 'rs',
      sql: 'sql',
      json: 'json',
      yaml: 'yml',
      xml: 'xml',
      html: 'html',
      css: 'css',
      scss: 'scss',
      bash: 'sh',
      shell: 'sh',
      dockerfile: 'dockerfile',
      markdown: 'md'
    }
    return extensions[lang.toLowerCase()] || 'txt'
  }

  // Get syntax highlighting style based on theme
  const getStyle = () => {
    return theme === 'dark' ? vscDarkPlus : vs
  }

  // Get language display name
  const getLanguageDisplayName = (lang: string): string => {
    const names: { [key: string]: string } = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      csharp: 'C#',
      php: 'PHP',
      ruby: 'Ruby',
      go: 'Go',
      rust: 'Rust',
      sql: 'SQL',
      json: 'JSON',
      yaml: 'YAML',
      xml: 'XML',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      bash: 'Bash',
      shell: 'Shell',
      dockerfile: 'Dockerfile',
      markdown: 'Markdown'
    }
    return names[lang.toLowerCase()] || lang.toUpperCase()
  }

  try {
    return (
      <div className="code-renderer">
        {/* Code Header */}
        <div className="code-header">
          <div className="code-language">
            {getLanguageDisplayName(language)}
          </div>
          
          <div className="code-actions">
            <button
              onClick={handleCopy}
              className="code-action-btn"
              title="Copy code"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            
            <button
              onClick={handleDownload}
              className="code-action-btn"
              title="Download code"
            >
              <Download size={16} />
              Download
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="code-content">
          <SyntaxHighlighter
            language={language}
            style={getStyle()}
            showLineNumbers={showLineNumbers}
            wrapLines={true}
            wrapLongLines={true}
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              borderRadius: '0 0 8px 8px'
            }}
            lineNumberStyle={{
              minWidth: '3em',
              paddingRight: '1em',
              color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
              fontSize: '0.8rem'
            }}
            lineProps={(lineNumber) => {
              const style: React.CSSProperties = {}
              
              // Highlight specific lines if specified
              if (highlightLines.includes(lineNumber)) {
                style.backgroundColor = theme === 'dark' 
                  ? 'rgba(59, 130, 246, 0.1)' 
                  : 'rgba(59, 130, 246, 0.05)'
                style.display = 'block'
                style.marginLeft = '-1rem'
                style.paddingLeft = '1rem'
                style.marginRight = '-1rem'
                style.paddingRight = '1rem'
              }
              
              return { style }
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>
    )
  } catch (error) {
    if (DEBUG) {
      console.error('[DEBUG] CodeRenderer error:', error)
    }
    
    return (
      <div className="code-renderer error">
        <div className="code-header">
          <div className="code-language">Code (Error)</div>
        </div>
        
        <div className="error-message">Failed to render code with syntax highlighting</div>
        
        {DEBUG && (
          <details className="error-details">
            <summary>Error Details (Debug Mode)</summary>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </details>
        )}
        
        {/* Fallback: plain text */}
        <div className="fallback-content">
          <pre className="plain-code">{code}</pre>
        </div>
      </div>
    )
  }
}

export default CodeRenderer 