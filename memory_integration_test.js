const fs = require('fs').promises;
const path = require('path');

async function testMemoryIntegration() {
  console.log('🧠 Testing Memory System Integration...');
  
  try {
    // Test reading existing memory entries
    const memoryPath = path.join(__dirname, 'memory/data/entries.json');
    const memoryData = await fs.readFile(memoryPath, 'utf-8');
    const entries = JSON.parse(memoryData);
    
    console.log(`✅ Memory file found with ${entries.length} entries`);
    
    // Check for SPARC coordination data
    const sparcEntries = entries.filter(entry => 
      entry.namespace === 'sparc_session' || 
      entry.key.includes('sparc') ||
      entry.tags?.includes('sparc')
    );
    
    console.log(`📊 Found ${sparcEntries.length} SPARC-related entries`);
    
    // Check for dashboard architecture data
    const dashboardEntries = entries.filter(entry => 
      entry.key.includes('dashboard') ||
      entry.type === 'dashboard_state'
    );
    
    console.log(`📊 Found ${dashboardEntries.length} dashboard-related entries`);
    
    // Test memory statistics
    const stats = {
      totalEntries: entries.length,
      entriesByType: {},
      entriesByNamespace: {},
      lastUpdate: null
    };
    
    entries.forEach(entry => {
      stats.entriesByType[entry.type] = (stats.entriesByType[entry.type] || 0) + 1;
      stats.entriesByNamespace[entry.namespace] = (stats.entriesByNamespace[entry.namespace] || 0) + 1;
      
      const entryDate = new Date(entry.updatedAt || entry.createdAt);
      if (!stats.lastUpdate || entryDate > stats.lastUpdate) {
        stats.lastUpdate = entryDate;
      }
    });
    
    console.log('📈 Memory Statistics:');
    console.log('  - Total entries:', stats.totalEntries);
    console.log('  - Types:', Object.keys(stats.entriesByType));
    console.log('  - Namespaces:', Object.keys(stats.entriesByNamespace));
    console.log('  - Last update:', stats.lastUpdate?.toISOString());
    
    // Test writing a new dashboard entry
    const dashboardEntry = {
      id: `entry_dashboard_test_${Date.now()}`,
      key: 'dashboard_integration_test',
      value: {
        testTimestamp: new Date().toISOString(),
        frontendConnected: true,
        backendConnected: true,
        websocketConnected: true,
        memoryIntegrated: true
      },
      type: 'dashboard_test',
      namespace: 'dashboard',
      tags: ['test', 'integration', 'dashboard'],
      metadata: { source: 'sparc_tester' },
      owner: 'sparc_tester',
      accessLevel: 'shared',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      version: 1,
      size: JSON.stringify({}).length,
      compressed: false,
      checksum: 'test-checksum',
      references: [],
      dependencies: []
    };
    
    entries.push(dashboardEntry);
    
    // Write back to file
    await fs.writeFile(memoryPath, JSON.stringify(entries, null, 2));
    console.log('✅ Successfully wrote test entry to memory system');
    
    // Test reading the backup system
    const backupDir = path.join(__dirname, 'memory/backups');
    try {
      const backupFiles = await fs.readdir(backupDir);
      console.log(`💾 Found ${backupFiles.length} backup files`);
    } catch (error) {
      console.log('⚠️  Backup directory not accessible');
    }
    
    return {
      success: true,
      stats,
      sparcEntries: sparcEntries.length,
      dashboardEntries: dashboardEntries.length + 1,
      testEntryAdded: true
    };
    
  } catch (error) {
    console.error('❌ Memory integration test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testMemoryIntegration()
  .then(result => {
    console.log('\n🏁 Memory Integration Test Results:');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
  });