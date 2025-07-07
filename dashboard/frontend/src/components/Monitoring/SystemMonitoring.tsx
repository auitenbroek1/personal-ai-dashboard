import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon,
  Memory as MemoryIcon,
  Speed as CpuIcon,
  NetworkCheck as NetworkIcon,
  Storage as StorageIcon,
  Timeline as MetricsIcon,
  Notifications as AlertsIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { addNotification } from '../../store/slices/dashboardSlice';
import websocketService from '../../services/websocketService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  lastUpdate: Date;
}

interface AlertItem {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  acknowledged: boolean;
  component: string;
}

const MetricCard: React.FC<{
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}> = ({ title, value, unit, icon, color, trend }) => {
  const TrendIcon = trend && trend > 0 ? TrendingUpIcon : TrendingDownIcon;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value.toFixed(1)}{unit}
            </Typography>
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendIcon sx={{ fontSize: 16, color: trend > 0 ? '#ef4444' : '#10b981' }} />
                <Typography variant="body2" sx={{ ml: 0.5 }}>
                  {Math.abs(trend).toFixed(1)}% from last hour
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ color, fontSize: 40 }}>
            {icon}
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(value, 100)}
          sx={{
            mt: 2,
            height: 8,
            borderRadius: 4,
            bgcolor: 'background.default',
            '& .MuiLinearProgress-bar': {
              bgcolor: value > 80 ? '#ef4444' : value > 60 ? '#f59e0b' : '#10b981',
            },
          }}
        />
      </CardContent>
    </Card>
  );
};

