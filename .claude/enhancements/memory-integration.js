#!/usr/bin/env node

/**
 * Memory Integration for Claude-Flow
 * Integrates memory optimization with existing claude-flow Memory tool
 */

const fs = require('fs');
const path = require('path');
const MemoryOptimizer = require('./memory-optimization.js');

class MemoryIntegration {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.memoryPath = path.join(projectRoot, 'memory');
    this.optimizerConfigPath = path.join(__dirname, 'memory-optimization.json');
    this.optimizer = new MemoryOptimizer(this.optimizerConfigPath);
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    console.log('🚀 Initializing Memory Integration...');
    
    // Ensure memory directory exists
    if (!fs.existsSync(this.memoryPath)) {
      fs.mkdirSync(this.memoryPath, { recursive: true });
    }
    
    // Initialize optimizer
    await this.optimizer.initialize();
    
    // Set up memory monitoring
    this.setupMemoryMonitoring();
    
    // Create integration endpoints
    this.setupIntegrationEndpoints();
    
    this.initialized = true;
    console.log('✅ Memory integration initialized');
  }

  setupMemoryMonitoring() {
    // Watch memory directory for changes
    if (fs.existsSync(this.memoryPath)) {
      fs.watch(this.memoryPath, { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith('.json')) {
          this.handleMemoryChange(eventType, filename);
        }
      });
    }
  }

  async handleMemoryChange(eventType, filename) {
    const filePath = path.join(this.memoryPath, filename);
    
    if (eventType === 'change' && fs.existsSync(filePath)) {
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        await this.indexMemoryEntry(filename, content);
      } catch (error) {
        console.error(`Error indexing memory entry ${filename}:`, error.message);
      }
    }
  }

  async indexMemoryEntry(filename, content) {
    // Index the memory entry for optimized search
    const key = filename.replace('.json', '');
    
    // Add to various indexes based on content type
    if (content.entries) {
      // This is a memory store file
      for (const entry of content.entries) {
        await this.indexEntry(entry);
      }
    } else {
      // This is a single entry
      await this.indexEntry({ key, value: content });
    }
  }

  async indexEntry(entry) {
    // Index entry in all relevant indexes
    const indexes = this.optimizer.indexes;
    
    if (indexes.has('text')) {
      await indexes.get('text').addEntry(entry);
    }
    
    if (indexes.has('semantic')) {
      await indexes.get('semantic').addEntry(entry);
    }
    
    if (indexes.has('categorical')) {
      await indexes.get('categorical').addEntry(entry);
    }
    
    if (indexes.has('temporal')) {
      await indexes.get('temporal').addEntry(entry);
    }
  }

  setupIntegrationEndpoints() {
    // Create enhanced memory functions
    this.enhancedMemory = {
      search: this.enhancedSearch.bind(this),
      store: this.enhancedStore.bind(this),
      get: this.enhancedGet.bind(this),
      optimize: this.optimize.bind(this),
      stats: this.getStats.bind(this)
    };
  }

  async enhancedSearch(query, options = {}) {
    if (!this.initialized) await this.initialize();
    
    console.log(`🔍 Enhanced memory search: "${query}"`);
    
    // Use optimizer for search
    const results = await this.optimizer.search(query, {
      ...options,
      type: options.type || 'hybrid',
      limit: options.limit || 20
    });
    
    return {
      query,
      results,
      optimization: {
        indexed: true,
        searchTime: Date.now(),
        resultCount: results.length,
        engines: this.optimizer.searchEngines.size
      }
    };
  }

  async enhancedStore(key, value, options = {}) {
    if (!this.initialized) await this.initialize();
    
    console.log(`💾 Enhanced memory store: "${key}"`);
    
    // Store in regular memory system
    const memoryFile = path.join(this.memoryPath, `${key}.json`);
    const entry = {
      key,
      value,
      timestamp: new Date().toISOString(),
      namespace: options.namespace || 'default',
      tags: options.tags || [],
      metadata: options.metadata || {}
    };
    
    fs.writeFileSync(memoryFile, JSON.stringify(entry, null, 2));
    
    // Index for optimization
    await this.indexEntry(entry);
    
    return {
      stored: true,
      key,
      indexed: true,
      optimization: {
        searchable: true,
        indexed: true
      }
    };
  }

  async enhancedGet(key, options = {}) {
    if (!this.initialized) await this.initialize();
    
    console.log(`📖 Enhanced memory get: "${key}"`);
    
    // Try optimized search first
    const searchResults = await this.enhancedSearch(key, { 
      type: 'exact',
      limit: 1 
    });
    
    if (searchResults.results.length > 0) {
      return {
        found: true,
        key,
        value: searchResults.results[0].value,
        optimization: {
          searchUsed: true,
          indexed: true
        }
      };
    }
    
    // Fallback to direct file access
    const memoryFile = path.join(this.memoryPath, `${key}.json`);
    if (fs.existsSync(memoryFile)) {
      const content = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
      return {
        found: true,
        key,
        value: content.value,
        optimization: {
          searchUsed: false,
          indexed: false
        }
      };
    }
    
    return {
      found: false,
      key,
      optimization: {
        searchUsed: true,
        indexed: true
      }
    };
  }

  async optimize(options = {}) {
    if (!this.initialized) await this.initialize();
    
    console.log('⚡ Running memory optimization...');
    
    const stats = this.optimizer.getStats();
    
    // Rebuild indexes if needed
    if (options.rebuildIndexes) {
      await this.optimizer.rebuildIndexes();
    }
    
    // Run compaction if needed
    if (options.compact) {
      await this.optimizer.performCompaction(this.optimizer.config.features.optimization.autoCompaction);
    }
    
    // Run deduplication if needed
    if (options.deduplicate) {
      await this.optimizer.performDeduplication(this.optimizer.config.features.optimization.deduplication);
    }
    
    return {
      optimization: 'completed',
      stats: this.optimizer.getStats(),
      improvements: {
        indexesRebuilt: options.rebuildIndexes || false,
        compactionRun: options.compact || false,
        deduplicationRun: options.deduplicate || false
      }
    };
  }

  getStats() {
    return {
      integration: {
        initialized: this.initialized,
        memoryPath: this.memoryPath,
        optimizerEnabled: this.optimizer.config.enabled
      },
      optimization: this.optimizer.getStats(),
      features: {
        indexing: this.optimizer.config.features.indexing.enabled,
        search: this.optimizer.config.features.search.enabled,
        optimization: this.optimizer.config.features.optimization.enabled
      }
    };
  }

  // Export for use in claude-flow
  getEnhancedMemoryTool() {
    return this.enhancedMemory;
  }
}

