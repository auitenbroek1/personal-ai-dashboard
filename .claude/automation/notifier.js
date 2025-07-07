#!/usr/bin/env node

/**
 * Notification and Approval Workflow System
 * Handles notifications and approval workflows for updates
 */

const fs = require('fs');
const path = require('path');

class NotificationSystem {
  constructor(configPath, projectRoot) {
    this.configPath = configPath;
    this.projectRoot = projectRoot;
    this.config = this.loadConfig();
    this.notificationQueue = [];
    this.approvalQueue = [];
    this.channels = new Map();
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
      update_actions: {
        notification_triggers: {},
        auto_update: { enabled: false }
      }
    };
  }

  async initialize() {
    if (!this.config.enabled) {
      console.log('Notification system is disabled');
      return;
    }

    console.log('🚀 Initializing Notification System...');
    
    await this.setupNotificationChannels();
    await this.loadPendingNotifications();
    
    console.log('✅ Notification system initialized');
  }

  async setupNotificationChannels() {
    // Console channel (always available)
    this.channels.set('console', {
      name: 'Console Output',
      enabled: true,
      send: this.sendConsoleNotification.bind(this)
    });
    
    // File channel
    this.channels.set('file', {
      name: 'File Logging',
      enabled: true,
      send: this.sendFileNotification.bind(this)
    });
    
    // Memory channel (store in claude-flow memory)
    this.channels.set('memory', {
      name: 'Memory Storage',
      enabled: true,
      send: this.sendMemoryNotification.bind(this)
    });
    
    // Email channel (simulated - would require email service)
    this.channels.set('email', {
      name: 'Email Notifications',
      enabled: false, // Disabled by default as it requires email configuration
      send: this.sendEmailNotification.bind(this)
    });
    
    // Interactive channel (for approval workflows)
    this.channels.set('interactive', {
      name: 'Interactive Approval',
      enabled: true,
      send: this.sendInteractiveNotification.bind(this)
    });
    
    console.log(`📢 ${this.channels.size} notification channels configured`);
  }

  async loadPendingNotifications() {
    const notificationsPath = path.join(this.projectRoot, 'memory', 'pending_notifications.json');
    
    try {
      if (fs.existsSync(notificationsPath)) {
        const data = JSON.parse(fs.readFileSync(notificationsPath, 'utf8'));
        this.notificationQueue = data.notifications || [];
        this.approvalQueue = data.approvals || [];
        console.log(`📋 Loaded ${this.notificationQueue.length} pending notifications and ${this.approvalQueue.length} pending approvals`);
      }
    } catch (error) {
      console.warn('Failed to load pending notifications:', error.message);
    }
  }

  async savePendingNotifications() {
    const notificationsPath = path.join(this.projectRoot, 'memory', 'pending_notifications.json');
    
    try {
      const data = {
        timestamp: new Date().toISOString(),
        notifications: this.notificationQueue,
        approvals: this.approvalQueue
      };
      
      fs.writeFileSync(notificationsPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save pending notifications:', error.message);
    }
  }

  async sendUpdateNotifications(updateResults) {
    console.log('📢 Processing update notifications...');
    
    const notifications = this.analyzeUpdateResults(updateResults);
    
    for (const notification of notifications) {
      await this.sendNotification(notification);
    }
    
    await this.savePendingNotifications();
    
    return {
      notifications_sent: notifications.length,
      channels_used: [...new Set(notifications.map(n => n.channels).flat())],
      approvals_required: notifications.filter(n => n.requires_approval).length
    };
  }

  analyzeUpdateResults(updateResults) {
    const notifications = [];
    const triggers = this.config.update_actions?.notification_triggers || {};
    
    // Check for immediate notifications
    if (triggers.immediate) {
      const immediateNotifications = this.checkImmediateTriggers(updateResults, triggers.immediate);
      notifications.push(...immediateNotifications);
    }
    
    // Generate weekly summary notification
    if (triggers.weekly_summary) {
      const summaryNotification = this.createWeeklySummaryNotification(updateResults, triggers.weekly_summary);
      notifications.push(summaryNotification);
    }
    
    // Check for approval required notifications
    if (triggers.approval_required) {
      const approvalNotifications = this.checkApprovalTriggers(updateResults, triggers.approval_required);
      notifications.push(...approvalNotifications);
    }
    
    return notifications;
  }

  checkImmediateTriggers(updateResults, triggerConfig) {
    const notifications = [];
    const conditions = triggerConfig.conditions || [];
    
    // Check for security critical updates
    if (conditions.includes('security_critical')) {
      const securityUpdates = this.findSecurityUpdates(updateResults);
      
      if (securityUpdates.length > 0) {
        notifications.push({
          id: `security_critical_${Date.now()}`,
          type: 'security_critical',
          priority: 'critical',
          title: 'Critical Security Updates Available',
          message: `${securityUpdates.length} critical security updates require immediate attention`,
          details: securityUpdates,
          channels: triggerConfig.channels || ['console', 'file', 'memory'],
          requires_approval: false,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Check for breaking changes
    if (conditions.includes('breaking_changes')) {
      const breakingChanges = this.findBreakingChanges(updateResults);
      
      if (breakingChanges.length > 0) {
        notifications.push({
          id: `breaking_changes_${Date.now()}`,
          type: 'breaking_changes',
          priority: 'high',
          title: 'Breaking Changes Detected',
          message: `${breakingChanges.length} breaking changes detected that may impact system compatibility`,
          details: breakingChanges,
          channels: triggerConfig.channels || ['console', 'file', 'memory'],
          requires_approval: true,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return notifications;
  }

  createWeeklySummaryNotification(updateResults, triggerConfig) {
    const analysisStep = updateResults.pipeline_steps?.find(step => step.step === 'update_analysis');
    const analysis = analysisStep?.result || {};
    
    const totalUpdates = (analysis.github_updates?.total_updates || 0) + 
                        (analysis.sparc_updates?.total_changes || 0);
    
    const recommendations = analysis.recommendations || [];
    const criticalRecs = recommendations.filter(r => r.priority >= 90);
    
    return {
      id: `weekly_summary_${Date.now()}`,
      type: 'weekly_summary',
      priority: 'normal',
      title: 'Weekly Update Summary',
      message: `Weekly update scan complete: ${totalUpdates} updates found, ${recommendations.length} recommendations generated`,
      details: {
        total_updates: totalUpdates,
        recommendations_count: recommendations.length,
        critical_items: criticalRecs.length,
        risk_level: analysis.risk_assessment?.overall_risk || 'unknown',
        productivity_impact: analysis.impact_summary?.productivity_impact || 'neutral'
      },
      channels: triggerConfig.channels || ['console', 'memory'],
      requires_approval: false,
      timestamp: new Date().toISOString()
    };
  }

  checkApprovalTriggers(updateResults, triggerConfig) {
    const notifications = [];
    const conditions = triggerConfig.conditions || [];
    
    const analysisStep = updateResults.pipeline_steps?.find(step => step.step === 'update_analysis');
    const analysis = analysisStep?.result || {};
    const recommendations = analysis.recommendations || [];
    
    // Check for major features requiring approval
    if (conditions.includes('major_features')) {
      const majorFeatures = recommendations.filter(r => 
        r.type === 'feature_update' && r.priority >= 70
      );
      
      if (majorFeatures.length > 0) {
        notifications.push({
          id: `major_features_approval_${Date.now()}`,
          type: 'approval_required',
          priority: 'high',
          title: 'Major Features Awaiting Approval',
          message: `${majorFeatures.length} major feature updates are available and require your approval`,
          details: majorFeatures,
          channels: triggerConfig.channels || ['console', 'interactive'],
          requires_approval: true,
          approval_deadline: this.calculateApprovalDeadline('1 week'),
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Check for breaking changes requiring approval
    if (conditions.includes('breaking_changes')) {
      const breakingRecs = recommendations.filter(r => 
        r.risk_level === 'high' || r.action === 'careful_review'
      );
      
      if (breakingRecs.length > 0) {
        notifications.push({
          id: `breaking_approval_${Date.now()}`,
          type: 'approval_required',
          priority: 'critical',
          title: 'Breaking Changes Require Approval',
          message: `${breakingRecs.length} potentially breaking changes require careful review and approval`,
          details: breakingRecs,
          channels: triggerConfig.channels || ['console', 'interactive'],
          requires_approval: true,
          approval_deadline: this.calculateApprovalDeadline('3 days'),
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return notifications;
  }

  findSecurityUpdates(updateResults) {
    const securityUpdates = [];
    
    // Check GitHub monitoring results
    const githubStep = updateResults.pipeline_steps?.find(step => step.step === 'github_monitoring');
    if (githubStep?.result?.repositories) {
      for (const repo of githubStep.result.repositories) {
        const securityReleases = repo.updates?.filter(update => 
          update.description?.toLowerCase().includes('security') ||
          update.description?.toLowerCase().includes('vulnerability') ||
          update.title?.toLowerCase().includes('security')
        ) || [];
        
        securityUpdates.push(...securityReleases.map(update => ({
          ...update,
          source: repo.repo,
          type: 'security_release'
        })));
      }
    }
    
    return securityUpdates;
  }

  findBreakingChanges(updateResults) {
    const breakingChanges = [];
    
    // Check analysis results for breaking changes
    const analysisStep = updateResults.pipeline_steps?.find(step => step.step === 'update_analysis');
    if (analysisStep?.result?.github_updates?.classified_updates) {
      const breaking = analysisStep.result.github_updates.classified_updates.filter(
        update => update.category === 'breaking_changes'
      );
      
      breakingChanges.push(...breaking);
    }
    
    return breakingChanges;
  }

  calculateApprovalDeadline(timeframe) {
    const now = new Date();
    
    switch (timeframe) {
      case '3 days':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
      case '1 week':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case '2 weeks':
        return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  async sendNotification(notification) {
    console.log(`📢 Sending notification: ${notification.title}`);
    
    const channels = notification.channels || ['console'];
    const results = [];
    
    for (const channelName of channels) {
      const channel = this.channels.get(channelName);
      
      if (channel && channel.enabled) {
        try {
          const result = await channel.send(notification);
          results.push({ channel: channelName, status: 'success', result });
        } catch (error) {
          console.error(`Failed to send notification via ${channelName}:`, error.message);
          results.push({ channel: channelName, status: 'failed', error: error.message });
        }
      } else {
        console.warn(`Channel ${channelName} is not available or disabled`);
      }
    }
    
    // Add to queue if requires approval
    if (notification.requires_approval) {
      this.approvalQueue.push({
        ...notification,
        status: 'pending',
        sent_results: results
      });
    } else {
      this.notificationQueue.push({
        ...notification,
        status: 'sent',
        sent_results: results
      });
    }
    
    return results;
  }

  // Notification channel implementations
  async sendConsoleNotification(notification) {
    const priority = notification.priority?.toUpperCase() || 'INFO';
    const timestamp = new Date(notification.timestamp).toLocaleString();
    
    console.log(`\n🔔 ${priority} NOTIFICATION [${timestamp}]`);
    console.log(`📋 ${notification.title}`);
    console.log(`💬 ${notification.message}`);
    
    if (notification.details && Array.isArray(notification.details)) {
      console.log('📊 Details:');
      notification.details.slice(0, 3).forEach((detail, index) => {
        console.log(`   ${index + 1}. ${detail.title || detail.summary || 'Update item'}`);
      });
      
      if (notification.details.length > 3) {
        console.log(`   ... and ${notification.details.length - 3} more items`);
      }
    }
    
    if (notification.requires_approval) {
      console.log('⚠️  This notification requires your approval');
      if (notification.approval_deadline) {
        const deadline = new Date(notification.approval_deadline).toLocaleString();
        console.log(`⏰ Approval deadline: ${deadline}`);
      }
    }
    
    console.log('─'.repeat(60));
    
    return { delivered: true, timestamp: new Date().toISOString() };
  }

  async sendFileNotification(notification) {
    const logPath = path.join(this.projectRoot, 'logs', 'notifications.log');
    
    // Create logs directory if it doesn't exist
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: notification.type,
      priority: notification.priority,
      title: notification.title,
      message: notification.message,
      requires_approval: notification.requires_approval,
      approval_deadline: notification.approval_deadline,
      details_count: Array.isArray(notification.details) ? notification.details.length : 0
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      fs.appendFileSync(logPath, logLine);
      return { logged: true, path: logPath };
    } catch (error) {
      throw new Error(`Failed to write to log file: ${error.message}`);
    }
  }

  async sendMemoryNotification(notification) {
    const memoryPath = path.join(this.projectRoot, 'memory', `notification_${notification.id}.json`);
    
    try {
      const memoryEntry = {
        ...notification,
        stored_at: new Date().toISOString(),
        status: notification.requires_approval ? 'pending_approval' : 'notified'
      };
      
      fs.writeFileSync(memoryPath, JSON.stringify(memoryEntry, null, 2));
      return { stored: true, path: memoryPath };
    } catch (error) {
      throw new Error(`Failed to store in memory: ${error.message}`);
    }
  }

  async sendEmailNotification(notification) {
    // Simulated email notification
    // In a real implementation, this would integrate with an email service
    
    console.log(`📧 [SIMULATED] Email notification sent: ${notification.title}`);
    
    return {
      email_sent: true,
      recipient: 'user@example.com',
      subject: notification.title,
      simulated: true
    };
  }

  async sendInteractiveNotification(notification) {
    // Interactive notification for approval workflows
    // This creates a prompt that can be checked by the user
    
    const promptPath = path.join(this.projectRoot, 'memory', 'approval_prompts.json');
    
    try {
      let prompts = [];
      if (fs.existsSync(promptPath)) {
        const data = JSON.parse(fs.readFileSync(promptPath, 'utf8'));
        prompts = data.prompts || [];
      }
      
      const prompt = {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        details: notification.details,
        created_at: new Date().toISOString(),
        deadline: notification.approval_deadline,
        status: 'awaiting_response',
        response: null
      };
      
      prompts.push(prompt);
      
      // Keep only last 10 prompts
      prompts = prompts.slice(-10);
      
      fs.writeFileSync(promptPath, JSON.stringify({
        updated_at: new Date().toISOString(),
        prompts
      }, null, 2));
      
      return {
        prompt_created: true,
        prompt_id: notification.id,
        check_path: promptPath
      };
      
    } catch (error) {
      throw new Error(`Failed to create interactive prompt: ${error.message}`);
    }
  }

  async checkApprovalStatus() {
    console.log('🔍 Checking approval status...');
    
    const promptPath = path.join(this.projectRoot, 'memory', 'approval_prompts.json');
    
    if (!fs.existsSync(promptPath)) {
      return { pending: 0, approved: 0, rejected: 0 };
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(promptPath, 'utf8'));
      const prompts = data.prompts || [];
      
      const status = {
        pending: prompts.filter(p => p.status === 'awaiting_response').length,
        approved: prompts.filter(p => p.status === 'approved').length,
        rejected: prompts.filter(p => p.status === 'rejected').length,
        expired: prompts.filter(p => 
          p.deadline && new Date(p.deadline) < new Date() && p.status === 'awaiting_response'
        ).length
      };
      
      return status;
      
    } catch (error) {
      console.error('Failed to check approval status:', error.message);
      return { error: error.message };
    }
  }

  async approveUpdate(promptId, approved = true, comment = '') {
    const promptPath = path.join(this.projectRoot, 'memory', 'approval_prompts.json');
    
    if (!fs.existsSync(promptPath)) {
      throw new Error('No approval prompts found');
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(promptPath, 'utf8'));
      const prompts = data.prompts || [];
      
      const promptIndex = prompts.findIndex(p => p.id === promptId);
      if (promptIndex === -1) {
        throw new Error(`Prompt ${promptId} not found`);
      }
      
      const prompt = prompts[promptIndex];
      prompt.status = approved ? 'approved' : 'rejected';
      prompt.response = {
        approved,
        comment,
        responded_at: new Date().toISOString()
      };
      
      fs.writeFileSync(promptPath, JSON.stringify({
        updated_at: new Date().toISOString(),
        prompts
      }, null, 2));
      
      console.log(`✅ Update ${approved ? 'approved' : 'rejected'}: ${promptId}`);
      
      return {
        promptId,
        approved,
        comment,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      throw new Error(`Failed to process approval: ${error.message}`);
    }
  }

  getStatus() {
    return {
      enabled: this.config.enabled,
      channels: {
        total: this.channels.size,
        enabled: Array.from(this.channels.values()).filter(c => c.enabled).length,
        available: Array.from(this.channels.keys())
      },
      queues: {
        notifications: this.notificationQueue.length,
        approvals: this.approvalQueue.length
      },
      configuration: {
        immediate_triggers: this.config.update_actions?.notification_triggers?.immediate?.enabled || false,
        weekly_summary: this.config.update_actions?.notification_triggers?.weekly_summary?.enabled || false,
        approval_workflow: this.config.update_actions?.notification_triggers?.approval_required?.enabled || false
      }
    };
  }
}

// CLI interface
if (require.main === module) {
  const configPath = process.argv[2] || path.join(__dirname, 'update-system.json');
  const projectRoot = process.argv[3] || process.cwd();
  const notifier = new NotificationSystem(configPath, projectRoot);
  
  const command = process.argv[4] || 'status';
  
  switch (command) {
    case 'initialize':
      notifier.initialize();
      break;
    
    case 'test':
      notifier.initialize().then(() => {
        // Send a test notification
        const testNotification = {
          id: `test_${Date.now()}`,
          type: 'test',
          priority: 'normal',
          title: 'Test Notification',
          message: 'This is a test notification from the Claude-Flow update system',
          channels: ['console', 'file', 'memory'],
          requires_approval: false,
          timestamp: new Date().toISOString()
        };
        
        return notifier.sendNotification(testNotification);
      }).then(results => {
        console.log('Test Notification Results:', JSON.stringify(results, null, 2));
      }).catch(error => {
        console.error('Test notification failed:', error.message);
        process.exit(1);
      });
      break;
    
    case 'approval-status':
      notifier.checkApprovalStatus().then(status => {
        console.log('Approval Status:', JSON.stringify(status, null, 2));
      });
      break;
    
    case 'approve':
      const promptId = process.argv[5];
      const approved = process.argv[6] !== 'false';
      const comment = process.argv[7] || '';
      
      if (!promptId) {
        console.error('Usage: node notifier.js <config> <project> approve <prompt-id> [true|false] [comment]');
        process.exit(1);
      }
      
      notifier.approveUpdate(promptId, approved, comment).then(result => {
        console.log('Approval Result:', JSON.stringify(result, null, 2));
      }).catch(error => {
        console.error('Approval failed:', error.message);
        process.exit(1);
      });
      break;
    
    case 'status':
      console.log('Notification System Status:', JSON.stringify(notifier.getStatus(), null, 2));
      break;
    
    default:
      console.error('Unknown command:', command);
      console.error('Available commands: initialize, test, approval-status, approve, status');
      process.exit(1);
  }
}

module.exports = NotificationSystem;