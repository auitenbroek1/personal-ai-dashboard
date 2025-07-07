#!/bin/bash
# Agent Lifecycle Management Script for SPARC Framework

set -e

# Configuration
AGENT_REGISTRY="agent-registry"
COORD_STATE="coordination-state"
TIMEOUT_DEFAULT="3600"
MAX_AGENTS="10"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Agent spawning function
spawn_agent() {
    local agent_type="$1"
    local agent_name="${2:-${agent_type}_$(date +%s)}"
    local memory_key="${3:-default}"
    
    log "Spawning agent: $agent_name (type: $agent_type)"
    
    # Validate agent type
    if ! ./claude-flow sparc modes | grep -q "$agent_type"; then
        error "Invalid agent type: $agent_type"
        return 1
    fi
    
    # Check current agent count
    local current_agents=$(./claude-flow agent list 2>/dev/null | grep -c "Agent:" || echo "0")
    if [ "$current_agents" -ge "$MAX_AGENTS" ]; then
        error "Maximum agents ($MAX_AGENTS) already running"
        return 1
    fi
    
    # Store agent metadata in memory
    local agent_data="{
        \"id\": \"$agent_name\",
        \"type\": \"$agent_type\",
        \"status\": \"spawning\",
        \"created\": \"$(date -Iseconds)\",
        \"memoryKey\": \"$memory_key\",
        \"tools\": $(get_agent_tools "$agent_type"),
        \"coordination\": \"$(get_coordination_type "$agent_type")\"
    }"
    
    ./claude-flow memory store "${AGENT_REGISTRY}_${agent_name}" "$agent_data"
    
    # Spawn the agent
    if ./claude-flow agent spawn "$agent_type" --name "$agent_name"; then
        # Update status to active
        agent_data=$(echo "$agent_data" | sed 's/"spawning"/"active"/')
        ./claude-flow memory store "${AGENT_REGISTRY}_${agent_name}" "$agent_data"
        success "Agent $agent_name spawned successfully"
        return 0
    else
        error "Failed to spawn agent $agent_name"
        ./claude-flow memory store "${AGENT_REGISTRY}_${agent_name}" "$(echo "$agent_data" | sed 's/"spawning"/"failed"/')"
        return 1
    fi
}

# Agent termination function
terminate_agent() {
    local agent_name="$1"
    local graceful="${2:-true}"
    
    log "Terminating agent: $agent_name (graceful: $graceful)"
    
    # Get agent data from memory
    local agent_data=$(./claude-flow memory get "${AGENT_REGISTRY}_${agent_name}" 2>/dev/null || echo "{}")
    
    if [ "$agent_data" = "{}" ]; then
        warning "Agent $agent_name not found in registry"
    fi
    
    # Update status to terminating
    if [ "$agent_data" != "{}" ]; then
        agent_data=$(echo "$agent_data" | sed 's/"active"/"terminating"/')
        ./claude-flow memory store "${AGENT_REGISTRY}_${agent_name}" "$agent_data"
    fi
    
    # Terminate the agent
    if ./claude-flow agent terminate "$agent_name"; then
        # Remove from registry
        ./claude-flow memory delete "${AGENT_REGISTRY}_${agent_name}" 2>/dev/null || true
        success "Agent $agent_name terminated successfully"
        return 0
    else
        error "Failed to terminate agent $agent_name"
        return 1
    fi
}

# Get agent tools based on type
get_agent_tools() {
    local agent_type="$1"
    case "$agent_type" in
        "orchestrator")
            echo '["TodoWrite", "TodoRead", "Task", "Memory", "Bash"]'
            ;;
        "coder")
            echo '["Read", "Write", "Edit", "Bash", "Glob", "Grep", "TodoWrite"]'
            ;;
        "researcher")
            echo '["WebSearch", "WebFetch", "Read", "Write", "Memory", "TodoWrite", "Task"]'
            ;;
        "tester")
            echo '["Read", "Write", "Edit", "Bash", "TodoWrite", "Task"]'
            ;;
        "reviewer")
            echo '["Read", "Edit", "Grep", "Bash", "TodoWrite", "Memory"]'
            ;;
        *)
            echo '["Read", "Write", "Memory", "TodoWrite"]'
            ;;
    esac
}

# Get coordination type based on agent type
get_coordination_type() {
    local agent_type="$1"
    case "$agent_type" in
        "orchestrator"|"swarm-coordinator"|"workflow-manager")
            echo "coordinator"
            ;;
        "batch-executor"|"memory-manager")
            echo "processor"
            ;;
        *)
            echo "specialist"
            ;;
    esac
}

# Agent health check function
health_check() {
    local agent_name="$1"
    
    log "Performing health check for agent: $agent_name"
    
    # Check if agent is in active list
    if ./claude-flow agent list | grep -q "$agent_name"; then
        # Get agent data from memory
        local agent_data=$(./claude-flow memory get "${AGENT_REGISTRY}_${agent_name}" 2>/dev/null || echo "{}")
        
        if [ "$agent_data" != "{}" ]; then
            success "Agent $agent_name is healthy"
            echo "$agent_data" | python3 -m json.tool 2>/dev/null || echo "$agent_data"
            return 0
        else
            warning "Agent $agent_name is running but not in registry"
            return 1
        fi
    else
        error "Agent $agent_name is not running"
        return 1
    fi
}

