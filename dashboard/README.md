# Personal AI Assistant Dashboard

A comprehensive monitoring and control dashboard for AI agents and automation systems, built with React, Express, and integrating with the existing Claude-Flow infrastructure.

## Architecture Overview

The dashboard follows a modern full-stack architecture:

- **Frontend**: React 18 with TypeScript, Material-UI, Redux Toolkit, and Socket.IO
- **Backend**: Node.js with Express, TypeScript, Prisma ORM, and WebSocket support
- **Database**: SQLite (development) / PostgreSQL (production)
- **Deployment**: Vercel with serverless functions
- **Integration**: Seamless integration with existing Claude-Flow memory and agent systems

## Project Structure

```
dashboard/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Dashboard pages
│   │   ├── store/         # Redux store and slices
│   │   ├── services/      # API service layer
│   │   └── types/         # TypeScript types
│   └── package.json
├── backend/           # Node.js backend API
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic services
│   │   ├── middleware/    # Express middleware
│   │   └── types/         # TypeScript types
│   ├── prisma/            # Database schema
│   └── package.json
├── shared/            # Shared types and utilities
└── package.json       # Root workspace configuration
```

## Features

### Core Dashboard Features
- **Real-time System Monitoring**: Live updates on agent status, task progress, and system health
- **Agent Management**: Create, configure, and control AI agents
- **Task Queue Management**: Assign, track, and manage tasks across agents
- **Performance Analytics**: Comprehensive metrics and trend analysis
- **Alert System**: Real-time notifications for system events and issues

### Integration Features
- **Claude-Flow Memory Bridge**: Seamless integration with existing memory system
- **SPARC Agent Coordination**: Support for Strategist, Planner, Architect, Researcher, Coder framework
- **WebSocket Real-time Updates**: Live communication between frontend and backend
- **API Compatibility**: RESTful API for external integrations

## Quick Start

### Prerequisites
- Node.js 18+
- npm 8+

### Installation

1. **Install all dependencies**:
   ```bash
   cd dashboard
   npm run install:all
   ```

2. **Set up the database**:
   ```bash
   npm run db:setup
   ```

3. **Start development servers**:
   ```bash
   npm run dev
   ```

This will start:
- Frontend development server on `http://localhost:5173`
- Backend API server on `http://localhost:3001`

### Environment Configuration

Copy the example environment files and configure them:

```bash
# Backend configuration
cp backend/.env.example backend/.env

# Frontend configuration  
cp frontend/.env.example frontend/.env
```

Key environment variables:
- `DATABASE_URL`: Database connection string
- `JWT_SECRET`: Secret for JWT token signing
- `CLAUDE_API_KEY`: Claude API key for integrations
- `MEMORY_PATH`: Path to Claude-Flow memory file
- `SYSTEM_STATUS_PATH`: Path to system status file

## API Endpoints

### Dashboard API (`/api/dashboard`)
- `GET /overview` - System overview and statistics
- `GET /health` - System health check

### Agents API (`/api/agents`)
- `GET /` - List all agents
- `POST /` - Create new agent
- `GET /:id` - Get agent details
- `PUT /:id` - Update agent
- `DELETE /:id` - Delete agent

### Tasks API (`/api/tasks`)
- `GET /` - List tasks (with pagination)
- `POST /` - Create new task
- `PUT /:id` - Update task
- `DELETE /:id` - Delete task

### Monitoring API (`/api/monitoring`)
- `GET /metrics` - System metrics
- `GET /alerts` - System alerts
- `GET /health` - Health status

## WebSocket Events

### Client → Server
- `subscribe_to_updates` - Subscribe to real-time updates
- `agent_command` - Send command to agent
- `task_update` - Update task status

### Server → Client
- `system_status_update` - System status changes
- `agent_status_change` - Agent status updates
- `task_progress_update` - Task progress updates
- `alert_notification` - New alerts
- `metric_update` - New metrics

## Claude-Flow Integration

The dashboard integrates with the existing Claude-Flow system through:

### Memory Bridge
- **Bidirectional Sync**: Keeps dashboard database and file-based memory in sync
- **Real-time Updates**: Automatic synchronization every 5 minutes
- **Compatibility**: Maintains compatibility with existing memory format

### Agent Coordination
- **SPARC Framework**: Full support for Strategist, Planner, Architect, Researcher, Coder agents
- **Task Assignment**: Intelligent task routing based on agent capabilities
- **Workflow Coordination**: Multi-agent workflow orchestration

### System Status Integration
- **Health Monitoring**: Integrates with existing system status tracking
- **Performance Metrics**: Extends existing metrics collection
- **Alert Propagation**: Forwards dashboard alerts to existing notification systems

## Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Vercel Deployment
The project is configured for Vercel deployment with:
- Automatic builds from Git repository
- Environment variable management
- Database migrations
- CDN distribution

## Database Schema

The dashboard uses the following main entities:

- **Agents**: AI agent registry and status
- **Tasks**: Task queue and execution history
- **SystemMetrics**: Performance and health metrics
- **MemoryEntries**: Integration with Claude-Flow memory
- **Reports**: Generated reports and analytics
- **Alerts**: System alerts and notifications
- **Users**: Authentication and authorization

## Development Workflow

1. **Feature Development**:
   - Create feature branch
   - Develop using shared types from `/shared`
   - Test with development environment
   - Create pull request

2. **Database Changes**:
   ```bash
   # Generate migration
   cd backend
   npx prisma migrate dev --name feature-name
   
   # Generate client
   npx prisma generate
   ```

3. **Adding New Components**:
   - Frontend components in `/frontend/src/components`
   - Backend services in `/backend/src/services`
   - Shared types in `/shared/types`

## Monitoring and Observability

The dashboard includes comprehensive monitoring:

- **Application Metrics**: Response times, error rates, active users
- **System Health**: Agent status, task queue health, resource usage
- **Real-time Alerts**: Automatic notifications for issues
- **Performance Analytics**: Trend analysis and reporting

## Security

Security features include:

- **JWT Authentication**: Secure API access
- **Role-based Access Control**: Admin, operator, and viewer roles
- **Input Validation**: All API inputs validated
- **Rate Limiting**: Protection against abuse
- **Secure Headers**: Security headers on all responses

## Support and Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Check `DATABASE_URL` environment variable
   - Ensure database is running and accessible
   - Run `npm run db:setup` to initialize

2. **WebSocket Connection Issues**:
   - Check CORS configuration
   - Verify firewall settings
   - Check WebSocket URL in frontend environment

3. **Memory Integration Issues**:
   - Verify `MEMORY_PATH` and `SYSTEM_STATUS_PATH`
   - Check file permissions
   - Ensure Claude-Flow system is running

### Logs and Debugging

- **Backend Logs**: Check console output for API errors
- **Frontend Logs**: Use browser developer tools
- **Database Logs**: Use `npx prisma studio` for database inspection

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Ensure all checks pass

## License

This project is part of the Personal AI Assistant system and follows the same licensing terms as the parent project.