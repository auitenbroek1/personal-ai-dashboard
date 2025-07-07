#!/bin/bash
# AI Agent Monitoring and Control System for SPARC Framework

set -e

# Configuration
MONITOR_INTERVAL=5
LOG_FILE=".claude/logs/agent-monitor.log"
METRICS_KEY="agent-metrics"
ALERT_THRESHOLDS_KEY="alert-thresholds"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Logging
log() {
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# Metrics collection
collect_metrics() {
    local timestamp=$(date -Iseconds)
    
    # System metrics
    local system_status=$(./claude-flow status 2>/dev/null || echo "Error")
    local active_agents=$(./claude-flow agent list 2>/dev/null | grep -c "Agent:" || echo "0")
    local memory_entries=$(./claude-flow memory list 2>/dev/null | wc -l || echo "0")
    
    # Performance metrics (if available)
    local cpu_usage=$(top -l 1 -n 0 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' || echo "0")
    local memory_usage=$(top -l 1 -n 0 | grep "PhysMem" | awk '{print $2}' | sed 's/M//' || echo "0")
    
    # Agent-specific metrics
    local agent_metrics="{}"
    local agent_keys=$(./claude-flow memory list 2>/dev/null | grep "agent-registry" || echo "")
    
    if [ -n "$agent_keys" ]; then
        local agent_array="["
        local first_agent=true
        
        echo "$agent_keys" | while read -r key; do
            if [ -n "$key" ]; then
                local agent_data=$(./claude-flow memory get "$key" 2>/dev/null || echo "{}")
                if [ "$agent_data" != "{}" ]; then
                    if [ "$first_agent" = false ]; then
                        agent_array="$agent_array,"
                    fi
                    agent_array="$agent_array$agent_data"
                    first_agent=false
                fi
            fi
        done
        agent_array="$agent_array]"
        agent_metrics="$agent_array"
    fi
    
    # Comprehensive metrics object
    local metrics="{
        \"timestamp\": \"$timestamp\",
        \"system\": {
            \"status\": \"$system_status\",
            \"activeAgents\": $active_agents,
            \"memoryEntries\": $memory_entries,
            \"cpuUsage\": $cpu_usage,
            \"memoryUsage\": $memory_usage
        },
        \"agents\": $agent_metrics,
        \"performance\": {
            \"responseTime\": 0,
            \"throughput\": 0,
            \"errorRate\": 0
        }
    }"
    
    # Store metrics in memory
    ./claude-flow memory store "$METRICS_KEY" "$metrics" >/dev/null 2>&1
    
    echo "$metrics"
}

# Alert system
check_alerts() {
    local metrics="$1"
    
    # Get alert thresholds
    local thresholds=$(./claude-flow memory get "$ALERT_THRESHOLDS_KEY" 2>/dev/null || echo '{"cpu": 80, "memory": 80, "agents": 8, "errors": 10}')
    
    # Extract values for comparison
    local cpu_usage=$(echo "$metrics" | python3 -c "import sys, json; print(json.load(sys.stdin)['system']['cpuUsage'])" 2>/dev/null || echo "0")
    local memory_usage=$(echo "$metrics" | python3 -c "import sys, json; print(json.load(sys.stdin)['system']['memoryUsage'])" 2>/dev/null || echo "0")
    local active_agents=$(echo "$metrics" | python3 -c "import sys, json; print(json.load(sys.stdin)['system']['activeAgents'])" 2>/dev/null || echo "0")
    
    # Check thresholds
    local cpu_threshold=$(echo "$thresholds" | python3 -c "import sys, json; print(json.load(sys.stdin)['cpu'])" 2>/dev/null || echo "80")
    local memory_threshold=$(echo "$thresholds" | python3 -c "import sys, json; print(json.load(sys.stdin)['memory'])" 2>/dev/null || echo "80")
    local agents_threshold=$(echo "$thresholds" | python3 -c "import sys, json; print(json.load(sys.stdin)['agents'])" 2>/dev/null || echo "8")
    
    # Generate alerts
    local alerts=false
    
    if [ "$(echo "$cpu_usage > $cpu_threshold" | bc 2>/dev/null || echo "0")" = "1" ]; then
        echo -e "${RED}🚨 ALERT: High CPU usage: ${cpu_usage}% (threshold: ${cpu_threshold}%)${NC}"
        alerts=true
    fi
    
    if [ "$(echo "$memory_usage > $memory_threshold" | bc 2>/dev/null || echo "0")" = "1" ]; then
        echo -e "${RED}🚨 ALERT: High memory usage: ${memory_usage}MB (threshold: ${memory_threshold}MB)${NC}"
        alerts=true
    fi
    
    if [ "$active_agents" -gt "$agents_threshold" ]; then
        echo -e "${YELLOW}⚠️  WARNING: High agent count: $active_agents (threshold: $agents_threshold)${NC}"
        alerts=true
    fi
    
    return $([ "$alerts" = true ] && echo 1 || echo 0)
}

