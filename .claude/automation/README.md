# Claude-Flow Automated Weekly Update System

This directory contains a comprehensive automated update system that keeps your claude-flow installation current with Reuven Cohen's latest developments and maintains optimal system performance.

## 🎯 System Overview

The automated update system monitors multiple sources weekly and provides intelligent recommendations for keeping your claude-flow system optimized and current.

### Core Features

1. **GitHub Repository Monitoring** - Tracks claude-flow releases and Reuven Cohen's repositories
2. **Gist Monitoring** - Watches for new tools and enhancements in gists
3. **SPARC Methodology Tracking** - Monitors documentation and methodology updates
4. **Intelligent Analysis** - Classifies updates and assesses compatibility/impact
5. **Automated Scheduling** - Runs weekly checks automatically
6. **Comprehensive Reporting** - Generates detailed weekly reports
7. **Smart Notifications** - Alerts for critical updates and approval workflows
8. **Auto-Update Capability** - Safely applies non-breaking updates automatically

## 🚀 Quick Start

### Initialize the System

```bash
# Initialize all components
node .claude/automation/update-master.js /path/to/project initialize

# View system summary
node .claude/automation/update-master.js /path/to/project summary
```

### Run Manual Update

```bash
# Perform immediate update check
node .claude/automation/update-master.js /path/to/project run
```

### Start Scheduled Updates

```bash
# Enable weekly automation (runs every Sunday at 6 AM by default)
node .claude/automation/update-master.js /path/to/project schedule
```

### Check System Status

```bash
# View current status
node .claude/automation/update-master.js /path/to/project status
```

## 📋 Component Architecture

### 1. Update Master (`update-master.js`)
**Central orchestrator for the entire system**
- Coordinates all components
- Manages system lifecycle
- Provides unified interface
- Handles error recovery

### 2. GitHub Monitor (`github-monitor.js`)
**Monitors GitHub repositories and gists**
- Tracks claude-flow releases
- Monitors Reuven Cohen's repositories
- Watches community gists
- Rate limit management
- Caches results for efficiency

### 3. SPARC Monitor (`sparc-monitor.js`)
**Tracks SPARC methodology updates**
- Monitors documentation sources
- Detects methodology changes
- Tracks website and wiki updates
- Content change analysis

### 4. Update Analyzer (`update-analyzer.js`)
**Intelligent analysis and recommendation engine**
- Classifies updates by type and severity
- Performs compatibility analysis
- Assesses impact and risk
- Generates actionable recommendations
- Prioritizes updates by importance

### 5. Scheduler (`scheduler.js`)
**Automated scheduling and execution**
- Weekly automation (configurable)
- Manual execution support
- Pipeline orchestration
- Auto-apply safe updates
- State management

### 6. Report Generator (`report-generator.js`)
**Comprehensive weekly reporting**
- Markdown and HTML formats
- Executive summaries
- Detailed findings
- Action items
- System health status

### 7. Notifier (`notifier.js`)
**Notification and approval workflows**
- Multiple notification channels
- Approval workflows for major updates
- Interactive prompts
- Console, file, and memory notifications
- Email integration ready

## ⚙️ Configuration

### Main Configuration (`update-system.json`)

The system is configured through a comprehensive JSON configuration file that controls:

- **Monitoring Targets**: Which repositories, gists, and sources to monitor
- **Analysis Engine**: How updates are classified and prioritized
- **Scheduling**: When and how often to run updates
- **Notifications**: How and when to notify about updates
- **Auto-Update Rules**: Which updates can be applied automatically

### Key Configuration Sections

```json
{
  "automatedUpdateSystem": {
    "enabled": true,
    "schedule": {
      "frequency": "weekly",
      "day_of_week": "sunday", 
      "time": "06:00"
    },
    "monitoring_targets": {
      "github_repositories": { ... },
      "github_gists": { ... },
      "documentation_sources": { ... }
    },
    "analysis_engine": { ... },
    "update_actions": { ... },
    "reporting": { ... }
  }
}
```

## 📊 Monitoring Sources

