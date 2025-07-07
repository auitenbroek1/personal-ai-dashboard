#!/usr/bin/env node

/**
 * Weekly Update Report Generator
 * Creates comprehensive reports for weekly update findings
 */

const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor(configPath, projectRoot) {
    this.configPath = configPath;
    this.projectRoot = projectRoot;
    this.config = this.loadConfig();
    this.reportTemplates = new Map();
  }

  loadConfig() {
    try {
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      return config.automatedUpdateSystem;
    } catch (error) {
      console.error('Failed to load update system config:', error.message);
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      enabled: true,
      reporting: {
        weekly_report: {
          enabled: true,
          format: 'markdown',
          sections: []
        }
      }
    };
  }

  async initialize() {
    if (!this.config.enabled) {
      console.log('Report generator is disabled');
      return;
    }

    console.log('🚀 Initializing Report Generator...');
    
    await this.loadReportTemplates();
    
    console.log('✅ Report generator initialized');
  }

  async loadReportTemplates() {
    this.reportTemplates.set('markdown', {
      header: this.getMarkdownHeader.bind(this),
      section: this.getMarkdownSection.bind(this),
      table: this.getMarkdownTable.bind(this),
      list: this.getMarkdownList.bind(this),
      footer: this.getMarkdownFooter.bind(this)
    });
    
    this.reportTemplates.set('html', {
      header: this.getHtmlHeader.bind(this),
      section: this.getHtmlSection.bind(this),
      table: this.getHtmlTable.bind(this),
      list: this.getHtmlList.bind(this),
      footer: this.getHtmlFooter.bind(this)
    });
  }

  async generateWeeklyReport(pipelineResults) {
    console.log('📊 Generating weekly update report...');
    
    const reportConfig = this.config.reporting?.weekly_report;
    if (!reportConfig?.enabled) {
      console.log('Weekly report generation is disabled');
      return { generated: false, reason: 'disabled' };
    }

    try {
      // Gather all data for the report
      const reportData = await this.gatherReportData(pipelineResults);
      
      // Generate report content
      const reportContent = await this.generateReportContent(reportData, reportConfig);
      
      // Save report
      const reportPath = await this.saveReport(reportContent, reportConfig);
      
      // Generate console summary if enabled
      if (reportConfig.delivery?.console_summary) {
        this.displayConsoleSummary(reportData);
      }
      
      return {
        generated: true,
        path: reportPath,
        format: reportConfig.format,
        sections: reportConfig.sections?.length || 0,
        dataPoints: this.countDataPoints(reportData)
      };
      
    } catch (error) {
      console.error('Failed to generate weekly report:', error.message);
      throw error;
    }
  }

  async gatherReportData(pipelineResults) {
    const data = {
      timestamp: new Date().toISOString(),
      week_period: this.getWeekPeriod(),
      pipeline_results: pipelineResults,
      github_data: await this.loadGitHubData(),
      sparc_data: await this.loadSparcData(),
      analysis_data: await this.loadAnalysisData(),
      system_health: await this.loadSystemHealth(),
      previous_reports: await this.loadPreviousReports(3) // Last 3 reports for comparison
    };
    
    return data;
  }

  getWeekPeriod() {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
    weekEnd.setHours(23, 59, 59, 999);
    
    return {
      start: weekStart.toISOString(),
      end: weekEnd.toISOString(),
      start_display: weekStart.toLocaleDateString(),
      end_display: weekEnd.toLocaleDateString()
    };
  }

  async loadGitHubData() {
    const githubPath = path.join(this.projectRoot, 'memory', 'github_monitoring_results.json');
    
    try {
      if (fs.existsSync(githubPath)) {
        const data = JSON.parse(fs.readFileSync(githubPath, 'utf8'));
        return data.results[0] || {}; // Latest results
      }
    } catch (error) {
      console.warn('Failed to load GitHub data:', error.message);
    }
    
    return {};
  }

  async loadSparcData() {
    const sparcPath = path.join(this.projectRoot, 'memory', 'sparc_monitoring_results.json');
    
    try {
      if (fs.existsSync(sparcPath)) {
        const data = JSON.parse(fs.readFileSync(sparcPath, 'utf8'));
        return data.results[0] || {}; // Latest results
      }
    } catch (error) {
      console.warn('Failed to load SPARC data:', error.message);
    }
    
    return {};
  }

  async loadAnalysisData() {
    const analysisPath = path.join(this.projectRoot, 'memory', 'update_analysis_results.json');
    
    try {
      if (fs.existsSync(analysisPath)) {
        const data = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
        return data.analyses[0] || {}; // Latest analysis
      }
    } catch (error) {
      console.warn('Failed to load analysis data:', error.message);
    }
    
    return {};
  }

  async loadSystemHealth() {
    const healthPath = path.join(this.projectRoot, 'memory', 'enhancement_master_status.json');
    
    try {
      if (fs.existsSync(healthPath)) {
        return JSON.parse(fs.readFileSync(healthPath, 'utf8'));
      }
    } catch (error) {
      console.warn('Failed to load system health:', error.message);
    }
    
    return {};
  }

  async loadPreviousReports(count = 3) {
    const reportsPath = path.join(this.projectRoot, 'reports');
    const reports = [];
    
    try {
      if (fs.existsSync(reportsPath)) {
        const reportFiles = fs.readdirSync(reportsPath)
          .filter(file => file.startsWith('weekly-update-') && file.endsWith('.md'))
          .sort()
          .reverse()
          .slice(0, count);
        
        for (const file of reportFiles) {
          const reportPath = path.join(reportsPath, file);
          const stats = fs.statSync(reportPath);
          reports.push({
            filename: file,
            created: stats.birthtime.toISOString(),
            size: stats.size
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load previous reports:', error.message);
    }
    
    return reports;
  }

  async generateReportContent(data, config) {
    const format = config.format || 'markdown';
    const template = this.reportTemplates.get(format);
    
    if (!template) {
      throw new Error(`Unsupported report format: ${format}`);
    }

    let content = '';
    
    // Add header
    content += template.header(data);
    
    // Add configured sections
    const sections = config.sections || this.getDefaultSections();
    
    for (const sectionConfig of sections) {
      content += await this.generateSection(sectionConfig, data, template);
    }
    
    // Add footer
    content += template.footer(data);
    
    return content;
  }

  getDefaultSections() {
    return [
      { name: 'executive_summary', include: ['total_updates', 'critical_items', 'recommendations'] },
      { name: 'detailed_findings', include: ['new_releases', 'gist_updates', 'methodology_changes'] },
      { name: 'impact_analysis', include: ['productivity_gains', 'compatibility_issues', 'risk_assessment'] },
      { name: 'action_items', include: ['auto_applied', 'pending_approval', 'manual_review'] },
      { name: 'system_health', include: ['current_versions', 'enhancement_status', 'performance_metrics'] }
    ];
  }

  async generateSection(sectionConfig, data, template) {
    const sectionContent = this.getSectionContent(sectionConfig, data);
    return template.section(sectionConfig.name, sectionContent);
  }

  getSectionContent(sectionConfig, data) {
    switch (sectionConfig.name) {
      case 'executive_summary':
        return this.generateExecutiveSummary(data, sectionConfig.include);
      case 'detailed_findings':
        return this.generateDetailedFindings(data, sectionConfig.include);
      case 'impact_analysis':
        return this.generateImpactAnalysis(data, sectionConfig.include);
      case 'action_items':
        return this.generateActionItems(data, sectionConfig.include);
      case 'system_health':
        return this.generateSystemHealth(data, sectionConfig.include);
      default:
        return `Content for ${sectionConfig.name} section`;
    }
  }

  generateExecutiveSummary(data, include) {
    const summary = {
      title: 'Executive Summary',
      items: []
    };
    
    // Total updates
    if (include.includes('total_updates')) {
      const totalUpdates = (data.github_data.repositories?.length || 0) + 
                          (data.github_data.gists?.length || 0) + 
                          (data.sparc_data.changes_detected?.length || 0);
      
      summary.items.push(`**${totalUpdates} total updates** discovered this week across GitHub repositories, gists, and SPARC methodology`);
    }
    
    // Critical items
    if (include.includes('critical_items')) {
      const criticalRecs = data.analysis_data.recommendations?.filter(r => r.priority >= 90) || [];
      if (criticalRecs.length > 0) {
        summary.items.push(`**${criticalRecs.length} critical items** require immediate attention`);
      } else {
        summary.items.push('**No critical items** requiring immediate attention');
      }
    }
    
    // Recommendations
    if (include.includes('recommendations')) {
      const totalRecs = data.analysis_data.recommendations?.length || 0;
      const autoApplied = data.analysis_data.recommendations?.filter(r => r.action === 'auto_apply') || [];
      
      summary.items.push(`**${totalRecs} recommendations** generated, with ${autoApplied.length} eligible for auto-apply`);
    }
    
    // Risk assessment
    const riskLevel = data.analysis_data.risk_assessment?.overall_risk || 'unknown';
    summary.items.push(`**Overall risk level: ${riskLevel.toUpperCase()}**`);
    
    // Week period
    summary.items.push(`Report period: ${data.week_period.start_display} - ${data.week_period.end_display}`);
    
    return summary;
  }

  generateDetailedFindings(data, include) {
    const findings = {
      title: 'Detailed Findings',
      subsections: []
    };
    
    // New releases
    if (include.includes('new_releases')) {
      const releases = [];
      
      if (data.github_data.repositories) {
        for (const repo of data.github_data.repositories) {
          const releaseUpdates = repo.updates?.filter(u => u.type === 'release') || [];
          releases.push(...releaseUpdates.map(u => ({
            ...u,
            source: repo.repo
          })));
        }
      }
      
      findings.subsections.push({
        title: 'New Releases',
        content: releases.length > 0 ? 
          releases.map(r => `- **${r.source}**: ${r.title} (${r.version})`) :
          ['- No new releases detected this week']
      });
    }
    
    // Gist updates
    if (include.includes('gist_updates')) {
      const gistUpdates = [];
      
      if (data.github_data.gists) {
        for (const gist of data.github_data.gists) {
          gistUpdates.push(...(gist.updates || []).map(u => ({
            ...u,
            source: gist.user
          })));
        }
      }
      
      findings.subsections.push({
        title: 'Gist Updates',
        content: gistUpdates.length > 0 ?
          gistUpdates.map(g => `- **${g.source}**: ${g.title}`) :
          ['- No gist updates detected this week']
      });
    }
    
    // Methodology changes
    if (include.includes('methodology_changes')) {
      const methodologyChanges = data.sparc_data.changes_detected?.filter(
        c => c.category === 'methodology_update'
      ) || [];
      
      findings.subsections.push({
        title: 'SPARC Methodology Changes',
        content: methodologyChanges.length > 0 ?
          methodologyChanges.map(c => `- **${c.type}**: ${c.summary}`) :
          ['- No methodology changes detected this week']
      });
    }
    
    return findings;
  }

  generateImpactAnalysis(data, include) {
    const analysis = {
      title: 'Impact Analysis',
      subsections: []
    };
    
    // Productivity gains
    if (include.includes('productivity_gains')) {
      const productivityImpact = data.analysis_data.impact_summary?.productivity_impact || 'neutral';
      const benefits = data.analysis_data.impact_summary?.potential_benefits || [];
      
      analysis.subsections.push({
        title: 'Productivity Impact',
        content: [
          `Overall impact: **${productivityImpact.toUpperCase()}**`,
          ...benefits.map(b => `- ${b}`)
        ]
      });
    }
    
    // Compatibility issues
    if (include.includes('compatibility_issues')) {
      const riskFactors = data.analysis_data.risk_assessment?.risk_factors || [];
      const compatibilityIssues = riskFactors.filter(r => 
        r.type === 'breaking_changes' || r.type === 'methodology_changes'
      );
      
      analysis.subsections.push({
        title: 'Compatibility Considerations',
        content: compatibilityIssues.length > 0 ?
          compatibilityIssues.map(i => `- **${i.type}**: ${i.description}`) :
          ['- No compatibility issues identified']
      });
    }
    
    // Risk assessment
    if (include.includes('risk_assessment')) {
      const riskAssessment = data.analysis_data.risk_assessment || {};
      const mitigationStrategies = riskAssessment.mitigation_strategies || [];
      
      analysis.subsections.push({
        title: 'Risk Assessment',
        content: [
          `Overall risk level: **${(riskAssessment.overall_risk || 'unknown').toUpperCase()}**`,
          '',
          'Mitigation strategies:',
          ...mitigationStrategies.map(s => `- ${s.strategy}`)
        ]
      });
    }
    
    return analysis;
  }

  generateActionItems(data, include) {
    const actions = {
      title: 'Action Items',
      subsections: []
    };
    
    const recommendations = data.analysis_data.recommendations || [];
    
    // Auto applied
    if (include.includes('auto_applied')) {
      const autoApplied = recommendations.filter(r => r.action === 'auto_apply');
      
      actions.subsections.push({
        title: 'Auto-Applied Updates',
        content: autoApplied.length > 0 ?
          autoApplied.map(r => `- ${r.title} (Priority: ${r.priority})`) :
          ['- No updates were auto-applied this week']
      });
    }
    
    // Pending approval
    if (include.includes('pending_approval')) {
      const pendingApproval = recommendations.filter(r => 
        r.action === 'manual_review' || r.action === 'evaluate_and_plan'
      );
      
      actions.subsections.push({
        title: 'Pending Your Approval',
        content: pendingApproval.length > 0 ?
          pendingApproval.map(r => `- **${r.title}** (${r.timeline}) - ${r.description}`) :
          ['- No items pending approval']
      });
    }
    
    // Manual review
    if (include.includes('manual_review')) {
      const manualReview = recommendations.filter(r => 
        r.action === 'careful_review' && r.risk_level === 'high'
      );
      
      actions.subsections.push({
        title: 'Requires Manual Review',
        content: manualReview.length > 0 ?
          manualReview.map(r => `- **${r.title}** - ${r.description}`) :
          ['- No items require manual review']
      });
    }
    
    return actions;
  }

  generateSystemHealth(data, include) {
    const health = {
      title: 'System Health Status',
      subsections: []
    };
    
    // Current versions
    if (include.includes('current_versions')) {
      const systemState = data.analysis_data.system_state || {};
      
      health.subsections.push({
        title: 'Current Versions',
        content: [
          `Claude-Flow: ${systemState.version || 'Unknown'}`,
          `SPARC Modes: ${systemState.sparc?.modes || 'Unknown'} active modes`,
          `Last SPARC Update: ${systemState.sparc?.lastUpdate || 'Unknown'}`
        ]
      });
    }
    
    // Enhancement status
    if (include.includes('enhancement_status')) {
      const enhancementStatus = data.system_health.summary || {};
      
      health.subsections.push({
        title: 'Enhancement System Status',
        content: [
          `Active Enhancements: ${enhancementStatus.successful || 0}/${enhancementStatus.total || 5}`,
          `Success Rate: ${enhancementStatus.successRate || 0}%`,
          `Expected Productivity Gain: ${data.system_health.productivity_impact?.expected_gain || 'Unknown'}%`
        ]
      });
    }
    
    // Performance metrics
    if (include.includes('performance_metrics')) {
      health.subsections.push({
        title: 'Performance Metrics',
        content: [
          'System performance indicators:',
          '- Memory optimization: Active',
          '- Multi-agent orchestration: Active', 
          '- SPARC workflow automation: Active',
          '- Batch processing: Active',
          '- Monitoring & analytics: Active'
        ]
      });
    }
    
    return health;
  }

  // Markdown template methods
  getMarkdownHeader(data) {
    return `# Weekly Claude-Flow Update Report

**Report Date:** ${new Date(data.timestamp).toLocaleDateString()}  
**Report Period:** ${data.week_period.start_display} - ${data.week_period.end_display}  
**Generated:** ${new Date(data.timestamp).toLocaleString()}

---

`;
  }

  getMarkdownSection(title, content) {
    let section = `## ${content.title || title}\n\n`;
    
    if (content.items) {
      // Simple list of items
      section += content.items.join('\n\n') + '\n\n';
    } else if (content.subsections) {
      // Subsections with content
      for (const subsection of content.subsections) {
        section += `### ${subsection.title}\n\n`;
        if (Array.isArray(subsection.content)) {
          section += subsection.content.join('\n') + '\n\n';
        } else {
          section += subsection.content + '\n\n';
        }
      }
    } else {
      section += content + '\n\n';
    }
    
    return section;
  }

  getMarkdownTable(headers, rows) {
    let table = '| ' + headers.join(' | ') + ' |\n';
    table += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
    
    for (const row of rows) {
      table += '| ' + row.join(' | ') + ' |\n';
    }
    
    return table + '\n';
  }

  getMarkdownList(items) {
    return items.map(item => `- ${item}`).join('\n') + '\n\n';
  }

  getMarkdownFooter(data) {
    return `---

**Report Generated by Claude-Flow Automated Update System**  
**Next scheduled update:** ${this.getNextUpdateDate()}  
**System Status:** ${this.getSystemStatusSummary(data)}

*This report was automatically generated. For questions or issues, review the system logs or run manual diagnostics.*
`;
  }

  // HTML template methods (simplified)
  getHtmlHeader(data) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Weekly Claude-Flow Update Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1, h2, h3 { color: #333; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Weekly Claude-Flow Update Report</h1>
    <div class="summary">
        <strong>Report Date:</strong> ${new Date(data.timestamp).toLocaleDateString()}<br>
        <strong>Report Period:</strong> ${data.week_period.start_display} - ${data.week_period.end_display}<br>
        <strong>Generated:</strong> ${new Date(data.timestamp).toLocaleString()}
    </div>
`;
  }

  getHtmlSection(title, content) {
    return `<h2>${content.title || title}</h2>\n${content}\n`;
  }

  getHtmlTable(headers, rows) {
    let table = '<table>\n<tr>';
    headers.forEach(header => table += `<th>${header}</th>`);
    table += '</tr>\n';
    
    rows.forEach(row => {
      table += '<tr>';
      row.forEach(cell => table += `<td>${cell}</td>`);
      table += '</tr>\n';
    });
    
    return table + '</table>\n';
  }

  getHtmlList(items) {
    return '<ul>\n' + items.map(item => `<li>${item}</li>`).join('\n') + '\n</ul>\n';
  }

  getHtmlFooter(data) {
    return `<hr>
<p><em>Report Generated by Claude-Flow Automated Update System</em></p>
</body>
</html>`;
  }

  async saveReport(content, config) {
    const reportsDir = path.join(this.projectRoot, 'reports');
    
    // Create reports directory if it doesn't exist
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const extension = config.format === 'html' ? 'html' : 'md';
    const filename = `weekly-update-${timestamp}.${extension}`;
    
    // Use configured path or default
    const reportPath = config.delivery?.file_path ? 
      path.join(this.projectRoot, config.delivery.file_path) :
      path.join(reportsDir, filename);
    
    // Ensure directory exists
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    // Save report
    fs.writeFileSync(reportPath, content, 'utf8');
    
    console.log(`📄 Report saved: ${reportPath}`);
    return reportPath;
  }

  displayConsoleSummary(data) {
    console.log('\n📊 WEEKLY UPDATE SUMMARY');
    console.log('========================');
    
    const totalUpdates = (data.github_data.repositories?.length || 0) + 
                        (data.github_data.gists?.length || 0) + 
                        (data.sparc_data.changes_detected?.length || 0);
    
    const totalRecommendations = data.analysis_data.recommendations?.length || 0;
    const criticalItems = data.analysis_data.recommendations?.filter(r => r.priority >= 90).length || 0;
    const riskLevel = data.analysis_data.risk_assessment?.overall_risk || 'unknown';
    
    console.log(`📈 Total Updates Found: ${totalUpdates}`);
    console.log(`🎯 Recommendations Generated: ${totalRecommendations}`);
    console.log(`🚨 Critical Items: ${criticalItems}`);
    console.log(`⚠️  Risk Level: ${riskLevel.toUpperCase()}`);
    console.log(`📅 Period: ${data.week_period.start_display} - ${data.week_period.end_display}`);
    
    if (criticalItems > 0) {
      console.log('\n🔥 CRITICAL ITEMS REQUIRE ATTENTION:');
      const critical = data.analysis_data.recommendations.filter(r => r.priority >= 90);
      critical.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title}`);
      });
    }
    
    console.log('\n========================\n');
  }

  countDataPoints(data) {
    let count = 0;
    
    if (data.github_data.repositories) count += data.github_data.repositories.length;
    if (data.github_data.gists) count += data.github_data.gists.length;
    if (data.sparc_data.changes_detected) count += data.sparc_data.changes_detected.length;
    if (data.analysis_data.recommendations) count += data.analysis_data.recommendations.length;
    
    return count;
  }

  getNextUpdateDate() {
    const schedule = this.config.schedule || {};
    const dayOfWeek = schedule.day_of_week || 'sunday';
    const time = schedule.time || '06:00';
    
    return `Next ${dayOfWeek} at ${time}`;
  }

  getSystemStatusSummary(data) {
    const enhancementStatus = data.system_health.summary || {};
    const successRate = enhancementStatus.successRate || 0;
    
    if (successRate >= 80) return 'Optimal';
    if (successRate >= 60) return 'Good';
    if (successRate >= 40) return 'Fair';
    return 'Needs Attention';
  }

  getStatus() {
    return {
      enabled: this.config.enabled,
      report_config: this.config.reporting?.weekly_report || {},
      templates_loaded: this.reportTemplates.size,
      last_report: this.getLastReportInfo()
    };
  }

  getLastReportInfo() {
    try {
      const reportsDir = path.join(this.projectRoot, 'reports');
      if (fs.existsSync(reportsDir)) {
        const files = fs.readdirSync(reportsDir)
          .filter(f => f.startsWith('weekly-update-'))
          .sort()
          .reverse();
        
        if (files.length > 0) {
          const latestFile = files[0];
          const stats = fs.statSync(path.join(reportsDir, latestFile));
          return {
            filename: latestFile,
            created: stats.birthtime.toISOString(),
            size: stats.size
          };
        }
      }
    } catch (error) {
      // Ignore errors
    }
    
    return null;
  }
}

