// API endpoints
export const API_ENDPOINTS = {
  DASHBOARD: {
    OVERVIEW: '/api/dashboard/overview',
    AGENTS: '/api/dashboard/agents',
    TASKS: '/api/dashboard/tasks',
    METRICS: '/api/dashboard/metrics',
    REPORTS: '/api/dashboard/reports',
  },
  MONITORING: {
    HEALTH: '/api/monitoring/health',
    METRICS: '/api/monitoring/metrics',
    ALERTS: '/api/monitoring/alerts',
  },
  WEBSOCKET: {
    ENDPOINT: '/socket.io',
  },
} as const;

// WebSocket events
export const WS_EVENTS = {
  // Client to server
  SUBSCRIBE_UPDATES: 'subscribe_to_updates',
  AGENT_COMMAND: 'agent_command',
  TASK_UPDATE: 'task_update',
  SYSTEM_COMMAND: 'system_command',
  
  // Server to client
  SYSTEM_STATUS_UPDATE: 'system_status_update',
  AGENT_STATUS_CHANGE: 'agent_status_change',
  TASK_PROGRESS_UPDATE: 'task_progress_update',
  ALERT_NOTIFICATION: 'alert_notification',
  METRIC_UPDATE: 'metric_update',
} as const;

// Default values
export const DEFAULTS = {
  PAGINATION: {
    PAGE: 1,
    LIMIT: 20,
    MAX_LIMIT: 100,
  },
  METRICS: {
    UPDATE_INTERVAL: 5000, // 5 seconds
    RETENTION_DAYS: 30,
  },
  ALERTS: {
    AUTO_ACKNOWLEDGE_TIMEOUT: 300000, // 5 minutes
  },
} as const;

// Status colors for UI
export const STATUS_COLORS = {
  AGENT_STATUS: {
    idle: '#6b7280',
    active: '#10b981',
    busy: '#f59e0b',
    error: '#ef4444',
    offline: '#6b7280',
  },
  TASK_STATUS: {
    pending: '#6b7280',
    in_progress: '#3b82f6',
    completed: '#10b981',
    failed: '#ef4444',
    cancelled: '#6b7280',
  },
  ALERT_SEVERITY: {
    info: '#3b82f6',
    warning: '#f59e0b',
    error: '#ef4444',
    critical: '#dc2626',
  },
} as const;

// Configuration
export const CONFIG = {
  APP_NAME: 'Personal AI Assistant Dashboard',
  VERSION: '1.0.0',
  DESCRIPTION: 'Comprehensive monitoring and control dashboard for AI agents and automation systems',
} as const;