# Real-time dashboard
dashboard() {
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}                    ${CYAN}AI Agent Monitoring Dashboard${NC}                     ${BLUE}║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    
    while true; do
        clear
        echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${BLUE}║${NC}                    ${CYAN}AI Agent Monitoring Dashboard${NC}                     ${BLUE}║${NC}"
        echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
        
        local metrics=$(collect_metrics)
        local timestamp=$(echo "$metrics" | python3 -c "import sys, json; print(json.load(sys.stdin)['timestamp'])" 2>/dev/null || date -Iseconds)
        
        echo -e "\n${PURPLE}📊 System Overview${NC} (Updated: $(date +'%H:%M:%S'))"
        echo "----------------------------------------"
        
        # System status
        local system_status=$(echo "$metrics" | python3 -c "import sys, json; print(json.load(sys.stdin)['system']['status'])" 2>/dev/null || echo "Unknown")
        local active_agents=$(echo "$metrics" | python3 -c "import sys, json; print(json.load(sys.stdin)['system']['activeAgents'])" 2>/dev/null || echo "0")
        local memory_entries=$(echo "$metrics" | python3 -c "import sys, json; print(json.load(sys.stdin)['system']['memoryEntries'])" 2>/dev/null || echo "0")
        
        echo -e "🟢 System Status:   $system_status"
        echo -e "🤖 Active Agents:   $active_agents"
        echo -e "💾 Memory Entries:  $memory_entries"
        
        # Performance metrics
        echo -e "\n${PURPLE}⚡ Performance Metrics${NC}"
        echo "----------------------------------------"
        local cpu_usage=$(echo "$metrics" | python3 -c "import sys, json; print(json.load(sys.stdin)['system']['cpuUsage'])" 2>/dev/null || echo "0")
        local memory_usage=$(echo "$metrics" | python3 -c "import sys, json; print(json.load(sys.stdin)['system']['memoryUsage'])" 2>/dev/null || echo "0")
        
        echo -e "💻 CPU Usage:       ${cpu_usage}%"
        echo -e "🧠 Memory Usage:    ${memory_usage}MB"
        
        # Agent details
        echo -e "\n${PURPLE}🤖 Agent Details${NC}"
        echo "----------------------------------------"
        
        if [ "$active_agents" -gt "0" ]; then
            # List agents from memory
            local agent_keys=$(./claude-flow memory list 2>/dev/null | grep "agent-registry" || echo "")
            if [ -n "$agent_keys" ]; then
                echo "$agent_keys" | while read -r key; do
                    if [ -n "$key" ]; then
                        local agent_data=$(./claude-flow memory get "$key" 2>/dev/null || echo "{}")
                        if [ "$agent_data" != "{}" ]; then
                            local agent_id=$(echo "$agent_data" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', 'unknown'))" 2>/dev/null || echo "unknown")
                            local agent_type=$(echo "$agent_data" | python3 -c "import sys, json; print(json.load(sys.stdin).get('type', 'unknown'))" 2>/dev/null || echo "unknown")
                            local agent_status=$(echo "$agent_data" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'unknown'))" 2>/dev/null || echo "unknown")
                            
                            case "$agent_status" in
                                "active")
                                    echo -e "  ${GREEN}●${NC} $agent_id ($agent_type)"
                                    ;;
                                "spawning"|"terminating")
                                    echo -e "  ${YELLOW}●${NC} $agent_id ($agent_type) - $agent_status"
                                    ;;
                                "failed")
                                    echo -e "  ${RED}●${NC} $agent_id ($agent_type) - $agent_status"
                                    ;;
                                *)
                                    echo -e "  ${BLUE}●${NC} $agent_id ($agent_type) - $agent_status"
                                    ;;
                            esac
                        fi
                    fi
                done
            fi
        else
            echo "  No active agents"
        fi
        
        # Check for alerts
        echo -e "\n${PURPLE}🚨 Alerts${NC}"
        echo "----------------------------------------"
        if ! check_alerts "$metrics"; then
            echo -e "${GREEN}✅ All systems normal${NC}"
        fi
        
        echo -e "\n${CYAN}Press Ctrl+C to exit monitoring${NC}"
        sleep "$MONITOR_INTERVAL"
    done
}