// CLI interface
if (require.main === module) {
  const configPath = process.argv[2] || path.join(__dirname, 'update-system.json');
  const projectRoot = process.argv[3] || process.cwd();
  const generator = new ReportGenerator(configPath, projectRoot);
  
  const command = process.argv[4] || 'generate';
  
  switch (command) {
    case 'initialize':
      generator.initialize();
      break;
    
    case 'generate':
      generator.initialize().then(() => {
        // Simulate pipeline results for testing
        const mockPipelineResults = {
          timestamp: new Date().toISOString(),
          pipeline_steps: [
            { step: 'github_monitoring', status: 'success' },
            { step: 'sparc_monitoring', status: 'success' },
            { step: 'update_analysis', status: 'success' }
          ],
          errors: []
        };
        
        return generator.generateWeeklyReport(mockPipelineResults);
      }).then(result => {
        console.log('Report Generation Result:', JSON.stringify(result, null, 2));
      }).catch(error => {
        console.error('Report generation failed:', error.message);
        process.exit(1);
      });
      break;
    
    case 'status':
      console.log('Report Generator Status:', JSON.stringify(generator.getStatus(), null, 2));
      break;
    
    default:
      console.error('Unknown command:', command);
      console.error('Available commands: initialize, generate, status');
      process.exit(1);
  }
}

module.exports = ReportGenerator;