import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Badge,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  SmartToy as AgentsIcon,
  Assignment as TasksIcon,
  Chat as ChatIcon,
  MonitorHeart as MonitoringIcon,
  Notifications as NotificationsIcon,
  Circle as StatusIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setCurrentPage } from '../../store/slices/dashboardSlice';
import DashboardOverview from '../Dashboard/DashboardOverview';
import AgentManagement from '../Agents/AgentManagement';
import TaskQueue from '../Tasks/TaskQueue';
import ChatInterface from '../Chat/ChatInterface';
import SystemMonitoring from '../Monitoring/SystemMonitoring';

const drawerWidth = 240;

const menuItems = [
  { id: 'overview', label: 'Overview', icon: DashboardIcon },
  { id: 'agents', label: 'Agents', icon: AgentsIcon },
  { id: 'tasks', label: 'Tasks', icon: TasksIcon },
  { id: 'chat', label: 'Chat', icon: ChatIcon },
  { id: 'monitoring', label: 'Monitoring', icon: MonitoringIcon },
];

const DashboardLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useDispatch();
  const { currentPage, isConnected, notifications } = useSelector((state: RootState) => state.dashboard);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handlePageChange = (pageId: string) => {
    dispatch(setCurrentPage(pageId));
    setMobileOpen(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <DashboardOverview />;
      case 'agents':
        return <AgentManagement />;
      case 'tasks':
        return <TaskQueue />;
      case 'chat':
        return <ChatInterface />;
      case 'monitoring':
        return <SystemMonitoring />;
      default:
        return <DashboardOverview />;
    }
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          AI Dashboard
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={currentPage === item.id}
                onClick={() => handlePageChange(item.id)}
              >
                <ListItemIcon>
                  <IconComponent />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Personal AI Assistant Dashboard
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StatusIcon 
                sx={{ 
                  color: isConnected ? '#10b981' : '#ef4444',
                  fontSize: 12 
                }} 
              />
              <Typography variant="body2">
                {isConnected ? 'Connected' : 'Disconnected'}
              </Typography>
            </Box>
            
            <IconButton color="inherit">
              <Badge badgeContent={notifications.length} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            <Avatar sx={{ width: 32, height: 32 }}>U</Avatar>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {renderPage()}
      </Box>
    </Box>
  );
};

export default DashboardLayout;