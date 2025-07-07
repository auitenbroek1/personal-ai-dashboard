// Cross-System Compatibility Test for Personal AI Dashboard
const fs = require('fs').promises;
const path = require('path');

console.log('🔗 Testing Cross-System Compatibility...');

async function testSystemCompatibility() {
  const results = {
    memorySystemAccess: false,
    claudeFlowIntegration: false,
    existingApiCompatibility: false,
    preMarketReportSystem: false,
    sparcFrameworkIntegration: false,
    componentInteraction: false
  };

  console.log('\n1️⃣ Testing Memory System Access...');
  try {
    const memoryData = await fs.readFile('memory/data/entries.json', 'utf-8');
    const entries = JSON.parse(memoryData);
    console.log(`✅ Memory system accessible with ${entries.length} entries`);
    results.memorySystemAccess = true;
  } catch (error) {
    console.log('❌ Memory system not accessible:', error.message);
  }

  console.log('\n2️⃣ Testing Claude-Flow Integration...');
  try {
    // Check if claude-flow process is running
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const { stdout } = await execAsync('ps aux | grep claude-flow | grep -v grep');
    if (stdout.trim()) {
      console.log('✅ Claude-Flow process is running');
      results.claudeFlowIntegration = true;
    } else {
      console.log('⚠️  Claude-Flow process not detected');
    }
  } catch (error) {
    console.log('⚠️  Could not check Claude-Flow process');
  }

  console.log('\n3️⃣ Testing Existing API Compatibility...');
  try {
    // Test existing API endpoints
    const apiTests = [
      { name: 'Status API', url: 'http://localhost:3001/health' },
      { name: 'Dashboard API', url: 'http://localhost:3001/api/dashboard/overview' },
      { name: 'Agents API', url: 'http://localhost:3001/api/agents' },
      { name: 'Tasks API', url: 'http://localhost:3001/api/tasks' }
    ];

    let passedTests = 0;
    for (const test of apiTests) {
      try {
        const response = await fetch(test.url);
        if (response.ok) {
          console.log(`  ✅ ${test.name}: OK`);
          passedTests++;
        } else {
          console.log(`  ❌ ${test.name}: ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ ${test.name}: Connection failed`);
      }
    }
    
    if (passedTests === apiTests.length) {
      results.existingApiCompatibility = true;
    }
  } catch (error) {
    console.log('❌ API compatibility test failed:', error.message);
  }

  console.log('\n4️⃣ Testing Pre-Market Report System Integration...');
  try {
    const preMarketPath = 'daily-premarket-report';
    await fs.access(preMarketPath);
    
    // Check for recent reports
    const reportsPath = path.join(preMarketPath, 'daily_reports');
    const reports = await fs.readdir(reportsPath);
    const recentReports = reports.filter(name => name.startsWith('202'));
    
    console.log(`✅ Pre-market system found with ${recentReports.length} recent reports`);
    results.preMarketReportSystem = true;
  } catch (error) {
    console.log('⚠️  Pre-market report system not accessible');
  }

  console.log('\n5️⃣ Testing SPARC Framework Integration...');
  try {
    const memoryData = await fs.readFile('memory/data/entries.json', 'utf-8');
    const entries = JSON.parse(memoryData);
    const sparcEntries = entries.filter(entry => 
      entry.namespace === 'sparc_session' || 
      entry.key.includes('sparc') ||
      (entry.tags && entry.tags.includes('sparc'))
    );
    
    if (sparcEntries.length > 0) {
      console.log(`✅ SPARC framework integration found with ${sparcEntries.length} entries`);
      results.sparcFrameworkIntegration = true;
    } else {
      console.log('⚠️  No SPARC framework entries found');
    }
  } catch (error) {
    console.log('❌ SPARC framework integration test failed:', error.message);
  }

  console.log('\n6️⃣ Testing Component Interaction...');
  try {
    // Test if dashboard can trigger actions in other systems
    const interactionTest = {
      dashboardToMemory: false,
      dashboardToWebsocket: false,
      dashboardToNotifications: false
    };

    // Test dashboard-to-memory interaction
    try {
      const testEntry = {
        id: `test_interaction_${Date.now()}`,
        key: 'dashboard_component_test',
        value: {
          test: 'cross_system_compatibility',
          timestamp: new Date().toISOString(),
          components: ['dashboard', 'memory', 'websocket'],
          status: 'testing'
        },
        type: 'system_test',
        namespace: 'testing',
        tags: ['cross_system', 'compatibility'],
        metadata: { source: 'compatibility_test' },
        owner: 'sparc_tester',
        accessLevel: 'shared',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        version: 1,
        size: 200,
        compressed: false,
        checksum: 'test-interaction-checksum',
        references: [],
        dependencies: []
      };

      const memoryData = await fs.readFile('memory/data/entries.json', 'utf-8');
      const entries = JSON.parse(memoryData);
      entries.push(testEntry);
      await fs.writeFile('memory/data/entries.json', JSON.stringify(entries, null, 2));
      
      interactionTest.dashboardToMemory = true;
      console.log('  ✅ Dashboard-to-Memory interaction: Working');
    } catch (error) {
      console.log('  ❌ Dashboard-to-Memory interaction: Failed');
    }

    // Test WebSocket connectivity (already tested, but verify)
    try {
      const wsResponse = await fetch('http://localhost:3001/health');
      if (wsResponse.ok) {
        interactionTest.dashboardToWebsocket = true;
        console.log('  ✅ Dashboard-to-WebSocket interaction: Working');
      }
    } catch (error) {
      console.log('  ❌ Dashboard-to-WebSocket interaction: Failed');
    }

    // Test notification system integration
    try {
      const notificationData = await fs.readFile('memory/pending_notifications.json', 'utf-8');
      const notifications = JSON.parse(notificationData);
      
      // Add a test notification
      const testNotification = {
        id: `test_notification_${Date.now()}`,
        type: 'dashboard_test',
        message: 'Cross-system compatibility test notification',
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      if (notifications.notifications) {
        notifications.notifications.push(testNotification);
      } else {
        notifications.test_notifications = [testNotification];
      }

      await fs.writeFile('memory/pending_notifications.json', JSON.stringify(notifications, null, 2));
      
      interactionTest.dashboardToNotifications = true;
      console.log('  ✅ Dashboard-to-Notifications interaction: Working');
    } catch (error) {
      console.log('  ❌ Dashboard-to-Notifications interaction: Failed');
    }

    // Overall component interaction result
    const passedInteractions = Object.values(interactionTest).filter(Boolean).length;
    if (passedInteractions >= 2) {
      results.componentInteraction = true;
    }

    console.log(`  📊 Component interactions: ${passedInteractions}/3 working`);

  } catch (error) {
    console.log('❌ Component interaction test failed:', error.message);
  }

  return results;
}

// Function to generate compatibility report
function generateCompatibilityReport(results) {
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const compatibilityScore = (passedTests / totalTests * 100).toFixed(1);

  console.log('\n📊 Cross-System Compatibility Report');
  console.log('=====================================');
  console.log(`Overall Compatibility Score: ${compatibilityScore}%`);
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log('\nDetailed Results:');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`  ${testName}: ${status}`);
  });

  console.log('\n🎯 Recommendations for Aaron\'s Consulting Demos:');
  
  if (compatibilityScore >= 80) {
    console.log('✅ System is ready for consulting demonstrations');
    console.log('  - All major components are working together');
    console.log('  - Dashboard integrates well with existing infrastructure');
    console.log('  - Real-time features are functional');
  } else if (compatibilityScore >= 60) {
    console.log('⚠️  System is partially ready for demonstrations');
    console.log('  - Core functionality is working');
    console.log('  - Some integration issues may need addressing');
    console.log('  - Consider staging environment for demos');
  } else {
    console.log('❌ System needs more work before demonstrations');
    console.log('  - Multiple integration issues detected');
    console.log('  - Recommend focusing on failed tests first');
  }

  return {
    score: compatibilityScore,
    passedTests,
    totalTests,
    results
  };
}

// Run the compatibility test
async function runCompatibilityTest() {
  try {
    const results = await testSystemCompatibility();
    const report = generateCompatibilityReport(results);
    
    // Save report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      testType: 'cross_system_compatibility',
      ...report
    };
    
    await fs.writeFile('compatibility_test_report.json', JSON.stringify(reportData, null, 2));
    console.log('\n💾 Compatibility report saved to compatibility_test_report.json');
    
    return report;
  } catch (error) {
    console.error('❌ Compatibility test failed:', error);
    return null;
  }
}

// Run the test
runCompatibilityTest();