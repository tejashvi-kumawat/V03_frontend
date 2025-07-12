# RCA Frontend Integration Guide

## Overview

This guide documents the complete integration of the Root Cause Analysis (RCA) functionality into the frontend application. The integration provides a seamless user experience for conducting RCA investigations directly from the chat interface.

## 🏗️ Architecture

### Components Structure

```
FRONTEND/src/
├── types/
│   └── rca.ts                    # RCA TypeScript types
├── services/
│   └── rcaService.ts             # RCA API service
├── components/
│   ├── RCAForm/
│   │   ├── RCAForm.tsx           # RCA request form
│   │   └── RCAForm.css           # Form styles
│   ├── RCAProgress/
│   │   ├── RCAProgress.tsx       # Investigation progress
│   │   └── RCAProgress.css       # Progress styles
│   └── RCAResult/
│       ├── RCAResult.tsx         # Investigation results
│       └── RCAResult.css         # Result styles
└── pages/
    └── ChatPage/
        ├── ChatPage.tsx          # Main chat with RCA integration
        └── ChatPage.css          # Chat styles with RCA additions
```

### Data Flow

1. **User Selection**: User selects "Root Cause Analysis" mode in chat
2. **Form Configuration**: Optional detailed configuration via RCA form
3. **Investigation Start**: Backend starts RCA investigation
4. **Progress Tracking**: Real-time progress updates displayed
5. **Results Display**: Comprehensive results with findings and recommendations

## 🚀 Features

### 1. RCA Mode Integration
- **QPN Mode Selection**: RCA available as a processing mode
- **Seamless Integration**: Works within existing chat interface
- **Mode Persistence**: RCA mode saved with conversation

### 2. RCA Form Component
- **Problem Description**: Rich text input for issue description
- **Data Sources**: Multiple data source management
- **Client Configuration**: Configurable RCA client settings
- **Priority Levels**: Critical, High, Medium, Low priorities
- **Advanced Options**: Context information and metadata

### 3. RCA Progress Component
- **Real-time Updates**: Live progress tracking
- **Phase Visualization**: Current investigation phase display
- **Statistics**: Iteration count, hypotheses, tools used
- **Activity Log**: Recent investigation activities
- **Cancel Option**: Ability to cancel ongoing investigation

### 4. RCA Result Component
- **Root Cause Summary**: Identified root cause with confidence
- **Key Findings**: Detailed investigation findings
- **Recommendations**: Actionable recommendations
- **Test Results**: Hypothesis testing outcomes
- **Full Report**: Complete investigation report
- **Export Options**: PDF, JSON export capabilities

## 📋 API Integration

### RCA Service (`rcaService.ts`)

```typescript
// Key methods
await rcaService.createRequest(requestData)
await rcaService.startInvestigation(requestId)
await rcaService.pollInvestigationProgress(requestId, onProgress)
await rcaService.getResult(requestId)
await rcaService.getStats()
```

### API Endpoints

- `POST /api/rca/requests/` - Create RCA request
- `POST /api/rca/requests/{id}/start/` - Start investigation
- `GET /api/rca/requests/{id}/result/` - Get results
- `GET /api/rca/stats/` - Get RCA statistics
- `GET /api/rca/tools/` - Get available tools
- `GET /api/rca/configs/` - Get client configurations

## 🎨 UI/UX Design

### Design Principles
- **Consistent**: Matches existing chat interface design
- **Responsive**: Works on desktop and mobile devices
- **Accessible**: Follows accessibility guidelines
- **Intuitive**: Clear user flow and feedback

