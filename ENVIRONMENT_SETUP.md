# Frontend Environment Configuration

This guide explains how to configure environment variables for the AI Business Analytics & Intelligence frontend application.

## Quick Setup

1. **Copy the environment template:**
   ```bash
   cp env.example .env.local
   ```

2. **Edit the configuration:**
   ```bash
   nano .env.local
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Environment Variables

### API Configuration
```env
# Base API URL (relative to frontend domain)
VITE_API_BASE_URL=/api

# Backend server URL (for direct API calls)
VITE_BACKEND_URL=http://localhost:8000
```

### WebSocket Configuration
```env
# WebSocket server URL
VITE_WS_URL=ws://localhost:8000/ws

# WebSocket connection settings
VITE_WS_TIMEOUT=30000
VITE_WS_HEARTBEAT_INTERVAL=30000
VITE_WS_RECONNECT_DELAY=3000
VITE_WS_MAX_RECONNECT_ATTEMPTS=5
```

### Development Settings
```env
# Enable debug logging
VITE_DEBUG=true

# Node environment
NODE_ENV=development
```

### Application Configuration
```env
# Application metadata
VITE_APP_TITLE=AI Business Analytics & Intelligence
VITE_APP_VERSION=1.0.0
```

### Feature Flags
```env
# Enable/disable features
VITE_ENABLE_RCA=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_FILE_MANAGER=true
VITE_ENABLE_MCP_TOOLS=true
```

### Authentication Settings
```env
# Token expiry times (in minutes)
VITE_AUTH_TOKEN_EXPIRY=15
VITE_REFRESH_TOKEN_EXPIRY=10080
```

### Request Timeouts
```env
# API request timeout (milliseconds)
VITE_API_TIMEOUT=12000000

# WebSocket timeout (milliseconds)
VITE_WS_TIMEOUT=30000
```

### File Upload Settings
```env
# Maximum file size (bytes) - 100MB
VITE_MAX_FILE_SIZE=104857600

# Allowed file extensions
VITE_ALLOWED_FILE_TYPES=.csv,.json,.txt,.log,.py,.sql,.xlsx,.xls
```

### RCA Configuration
```env
# Maximum iterations for RCA analysis
VITE_RCA_MAX_ITERATIONS=10

# RCA timeout (milliseconds) - 5 minutes
VITE_RCA_TIMEOUT=300000
```

### Notification Settings
```env
# Notification display timeout (milliseconds)
VITE_NOTIFICATION_TIMEOUT=10000

# Enable notification sounds
VITE_NOTIFICATION_SOUND_ENABLED=false
```

## Environment-Specific Configurations

### Development
```env
VITE_DEBUG=true
NODE_ENV=development
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

### Production
```env
VITE_DEBUG=false
NODE_ENV=production
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=https://your-backend-domain.com
VITE_WS_URL=wss://your-backend-domain.com/ws
```

### Staging
```env
VITE_DEBUG=true
NODE_ENV=staging
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=https://staging.your-domain.com
VITE_WS_URL=wss://staging.your-domain.com/ws
```

## Vite Configuration

The application uses Vite's proxy configuration for development:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
      }
    }
  }
})
```

## Environment Variable Usage

### In TypeScript/JavaScript
```typescript
// Access environment variables
const apiUrl = import.meta.env.VITE_API_BASE_URL
const debug = import.meta.env.VITE_DEBUG === 'true'
const backendUrl = import.meta.env.VITE_BACKEND_URL
```

### Type Safety
For better TypeScript support, you can extend the `ImportMetaEnv` interface:

```typescript
// vite-env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_DEBUG: string
  readonly VITE_BACKEND_URL: string
  // ... other variables
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

## Troubleshooting

### Environment Variables Not Loading
1. Ensure the file is named `.env.local` (not `.env`)
2. Restart the development server after changes
3. Check that variables start with `VITE_`

### API Connection Issues
1. Verify `VITE_BACKEND_URL` is correct
2. Check that the backend server is running
3. Ensure CORS is properly configured on the backend

### WebSocket Connection Issues
1. Verify `VITE_WS_URL` is correct
2. Check that the backend supports WebSocket connections
3. Ensure the WebSocket endpoint is accessible

### Build Issues
1. Ensure all required environment variables are set
2. Check for TypeScript errors in environment variable usage
3. Verify that the build process can access the environment file

## Security Notes

- Never commit `.env.local` to version control
- Use different configurations for different environments
- Keep sensitive information in backend environment variables
- Use HTTPS/WSS in production environments

## File Structure

```
FRONTEND/
├── .env.local          # Local environment variables (not in git)
├── env.example         # Environment template (in git)
├── vite.config.ts      # Vite configuration
└── src/
    ├── services/
    │   ├── apiClient.ts
    │   ├── websocketService.ts
    │   └── rcaService.ts
    └── ...
``` 