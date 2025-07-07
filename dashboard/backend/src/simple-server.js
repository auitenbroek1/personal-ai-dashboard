const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Simple API endpoints for testing
app.get('/api/dashboard/overview', (req, res) => {
  res.json({
    systemMetrics: {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      diskUsage: Math.random() * 100,
      networkTraffic: Math.random() * 1000
    },
    agentStats: {
      total: 5,
      active: 3,
      idle: 2,
      offline: 0
    },
    taskStats: {
      total: 15,
      pending: 3,
      inProgress: 2,
      completed: 10
    }
  });
});

app.get('/api/agents', (req, res) => {
  res.json([
    {
      id: '1',
      name: 'Research Agent',
      type: 'researcher',
      status: 'active',
      progress: 75,
      lastActive: new Date().toISOString()
    },
    {
      id: '2', 
      name: 'Code Agent',
      type: 'coder',
      status: 'idle',
      progress: 0,
      lastActive: new Date(Date.now() - 300000).toISOString()
    }
  ]);
});

app.get('/api/tasks', (req, res) => {
  res.json([
    {
      id: '1',
      title: 'Analyze system performance',
      status: 'in_progress',
      priority: 'high',
      agentId: '1',
      progress: 60,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Review code quality',
      status: 'pending', 
      priority: 'medium',
      agentId: '2',
      progress: 0,
      createdAt: new Date().toISOString()
    }
  ]);
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);
  
  // Send welcome message
  socket.emit('system-update', {
    type: 'connection',
    message: 'Connected to AI Assistant Dashboard',
    timestamp: new Date().toISOString()
  });
  
  // Simulate real-time updates
  const interval = setInterval(() => {
    socket.emit('metrics-update', {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      activeAgents: Math.floor(Math.random() * 5) + 1,
      timestamp: new Date().toISOString()
    });
  }, 5000);
  
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    clearInterval(interval);
  });
});

const PORT = 3001;

server.listen(PORT, () => {
  console.log(`🚀 Simple Dashboard Server running on port ${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server active`);
  console.log(`🎯 Ready for frontend connection!`);
});