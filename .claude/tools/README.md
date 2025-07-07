# AI Agent Tool Integration for Claude-Flow

## Overview

This directory contains the complete integration of the AI agent system into claude-flow as proper tools. The integration transforms the standalone SPARC agent system into orchestrated tools that can be invoked and coordinated directly through claude-flow's tool system.

## Architecture

### Tool Integration Layers

1. **Tool Registry** (`registry.json`)
   - Defines tool schemas and capabilities
   - Manages tool discovery and metadata
   - Configures permissions and dependencies

2. **Agent Tool** (`agent-tool.js`)
   - Core orchestration tool for AI agents
   - Handles spawning, coordination, and communication
   - Provides standardized tool interface

3. **Tool Registration** (`register-tools.js`)
   - Registers tools with claude-flow system
   - Creates tool wrappers for integration
   - Manages permissions and discovery

4. **Orchestrated Workflows** (`orchestrated-workflows.js`)
   - Pre-built workflow templates
   - Multi-stage agent coordination
   - Complex task orchestration

## Available Tools

### Agent (Primary Tool)

**Capabilities:**
- Agent spawning and management
- Multi-agent coordination
- Inter-agent communication
- Task distribution
- Status monitoring

**Actions:**
- `spawn`: Create new SPARC agent instances
- `coordinate`: Orchestrate multiple agents
- `communicate`: Send messages between agents
- `terminate`: Clean shutdown of agents
- `status`: Monitor agent and system status
- `distribute`: Distribute tasks among agents

**Usage Examples:**
```javascript
// Spawn a researcher agent
Agent({
  action: "spawn",
  agentType: "researcher",
  task: "Analyze market trends in AI",
  coordination: {
    memoryKey: "market_research",
    mode: "hierarchical"
  }
})

// Coordinate multiple agents
Agent({
  action: "coordinate",
  coordination: {
    mode: "parallel",
    agents: ["coder", "tester", "reviewer"],
    memoryKey: "development_coordination"
  },
  task: "Build authentication system"
})

// Check system status
Agent({
  action: "status",
  detailed: true
})
```

## Orchestrated Workflows

### Available Workflows

1. **full-stack-development**
   - Architecture → Development → Testing → Documentation
   - Pipeline coordination with 6 max agents

2. **research-and-analysis**
   - Research → Analysis → Synthesis
   - Distributed coordination with parallel processing

3. **code-optimization**
   - Baseline → Optimization → Validation
   - Pipeline coordination with performance focus

4. **debugging-workflow**
   - Analysis → Resolution → Verification
   - Systematic debugging approach

5. **ai-swarm-coordination**
   - Setup → Parallel Execution → Aggregation
   - Large-scale swarm intelligence

6. **tdd-development**
   - Test Design → Implementation → Refactoring
   - Test-driven development methodology

### Workflow Execution

```javascript
// Execute a workflow
OrchesteredWorkflows.execute("full-stack-development", "Build e-commerce platform")

// Custom workflow creation
OrchesteredWorkflows.createCustomWorkflow("custom-workflow", {
  name: "Custom Development Flow",
  description: "Tailored workflow for specific needs",
  stages: [
    {
      name: "planning",
      agents: ["architect"],
      tasks: ["System design"],
      parallel: false,
      dependencies: []
    }
  ],
  coordination: {
    mode: "pipeline",
    memoryKey: "custom_flow",
    maxAgents: 4
  }
})
```

## Integration Features

### Tool Discovery and Registration

- **Automatic Discovery**: Tools are automatically discovered by claude-flow
- **Schema Validation**: Input/output schemas ensure proper integration
- **Permission Management**: Fine-grained access control
- **Wrapper Generation**: Automatic wrapper creation for claude-flow compatibility

### Coordination Modes

1. **Hierarchical**: Orchestrator leads, specialists follow
2. **Parallel**: All agents work concurrently
3. **Pipeline**: Sequential execution with handoffs
4. **Distributed**: Minimal coordination, distributed execution
5. **Swarm**: Swarm intelligence with dynamic coordination

### Communication Protocols

1. **Memory-Shared**: Persistent state sharing through Memory tool
2. **Event-Driven**: Real-time coordination through event bus
3. **Todo-Based**: Task coordination through TodoWrite/TodoRead
4. **Direct**: Point-to-point agent communication

## Configuration

### Registry Configuration (`registry.json`)

