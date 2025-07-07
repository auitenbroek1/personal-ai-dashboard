# SPARC Framework Examples

## Example Workflows

### 1. Full-Stack Web Application Development

**Objective**: Build a complete web application with frontend, backend, and database

**Workflow**:
```bash
# Step 1: Architecture and Planning
./claude-flow sparc run architect "Design REST API architecture for task management app" \
  --memory-key task_app_architecture

# Step 2: Orchestrated Development
./claude-flow sparc run orchestrator "Implement task management application" \
  --agents coder,tester,reviewer,documenter \
  --memory-key task_app_development \
  --parallel --monitor

# Step 3: Quality Assurance and Optimization
./claude-flow sparc run workflow-manager "QA and deployment pipeline" \
  --agents tester,optimizer,documenter \
  --memory-key task_app_qa
```

**Expected Outputs**:
- System architecture documentation
- Complete application code with tests
- API documentation
- Deployment configuration
- Performance optimization report

### 2. Research and Innovation Project

**Objective**: Research emerging AI technologies and propose implementation strategy

**Workflow**:
```bash
# Step 1: Research Phase
./claude-flow sparc run researcher "Investigate latest developments in LLM technologies" \
  --memory-key ai_research_2025 \
  --parallel --timeout 60

# Step 2: Analysis and Innovation
./claude-flow sparc run swarm-coordinator "AI technology analysis and innovation" \
  --agents researcher,innovator,analyzer \
  --memory-key ai_innovation \
  --max-agents 6

# Step 3: Documentation and Recommendations
./claude-flow sparc run documenter "Create comprehensive AI technology report" \
  --memory-key ai_innovation \
  --format comprehensive
```

**Expected Outputs**:
- Technology landscape analysis
- Innovation opportunities report
- Implementation recommendations
- Risk assessment and mitigation strategies

### 3. Code Quality and Performance Optimization

**Objective**: Analyze existing codebase and implement comprehensive improvements

**Workflow**:
```bash
# Step 1: Comprehensive Analysis
./claude-flow sparc run analyzer "Analyze codebase for performance and quality issues" \
  --memory-key code_analysis \
  --parallel --deep-scan

# Step 2: Code Review and Issues Identification
./claude-flow sparc run reviewer "Systematic code review with quality metrics" \
  --memory-key code_review_findings \
  --generate-report

# Step 3: Performance Optimization
./claude-flow sparc run optimizer "Implement performance optimizations" \
  --memory-key optimization_plan \
  --baseline --metrics

# Step 4: Testing and Validation
./claude-flow sparc run tester "Comprehensive testing of optimized code" \
  --memory-key optimization_validation \
  --coverage 95 --performance-tests
```

**Expected Outputs**:
- Code quality assessment report
- Performance benchmarks and improvements
- Comprehensive test suite
- Optimization documentation

### 4. Documentation and Knowledge Management

**Objective**: Create comprehensive documentation system for a complex project

**Workflow**:
```bash
# Step 1: Knowledge Audit and Organization
./claude-flow sparc run memory-manager "Audit and organize project knowledge" \
  --memory-key project_knowledge \
  --index --categorize

# Step 2: Documentation Generation
./claude-flow sparc run documenter "Generate comprehensive project documentation" \
  --memory-key project_docs \
  --formats "api,user,technical,visual"

# Step 3: User Experience Design for Documentation
./claude-flow sparc run designer "Design documentation user experience" \
  --memory-key docs_ux \
  --interactive --accessible

# Step 4: Batch Processing and Publishing
./claude-flow sparc run batch-executor "Process and publish documentation" \
  --memory-key docs_publishing \
  --parallel --optimize
```

**Expected Outputs**:
- Organized knowledge base
- Multi-format documentation
- Interactive documentation website
- Documentation maintenance workflows

### 5. Debugging and Issue Resolution

**Objective**: Systematically debug complex production issues

**Workflow**:
```bash
# Step 1: Issue Analysis
./claude-flow sparc run debugger "Analyze production issue symptoms" \
  --memory-key issue_analysis \
  --systematic --trace

# Step 2: Data Analysis for Root Cause
./claude-flow sparc run analyzer "Analyze logs and metrics for patterns" \
  --memory-key root_cause_analysis \
  --pattern-detection --correlation

# Step 3: Solution Development and Testing
./claude-flow sparc run orchestrator "Develop and test issue resolution" \
  --agents coder,tester,reviewer \
  --memory-key issue_resolution \
  --validation-required

# Step 4: Knowledge Capture and Process Improvement
./claude-flow sparc run memory-manager "Document issue resolution process" \
  --memory-key incident_knowledge \
  --pattern-storage --future-prevention
```

**Expected Outputs**:
- Root cause analysis report
- Issue resolution implementation
- Validated fixes with tests
- Prevention strategies and documentation

