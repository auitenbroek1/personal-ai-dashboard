import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { setConnected, addNotification, updateLastUpdate } from '../store/slices/dashboardSlice';
import { setAgents, updateAgent } from '../store/slices/agentsSlice';
import { setTasks, updateTask } from '../store/slices/tasksSlice';
import { addMetric } from '../store/slices/metricsSlice';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  connect(url: string = 'http://localhost:3001') {
    try {
      this.socket = io(url, {
        transports: ['websocket'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      store.dispatch(setConnected(false));
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      store.dispatch(setConnected(true));
      store.dispatch(updateLastUpdate());
      store.dispatch(addNotification({
        type: 'success',
        message: 'Connected to server'
      }));
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      store.dispatch(setConnected(false));
      store.dispatch(addNotification({
        type: 'warning',
        message: 'Disconnected from server'
      }));
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      store.dispatch(setConnected(false));
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        store.dispatch(addNotification({
          type: 'error',
          message: `Connection failed. Retrying... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        }));
      } else {
        store.dispatch(addNotification({
          type: 'error',
          message: 'Failed to connect to server after multiple attempts'
        }));
      }
    });

    // System status updates
    this.socket.on('system_status_update', (data) => {
      store.dispatch(updateLastUpdate());
      store.dispatch(addNotification({
        type: 'info',
        message: `System status: ${data.status}`
      }));
    });

    // Agent status changes
    this.socket.on('agent_status_change', (data) => {
      store.dispatch(updateAgent(data.agent));
      store.dispatch(updateLastUpdate());
      store.dispatch(addNotification({
        type: 'info',
        message: `Agent ${data.agent.name} is now ${data.agent.status}`
      }));
    });

    // Task progress updates
    this.socket.on('task_progress_update', (data) => {
      store.dispatch(updateTask(data.task));
      store.dispatch(updateLastUpdate());
      
      if (data.task.status === 'completed') {
        store.dispatch(addNotification({
          type: 'success',
          message: `Task "${data.task.title}" completed successfully`
        }));
      } else if (data.task.status === 'failed') {
        store.dispatch(addNotification({
          type: 'error',
          message: `Task "${data.task.title}" failed`
        }));
      }
    });

    // Alert notifications
    this.socket.on('alert_notification', (data) => {
      store.dispatch(addNotification({
        type: data.severity === 'critical' || data.severity === 'error' ? 'error' : 
              data.severity === 'warning' ? 'warning' : 'info',
        message: data.title
      }));
    });

    // Metric updates
    this.socket.on('metric_update', (data) => {
      store.dispatch(addMetric(data.metric));
      store.dispatch(updateLastUpdate());
    });

    // Bulk data updates
    this.socket.on('agents_update', (data) => {
      store.dispatch(setAgents(data.agents));
      store.dispatch(updateLastUpdate());
    });

    this.socket.on('tasks_update', (data) => {
      store.dispatch(setTasks(data.tasks));
      store.dispatch(updateLastUpdate());
    });
  }

  // Emit events to server
  emit(event: string, data?: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Cannot emit event: socket not connected');
    }
  }

  // Agent management methods
  createAgent(agentData: any) {
    this.emit('create_agent', agentData);
  }

  updateAgentConfig(agentId: string, config: any) {
    this.emit('update_agent_config', { agentId, config });
  }

  deleteAgent(agentId: string) {
    this.emit('delete_agent', { agentId });
  }

  startAgent(agentId: string) {
    this.emit('start_agent', { agentId });
  }

  stopAgent(agentId: string) {
    this.emit('stop_agent', { agentId });
  }

  // Task management methods
  createTask(taskData: any) {
    this.emit('create_task', taskData);
  }

  updateTask(taskId: string, updates: any) {
    this.emit('update_task', { taskId, updates });
  }

  cancelTask(taskId: string) {
    this.emit('cancel_task', { taskId });
  }

  // Chat methods
  sendMessage(message: string, context?: any) {
    this.emit('chat_message', { message, context });
  }

  // System monitoring
  requestSystemStatus() {
    this.emit('request_system_status');
  }

  requestMetrics(timeRange?: string) {
    this.emit('request_metrics', { timeRange });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;