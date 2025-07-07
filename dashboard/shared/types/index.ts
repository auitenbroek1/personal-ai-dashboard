// Core system types
export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  config: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  last_active: Date;
}

export type AgentType = 'researcher' | 'coder' | 'monitor' | 'analyst' | 'coordinator';
export type AgentStatus = 'idle' | 'active' | 'busy' | 'error' | 'offline';

export interface Task {
  id: string;
  agent_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  result?: Record<string, any>;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SystemMetric {
  id: string;
  timestamp: Date;
  metric_type: MetricType;
  value: number;
  metadata?: Record<string, any>;
}

export type MetricType = 'cpu_usage' | 'memory_usage' | 'response_time' | 'error_rate' | 'active_agents' | 'completed_tasks';

export interface MemoryEntry {
  id: string;
  key: string;
  value: Record<string, any>;
  type: string;
  namespace: string;
  created_at: Date;
  updated_at: Date;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

export type ReportType = 'system_health' | 'performance' | 'agent_activity' | 'custom';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// WebSocket event types
export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: Date;
}

export type WebSocketEventType = 
  | 'system_status_update'
  | 'agent_status_change'
  | 'task_progress_update'
  | 'alert_notification'
  | 'metric_update';

// Dashboard state types
export interface DashboardState {
  agents: Agent[];
  tasks: Task[];
  metrics: SystemMetric[];
  alerts: Alert[];
  isConnected: boolean;
  lastUpdate: Date;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: Date;
  acknowledged: boolean;
}

export type AlertType = 'system_error' | 'agent_failure' | 'performance_degradation' | 'resource_exhaustion';
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';