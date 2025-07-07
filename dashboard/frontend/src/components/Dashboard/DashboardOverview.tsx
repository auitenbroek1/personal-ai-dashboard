import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  SmartToy as AgentsIcon,
  Assignment as TasksIcon,
  Timeline as MetricsIcon,
  Warning as AlertsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Memory as MemoryIcon,
  Speed as CpuIcon,
  NetworkCheck as NetworkIcon,
  Storage as StorageIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { addNotification, setCurrentPage } from '../../store/slices/dashboardSlice';
import websocketService from '../../services/websocketService';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  onClick?: () => void;
}

interface SystemMetric {
  name: string;
  value: number;
  max: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend, onClick }) => {
  const TrendIcon = trend && trend > 0 ? TrendingUpIcon : TrendingDownIcon;

  return (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-2px)' } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendIcon sx={{ 
                  fontSize: 16, 
                  color: trend > 0 ? '#ef4444' : '#10b981',
                  mr: 0.5 
                }} />
                <Typography variant="caption" color="textSecondary">
                  {Math.abs(trend).toFixed(1)}% from last hour
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ color, fontSize: 40 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const SystemMetricCard: React.FC<{ metric: SystemMetric }> = ({ metric }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2" color="textSecondary">
          {metric.name}
        </Typography>
        <Box sx={{ color: metric.color }}>
          {metric.icon}
        </Box>
      </Box>
      <Typography variant="h5" sx={{ mb: 1 }}>
        {metric.value.toFixed(1)}{metric.unit}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={(metric.value / metric.max) * 100}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: 'background.default',
          '& .MuiLinearProgress-bar': {
            bgcolor: metric.value / metric.max > 0.8 ? '#ef4444' : 
                    metric.value / metric.max > 0.6 ? '#f59e0b' : '#10b981',
          },
        }}
      />
      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
        {((metric.value / metric.max) * 100).toFixed(1)}% of {metric.max}{metric.unit}
      </Typography>
    </CardContent>
  </Card>
);

