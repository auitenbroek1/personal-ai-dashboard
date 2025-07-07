#!/usr/bin/env node

/**
 * Update Master Controller
 * Orchestrates the complete automated weekly update system
 */

const fs = require('fs');
const path = require('path');

class UpdateMaster {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.automationPath = path.join(projectRoot, '.claude', 'automation');
    this.configPath = path.join(this.automationPath, 'update-system.json');
    this.config = this.loadConfig();
    this.components = new Map();
    this.status = {
      initialized: false,
      lastRun: null,
      nextRun: null,
      systemHealth: 'unknown'
    };
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (error) {
      console.error('Failed to load master config:', error.message);
    }
    
    return { automatedUpdateSystem: { enabled: true } };
  }

  async initialize() {
    console.log('🚀 Initializing Claude-Flow Automated Update System...');
    
    try {
      // Load all components
      await this.loadComponents();
      
      // Initialize components
      await this.initializeComponents();
      
      // Validate system setup
      await this.validateSystem();
      
      this.status.initialized = true;
      this.status.systemHealth = 'operational';
      
      await this.saveSystemStatus();
      
      console.log('✅ Automated Update System initialized successfully');
      
      return this.getSystemStatus();
      
    } catch (error) {
      console.error('❌ Failed to initialize update system:', error.message);
      this.status.systemHealth = 'failed';
      throw error;
    }
  }

  async loadComponents() {
    console.log('📦 Loading system components...');
    
    // GitHub Monitor
    try {
      const GitHubMonitor = require('./github-monitor.js');
      this.components.set('github', new GitHubMonitor(this.configPath, this.projectRoot));
    } catch (error) {
      console.warn('GitHub monitor not available:', error.message);
    }
    
    // SPARC Monitor
    try {
      const SparcMonitor = require('./sparc-monitor.js');
      this.components.set('sparc', new SparcMonitor(this.configPath, this.projectRoot));
    } catch (error) {
      console.warn('SPARC monitor not available:', error.message);
    }
    
    // Update Analyzer
    try {
      const UpdateAnalyzer = require('./update-analyzer.js');
      this.components.set('analyzer', new UpdateAnalyzer(this.configPath, this.projectRoot));
    } catch (error) {
      console.warn('Update analyzer not available:', error.message);
    }
    
    // Scheduler
    try {
      const Scheduler = require('./scheduler.js');
      this.components.set('scheduler', new Scheduler(this.configPath, this.projectRoot));
    } catch (error) {
      console.warn('Scheduler not available:', error.message);
    }
    
    // Report Generator
    try {
      const ReportGenerator = require('./report-generator.js');
      this.components.set('reports', new ReportGenerator(this.configPath, this.projectRoot));
    } catch (error) {
      console.warn('Report generator not available:', error.message);
    }
    
    // Notifier
    try {
      const Notifier = require('./notifier.js');
      this.components.set('notifier', new Notifier(this.configPath, this.projectRoot));
    } catch (error) {
      console.warn('Notifier not available:', error.message);
    }
    
    console.log(`📊 Loaded ${this.components.size} components`);
  }

  async initializeComponents() {
    console.log('🔧 Initializing components...');
    
    const initResults = [];
    
    for (const [name, component] of this.components) {
      try {
        console.log(`  Initializing ${name}...`);
        await component.initialize();
        initResults.push({ component: name, status: 'success' });
      } catch (error) {
        console.error(`  Failed to initialize ${name}:`, error.message);
        initResults.push({ component: name, status: 'failed', error: error.message });
      }
    }
    
    const successful = initResults.filter(r => r.status === 'success').length;
    console.log(`✅ ${successful}/${initResults.length} components initialized successfully`);
    
    return initResults;
  }

  async validateSystem() {
    console.log('🔍 Validating system configuration...');
    
    const validationResults = {
      config_valid: false,
      components_operational: 0,
      required_components: ['github', 'analyzer', 'scheduler'],
      missing_components: [],
      warnings: []
    };
    
    // Validate configuration
    try {
      if (this.config.automatedUpdateSystem?.enabled) {
        validationResults.config_valid = true;
      } else {
        validationResults.warnings.push('Automated update system is disabled in configuration');
      }
    } catch (error) {
      validationResults.warnings.push(`Configuration validation failed: ${error.message}`);
    }
    
    // Check required components
    for (const required of validationResults.required_components) {
      if (!this.components.has(required)) {
        validationResults.missing_components.push(required);
      } else {
        validationResults.components_operational++;
      }
    }
    
    // Check directories
    const requiredDirs = ['memory', 'reports', 'logs'];
    for (const dir of requiredDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        try {
          fs.mkdirSync(dirPath, { recursive: true });
          console.log(`📁 Created directory: ${dir}`);
        } catch (error) {
          validationResults.warnings.push(`Failed to create directory ${dir}: ${error.message}`);
        }
      }
    }
    
    if (validationResults.missing_components.length > 0) {
      validationResults.warnings.push(`Missing required components: ${validationResults.missing_components.join(', ')}`);
    }
    
    return validationResults;
  }

  async runManualUpdate() {
    console.log('🔄 Running manual update process...');
    
    if (!this.status.initialized) {
      throw new Error('System not initialized. Run initialize() first.');
    }
    
    const updateResults = {
      timestamp: new Date().toISOString(),
      trigger: 'manual',
      steps: [],
      success: false,
      duration: 0
    };
    
    const startTime = Date.now();
    
    try {
      // Step 1: GitHub Monitoring
      if (this.components.has('github')) {
        console.log('🔍 Step 1: GitHub Monitoring...');
        const githubResult = await this.components.get('github').performWeeklyCheck();
        updateResults.steps.push({
          step: 'github_monitoring',
          status: 'success',
          result: githubResult,
          duration: Date.now() - Date.now()
        });
      }
      
      // Step 2: SPARC Monitoring
      if (this.components.has('sparc')) {
        console.log('📚 Step 2: SPARC Monitoring...');
        const sparcResult = await this.components.get('sparc').performWeeklyCheck();
        updateResults.steps.push({
          step: 'sparc_monitoring',
          status: 'success',
          result: sparcResult,
          duration: Date.now() - Date.now()
        });
      }
      
      // Step 3: Analysis
      if (this.components.has('analyzer')) {
        console.log('🧠 Step 3: Update Analysis...');
        const analysisResult = await this.components.get('analyzer').analyzeUpdates();
        updateResults.steps.push({
          step: 'update_analysis',
          status: 'success',
          result: analysisResult,
          duration: Date.now() - Date.now()
        });
      }
      
      // Step 4: Report Generation
      if (this.components.has('reports')) {
        console.log('📊 Step 4: Report Generation...');
        const reportResult = await this.components.get('reports').generateWeeklyReport(updateResults);
        updateResults.steps.push({
          step: 'report_generation',
          status: 'success',
          result: reportResult,
          duration: Date.now() - Date.now()
        });
      }
      
      // Step 5: Notifications
      if (this.components.has('notifier')) {
        console.log('🔔 Step 5: Notifications...');
        const notificationResult = await this.components.get('notifier').sendUpdateNotifications(updateResults);
        updateResults.steps.push({
          step: 'notifications',
          status: 'success',
          result: notificationResult,
          duration: Date.now() - Date.now()
        });
      }
      
      updateResults.success = true;
      updateResults.duration = Date.now() - startTime;
      
      this.status.lastRun = new Date().toISOString();
      await this.saveSystemStatus();
      
      console.log(`✅ Manual update completed successfully in ${updateResults.duration}ms`);
      
      return updateResults;
      
    } catch (error) {
      updateResults.success = false;
      updateResults.error = error.message;
      updateResults.duration = Date.now() - startTime;
      
      console.error('❌ Manual update failed:', error.message);
      throw error;
    }
  }

  async startScheduledUpdates() {
    console.log('⏰ Starting scheduled update system...');
    
    if (!this.components.has('scheduler')) {
      throw new Error('Scheduler component not available');
    }
    
    const scheduler = this.components.get('scheduler');
    
    // The scheduler will handle the weekly automation
    console.log('✅ Scheduled updates are now active');
    console.log('📅 Weekly updates will run automatically according to configuration');
    
    return {
      scheduled: true,
      next_run: await this.getNextScheduledRun(),
      frequency: this.config.automatedUpdateSystem?.schedule?.frequency || 'weekly'
    };
  }

  async getNextScheduledRun() {
    if (this.components.has('scheduler')) {
      const scheduler = this.components.get('scheduler');
      try {
        return await scheduler.getNextScheduledRun();
      } catch (error) {
        console.warn('Failed to get next scheduled run:', error.message);
      }
    }
    
    return null;
  }

  async getSystemStatus() {
    const status = {
      system: this.status,
      components: {},
      configuration: {
        enabled: this.config.automatedUpdateSystem?.enabled || false,
        schedule: this.config.automatedUpdateSystem?.schedule || {},
        auto_update: this.config.automatedUpdateSystem?.update_actions?.auto_update?.enabled || false
      },
      last_update_results: await this.getLastUpdateResults(),
      pending_approvals: await this.getPendingApprovals()
    };
    
    // Get status from each component
    for (const [name, component] of this.components) {
      try {
        if (typeof component.getStatus === 'function') {
          status.components[name] = await component.getStatus();
        } else {
          status.components[name] = { available: true, status: 'unknown' };
        }
      } catch (error) {
        status.components[name] = { available: false, error: error.message };
      }
    }
    
    return status;
  }

  async getLastUpdateResults() {
    const resultsPath = path.join(this.projectRoot, 'memory', 'weekly_update_results.json');
    
    try {
      if (fs.existsSync(resultsPath)) {
        const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        return data.results[0] || null; // Most recent results
      }
    } catch (error) {
      console.warn('Failed to load last update results:', error.message);
    }
    
    return null;
  }

  async getPendingApprovals() {
    if (this.components.has('notifier')) {
      try {
        return await this.components.get('notifier').checkApprovalStatus();
      } catch (error) {
        console.warn('Failed to check pending approvals:', error.message);
      }
    }
    
    return { pending: 0, approved: 0, rejected: 0 };
  }

  async saveSystemStatus() {
    const statusPath = path.join(this.projectRoot, 'memory', 'update_system_status.json');
    
    try {
      const systemStatus = await this.getSystemStatus();
      fs.writeFileSync(statusPath, JSON.stringify(systemStatus, null, 2));
    } catch (error) {
      console.error('Failed to save system status:', error.message);
    }
  }

  async generateSetupSummary() {
    const summary = {
      title: 'Claude-Flow Automated Update System Setup',
      timestamp: new Date().toISOString(),
      configuration: {
        enabled: this.config.automatedUpdateSystem?.enabled || false,
        schedule: this.config.automatedUpdateSystem?.schedule || {},
        monitoring_targets: Object.keys(this.config.automatedUpdateSystem?.monitoring_targets || {}),
        notification_channels: this.config.automatedUpdateSystem?.update_actions?.notification_triggers || {}
      },
      components: {
        available: Array.from(this.components.keys()),
        operational: 0,
        failed: 0
      },
      features: {
        github_monitoring: this.components.has('github'),
        sparc_monitoring: this.components.has('sparc'),
        update_analysis: this.components.has('analyzer'),
        automated_scheduling: this.components.has('scheduler'),
        report_generation: this.components.has('reports'),
        notifications: this.components.has('notifier')
      },
      usage: {
        manual_update: 'node .claude/automation/update-master.js <project-root> run',
        check_status: 'node .claude/automation/update-master.js <project-root> status',
        start_scheduler: 'node .claude/automation/update-master.js <project-root> schedule',
        approve_update: 'node .claude/automation/notifier.js <config> <project> approve <prompt-id> true'
      }
    };
    
    // Count operational components
    for (const [name, component] of this.components) {
      try {
        if (typeof component.getStatus === 'function') {
          const status = await component.getStatus();
          if (status.enabled !== false) {
            summary.components.operational++;
          } else {
            summary.components.failed++;
          }
        } else {
          summary.components.operational++;
        }
      } catch (error) {
        summary.components.failed++;
      }
    }
    
    return summary;
  }

  async stop() {
    console.log('🛑 Stopping automated update system...');
    
    // Stop scheduler if running
    if (this.components.has('scheduler')) {
      try {
        await this.components.get('scheduler').stop();
      } catch (error) {
        console.error('Failed to stop scheduler:', error.message);
      }
    }
    
    this.status.systemHealth = 'stopped';
    console.log('✅ Automated update system stopped');
  }
}

