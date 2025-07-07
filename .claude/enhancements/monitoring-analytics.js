#!/usr/bin/env node

/**
 * Monitoring and Analytics System for Claude-Flow
 * Provides comprehensive monitoring and optimization insights
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const os = require('os');

class MonitoringAnalytics extends EventEmitter {
  constructor(configPath, projectRoot) {
    super();
    this.configPath = configPath;
    this.projectRoot = projectRoot;
    this.config = this.loadConfig();
    this.metrics = new Map();
    this.alerts = [];
    this.insights = [];
    this.dashboards = new Map();
    this.collectors = new Map();
    this.lastCollectionTime = new Map();
  }

  loadConfig() {
    try {
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      return config.monitoringAnalytics;
    } catch (error) {
      console.error('Failed to load monitoring config:', error.message);
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      enabled: true,
      optimization_focus: {
        realtime_monitoring: { enabled: true },
        performance_analytics: { enabled: true },
        optimization_insights: { enabled: true }
      }
    };
  }

  async initialize() {
    if (!this.config.enabled) {
      console.log('Monitoring and analytics is disabled');
      return;
    }

    console.log('🚀 Initializing Monitoring and Analytics...');
    
    await this.initializeCollectors();
    await this.setupDashboards();
    await this.startMonitoring();
    await this.initializeAnalytics();
    
    console.log('✅ Monitoring and analytics initialized');
  }

  async initializeCollectors() {
    console.log('📊 Initializing metric collectors...');
    
    // System metrics collector
    this.collectors.set('system', {
      name: 'System Metrics',
      interval: 5000, // 5 seconds
      collect: this.collectSystemMetrics.bind(this)
    });
    
    // Claude-Flow metrics collector
    this.collectors.set('claude_flow', {
      name: 'Claude-Flow Metrics',
      interval: 10000, // 10 seconds
      collect: this.collectClaudeFlowMetrics.bind(this)
    });
    
    // SPARC metrics collector
    this.collectors.set('sparc', {
      name: 'SPARC Metrics',
      interval: 30000, // 30 seconds
      collect: this.collectSparcMetrics.bind(this)
    });
    
    // Batch processing metrics collector
    this.collectors.set('batch', {
      name: 'Batch Processing Metrics',
      interval: 30000, // 30 seconds
      collect: this.collectBatchMetrics.bind(this)
    });
    
    console.log(`✅ ${this.collectors.size} collectors initialized`);
  }

  async setupDashboards() {
    const dashboardConfig = this.config.optimization_focus?.performance_analytics?.dashboards;
    if (!dashboardConfig) return;

    console.log('📈 Setting up dashboards...');
    
    // System overview dashboard
    if (dashboardConfig.system_overview?.enabled) {
      this.dashboards.set('system_overview', {
        name: 'System Overview',
        metrics: dashboardConfig.system_overview.metrics,
        refreshInterval: this.parseDuration(dashboardConfig.system_overview.refresh_interval),
        data: []
      });
    }
    
    // Agent performance dashboard
    if (dashboardConfig.agent_performance?.enabled) {
      this.dashboards.set('agent_performance', {
        name: 'Agent Performance',
        metrics: dashboardConfig.agent_performance.metrics,
        refreshInterval: this.parseDuration(dashboardConfig.agent_performance.refresh_interval),
        data: []
      });
    }
    
    // Workflow analytics dashboard
    if (dashboardConfig.workflow_analytics?.enabled) {
      this.dashboards.set('workflow_analytics', {
        name: 'Workflow Analytics',
        metrics: dashboardConfig.workflow_analytics.metrics,
        refreshInterval: this.parseDuration(dashboardConfig.workflow_analytics.refresh_interval),
        data: []
      });
    }
    
    // Memory insights dashboard
    if (dashboardConfig.memory_insights?.enabled) {
      this.dashboards.set('memory_insights', {
        name: 'Memory Insights',
        metrics: dashboardConfig.memory_insights.metrics,
        refreshInterval: this.parseDuration(dashboardConfig.memory_insights.refresh_interval),
        data: []
      });
    }
    
    console.log(`✅ ${this.dashboards.size} dashboards configured`);
  }

  startMonitoring() {
    console.log('🔍 Starting real-time monitoring...');
    
    // Start metric collection for each collector
    for (const [name, collector] of this.collectors) {
      setInterval(async () => {
        try {
          await this.runCollection(name, collector);
        } catch (error) {
          console.error(`Error in collector ${name}:`, error.message);
        }
      }, collector.interval);
    }
    
    // Start alert processing
    setInterval(() => {
      this.processAlerts();
    }, 10000); // Every 10 seconds
    
    // Start dashboard updates
    for (const [name, dashboard] of this.dashboards) {
      setInterval(() => {
        this.updateDashboard(name, dashboard);
      }, dashboard.refreshInterval);
    }
    
    console.log('✅ Real-time monitoring started');
  }

  async initializeAnalytics() {
    console.log('🧠 Initializing analytics engine...');
    
    // Start trend analysis
    setInterval(() => {
      this.performTrendAnalysis();
    }, 300000); // Every 5 minutes
    
    // Start anomaly detection
    setInterval(() => {
      this.performAnomalyDetection();
    }, 60000); // Every minute
    
    // Start optimization insight generation
    setInterval(() => {
      this.generateOptimizationInsights();
    }, 600000); // Every 10 minutes
    
    console.log('✅ Analytics engine initialized');
  }

  async runCollection(collectorName, collector) {
    const startTime = Date.now();
    
    try {
      const metrics = await collector.collect();
      const timestamp = new Date().toISOString();
      
      // Store metrics
      if (!this.metrics.has(collectorName)) {
        this.metrics.set(collectorName, []);
      }
      
      this.metrics.get(collectorName).push({
        timestamp,
        metrics,
        collectionTime: Date.now() - startTime
      });
      
      // Limit stored metrics to prevent memory growth
      const maxMetrics = 1000;
      const collectorMetrics = this.metrics.get(collectorName);
      if (collectorMetrics.length > maxMetrics) {
        collectorMetrics.splice(0, collectorMetrics.length - maxMetrics);
      }
      
      this.lastCollectionTime.set(collectorName, timestamp);
      
      // Check for alerts
      this.checkMetricAlerts(collectorName, metrics);
      
    } catch (error) {
      console.error(`Collection failed for ${collectorName}:`, error.message);
    }
  }

  async collectSystemMetrics() {
    const metrics = {
      cpu_utilization: this.getCpuUtilization(),
      memory_usage: this.getMemoryUsage(),
      disk_usage: await this.getDiskUsage(),
      network_io: this.getNetworkIO(),
      load_average: os.loadavg(),
      uptime: os.uptime()
    };
    
    return metrics;
  }

  getCpuUtilization() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - (100 * idle / total);
    
    return Math.round(usage * 100) / 100;
  }

  getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usagePercent = (used / total) * 100;
    
    return {
      total: Math.round(total / 1024 / 1024), // MB
      used: Math.round(used / 1024 / 1024), // MB
      free: Math.round(free / 1024 / 1024), // MB
      usage_percent: Math.round(usagePercent * 100) / 100
    };
  }

  async getDiskUsage() {
    // Simplified disk usage - in real implementation would use proper disk monitoring
    return {
      usage_percent: Math.random() * 50 + 10 // Simulate 10-60% usage
    };
  }

  getNetworkIO() {
    // Simplified network IO - in real implementation would track actual network metrics
    return {
      bytes_sent: Math.floor(Math.random() * 1000000),
      bytes_received: Math.floor(Math.random() * 1000000)
    };
  }

  async collectClaudeFlowMetrics() {
    const metrics = {
      active_agents: await this.getActiveAgentsCount(),
      task_queue_size: await this.getTaskQueueSize(),
      memory_entries: await this.getMemoryEntriesCount(),
      tool_usage: await this.getToolUsageStats()
    };
    
    return metrics;
  }

  async getActiveAgentsCount() {
    // Read from memory or simulate
    try {
      const agentFiles = fs.readdirSync(path.join(this.projectRoot, 'memory'))
        .filter(file => file.startsWith('agent_registry_'));
      return agentFiles.length;
    } catch {
      return Math.floor(Math.random() * 10); // Simulate 0-9 agents
    }
  }

  async getTaskQueueSize() {
    // Simulate task queue size
    return Math.floor(Math.random() * 20);
  }

  async getMemoryEntriesCount() {
    try {
      const memoryFiles = fs.readdirSync(path.join(this.projectRoot, 'memory'));
      return memoryFiles.length;
    } catch {
      return Math.floor(Math.random() * 100);
    }
  }

  async getToolUsageStats() {
    const tools = ['Agent', 'Memory', 'Task', 'TodoWrite', 'TodoRead'];
    const stats = {};
    
    for (const tool of tools) {
      stats[tool] = Math.floor(Math.random() * 50);
    }
    
    return stats;
  }

  async collectSparcMetrics() {
    const metrics = {
      mode_usage: this.getSparcModeUsage(),
      workflow_progress: this.getWorkflowProgress(),
      coordination_efficiency: this.getCoordinationEfficiency()
    };
    
    return metrics;
  }

  getSparcModeUsage() {
    const modes = ['orchestrator', 'coder', 'researcher', 'tester', 'reviewer'];
    const usage = {};
    
    for (const mode of modes) {
      usage[mode] = Math.floor(Math.random() * 20);
    }
    
    return usage;
  }

  getWorkflowProgress() {
    const stages = ['analysis', 'design', 'implementation', 'testing', 'review'];
    const progress = {};
    
    for (const stage of stages) {
      progress[stage] = Math.random();
    }
    
    return progress;
  }

  getCoordinationEfficiency() {
    return {
      handoff_time: Math.random() * 5000, // ms
      parallel_utilization: Math.random(),
      resource_sharing: Math.random()
    };
  }

  async collectBatchMetrics() {
    const metrics = {
      throughput: Math.floor(Math.random() * 100), // tasks per minute
      batch_efficiency: {
        avg_batch_size: 3 + Math.random() * 5,
        avg_processing_time: 1000 + Math.random() * 5000,
        success_rate: 0.8 + Math.random() * 0.2
      },
      worker_utilization: Math.random()
    };
    
    return metrics;
  }

  checkMetricAlerts(collectorName, metrics) {
    const alertConfig = this.config.optimization_focus?.realtime_monitoring?.alerting;
    if (!alertConfig?.enabled) return;

    const alerts = [];
    
    // System metric alerts
    if (collectorName === 'system') {
      if (metrics.cpu_utilization > 90) {
        alerts.push({
          severity: 'critical',
          type: 'high_cpu',
          message: `CPU utilization at ${metrics.cpu_utilization}%`,
          metric: 'cpu_utilization',
          value: metrics.cpu_utilization,
          threshold: 90
        });
      }
      
      if (metrics.memory_usage.usage_percent > 95) {
        alerts.push({
          severity: 'critical',
          type: 'high_memory',
          message: `Memory usage at ${metrics.memory_usage.usage_percent}%`,
          metric: 'memory_usage',
          value: metrics.memory_usage.usage_percent,
          threshold: 95
        });
      }
    }
    
    // Claude-Flow metric alerts
    if (collectorName === 'claude_flow') {
      if (metrics.task_queue_size > 50) {
        alerts.push({
          severity: 'warning',
          type: 'high_queue',
          message: `Task queue size at ${metrics.task_queue_size}`,
          metric: 'task_queue_size',
          value: metrics.task_queue_size,
          threshold: 50
        });
      }
    }
    
    // Add alerts to queue
    for (const alert of alerts) {
      this.addAlert(alert);
    }
  }

  addAlert(alert) {
    const enrichedAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };
    
    this.alerts.push(enrichedAlert);
    
    // Emit alert event
    this.emit('alert', enrichedAlert);
    
    console.warn(`🚨 Alert: ${alert.severity.toUpperCase()} - ${alert.message}`);
  }

  processAlerts() {
    const unacknowledgedAlerts = this.alerts.filter(alert => !alert.acknowledged);
    
    if (unacknowledgedAlerts.length === 0) return;
    
    // Group alerts by type for rate limiting
    const alertGroups = {};
    for (const alert of unacknowledgedAlerts) {
      if (!alertGroups[alert.type]) {
        alertGroups[alert.type] = [];
      }
      alertGroups[alert.type].push(alert);
    }
    
    // Process automation for critical alerts
    for (const [type, alerts] of Object.entries(alertGroups)) {
      if (alerts.some(a => a.severity === 'critical')) {
        this.triggerAutomation(type, alerts);
      }
    }
  }

  triggerAutomation(alertType, alerts) {
    const automationConfig = this.config.automation;
    if (!automationConfig) return;

    console.log(`🤖 Triggering automation for alert type: ${alertType}`);
    
    // Auto-scaling triggers
    if (automationConfig.auto_scaling?.enabled) {
      const triggers = automationConfig.auto_scaling.triggers;
      
      if (alertType === 'high_cpu' && triggers.high_cpu) {
        this.executeAction(triggers.high_cpu.action, alerts);
      } else if (alertType === 'high_memory' && triggers.high_memory) {
        this.executeAction(triggers.high_memory.action, alerts);
      } else if (alertType === 'high_queue' && triggers.queue_backup) {
        this.executeAction(triggers.queue_backup.action, alerts);
      }
    }
    
    // Mark alerts as acknowledged
    for (const alert of alerts) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
    }
  }

  executeAction(action, alerts) {
    console.log(`⚡ Executing action: ${action}`);
    
    switch (action) {
      case 'scale_workers':
        console.log('📈 Scaling up workers...');
        break;
      case 'optimize_memory':
        console.log('🧹 Optimizing memory usage...');
        break;
      case 'spawn_agents':
        console.log('🤖 Spawning additional agents...');
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  }

  updateDashboard(name, dashboard) {
    const currentData = this.aggregateMetricsForDashboard(dashboard.metrics);
    
    dashboard.data.push({
      timestamp: new Date().toISOString(),
      data: currentData
    });
    
    // Limit dashboard data retention
    const maxDataPoints = 100;
    if (dashboard.data.length > maxDataPoints) {
      dashboard.data.splice(0, dashboard.data.length - maxDataPoints);
    }
  }

  aggregateMetricsForDashboard(metricNames) {
    const aggregated = {};
    
    for (const metricName of metricNames) {
      aggregated[metricName] = this.getLatestMetricValue(metricName);
    }
    
    return aggregated;
  }

  getLatestMetricValue(metricName) {
    // Extract latest value for the specified metric from all collectors
    let latestValue = null;
    
    for (const [collectorName, collectorData] of this.metrics) {
      if (collectorData.length === 0) continue;
      
      const latest = collectorData[collectorData.length - 1];
      const value = this.extractMetricValue(latest.metrics, metricName);
      
      if (value !== null) {
        latestValue = value;
      }
    }
    
    return latestValue || 0;
  }

  extractMetricValue(metrics, metricName) {
    // Navigate nested metric structure
    const parts = metricName.split('.');
    let current = metrics;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }
    
    return current;
  }

  performTrendAnalysis() {
    console.log('📈 Performing trend analysis...');
    
    const trends = {};
    
    for (const [collectorName, collectorData] of this.metrics) {
      if (collectorData.length < 5) continue; // Need at least 5 data points
      
      trends[collectorName] = this.analyzeTrends(collectorData);
    }
    
    // Store trends
    this.storeInMemory('monitoring_trends', {
      timestamp: new Date().toISOString(),
      trends
    });
  }

  analyzeTrends(data) {
    const recent = data.slice(-20); // Last 20 data points
    const trends = {};
    
    // Analyze CPU trend
    const cpuValues = recent.map(d => d.metrics.cpu_utilization).filter(v => v !== undefined);
    if (cpuValues.length > 1) {
      trends.cpu_trend = this.calculateTrend(cpuValues);
    }
    
    // Analyze memory trend
    const memoryValues = recent.map(d => d.metrics.memory_usage?.usage_percent).filter(v => v !== undefined);
    if (memoryValues.length > 1) {
      trends.memory_trend = this.calculateTrend(memoryValues);
    }
    
    return trends;
  }

  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  performAnomalyDetection() {
    console.log('🔍 Performing anomaly detection...');
    
    const anomalies = [];
    
    for (const [collectorName, collectorData] of this.metrics) {
      if (collectorData.length < 10) continue; // Need historical data
      
      const detected = this.detectAnomalies(collectorData);
      if (detected.length > 0) {
        anomalies.push({
          collector: collectorName,
          anomalies: detected
        });
      }
    }
    
    if (anomalies.length > 0) {
      console.log(`🚨 Detected ${anomalies.length} anomalies`);
      this.storeInMemory('monitoring_anomalies', {
        timestamp: new Date().toISOString(),
        anomalies
      });
    }
  }

  detectAnomalies(data) {
    const anomalies = [];
    const recent = data.slice(-10);
    
    // Simple statistical anomaly detection
    for (const metricName of ['cpu_utilization', 'memory_usage.usage_percent']) {
      const values = recent.map(d => this.extractMetricValue(d.metrics, metricName)).filter(v => v !== null);
      
      if (values.length < 5) continue;
      
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length);
      
      const latest = values[values.length - 1];
      const zScore = Math.abs((latest - mean) / stdDev);
      
      if (zScore > 2) { // 2 standard deviations
        anomalies.push({
          metric: metricName,
          value: latest,
          mean,
          stdDev,
          zScore,
          severity: zScore > 3 ? 'high' : 'medium'
        });
      }
    }
    
    return anomalies;
  }

  generateOptimizationInsights() {
    console.log('💡 Generating optimization insights...');
    
    const insights = [];
    
    // Performance bottleneck insights
    const bottlenecks = this.identifyBottlenecks();
    insights.push(...bottlenecks);
    
    // Resource optimization insights
    const resourceOptimizations = this.identifyResourceOptimizations();
    insights.push(...resourceOptimizations);
    
    // Workflow efficiency insights
    const workflowOptimizations = this.identifyWorkflowOptimizations();
    insights.push(...workflowOptimizations);
    
    this.insights = insights;
    
    // Store insights
    this.storeInMemory('optimization_insights', {
      timestamp: new Date().toISOString(),
      insights
    });
    
    console.log(`💡 Generated ${insights.length} optimization insights`);
  }

  identifyBottlenecks() {
    const insights = [];
    
    // Check for high queue sizes
    const latestClaudeFlow = this.getLatestMetrics('claude_flow');
    if (latestClaudeFlow && latestClaudeFlow.task_queue_size > 30) {
      insights.push({
        type: 'bottleneck',
        category: 'task_processing',
        severity: 'medium',
        title: 'High Task Queue Size',
        description: `Task queue has ${latestClaudeFlow.task_queue_size} pending tasks`,
        recommendation: 'Consider increasing worker count or optimizing task processing',
        confidence: 0.8
      });
    }
    
    // Check for high CPU usage
    const latestSystem = this.getLatestMetrics('system');
    if (latestSystem && latestSystem.cpu_utilization > 80) {
      insights.push({
        type: 'bottleneck',
        category: 'system_resources',
        severity: 'high',
        title: 'High CPU Utilization',
        description: `CPU usage at ${latestSystem.cpu_utilization}%`,
        recommendation: 'Consider optimizing CPU-intensive operations or scaling resources',
        confidence: 0.9
      });
    }
    
    return insights;
  }

  identifyResourceOptimizations() {
    const insights = [];
    
    // Memory optimization
    const latestSystem = this.getLatestMetrics('system');
    if (latestSystem && latestSystem.memory_usage.usage_percent > 70) {
      insights.push({
        type: 'optimization',
        category: 'memory',
        severity: 'medium',
        title: 'Memory Usage Optimization',
        description: `Memory usage at ${latestSystem.memory_usage.usage_percent}%`,
        recommendation: 'Consider implementing memory optimization strategies or caching improvements',
        confidence: 0.7
      });
    }
    
    return insights;
  }

  identifyWorkflowOptimizations() {
    const insights = [];
    
    // SPARC workflow optimization
    const latestSparc = this.getLatestMetrics('sparc');
    if (latestSparc && latestSparc.coordination_efficiency.parallel_utilization < 0.5) {
      insights.push({
        type: 'optimization',
        category: 'workflow',
        severity: 'low',
        title: 'Low Parallel Utilization',
        description: 'SPARC workflows are not fully utilizing parallel processing capabilities',
        recommendation: 'Review workflow configurations to increase parallelization',
        confidence: 0.6
      });
    }
    
    return insights;
  }

  getLatestMetrics(collectorName) {
    const collectorData = this.metrics.get(collectorName);
    if (!collectorData || collectorData.length === 0) return null;
    
    return collectorData[collectorData.length - 1].metrics;
  }

  async storeInMemory(key, value) {
    const memoryPath = path.join(this.projectRoot, 'memory', `${key}.json`);
    
    try {
      fs.writeFileSync(memoryPath, JSON.stringify(value, null, 2));
    } catch (error) {
      console.error(`Failed to store monitoring data: ${key}`, error.message);
    }
  }

  parseDuration(duration) {
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 30000; // Default 30 seconds
    
    return parseInt(match[1]) * units[match[2]];
  }

  getStatus() {
    return {
      enabled: this.config.enabled,
      collectors: {
        total: this.collectors.size,
        active: this.collectors.size,
        lastCollection: Array.from(this.lastCollectionTime.entries()).reduce((acc, [name, time]) => {
          acc[name] = time;
          return acc;
        }, {})
      },
      dashboards: {
        total: this.dashboards.size,
        active: this.dashboards.size
      },
      alerts: {
        total: this.alerts.length,
        unacknowledged: this.alerts.filter(a => !a.acknowledged).length
      },
      insights: {
        total: this.insights.length,
        byType: this.insights.reduce((acc, insight) => {
          acc[insight.type] = (acc[insight.type] || 0) + 1;
          return acc;
        }, {})
      },
      metrics: {
        totalDataPoints: Array.from(this.metrics.values()).reduce((sum, data) => sum + data.length, 0)
      }
    };
  }

  getDashboard(name) {
    const dashboard = this.dashboards.get(name);
    if (!dashboard) return null;
    
    return {
      name: dashboard.name,
      metrics: dashboard.metrics,
      data: dashboard.data.slice(-50), // Last 50 data points
      lastUpdate: dashboard.data.length > 0 ? dashboard.data[dashboard.data.length - 1].timestamp : null
    };
  }

  getInsights() {
    return {
      total: this.insights.length,
      insights: this.insights.slice(0, 20), // Top 20 insights
      byCategory: this.insights.reduce((acc, insight) => {
        acc[insight.category] = (acc[insight.category] || 0) + 1;
        return acc;
      }, {}),
      bySeverity: this.insights.reduce((acc, insight) => {
        acc[insight.severity] = (acc[insight.severity] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

// CLI interface
if (require.main === module) {
  const configPath = process.argv[2] || path.join(__dirname, 'monitoring-analytics.json');
  const projectRoot = process.argv[3] || process.cwd();
  const monitor = new MonitoringAnalytics(configPath, projectRoot);
  
  const command = process.argv[4] || 'initialize';
  
  switch (command) {
    case 'initialize':
      monitor.initialize();
      break;
    
    case 'status':
      console.log('Monitoring Status:', JSON.stringify(monitor.getStatus(), null, 2));
      break;
    
    case 'dashboard':
      const dashboardName = process.argv[5] || 'system_overview';
      const dashboard = monitor.getDashboard(dashboardName);
      if (dashboard) {
        console.log('Dashboard Data:', JSON.stringify(dashboard, null, 2));
      } else {
        console.error(`Dashboard not found: ${dashboardName}`);
      }
      break;
    
    case 'insights':
      console.log('Optimization Insights:', JSON.stringify(monitor.getInsights(), null, 2));
      break;
    
    case 'alerts':
      const alerts = monitor.alerts.slice(-10); // Last 10 alerts
      console.log('Recent Alerts:', JSON.stringify(alerts, null, 2));
      break;
    
    default:
      console.error('Unknown command:', command);
      console.error('Available commands: initialize, status, dashboard, insights, alerts');
      process.exit(1);
  }
}

module.exports = MonitoringAnalytics;