### Color Scheme
- **Primary**: Blue (#3b82f6) for RCA elements
- **Success**: Green (#059669) for completed states
- **Warning**: Orange (#d97706) for in-progress states
- **Error**: Red (#dc2626) for failed states

### Component States
- **Idle**: No RCA activity
- **Creating**: Request creation in progress
- **Investigating**: Active investigation
- **Completed**: Investigation finished
- **Failed**: Investigation failed

## 🔧 Configuration

### Environment Variables

```bash
# Frontend (.env)
VITE_API_BASE_URL=http://localhost:8000/api
VITE_DEBUG=true

# Backend (.env)
OPENAI_API_KEY=your_openai_api_key
RCA_TOOL_PATH=/path/to/rca/tool
```

### Client Configurations

The RCA system supports multiple client configurations:

```typescript
interface RCAClientConfig {
  client_id: string
  name: string
  description: string
  steps: number
  available: boolean
}
```

## 🧪 Testing

### Test Scripts

1. **Backend Tests**: `python test_rca_integration.py`
2. **Frontend Tests**: `node test_rca_integration.js`
3. **Manual Testing**: Browser-based test suite

### Test Coverage

- ✅ API endpoint accessibility
- ✅ Component rendering
- ✅ Service integration
- ✅ Error handling
- ✅ Progress tracking
- ✅ Result display

## 📱 Usage Guide

### For Users

1. **Start New Conversation**
   - Click "New Conversation" button
   - Select "Root Cause Analysis" mode

2. **Configure Investigation** (Optional)
   - Click "Configure RCA Investigation"
   - Fill in problem description
   - Add data sources
   - Set priority level
   - Click "Create RCA Request"

3. **Quick Start**
   - Type problem description directly in chat
   - Press Enter to start investigation

4. **Monitor Progress**
   - Watch real-time progress updates
   - View current phase and statistics
   - Cancel if needed

5. **Review Results**
   - Examine root cause identification
   - Review key findings
   - Check recommendations
   - Export or share results

### For Developers

1. **Component Usage**
```typescript
import RCAForm from './components/RCAForm/RCAForm'
import RCAProgress from './components/RCAProgress/RCAProgress'
import RCAResult from './components/RCAResult/RCAResult'

// Use in your component
<RCAForm onSubmit={handleSubmit} onCancel={handleCancel} />
```

2. **Service Integration**
```typescript
import { rcaService } from './services/rcaService'

// Create request
const request = await rcaService.createRequest(formData)

// Start investigation
const result = await rcaService.pollInvestigationProgress(
  request.id,
  (progress) => setProgress(progress)
)
```

## 🐛 Troubleshooting

### Common Issues

1. **RCA Service Not Available**
   - Check OpenAI API key configuration
   - Verify RCA tool components are installed
   - Check backend logs for errors

2. **Progress Not Updating**
   - Verify WebSocket connection
   - Check polling interval configuration
   - Review network connectivity

3. **Form Validation Errors**
   - Ensure required fields are filled
   - Check data source format
   - Verify client configuration selection

4. **Component Not Rendering**
   - Check import paths
   - Verify TypeScript compilation
   - Review console for errors

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Frontend
VITE_DEBUG=true

# Backend
DEBUG=True
```

## 🔄 State Management

### RCA State in ChatPage

```typescript
// RCA State
const [rcaInvestigationState, setRcaInvestigationState] = useState<RCAInvestigationState>(RCAInvestigationState.IDLE)
const [rcaRequest, setRcaRequest] = useState<any>(null)
const [rcaProgress, setRcaProgress] = useState<RCAProgressUpdate | null>(null)
const [rcaResult, setRcaResult] = useState<RCAResultType | null>(null)
const [rcaError, setRcaError] = useState<string | null>(null)
const [showRcaForm, setShowRcaForm] = useState(false)
```

### State Transitions

```
IDLE → CREATING_REQUEST → STARTING_INVESTIGATION → INVESTIGATING → COMPLETED
  ↓                                                                    ↓
FAILED ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
```

## 📊 Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Components loaded on demand
2. **Polling Optimization**: Configurable polling intervals
3. **Memory Management**: Cleanup of completed investigations
4. **Caching**: API response caching for repeated requests

### Monitoring

- **API Response Times**: Track endpoint performance
- **Component Render Times**: Monitor UI responsiveness
- **Memory Usage**: Watch for memory leaks
- **Error Rates**: Track failure rates

## 🔮 Future Enhancements

### Planned Features

1. **Real-time Collaboration**: Multiple users in same investigation
2. **Advanced Visualizations**: Charts and graphs for findings
3. **Template System**: Pre-configured investigation templates
4. **Integration APIs**: Connect with external tools
5. **Mobile App**: Native mobile application

### Roadmap

- **Phase 1**: Basic RCA integration ✅
- **Phase 2**: Advanced visualizations
- **Phase 3**: Collaboration features
- **Phase 4**: AI-powered insights
- **Phase 5**: Enterprise features

## 📚 Additional Resources

### Documentation
- [RCA Backend Integration Guide](../BACKEND/RCA_INTEGRATION_GUIDE.md)
- [API Documentation](http://localhost:8000/api/docs/)
- [Component Library](./src/components/)

### Support
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: Project Wiki

---

## 🎉 Conclusion

The RCA frontend integration provides a comprehensive, user-friendly interface for conducting root cause analysis investigations. The integration seamlessly combines with the existing chat interface while providing powerful RCA capabilities.

The system is designed to be:
- **User-friendly**: Intuitive interface for all skill levels
- **Scalable**: Handles multiple concurrent investigations
- **Reliable**: Robust error handling and recovery
- **Extensible**: Easy to add new features and integrations

For questions or support, please refer to the troubleshooting section or contact the development team. 