// CLI interface
if (require.main === module) {
  const projectRoot = process.argv[2] || process.cwd();
  const updateMaster = new UpdateMaster(projectRoot);
  
  const command = process.argv[3] || 'status';
  
  switch (command) {
    case 'initialize':
    case 'init':
      updateMaster.initialize().then(status => {
        console.log('\n📊 System Status:', JSON.stringify(status.system, null, 2));
        console.log(`✅ Initialization complete - ${Object.keys(status.components).length} components loaded`);
      }).catch(error => {
        console.error('Initialization failed:', error.message);
        process.exit(1);
      });
      break;
    
    case 'run':
      updateMaster.initialize().then(() => {
        return updateMaster.runManualUpdate();
      }).then(results => {
        console.log('\n📊 Update Results Summary:');
        console.log(`✅ Success: ${results.success}`);
        console.log(`⏱️  Duration: ${results.duration}ms`);
        console.log(`📋 Steps Completed: ${results.steps.length}`);
        
        if (results.steps.length > 0) {
          console.log('\n📝 Step Details:');
          results.steps.forEach((step, index) => {
            console.log(`  ${index + 1}. ${step.step}: ${step.status}`);
          });
        }
      }).catch(error => {
        console.error('Manual update failed:', error.message);
        process.exit(1);
      });
      break;
    
    case 'schedule':
    case 'start':
      updateMaster.initialize().then(() => {
        return updateMaster.startScheduledUpdates();
      }).then(result => {
        console.log('Scheduled Updates:', JSON.stringify(result, null, 2));
        
        if (result.scheduled) {
          console.log('🎯 Automated updates are now running');
          console.log('📅 Check back weekly for update reports');
          console.log('🔔 You will be notified of important updates');
        }
      }).catch(error => {
        console.error('Failed to start scheduled updates:', error.message);
        process.exit(1);
      });
      break;
    
    case 'status':
      updateMaster.getSystemStatus().then(status => {
        console.log('System Status:', JSON.stringify(status, null, 2));
      }).catch(error => {
        console.error('Failed to get system status:', error.message);
        process.exit(1);
      });
      break;
    
    case 'summary':
      updateMaster.generateSetupSummary().then(summary => {
        console.log('\n' + '='.repeat(60));
        console.log(summary.title);
        console.log('='.repeat(60));
        console.log(`Configuration: ${summary.configuration.enabled ? 'ENABLED' : 'DISABLED'}`);
        console.log(`Components: ${summary.components.operational}/${summary.components.available.length} operational`);
        console.log(`Features: ${Object.values(summary.features).filter(f => f).length}/${Object.keys(summary.features).length} available`);
        console.log('\n📋 Available Commands:');
        Object.entries(summary.usage).forEach(([cmd, usage]) => {
          console.log(`  ${cmd}: ${usage}`);
        });
        console.log('='.repeat(60));
      }).catch(error => {
        console.error('Failed to generate summary:', error.message);
        process.exit(1);
      });
      break;
    
    case 'stop':
      updateMaster.stop().then(() => {
        console.log('Update system stopped');
        process.exit(0);
      });
      break;
    
    default:
      console.error('Unknown command:', command);
      console.error('Available commands: initialize, run, schedule, status, summary, stop');
      process.exit(1);
  }
}

module.exports = UpdateMaster;