## Advanced Multi-Mode Scenarios

### Scenario 1: Startup MVP Development

**Timeline**: 2-week sprint
**Team**: Solo developer with AI assistance

```bash
# Week 1: Foundation
./claude-flow sparc run orchestrator "MVP development sprint 1" \
  --agents architect,coder,designer \
  --memory-key mvp_sprint1 \
  --timeline "1 week" --parallel

# Week 2: Quality and Launch
./claude-flow sparc run workflow-manager "MVP finalization and launch" \
  --agents tester,reviewer,documenter,optimizer \
  --memory-key mvp_launch \
  --quality-gates --performance-requirements
```

### Scenario 2: Enterprise Integration Project

**Timeline**: 1-month project
**Team**: Large development team

```bash
# Phase 1: Research and Architecture (Week 1)
./claude-flow sparc run swarm-coordinator "Enterprise integration research" \
  --agents researcher,architect,analyzer \
  --memory-key enterprise_integration \
  --max-agents 10 --distributed

# Phase 2: Development (Weeks 2-3)
./claude-flow sparc run batch-executor "Parallel development execution" \
  --agents coder,tester,reviewer \
  --memory-key development_phase \
  --parallel --max-concurrent 15

# Phase 3: Quality and Deployment (Week 4)
./claude-flow sparc run workflow-manager "QA and deployment automation" \
  --agents tester,optimizer,documenter \
  --memory-key deployment_phase \
  --enterprise-standards --compliance
```

### Scenario 3: Open Source Project Contribution

**Objective**: Major contribution to open source project

```bash
# Research and Understanding
./claude-flow sparc run researcher "Analyze open source project ecosystem" \
  --memory-key oss_project_analysis \
  --community-analysis --contribution-opportunities

# Innovation and Design
./claude-flow sparc run innovator "Propose innovative features and improvements" \
  --memory-key oss_innovations \
  --community-needs --technical-feasibility

# Implementation and Quality
./claude-flow sparc run orchestrator "Implement open source contribution" \
  --agents coder,tester,reviewer,documenter \
  --memory-key oss_contribution \
  --community-standards --peer-review
```

## Workflow Templates

### Template 1: Standard Development Workflow
```bash
# Template for typical feature development
./claude-flow sparc template development \
  --agents architect,coder,tester,reviewer,documenter \
  --phases "design,implement,test,review,document" \
  --memory-key "project_${feature_name}" \
  --parallel --quality-gates
```

### Template 2: Research and Analysis Workflow
```bash
# Template for research projects
./claude-flow sparc template research \
  --agents researcher,analyzer,innovator,documenter \
  --phases "research,analyze,innovate,document" \
  --memory-key "research_${topic}" \
  --deep-analysis --comprehensive-report
```

### Template 3: Maintenance and Optimization Workflow
```bash
# Template for ongoing maintenance
./claude-flow sparc template maintenance \
  --agents analyzer,optimizer,reviewer,tester \
  --phases "analyze,optimize,validate,document" \
  --memory-key "maintenance_${component}" \
  --performance-focus --regression-prevention
```

## Best Practices from Examples

### Coordination Patterns
1. **Sequential for Dependencies**: Use sequential execution when modes depend on each other's outputs
2. **Parallel for Independence**: Use parallel execution when modes can work independently
3. **Memory Continuity**: Use consistent memory keys across related workflow phases
4. **Progressive Refinement**: Start broad (orchestrator) and narrow down to specialists

### Quality Assurance
1. **Always Include Testing**: Every development workflow should include the tester mode
2. **Code Review Integration**: Use reviewer mode for quality validation
3. **Documentation as Code**: Include documenter in all significant workflows
4. **Performance Monitoring**: Use optimizer for performance-critical applications

### Resource Management
1. **Batch Operations**: Use batch-executor for large-scale operations
2. **Memory Efficiency**: Store and reuse patterns through memory-manager
3. **Timeout Management**: Set appropriate timeouts for complex operations
4. **Monitoring Integration**: Enable monitoring for long-running workflows

### Continuous Improvement
1. **Pattern Recognition**: Use memory-manager to identify and store successful patterns
2. **Workflow Evolution**: Regularly update workflows based on results and feedback
3. **Performance Optimization**: Use analyzer and optimizer to improve workflow efficiency
4. **Knowledge Sharing**: Document and share successful workflow patterns across projects

## Getting Started with Examples

1. **Choose Your Scenario**: Select an example that matches your project needs
2. **Customize Parameters**: Adjust memory keys, agents, and settings for your context
3. **Execute Incrementally**: Start with single modes before running complex workflows
4. **Monitor and Adjust**: Use the built-in monitoring to track progress and adjust as needed
5. **Learn and Iterate**: Study the results and refine your approach for future workflows