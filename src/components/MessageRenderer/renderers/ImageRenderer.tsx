import React, { useState } from 'react'
import { RenderData } from '../../../types/chat'
import { Download, Maximize2, Eye } from 'lucide-react'
import './ImageRenderer.css'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

interface ImageRendererProps {
  data: RenderData
}

interface ImageData {
  url?: string
  base64?: string
  filename?: string
  width?: number
  height?: number
  size?: number
  format?: string
}

const ImageRenderer: React.FC<ImageRendererProps> = ({ data }) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  if (DEBUG) {
    console.log('[DEBUG] ImageRenderer - data:', data.data)
  }

  const { data: imageData, options = {} } = data
  const {
    maxWidth = 600,
    maxHeight = 400,
    alt = 'Generated image'
  } = options

  const image = imageData as ImageData

  // Get image source
  const getImageSrc = (): string => {
    if (image.base64) {
      return `data:image/${image.format || 'png'};base64,${image.base64}`
    }
    return image.url || ''
  }

  // Handle image download
  const handleDownload = async () => {
    try {
      const src = getImageSrc()
      const filename = image.filename || `image.${image.format || 'png'}`
      
      if (image.base64) {
        // Download base64 image
        const link = document.createElement('a')
        link.href = src
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else if (image.url) {
        // Download from URL
        const response = await fetch(image.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        window.URL.revokeObjectURL(url)
      }
      
      if (DEBUG) {
        console.log('[DEBUG] Image downloaded:', filename)
      }
    } catch (error) {
      if (DEBUG) {
        console.error('[DEBUG] Failed to download image:', error)
      }
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    if (DEBUG) {
      console.log('[DEBUG] Image fullscreen toggled:', !isFullscreen)
    }
  }

  // Handle image load
  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
    if (DEBUG) {
      console.log('[DEBUG] Image loaded successfully')
    }
  }

  // Handle image error
  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(false)
    if (DEBUG) {
      console.error('[DEBUG] Image failed to load')
    }
  }

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size'
    
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const imageSrc = getImageSrc()

  if (!imageSrc) {
    return (
      <div className="image-renderer error">
        <div className="error-message">No image source provided</div>
      </div>
    )
  }

  try {
    return (
      <div className={`image-renderer ${isFullscreen ? 'fullscreen' : ''}`}>
        {/* Image Header */}
        <div className="image-header">
          <div className="image-info">
            <span className="image-filename">
              {image.filename || 'Generated Image'}
            </span>
            {image.width && image.height && (
              <span className="image-dimensions">
                {image.width} × {image.height}
              </span>
            )}
            {image.size && (
              <span className="image-size">
                {formatFileSize(image.size)}
              </span>
            )}
          </div>
          
          <div className="image-actions">
            <button
              onClick={toggleFullscreen}
              className="image-action-btn"
              title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
            >
              {isFullscreen ? <Eye size={16} /> : <Maximize2 size={16} />}
            </button>
            
            <button
              onClick={handleDownload}
              className="image-action-btn"
              title="Download image"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Image Content */}
        <div className="image-content">
          {!imageLoaded && !imageError && (
            <div className="image-loading">
              <div className="loading-spinner"></div>
              <span>Loading image...</span>
            </div>
          )}

          {imageError && (
            <div className="image-error">
              <div className="error-icon">⚠️</div>
              <div className="error-text">Failed to load image</div>
              {DEBUG && (
                <div className="error-src">Source: {imageSrc}</div>
              )}
            </div>
          )}

          <img
            src={imageSrc}
            alt={alt}
            className={`rendered-image ${imageLoaded ? 'loaded' : ''}`}
            style={{
              maxWidth: isFullscreen ? '100%' : maxWidth,
              maxHeight: isFullscreen ? '100%' : maxHeight,
              display: imageError ? 'none' : 'block'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>

        {/* Fullscreen overlay */}
        {isFullscreen && (
          <div className="image-fullscreen-overlay" onClick={toggleFullscreen}>
            <div className="image-fullscreen-content" onClick={(e) => e.stopPropagation()}>
              <div className="image-fullscreen-header">
                <h3>{image.filename || 'Image'}</h3>
                <button onClick={toggleFullscreen} className="close-fullscreen">×</button>
              </div>
              <div className="image-fullscreen-body">
                <img
                  src={imageSrc}
                  alt={alt}
                  className="fullscreen-image"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    if (DEBUG) {
      console.error('[DEBUG] ImageRenderer error:', error)
    }
    
    return (
      <div className="image-renderer error">
        <div className="image-header">
          <div className="image-info">Image (Error)</div>
        </div>
        
        <div className="error-message">Failed to render image</div>
        
        {DEBUG && (
          <details className="error-details">
            <summary>Error Details (Debug Mode)</summary>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </details>
        )}
        
        {/* Fallback: show image info */}
        <div className="fallback-content">
          <pre className="image-data">{JSON.stringify(image, null, 2)}</pre>
        </div>
      </div>
    )
  }
}

export default ImageRenderer 