// CLI interface
if (require.main === module) {
  const projectRoot = process.argv[2] || process.cwd();
  const integration = new MemoryIntegration(projectRoot);
  
  const command = process.argv[3] || 'initialize';
  
  switch (command) {
    case 'initialize':
      integration.initialize();
      break;
    
    case 'search':
      const query = process.argv[4];
      if (!query) {
        console.error('Usage: node memory-integration.js <project> search <query>');
        process.exit(1);
      }
      integration.enhancedSearch(query).then(results => {
        console.log('Enhanced Search Results:', JSON.stringify(results, null, 2));
      });
      break;
    
    case 'store':
      const key = process.argv[4];
      const value = process.argv[5];
      if (!key || !value) {
        console.error('Usage: node memory-integration.js <project> store <key> <value>');
        process.exit(1);
      }
      integration.enhancedStore(key, value).then(result => {
        console.log('Enhanced Store Result:', JSON.stringify(result, null, 2));
      });
      break;
    
    case 'get':
      const getKey = process.argv[4];
      if (!getKey) {
        console.error('Usage: node memory-integration.js <project> get <key>');
        process.exit(1);
      }
      integration.enhancedGet(getKey).then(result => {
        console.log('Enhanced Get Result:', JSON.stringify(result, null, 2));
      });
      break;
    
    case 'optimize':
      integration.optimize({
        rebuildIndexes: process.argv.includes('--rebuild-indexes'),
        compact: process.argv.includes('--compact'),
        deduplicate: process.argv.includes('--deduplicate')
      }).then(result => {
        console.log('Optimization Result:', JSON.stringify(result, null, 2));
      });
      break;
    
    case 'stats':
      console.log('Memory Integration Stats:', JSON.stringify(integration.getStats(), null, 2));
      break;
    
    default:
      console.error('Unknown command:', command);
      console.error('Available commands: initialize, search, store, get, optimize, stats');
      process.exit(1);
  }
}

module.exports = MemoryIntegration;