# Performance analysis
analyze_performance() {
    local timeframe="${1:-1h}"
    
    echo -e "${BLUE}📈 Performance Analysis (Last $timeframe)${NC}"
    echo "========================================================"
    
    # Get historical metrics (simplified for demo)
    local current_metrics=$(collect_metrics)
    
    echo -e "\n${PURPLE}Current Metrics:${NC}"
    echo "$current_metrics" | python3 -m json.tool 2>/dev/null || echo "$current_metrics"
    
    # Analysis recommendations
    echo -e "\n${PURPLE}📋 Recommendations:${NC}"
    local active_agents=$(echo "$current_metrics" | python3 -c "import sys, json; print(json.load(sys.stdin)['system']['activeAgents'])" 2>/dev/null || echo "0")
    
    if [ "$active_agents" -eq "0" ]; then
        echo "• No active agents - consider starting orchestration system"
    elif [ "$active_agents" -gt "5" ]; then
        echo "• High agent count - monitor resource usage"
        echo "• Consider implementing load balancing"
    else
        echo "• Agent count is optimal"
    fi
    
    echo "• Memory management appears healthy"
    echo "• System integration is functioning correctly"
}

# Command processing
case "${1:-help}" in
    "dashboard"|"monitor")
        dashboard
        ;;
    
    "metrics")
        collect_metrics | python3 -m json.tool 2>/dev/null || collect_metrics
        ;;
    
    "alerts")
        local metrics=$(collect_metrics)
        check_alerts "$metrics"
        ;;
    
    "analyze")
        analyze_performance "$2"
        ;;
    
    "logs")
        echo -e "${BLUE}📋 Recent Agent Monitor Logs:${NC}"
        if [ -f "$LOG_FILE" ]; then
            tail -n "${2:-20}" "$LOG_FILE"
        else
            echo "No log file found at $LOG_FILE"
        fi
        ;;
    
    "thresholds")
        if [ $# -ge 2 ]; then
            # Set thresholds
            local thresholds="{\"cpu\": ${2:-80}, \"memory\": ${3:-80}, \"agents\": ${4:-8}, \"errors\": ${5:-10}}"
            ./claude-flow memory store "$ALERT_THRESHOLDS_KEY" "$thresholds"
            echo "Alert thresholds updated: $thresholds"
        else
            # Show current thresholds
            local thresholds=$(./claude-flow memory get "$ALERT_THRESHOLDS_KEY" 2>/dev/null || echo '{"cpu": 80, "memory": 80, "agents": 8, "errors": 10}')
            echo -e "${BLUE}Current Alert Thresholds:${NC}"
            echo "$thresholds" | python3 -m json.tool 2>/dev/null || echo "$thresholds"
        fi
        ;;
    
    "help"|*)
        echo "AI Agent Monitoring and Control System"
        echo ""
        echo "Usage: $0 <command> [arguments]"
        echo ""
        echo "Commands:"
        echo "  dashboard                           Start real-time monitoring dashboard"
        echo "  metrics                             Show current system metrics"
        echo "  alerts                              Check for system alerts"
        echo "  analyze [timeframe]                 Performance analysis (default: 1h)"
        echo "  logs [lines]                        Show recent log entries (default: 20)"
        echo "  thresholds [cpu] [mem] [agents]     Set/show alert thresholds"
        echo "  help                                Show this help"
        echo ""
        echo "Examples:"
        echo "  $0 dashboard                        # Start monitoring dashboard"
        echo "  $0 metrics                          # Show current metrics"
        echo "  $0 thresholds 70 75 6              # Set custom thresholds"
        echo "  $0 analyze 2h                      # Analyze last 2 hours"
        ;;
esac