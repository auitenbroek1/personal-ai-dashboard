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
  IconButton,
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
  Avatar,
  LinearProgress,
  Menu,
  MenuList,
  ListItemIcon,
  ListItemText,
  MenuItem as MenuItemComponent,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  SmartToy as BotIcon,
  Search as ResearchIcon,
  Code as CodeIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Visibility as MonitorIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { addNotification } from '../../store/slices/dashboardSlice';
import websocketService from '../../services/websocketService';

interface AgentFormData {
  name: string;
  type: string;
  description: string;
  config: Record<string, any>;
}

const agentTypes = [
  { value: 'researcher', label: 'Researcher', icon: ResearchIcon, color: '#10b981' },
  { value: 'coder', label: 'Coder', icon: CodeIcon, color: '#3b82f6' },
  { value: 'monitor', label: 'Monitor', icon: MonitorIcon, color: '#8b5cf6' },
  { value: 'analyst', label: 'Analyst', icon: AnalyticsIcon, color: '#f59e0b' },
  { value: 'coordinator', label: 'Coordinator', icon: SettingsIcon, color: '#ef4444' },
];

const statusColors = {
  idle: '#6b7280',
  active: '#10b981',
  busy: '#f59e0b',
  error: '#ef4444',
  offline: '#374151',
};

const AgentCard: React.FC<{ agent: any }> = ({ agent }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const dispatch = useDispatch();

  const agentType = agentTypes.find(type => type.value === agent.type);
  const IconComponent = agentType?.icon || BotIcon;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStart = () => {
    websocketService.startAgent(agent.id);
    dispatch(addNotification({
      type: 'info',
      message: `Starting agent ${agent.name}...`
    }));
    handleMenuClose();
  };

  const handleStop = () => {
    websocketService.stopAgent(agent.id);
    dispatch(addNotification({
      type: 'info',
      message: `Stopping agent ${agent.name}...`
    }));
    handleMenuClose();
  };

  const handleDelete = () => {
    websocketService.deleteAgent(agent.id);
    dispatch(addNotification({
      type: 'warning',
      message: `Deleting agent ${agent.name}...`
    }));
    handleMenuClose();
  };

  const getStatusProgress = () => {
    switch (agent.status) {
      case 'active': return 100;
      case 'busy': return 75;
      case 'idle': return 25;
      default: return 0;
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{ 
              bgcolor: agentType?.color || '#6b7280',
              width: 40,
              height: 40,
              mr: 2 
            }}
          >
            <IconComponent />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div" noWrap>
              {agent.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {agentType?.label || agent.type}
            </Typography>
          </Box>
          <IconButton onClick={handleMenuOpen} size="small">
            <MoreIcon />
          </IconButton>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Status</Typography>
            <Chip
              label={agent.status}
              size="small"
              sx={{
                bgcolor: statusColors[agent.status as keyof typeof statusColors],
                color: 'white',
                fontSize: '0.75rem',
              }}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={getStatusProgress()}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'background.default',
              '& .MuiLinearProgress-bar': {
                bgcolor: statusColors[agent.status as keyof typeof statusColors],
              },
            }}
          />
        </Box>

        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          Last Active: {new Date(agent.last_active).toLocaleString()}
        </Typography>

        <Typography variant="body2" color="textSecondary">
          Created: {new Date(agent.created_at).toLocaleDateString()}
        </Typography>
      </CardContent>

      <CardActions>
        {agent.status === 'offline' || agent.status === 'idle' ? (
          <Button size="small" startIcon={<StartIcon />} onClick={handleStart}>
            Start
          </Button>
        ) : (
          <Button size="small" startIcon={<StopIcon />} onClick={handleStop}>
            Stop
          </Button>
        )}
        <Button size="small" startIcon={<EditIcon />}>
          Config
        </Button>
      </CardActions>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuList>
          <MenuItemComponent onClick={handleStart} disabled={agent.status === 'active' || agent.status === 'busy'}>
            <ListItemIcon>
              <StartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Start Agent</ListItemText>
          </MenuItemComponent>
          <MenuItemComponent onClick={handleStop} disabled={agent.status === 'offline' || agent.status === 'idle'}>
            <ListItemIcon>
              <StopIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Stop Agent</ListItemText>
          </MenuItemComponent>
          <MenuItemComponent onClick={handleMenuClose}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Config</ListItemText>
          </MenuItemComponent>
          <MenuItemComponent onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>Delete Agent</ListItemText>
          </MenuItemComponent>
        </MenuList>
      </Menu>
    </Card>
  );
};

const AgentCreationDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AgentFormData) => void;
}> = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    type: 'researcher',
    description: '',
    config: {},
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    
    onSubmit(formData);
    setFormData({ name: '', type: 'researcher', description: '', config: {} });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Agent</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Agent Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
          />
          
          <FormControl fullWidth>
            <InputLabel>Agent Type</InputLabel>
            <Select
              value={formData.type}
              label="Agent Type"
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {agentTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <type.icon sx={{ color: type.color }} />
                    {type.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!formData.name.trim()}>
          Create Agent
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AgentManagement: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { agents, loading } = useSelector((state: RootState) => state.agents);
  const dispatch = useDispatch();

  useEffect(() => {
    // Request current agents data
    websocketService.emit('request_agents');
  }, []);

  const handleCreateAgent = (data: AgentFormData) => {
    const agentData = {
      ...data,
      config: {
        description: data.description,
        ...data.config,
      },
    };
    
    websocketService.createAgent(agentData);
    dispatch(addNotification({
      type: 'info',
      message: `Creating agent ${data.name}...`
    }));
  };

  const activeAgents = agents.filter(agent => agent.status === 'active' || agent.status === 'busy');
  const idleAgents = agents.filter(agent => agent.status === 'idle');
  const offlineAgents = agents.filter(agent => agent.status === 'offline' || agent.status === 'error');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Agent Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Spawn, coordinate, and monitor your AI agents
          </Typography>
        </Box>
        
        <Tooltip title="Create New Agent">
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
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ color: '#10b981' }}>
              {activeAgents.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Active Agents
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ color: '#6b7280' }}>
              {idleAgents.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Idle Agents
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ color: '#ef4444' }}>
              {offlineAgents.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Offline Agents
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3">
              {agents.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Agents
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Agent Grid */}
      {loading ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Loading agents...</Typography>
        </Paper>
      ) : agents.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <BotIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Agents Created
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Create your first AI agent to get started with automation
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create First Agent
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {agents.map((agent) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={agent.id}>
              <AgentCard agent={agent} />
            </Grid>
          ))}
        </Grid>
      )}

      <AgentCreationDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateAgent}
      />
    </Box>
  );
};

export default AgentManagement;