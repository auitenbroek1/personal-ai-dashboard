#!/usr/bin/env node
/**
 * Orchestrated Workflows for AI Agent Tool Integration
 * Provides pre-built workflows for common agent coordination patterns
 */

const AgentTool = require('./agent-tool.js');
const fs = require('fs');
const path = require('path');

class OrchestatedWorkflows {
    constructor() {
        this.agentTool = new AgentTool();
        this.workflowsDir = path.join(__dirname, 'workflows');
        this.ensureWorkflowsDir();
        this.loadWorkflowDefinitions();
    }

    ensureWorkflowsDir() {
        if (!fs.existsSync(this.workflowsDir)) {
            fs.mkdirSync(this.workflowsDir, { recursive: true });
        }
    }

    loadWorkflowDefinitions() {
        this.workflows = {
            'full-stack-development': {
                name: 'Full-Stack Development',
                description: 'Complete application development workflow with architecture, coding, testing, and documentation',
                stages: [
                    {
                        name: 'architecture',
                        agents: ['architect'],
                        tasks: ['Design system architecture', 'Create technical specifications'],
                        parallel: false,
                        dependencies: []
                    },
                    {
                        name: 'development',
                        agents: ['coder', 'coder'],
                        tasks: ['Implement backend services', 'Implement frontend components'],
                        parallel: true,
                        dependencies: ['architecture']
                    },
                    {
                        name: 'testing',
                        agents: ['tester', 'reviewer'],
                        tasks: ['Run comprehensive tests', 'Code quality review'],
                        parallel: true,
                        dependencies: ['development']
                    },
                    {
                        name: 'documentation',
                        agents: ['documenter'],
                        tasks: ['Generate API documentation', 'Create user guides'],
                        parallel: false,
                        dependencies: ['testing']
                    }
                ],
                coordination: {
                    mode: 'pipeline',
                    memoryKey: 'fullstack_dev',
                    maxAgents: 6
                }
            },
            'research-and-analysis': {
                name: 'Research and Analysis',
                description: 'Comprehensive research workflow with data gathering, analysis, and insights generation',
                stages: [
                    {
                        name: 'research',
                        agents: ['researcher', 'researcher'],
                        tasks: ['Web research on topic', 'Competitive analysis'],
                        parallel: true,
                        dependencies: []
                    },
                    {
                        name: 'analysis',
                        agents: ['analyzer', 'innovator'],
                        tasks: ['Data pattern analysis', 'Innovation opportunities'],
                        parallel: true,
                        dependencies: ['research']
                    },
                    {
                        name: 'synthesis',
                        agents: ['memory-manager', 'documenter'],
                        tasks: ['Knowledge organization', 'Report generation'],
                        parallel: true,
                        dependencies: ['analysis']
                    }
                ],
                coordination: {
                    mode: 'distributed',
                    memoryKey: 'research_analysis',
                    maxAgents: 6
                }
            },
            'code-optimization': {
                name: 'Code Optimization',
                description: 'Performance optimization workflow with analysis, optimization, and validation',
                stages: [
                    {
                        name: 'baseline',
                        agents: ['analyzer'],
                        tasks: ['Performance baseline analysis'],
                        parallel: false,
                        dependencies: []
                    },
                    {
                        name: 'optimization',
                        agents: ['optimizer', 'reviewer'],
                        tasks: ['Apply performance optimizations', 'Code quality review'],
                        parallel: true,
                        dependencies: ['baseline']
                    },
                    {
                        name: 'validation',
                        agents: ['tester'],
                        tasks: ['Performance validation testing'],
                        parallel: false,
                        dependencies: ['optimization']
                    }
                ],
                coordination: {
                    mode: 'pipeline',
                    memoryKey: 'code_optimization',
                    maxAgents: 4
                }
            },
            'debugging-workflow': {
                name: 'Systematic Debugging',
                description: 'Structured debugging workflow for complex issues',
                stages: [
                    {
                        name: 'analysis',
                        agents: ['debugger', 'analyzer'],
                        tasks: ['Issue reproduction and analysis', 'Log pattern analysis'],
                        parallel: true,
                        dependencies: []
                    },
                    {
                        name: 'resolution',
                        agents: ['coder'],
                        tasks: ['Implement fixes'],
                        parallel: false,
                        dependencies: ['analysis']
                    },
                    {
                        name: 'verification',
                        agents: ['tester', 'reviewer'],
                        tasks: ['Regression testing', 'Fix quality review'],
                        parallel: true,
                        dependencies: ['resolution']
                    }
                ],
                coordination: {
                    mode: 'pipeline',
                    memoryKey: 'debugging_session',
                    maxAgents: 5
                }
            },
            'ai-swarm-coordination': {
                name: 'AI Swarm Coordination',
                description: 'Large-scale parallel processing with swarm intelligence',
                stages: [
                    {
                        name: 'coordination-setup',
                        agents: ['swarm-coordinator'],
                        tasks: ['Initialize swarm coordination'],
                        parallel: false,
                        dependencies: []
                    },
                    {
                        name: 'parallel-execution',
                        agents: ['batch-executor', 'workflow-manager'],
                        tasks: ['Parallel task execution', 'Workflow orchestration'],
                        parallel: true,
                        dependencies: ['coordination-setup']
                    },
                    {
                        name: 'aggregation',
                        agents: ['memory-manager'],
                        tasks: ['Result aggregation and storage'],
                        parallel: false,
                        dependencies: ['parallel-execution']
                    }
                ],
                coordination: {
                    mode: 'swarm',
                    memoryKey: 'swarm_coordination',
                    maxAgents: 10
                }
            },
            'tdd-development': {
                name: 'Test-Driven Development',
                description: 'TDD workflow with test-first development approach',
                stages: [
                    {
                        name: 'test-design',
                        agents: ['tdd'],
                        tasks: ['Design and write failing tests'],
                        parallel: false,
                        dependencies: []
                    },
                    {
                        name: 'implementation',
                        agents: ['coder'],
                        tasks: ['Implement code to pass tests'],
                        parallel: false,
                        dependencies: ['test-design']
                    },
                    {
                        name: 'refactoring',
                        agents: ['reviewer', 'optimizer'],
                        tasks: ['Code review and refactoring', 'Performance optimization'],
                        parallel: true,
                        dependencies: ['implementation']
                    }
                ],
                coordination: {
                    mode: 'pipeline',
                    memoryKey: 'tdd_development',
                    maxAgents: 4
                }
            }
        };
    }