```json
{
  "toolRegistry": {
    "version": "1.0.0",
    "tools": {
      "Agent": {
        "name": "Agent",
        "type": "orchestration",
        "category": "ai-coordination",
        "capabilities": ["agent-spawning", "coordination", "communication"],
        "inputSchema": { ... },
        "outputSchema": { ... },
        "implementation": {
          "type": "script",
          "path": ".claude/tools/agent-tool.js"
        }
      }
    }
  }
}
```

### Settings Integration

Tools automatically update claude-flow settings to include necessary permissions:

```json
{
  "permissions": {
    "allow": [
      "Agent(*)",
      "Task(*)",
      "Memory(*)",
      "TodoWrite(*)",
      "TodoRead(*)"
    ]
  }
}
```

## Usage Patterns

### Direct Tool Invocation

```javascript
// In CLAUDE.md or agent instructions
Agent({
  action: "spawn",
  agentType: "coder",
  task: "Implement user authentication",
  coordination: {
    memoryKey: "auth_development",
    mode: "hierarchical"
  }
})
```

### Workflow-Based Orchestration

```javascript
// Use pre-built workflows
TodoWrite([
  {
    id: "workflow_execution",
    content: "Execute full-stack development workflow",
    priority: "high",
    tool: "OrchesteredWorkflows",
    params: {
      workflow: "full-stack-development",
      task: "Build user dashboard"
    }
  }
])
```

### Memory-Coordinated Development

```javascript
// Store project context
Memory.store("project_architecture", {
  pattern: "microservices",
  technologies: ["Node.js", "React", "PostgreSQL"],
  standards: ["REST API", "JWT auth", "Docker containers"]
})

// Spawn coordinated agents that use shared context
Agent({
  action: "coordinate",
  coordination: {
    mode: "hierarchical",
    agents: ["architect", "coder", "tester"],
    memoryKey: "project_architecture"
  },
  task: "Implement based on stored architecture"
})
```

## Monitoring and Control

### Real-time Monitoring

```javascript
// Check system status
Agent({ action: "status", detailed: true })

// Monitor specific agent
Agent({ 
  action: "status", 
  agentName: "researcher_12345",
  detailed: true 
})
```

### Performance Metrics

The tool system tracks:
- Agents spawned and active
- Coordination events
- Communication messages
- Error rates and types
- Execution times and performance

### Error Handling

- Automatic retry mechanisms
- Graceful degradation
- Error isolation and recovery
- Comprehensive logging
- Alert generation

## Best Practices

### Tool Usage

1. **Use Agent tool for coordination**: Prefer orchestrated spawning over direct SPARC commands
2. **Leverage Memory for state**: Share context and results through Memory tool
3. **Monitor actively**: Use status actions to track progress
4. **Plan workflows**: Use pre-built workflows for common patterns
5. **Handle errors gracefully**: Implement proper error handling and recovery

### Performance Optimization

1. **Batch operations**: Group related agent operations
2. **Parallel execution**: Use parallel coordination where possible
3. **Memory efficiency**: Store only essential data in shared memory
4. **Resource limits**: Respect agent limits and timeouts
5. **Clean shutdown**: Properly terminate agents when done

### Integration Guidelines

1. **Follow schemas**: Use proper input/output schemas
2. **Validate inputs**: Check parameters before tool execution
3. **Handle timeouts**: Account for long-running operations
4. **Log comprehensively**: Track all operations for debugging
5. **Test thoroughly**: Validate integration before deployment

## Command Line Interface

### Tool Registration

```bash
# Register all tools
node .claude/tools/register-tools.js register

# Validate tool implementations
node .claude/tools/register-tools.js validate

# List registered tools
node .claude/tools/register-tools.js list

# Unregister tools
node .claude/tools/register-tools.js unregister Agent
```

### Direct Tool Testing

```bash
# Test Agent tool
node .claude/tools/agent-tool.js '{"action": "status"}'

# Test workflow execution
node .claude/tools/orchestrated-workflows.js execute research-and-analysis "AI market analysis"

# List workflows
node .claude/tools/orchestrated-workflows.js list
```

## Integration Status

✅ **Tool Registry**: Complete with schema definitions
✅ **Agent Tool Implementation**: Full orchestration capabilities
✅ **Tool Registration System**: Automatic discovery and integration
✅ **Workflow Orchestration**: Pre-built and custom workflows
✅ **Permission Management**: Automatic claude-flow integration
✅ **Communication Protocols**: Memory, event, and todo-based coordination
✅ **Monitoring and Control**: Real-time status and performance tracking
✅ **Error Handling**: Comprehensive error management and recovery

The AI agent system is now fully integrated as proper claude-flow tools, enabling orchestrated multi-agent development workflows with enterprise-grade coordination and monitoring capabilities.