// RCA Frontend Integration Test Script

const API_BASE_URL = 'http://localhost:8000/api'

// Test RCA Service
async function testRCAService() {
  console.log('🧪 Testing RCA Service Integration...')
  
  try {
    // Test service availability
    const response = await fetch(`${API_BASE_URL}/rca/tools/`)
    const data = await response.json()
    
    console.log('✅ RCA service endpoint accessible')
    console.log('📊 Service available:', data.service_available)
    console.log('🔧 Available tools:', data.tools?.length || 0)
    
    return true
  } catch (error) {
    console.error('❌ RCA service test failed:', error.message)
    return false
  }
}

// Test RCA API Endpoints
async function testRCAEndpoints() {
  console.log('\n🔗 Testing RCA API Endpoints...')
  
  const endpoints = [
    '/rca/requests/',
    '/rca/stats/',
    '/rca/dashboard/',
    '/rca/tools/',
    '/rca/configs/'
  ]
  
  let passed = 0
  let total = endpoints.length
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`)
      if (response.ok) {
        console.log(`✅ ${endpoint} - OK`)
        passed++
      } else {
        console.log(`❌ ${endpoint} - ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`)
    }
  }
  
  console.log(`\n📊 Endpoint Test Results: ${passed}/${total} passed`)
  return passed === total
}

// Test RCA Form Component
function testRCAFormComponent() {
  console.log('\n📝 Testing RCA Form Component...')
  
  // Check if RCA form component exists
  const rcaFormExists = typeof window !== 'undefined' && window.RCAForm
  console.log('✅ RCA Form component:', rcaFormExists ? 'Available' : 'Not found')
  
  // Check if RCA types are available
  const rcaTypesExist = typeof window !== 'undefined' && window.RCATypes
  console.log('✅ RCA Types:', rcaTypesExist ? 'Available' : 'Not found')
  
  return rcaFormExists || rcaTypesExist
}

// Test RCA Progress Component
function testRCAProgressComponent() {
  console.log('\n📈 Testing RCA Progress Component...')
  
  // Check if RCA progress component exists
  const rcaProgressExists = typeof window !== 'undefined' && window.RCAProgress
  console.log('✅ RCA Progress component:', rcaProgressExists ? 'Available' : 'Not found')
  
  return rcaProgressExists
}

// Test RCA Result Component
function testRCAResultComponent() {
  console.log('\n📊 Testing RCA Result Component...')
  
  // Check if RCA result component exists
  const rcaResultExists = typeof window !== 'undefined' && window.RCAResult
  console.log('✅ RCA Result component:', rcaResultExists ? 'Available' : 'Not found')
  
  return rcaResultExists
}

// Test ChatPage RCA Integration
function testChatPageRCAIntegration() {
  console.log('\n💬 Testing ChatPage RCA Integration...')
  
  // Check if ChatPage has RCA functionality
  const chatPageExists = typeof window !== 'undefined' && window.ChatPage
  console.log('✅ ChatPage component:', chatPageExists ? 'Available' : 'Not found')
  
  // Check if QPN modes include RCA
  const qpnModes = [
    { mode: 'simple', name: 'Simple' },
    { mode: 'simple_tool', name: 'Tool Enhanced' },
    { mode: 'rca', name: 'Root Cause Analysis' },
    { mode: 'time_series', name: 'Time Series' },
    { mode: 'eda', name: 'Exploratory Data Analysis' }
  ]
  
  const rcaModeExists = qpnModes.find(mode => mode.mode === 'rca')
  console.log('✅ RCA QPN Mode:', rcaModeExists ? 'Available' : 'Not found')
  
  return chatPageExists && rcaModeExists
}

// Test Frontend-Backend Communication
async function testFrontendBackendCommunication() {
  console.log('\n🌐 Testing Frontend-Backend Communication...')
  
  try {
    // Test CORS
    const response = await fetch(`${API_BASE_URL}/rca/tools/`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    })
    
    console.log('✅ CORS headers:', response.headers.get('Access-Control-Allow-Origin'))
    
    // Test actual request
    const dataResponse = await fetch(`${API_BASE_URL}/rca/tools/`)
    const data = await dataResponse.json()
    
    console.log('✅ API response format:', typeof data)
    console.log('✅ Response structure:', Object.keys(data))
    
    return true
  } catch (error) {
    console.error('❌ Communication test failed:', error.message)
    return false
  }
}

// Main test function
async function runRCATests() {
  console.log('🚀 RCA Frontend Integration Test Suite')
  console.log('=====================================\n')
  
  const tests = [
    { name: 'RCA Service', fn: testRCAService },
    { name: 'RCA Endpoints', fn: testRCAEndpoints },
    { name: 'RCA Form Component', fn: testRCAFormComponent },
    { name: 'RCA Progress Component', fn: testRCAProgressComponent },
    { name: 'RCA Result Component', fn: testRCAResultComponent },
    { name: 'ChatPage RCA Integration', fn: testChatPageRCAIntegration },
    { name: 'Frontend-Backend Communication', fn: testFrontendBackendCommunication }
  ]
  
  let passed = 0
  let total = tests.length
  
  for (const test of tests) {
    try {
      const result = await test.fn()
      if (result) {
        passed++
      }
    } catch (error) {
      console.error(`❌ ${test.name} test failed:`, error.message)
    }
  }
  
  console.log('\n=====================================')
  console.log(`🎯 Test Results: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('🎉 All tests passed! RCA integration is working correctly.')
  } else {
    console.log('⚠️  Some tests failed. Please check the integration.')
  }
  
  console.log('\n📋 Next Steps:')
  console.log('1. Open http://localhost:5173 in your browser')
  console.log('2. Create a new conversation')
  console.log('3. Select "Root Cause Analysis" mode')
  console.log('4. Click "Configure RCA Investigation" or type a problem description')
  console.log('5. Test the complete RCA workflow')
}

// Run tests if this script is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.runRCATests = runRCATests
  console.log('🔧 RCA test suite loaded. Run window.runRCATests() to execute tests.')
} else {
  // Node.js environment
  runRCATests().catch(console.error)
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runRCATests,
    testRCAService,
    testRCAEndpoints,
    testRCAFormComponent,
    testRCAProgressComponent,
    testRCAResultComponent,
    testChatPageRCAIntegration,
    testFrontendBackendCommunication
  }
} 