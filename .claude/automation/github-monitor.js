#!/usr/bin/env node

/**
 * GitHub Monitoring System for Claude-Flow Updates
 * Monitors repositories, releases, and gists for updates
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

class GitHubMonitor {
  constructor(configPath, projectRoot) {
    this.configPath = configPath;
    this.projectRoot = projectRoot;
    this.config = this.loadConfig();
    this.cache = new Map();
    this.lastUpdate = null;
    this.apiRateLimit = {
      remaining: 60,
      reset: Date.now() + 3600000 // 1 hour
    };
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
        github_repositories: {},
        github_gists: {}
      }
    };
  }

  async initialize() {
    if (!this.config.enabled) {
      console.log('GitHub monitoring is disabled');
      return;
    }

    console.log('🚀 Initializing GitHub Monitor...');
    
    await this.loadCache();
    await this.checkApiRateLimit();
    
    console.log('✅ GitHub monitor initialized');
  }

  async loadCache() {
    const cachePath = path.join(this.projectRoot, 'memory', 'github_monitor_cache.json');
    
    try {
      if (fs.existsSync(cachePath)) {
        const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        this.cache = new Map(Object.entries(cacheData.cache || {}));
        this.lastUpdate = cacheData.lastUpdate;
        console.log(`📂 Loaded cache with ${this.cache.size} entries`);
      }
    } catch (error) {
      console.warn('Failed to load cache:', error.message);
    }
  }

  async saveCache() {
    const cachePath = path.join(this.projectRoot, 'memory', 'github_monitor_cache.json');
    
    try {
      const cacheData = {
        lastUpdate: this.lastUpdate,
        cache: Object.fromEntries(this.cache),
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      console.error('Failed to save cache:', error.message);
    }
  }

  async checkApiRateLimit() {
    try {
      const response = await this.makeGitHubRequest('/rate_limit');
      
      if (response.rate) {
        this.apiRateLimit = {
          remaining: response.rate.remaining,
          reset: response.rate.reset * 1000 // Convert to milliseconds
        };
        
        console.log(`📊 API Rate Limit: ${this.apiRateLimit.remaining} requests remaining`);
      }
    } catch (error) {
      console.warn('Could not check API rate limit:', error.message);
    }
  }

  async performWeeklyCheck() {
    console.log('🔍 Starting weekly GitHub monitoring check...');
    
    const results = {
      timestamp: new Date().toISOString(),
      repositories: [],
      gists: [],
      discoveries: [],
      errors: []
    };

    try {
      // Check repositories
      if (this.config.monitoring_targets?.github_repositories) {
        const repoResults = await this.checkRepositories();
        results.repositories = repoResults;
      }

      // Check gists
      if (this.config.monitoring_targets?.github_gists) {
        const gistResults = await this.checkGists();
        results.gists = gistResults;
      }

      // Auto-discover new repositories
      const discoveries = await this.discoverNewRepositories();
      results.discoveries = discoveries;

      this.lastUpdate = new Date().toISOString();
      await this.saveCache();

      // Store results
      await this.storeResults(results);

      console.log(`✅ GitHub monitoring complete: ${results.repositories.length} repos, ${results.gists.length} gists checked`);
      
      return results;

    } catch (error) {
      console.error('❌ GitHub monitoring failed:', error.message);
      results.errors.push(error.message);
      throw error;
    }
  }

  async checkRepositories() {
    const repoConfig = this.config.monitoring_targets.github_repositories;
    const results = [];

    // Check claude-flow repository
    if (repoConfig.claude_flow?.enabled) {
      console.log('🔍 Checking claude-flow repository...');
      
      try {
        const repoResult = await this.checkRepository(
          repoConfig.claude_flow.owner,
          repoConfig.claude_flow.repo,
          repoConfig.claude_flow
        );
        results.push(repoResult);
      } catch (error) {
        console.error('Failed to check claude-flow repo:', error.message);
        results.push({
          repo: 'claude-flow',
          error: error.message,
          updates: []
        });
      }
    }

    // Check Reuven's repositories
    if (repoConfig.reuven_repositories?.enabled) {
      console.log('🔍 Checking Reuven Cohen repositories...');
      
      try {
        const reuvenResults = await this.checkUserRepositories(
          'reuvencohen',
          repoConfig.reuven_repositories
        );
        results.push(...reuvenResults);
      } catch (error) {
        console.error('Failed to check Reuven repositories:', error.message);
      }
    }

    return results;
  }

  async checkRepository(owner, repo, config) {
    const repoKey = `${owner}/${repo}`;
    const updates = [];

    // Check releases
    if (config.watch_releases) {
      const releases = await this.getRepositoryReleases(owner, repo);
      const newReleases = this.filterNewItems(releases, `${repoKey}_releases`);
      
      for (const release of newReleases) {
        updates.push({
          type: 'release',
          title: release.name || release.tag_name,
          version: release.tag_name,
          url: release.html_url,
          published_at: release.published_at,
          description: release.body,
          prerelease: release.prerelease,
          severity: release.prerelease ? 'minor' : 'major'
        });
      }
    }

    // Check commits
    if (config.watch_commits) {
      const commits = await this.getRepositoryCommits(owner, repo, config.branches || ['main']);
      const newCommits = this.filterNewItems(commits, `${repoKey}_commits`);
      
      for (const commit of newCommits) {
        if (this.matchesKeywords(commit.commit.message, config.filters?.keywords)) {
          updates.push({
            type: 'commit',
            title: commit.commit.message.split('\n')[0],
            sha: commit.sha,
            url: commit.html_url,
            author: commit.commit.author.name,
            date: commit.commit.author.date,
            description: commit.commit.message,
            severity: 'minor'
          });
        }
      }
    }

    // Check pull requests
    if (config.watch_pull_requests) {
      const pullRequests = await this.getRepositoryPullRequests(owner, repo);
      const newPRs = this.filterNewItems(pullRequests, `${repoKey}_prs`);
      
      for (const pr of newPRs) {
        if (this.matchesKeywords(pr.title + ' ' + pr.body, config.filters?.keywords)) {
          updates.push({
            type: 'pull_request',
            title: pr.title,
            number: pr.number,
            url: pr.html_url,
            author: pr.user.login,
            created_at: pr.created_at,
            description: pr.body,
            state: pr.state,
            severity: 'minor'
          });
        }
      }
    }

    return {
      repo: repoKey,
      updates,
      checked_at: new Date().toISOString()
    };
  }

  async checkUserRepositories(username, config) {
    const results = [];
    
    try {
      const repos = await this.getUserRepositories(username);
      
      for (const repo of repos) {
        // Filter by keywords and criteria
        if (this.matchesRepositoryFilters(repo, config.filters)) {
          const repoResult = await this.checkRepository(repo.owner.login, repo.name, {
            watch_releases: true,
            watch_commits: false,
            watch_pull_requests: false,
            filters: config.filters
          });
          
          if (repoResult.updates.length > 0) {
            results.push(repoResult);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to check repositories for ${username}:`, error.message);
    }
    
    return results;
  }

  async checkGists() {
    const gistConfig = this.config.monitoring_targets.github_gists;
    const results = [];

    // Check Reuven's gists
    if (gistConfig.reuven_gists?.enabled) {
      console.log('🔍 Checking Reuven Cohen gists...');
      
      try {
        const gistResult = await this.checkUserGists(
          gistConfig.reuven_gists.username,
          gistConfig.reuven_gists
        );
        results.push(gistResult);
      } catch (error) {
        console.error('Failed to check Reuven gists:', error.message);
        results.push({
          user: 'reuvencohen',
          error: error.message,
          updates: []
        });
      }
    }

    // Check community gists
    if (gistConfig.community_gists?.enabled) {
      console.log('🔍 Checking community gists...');
      
      try {
        const communityResult = await this.searchGists(gistConfig.community_gists);
        results.push(communityResult);
      } catch (error) {
        console.error('Failed to check community gists:', error.message);
      }
    }

    return results;
  }

  async checkUserGists(username, config) {
    const gists = await this.getUserGists(username);
    const newGists = this.filterNewItems(gists, `${username}_gists`);
    const updates = [];

    for (const gist of newGists) {
      if (this.matchesGistFilters(gist, config.filters)) {
        updates.push({
          type: 'gist',
          id: gist.id,
          title: gist.description || 'Untitled Gist',
          url: gist.html_url,
          created_at: gist.created_at,
          updated_at: gist.updated_at,
          files: Object.keys(gist.files),
          public: gist.public,
          severity: 'minor'
        });
      }
    }

    return {
      user: username,
      updates,
      checked_at: new Date().toISOString()
    };
  }

  async searchGists(config) {
    // GitHub doesn't provide a direct gist search API, so we'll simulate it
    // In a real implementation, you might use a third-party service or scraping
    const updates = [];
    
    return {
      type: 'search',
      query: config.search_query,
      updates,
      checked_at: new Date().toISOString()
    };
  }

  async discoverNewRepositories() {
    const discoveries = [];
    
    try {
      // Search for new repositories related to claude-flow and SPARC
      const searchQueries = [
        'claude-flow',
        'sparc methodology',
        'ai-agent workflow',
        'anthropic claude tools'
      ];

      for (const query of searchQueries) {
        const results = await this.searchRepositories(query);
        
        for (const repo of results.slice(0, 5)) { // Limit to top 5 per query
          if (this.isNewDiscovery(repo)) {
            discoveries.push({
              type: 'repository',
              name: repo.full_name,
              description: repo.description,
              url: repo.html_url,
              stars: repo.stargazers_count,
              language: repo.language,
              updated_at: repo.updated_at,
              discovery_query: query
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to discover new repositories:', error.message);
    }

    return discoveries;
  }

  // GitHub API methods
  async makeGitHubRequest(endpoint, options = {}) {
    if (this.apiRateLimit.remaining <= 1 && Date.now() < this.apiRateLimit.reset) {
      const waitTime = this.apiRateLimit.reset - Date.now();
      console.log(`⏳ Rate limit reached, waiting ${Math.round(waitTime / 60000)} minutes...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    const url = `https://api.github.com${endpoint}`;
    
    return new Promise((resolve, reject) => {
      const req = https.get(url, {
        headers: {
          'User-Agent': 'Claude-Flow-Update-Monitor/1.0',
          'Accept': 'application/vnd.github.v3+json',
          ...options.headers
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          // Update rate limit info
          if (res.headers['x-ratelimit-remaining']) {
            this.apiRateLimit.remaining = parseInt(res.headers['x-ratelimit-remaining']);
            this.apiRateLimit.reset = parseInt(res.headers['x-ratelimit-reset']) * 1000;
          }
          
          try {
            const parsed = JSON.parse(data);
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`GitHub API error: ${res.statusCode} - ${parsed.message}`));
            }
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${error.message}`));
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

  async getRepositoryReleases(owner, repo) {
    return await this.makeGitHubRequest(`/repos/${owner}/${repo}/releases`);
  }

  async getRepositoryCommits(owner, repo, branches = ['main']) {
    const commits = [];
    
    for (const branch of branches) {
      try {
        const branchCommits = await this.makeGitHubRequest(
          `/repos/${owner}/${repo}/commits?sha=${branch}&per_page=20`
        );
        commits.push(...branchCommits);
      } catch (error) {
        console.warn(`Failed to get commits for branch ${branch}:`, error.message);
      }
    }
    
    return commits;
  }

  async getRepositoryPullRequests(owner, repo) {
    return await this.makeGitHubRequest(`/repos/${owner}/${repo}/pulls?state=open&per_page=20`);
  }

  async getUserRepositories(username) {
    return await this.makeGitHubRequest(`/users/${username}/repos?per_page=50&sort=updated`);
  }

  async getUserGists(username) {
    return await this.makeGitHubRequest(`/users/${username}/gists?per_page=50`);
  }

  async searchRepositories(query) {
    const response = await this.makeGitHubRequest(`/search/repositories?q=${encodeURIComponent(query)}&sort=updated&per_page=20`);
    return response.items || [];
  }

  // Filtering and matching methods
  filterNewItems(items, cacheKey) {
    const lastUpdate = this.lastUpdate ? new Date(this.lastUpdate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const cachedIds = this.cache.get(cacheKey) || new Set();
    const newItems = [];
    const currentIds = new Set();

    for (const item of items) {
      const id = item.id || item.sha || item.number;
      currentIds.add(id);
      
      if (!cachedIds.has(id)) {
        const itemDate = new Date(item.created_at || item.published_at || item.updated_at);
        if (itemDate > lastUpdate) {
          newItems.push(item);
        }
      }
    }

    this.cache.set(cacheKey, currentIds);
    return newItems;
  }

  matchesKeywords(text, keywords) {
    if (!keywords || keywords.length === 0) return true;
    if (!text) return false;
    
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  matchesRepositoryFilters(repo, filters) {
    if (!filters) return true;
    
    // Check keywords
    if (filters.keywords) {
      const searchText = `${repo.name} ${repo.description || ''}`.toLowerCase();
      if (!filters.keywords.some(keyword => searchText.includes(keyword.toLowerCase()))) {
        return false;
      }
    }
    
    // Check minimum stars
    if (filters.min_stars && repo.stargazers_count < filters.min_stars) {
      return false;
    }
    
    // Check update recency
    if (filters.updated_within) {
      const daysAgo = parseInt(filters.updated_within.replace('d', ''));
      const cutoff = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const updatedAt = new Date(repo.updated_at);
      
      if (updatedAt < cutoff) {
        return false;
      }
    }
    
    return true;
  }

  matchesGistFilters(gist, filters) {
    if (!filters) return true;
    
    // Check keywords
    if (filters.keywords) {
      const searchText = (gist.description || '').toLowerCase();
      if (!filters.keywords.some(keyword => searchText.includes(keyword.toLowerCase()))) {
        return false;
      }
    }
    
    // Check file extensions
    if (filters.file_extensions) {
      const gistExtensions = Object.keys(gist.files).map(filename => 
        path.extname(filename).toLowerCase()
      );
      
      if (!filters.file_extensions.some(ext => gistExtensions.includes(ext))) {
        return false;
      }
    }
    
    // Check update recency
    if (filters.updated_within) {
      const daysAgo = parseInt(filters.updated_within.replace('d', ''));
      const cutoff = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const updatedAt = new Date(gist.updated_at);
      
      if (updatedAt < cutoff) {
        return false;
      }
    }
    
    return true;
  }

  isNewDiscovery(repo) {
    const discoveryKey = 'discovered_repos';
    const discovered = this.cache.get(discoveryKey) || new Set();
    
    if (discovered.has(repo.id)) {
      return false;
    }
    
    discovered.add(repo.id);
    this.cache.set(discoveryKey, discovered);
    
    return true;
  }

  async storeResults(results) {
    const resultsPath = path.join(this.projectRoot, 'memory', 'github_monitoring_results.json');
    
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
      console.error('Failed to store results:', error.message);
    }
  }

  getStatus() {
    return {
      enabled: this.config.enabled,
      lastUpdate: this.lastUpdate,
      cacheSize: this.cache.size,
      apiRateLimit: this.apiRateLimit,
      repositories: {
        claude_flow: this.config.monitoring_targets?.github_repositories?.claude_flow?.enabled || false,
        reuven_repos: this.config.monitoring_targets?.github_repositories?.reuven_repositories?.enabled || false
      },
      gists: {
        reuven_gists: this.config.monitoring_targets?.github_gists?.reuven_gists?.enabled || false,
        community_gists: this.config.monitoring_targets?.github_gists?.community_gists?.enabled || false
      }
    };
  }
}

// CLI interface
if (require.main === module) {
  const configPath = process.argv[2] || path.join(__dirname, 'update-system.json');
  const projectRoot = process.argv[3] || process.cwd();
  const monitor = new GitHubMonitor(configPath, projectRoot);
  
  const command = process.argv[4] || 'check';
  
  switch (command) {
    case 'initialize':
      monitor.initialize();
      break;
    
    case 'check':
      monitor.initialize().then(() => {
        return monitor.performWeeklyCheck();
      }).then(results => {
        console.log('\n📊 Monitoring Results:');
        console.log(`Repositories: ${results.repositories.length} checked`);
        console.log(`Gists: ${results.gists.length} checked`);
        console.log(`Discoveries: ${results.discoveries.length} new items`);
        
        if (results.errors.length > 0) {
          console.log(`Errors: ${results.errors.length}`);
        }
      }).catch(error => {
        console.error('Monitoring failed:', error.message);
        process.exit(1);
      });
      break;
    
    case 'status':
      console.log('GitHub Monitor Status:', JSON.stringify(monitor.getStatus(), null, 2));
      break;
    
    default:
      console.error('Unknown command:', command);
      console.error('Available commands: initialize, check, status');
      process.exit(1);
  }
}

module.exports = GitHubMonitor;