### GitHub Repositories
- **anthropics/claude-code** - Main claude-flow repository
- **reuvencohen/** - All Reuven Cohen repositories with keyword filtering
- **Community repositories** - Auto-discovery of related projects

### Gists
- **Reuven Cohen's gists** - Tools and enhancements
- **Community gists** - Related claude-flow content

### Documentation
- **SPARC Methodology** - Official documentation and wikis
- **Claude Documentation** - Anthropic's official docs
- **Community resources** - Reddit, Discord, Twitter

## 🔄 Weekly Automation Workflow

### 1. Scheduled Execution (Sunday 6 AM)
- GitHub monitoring runs first
- SPARC methodology check
- Update analysis and classification
- Report generation
- Notification dispatch

### 2. Auto-Apply Safe Updates
- Minor improvements and patches
- Security updates (with validation)
- Documentation updates
- Non-breaking enhancements

### 3. Approval Workflow for Major Updates
- Breaking changes require approval
- Major features need evaluation
- Interactive prompts created
- Deadline-based escalation

### 4. Weekly Report Generation
- Executive summary with key metrics
- Detailed findings by source
- Impact analysis and risk assessment
- Action items categorized by urgency
- System health status

## 🎯 Update Classification

### Automatic Classification
Updates are automatically classified into categories:

- **Security Updates** (Critical) - Auto-apply enabled
- **Breaking Changes** (Critical) - Requires approval
- **Major Features** (High) - Requires evaluation
- **Minor Improvements** (Medium) - Auto-apply enabled
- **Documentation** (Low) - Auto-apply enabled

### Risk Assessment
Each update receives a risk level:
- **Low** - Safe to auto-apply
- **Medium** - Requires validation
- **High** - Requires manual review
- **Critical** - Immediate attention needed

## 📈 Expected Benefits

### Productivity Gains
- **Stay Current**: Never miss important updates
- **Reduced Manual Work**: 80% of updates handled automatically
- **Early Warning**: Advance notice of breaking changes
- **Informed Decisions**: Detailed impact analysis

### System Reliability
- **Consistent Updates**: Regular, predictable update cycles
- **Risk Mitigation**: Thorough analysis before applying updates
- **Rollback Capability**: Safety mechanisms for failed updates
- **Health Monitoring**: Continuous system health assessment

## 🔧 Manual Operations

### Check for Updates Now
```bash
node .claude/automation/update-master.js /path/to/project run
```

### View Pending Approvals
```bash
node .claude/automation/notifier.js update-system.json /path/to/project approval-status
```

### Approve an Update
```bash
node .claude/automation/notifier.js update-system.json /path/to/project approve <prompt-id> true "Approved for implementation"
```

### Generate Report Only
```bash
node .claude/automation/report-generator.js update-system.json /path/to/project generate
```

### Test Notifications
```bash
node .claude/automation/notifier.js update-system.json /path/to/project test
```

## 📁 File Structure

```
.claude/automation/
├── update-system.json          # Main configuration
├── update-master.js            # Central orchestrator
├── github-monitor.js           # GitHub monitoring
├── sparc-monitor.js            # SPARC methodology tracking
├── update-analyzer.js          # Analysis engine
├── scheduler.js                # Automation scheduler
├── report-generator.js         # Report generation
├── notifier.js                 # Notifications & approvals
└── README.md                   # This file

Generated files:
memory/
├── github_monitoring_results.json
├── sparc_monitoring_results.json
├── update_analysis_results.json
├── weekly_update_results.json
├── notification_*.json
└── approval_prompts.json

reports/
└── weekly-update-YYYY-MM-DD.md

logs/
└── notifications.log
```

## 🚨 Troubleshooting

### Common Issues

1. **GitHub Rate Limits**
   - System automatically handles rate limiting
   - Waits for reset if limit exceeded
   - Check status: `node github-monitor.js status`

2. **Missing Dependencies**
   - Ensure Node.js is available
   - Check file permissions
   - Verify project structure

3. **Scheduling Issues**
   - Manual scheduling used if cron unavailable
   - Check scheduler status
   - Run manual updates as alternative

4. **Notification Failures**
   - Console notifications always available
   - File and memory notifications as backup
   - Check notification system status

### Diagnostic Commands

```bash
# Check system health
node .claude/automation/update-master.js /path/to/project status

# Test individual components
node .claude/automation/github-monitor.js update-system.json /path/to/project status
node .claude/automation/sparc-monitor.js update-system.json /path/to/project status
node .claude/automation/update-analyzer.js update-system.json /path/to/project status

# View logs
tail -f logs/notifications.log
cat memory/update_system_status.json
```

## 🔒 Security Considerations

### Source Verification
- Only monitors trusted sources (GitHub, official docs)
- Quarantines untrusted content
- Signature verification where available

### Auto-Apply Safety
- Limited to low-risk updates
- Backup creation before updates
- Rollback capability on failure
- User approval for major changes

### Privacy
- No personal data transmitted
- All processing happens locally
- Configurable monitoring scope

## 📞 Support

For issues or questions:

1. Check system status and logs
2. Review configuration settings
3. Run manual diagnostics
4. Consult the troubleshooting section

The automated update system is designed to be self-maintaining and provides comprehensive logging for troubleshooting any issues that may arise.

---

**Automated Weekly Update System v1.0.0**  
*Keeping your claude-flow system current with Reuven Cohen's latest developments*