# List all managed agents
list_agents() {
    log "Listing all managed agents"
    
    # Get all agent registry entries
    local agent_keys=$(./claude-flow memory list 2>/dev/null | grep "$AGENT_REGISTRY" || echo "")
    
    if [ -z "$agent_keys" ]; then
        warning "No managed agents found"
        return 0
    fi
    
    echo -e "\n${BLUE}Managed Agents:${NC}"
    echo "----------------------------------------"
    
    echo "$agent_keys" | while read -r key; do
        if [ -n "$key" ]; then
            local agent_data=$(./claude-flow memory get "$key" 2>/dev/null || echo "{}")
            if [ "$agent_data" != "{}" ]; then
                local agent_id=$(echo "$agent_data" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', 'unknown'))" 2>/dev/null || echo "unknown")
                local agent_type=$(echo "$agent_data" | python3 -c "import sys, json; print(json.load(sys.stdin).get('type', 'unknown'))" 2>/dev/null || echo "unknown")
                local agent_status=$(echo "$agent_data" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'unknown'))" 2>/dev/null || echo "unknown")
                
                case "$agent_status" in
                    "active")
                        echo -e "  ${GREEN}●${NC} $agent_id ($agent_type) - $agent_status"
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
    
    echo "----------------------------------------"
}

# Clean up failed or terminated agents
cleanup() {
    log "Cleaning up failed and terminated agents"
    
    local cleanup_count=0
    local agent_keys=$(./claude-flow memory list 2>/dev/null | grep "$AGENT_REGISTRY" || echo "")
    
    echo "$agent_keys" | while read -r key; do
        if [ -n "$key" ]; then
            local agent_data=$(./claude-flow memory get "$key" 2>/dev/null || echo "{}")
            if [ "$agent_data" != "{}" ]; then
                local agent_status=$(echo "$agent_data" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'unknown'))" 2>/dev/null || echo "unknown")
                local agent_id=$(echo "$agent_data" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', 'unknown'))" 2>/dev/null || echo "unknown")
                
                if [ "$agent_status" = "failed" ] || [ "$agent_status" = "terminated" ]; then
                    ./claude-flow memory delete "$key" 2>/dev/null || true
                    success "Cleaned up agent: $agent_id"
                    cleanup_count=$((cleanup_count + 1))
                fi
            fi
        fi
    done
    
    success "Cleanup complete. Removed $cleanup_count agent entries."
}

# Coordination state management
update_coordination_state() {
    local state_data="{
        \"timestamp\": \"$(date -Iseconds)\",
        \"activeAgents\": $(./claude-flow agent list 2>/dev/null | grep -c "Agent:" || echo "0"),
        \"systemStatus\": \"$(./claude-flow status 2>/dev/null | head -1 | awk '{print $3}' || echo "unknown")\",
        \"memoryEntries\": $(./claude-flow memory list 2>/dev/null | wc -l || echo "0")
    }"
    
    ./claude-flow memory store "$COORD_STATE" "$state_data"
}

# Main command processing
case "${1:-help}" in
    "spawn")
        if [ $# -lt 2 ]; then
            error "Usage: $0 spawn <agent_type> [agent_name] [memory_key]"
            exit 1
        fi
        spawn_agent "$2" "$3" "$4"
        update_coordination_state
        ;;
    
    "terminate")
        if [ $# -lt 2 ]; then
            error "Usage: $0 terminate <agent_name> [graceful]"
            exit 1
        fi
        terminate_agent "$2" "$3"
        update_coordination_state
        ;;
    
    "health")
        if [ $# -lt 2 ]; then
            error "Usage: $0 health <agent_name>"
            exit 1
        fi
        health_check "$2"
        ;;
    
    "list")
        list_agents
        ;;
    
    "cleanup")
        cleanup
        ;;
    
    "status")
        log "System Status"
        ./claude-flow status
        echo ""
        list_agents
        ;;
    
    "help"|*)
        echo "Agent Lifecycle Management Script"
        echo ""
        echo "Usage: $0 <command> [arguments]"
        echo ""
        echo "Commands:"
        echo "  spawn <type> [name] [memory_key]  Spawn a new agent"
        echo "  terminate <name> [graceful]       Terminate an agent"
        echo "  health <name>                     Check agent health"
        echo "  list                              List all managed agents"
        echo "  cleanup                           Clean up failed agents"
        echo "  status                            Show system and agent status"
        echo "  help                              Show this help"
        echo ""
        echo "Agent Types:"
        echo "  orchestrator, swarm-coordinator, workflow-manager, batch-executor"
        echo "  coder, architect, reviewer, tester, tdd, debugger"
        echo "  researcher, analyzer, optimizer"
        echo "  designer, innovator, documenter, memory-manager"
        ;;
esac