# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **SPARC-enabled claude-flow project** with advanced AI agent integration and coordination capabilities. The project includes:

- **17 SPARC Modes**: Specialized AI agents for development, analysis, and coordination
- **Agent Integration**: Seamless AI agent communication and coordination
- **Memory Management**: Persistent knowledge sharing across agents and sessions
- **Workflow Automation**: Automated development and deployment pipelines
- **Swarm Coordination**: Multi-agent collaborative processing

## 🔬 Advanced AI Framework Integrations

### SAFLA Integration (Self-Aware Feedback Loop Algorithm)
**Status:** ✅ Fully Integrated and Operational

**Overview:** SAFLA provides persistent memory, self-learning capabilities, and 172k+ ops/sec performance optimization for AI agents.

**Available Tools (14 enhanced capabilities):**
- `generate_embeddings` - 1.75M+ ops/sec embedding generation
- `store_memory` - Hybrid memory system (episodic, semantic, procedural)
- `retrieve_memories` - Intelligent memory search and retrieval
- `analyze_text` - Deep semantic analysis with entity extraction
- `detect_patterns` - Advanced pattern recognition and anomaly detection
- `build_knowledge_graph` - Dynamic knowledge graph construction
- `batch_process` - High-performance batch processing (172k+ ops/sec)
- `consolidate_memories` - Memory optimization and compression
- `optimize_parameters` - Auto-tuning for specific workloads
- `create_session` - Persistent session management
- `export_memory_snapshot` - Memory backup and transfer
- `run_benchmark` - Comprehensive performance testing
- `monitor_health` - Real-time system diagnostics
- `get_performance` - Performance metrics and statistics

**Performance Benefits:**
- **172,000+ operations/sec** processing speed
- **87% cache hit rate** with intelligent memory management
- **60% memory compression** for efficiency optimization
- **Sub-50ms response times** for most operations

### FACT Integration (Fast Augmented Context Tools)
**Status:** ✅ Fully Integrated and Operational

**Overview:** FACT replaces traditional RAG with prompt caching and deterministic tool execution, providing sub-50ms response times and 93% cost reduction.

**Available Tools (4 specialized tools):**
- `sql_query_readonly` - Cached SQL queries with sub-50ms response times
- `sql_get_schema` - Database schema information with intelligent caching
- `sql_get_sample_queries` - Example queries for data exploration
- `system_get_metrics` - FACT performance metrics and cache statistics

**Performance Benefits:**
- **Sub-50ms response times** for cached queries
- **93% cost reduction** through intelligent caching
- **87.3% cache hit rate** with smart invalidation
- **1000+ queries per minute** throughput capability

## MCP Configuration

Your `.roo/mcp.json` is configured with both frameworks:

```json
{
  "mcpServers": {
    "safla": {
      "command": "python3",
      "args": ["/Users/aaronuitenbroek/test-project/.claude/integrations/safla_mcp_server.py"],
      "env": {
        "SAFLA_REMOTE_URL": "https://safla.fly.dev"
      }
    },
    "fact": {
      "command": "python3", 
      "args": ["/Users/aaronuitenbroek/test-project/.claude/fact/mcp_server.py"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        "FACT_DATABASE_PATH": "/Users/aaronuitenbroek/test-project/.claude/fact/database.db"
      }
    }
  }
}
```

## Using the Advanced Integrations

**In Claude Code conversations, you can now leverage:**

### 1. SAFLA Memory & AI Operations
```
"Store this solution in SAFLA memory for future reference"
"Retrieve similar solutions from SAFLA memory"
"Analyze this text for sentiment and entities using SAFLA"
"Build a knowledge graph from these concepts"
"Detect patterns in this dataset"
"Run performance benchmarks on the system"
"Batch process these items using SAFLA's optimization engine"
```

### 2. FACT Data Analysis & Caching
```
"Query the financial database for Q1 revenue data"
"Get the database schema information"
"Show me example financial analysis queries"
"Get FACT system performance metrics"
```

### 3. Advanced Workflow Patterns
```
"Use SAFLA to analyze this code and store insights for future projects"
"Build a knowledge graph of the system architecture using SAFLA"
"Query the FACT database for performance metrics and analyze patterns"
"Optimize the current workflow using SAFLA's parameter tuning"
```

## Integration Architecture

Both frameworks integrate seamlessly with your existing claude-flow setup:

```
Claude Code
    ↓
MCP Protocol
    ↓
┌─────────────────┬─────────────────┐
│   SAFLA Tools   │   FACT Tools    │
├─────────────────┼─────────────────┤
│ • Memory Mgmt   │ • SQL Queries   │
│ • Text Analysis │ • Data Caching  │
│ • Knowledge     │ • Performance   │
│   Graphs        │   Metrics       │
│ • Pattern       │ • Schema Info   │
│   Detection     │                 │
│ • Benchmarking  │                 │
└─────────────────┴─────────────────┘
    ↓
Performance Enhancement
    ↓
Your Enhanced Development Environment
```

## Core Architecture

### AI Agent Integration
- **Coordination Layer**: Memory-based state sharing and event-driven communication
- **Agent Types**: Specialists (coder, tester, reviewer), Coordinators (orchestrator, swarm-coordinator), Processors (batch-executor, workflow-manager)
- **Communication Protocols**: Todo-based coordination, memory sharing, event bus messaging
- **Lifecycle Management**: Automated spawning, monitoring, and termination

### SPARC Framework
- **Specialized Modes**: Each mode is optimized for specific tasks with tailored tools
- **Parallel Execution**: Multiple agents can work concurrently on independent tasks
- **Knowledge Persistence**: All insights and patterns stored in shared memory
- **Quality Integration**: Built-in testing, review, and optimization workflows

## Build Commands
- `npm run build`: Build the project
- `npm run test`: Run the full test suite
- `npm run lint`: Run ESLint and format checks
- `npm run typecheck`: Run TypeScript type checking
- `./claude-flow --help`: Show all available commands

## Code Style Preferences
- Use ES modules (import/export) syntax
- Destructure imports when possible
- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Use async/await instead of Promise chains
- Prefer const/let over var

## Important Notes
- **Use TodoWrite extensively** for all complex task coordination
- **Leverage Task tool** for parallel agent execution on independent work
- **Store all important information in Memory** for cross-agent coordination
- **Use batch file operations** whenever reading/writing multiple files
- **Enable agent coordination** through .claude/agent-integration.json configuration
- **Monitor agent performance** with built-in monitoring and alerting
- **All swarm operations include automatic batch tool coordination**
- **Monitor progress** with TodoRead during long-running operations
- **Enable parallel execution** with --parallel flags for maximum efficiency
- **Leverage SAFLA and FACT integrations** for enhanced AI capabilities and performance optimization

This configuration ensures optimal AI agent integration with coordinated batch tools for swarm orchestration, parallel task execution, and advanced AI framework capabilities through SAFLA and FACT integrations.