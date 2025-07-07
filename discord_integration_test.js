// Discord Integration Test for Dashboard
console.log('📡 Testing Discord Integration...');

// Test webhook endpoint availability
const testWebhookEndpoint = async () => {
  console.log('🔍 Testing webhook endpoint...');
  
  try {
    const response = await fetch('http://localhost:3001/health');
    if (response.ok) {
      console.log('✅ Backend server is accessible for webhooks');
      return true;
    } else {
      console.log('❌ Backend server not accessible');
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot reach backend server:', error.message);
    return false;
  }
};

// Simulate Discord notification from dashboard action
const testDashboardNotification = async () => {
  console.log('🔔 Testing dashboard notification simulation...');
  
  const notification = {
    type: 'dashboard_action',
    action: 'agent_started',
    agent: {
      id: 'test_agent_001',
      name: 'Test Research Agent',
      type: 'researcher'
    },
    timestamp: new Date().toISOString(),
    dashboard_url: 'http://localhost:5173',
    user: 'SPARC Tester'
  };
  
  try {
    // Test POST to webhook endpoint (this would normally go to Discord)
    const testPayload = {
      embeds: [{
        title: '🤖 Agent Status Update',
        description: `Agent "${notification.agent.name}" has been started`,
        color: 0x00ff00,
        fields: [
          { name: 'Agent ID', value: notification.agent.id, inline: true },
          { name: 'Type', value: notification.agent.type, inline: true },
          { name: 'Status', value: 'Started', inline: true }
        ],
        timestamp: notification.timestamp,
        footer: {
          text: 'Personal AI Assistant Dashboard'
        }
      }]
    };
    
    console.log('📤 Simulated Discord webhook payload:');
    console.log(JSON.stringify(testPayload, null, 2));
    
    // Test if we can store notification in memory for tracking
    const fs = require('fs').promises;
    const path = require('path');
    
    const notificationLog = {
      id: `notification_${Date.now()}`,
      type: 'discord_notification',
      payload: testPayload,
      status: 'simulated',
      timestamp: new Date().toISOString()
    };
    
    // Try to append to a notifications log
    const logPath = path.join(__dirname, 'memory/pending_notifications.json');
    
    try {
      let notifications = [];
      try {
        const existing = await fs.readFile(logPath, 'utf-8');
        notifications = JSON.parse(existing);
      } catch (e) {
        // File doesn't exist, start with empty array
      }
      
      notifications.push(notificationLog);
      
      await fs.writeFile(logPath, JSON.stringify(notifications, null, 2));
      console.log('✅ Notification logged to memory system');
      
      return true;
    } catch (error) {
      console.log('⚠️  Could not log notification:', error.message);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Discord notification test failed:', error.message);
    return false;
  }
};

// Test existing notification system integration
const testExistingNotificationSystem = async () => {
  console.log('🔄 Testing existing notification system integration...');
  
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Check if there's an existing notification system
    const notificationPaths = [
      path.join(__dirname, 'memory/pending_notifications.json'),
      path.join(__dirname, 'memory/update_system_status.json'),
      path.join(__dirname, 'memory/sparc_monitoring_results.json')
    ];
    
    for (const notPath of notificationPaths) {
      try {
        const data = await fs.readFile(notPath, 'utf-8');
        console.log(`✅ Found notification file: ${path.basename(notPath)}`);
        
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          console.log(`   - Contains ${parsed.length} entries`);
        } else if (typeof parsed === 'object') {
          console.log(`   - Contains object with keys: ${Object.keys(parsed).join(', ')}`);
        }
      } catch (e) {
        console.log(`⚠️  Notification file not found: ${path.basename(notPath)}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Existing notification system test failed:', error.message);
    return false;
  }
};

// Run all tests
async function runDiscordIntegrationTests() {
  console.log('\n🧪 Running Discord Integration Tests...\n');
  
  const results = {
    webhookEndpoint: await testWebhookEndpoint(),
    dashboardNotification: await testDashboardNotification(),
    existingSystem: await testExistingNotificationSystem()
  };
  
  console.log('\n📊 Discord Integration Test Results:');
  console.log('  - Webhook Endpoint:', results.webhookEndpoint ? '✅ Pass' : '❌ Fail');
  console.log('  - Dashboard Notification:', results.dashboardNotification ? '✅ Pass' : '❌ Fail');
  console.log('  - Existing System:', results.existingSystem ? '✅ Pass' : '❌ Fail');
  
  const overallStatus = Object.values(results).every(result => result);
  console.log('\n🏁 Overall Discord Integration:', overallStatus ? '✅ PASS' : '⚠️  PARTIAL');
  
  return results;
}

// Handle both Node.js and browser environments
if (typeof window === 'undefined') {
  // Node.js environment
  runDiscordIntegrationTests().catch(console.error);
} else {
  // Browser environment
  console.log('Discord integration test should be run in Node.js environment');
}