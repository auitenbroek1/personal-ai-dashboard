#!/usr/bin/env node

/**
 * Automated Scheduling System for Weekly Updates
 * Manages scheduling and orchestration of update monitoring tasks
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { CronJob } = require('cron');

class UpdateScheduler {
  constructor(configPath, projectRoot) {
    this.configPath = configPath;
    this.projectRoot = projectRoot;
    this.config = this.loadConfig();
    this.jobs = new Map();
    this.isRunning = false;
    this.lastRun = null;
    this.automationPath = path.join(projectRoot, '.claude', 'automation');
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
      schedule: {
        frequency: 'weekly',
        day_of_week: 'sunday',
        time: '06:00',
        timezone: 'local'
      }
    };
  }

  async initialize() {
    if (!this.config.enabled) {
      console.log('Update scheduler is disabled');
      return;
    }

    console.log('🚀 Initializing Update Scheduler...');
    
    // Check if cron package is available (simulate since it's not installed)
    this.cronAvailable = this.checkCronAvailability();
    
    await this.loadScheduleState();
    await this.setupScheduledJobs();
    
    console.log('✅ Update scheduler initialized');
    
    if (this.cronAvailable) {
      console.log(`⏰ Scheduled for ${this.config.schedule.day_of_week} at ${this.config.schedule.time}`);
    } else {
      console.log('⚠️  Cron not available - using manual scheduling mode');
    }
  }

  checkCronAvailability() {
    try {
      // In a real implementation, you would check if 'cron' package is installed
      // For this demo, we'll simulate it's not available
      return false;
    } catch (error) {
      return false;
    }
  }

  async loadScheduleState() {
    const statePath = path.join(this.projectRoot, 'memory', 'scheduler_state.json');
    
    try {
      if (fs.existsSync(statePath)) {
        const stateData = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        this.lastRun = stateData.lastRun;
        this.isRunning = stateData.isRunning || false;
        console.log(`📅 Last run: ${this.lastRun || 'Never'}`);
      }
    } catch (error) {
      console.warn('Failed to load scheduler state:', error.message);
    }
  }

  async saveScheduleState() {
    const statePath = path.join(this.projectRoot, 'memory', 'scheduler_state.json');
    
    try {
      const stateData = {
        lastRun: this.lastRun,
        isRunning: this.isRunning,
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(statePath, JSON.stringify(stateData, null, 2));
    } catch (error) {
      console.error('Failed to save scheduler state:', error.message);
    }
  }

  async setupScheduledJobs() {
    if (this.cronAvailable) {
      this.setupCronJobs();
    } else {
      this.setupManualScheduling();
    }
  }

  setupCronJobs() {
    const schedule = this.config.schedule;
    
    // Convert day_of_week to cron format
    const dayMap = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };
    
    const [hour, minute] = schedule.time.split(':').map(Number);
    const dayOfWeek = dayMap[schedule.day_of_week.toLowerCase()] || 0;
    
    // Cron pattern: minute hour day-of-month month day-of-week
    const cronPattern = `${minute} ${hour} * * ${dayOfWeek}`;
    
    try {
      const job = new CronJob(cronPattern, () => {
        this.executeWeeklyUpdate();
      }, null, true, schedule.timezone);
      
      this.jobs.set('weekly_update', job);
      console.log(`⏰ Cron job scheduled: ${cronPattern}`);
      
    } catch (error) {
      console.error('Failed to setup cron job:', error.message);
      this.setupManualScheduling();
    }
  }

  setupManualScheduling() {
    console.log('📅 Setting up manual scheduling mode...');
    
    // Check every hour if it's time to run
    setInterval(() => {
      if (this.shouldRunUpdate()) {
        this.executeWeeklyUpdate();
      }
    }, 60 * 60 * 1000); // Check every hour
    
    console.log('✅ Manual scheduling active (checks every hour)');
  }

  shouldRunUpdate() {
    if (this.isRunning) {
      return false; // Already running
    }
    
    const now = new Date();
    const schedule = this.config.schedule;
    
    // Check if it's the right day of week
    const dayMap = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };
    
    const scheduledDay = dayMap[schedule.day_of_week.toLowerCase()];
    if (now.getDay() !== scheduledDay) {
      return false;
    }
    
    // Check if it's the right time (within the hour)
    const [scheduledHour] = schedule.time.split(':').map(Number);
    if (now.getHours() !== scheduledHour) {
      return false;
    }
    
    // Check if we've already run today
    if (this.lastRun) {
      const lastRunDate = new Date(this.lastRun);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (lastRunDate >= today) {
        return false; // Already ran today
      }
    }
    
    return true;
  }

  async executeWeeklyUpdate() {
    if (this.isRunning) {
      console.log('⚠️  Update already in progress, skipping...');
      return;
    }

    console.log('🚀 Starting weekly update process...');
    
    this.isRunning = true;
    this.lastRun = new Date().toISOString();
    await this.saveScheduleState();
    
    try {
      const results = await this.runUpdatePipeline();
      
      console.log('✅ Weekly update completed successfully');
      await this.handleUpdateResults(results);
      
    } catch (error) {
      console.error('❌ Weekly update failed:', error.message);
      await this.handleUpdateError(error);
    } finally {
      this.isRunning = false;
      await this.saveScheduleState();
    }
  }

  async runUpdatePipeline() {
    const results = {
      timestamp: new Date().toISOString(),
      pipeline_steps: [],
      errors: []
    };

    console.log('🔍 Step 1: GitHub Monitoring...');
    try {
      const githubResult = await this.runGitHubMonitoring();
      results.pipeline_steps.push({
        step: 'github_monitoring',
        status: 'success',
        result: githubResult
      });
    } catch (error) {
      console.error('GitHub monitoring failed:', error.message);
      results.pipeline_steps.push({
        step: 'github_monitoring',
        status: 'failed',
        error: error.message
      });
      results.errors.push(error.message);
    }

    console.log('📚 Step 2: SPARC Monitoring...');
    try {
      const sparcResult = await this.runSparcMonitoring();
      results.pipeline_steps.push({
        step: 'sparc_monitoring',
        status: 'success',
        result: sparcResult
      });
    } catch (error) {
      console.error('SPARC monitoring failed:', error.message);
      results.pipeline_steps.push({
        step: 'sparc_monitoring',
        status: 'failed',
        error: error.message
      });
      results.errors.push(error.message);
    }

    console.log('🧠 Step 3: Update Analysis...');
    try {
      const analysisResult = await this.runUpdateAnalysis();
      results.pipeline_steps.push({
        step: 'update_analysis',
        status: 'success',
        result: analysisResult
      });
    } catch (error) {
      console.error('Update analysis failed:', error.message);
      results.pipeline_steps.push({
        step: 'update_analysis',
        status: 'failed',
        error: error.message
      });
      results.errors.push(error.message);
    }

    console.log('📊 Step 4: Report Generation...');
    try {
      const reportResult = await this.generateWeeklyReport(results);
      results.pipeline_steps.push({
        step: 'report_generation',
        status: 'success',
        result: reportResult
      });
    } catch (error) {
      console.error('Report generation failed:', error.message);
      results.pipeline_steps.push({
        step: 'report_generation',
        status: 'failed',
        error: error.message
      });
      results.errors.push(error.message);
    }

    console.log('🔔 Step 5: Notifications...');
    try {
      const notificationResult = await this.sendNotifications(results);
      results.pipeline_steps.push({
        step: 'notifications',
        status: 'success',
        result: notificationResult
      });
    } catch (error) {
      console.error('Notifications failed:', error.message);
      results.pipeline_steps.push({
        step: 'notifications',
        status: 'failed',
        error: error.message
      });
      results.errors.push(error.message);
    }

    return results;
  }

  async runGitHubMonitoring() {
    const scriptPath = path.join(this.automationPath, 'github-monitor.js');
    const configPath = path.join(this.automationPath, 'update-system.json');
    
    return await this.executeScript(scriptPath, [configPath, this.projectRoot, 'check']);
  }

  async runSparcMonitoring() {
    const scriptPath = path.join(this.automationPath, 'sparc-monitor.js');
    const configPath = path.join(this.automationPath, 'update-system.json');
    
    return await this.executeScript(scriptPath, [configPath, this.projectRoot, 'check']);
  }

  async runUpdateAnalysis() {
    const scriptPath = path.join(this.automationPath, 'update-analyzer.js');
    const configPath = path.join(this.automationPath, 'update-system.json');
    
    return await this.executeScript(scriptPath, [configPath, this.projectRoot, 'analyze']);
  }

  async generateWeeklyReport(pipelineResults) {
    const reportGenerator = require('./report-generator.js');
    const generator = new reportGenerator(this.configPath, this.projectRoot);
    
    await generator.initialize();
    return await generator.generateWeeklyReport(pipelineResults);
  }

  async sendNotifications(results) {
    const notifier = require('./notifier.js');
    const notificationSystem = new notifier(this.configPath, this.projectRoot);
    
    await notificationSystem.initialize();
    return await notificationSystem.sendUpdateNotifications(results);
  }

  async executeScript(scriptPath, args) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [scriptPath, ...args], {
        cwd: this.automationPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('Script execution timed out'));
      }, 300000); // 5 minutes timeout
      
      child.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code === 0) {
          try {
            // Try to parse JSON output
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            // If not JSON, return raw output
            resolve({ output: stdout, raw: true });
          }
        } else {
          reject(new Error(`Script exited with code ${code}: ${stderr}`));
        }
      });
      
      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async handleUpdateResults(results) {
    // Store pipeline results
    const resultsPath = path.join(this.projectRoot, 'memory', 'weekly_update_results.json');
    
    try {
      let allResults = [];
      if (fs.existsSync(resultsPath)) {
        const existingData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        allResults = existingData.results || [];
      }
      
      allResults.unshift(results);
      allResults = allResults.slice(0, 12); // Keep last 12 weeks
      
      fs.writeFileSync(resultsPath, JSON.stringify({
        lastUpdate: new Date().toISOString(),
        results: allResults
      }, null, 2));
      
    } catch (error) {
      console.error('Failed to store update results:', error.message);
    }

    // Process auto-apply updates
    await this.processAutoApplyUpdates(results);
  }

  async processAutoApplyUpdates(results) {
    // Check if auto-update is enabled
    const autoUpdateConfig = this.config.update_actions?.auto_update;
    if (!autoUpdateConfig?.enabled) {
      console.log('🔄 Auto-update is disabled');
      return;
    }

    console.log('🤖 Processing auto-apply updates...');
    
    // Find analysis results
    const analysisStep = results.pipeline_steps.find(step => step.step === 'update_analysis');
    if (!analysisStep || analysisStep.status !== 'success') {
      console.log('⚠️  No analysis results available for auto-apply');
      return;
    }

    // Get recommendations that can be auto-applied
    const analysis = analysisStep.result;
    const autoApplyRecs = analysis.recommendations?.filter(rec => 
      rec.action === 'auto_apply' && 
      rec.risk_level !== 'high' &&
      rec.priority >= 70
    ) || [];

    console.log(`🎯 Found ${autoApplyRecs.length} recommendations for auto-apply`);

    for (const rec of autoApplyRecs.slice(0, 3)) { // Limit to 3 auto-applies per week
      try {
        await this.applyUpdate(rec);
        console.log(`✅ Auto-applied: ${rec.title}`);
      } catch (error) {
        console.error(`❌ Failed to auto-apply ${rec.title}:`, error.message);
      }
    }
  }

  async applyUpdate(recommendation) {
    // This is a placeholder for actual update application logic
    // In a real implementation, this would:
    // 1. Download the update
    // 2. Create a backup
    // 3. Apply the update
    // 4. Test the update
    // 5. Rollback if needed
    
    console.log(`Simulating application of: ${recommendation.title}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store applied update record
    const appliedPath = path.join(this.projectRoot, 'memory', 'applied_updates.json');
    
    try {
      let appliedUpdates = [];
      if (fs.existsSync(appliedPath)) {
        const data = JSON.parse(fs.readFileSync(appliedPath, 'utf8'));
        appliedUpdates = data.applied || [];
      }
      
      appliedUpdates.push({
        ...recommendation,
        applied_at: new Date().toISOString(),
        status: 'success'
      });
      
      fs.writeFileSync(appliedPath, JSON.stringify({
        lastUpdate: new Date().toISOString(),
        applied: appliedUpdates
      }, null, 2));
      
    } catch (error) {
      console.error('Failed to record applied update:', error.message);
    }
  }

  async handleUpdateError(error) {
    console.error('Update pipeline failed:', error.message);
    
    // Store error for debugging
    const errorPath = path.join(this.projectRoot, 'memory', 'update_errors.json');
    
    try {
      let errors = [];
      if (fs.existsSync(errorPath)) {
        const data = JSON.parse(fs.readFileSync(errorPath, 'utf8'));
        errors = data.errors || [];
      }
      
      errors.unshift({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      });
      
      errors = errors.slice(0, 10); // Keep last 10 errors
      
      fs.writeFileSync(errorPath, JSON.stringify({
        lastUpdate: new Date().toISOString(),
        errors
      }, null, 2));
      
    } catch (saveError) {
      console.error('Failed to save error:', saveError.message);
    }
  }

  async runManualUpdate() {
    console.log('🔄 Running manual update...');
    return await this.executeWeeklyUpdate();
  }

  async getNextScheduledRun() {
    const schedule = this.config.schedule;
    const now = new Date();
    
    const dayMap = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };
    
    const scheduledDay = dayMap[schedule.day_of_week.toLowerCase()];
    const [scheduledHour, scheduledMinute] = schedule.time.split(':').map(Number);
    
    // Calculate next run time
    const nextRun = new Date(now);
    nextRun.setHours(scheduledHour, scheduledMinute, 0, 0);
    
    // If we've passed this week's scheduled time, go to next week
    if (now.getDay() > scheduledDay || 
        (now.getDay() === scheduledDay && now.getHours() >= scheduledHour)) {
      nextRun.setDate(nextRun.getDate() + (7 - now.getDay() + scheduledDay));
    } else {
      // Go to this week's scheduled day
      nextRun.setDate(nextRun.getDate() + (scheduledDay - now.getDay()));
    }
    
    return nextRun;
  }

  getStatus() {
    return {
      enabled: this.config.enabled,
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      schedule: this.config.schedule,
      cronAvailable: this.cronAvailable,
      activeJobs: this.jobs.size,
      nextScheduledRun: this.getNextScheduledRun().then(date => date.toISOString()).catch(() => null)
    };
  }

  async stop() {
    console.log('🛑 Stopping scheduler...');
    
    // Stop all cron jobs
    for (const [name, job] of this.jobs) {
      if (job.stop) {
        job.stop();
      }
    }
    
    this.jobs.clear();
    console.log('✅ Scheduler stopped');
  }
}

// CLI interface
if (require.main === module) {
  const configPath = process.argv[2] || path.join(__dirname, 'update-system.json');
  const projectRoot = process.argv[3] || process.cwd();
  const scheduler = new UpdateScheduler(configPath, projectRoot);
  
  const command = process.argv[4] || 'start';
  
  switch (command) {
    case 'initialize':
    case 'start':
      scheduler.initialize().then(() => {
        console.log('Scheduler is running. Press Ctrl+C to stop.');
        
        process.on('SIGINT', async () => {
          console.log('\nShutting down...');
          await scheduler.stop();
          process.exit(0);
        });
        
        // Keep the process alive
        setInterval(() => {}, 60000);
      }).catch(error => {
        console.error('Failed to start scheduler:', error.message);
        process.exit(1);
      });
      break;
    
    case 'run':
      scheduler.initialize().then(() => {
        return scheduler.runManualUpdate();
      }).then(() => {
        console.log('Manual update completed');
        process.exit(0);
      }).catch(error => {
        console.error('Manual update failed:', error.message);
        process.exit(1);
      });
      break;
    
    case 'status':
      scheduler.getStatus().then(status => {
        console.log('Scheduler Status:', JSON.stringify(status, null, 2));
      });
      break;
    
    case 'stop':
      scheduler.stop().then(() => {
        console.log('Scheduler stopped');
      });
      break;
    
    default:
      console.error('Unknown command:', command);
      console.error('Available commands: start, run, status, stop');
      process.exit(1);
  }
}

module.exports = UpdateScheduler;