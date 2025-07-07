import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Import routes
import dashboardRoutes from './routes/dashboard';
import monitoringRoutes from './routes/monitoring';
import agentRoutes from './routes/agents';
import taskRoutes from './routes/tasks';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Import services
import { WebSocketService } from './services/websocketService';
import { MonitoringService } from './services/monitoringService';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Initialize services
const prisma = new PrismaClient();
const wsService = new WebSocketService(io);
const monitoringService = new MonitoringService(prisma, wsService);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add services to request object
app.use((req: any, res, next) => {
  req.prisma = prisma;
  req.wsService = wsService;
  req.monitoringService = monitoringService;
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/tasks', taskRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  wsService.handleConnection(socket);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    wsService.handleDisconnection(socket);
  });
});

// Error handling middleware
app.use(errorHandler);

// Start monitoring services
monitoringService.start();

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard API available at http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server running`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;