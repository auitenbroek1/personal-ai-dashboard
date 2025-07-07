#!/usr/bin/env node
/**
 * Agent Tool - Advanced AI Agent Orchestration Tool for Claude-Flow
 * Integrates SPARC agent system into claude-flow as a proper tool
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class AgentTool {
    constructor() {
        this.registryPath = path.join(__dirname, 'registry.json');
        this.configPath = path.join(__dirname, '..', 'agent-integration.json');
        this.memoryNamespace = 'agent-coordination';
        this.activeAgents = new Map();
        this.coordinationState = {};
        
        this.loadConfiguration();
        this.initializeMetrics();
    }

    loadConfiguration() {
        try {
            if (fs.existsSync(this.configPath)) {
                this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            } else {
                this.config = { agentIntegration: { version: "1.0.0" } };
            }
        } catch (error) {
            console.error('Failed to load configuration:', error.message);
            this.config = { agentIntegration: { version: "1.0.0" } };
        }
    }

    initializeMetrics() {
        this.metrics = {
            agentsSpawned: 0,
            coordinationEvents: 0,
            communicationMessages: 0,
            errors: 0,
            startTime: Date.now()
        };
    }

    /**
     * Main entry point for the Agent tool
     */
    async execute(input) {
        try {
            const { action, ...params } = input;
            
            this.logOperation('execute', { action, params });
            
            switch (action) {
                case 'spawn':
                    return await this.spawnAgent(params);
                case 'coordinate':
                    return await this.coordinateAgents(params);
                case 'communicate':
                    return await this.communicateWithAgents(params);
                case 'terminate':
                    return await this.terminateAgent(params);
                case 'status':
                    return await this.getStatus(params);
                case 'distribute':
                    return await this.distributeTasks(params);
                default:
                    throw new Error(`Unknown action: ${action}`);
            }
        } catch (error) {
            this.metrics.errors++;
            this.logError('execute', error);
            return {
                success: false,
                error: error.message,
                metadata: { timestamp: new Date().toISOString() }
            };
        }
    }

    /**
     * Spawn a new SPARC agent with orchestrated capabilities
     */
    async spawnAgent({ agentType, agentName, task, coordination = {} }) {
        try {
            const agentId = agentName || `${agentType}_${Date.now()}`;
            const memoryKey = coordination.memoryKey || `agent_${agentId}`;
            
            // Validate agent type
            if (!this.isValidAgentType(agentType)) {
                throw new Error(`Invalid agent type: ${agentType}`);
            }

            // Check agent limits
            if (this.activeAgents.size >= (coordination.maxAgents || 10)) {
                throw new Error('Maximum number of concurrent agents reached');
            }

            // Prepare agent metadata
            const agentMetadata = {
                id: agentId,
                type: agentType,
                status: 'spawning',
                memoryKey: memoryKey,
                task: task,
                coordination: coordination,
                created: new Date().toISOString(),
                tools: this.getAgentTools(agentType),
                coordinationMode: coordination.mode || 'hierarchical'
            };

            // Store agent metadata in memory
            await this.storeInMemory(`agent_registry_${agentId}`, agentMetadata);

            // Launch agent through claude-flow SPARC system
            const spawnResult = await this.launchSparcAgent(agentType, task, {
                agentId,
                memoryKey,
                coordination
            });

            if (spawnResult.success) {
                agentMetadata.status = 'active';
                agentMetadata.pid = spawnResult.pid;
                
                this.activeAgents.set(agentId, agentMetadata);
                await this.updateCoordinationState();
                
                this.metrics.agentsSpawned++;
                this.logOperation('spawnAgent', { agentId, agentType, success: true });

                return {
                    success: true,
                    agentId: agentId,
                    status: 'active',
                    result: {
                        type: agentType,
                        memoryKey: memoryKey,
                        tools: agentMetadata.tools,
                        coordination: coordination
                    },
                    metadata: {
                        created: agentMetadata.created,
                        coordinationMode: agentMetadata.coordinationMode
                    }
                };
            } else {
                throw new Error(`Failed to spawn agent: ${spawnResult.error}`);
            }
        } catch (error) {
            this.logError('spawnAgent', error);
            throw error;
        }
    }

    /**
     * Coordinate multiple agents in orchestrated workflows
     */
    async coordinateAgents({ coordination, task }) {
        try {
            const { mode, agents, memoryKey, maxAgents = 5 } = coordination;
            
            this.logOperation('coordinateAgents', { mode, agents, task });

            // Prepare coordination context
            const coordinationContext = {
                id: `coordination_${Date.now()}`,
                mode: mode,
                task: task,
                agents: [],
                memoryKey: memoryKey || `coordination_${Date.now()}`,
                status: 'coordinating',
                created: new Date().toISOString()
            };

            // Store coordination context
            await this.storeInMemory(coordinationContext.memoryKey, coordinationContext);

            let results = [];

            switch (mode) {
                case 'hierarchical':
                    results = await this.executeHierarchical(agents, task, coordinationContext);
                    break;
                case 'parallel':
                    results = await this.executeParallel(agents, task, coordinationContext);
                    break;
                case 'pipeline':
                    results = await this.executePipeline(agents, task, coordinationContext);
                    break;
                case 'swarm':
                    results = await this.executeSwarm(agents, task, coordinationContext);
                    break;
                default:
                    results = await this.executeDistributed(agents, task, coordinationContext);
            }

            coordinationContext.status = 'completed';
            coordinationContext.results = results;
            await this.storeInMemory(coordinationContext.memoryKey, coordinationContext);

            this.metrics.coordinationEvents++;

            return {
                success: true,
                coordinationId: coordinationContext.id,
                status: 'completed',
                result: {
                    mode: mode,
                    agentsCoordinated: results.length,
                    results: results
                },
                coordinationState: coordinationContext,
                metadata: {
                    completed: new Date().toISOString(),
                    duration: Date.now() - new Date(coordinationContext.created).getTime()
                }
            };
        } catch (error) {
            this.logError('coordinateAgents', error);
            throw error;
        }
    }

    /**
     * Communicate with agents using various protocols
     */
    async communicateWithAgents({ communication, agentName, task }) {
        try {
            const { protocol, data, broadcast = false } = communication;
            
            this.logOperation('communicateWithAgents', { protocol, agentName, broadcast });

            let results = [];

            if (broadcast) {
                // Broadcast to all active agents
                for (const [agentId, agentData] of this.activeAgents) {
                    const result = await this.sendMessage(agentId, protocol, data, task);
                    results.push({ agentId, result });
                }
            } else if (agentName) {
                // Send to specific agent
                const result = await this.sendMessage(agentName, protocol, data, task);
                results.push({ agentId: agentName, result });
            } else {
                throw new Error('Must specify agentName or set broadcast=true');
            }

            this.metrics.communicationMessages += results.length;

            return {
                success: true,
                status: 'communicated',
                result: {
                    protocol: protocol,
                    messagesSent: results.length,
                    responses: results
                },
                metadata: {
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            this.logError('communicateWithAgents', error);
            throw error;
        }
    }

    /**
     * Get status of agents and coordination system
     */
    async getStatus({ agentName, detailed = false }) {
        try {
            if (agentName) {
                // Get specific agent status
                const agent = this.activeAgents.get(agentName);
                if (!agent) {
                    return {
                        success: false,
                        error: `Agent ${agentName} not found`
                    };
                }

                const agentData = await this.getFromMemory(`agent_registry_${agentName}`);
                
                return {
                    success: true,
                    agentId: agentName,
                    status: agent.status,
                    result: detailed ? agentData : {
                        type: agent.type,
                        status: agent.status,
                        created: agent.created
                    }
                };
            } else {
                // Get system status
                const systemStatus = await this.getSystemStatus();
                const activeAgentsList = Array.from(this.activeAgents.values());

                return {
                    success: true,
                    status: 'active',
                    result: {
                        system: systemStatus,
                        activeAgents: activeAgentsList.length,
                        agents: detailed ? activeAgentsList : activeAgentsList.map(a => ({
                            id: a.id,
                            type: a.type,
                            status: a.status
                        }))
                    },
                    coordinationState: this.coordinationState,
                    metadata: {
                        metrics: this.metrics,
                        timestamp: new Date().toISOString()
                    }
                };
            }
        } catch (error) {
            this.logError('getStatus', error);
            throw error;
        }
    }

    /**
     * Terminate an agent
     */
    async terminateAgent({ agentName, graceful = true }) {
        try {
            const agent = this.activeAgents.get(agentName);
            if (!agent) {
                return {
                    success: false,
                    error: `Agent ${agentName} not found`
                };
            }

            // Update agent status
            agent.status = 'terminating';
            await this.storeInMemory(`agent_registry_${agentName}`, agent);

            // Terminate the agent process
            const terminateResult = await this.terminateSparcAgent(agentName, graceful);

            if (terminateResult.success) {
                this.activeAgents.delete(agentName);
                await this.deleteFromMemory(`agent_registry_${agentName}`);
                await this.updateCoordinationState();

                return {
                    success: true,
                    agentId: agentName,
                    status: 'terminated',
                    result: {
                        graceful: graceful,
                        terminated: new Date().toISOString()
                    }
                };
            } else {
                throw new Error(`Failed to terminate agent: ${terminateResult.error}`);
            }
        } catch (error) {
            this.logError('terminateAgent', error);
            throw error;
        }
    }

    /**
     * Distribute tasks among agents
     */
    async distributeTasks({ tasks, agents, coordination = {} }) {
        try {
            const { mode = 'balanced', memoryKey } = coordination;
            
            this.logOperation('distributeTasks', { mode, tasksCount: tasks.length, agentsCount: agents.length });

            const distribution = this.calculateTaskDistribution(tasks, agents, mode);
            const results = [];

            for (const agentTasks of distribution) {
                const { agentType, assignedTasks } = agentTasks;
                
                // Spawn agent if needed
                let agentId;
                const existingAgent = Array.from(this.activeAgents.values())
                    .find(a => a.type === agentType && a.status === 'active');
                
                if (existingAgent) {
                    agentId = existingAgent.id;
                } else {
                    const spawnResult = await this.spawnAgent({
                        agentType,
                        task: assignedTasks.join('; '),
                        coordination: { memoryKey }
                    });
                    agentId = spawnResult.agentId;
                }

                // Distribute tasks to agent
                for (const task of assignedTasks) {
                    const taskResult = await this.assignTaskToAgent(agentId, task);
                    results.push({
                        agentId,
                        agentType,
                        task,
                        result: taskResult
                    });
                }
            }

            return {
                success: true,
                status: 'distributed',
                result: {
                    distributionMode: mode,
                    tasksDistributed: tasks.length,
                    agentsUsed: distribution.length,
                    assignments: results
                },
                metadata: {
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            this.logError('distributeTasks', error);
            throw error;
        }
    }

    // Coordination execution methods
    async executeHierarchical(agents, task, context) {
        // Orchestrator leads, specialists follow
        const results = [];
        
        if (agents.includes('orchestrator')) {
            const orchestratorResult = await this.spawnAgent({
                agentType: 'orchestrator',
                task: `Coordinate: ${task}`,
                coordination: { memoryKey: context.memoryKey }
            });
            results.push(orchestratorResult);
            
            // Spawn specialists under orchestrator coordination
            for (const agentType of agents.filter(a => a !== 'orchestrator')) {
                const agentResult = await this.spawnAgent({
                    agentType,
                    task: `Under orchestrator coordination: ${task}`,
                    coordination: { 
                        memoryKey: context.memoryKey,
                        coordinator: orchestratorResult.agentId
                    }
                });
                results.push(agentResult);
            }
        }
        
        return results;
    }

    async executeParallel(agents, task, context) {
        // All agents work in parallel
        const promises = agents.map(agentType => 
            this.spawnAgent({
                agentType,
                task,
                coordination: { 
                    memoryKey: context.memoryKey,
                    mode: 'parallel'
                }
            })
        );
        
        return await Promise.all(promises);
    }

    async executePipeline(agents, task, context) {
        // Sequential execution with handoffs
        const results = [];
        let previousResult = null;
        
        for (const agentType of agents) {
            const pipelineTask = previousResult 
                ? `Continue from previous: ${task}` 
                : task;
                
            const agentResult = await this.spawnAgent({
                agentType,
                task: pipelineTask,
                coordination: {
                    memoryKey: context.memoryKey,
                    mode: 'pipeline',
                    previousAgent: previousResult?.agentId
                }
            });
            
            results.push(agentResult);
            previousResult = agentResult;
        }
        
        return results;
    }

    async executeSwarm(agents, task, context) {
        // Swarm coordination with swarm-coordinator
        const swarmResult = await this.spawnAgent({
            agentType: 'swarm-coordinator',
            task: `Coordinate swarm for: ${task}`,
            coordination: {
                memoryKey: context.memoryKey,
                mode: 'swarm',
                agents: agents
            }
        });
        
        return [swarmResult];
    }

    async executeDistributed(agents, task, context) {
        // Distributed execution with minimal coordination
        return await this.executeParallel(agents, task, context);
    }

    // Helper methods
    isValidAgentType(agentType) {
        const validTypes = [
            'orchestrator', 'swarm-coordinator', 'workflow-manager', 'batch-executor',
            'coder', 'architect', 'reviewer', 'tester', 'tdd', 'debugger',
            'researcher', 'analyzer', 'optimizer',
            'designer', 'innovator', 'documenter', 'memory-manager'
        ];
        return validTypes.includes(agentType);
    }

    getAgentTools(agentType) {
        const toolMap = {
            'orchestrator': ['TodoWrite', 'TodoRead', 'Task', 'Memory', 'Bash'],
            'coder': ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'TodoWrite'],
            'researcher': ['WebSearch', 'WebFetch', 'Read', 'Write', 'Memory', 'TodoWrite', 'Task'],
            'tester': ['Read', 'Write', 'Edit', 'Bash', 'TodoWrite', 'Task'],
            'reviewer': ['Read', 'Edit', 'Grep', 'Bash', 'TodoWrite', 'Memory']
        };
        return toolMap[agentType] || ['Read', 'Write', 'Memory', 'TodoWrite'];
    }

    async launchSparcAgent(agentType, task, options) {
        try {
            const command = `./claude-flow sparc run ${agentType} "${task}" --memory-key "${options.memoryKey}"`;
            
            // For orchestrated use, we'll use the existing SPARC system
            // but track it through our coordination system
            const result = execSync(command, { 
                cwd: process.cwd(),
                timeout: 30000,
                encoding: 'utf8'
            });
            
            return {
                success: true,
                pid: Date.now(), // Simplified PID for demo
                output: result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async terminateSparcAgent(agentName, graceful) {
        try {
            // In a full implementation, this would terminate the actual agent process
            // For now, we'll just clean up our tracking
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    calculateTaskDistribution(tasks, agents, mode) {
        // Simplified task distribution algorithm
        const distribution = [];
        const tasksPerAgent = Math.ceil(tasks.length / agents.length);
        
        for (let i = 0; i < agents.length; i++) {
            const start = i * tasksPerAgent;
            const end = Math.min(start + tasksPerAgent, tasks.length);
            const assignedTasks = tasks.slice(start, end);
            
            if (assignedTasks.length > 0) {
                distribution.push({
                    agentType: agents[i],
                    assignedTasks
                });
            }
        }
        
        return distribution;
    }

    async assignTaskToAgent(agentId, task) {
        // Simplified task assignment
        return {
            success: true,
            task,
            assigned: new Date().toISOString()
        };
    }

    async sendMessage(agentId, protocol, data, task) {
        // Simplified message sending
        this.logOperation('sendMessage', { agentId, protocol });
        
        return {
            success: true,
            protocol,
            sent: new Date().toISOString()
        };
    }

    async getSystemStatus() {
        try {
            const status = execSync('./claude-flow status', { 
                encoding: 'utf8',
                timeout: 10000 
            });
            return { status: 'active', details: status };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    async updateCoordinationState() {
        this.coordinationState = {
            activeAgents: this.activeAgents.size,
            timestamp: new Date().toISOString(),
            agents: Array.from(this.activeAgents.keys())
        };
        
        await this.storeInMemory('coordination_state', this.coordinationState);
    }

    // Memory management methods
    async storeInMemory(key, data) {
        try {
            const command = `./claude-flow memory store "${key}" '${JSON.stringify(data)}'`;
            execSync(command, { encoding: 'utf8', timeout: 10000 });
            return true;
        } catch (error) {
            this.logError('storeInMemory', error);
            return false;
        }
    }

    async getFromMemory(key) {
        try {
            const command = `./claude-flow memory get "${key}"`;
            const result = execSync(command, { encoding: 'utf8', timeout: 10000 });
            
            // Parse the result to extract the actual value
            const lines = result.split('\n');
            const valueLine = lines.find(line => line.includes('"'));
            
            if (valueLine) {
                return JSON.parse(valueLine);
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async deleteFromMemory(key) {
        try {
            const command = `./claude-flow memory delete "${key}"`;
            execSync(command, { encoding: 'utf8', timeout: 10000 });
            return true;
        } catch (error) {
            return false;
        }
    }

    // Logging methods
    logOperation(operation, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation,
            data,
            level: 'info'
        };
        
        console.log(`[Agent Tool] ${operation}:`, JSON.stringify(data, null, 2));
    }

    logError(operation, error) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation,
            error: error.message,
            stack: error.stack,
            level: 'error'
        };
        
        console.error(`[Agent Tool Error] ${operation}:`, error.message);
    }
}

// CLI interface
if (require.main === module) {
    const tool = new AgentTool();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    let input;
    
    try {
        if (args.length > 0) {
            input = JSON.parse(args[0]);
        } else {
            // Read from stdin
            const stdin = process.stdin;
            let data = '';
            
            stdin.on('data', chunk => data += chunk);
            stdin.on('end', async () => {
                try {
                    input = JSON.parse(data);
                    const result = await tool.execute(input);
                    console.log(JSON.stringify(result, null, 2));
                    process.exit(0);
                } catch (error) {
                    console.error('Error:', error.message);
                    process.exit(1);
                }
            });
            
            return;
        }
        
        tool.execute(input).then(result => {
            console.log(JSON.stringify(result, null, 2));
            process.exit(0);
        }).catch(error => {
            console.error('Error:', error.message);
            process.exit(1);
        });
    } catch (error) {
        console.error('Invalid input:', error.message);
        process.exit(1);
    }
}

module.exports = AgentTool;