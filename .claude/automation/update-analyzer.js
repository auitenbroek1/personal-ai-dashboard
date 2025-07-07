#!/usr/bin/env node

/**
 * Update Analysis and Recommendation Engine
 * Analyzes discovered updates and provides intelligent recommendations
 */

const fs = require('fs');
const path = require('path');

class UpdateAnalyzer {
  constructor(configPath, projectRoot) {
    this.configPath = configPath;
    this.projectRoot = projectRoot;
    this.config = this.loadConfig();
    this.currentSystem = {};
    this.analysisCache = new Map();
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
      analysis_engine: {
        update_classification: { enabled: true },
        compatibility_analysis: { enabled: true },
        impact_assessment: { enabled: true }
      }
    };
  }

  async initialize() {
    if (!this.config.enabled) {
      console.log('Update analyzer is disabled');
      return;
    }

    console.log('🚀 Initializing Update Analyzer...');
    
    await this.loadCurrentSystemState();
    await this.loadAnalysisCache();
    
    console.log('✅ Update analyzer initialized');
  }

  async loadCurrentSystemState() {
    try {
      // Load current claude-flow version info
      const packagePath = path.join(this.projectRoot, 'package.json');
      if (fs.existsSync(packagePath)) {
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        this.currentSystem.version = packageData.version;
        this.currentSystem.dependencies = packageData.dependencies || {};
      }

      // Load current enhancement status
      const enhancementStatusPath = path.join(this.projectRoot, 'memory', 'enhancement_master_status.json');
      if (fs.existsSync(enhancementStatusPath)) {
        const enhancementData = JSON.parse(fs.readFileSync(enhancementStatusPath, 'utf8'));
        this.currentSystem.enhancements = enhancementData;
      }

      // Load current SPARC configuration
      const sparcPath = path.join(this.projectRoot, '.claude', 'commands', 'sparc');
      if (fs.existsSync(sparcPath)) {
        this.currentSystem.sparc = {
          modes: fs.readdirSync(sparcPath).filter(f => f.endsWith('.md')).length,
          lastUpdate: this.getDirectoryLastModified(sparcPath)
        };
      }

      console.log('📊 Current system state loaded');
      
    } catch (error) {
      console.warn('Failed to load current system state:', error.message);
      this.currentSystem = { version: 'unknown' };
    }
  }

  async loadAnalysisCache() {
    const cachePath = path.join(this.projectRoot, 'memory', 'update_analysis_cache.json');
    
    try {
      if (fs.existsSync(cachePath)) {
        const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        this.analysisCache = new Map(Object.entries(cacheData.cache || {}));
        console.log(`📂 Loaded analysis cache with ${this.analysisCache.size} entries`);
      }
    } catch (error) {
      console.warn('Failed to load analysis cache:', error.message);
    }
  }

  async saveAnalysisCache() {
    const cachePath = path.join(this.projectRoot, 'memory', 'update_analysis_cache.json');
    
    try {
      const cacheData = {
        timestamp: new Date().toISOString(),
        cache: Object.fromEntries(this.analysisCache)
      };
      
      fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      console.error('Failed to save analysis cache:', error.message);
    }
  }

  async analyzeUpdates() {
    console.log('🔍 Starting comprehensive update analysis...');
    
    const analysis = {
      timestamp: new Date().toISOString(),
      system_state: this.currentSystem,
      github_updates: await this.analyzeGitHubUpdates(),
      sparc_updates: await this.analyzeSparcUpdates(),
      recommendations: [],
      risk_assessment: {},
      impact_summary: {}
    };

    // Generate recommendations
    analysis.recommendations = await this.generateRecommendations(analysis);
    
    // Perform risk assessment
    analysis.risk_assessment = await this.performRiskAssessment(analysis);
    
    // Create impact summary
    analysis.impact_summary = await this.createImpactSummary(analysis);

    // Save analysis results
    await this.storeAnalysis(analysis);
    await this.saveAnalysisCache();

    console.log(`✅ Update analysis complete: ${analysis.recommendations.length} recommendations generated`);
    
    return analysis;
  }

  async analyzeGitHubUpdates() {
    const githubResultsPath = path.join(this.projectRoot, 'memory', 'github_monitoring_results.json');
    
    if (!fs.existsSync(githubResultsPath)) {
      return { analyzed: false, reason: 'No GitHub monitoring results found' };
    }

    try {
      const githubData = JSON.parse(fs.readFileSync(githubResultsPath, 'utf8'));
      const latestResults = githubData.results[0]; // Most recent results
      
      if (!latestResults) {
        return { analyzed: false, reason: 'No recent GitHub results' };
      }

      const analysis = {
        analyzed: true,
        total_updates: 0,
        classified_updates: [],
        repositories: {},
        gists: {}
      };

      // Analyze repository updates
      for (const repoResult of latestResults.repositories) {
        if (repoResult.updates && repoResult.updates.length > 0) {
          analysis.total_updates += repoResult.updates.length;
          
          const repoAnalysis = {
            repo: repoResult.repo,
            update_count: repoResult.updates.length,
            classifications: []
          };

          for (const update of repoResult.updates) {
            const classification = this.classifyUpdate(update);
            repoAnalysis.classifications.push(classification);
            analysis.classified_updates.push({
              ...classification,
              source: repoResult.repo,
              source_type: 'repository'
            });
          }

          analysis.repositories[repoResult.repo] = repoAnalysis;
        }
      }

      // Analyze gist updates
      for (const gistResult of latestResults.gists) {
        if (gistResult.updates && gistResult.updates.length > 0) {
          analysis.total_updates += gistResult.updates.length;
          
          const gistAnalysis = {
            user: gistResult.user,
            update_count: gistResult.updates.length,
            classifications: []
          };

          for (const update of gistResult.updates) {
            const classification = this.classifyUpdate(update);
            gistAnalysis.classifications.push(classification);
            analysis.classified_updates.push({
              ...classification,
              source: gistResult.user,
              source_type: 'gist'
            });
          }

          analysis.gists[gistResult.user || 'community'] = gistAnalysis;
        }
      }

      return analysis;
      
    } catch (error) {
      console.error('Failed to analyze GitHub updates:', error.message);
      return { analyzed: false, reason: error.message };
    }
  }

  async analyzeSparcUpdates() {
    const sparcResultsPath = path.join(this.projectRoot, 'memory', 'sparc_monitoring_results.json');
    
    if (!fs.existsSync(sparcResultsPath)) {
      return { analyzed: false, reason: 'No SPARC monitoring results found' };
    }

    try {
      const sparcData = JSON.parse(fs.readFileSync(sparcResultsPath, 'utf8'));
      const latestResults = sparcData.results[0]; // Most recent results
      
      if (!latestResults) {
        return { analyzed: false, reason: 'No recent SPARC results' };
      }

      const analysis = {
        analyzed: true,
        total_changes: latestResults.changes_detected.length,
        methodology_updates: [],
        documentation_updates: [],
        impact_levels: {}
      };

      // Analyze changes by type and impact
      for (const change of latestResults.changes_detected) {
        const impactLevel = change.impact || 'low';
        
        if (!analysis.impact_levels[impactLevel]) {
          analysis.impact_levels[impactLevel] = 0;
        }
        analysis.impact_levels[impactLevel]++;

        if (change.category === 'methodology_update') {
          analysis.methodology_updates.push({
            ...change,
            compatibility: this.assessSparcCompatibility(change),
            update_priority: this.calculateSparcUpdatePriority(change)
          });
        } else {
          analysis.documentation_updates.push({
            ...change,
            relevance: this.assessDocumentationRelevance(change)
          });
        }
      }

      return analysis;
      
    } catch (error) {
      console.error('Failed to analyze SPARC updates:', error.message);
      return { analyzed: false, reason: error.message };
    }
  }

  classifyUpdate(update) {
    const classificationConfig = this.config.analysis_engine?.update_classification;
    if (!classificationConfig?.enabled) {
      return { category: 'general', severity: 'minor' };
    }

    const title = (update.title || '').toLowerCase();
    const description = (update.description || '').toLowerCase();
    const searchText = `${title} ${description}`;

    // Check against configured categories
    const categories = classificationConfig.categories || {};
    
    for (const [categoryName, categoryConfig] of Object.entries(categories)) {
      const keywords = categoryConfig.keywords || [];
      
      if (keywords.some(keyword => searchText.includes(keyword.toLowerCase()))) {
        return {
          category: categoryName,
          severity: categoryConfig.severity,
          auto_apply: categoryConfig.auto_apply,
          require_approval: categoryConfig.require_approval,
          matched_keywords: keywords.filter(keyword => searchText.includes(keyword.toLowerCase())),
          confidence: this.calculateClassificationConfidence(searchText, keywords)
        };
      }
    }

    // Default classification
    return {
      category: 'general_update',
      severity: 'minor',
      auto_apply: true,
      require_approval: false,
      confidence: 0.5
    };
  }

  calculateClassificationConfidence(text, keywords) {
    const totalMatches = keywords.filter(keyword => 
      text.includes(keyword.toLowerCase())
    ).length;
    
    return Math.min(totalMatches / keywords.length, 1.0);
  }

  assessSparcCompatibility(change) {
    // Analyze compatibility with current SPARC setup
    const currentModes = this.currentSystem.sparc?.modes || 0;
    
    if (change.type === 'methodology_update') {
      return {
        compatible: true,
        impact: 'requires_review',
        estimated_effort: 'medium',
        breaking_changes: change.summary?.includes('breaking') || false
      };
    }
    
    return {
      compatible: true,
      impact: 'low',
      estimated_effort: 'low',
      breaking_changes: false
    };
  }

  calculateSparcUpdatePriority(change) {
    let priority = 50; // Base priority
    
    // Increase priority for critical changes
    if (change.impact === 'critical' || change.impact === 'high') {
      priority += 30;
    }
    
    // Increase priority for methodology changes
    if (change.category === 'methodology_update') {
      priority += 20;
    }
    
    // Decrease priority if breaking changes
    if (change.summary?.includes('breaking')) {
      priority -= 10;
    }
    
    return Math.max(0, Math.min(100, priority));
  }

  assessDocumentationRelevance(change) {
    const relevanceScore = 50; // Base relevance
    
    return {
      score: relevanceScore,
      reasons: ['Documentation update detected'],
      action_required: relevanceScore > 70
    };
  }

  async generateRecommendations(analysis) {
    const recommendations = [];
    
    // GitHub-based recommendations
    if (analysis.github_updates.analyzed) {
      const githubRecs = this.generateGitHubRecommendations(analysis.github_updates);
      recommendations.push(...githubRecs);
    }
    
    // SPARC-based recommendations
    if (analysis.sparc_updates.analyzed) {
      const sparcRecs = this.generateSparcRecommendations(analysis.sparc_updates);
      recommendations.push(...sparcRecs);
    }
    
    // System-wide recommendations
    const systemRecs = this.generateSystemRecommendations(analysis);
    recommendations.push(...systemRecs);
    
    // Sort recommendations by priority
    recommendations.sort((a, b) => b.priority - a.priority);
    
    return recommendations;
  }

  generateGitHubRecommendations(githubUpdates) {
    const recommendations = [];
    
    // High-priority updates (security, breaking changes)
    const criticalUpdates = githubUpdates.classified_updates.filter(
      update => update.severity === 'critical' || update.category === 'security_updates'
    );
    
    for (const update of criticalUpdates) {
      recommendations.push({
        id: `github_critical_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'critical_update',
        priority: 90,
        title: `Critical Update: ${update.title || 'Security/Breaking Change'}`,
        description: `${update.category} detected in ${update.source}`,
        source: update.source,
        source_type: update.source_type,
        action: update.auto_apply ? 'auto_apply' : 'manual_review',
        timeline: 'immediate',
        risk_level: 'high',
        benefits: ['Security improvement', 'System stability'],
        risks: update.category === 'breaking_changes' ? ['Potential compatibility issues'] : []
      });
    }
    
    // Major feature updates
    const majorUpdates = githubUpdates.classified_updates.filter(
      update => update.category === 'major_features'
    );
    
    for (const update of majorUpdates) {
      recommendations.push({
        id: `github_major_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'feature_update',
        priority: 70,
        title: `New Feature Available: ${update.title}`,
        description: `Major feature update in ${update.source}`,
        source: update.source,
        source_type: update.source_type,
        action: 'evaluate_and_plan',
        timeline: 'this_week',
        risk_level: 'medium',
        benefits: ['Enhanced functionality', 'Productivity improvement'],
        risks: ['Learning curve', 'Integration effort']
      });
    }
    
    return recommendations;
  }

  generateSparcRecommendations(sparcUpdates) {
    const recommendations = [];
    
    // Methodology updates
    for (const methodologyUpdate of sparcUpdates.methodology_updates) {
      const priority = methodologyUpdate.update_priority || 60;
      
      recommendations.push({
        id: `sparc_methodology_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'methodology_update',
        priority,
        title: `SPARC Methodology Update: ${methodologyUpdate.summary}`,
        description: methodologyUpdate.recommendation || 'Review methodology changes',
        source: 'SPARC Documentation',
        source_type: 'methodology',
        action: methodologyUpdate.compatibility.breaking_changes ? 'careful_review' : 'review_and_update',
        timeline: methodologyUpdate.impact === 'high' ? 'this_week' : 'this_month',
        risk_level: methodologyUpdate.compatibility.breaking_changes ? 'high' : 'low',
        benefits: ['Improved methodology', 'Best practices alignment'],
        risks: methodologyUpdate.compatibility.breaking_changes ? ['Workflow disruption'] : []
      });
    }
    
    return recommendations;
  }

  generateSystemRecommendations(analysis) {
    const recommendations = [];
    
    // System health recommendations
    const enhancementStatus = this.currentSystem.enhancements;
    if (enhancementStatus && enhancementStatus.summary) {
      const activeEnhancements = enhancementStatus.summary.successful || 0;
      const totalEnhancements = enhancementStatus.summary.total || 5;
      
      if (activeEnhancements < totalEnhancements) {
        recommendations.push({
          id: `system_health_${Date.now()}`,
          type: 'system_health',
          priority: 80,
          title: 'Enhancement System Optimization',
          description: `${totalEnhancements - activeEnhancements} enhancements are not active`,
          source: 'System Health Check',
          source_type: 'system',
          action: 'optimize_enhancements',
          timeline: 'this_week',
          risk_level: 'medium',
          benefits: ['Improved performance', 'Full feature utilization'],
          risks: ['Configuration complexity']
        });
      }
    }
    
    // Update frequency recommendation
    const updateCount = (analysis.github_updates.total_updates || 0) + 
                       (analysis.sparc_updates.total_changes || 0);
    
    if (updateCount > 10) {
      recommendations.push({
        id: `update_frequency_${Date.now()}`,
        type: 'maintenance',
        priority: 60,
        title: 'High Update Activity Detected',
        description: `${updateCount} updates detected this week`,
        source: 'Update Monitor',
        source_type: 'system',
        action: 'increase_monitoring_frequency',
        timeline: 'this_week',
        risk_level: 'low',
        benefits: ['Stay current with developments', 'Early issue detection'],
        risks: ['Monitoring overhead']
      });
    }
    
    return recommendations;
  }

  async performRiskAssessment(analysis) {
    const riskAssessment = {
      overall_risk: 'low',
      risk_factors: [],
      mitigation_strategies: []
    };
    
    // Assess breaking changes risk
    const breakingChanges = analysis.github_updates.classified_updates?.filter(
      update => update.category === 'breaking_changes'
    ) || [];
    
    if (breakingChanges.length > 0) {
      riskAssessment.risk_factors.push({
        type: 'breaking_changes',
        severity: 'high',
        count: breakingChanges.length,
        description: 'Breaking changes detected that may impact system compatibility'
      });
      
      riskAssessment.mitigation_strategies.push({
        risk_type: 'breaking_changes',
        strategy: 'Create system backup and test updates in isolated environment',
        timeline: 'before_applying_updates'
      });
      
      riskAssessment.overall_risk = 'high';
    }
    
    // Assess methodology change risk
    const methodologyChanges = analysis.sparc_updates.methodology_updates?.length || 0;
    if (methodologyChanges > 0) {
      riskAssessment.risk_factors.push({
        type: 'methodology_changes',
        severity: 'medium',
        count: methodologyChanges,
        description: 'SPARC methodology updates may require workflow adjustments'
      });
      
      riskAssessment.mitigation_strategies.push({
        risk_type: 'methodology_changes',
        strategy: 'Review methodology changes and plan gradual implementation',
        timeline: 'within_2_weeks'
      });
      
      if (riskAssessment.overall_risk === 'low') {
        riskAssessment.overall_risk = 'medium';
      }
    }
    
    // Assess system stability risk
    const criticalUpdates = analysis.recommendations.filter(
      rec => rec.priority >= 90
    ).length;
    
    if (criticalUpdates > 3) {
      riskAssessment.risk_factors.push({
        type: 'high_update_volume',
        severity: 'medium',
        count: criticalUpdates,
        description: 'High volume of critical updates may affect system stability'
      });
      
      riskAssessment.mitigation_strategies.push({
        risk_type: 'high_update_volume',
        strategy: 'Stagger update implementation over multiple weeks',
        timeline: 'phased_approach'
      });
    }
    
    return riskAssessment;
  }

  async createImpactSummary(analysis) {
    const impactSummary = {
      productivity_impact: 'neutral',
      estimated_time_investment: '2-4 hours',
      potential_benefits: [],
      immediate_actions: [],
      long_term_actions: []
    };
    
    // Calculate productivity impact
    const highPriorityRecs = analysis.recommendations.filter(rec => rec.priority >= 70);
    const featureUpdates = analysis.recommendations.filter(rec => rec.type === 'feature_update');
    
    if (featureUpdates.length >= 2) {
      impactSummary.productivity_impact = 'positive';
      impactSummary.potential_benefits.push('New features may improve workflow efficiency');
    }
    
    if (highPriorityRecs.length >= 3) {
      impactSummary.estimated_time_investment = '4-8 hours';
    }
    
    // Categorize actions by timeline
    for (const rec of analysis.recommendations) {
      if (rec.timeline === 'immediate') {
        impactSummary.immediate_actions.push({
          title: rec.title,
          action: rec.action,
          priority: rec.priority
        });
      } else if (rec.timeline === 'this_month' || rec.timeline === 'phased_approach') {
        impactSummary.long_term_actions.push({
          title: rec.title,
          action: rec.action,
          timeline: rec.timeline
        });
      }
    }
    
    // Add potential benefits
    if (analysis.sparc_updates.methodology_updates?.length > 0) {
      impactSummary.potential_benefits.push('SPARC methodology improvements');
    }
    
    if (analysis.github_updates.total_updates > 5) {
      impactSummary.potential_benefits.push('Stay current with latest developments');
    }
    
    return impactSummary;
  }

  async storeAnalysis(analysis) {
    const analysisPath = path.join(this.projectRoot, 'memory', 'update_analysis_results.json');
    
    try {
      // Load existing analyses
      let allAnalyses = [];
      if (fs.existsSync(analysisPath)) {
        const existingData = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
        allAnalyses = existingData.analyses || [];
      }
      
      // Add new analysis
      allAnalyses.unshift(analysis);
      
      // Keep only last 5 analyses
      allAnalyses = allAnalyses.slice(0, 5);
      
      // Save updated analyses
      fs.writeFileSync(analysisPath, JSON.stringify({
        lastUpdate: new Date().toISOString(),
        analyses: allAnalyses
      }, null, 2));
      
    } catch (error) {
      console.error('Failed to store analysis:', error.message);
    }
  }

  getDirectoryLastModified(dirPath) {
    try {
      const files = fs.readdirSync(dirPath);
      let latestTime = 0;
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.mtime.getTime() > latestTime) {
          latestTime = stats.mtime.getTime();
        }
      }
      
      return new Date(latestTime).toISOString();
    } catch (error) {
      return null;
    }
  }

  getStatus() {
    return {
      enabled: this.config.enabled,
      system_state: this.currentSystem,
      cache_size: this.analysisCache.size,
      analysis_features: {
        classification: this.config.analysis_engine?.update_classification?.enabled || false,
        compatibility: this.config.analysis_engine?.compatibility_analysis?.enabled || false,
        impact_assessment: this.config.analysis_engine?.impact_assessment?.enabled || false
      }
    };
  }
}

// CLI interface
if (require.main === module) {
  const configPath = process.argv[2] || path.join(__dirname, 'update-system.json');
  const projectRoot = process.argv[3] || process.cwd();
  const analyzer = new UpdateAnalyzer(configPath, projectRoot);
  
  const command = process.argv[4] || 'analyze';
  
  switch (command) {
    case 'initialize':
      analyzer.initialize();
      break;
    
    case 'analyze':
      analyzer.initialize().then(() => {
        return analyzer.analyzeUpdates();
      }).then(analysis => {
        console.log('\n📊 Analysis Summary:');
        console.log(`Recommendations: ${analysis.recommendations.length}`);
        console.log(`Risk Level: ${analysis.risk_assessment.overall_risk.toUpperCase()}`);
        console.log(`Productivity Impact: ${analysis.impact_summary.productivity_impact.toUpperCase()}`);
        console.log(`Time Investment: ${analysis.impact_summary.estimated_time_investment}`);
        
        if (analysis.recommendations.length > 0) {
          console.log('\n🎯 Top Recommendations:');
          analysis.recommendations.slice(0, 3).forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec.title} (Priority: ${rec.priority})`);
          });
        }
      }).catch(error => {
        console.error('Analysis failed:', error.message);
        process.exit(1);
      });
      break;
    
    case 'status':
      console.log('Update Analyzer Status:', JSON.stringify(analyzer.getStatus(), null, 2));
      break;
    
    default:
      console.error('Unknown command:', command);
      console.error('Available commands: initialize, analyze, status');
      process.exit(1);
  }
}

module.exports = UpdateAnalyzer;