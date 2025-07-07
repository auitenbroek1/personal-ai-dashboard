#!/usr/bin/env node

/**
 * Discord Webhook Integration for Claude-Flow
 * Sends notifications about AI agent activities, updates, and system status
 */

class DiscordIntegration {
  constructor(configPath, projectRoot) {
    this.configPath = configPath;
    this.projectRoot = projectRoot;
    this.config = this.loadConfig();
    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL || this.config.discord?.webhook_url;
  }

  loadConfig() {
    try {
      const fs = require('fs');
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      return config.automatedUpdateSystem?.integrations?.discord || {};
    } catch (error) {
      console.error('Failed to load Discord config:', error.message);
      return {};
    }
  }

  async sendNotification(notification) {
    if (!this.webhookUrl) {
      console.log('Discord webhook not configured - skipping Discord notification');
      return { sent: false, reason: 'webhook_not_configured' };
    }

    const embed = this.createEmbed(notification);
    
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'Claude-Flow Bot',
          avatar_url: 'https://claude.ai/favicon.ico',
          embeds: [embed]
        })
      });

      if (response.ok) {
        return { sent: true, timestamp: new Date().toISOString() };
      } else {
        throw new Error(`Discord API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send Discord notification:', error.message);
      return { sent: false, error: error.message };
    }
  }

  createEmbed(notification) {
    const colors = {
      'security_critical': 0xFF0000,    // Red
      'breaking_changes': 0xFF6600,     // Orange  
      'weekly_summary': 0x0099FF,       // Blue
      'approval_required': 0xFFFF00,    // Yellow
      'success': 0x00FF00,              // Green
      'info': 0x888888                  // Gray
    };

    const color = colors[notification.type] || colors.info;
    
    const embed = {
      title: `🤖 ${notification.title}`,
      description: notification.message,
      color: color,
      timestamp: notification.timestamp,
      footer: {
        text: 'Claude-Flow Automated Update System',
        icon_url: 'https://claude.ai/favicon.ico'
      },
      fields: []
    };

    // Add priority field
    if (notification.priority) {
      embed.fields.push({
        name: '⚡ Priority',
        value: notification.priority.toUpperCase(),
        inline: true
      });
    }

    // Add details if available
    if (notification.details && Array.isArray(notification.details)) {
      const detailsText = notification.details
        .slice(0, 3)
        .map((detail, index) => `${index + 1}. ${detail.title || detail.summary || 'Update item'}`)
        .join('\n');
      
      embed.fields.push({
        name: '📋 Details',
        value: detailsText + (notification.details.length > 3 ? `\n... and ${notification.details.length - 3} more` : ''),
        inline: false
      });
    }

    // Add approval info if needed
    if (notification.requires_approval) {
      embed.fields.push({
        name: '⚠️ Action Required',
        value: 'This update requires your approval',
        inline: true
      });

      if (notification.approval_deadline) {
        const deadline = new Date(notification.approval_deadline).toLocaleString();
        embed.fields.push({
          name: '⏰ Deadline',
          value: deadline,
          inline: true
        });
      }
    }

    return embed;
  }

  async sendAgentNotification(agentType, action, details) {
    const notification = {
      type: 'agent_activity',
      title: `SPARC Agent ${agentType} - ${action}`,
      message: `AI Agent activity: ${agentType} agent ${action}`,
      details: details ? [{ summary: details }] : [],
      priority: 'normal',
      timestamp: new Date().toISOString()
    };

    return await this.sendNotification(notification);
  }

  async sendSwarmNotification(swarmSize, objective, status) {
    const notification = {
      type: 'swarm_activity',
      title: `🐝 Swarm Coordination - ${status}`,
      message: `Swarm of ${swarmSize} agents ${status}: ${objective}`,
      priority: swarmSize > 5 ? 'high' : 'normal',
      timestamp: new Date().toISOString()
    };

    return await this.sendNotification(notification);
  }

  async sendSystemHealthNotification(health) {
    const notification = {
      type: health.status === 'operational' ? 'success' : 'warning',
      title: `🏥 System Health: ${health.status.toUpperCase()}`,
      message: `Claude-Flow system status: ${health.summary}`,
      details: health.metrics ? Object.entries(health.metrics).map(([key, value]) => ({
        summary: `${key}: ${value}`
      })) : [],
      priority: health.status === 'operational' ? 'normal' : 'high',
      timestamp: new Date().toISOString()
    };

    return await this.sendNotification(notification);
  }

  async testWebhook() {
    const testNotification = {
      type: 'info',
      title: 'Discord Integration Test',
      message: 'Claude-Flow Discord integration is working correctly! 🎉',
      priority: 'normal',
      timestamp: new Date().toISOString()
    };

    return await this.sendNotification(testNotification);
  }

  getStatus() {
    return {
      enabled: !!this.webhookUrl,
      webhook_configured: !!this.webhookUrl,
      config_loaded: Object.keys(this.config).length > 0
    };
  }
}

// CLI interface
if (require.main === module) {
  const path = require('path');
  const configPath = process.argv[2] || path.join(__dirname, '..', 'automation', 'update-system.json');
  const projectRoot = process.argv[3] || process.cwd();
  const discord = new DiscordIntegration(configPath, projectRoot);
  
  const command = process.argv[4] || 'status';
  
  switch (command) {
    case 'test':
      discord.testWebhook().then(result => {
        console.log('Discord Test Result:', JSON.stringify(result, null, 2));
      }).catch(error => {
        console.error('Discord test failed:', error.message);
        process.exit(1);
      });
      break;
    
    case 'status':
      console.log('Discord Integration Status:', JSON.stringify(discord.getStatus(), null, 2));
      break;
    
    case 'agent':
      const agentType = process.argv[5] || 'coder';
      const action = process.argv[6] || 'started';
      const details = process.argv[7] || '';
      
      discord.sendAgentNotification(agentType, action, details).then(result => {
        console.log('Agent Notification Result:', JSON.stringify(result, null, 2));
      });
      break;
    
    case 'swarm':
      const size = parseInt(process.argv[5]) || 3;
      const objective = process.argv[6] || 'test objective';
      const status = process.argv[7] || 'started';
      
      discord.sendSwarmNotification(size, objective, status).then(result => {
        console.log('Swarm Notification Result:', JSON.stringify(result, null, 2));
      });
      break;
    
    default:
      console.error('Unknown command:', command);
      console.error('Available commands: test, status, agent, swarm');
      process.exit(1);
  }
}

module.exports = DiscordIntegration;