    /**
     * Execute a predefined workflow
     */
    async executeWorkflow(workflowName, task, options = {}) {
        try {
            const workflow = this.workflows[workflowName];
            if (!workflow) {
                throw new Error(`Unknown workflow: ${workflowName}`);
            }

            console.log(`🚀 Starting workflow: ${workflow.name}`);
            console.log(`📝 Task: ${task}`);

            const workflowExecution = {
                id: `workflow_${Date.now()}`,
                name: workflowName,
                task: task,
                startTime: new Date().toISOString(),
                stages: [],
                status: 'running',
                memoryKey: options.memoryKey || workflow.coordination.memoryKey
            };

            // Store workflow state
            await this.storeWorkflowState(workflowExecution);

            // Execute stages
            for (const stage of workflow.stages) {
                console.log(`\n📋 Executing stage: ${stage.name}`);
                
                const stageResult = await this.executeStage(stage, task, workflowExecution);
                workflowExecution.stages.push(stageResult);
                
                // Update workflow state
                await this.storeWorkflowState(workflowExecution);
                
                if (!stageResult.success) {
                    workflowExecution.status = 'failed';
                    workflowExecution.error = `Stage ${stage.name} failed: ${stageResult.error}`;
                    break;
                }
            }

            if (workflowExecution.status === 'running') {
                workflowExecution.status = 'completed';
            }

            workflowExecution.endTime = new Date().toISOString();
            workflowExecution.duration = Date.now() - new Date(workflowExecution.startTime).getTime();

            await this.storeWorkflowState(workflowExecution);

            console.log(`\n✅ Workflow ${workflowName} ${workflowExecution.status}`);
            
            return {
                success: workflowExecution.status === 'completed',
                workflowId: workflowExecution.id,
                status: workflowExecution.status,
                stages: workflowExecution.stages,
                duration: workflowExecution.duration,
                memoryKey: workflowExecution.memoryKey
            };

        } catch (error) {
            console.error(`❌ Workflow execution failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Execute a single workflow stage
     */
    async executeStage(stage, baseTask, workflowExecution) {
        try {
            const stageExecution = {
                name: stage.name,
                startTime: new Date().toISOString(),
                agents: [],
                status: 'running'
            };

            if (stage.parallel) {
                // Execute agents in parallel
                const agentPromises = stage.agents.map((agentType, index) => {
                    const stageTask = stage.tasks[index] || stage.tasks[0];
                    const fullTask = `${baseTask} - ${stageTask}`;
                    
                    return this.agentTool.execute({
                        action: 'spawn',
                        agentType: agentType,
                        task: fullTask,
                        coordination: {
                            memoryKey: workflowExecution.memoryKey,
                            mode: 'parallel',
                            stage: stage.name
                        }
                    });
                });

                const results = await Promise.all(agentPromises);
                stageExecution.agents = results;
                stageExecution.success = results.every(r => r.success);
                
                if (!stageExecution.success) {
                    const failedAgent = results.find(r => !r.success);
                    stageExecution.error = failedAgent.error;
                }
            } else {
                // Execute agents sequentially
                for (let i = 0; i < stage.agents.length; i++) {
                    const agentType = stage.agents[i];
                    const stageTask = stage.tasks[i] || stage.tasks[0];
                    const fullTask = `${baseTask} - ${stageTask}`;
                    
                    const result = await this.agentTool.execute({
                        action: 'spawn',
                        agentType: agentType,
                        task: fullTask,
                        coordination: {
                            memoryKey: workflowExecution.memoryKey,
                            mode: 'sequential',
                            stage: stage.name,
                            previousAgent: stageExecution.agents[i - 1]?.agentId
                        }
                    });

                    stageExecution.agents.push(result);
                    
                    if (!result.success) {
                        stageExecution.success = false;
                        stageExecution.error = result.error;
                        break;
                    }
                }
                
                if (!stageExecution.hasOwnProperty('success')) {
                    stageExecution.success = true;
                }
            }

            stageExecution.endTime = new Date().toISOString();
            stageExecution.duration = Date.now() - new Date(stageExecution.startTime).getTime();
            stageExecution.status = stageExecution.success ? 'completed' : 'failed';

            console.log(`   ${stageExecution.success ? '✅' : '❌'} Stage ${stage.name} ${stageExecution.status}`);

            return stageExecution;

        } catch (error) {
            console.error(`❌ Stage ${stage.name} execution failed: ${error.message}`);
            return {
                name: stage.name,
                success: false,
                error: error.message,
                status: 'failed'
            };
        }
    }

    /**
     * List available workflows
     */
    listWorkflows() {
        console.log('📋 Available Orchestrated Workflows:');
        console.log('=====================================');

        for (const [workflowName, workflow] of Object.entries(this.workflows)) {
            console.log(`\n🔄 ${workflow.name} (${workflowName})`);
            console.log(`   Description: ${workflow.description}`);
            console.log(`   Stages: ${workflow.stages.length}`);
            console.log(`   Coordination: ${workflow.coordination.mode}`);
            console.log(`   Max Agents: ${workflow.coordination.maxAgents}`);
            
            console.log(`   Stage Details:`);
            for (const stage of workflow.stages) {
                const parallelFlag = stage.parallel ? ' (parallel)' : ' (sequential)';
                console.log(`     • ${stage.name}: ${stage.agents.join(', ')}${parallelFlag}`);
            }
        }
    }

    /**
     * Create a custom workflow
     */
    async createCustomWorkflow(name, definition) {
        try {
            // Validate workflow definition
            this.validateWorkflowDefinition(definition);

            // Store workflow
            this.workflows[name] = definition;

            // Save to file
            const workflowPath = path.join(this.workflowsDir, `${name}.json`);
            fs.writeFileSync(workflowPath, JSON.stringify(definition, null, 2));

            console.log(`✅ Created custom workflow: ${name}`);
            
            return {
                success: true,
                workflowName: name,
                path: workflowPath
            };

        } catch (error) {
            console.error(`❌ Failed to create workflow: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate workflow definition
     */
    validateWorkflowDefinition(definition) {
        if (!definition.name || !definition.description) {
            throw new Error('Workflow must have name and description');
        }

        if (!definition.stages || !Array.isArray(definition.stages)) {
            throw new Error('Workflow must have stages array');
        }

        for (const stage of definition.stages) {
            if (!stage.name || !stage.agents || !Array.isArray(stage.agents)) {
                throw new Error('Each stage must have name and agents array');
            }

            // Validate agent types
            for (const agentType of stage.agents) {
                if (!this.isValidAgentType(agentType)) {
                    throw new Error(`Invalid agent type: ${agentType}`);
                }
            }
        }

        if (!definition.coordination) {
            throw new Error('Workflow must have coordination configuration');
        }
    }

    /**
     * Check if agent type is valid
     */
    isValidAgentType(agentType) {
        const validTypes = [
            'orchestrator', 'swarm-coordinator', 'workflow-manager', 'batch-executor',
            'coder', 'architect', 'reviewer', 'tester', 'tdd', 'debugger',
            'researcher', 'analyzer', 'optimizer',
            'designer', 'innovator', 'documenter', 'memory-manager'
        ];
        return validTypes.includes(agentType);
    }

    /**
     * Store workflow execution state
     */
    async storeWorkflowState(workflowExecution) {
        const key = `workflow_state_${workflowExecution.id}`;
        await this.agentTool.storeInMemory(key, workflowExecution);
    }

    /**
     * Get workflow execution history
     */
    async getWorkflowHistory(limit = 10) {
        try {
            // In practice, would query memory for workflow states
            // For now, return placeholder
            return {
                success: true,
                workflows: [],
                count: 0
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Monitor active workflows
     */
    async monitorWorkflows() {
        console.log('🔍 Monitoring active workflows...');
        
        // In practice, would track active workflow states
        // For now, return system status
        const status = await this.agentTool.getStatus({});
        
        console.log('📊 Workflow System Status:');
        console.log(`   Active Agents: ${status.result.activeAgents}`);
        console.log(`   System Status: ${status.status}`);
        
        return status;
    }
}

// CLI interface
if (require.main === module) {
    const workflows = new OrchestatedWorkflows();
    const command = process.argv[2] || 'list';

    switch (command) {
        case 'list':
            workflows.listWorkflows();
            break;
            
        case 'execute':
            const workflowName = process.argv[3];
            const task = process.argv[4];
            
            if (!workflowName || !task) {
                console.error('Usage: node orchestrated-workflows.js execute <workflow-name> "<task>"');
                process.exit(1);
            }
            
            workflows.executeWorkflow(workflowName, task)
                .then(result => {
                    console.log('\n📊 Execution Result:');
                    console.log(JSON.stringify(result, null, 2));
                })
                .catch(error => {
                    console.error('Execution failed:', error.message);
                    process.exit(1);
                });
            break;
            
        case 'monitor':
            workflows.monitorWorkflows().catch(console.error);
            break;
            
        case 'history':
            const limit = parseInt(process.argv[3]) || 10;
            workflows.getWorkflowHistory(limit)
                .then(result => {
                    console.log(JSON.stringify(result, null, 2));
                })
                .catch(console.error);
            break;
            
        default:
            console.log('Available commands:');
            console.log('  list                              List available workflows');
            console.log('  execute <workflow> "<task>"       Execute a workflow');
            console.log('  monitor                           Monitor active workflows');
            console.log('  history [limit]                   Show workflow history');
            break;
    }
}

module.exports = OrchestatedWorkflows;