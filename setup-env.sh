#!/bin/bash

# Frontend Environment Setup Script
# This script helps set up environment variables for the frontend application

echo "🚀 Setting up Frontend Environment Variables"
echo "============================================="

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled. .env.local was not modified."
        exit 1
    fi
fi

# Copy the example file
if [ -f "env.example" ]; then
    cp env.example .env.local
    echo "✅ Created .env.local from env.example"
else
    echo "❌ env.example not found!"
    exit 1
fi

# Ask user for backend URL
echo ""
echo "🔧 Configuration Options:"
echo "1. Default (localhost:8000)"
echo "2. Custom backend URL"
echo "3. Production URL"
read -p "Choose backend configuration (1-3): " -n 1 -r
echo

case $REPLY in
    1)
        echo "✅ Using default backend: http://localhost:8000"
        ;;
    2)
        read -p "Enter your backend URL (e.g., http://localhost:8000): " backend_url
        if [ ! -z "$backend_url" ]; then
            # Update the .env.local file
            sed -i.bak "s|VITE_BACKEND_URL=http://localhost:8000|VITE_BACKEND_URL=$backend_url|g" .env.local
            # Update WebSocket URL if it's a localhost URL
            if [[ $backend_url == *"localhost"* ]]; then
                ws_url=$(echo $backend_url | sed 's/http/ws/')
                sed -i.bak "s|VITE_WS_URL=ws://localhost:8000/ws|VITE_WS_URL=$ws_url/ws|g" .env.local
            fi
            echo "✅ Updated backend URL to: $backend_url"
        fi
        ;;
    3)
        read -p "Enter your production backend URL (e.g., https://api.yourdomain.com): " prod_url
        if [ ! -z "$prod_url" ]; then
            # Update the .env.local file
            sed -i.bak "s|VITE_BACKEND_URL=http://localhost:8000|VITE_BACKEND_URL=$prod_url|g" .env.local
            # Update WebSocket URL for production
            ws_url=$(echo $prod_url | sed 's/https/wss/')
            sed -i.bak "s|VITE_WS_URL=ws://localhost:8000/ws|VITE_WS_URL=$ws_url/ws|g" .env.local
            # Disable debug for production
            sed -i.bak "s|VITE_DEBUG=true|VITE_DEBUG=false|g" .env.local
            echo "✅ Updated for production: $prod_url"
        fi
        ;;
    *)
        echo "❌ Invalid option. Using default configuration."
        ;;
esac

# Ask about debug mode
echo ""
read -p "Enable debug mode? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    sed -i.bak "s|VITE_DEBUG=true|VITE_DEBUG=false|g" .env.local
    echo "✅ Debug mode disabled"
else
    echo "✅ Debug mode enabled"
fi

# Clean up backup files
rm -f .env.local.bak

echo ""
echo "🎉 Environment setup complete!"
echo "=============================="
echo "📁 Created: .env.local"
echo "🔧 Next steps:"
echo "   1. Review .env.local and adjust if needed"
echo "   2. Start the development server: npm run dev"
echo "   3. Make sure your backend is running"
echo ""
echo "📖 For more information, see ENVIRONMENT_SETUP.md" 