const QuickActionsCard: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const quickActions = [
    { label: 'Create Agent', page: 'agents', color: '#10b981', icon: <AgentsIcon /> },
    { label: 'New Task', page: 'tasks', color: '#3b82f6', icon: <TasksIcon /> },
    { label: 'View Metrics', page: 'monitoring', color: '#8b5cf6', icon: <MetricsIcon /> },
    { label: 'Chat Assistant', page: 'chat', color: '#f59e0b', icon: <StartIcon /> },
  ];

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Quick Actions
      </Typography>
      <Grid container spacing={2}>
        {quickActions.map((action, index) => (
          <Grid item xs={6} key={index}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={action.icon}
              onClick={() => onNavigate(action.page)}
              sx={{
                borderColor: action.color,
                color: action.color,
                '&:hover': {
                  borderColor: action.color,
                  bgcolor: `${action.color}20`,
                },
              }}
            >
              {action.label}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

const RecentActivityCard: React.FC = () => {
  const { notifications } = useSelector((state: RootState) => state.dashboard);
  const recentNotifications = notifications.slice(-5);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success': return <SuccessIcon sx={{ color: '#10b981' }} />;
      case 'error': return <ErrorIcon sx={{ color: '#ef4444' }} />;
      case 'warning': return <AlertsIcon sx={{ color: '#f59e0b' }} />;
      default: return <MetricsIcon sx={{ color: '#3b82f6' }} />;
    }
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Recent Activity
      </Typography>
      {recentNotifications.length > 0 ? (
        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
          {recentNotifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getActivityIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.message}
                  secondary={new Date(notification.timestamp).toLocaleString()}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
              {index < recentNotifications.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
          No recent activity to display.
        </Typography>
      )}
    </Paper>
  );
};

const MiniMetricsChart: React.FC = () => {
  const { metrics } = useSelector((state: RootState) => state.metrics);
  const recentMetrics = metrics.slice(-20);

  const chartData = {
    labels: recentMetrics.map(() => ''),
    datasets: [
      {
        label: 'CPU',
        data: recentMetrics.filter(m => m.metric_type === 'cpu_usage').slice(-10).map(m => m.value),
        borderColor: '#3b82f6',
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Memory',
        data: recentMetrics.filter(m => m.metric_type === 'memory_usage').slice(-10).map(m => m.value),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
        min: 0,
        max: 100,
      },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
    },
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">System Metrics</Typography>
        <Tooltip title="View Detailed Metrics">
          <IconButton size="small">
            <LaunchIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ height: 150 }}>
        {recentMetrics.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Typography variant="body2" color="textSecondary">
              No metrics data available
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

const DashboardOverview: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([
    { name: 'CPU Usage', value: 45.2, max: 100, unit: '%', icon: <CpuIcon />, color: '#3b82f6' },
    { name: 'Memory', value: 2.4, max: 8, unit: 'GB', icon: <MemoryIcon />, color: '#10b981' },
    { name: 'Disk I/O', value: 125, max: 1000, unit: 'MB/s', icon: <StorageIcon />, color: '#f59e0b' },
    { name: 'Network', value: 45, max: 1000, unit: 'Mbps', icon: <NetworkIcon />, color: '#8b5cf6' },
  ]);

  const { agents } = useSelector((state: RootState) => state.agents);
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { metrics } = useSelector((state: RootState) => state.metrics);
  const { notifications, isConnected, lastUpdate } = useSelector((state: RootState) => state.dashboard);
  const dispatch = useDispatch();

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    if (!websocketService.isConnected()) {
      websocketService.connect();
    }

    // Request initial data
    websocketService.emit('request_dashboard_data');

    // Simulate system metrics updates
    const interval = setInterval(() => {
      setSystemMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.max(0, Math.min(metric.max, metric.value + (Math.random() - 0.5) * 10)),
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (page: string) => {
    dispatch(setCurrentPage(page));
  };

  const handleRefresh = () => {
    websocketService.emit('request_dashboard_data');
    dispatch(addNotification({
      type: 'info',
      message: 'Refreshing dashboard data...'
    }));
  };

  const activeAgents = agents.filter(agent => agent.status === 'active' || agent.status === 'busy').length;
  const activeTasks = tasks.filter(task => task.status === 'in_progress').length;
  const completedTasksToday = tasks.filter(task => {
    return task.status === 'completed' && 
           new Date(task.completed_at || task.created_at).toDateString() === new Date().toDateString();
  }).length;
  const activeAlerts = notifications.filter(n => n.type === 'error' || n.type === 'warning').length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dashboard Overview
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Real-time monitoring and control of your AI assistant systems
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={isConnected ? <SuccessIcon /> : <ErrorIcon />}
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
          />
          <Tooltip title="Refresh Dashboard">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Agents"
            value={activeAgents}
            icon={<AgentsIcon />}
            color="#10b981"
            trend={2.4}
            onClick={() => handleNavigate('agents')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Running Tasks"
            value={activeTasks}
            icon={<TasksIcon />}
            color="#3b82f6"
            trend={-1.2}
            onClick={() => handleNavigate('tasks')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Today"
            value={completedTasksToday}
            icon={<SuccessIcon />}
            color="#8b5cf6"
            trend={15.7}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Alerts"
            value={activeAlerts}
            icon={<AlertsIcon />}
            color="#ef4444"
            trend={-8.3}
            onClick={() => handleNavigate('monitoring')}
          />
        </Grid>
      </Grid>

      {/* System Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {systemMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <SystemMetricCard metric={metric} />
          </Grid>
        ))}
      </Grid>

      {/* Secondary Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <QuickActionsCard onNavigate={handleNavigate} />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <RecentActivityCard />
        </Grid>

        <Grid item xs={12} md={4}>
          <MiniMetricsChart />
        </Grid>
      </Grid>

      {lastUpdate && (
        <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
          Last updated: {new Date(lastUpdate).toLocaleString()}
        </Typography>
      )}
    </Box>
  );
};

export default DashboardOverview;