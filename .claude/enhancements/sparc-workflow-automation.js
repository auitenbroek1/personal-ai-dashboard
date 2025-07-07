#!/usr/bin/env node

/**
 * SPARC Workflow Automation System
 * Provides auto-progression and intelligent workflow management
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class SparcWorkflowAutomation extends EventEmitter {
  constructor(configPath, projectRoot) {
    super();
    this.configPath = configPath;
    this.projectRoot = projectRoot;
    this.config = this.loadConfig();
    this.activeWorkflows = new Map();
    this.workflowHistory = [];
    this.stageCache = new Map();
    this.metrics = {
      workflowsCompleted: 0,
      stagesExecuted: 0,
      autoProgressions: 0,
      averageCompletionTime: 0,
      productivityGain: 0
    };
  }

  loadConfig() {
    try {
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      return config.sparcWorkflowAutomation;
    } catch (error) {
      console.error('Failed to load workflow automation config:', error.message);
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      enabled: true,
      autoProgression: { enabled: true },
      workflowTemplates: {},
      automation_features: { smart_transitions: { enabled: true } }
    };
  }

  async initialize() {
    if (!this.config.enabled) {
      console.log('SPARC workflow automation is disabled');
      return;
    }

    console.log('🚀 Initializing SPARC Workflow Automation...');
    
    await this.setupEventHandlers();
    await this.initializeWorkflowTemplates();
    await this.setupCaching();
    await this.startMonitoring();
    
    console.log('✅ SPARC workflow automation initialized');
  }

  setupEventHandlers() {
    console.log('🔧 Setting up event handlers...');
    
    // Handle workflow events
    this.on('stage_completed', this.handleStageCompletion.bind(this));
    this.on('stage_failed', this.handleStageFailure.bind(this));
    this.on('workflow_started', this.handleWorkflowStart.bind(this));
    this.on('workflow_completed', this.handleWorkflowCompletion.bind(this));
    
    console.log('✅ Event handlers configured');
  }

  initializeWorkflowTemplates() {
    const templates = this.config.workflowTemplates || {};
    console.log(`📋 Initializing ${Object.keys(templates).length} workflow templates...`);
    
    for (const [name, template] of Object.entries(templates)) {
      this.validateWorkflowTemplate(name, template);
    }
    
    console.log('✅ Workflow templates validated');
  }

  validateWorkflowTemplate(name, template) {
    const required = ['name', 'description', 'stages'];
    const missing = required.filter(field => !template[field]);
    
    if (missing.length > 0) {
      console.warn(`⚠️  Template ${name} missing required fields:`, missing);
    }
    
    // Validate stage dependencies
    for (const stage of template.stages || []) {
      if (stage.depends_on) {
        const dependencies = Array.isArray(stage.depends_on) ? stage.depends_on : [stage.depends_on];
        const stageNames = template.stages.map(s => s.name);
        
        for (const dep of dependencies) {
          if (!stageNames.includes(dep)) {
            console.warn(`⚠️  Stage ${stage.name} depends on unknown stage: ${dep}`);
          }
        }
      }
    }
  }

  setupCaching() {
    const cacheConfig = this.config.productivity_optimizations?.intelligent_caching;
    if (!cacheConfig?.enabled) return;

    console.log('💾 Setting up intelligent caching...');
    
    // Set up cache cleanup intervals
    for (const cacheLevel of cacheConfig.cache_levels || []) {
      const ttl = this.parseDuration(cacheLevel.ttl);
      setInterval(() => {
        this.cleanupCache(cacheLevel.level);
      }, ttl);
    }
    
    console.log('✅ Caching system configured');
  }

  startMonitoring() {
    const monitoringConfig = this.config.monitoring_and_control;
    if (!monitoringConfig) return;

    console.log('📊 Starting workflow monitoring...');
    
    // Set up periodic monitoring
    setInterval(() => {
      this.monitorActiveWorkflows();
    }, 30000); // Every 30 seconds
    
    console.log('✅ Monitoring started');
  }

  async executeWorkflow(templateName, task, options = {}) {
    const startTime = Date.now();
    
    console.log(`🎯 Executing workflow: ${templateName} for task: "${task}"`);
    
    const template = this.config.workflowTemplates[templateName];
    if (!template) {
      throw new Error(`Unknown workflow template: ${templateName}`);
    }

    const workflow = await this.createWorkflowInstance(template, task, options);
    
    this.activeWorkflows.set(workflow.id, workflow);
    this.emit('workflow_started', workflow);
    
    try {
      const result = await this.executeWorkflowStages(workflow);
      
      workflow.status = 'completed';
      workflow.completedAt = new Date().toISOString();
      workflow.duration = Date.now() - startTime;
      workflow.result = result;
      
      this.emit('workflow_completed', workflow);
      
      return {
        workflowId: workflow.id,
        templateName,
        task,
        result,
        duration: workflow.duration,
        stagesExecuted: workflow.stages.length,
        autoProgressions: workflow.autoProgressions || 0,
        productivityGain: this.calculateProductivityGain(workflow)
      };
      
    } catch (error) {
      workflow.status = 'failed';
      workflow.error = error.message;
      
      console.error(`❌ Workflow ${workflow.id} failed:`, error.message);
      throw error;
    } finally {
      this.activeWorkflows.delete(workflow.id);
      this.workflowHistory.push(workflow);
    }
  }

  async createWorkflowInstance(template, task, options) {
    const workflow = {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateName: template.name,
      task,
      options,
      status: 'initializing',
      createdAt: new Date().toISOString(),
      stages: [],
      currentStage: null,
      memoryNamespace: template.memory_namespace || 'default',
      coordination: template.coordination || 'sequential',
      autoProgressions: 0,
      completedStages: [],
      failedStages: []
    };

    // Initialize stages
    for (const stageTemplate of template.stages || []) {
      const stage = {
        ...stageTemplate,
        id: `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workflowId: workflow.id,
        status: 'pending',
        outputs: [],
        startTime: null,
        endTime: null,
        duration: null,
        agents: []
      };
      
      workflow.stages.push(stage);
    }

    // Store workflow in memory
    await this.storeInMemory(`workflow_${workflow.id}`, workflow);
    
    return workflow;
  }

  async executeWorkflowStages(workflow) {
    console.log(`⚙️  Executing ${workflow.stages.length} stages for workflow ${workflow.id}`);
    
    const results = [];
    
    // Determine execution order based on coordination mode
    const executionPlan = this.createExecutionPlan(workflow);
    
    for (const batch of executionPlan) {
      const batchResults = await this.executeStageBatch(batch, workflow);
      results.push(...batchResults);
    }
    
    return results;
  }

  createExecutionPlan(workflow) {
    const stages = workflow.stages;
    const plan = [];
    
    if (workflow.coordination === 'sequential') {
      // Sequential execution - one stage at a time
      for (const stage of stages) {
        plan.push([stage]);
      }
    } else if (workflow.coordination === 'parallel') {
      // Parallel execution - group independent stages
      const groups = this.groupStagesByDependencies(stages);
      plan.push(...groups);
    } else if (workflow.coordination === 'hierarchical') {
      // Hierarchical execution - orchestrator first, then parallel specialists
      const orchestrator = stages.find(s => s.sparc_modes?.includes('orchestrator'));
      const specialists = stages.filter(s => s !== orchestrator);
      
      if (orchestrator) {
        plan.push([orchestrator]);
      }
      if (specialists.length > 0) {
        plan.push(specialists);
      }
    } else {
      // Default to sequential
      for (const stage of stages) {
        plan.push([stage]);
      }
    }
    
    return plan;
  }

  groupStagesByDependencies(stages) {
    const groups = [];
    const processed = new Set();
    
    while (processed.size < stages.length) {
      const currentGroup = [];
      
      for (const stage of stages) {
        if (processed.has(stage.id)) continue;
        
        // Check if all dependencies are satisfied
        const dependencies = stage.depends_on || [];
        const depsSatisfied = dependencies.every(dep => 
          stages.find(s => s.name === dep && processed.has(s.id))
        );
        
        if (depsSatisfied) {
          currentGroup.push(stage);
        }
      }
      
      if (currentGroup.length === 0) {
        // Break circular dependencies
        const remaining = stages.filter(s => !processed.has(s.id));
        currentGroup.push(remaining[0]);
      }
      
      groups.push(currentGroup);
      currentGroup.forEach(stage => processed.add(stage.id));
    }
    
    return groups;
  }

  async executeStageBatch(stages, workflow) {
    const batchResults = [];
    
    if (stages.length === 1) {
      // Single stage execution
      const result = await this.executeStage(stages[0], workflow);
      batchResults.push(result);
    } else {
      // Parallel stage execution
      const promises = stages.map(stage => this.executeStage(stage, workflow));
      const results = await Promise.allSettled(promises);
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled') {
          batchResults.push(result.value);
        } else {
          console.error(`Stage ${stages[i].name} failed:`, result.reason);
          batchResults.push({
            stage: stages[i],
            status: 'failed',
            error: result.reason.message
          });
        }
      }
    }
    
    return batchResults;
  }

  async executeStage(stage, workflow) {
    const startTime = Date.now();
    
    console.log(`🎬 Executing stage: ${stage.name} (${stage.sparc_modes?.join(', ')})`);
    
    stage.status = 'running';
    stage.startTime = new Date().toISOString();
    
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(stage, workflow);
      const cached = this.stageCache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached)) {
        console.log(`💾 Using cached result for stage: ${stage.name}`);
        return cached.result;
      }
      
      // Execute stage
      const result = await this.executeStageLogic(stage, workflow);
      
      stage.status = 'completed';
      stage.endTime = new Date().toISOString();
      stage.duration = Date.now() - startTime;
      stage.outputs = result.outputs || [];
      
      // Cache result
      this.stageCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
        stage: stage.name
      });
      
      // Check for auto-progression
      if (this.shouldAutoProgress(stage, workflow)) {
        workflow.autoProgressions++;
        console.log(`🤖 Auto-progressing from stage: ${stage.name}`);
      }
      
      this.emit('stage_completed', { stage, workflow, result });
      
      return result;
      
    } catch (error) {
      stage.status = 'failed';
      stage.error = error.message;
      stage.endTime = new Date().toISOString();
      stage.duration = Date.now() - startTime;
      
      this.emit('stage_failed', { stage, workflow, error });
      
      throw error;
    }
  }

  async executeStageLogic(stage, workflow) {
    // Simulate stage execution (in real implementation, would use SPARC agents)
    const sparcModes = stage.sparc_modes || ['orchestrator'];
    const outputs = [];
    
    for (const mode of sparcModes) {
      const agentResult = await this.executeSparcMode(mode, stage, workflow);
      outputs.push(agentResult);
    }
    
    return {
      stage: stage.name,
      sparcModes,
      outputs,
      status: 'completed',
      duration: stage.duration
    };
  }

  async executeSparcMode(mode, stage, workflow) {
    // Simulate SPARC mode execution
    const executionTime = Math.random() * 5000 + 1000; // 1-6 seconds
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = {
          mode,
          stage: stage.name,
          output: `${mode} completed ${stage.name} successfully`,
          status: 'completed',
          executionTime
        };
        
        resolve(result);
      }, executionTime);
    });
  }

  shouldAutoProgress(stage, workflow) {
    const autoProgressConfig = this.config.autoProgression;
    if (!autoProgressConfig?.enabled) return false;
    
    if (!stage.auto_progression) return false;
    
    // Check success criteria
    const successCriteria = stage.success_criteria || [];
    const criteriaMetPercentage = 0.8; // Simulate 80% criteria met
    
    const threshold = autoProgressConfig.modes?.sequential?.conditions?.success_threshold || 0.8;
    
    return criteriaMetPercentage >= threshold;
  }

  getCacheKey(stage, workflow) {
    return `${workflow.templateName}_${stage.name}_${workflow.task}`;
  }

  isCacheValid(cached) {
    const maxAge = 30 * 60 * 1000; // 30 minutes
    return Date.now() - cached.timestamp < maxAge;
  }

  cleanupCache(level) {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    for (const [key, cached] of this.stageCache.entries()) {
      if (now - cached.timestamp > maxAge) {
        this.stageCache.delete(key);
      }
    }
  }

  calculateProductivityGain(workflow) {
    const template = this.config.workflowTemplates[workflow.templateName];
    const multiplier = template?.productivity_multiplier || 1.0;
    
    const autoProgressionBonus = workflow.autoProgressions * 0.1;
    const parallelizationBonus = workflow.coordination === 'parallel' ? 0.2 : 0;
    
    return Math.round((multiplier + autoProgressionBonus + parallelizationBonus - 1) * 100);
  }

  async handleStageCompletion(event) {
    const { stage, workflow, result } = event;
    
    console.log(`✅ Stage completed: ${stage.name} in workflow ${workflow.id}`);
    
    // Update metrics
    this.metrics.stagesExecuted++;
    
    // Store result in memory
    await this.storeInMemory(`stage_result_${stage.id}`, {
      stageId: stage.id,
      workflowId: workflow.id,
      result,
      completedAt: new Date().toISOString()
    });
  }

  async handleStageFailure(event) {
    const { stage, workflow, error } = event;
    
    console.error(`❌ Stage failed: ${stage.name} in workflow ${workflow.id}`, error.message);
    
    // Implement retry logic if configured
    const errorHandling = this.config.automation_features?.error_handling;
    if (errorHandling?.enabled) {
      await this.handleStageError(stage, workflow, error);
    }
  }

  async handleStageError(stage, workflow, error) {
    const retryStrategies = this.config.automation_features.error_handling.retry_strategies || [];
    
    for (const strategy of retryStrategies) {
      if (this.matchesErrorCondition(error, strategy.condition)) {
        console.log(`🔄 Applying retry strategy: ${strategy.action}`);
        
        switch (strategy.action) {
          case 'retry':
            if ((stage.retryCount || 0) < strategy.max_attempts) {
              stage.retryCount = (stage.retryCount || 0) + 1;
              await this.executeStage(stage, workflow);
            }
            break;
          case 'queue_and_retry':
            setTimeout(() => {
              this.executeStage(stage, workflow);
            }, this.parseDuration(strategy.max_wait));
            break;
          case 'rollback_and_notify':
            await this.rollbackStage(stage, workflow);
            break;
        }
        
        break;
      }
    }
  }

  matchesErrorCondition(error, condition) {
    // Simple condition matching (in real implementation, would be more sophisticated)
    switch (condition) {
      case 'transient_error':
        return error.message.includes('timeout') || error.message.includes('network');
      case 'resource_unavailable':
        return error.message.includes('resource') || error.message.includes('busy');
      case 'validation_failed':
        return error.message.includes('validation') || error.message.includes('invalid');
      default:
        return false;
    }
  }

  async rollbackStage(stage, workflow) {
    console.log(`🔄 Rolling back stage: ${stage.name}`);
    
    // Implement rollback logic
    stage.status = 'rolled_back';
    stage.outputs = [];
  }

  async handleWorkflowStart(workflow) {
    console.log(`🚀 Workflow started: ${workflow.id} (${workflow.templateName})`);
  }

  async handleWorkflowCompletion(workflow) {
    console.log(`✅ Workflow completed: ${workflow.id} in ${workflow.duration}ms`);
    
    // Update metrics
    this.metrics.workflowsCompleted++;
    
    const oldAverage = this.metrics.averageCompletionTime;
    const newAverage = (oldAverage * (this.metrics.workflowsCompleted - 1) + workflow.duration) / this.metrics.workflowsCompleted;
    this.metrics.averageCompletionTime = newAverage;
    
    if (workflow.autoProgressions > 0) {
      this.metrics.autoProgressions += workflow.autoProgressions;
    }
    
    // Store workflow result
    await this.storeInMemory(`workflow_result_${workflow.id}`, {
      workflowId: workflow.id,
      templateName: workflow.templateName,
      task: workflow.task,
      result: workflow.result,
      duration: workflow.duration,
      completedAt: workflow.completedAt
    });
  }

  monitorActiveWorkflows() {
    for (const workflow of this.activeWorkflows.values()) {
      this.checkWorkflowHealth(workflow);
    }
  }

  checkWorkflowHealth(workflow) {
    const now = Date.now();
    const startTime = new Date(workflow.createdAt).getTime();
    const elapsed = now - startTime;
    
    // Check for timeouts
    const timeout = 30 * 60 * 1000; // 30 minutes
    if (elapsed > timeout) {
      console.warn(`⚠️  Workflow ${workflow.id} has been running for ${elapsed}ms`);
    }
    
    // Check for stalled stages
    const currentStage = workflow.stages.find(s => s.status === 'running');
    if (currentStage && currentStage.startTime) {
      const stageElapsed = now - new Date(currentStage.startTime).getTime();
      const stageTimeout = 10 * 60 * 1000; // 10 minutes
      
      if (stageElapsed > stageTimeout) {
        console.warn(`⚠️  Stage ${currentStage.name} has been running for ${stageElapsed}ms`);
      }
    }
  }

  async storeInMemory(key, value) {
    const memoryPath = path.join(this.projectRoot, 'memory', `${key}.json`);
    
    try {
      fs.writeFileSync(memoryPath, JSON.stringify(value, null, 2));
    } catch (error) {
      console.error(`Failed to store in memory: ${key}`, error.message);
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
      activeWorkflows: this.activeWorkflows.size,
      workflowHistory: this.workflowHistory.length,
      cacheSize: this.stageCache.size,
      metrics: this.metrics,
      templates: Object.keys(this.config.workflowTemplates || {})
    };
  }

  getMetrics() {
    return {
      ...this.metrics,
      activeWorkflows: this.activeWorkflows.size,
      cachedStages: this.stageCache.size,
      timestamp: new Date().toISOString()
    };
  }
}

// CLI interface
if (require.main === module) {
  const configPath = process.argv[2] || path.join(__dirname, 'sparc-workflow-automation.json');
  const projectRoot = process.argv[3] || process.cwd();
  const automation = new SparcWorkflowAutomation(configPath, projectRoot);
  
  const command = process.argv[4] || 'initialize';
  
  switch (command) {
    case 'initialize':
      automation.initialize();
      break;
    
    case 'execute':
      const template = process.argv[5];
      const task = process.argv[6];
      if (!template || !task) {
        console.error('Usage: node sparc-workflow-automation.js <config> <project> execute <template> "<task>"');
        process.exit(1);
      }
      automation.executeWorkflow(template, task).then(result => {
        console.log('Workflow Execution Result:', JSON.stringify(result, null, 2));
      }).catch(error => {
        console.error('Workflow execution failed:', error.message);
        process.exit(1);
      });
      break;
    
    case 'status':
      console.log('Workflow Automation Status:', JSON.stringify(automation.getStatus(), null, 2));
      break;
    
    case 'metrics':
      console.log('Workflow Automation Metrics:', JSON.stringify(automation.getMetrics(), null, 2));
      break;
    
    case 'templates':
      const templates = Object.keys(automation.config.workflowTemplates || {});
      console.log('Available Templates:', templates);
      break;
    
    default:
      console.error('Unknown command:', command);
      console.error('Available commands: initialize, execute, status, metrics, templates');
      process.exit(1);
  }
}

module.exports = SparcWorkflowAutomation;