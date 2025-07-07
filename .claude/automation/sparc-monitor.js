#!/usr/bin/env node

/**
 * SPARC Methodology Update Monitor
 * Monitors documentation sources and methodology updates
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

class SparcMonitor {
  constructor(configPath, projectRoot) {
    this.configPath = configPath;
    this.projectRoot = projectRoot;
    this.config = this.loadConfig();
    this.contentCache = new Map();
    this.lastUpdate = null;
  }

  loadConfig() {
    try {
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      return config.automatedUpdateSystem;
    } catch (error) {
      console.error('Failed to load update system config:', error.message);
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      enabled: true,
      monitoring_targets: {
        documentation_sources: {}
      }
    };
  }

  async initialize() {
    if (!this.config.enabled) {
      console.log('SPARC monitoring is disabled');
      return;
    }

    console.log('🚀 Initializing SPARC Monitor...');
    
    await this.loadCache();
    
    console.log('✅ SPARC monitor initialized');
  }

  async loadCache() {
    const cachePath = path.join(this.projectRoot, 'memory', 'sparc_monitor_cache.json');
    
    try {
      if (fs.existsSync(cachePath)) {
        const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        this.contentCache = new Map(Object.entries(cacheData.contentCache || {}));
        this.lastUpdate = cacheData.lastUpdate;
        console.log(`📂 Loaded SPARC cache with ${this.contentCache.size} entries`);
      }
    } catch (error) {
      console.warn('Failed to load SPARC cache:', error.message);
    }
  }

  async saveCache() {
    const cachePath = path.join(this.projectRoot, 'memory', 'sparc_monitor_cache.json');
    
    try {
      const cacheData = {
        lastUpdate: this.lastUpdate,
        contentCache: Object.fromEntries(this.contentCache),
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      console.error('Failed to save SPARC cache:', error.message);
    }
  }

  async performWeeklyCheck() {
    console.log('🔍 Starting weekly SPARC methodology monitoring...');
    
    const results = {
      timestamp: new Date().toISOString(),
      sparc_methodology: [],
      claude_documentation: [],
      changes_detected: [],
      errors: []
    };

    try {
      // Check SPARC methodology sources
      if (this.config.monitoring_targets?.documentation_sources?.sparc_methodology) {
        const sparcResults = await this.checkSparcMethodology();
        results.sparc_methodology = sparcResults;
      }

      // Check Claude documentation
      if (this.config.monitoring_targets?.documentation_sources?.claude_documentation) {
        const claudeResults = await this.checkClaudeDocumentation();
        results.claude_documentation = claudeResults;
      }

      // Detect significant changes
      results.changes_detected = this.analyzeChanges(results);

      this.lastUpdate = new Date().toISOString();
      await this.saveCache();

      // Store results
      await this.storeResults(results);

      console.log(`✅ SPARC monitoring complete: ${results.changes_detected.length} changes detected`);
      
      return results;

    } catch (error) {
      console.error('❌ SPARC monitoring failed:', error.message);
      results.errors.push(error.message);
      throw error;
    }
  }

  async checkSparcMethodology() {
    const sparcConfig = this.config.monitoring_targets.documentation_sources.sparc_methodology;
    const results = [];

    for (const source of sparcConfig.sources || []) {
      console.log(`🔍 Checking SPARC source: ${source.url}`);
      
      try {
        const sourceResult = await this.checkDocumentationSource(source, 'sparc');
        results.push(sourceResult);
      } catch (error) {
        console.error(`Failed to check SPARC source ${source.url}:`, error.message);
        results.push({
          source: source.url,
          type: source.type,
          error: error.message,
          changes: []
        });
      }
    }

    return results;
  }

  async checkClaudeDocumentation() {
    const claudeConfig = this.config.monitoring_targets.documentation_sources.claude_documentation;
    const results = [];

    for (const source of claudeConfig.sources || []) {
      console.log(`🔍 Checking Claude docs: ${source.url}`);
      
      try {
        const sourceResult = await this.checkDocumentationSource(source, 'claude');
        results.push(sourceResult);
      } catch (error) {
        console.error(`Failed to check Claude docs ${source.url}:`, error.message);
        results.push({
          source: source.url,
          type: source.type,
          error: error.message,
          changes: []
        });
      }
    }

    return results;
  }

  async checkDocumentationSource(source, category) {
    const changes = [];
    
    if (source.type === 'github') {
      // Handle GitHub repository documentation
      const repoChanges = await this.checkGitHubDocumentation(source);
      changes.push(...repoChanges);
    } else if (source.type === 'website') {
      // Handle website documentation
      const webChanges = await this.checkWebsiteDocumentation(source);
      changes.push(...webChanges);
    }

    return {
      source: source.url,
      type: source.type,
      category,
      changes,
      checked_at: new Date().toISOString()
    };
  }

  async checkGitHubDocumentation(source) {
    const changes = [];
    
    try {
      // Extract owner/repo from GitHub URL
      const match = source.url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        throw new Error('Invalid GitHub URL format');
      }
      
      const [, owner, repo] = match;
      
      // Check README and documentation files
      const docFiles = ['README.md', 'DOCS.md', 'METHODOLOGY.md', 'SPARC.md'];
      
      for (const file of docFiles) {
        try {
          const content = await this.getGitHubFileContent(owner, repo, file);
          const change = this.detectContentChange(source.url + '/' + file, content);
          
          if (change) {
            changes.push({
              type: 'file_update',
              file: file,
              url: `${source.url}/blob/main/${file}`,
              change_type: change.type,
              significance: change.significance,
              summary: change.summary
            });
          }
        } catch (error) {
          // File might not exist, which is normal
          if (!error.message.includes('Not Found')) {
            console.warn(`Error checking ${file}:`, error.message);
          }
        }
      }
      
      // Check wiki if enabled
      if (source.watch_wiki) {
        const wikiChanges = await this.checkGitHubWiki(owner, repo);
        changes.push(...wikiChanges);
      }
      
    } catch (error) {
      console.error('Error checking GitHub documentation:', error.message);
    }
    
    return changes;
  }

  async checkWebsiteDocumentation(source) {
    const changes = [];
    
    try {
      // Fetch main page content
      const content = await this.fetchWebContent(source.url);
      const change = this.detectContentChange(source.url, content);
      
      if (change) {
        changes.push({
          type: 'page_update',
          url: source.url,
          change_type: change.type,
          significance: change.significance,
          summary: change.summary
        });
      }
      
      // Check specific sections if configured
      if (source.sections) {
        for (const section of source.sections) {
          const sectionUrl = `${source.url}/${section}`;
          
          try {
            const sectionContent = await this.fetchWebContent(sectionUrl);
            const sectionChange = this.detectContentChange(sectionUrl, sectionContent);
            
            if (sectionChange) {
              changes.push({
                type: 'section_update',
                section: section,
                url: sectionUrl,
                change_type: sectionChange.type,
                significance: sectionChange.significance,
                summary: sectionChange.summary
              });
            }
          } catch (error) {
            console.warn(`Error checking section ${section}:`, error.message);
          }
        }
      }
      
      // Check blog if enabled
      if (source.watch_blog) {
        const blogChanges = await this.checkBlog(source.url);
        changes.push(...blogChanges);
      }
      
    } catch (error) {
      console.error('Error checking website documentation:', error.message);
    }
    
    return changes;
  }

  async getGitHubFileContent(owner, repo, file) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${file}`;
    
    return new Promise((resolve, reject) => {
      const req = https.get(url, {
        headers: {
          'User-Agent': 'SPARC-Monitor/1.0',
          'Accept': 'application/vnd.github.v3+json'
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const response = JSON.parse(data);
              const content = Buffer.from(response.content, 'base64').toString('utf8');
              resolve(content);
            } catch (error) {
              reject(new Error(`Failed to parse response: ${error.message}`));
            }
          } else {
            reject(new Error(`GitHub API error: ${res.statusCode}`));
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async fetchWebContent(url) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, {
        headers: {
          'User-Agent': 'SPARC-Monitor/1.0'
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`HTTP error: ${res.statusCode}`));
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  detectContentChange(url, content) {
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');
    const cacheKey = `content_${url}`;
    const previousHash = this.contentCache.get(cacheKey);
    
    this.contentCache.set(cacheKey, contentHash);
    
    if (!previousHash) {
      // First time checking this content
      return null;
    }
    
    if (previousHash === contentHash) {
      // No change
      return null;
    }
    
    // Content has changed - analyze the change
    const changeAnalysis = this.analyzeContentChange(content, previousHash);
    
    return {
      type: 'content_modified',
      significance: changeAnalysis.significance,
      summary: changeAnalysis.summary,
      previousHash,
      currentHash: contentHash
    };
  }

  analyzeContentChange(content, previousHash) {
    // Simplified content change analysis
    // In a real implementation, you might:
    // - Compare with previous content
    // - Use diff algorithms
    // - Apply NLP for semantic analysis
    
    const wordCount = content.split(/\s+/).length;
    const keywordMatches = this.countKeywordMatches(content);
    
    let significance = 'minor';
    let summary = 'Content updated';
    
    // Determine significance based on content analysis
    if (keywordMatches.methodology > 0 || keywordMatches.breaking > 0) {
      significance = 'major';
      summary = 'Methodology or breaking changes detected';
    } else if (keywordMatches.feature > 0 || keywordMatches.enhancement > 0) {
      significance = 'moderate';
      summary = 'New features or enhancements added';
    } else if (wordCount > 1000) {
      significance = 'moderate';
      summary = 'Substantial content changes';
    }
    
    return { significance, summary };
  }

  countKeywordMatches(content) {
    const lowerContent = content.toLowerCase();
    
    return {
      methodology: (lowerContent.match(/methodology|framework|approach|process/g) || []).length,
      breaking: (lowerContent.match(/breaking|incompatible|deprecated|removed/g) || []).length,
      feature: (lowerContent.match(/feature|new|added|introduced/g) || []).length,
      enhancement: (lowerContent.match(/enhancement|improvement|optimization|upgrade/g) || []).length
    };
  }

  async checkGitHubWiki(owner, repo) {
    // GitHub wikis are separate repositories
    // This is a simplified check - full implementation would clone and compare wiki content
    const changes = [];
    
    try {
      // Check if wiki exists and has recent activity
      const wikiUrl = `https://github.com/${owner}/${repo}.wiki.git`;
      // In a real implementation, you'd clone or fetch wiki pages
      
      changes.push({
        type: 'wiki_check',
        url: `https://github.com/${owner}/${repo}/wiki`,
        note: 'Wiki monitoring requires git access for full functionality'
      });
    } catch (error) {
      console.warn('Wiki check failed:', error.message);
    }
    
    return changes;
  }

  async checkBlog(baseUrl) {
    const changes = [];
    
    try {
      // Common blog paths
      const blogPaths = ['/blog', '/news', '/updates', '/changelog'];
      
      for (const path of blogPaths) {
        try {
          const blogUrl = baseUrl + path;
          const content = await this.fetchWebContent(blogUrl);
          const change = this.detectContentChange(blogUrl, content);
          
          if (change) {
            changes.push({
              type: 'blog_update',
              url: blogUrl,
              change_type: change.type,
              significance: change.significance,
              summary: change.summary
            });
          }
        } catch (error) {
          // Blog path might not exist
        }
      }
    } catch (error) {
      console.warn('Blog check failed:', error.message);
    }
    
    return changes;
  }

  analyzeChanges(results) {
    const significantChanges = [];
    
    // Collect all changes from different sources
    const allChanges = [
      ...results.sparc_methodology.flatMap(r => r.changes || []),
      ...results.claude_documentation.flatMap(r => r.changes || [])
    ];
    
    // Filter for significant changes
    for (const change of allChanges) {
      if (change.significance === 'major' || change.significance === 'moderate') {
        significantChanges.push({
          ...change,
          category: this.categorizeChange(change),
          impact: this.assessImpact(change),
          recommendation: this.generateRecommendation(change)
        });
      }
    }
    
    return significantChanges;
  }

  categorizeChange(change) {
    const summary = (change.summary || '').toLowerCase();
    
    if (summary.includes('methodology') || summary.includes('framework')) {
      return 'methodology_update';
    } else if (summary.includes('breaking') || summary.includes('incompatible')) {
      return 'breaking_change';
    } else if (summary.includes('feature') || summary.includes('enhancement')) {
      return 'feature_addition';
    } else if (summary.includes('documentation') || summary.includes('guide')) {
      return 'documentation_update';
    } else {
      return 'general_update';
    }
  }

  assessImpact(change) {
    switch (change.category || this.categorizeChange(change)) {
      case 'methodology_update':
        return 'high';
      case 'breaking_change':
        return 'critical';
      case 'feature_addition':
        return 'medium';
      case 'documentation_update':
        return 'low';
      default:
        return 'low';
    }
  }

  generateRecommendation(change) {
    switch (change.category || this.categorizeChange(change)) {
      case 'methodology_update':
        return 'Review methodology changes and update SPARC implementation accordingly';
      case 'breaking_change':
        return 'Immediate review required - may impact existing workflows';
      case 'feature_addition':
        return 'Evaluate new features for potential integration';
      case 'documentation_update':
        return 'Review documentation updates for new best practices';
      default:
        return 'Monitor for additional changes';
    }
  }

  async storeResults(results) {
    const resultsPath = path.join(this.projectRoot, 'memory', 'sparc_monitoring_results.json');
    
    try {
      // Load existing results
      let allResults = [];
      if (fs.existsSync(resultsPath)) {
        const existingData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        allResults = existingData.results || [];
      }
      
      // Add new results
      allResults.unshift(results);
      
      // Keep only last 10 results
      allResults = allResults.slice(0, 10);
      
      // Save updated results
      fs.writeFileSync(resultsPath, JSON.stringify({
        lastUpdate: new Date().toISOString(),
        results: allResults
      }, null, 2));
      
    } catch (error) {
      console.error('Failed to store SPARC results:', error.message);
    }
  }

  getStatus() {
    return {
      enabled: this.config.enabled,
      lastUpdate: this.lastUpdate,
      cacheSize: this.contentCache.size,
      sources: {
        sparc_methodology: this.config.monitoring_targets?.documentation_sources?.sparc_methodology?.enabled || false,
        claude_documentation: this.config.monitoring_targets?.documentation_sources?.claude_documentation?.enabled || false
      }
    };
  }
}

// CLI interface
if (require.main === module) {
  const configPath = process.argv[2] || path.join(__dirname, 'update-system.json');
  const projectRoot = process.argv[3] || process.cwd();
  const monitor = new SparcMonitor(configPath, projectRoot);
  
  const command = process.argv[4] || 'check';
  
  switch (command) {
    case 'initialize':
      monitor.initialize();
      break;
    
    case 'check':
      monitor.initialize().then(() => {
        return monitor.performWeeklyCheck();
      }).then(results => {
        console.log('\n📊 SPARC Monitoring Results:');
        console.log(`SPARC Methodology: ${results.sparc_methodology.length} sources checked`);
        console.log(`Claude Documentation: ${results.claude_documentation.length} sources checked`);
        console.log(`Significant Changes: ${results.changes_detected.length} detected`);
        
        if (results.errors.length > 0) {
          console.log(`Errors: ${results.errors.length}`);
        }
      }).catch(error => {
        console.error('SPARC monitoring failed:', error.message);
        process.exit(1);
      });
      break;
    
    case 'status':
      console.log('SPARC Monitor Status:', JSON.stringify(monitor.getStatus(), null, 2));
      break;
    
    default:
      console.error('Unknown command:', command);
      console.error('Available commands: initialize, check, status');
      process.exit(1);
  }
}

module.exports = SparcMonitor;