const AlertsList: React.FC<{ alerts: AlertItem[]; onAcknowledge: (id: string) => void }> = ({ alerts, onAcknowledge }) => {
  const alertIcons = {
    info: InfoIcon,
    warning: WarningIcon,
    error: ErrorIcon,
    critical: ErrorIcon,
  };

  const alertColors = {
    info: '#3b82f6',
    warning: '#f59e0b',
    error: '#ef4444',
    critical: '#dc2626',
  };

  return (
    <List>
      {alerts.map((alert) => {
        const AlertIcon = alertIcons[alert.type];
        return (
          <ListItem key={alert.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
            <ListItemIcon>
              <AlertIcon sx={{ color: alertColors[alert.type] }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">{alert.title}</Typography>
                  <Chip
                    label={alert.type}
                    size="small"
                    sx={{
                      bgcolor: alertColors[alert.type],
                      color: 'white',
                      textTransform: 'uppercase',
                    }}
                  />
                  {!alert.acknowledged && (
                    <Chip label="New" size="small" color="secondary" />
                  )}
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {alert.description}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {alert.component} • {new Date(alert.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              }
            />
            {!alert.acknowledged && (
              <IconButton onClick={() => onAcknowledge(alert.id)} size="small">
                <SuccessIcon />
              </IconButton>
            )}
          </ListItem>
        );
      })}
    </List>
  );
};

const MetricsChart: React.FC<{ metrics: any[]; timeRange: string }> = ({ metrics, timeRange }) => {
  const chartData = {
    labels: metrics.map((m) => new Date(m.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: metrics.filter(m => m.metric_type === 'cpu_usage').map(m => m.value),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Memory Usage (%)',
        data: metrics.filter(m => m.metric_type === 'memory_usage').map(m => m.value),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Response Time (ms)',
        data: metrics.filter(m => m.metric_type === 'response_time').map(m => m.value / 10), // Scale down for visibility
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `System Metrics - ${timeRange}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
    elements: {
      point: {
        radius: 2,
      },
    },
  };

  return (
    <Box sx={{ height: 300 }}>
      <Line data={chartData} options={options} />
    </Box>
  );
};

const SystemStatus: React.FC<{ health: SystemHealth }> = ({ health }) => {
  const statusColors = {
    healthy: '#10b981',
    warning: '#f59e0b',
    critical: '#ef4444',
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">System Status</Typography>
          <Chip
            label={health.overall}
            sx={{
              bgcolor: statusColors[health.overall],
              color: 'white',
              textTransform: 'capitalize',
            }}
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Uptime
            </Typography>
            <Typography variant="h6">
              {formatUptime(health.uptime)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Last Update
            </Typography>
            <Typography variant="h6">
              {new Date(health.lastUpdate).toLocaleTimeString()}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const SystemMonitoring: React.FC = () => {
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: '1',
      type: 'warning',
      title: 'High Memory Usage',
      description: 'Memory usage has exceeded 80% for the past 5 minutes',
      timestamp: new Date(Date.now() - 300000),
      acknowledged: false,
      component: 'System Monitor',
    },
    {
      id: '2',
      type: 'info',
      title: 'Agent Startup',
      description: 'New research agent started successfully',
      timestamp: new Date(Date.now() - 600000),
      acknowledged: true,
      component: 'Agent Manager',
    },
  ]);

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overall: 'healthy',
    cpu: 45.2,
    memory: 67.8,
    disk: 34.1,
    network: 12.5,
    uptime: 1234567,
    lastUpdate: new Date(),
  });

  const { metrics } = useSelector((state: RootState) => state.metrics);
  const { isConnected } = useSelector((state: RootState) => state.dashboard);
  const dispatch = useDispatch();

  useEffect(() => {
    // Request initial system status
    websocketService.requestSystemStatus();
    websocketService.requestMetrics(timeRange);

    const interval = setInterval(() => {
      if (autoRefresh && isConnected) {
        websocketService.requestSystemStatus();
        websocketService.requestMetrics(timeRange);
        
        // Simulate system health updates
        setSystemHealth(prev => ({
          ...prev,
          cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
          memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 5)),
          disk: Math.max(0, Math.min(100, prev.disk + (Math.random() - 0.5) * 2)),
          network: Math.max(0, Math.min(100, prev.network + (Math.random() - 0.5) * 20)),
          lastUpdate: new Date(),
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, isConnected, timeRange]);

  const handleRefresh = () => {
    websocketService.requestSystemStatus();
    websocketService.requestMetrics(timeRange);
    dispatch(addNotification({
      type: 'info',
      message: 'Refreshing system metrics...'
    }));
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
    dispatch(addNotification({
      type: 'success',
      message: 'Alert acknowledged'
    }));
  };

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
  const recentMetrics = metrics.slice(-50); // Last 50 data points

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            System Monitoring
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Real-time system health, metrics, and alerts
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small">
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="15m">15 minutes</MenuItem>
              <MenuItem value="1h">1 hour</MenuItem>
              <MenuItem value="6h">6 hours</MenuItem>
              <MenuItem value="24h">24 hours</MenuItem>
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto Refresh"
          />
          
          <Tooltip title="Refresh Now">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Connection Status */}
      {!isConnected && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.dark' }}>
          <Typography variant="body1" sx={{ color: 'white' }}>
            <ErrorIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Disconnected from monitoring service. Reconnecting...
          </Typography>
        </Paper>
      )}

      {/* System Health Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="CPU Usage"
            value={systemHealth.cpu}
            unit="%"
            icon={<CpuIcon />}
            color="#3b82f6"
            trend={-2.1}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Memory Usage"
            value={systemHealth.memory}
            unit="%"
            icon={<MemoryIcon />}
            color="#10b981"
            trend={5.3}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Disk Usage"
            value={systemHealth.disk}
            unit="%"
            icon={<StorageIcon />}
            color="#f59e0b"
            trend={0.8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Network I/O"
            value={systemHealth.network}
            unit="MB/s"
            icon={<NetworkIcon />}
            color="#8b5cf6"
            trend={-1.2}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* System Status */}
        <Grid item xs={12} md={4}>
          <SystemStatus health={systemHealth} />
        </Grid>

        {/* Active Alerts */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Active Alerts
                {unacknowledgedAlerts.length > 0 && (
                  <Badge badgeContent={unacknowledgedAlerts.length} color="error" sx={{ ml: 1 }} />
                )}
              </Typography>
              <AlertsIcon />
            </Box>
            {alerts.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                No active alerts
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                <AlertsList alerts={alerts} onAcknowledge={handleAcknowledgeAlert} />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Metrics Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            {recentMetrics.length > 0 ? (
              <MetricsChart metrics={recentMetrics} timeRange={timeRange} />
            ) : (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  No metrics data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Agent Status Table */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Agent Performance Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Agent</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>CPU</TableCell>
                      <TableCell>Memory</TableCell>
                      <TableCell>Tasks</TableCell>
                      <TableCell>Uptime</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Research Agent #1</TableCell>
                      <TableCell>
                        <Chip label="Active" size="small" color="success" />
                      </TableCell>
                      <TableCell>12.3%</TableCell>
                      <TableCell>45.2MB</TableCell>
                      <TableCell>3</TableCell>
                      <TableCell>2h 15m</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Code Agent #1</TableCell>
                      <TableCell>
                        <Chip label="Busy" size="small" color="warning" />
                      </TableCell>
                      <TableCell>34.7%</TableCell>
                      <TableCell>78.9MB</TableCell>
                      <TableCell>1</TableCell>
                      <TableCell>45m</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Monitor Agent #1</TableCell>
                      <TableCell>
                        <Chip label="Idle" size="small" color="default" />
                      </TableCell>
                      <TableCell>2.1%</TableCell>
                      <TableCell>23.4MB</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>4h 32m</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemMonitoring;