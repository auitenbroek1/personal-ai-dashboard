#!/usr/bin/env node

/**
 * Batch Processing System for Claude-Flow
 * Provides efficient batch processing capabilities for improved performance
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class BatchProcessor extends EventEmitter {
  constructor(configPath, projectRoot) {
    super();
    this.configPath = configPath;
    this.projectRoot = projectRoot;
    this.config = this.loadConfig();
    this.taskQueue = [];
    this.activeBatches = new Map();
    this.workerPool = [];
    this.cache = new Map();
    this.metrics = {
      tasksProcessed: 0,
      batchesCompleted: 0,
      averageBatchSize: 0,
      throughput: 0,
      errorRate: 0,
      resourceUtilization: 0
    };
  }

  loadConfig() {
    try {
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      return config.batchProcessing;
    } catch (error) {
      console.error('Failed to load batch processing config:', error.message);
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      enabled: true,
      efficiency_optimizations: {
        task_batching: { enabled: true },
        parallel_execution: { enabled: true },
        intelligent_scheduling: { enabled: true }
      }
    };
  }

  async initialize() {
    if (!this.config.enabled) {
      console.log('Batch processing is disabled');
      return;
    }

    console.log('🚀 Initializing Batch Processing System...');
    
    await this.initializeWorkerPool();
    await this.setupScheduler();
    await this.initializeCaching();
    await this.startMonitoring();
    
    console.log('✅ Batch processing system initialized');
  }

  async initializeWorkerPool() {
    const poolConfig = this.config.efficiency_optimizations?.parallel_execution?.configuration;
    if (!poolConfig) return;

    console.log('👥 Initializing worker pool...');
    
    const poolSize = poolConfig.worker_pool_size || 8;
    
    for (let i = 0; i < poolSize; i++) {
      const worker = await this.createWorker(i);
      this.workerPool.push(worker);
    }
    
    console.log(`✅ Worker pool initialized with ${poolSize} workers`);
  }

  async createWorker(id) {
    return {
      id: `worker_${id}`,
      status: 'idle',
      currentBatch: null,
      tasksCompleted: 0,
      created: new Date().toISOString()
    };
  }

  setupScheduler() {
    const schedulerConfig = this.config.efficiency_optimizations?.intelligent_scheduling;
    if (!schedulerConfig?.enabled) return;

    console.log('📅 Setting up intelligent scheduler...');
    
    // Start batch formation timer
    setInterval(() => {
      this.formBatches();
    }, 5000); // Every 5 seconds
    
    // Start batch processing timer
    setInterval(() => {
      this.processBatches();
    }, 1000); // Every second
    
    console.log('✅ Scheduler configured');
  }

  initializeCaching() {
    const cacheConfig = this.config.performance_optimizations?.caching;
    if (!cacheConfig?.enabled) return;

    console.log('💾 Initializing caching system...');
    
    // Set up cache cleanup intervals
    const levels = cacheConfig.levels || {};
    for (const [levelName, levelConfig] of Object.entries(levels)) {
      const ttl = this.parseDuration(levelConfig.ttl);
      setInterval(() => {
        this.cleanupCache(levelName);
      }, ttl / 2); // Cleanup at half the TTL
    }
    
    console.log('✅ Caching system initialized');
  }

  startMonitoring() {
    console.log('📊 Starting performance monitoring...');
    
    setInterval(() => {
      this.collectMetrics();
    }, 30000); // Every 30 seconds
    
    console.log('✅ Monitoring started');
  }

  async submitTask(task, options = {}) {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const enrichedTask = {
      id: taskId,
      ...task,
      submittedAt: new Date().toISOString(),
      priority: options.priority || 'medium',
      batchable: options.batchable !== false,
      timeout: options.timeout || 300000, // 5 minutes default
      retries: 0,
      maxRetries: options.maxRetries || 3
    };

    console.log(`📝 Submitting task: ${taskId} (${task.type})`);
    
    // Check cache first
    const cacheKey = this.getCacheKey(enrichedTask);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      console.log(`💾 Returning cached result for task: ${taskId}`);
      return cached.result;
    }
    
    // Add to queue
    this.taskQueue.push(enrichedTask);
    
    // Immediate processing for non-batchable tasks
    if (!enrichedTask.batchable) {
      return await this.processSingleTask(enrichedTask);
    }
    
    // Return promise for batchable tasks
    return new Promise((resolve, reject) => {
      enrichedTask.resolve = resolve;
      enrichedTask.reject = reject;
    });
  }

  formBatches() {
    if (this.taskQueue.length === 0) return;

    console.log(`🔄 Forming batches from ${this.taskQueue.length} queued tasks`);
    
    const batchingConfig = this.config.efficiency_optimizations?.task_batching;
    if (!batchingConfig?.enabled) {
      // Process tasks individually
      for (const task of this.taskQueue.splice(0)) {
        this.processSingleTask(task);
      }
      return;
    }

    const batches = this.groupTasksIntoBatches();
    
    for (const batch of batches) {
      this.enqueueBatch(batch);
    }
  }

  groupTasksIntoBatches() {
    const batches = [];
    const strategies = this.config.efficiency_optimizations?.task_batching?.strategies || {};
    
    // Similarity-based batching
    if (strategies.similarity_based?.enabled) {
      const similarityBatches = this.groupBySimilarity();
      batches.push(...similarityBatches);
    }
    
    // Time-based batching
    if (strategies.time_based?.enabled) {
      const timeBatches = this.groupByTime();
      batches.push(...timeBatches);
    }
    
    // Resource-based batching
    if (strategies.resource_based?.enabled) {
      const resourceBatches = this.groupByResource();
      batches.push(...resourceBatches);
    }
    
    // Default batching if no strategies enabled
    if (batches.length === 0) {
      batches.push(...this.createDefaultBatches());
    }
    
    return batches;
  }

  groupBySimilarity() {
    const config = this.config.efficiency_optimizations.task_batching.strategies.similarity_based;
    const maxBatchSize = config.max_batch_size || 10;
    const threshold = config.similarity_threshold || 0.8;
    
    const batches = [];
    const processed = new Set();
    
    for (let i = 0; i < this.taskQueue.length; i++) {
      if (processed.has(i)) continue;
      
      const batch = [this.taskQueue[i]];
      processed.add(i);
      
      for (let j = i + 1; j < this.taskQueue.length && batch.length < maxBatchSize; j++) {
        if (processed.has(j)) continue;
        
        const similarity = this.calculateTaskSimilarity(this.taskQueue[i], this.taskQueue[j]);
        if (similarity >= threshold) {
          batch.push(this.taskQueue[j]);
          processed.add(j);
        }
      }
      
      if (batch.length > 1) {
        batches.push(batch);
      }
    }
    
    // Remove batched tasks from queue
    this.taskQueue = this.taskQueue.filter((_, index) => !processed.has(index));
    
    return batches;
  }

  calculateTaskSimilarity(task1, task2) {
    let similarity = 0;
    let factors = 0;
    
    // Type similarity
    if (task1.type === task2.type) {
      similarity += 0.4;
    }
    factors++;
    
    // Tool similarity
    const tools1 = task1.tools || [];
    const tools2 = task2.tools || [];
    const commonTools = tools1.filter(tool => tools2.includes(tool));
    const toolSimilarity = commonTools.length / Math.max(tools1.length, tools2.length, 1);
    similarity += toolSimilarity * 0.3;
    factors++;
    
    // Complexity similarity
    const complexity1 = task1.complexity || 'medium';
    const complexity2 = task2.complexity || 'medium';
    if (complexity1 === complexity2) {
      similarity += 0.3;
    }
    factors++;
    
    return similarity / factors;
  }

  groupByTime() {
    const config = this.config.efficiency_optimizations.task_batching.strategies.time_based;
    const windowDuration = this.parseDuration(config.window_duration || '5m');
    const maxWaitTime = this.parseDuration(config.max_wait_time || '10m');
    const minBatchSize = config.min_batch_size || 2;
    
    const now = Date.now();
    const batches = [];
    const batch = [];
    
    for (const task of this.taskQueue) {
      const taskAge = now - new Date(task.submittedAt).getTime();
      
      if (taskAge < windowDuration || batch.length < minBatchSize) {
        batch.push(task);
      } else if (taskAge >= maxWaitTime || batch.length >= 10) {
        // Force batch creation
        if (batch.length > 0) {
          batches.push([...batch]);
          batch.length = 0;
        }
        batch.push(task);
      }
    }
    
    if (batch.length >= minBatchSize) {
      batches.push(batch);
      // Remove batched tasks
      for (const task of batch) {
        const index = this.taskQueue.indexOf(task);
        if (index > -1) {
          this.taskQueue.splice(index, 1);
        }
      }
    }
    
    return batches;
  }

  groupByResource() {
    const config = this.config.efficiency_optimizations.task_batching.strategies.resource_based;
    const resourceTypes = config.resource_types || ['cpu', 'memory'];
    
    const batches = [];
    const resourceGroups = {};
    
    for (const task of this.taskQueue) {
      const resourceKey = this.getResourceKey(task, resourceTypes);
      
      if (!resourceGroups[resourceKey]) {
        resourceGroups[resourceKey] = [];
      }
      
      resourceGroups[resourceKey].push(task);
    }
    
    for (const [resourceKey, tasks] of Object.entries(resourceGroups)) {
      if (tasks.length > 1) {
        batches.push(tasks);
        
        // Remove batched tasks
        for (const task of tasks) {
          const index = this.taskQueue.indexOf(task);
          if (index > -1) {
            this.taskQueue.splice(index, 1);
          }
        }
      }
    }
    
    return batches;
  }

  getResourceKey(task, resourceTypes) {
    const requirements = task.resourceRequirements || {};
    const key = resourceTypes.map(type => requirements[type] || 'default').join('_');
    return key;
  }

  createDefaultBatches() {
    const maxBatchSize = 5;
    const batches = [];
    
    while (this.taskQueue.length >= 2) {
      const batchSize = Math.min(maxBatchSize, this.taskQueue.length);
      const batch = this.taskQueue.splice(0, batchSize);
      batches.push(batch);
    }
    
    return batches;
  }

  enqueueBatch(tasks) {
    const batch = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tasks,
      createdAt: new Date().toISOString(),
      status: 'queued',
      worker: null,
      results: []
    };

    console.log(`📦 Created batch: ${batch.id} with ${tasks.length} tasks`);
    
    this.activeBatches.set(batch.id, batch);
  }

  processBatches() {
    const availableWorkers = this.workerPool.filter(worker => worker.status === 'idle');
    const queuedBatches = Array.from(this.activeBatches.values())
      .filter(batch => batch.status === 'queued');
    
    if (availableWorkers.length === 0 || queuedBatches.length === 0) {
      return;
    }

    console.log(`⚙️  Processing ${Math.min(availableWorkers.length, queuedBatches.length)} batches`);
    
    for (let i = 0; i < Math.min(availableWorkers.length, queuedBatches.length); i++) {
      const worker = availableWorkers[i];
      const batch = queuedBatches[i];
      
      this.assignBatchToWorker(batch, worker);
    }
  }

  async assignBatchToWorker(batch, worker) {
    console.log(`👷 Assigning batch ${batch.id} to worker ${worker.id}`);
    
    worker.status = 'busy';
    worker.currentBatch = batch.id;
    batch.status = 'processing';
    batch.worker = worker.id;
    batch.startedAt = new Date().toISOString();
    
    try {
      const results = await this.executeBatch(batch, worker);
      
      batch.status = 'completed';
      batch.completedAt = new Date().toISOString();
      batch.results = results;
      
      this.handleBatchCompletion(batch, worker);
      
    } catch (error) {
      console.error(`❌ Batch ${batch.id} failed:`, error.message);
      
      batch.status = 'failed';
      batch.error = error.message;
      
      this.handleBatchFailure(batch, worker, error);
    }
  }

  async executeBatch(batch, worker) {
    console.log(`🚀 Executing batch ${batch.id} with ${batch.tasks.length} tasks`);
    
    const results = [];
    const parallelConfig = this.config.efficiency_optimizations?.parallel_execution;
    
    if (parallelConfig?.enabled && batch.tasks.length > 1) {
      // Parallel execution
      const promises = batch.tasks.map(task => this.executeTask(task));
      const settledResults = await Promise.allSettled(promises);
      
      for (let i = 0; i < settledResults.length; i++) {
        const result = settledResults[i];
        const task = batch.tasks[i];
        
        if (result.status === 'fulfilled') {
          results.push(result.value);
          if (task.resolve) task.resolve(result.value);
        } else {
          const error = { task: task.id, error: result.reason.message };
          results.push(error);
          if (task.reject) task.reject(result.reason);
        }
      }
    } else {
      // Sequential execution
      for (const task of batch.tasks) {
        try {
          const result = await this.executeTask(task);
          results.push(result);
          if (task.resolve) task.resolve(result);
        } catch (error) {
          const errorResult = { task: task.id, error: error.message };
          results.push(errorResult);
          if (task.reject) task.reject(error);
        }
      }
    }
    
    return results;
  }

  async executeTask(task) {
    console.log(`🎯 Executing task: ${task.id} (${task.type})`);
    
    const startTime = Date.now();
    
    try {
      // Simulate task execution based on type
      const result = await this.simulateTaskExecution(task);
      
      const executionTime = Date.now() - startTime;
      const enrichedResult = {
        taskId: task.id,
        type: task.type,
        result,
        executionTime,
        status: 'completed'
      };
      
      // Cache result
      const cacheKey = this.getCacheKey(task);
      this.cache.set(cacheKey, {
        result: enrichedResult,
        timestamp: Date.now()
      });
      
      return enrichedResult;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      throw new Error(`Task ${task.id} failed after ${executionTime}ms: ${error.message}`);
    }
  }

  async simulateTaskExecution(task) {
    // Simulate different task types
    const executionTime = this.getEstimatedExecutionTime(task);
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate occasional failures
        if (Math.random() < 0.05) { // 5% failure rate
          reject(new Error('Simulated task failure'));
          return;
        }
        
        resolve({
          output: `${task.type} task completed successfully`,
          details: task.details || {},
          timestamp: new Date().toISOString()
        });
      }, executionTime);
    });
  }

  getEstimatedExecutionTime(task) {
    const baseTime = 1000; // 1 second base
    const complexityMultipliers = {
      low: 0.5,
      medium: 1.0,
      high: 2.0
    };
    
    const multiplier = complexityMultipliers[task.complexity] || 1.0;
    const randomFactor = 0.5 + Math.random(); // 0.5 to 1.5
    
    return Math.round(baseTime * multiplier * randomFactor);
  }

  async processSingleTask(task) {
    console.log(`🎯 Processing single task: ${task.id}`);
    
    try {
      const result = await this.executeTask(task);
      return result;
    } catch (error) {
      console.error(`❌ Single task ${task.id} failed:`, error.message);
      throw error;
    }
  }

  handleBatchCompletion(batch, worker) {
    console.log(`✅ Batch ${batch.id} completed by worker ${worker.id}`);
    
    // Update worker
    worker.status = 'idle';
    worker.currentBatch = null;
    worker.tasksCompleted += batch.tasks.length;
    
    // Update metrics
    this.metrics.batchesCompleted++;
    this.metrics.tasksProcessed += batch.tasks.length;
    
    const newAverageBatchSize = (this.metrics.averageBatchSize * (this.metrics.batchesCompleted - 1) + batch.tasks.length) / this.metrics.batchesCompleted;
    this.metrics.averageBatchSize = newAverageBatchSize;
    
    // Clean up completed batch
    setTimeout(() => {
      this.activeBatches.delete(batch.id);
    }, 60000); // Keep for 1 minute for debugging
  }

  handleBatchFailure(batch, worker, error) {
    console.error(`❌ Batch ${batch.id} failed on worker ${worker.id}:`, error.message);
    
    // Update worker
    worker.status = 'idle';
    worker.currentBatch = null;
    
    // Retry logic for failed tasks
    const retryableTasks = batch.tasks.filter(task => 
      task.retries < task.maxRetries
    );
    
    for (const task of retryableTasks) {
      task.retries++;
      this.taskQueue.push(task);
      console.log(`🔄 Retrying task ${task.id} (attempt ${task.retries})`);
    }
    
    // Fail tasks that exceeded retry limit
    const failedTasks = batch.tasks.filter(task => 
      task.retries >= task.maxRetries
    );
    
    for (const task of failedTasks) {
      if (task.reject) {
        task.reject(new Error(`Task failed after ${task.maxRetries} retries`));
      }
    }
  }

  getCacheKey(task) {
    const keyData = {
      type: task.type,
      details: task.details,
      options: task.options
    };
    return JSON.stringify(keyData);
  }

  isCacheValid(cached) {
    const maxAge = 30 * 60 * 1000; // 30 minutes
    return Date.now() - cached.timestamp < maxAge;
  }

  cleanupCache(level) {
    const config = this.config.performance_optimizations?.caching?.levels?.[level];
    if (!config) return;
    
    const maxAge = this.parseDuration(config.ttl);
    const now = Date.now();
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
  }

  collectMetrics() {
    const now = Date.now();
    const activeWorkers = this.workerPool.filter(w => w.status === 'busy').length;
    const resourceUtilization = activeWorkers / this.workerPool.length;
    
    this.metrics.resourceUtilization = resourceUtilization;
    this.metrics.timestamp = new Date().toISOString();
    
    // Store metrics
    this.storeInMemory('batch_processing_metrics', this.metrics);
  }

  async storeInMemory(key, value) {
    const memoryPath = path.join(this.projectRoot, 'memory', `${key}.json`);
    
    try {
      fs.writeFileSync(memoryPath, JSON.stringify(value, null, 2));
    } catch (error) {
      console.error(`Failed to store metrics: ${key}`, error.message);
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
      taskQueue: this.taskQueue.length,
      activeBatches: this.activeBatches.size,
      workerPool: {
        total: this.workerPool.length,
        busy: this.workerPool.filter(w => w.status === 'busy').length,
        idle: this.workerPool.filter(w => w.status === 'idle').length
      },
      cache: {
        size: this.cache.size,
        hitRate: this.metrics.cacheHitRate || 0
      },
      metrics: this.metrics
    };
  }

  getMetrics() {
    return {
      ...this.metrics,
      queuedTasks: this.taskQueue.length,
      activeBatches: this.activeBatches.size,
      workerUtilization: this.workerPool.filter(w => w.status === 'busy').length / this.workerPool.length
    };
  }
}

// CLI interface
if (require.main === module) {
  const configPath = process.argv[2] || path.join(__dirname, 'batch-processing.json');
  const projectRoot = process.argv[3] || process.cwd();
  const processor = new BatchProcessor(configPath, projectRoot);
  
  const command = process.argv[4] || 'initialize';
  
  switch (command) {
    case 'initialize':
      processor.initialize();
      break;
    
    case 'submit':
      const taskType = process.argv[5];
      const taskDetails = process.argv[6];
      if (!taskType) {
        console.error('Usage: node batch-processing.js <config> <project> submit <type> [details]');
        process.exit(1);
      }
      
      const task = {
        type: taskType,
        details: taskDetails ? JSON.parse(taskDetails) : {},
        complexity: 'medium'
      };
      
      processor.submitTask(task).then(result => {
        console.log('Task Result:', JSON.stringify(result, null, 2));
      }).catch(error => {
        console.error('Task failed:', error.message);
        process.exit(1);
      });
      break;
    
    case 'status':
      console.log('Batch Processing Status:', JSON.stringify(processor.getStatus(), null, 2));
      break;
    
    case 'metrics':
      console.log('Batch Processing Metrics:', JSON.stringify(processor.getMetrics(), null, 2));
      break;
    
    default:
      console.error('Unknown command:', command);
      console.error('Available commands: initialize, submit, status, metrics');
      process.exit(1);
  }
}

module.exports = BatchProcessor;