import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Fab,
  Tooltip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Tab,
  Tabs,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Cancel as CancelIcon,
  CheckCircle as CompleteIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { addNotification } from '../../store/slices/dashboardSlice';
import websocketService from '../../services/websocketService';

interface TaskFormData {
  title: string;
  description: string;
  agent_id: string;
  priority: string;
  metadata?: Record<string, any>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const priorityColors = {
  low: '#6b7280',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};

const statusColors = {
  pending: '#6b7280',
  in_progress: '#3b82f6',
  completed: '#10b981',
  failed: '#ef4444',
  cancelled: '#9ca3af',
};

const statusIcons = {
  pending: PendingIcon,
  in_progress: StartIcon,
  completed: CompleteIcon,
  failed: ErrorIcon,
  cancelled: CancelIcon,
};

const TaskCard: React.FC<{ task: any; onUpdate: (taskId: string, updates: any) => void }> = ({ task, onUpdate }) => {
  const { agents } = useSelector((state: RootState) => state.agents);
  const agent = agents.find(a => a.id === task.agent_id);
  const StatusIcon = statusIcons[task.status as keyof typeof statusIcons];

  const handleCancel = () => {
    onUpdate(task.id, { status: 'cancelled' });
  };

  const handleRetry = () => {
    onUpdate(task.id, { status: 'pending' });
  };

  const getProgress = () => {
    switch (task.status) {
      case 'completed': return 100;
      case 'in_progress': return 60;
      case 'failed': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  const timeDiff = task.completed_at 
    ? new Date(task.completed_at).getTime() - new Date(task.created_at).getTime()
    : Date.now() - new Date(task.created_at).getTime();
  
  const duration = Math.floor(timeDiff / 1000 / 60); // minutes

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>
              {task.title}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              {task.description}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', alignItems: 'flex-end' }}>
            <Chip
              label={task.priority}
              size="small"
              sx={{
                bgcolor: priorityColors[task.priority as keyof typeof priorityColors],
                color: 'white',
              }}
            />
            <Chip
              icon={<StatusIcon />}
              label={task.status.replace('_', ' ')}
              size="small"
              sx={{
                bgcolor: statusColors[task.status as keyof typeof statusColors],
                color: 'white',
              }}
            />
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            Progress
          </Typography>
          <LinearProgress
            variant="determinate"
            value={getProgress()}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'background.default',
              '& .MuiLinearProgress-bar': {
                bgcolor: statusColors[task.status as keyof typeof statusColors],
              },
            }}
          />
        </Box>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Agent: {agent?.name || 'Unknown'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Duration: {duration}m
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Created: {new Date(task.created_at).toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              {task.completed_at && `Completed: ${new Date(task.completed_at).toLocaleDateString()}`}
            </Typography>
          </Grid>
        </Grid>

        {task.result && (
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2">Task Result</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(task.result, null, 2)}
              </Typography>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>

      <CardActions>
        {task.status === 'pending' && (
          <Button size="small" onClick={handleCancel} color="error">
            Cancel
          </Button>
        )}
        {(task.status === 'failed' || task.status === 'cancelled') && (
          <Button size="small" onClick={handleRetry} color="primary">
            Retry
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

const TaskCreationDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
}> = ({ open, onClose, onSubmit }) => {
  const { agents } = useSelector((state: RootState) => state.agents);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    agent_id: '',
    priority: 'medium',
  });

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.agent_id) return;
    
    onSubmit(formData);
    setFormData({ title: '', description: '', agent_id: '', priority: 'medium' });
    onClose();
  };

  const availableAgents = agents.filter(agent => 
    agent.status === 'idle' || agent.status === 'active'
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Task</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Task Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            fullWidth
            required
          />
          
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />

          <FormControl fullWidth required>
            <InputLabel>Assign to Agent</InputLabel>
            <Select
              value={formData.agent_id}
              label="Assign to Agent"
              onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
            >
              {availableAgents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.name} ({agent.type}) - {agent.status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={formData.priority}
              label="Priority"
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!formData.title.trim() || !formData.agent_id}
        >
          Create Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const TaskQueue: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const { tasks, loading } = useSelector((state: RootState) => state.tasks);
  const dispatch = useDispatch();

  useEffect(() => {
    // Request current tasks data
    websocketService.emit('request_tasks');
  }, []);

  const handleCreateTask = (data: TaskFormData) => {
    websocketService.createTask(data);
    dispatch(addNotification({
      type: 'info',
      message: `Creating task "${data.title}"...`
    }));
  };

  const handleUpdateTask = (taskId: string, updates: any) => {
    websocketService.updateTask(taskId, updates);
    dispatch(addNotification({
      type: 'info',
      message: 'Updating task...'
    }));
  };

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const failedTasks = tasks.filter(task => task.status === 'failed');

  const allActiveTasks = [...pendingTasks, ...inProgressTasks];
  const allCompletedTasks = [...completedTasks, ...failedTasks];

  const priorityCount = {
    urgent: tasks.filter(t => t.priority === 'urgent' && (t.status === 'pending' || t.status === 'in_progress')).length,
    high: tasks.filter(t => t.priority === 'high' && (t.status === 'pending' || t.status === 'in_progress')).length,
    medium: tasks.filter(t => t.priority === 'medium' && (t.status === 'pending' || t.status === 'in_progress')).length,
    low: tasks.filter(t => t.priority === 'low' && (t.status === 'pending' || t.status === 'in_progress')).length,
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Task Queue
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage and track task execution across your AI agents
          </Typography>
        </Box>
        
        <Tooltip title="Create New Task">
          <Fab
            color="primary"
            onClick={() => setCreateDialogOpen(true)}
            sx={{ ml: 2 }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </Box>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ color: '#3b82f6' }}>
              {pendingTasks.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Pending Tasks
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ color: '#f59e0b' }}>
              {inProgressTasks.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              In Progress
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ color: '#10b981' }}>
              {completedTasks.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Completed
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ color: '#ef4444' }}>
              {failedTasks.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Failed
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Priority Breakdown */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Active Tasks by Priority
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(priorityCount).map(([priority, count]) => (
            <Grid item xs={3} key={priority}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography 
                  variant="h4" 
                  sx={{ color: priorityColors[priority as keyof typeof priorityColors] }}
                >
                  {count}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ textTransform: 'capitalize' }}>
                  {priority}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Task Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab 
              label={
                <Badge badgeContent={allActiveTasks.length} color="primary">
                  Active Tasks
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={allCompletedTasks.length} color="secondary">
                  Completed Tasks
                </Badge>
              } 
            />
            <Tab label="Pending" />
            <Tab label="In Progress" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            {allActiveTasks.length === 0 ? (
              <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                No active tasks
              </Typography>
            ) : (
              allActiveTasks.map((task) => (
                <TaskCard key={task.id} task={task} onUpdate={handleUpdateTask} />
              ))
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            {allCompletedTasks.length === 0 ? (
              <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                No completed tasks
              </Typography>
            ) : (
              allCompletedTasks.map((task) => (
                <TaskCard key={task.id} task={task} onUpdate={handleUpdateTask} />
              ))
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            {pendingTasks.length === 0 ? (
              <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                No pending tasks
              </Typography>
            ) : (
              pendingTasks.map((task) => (
                <TaskCard key={task.id} task={task} onUpdate={handleUpdateTask} />
              ))
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 2 }}>
            {inProgressTasks.length === 0 ? (
              <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                No tasks in progress
              </Typography>
            ) : (
              inProgressTasks.map((task) => (
                <TaskCard key={task.id} task={task} onUpdate={handleUpdateTask} />
              ))
            )}
          </Box>
        </TabPanel>
      </Paper>

      <TaskCreationDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateTask}
      />
    </Box>
  );
};

export default TaskQueue;