import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  MoreVert as MoreIcon,
  Clear as ClearIcon,
  History as HistoryIcon,
  Code as CodeIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Lightbulb as SuggestionIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { addNotification } from '../../store/slices/dashboardSlice';
import websocketService from '../../services/websocketService';

interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant' | 'system';
  timestamp: Date;
  agent?: string;
  metadata?: {
    tokens?: number;
    model?: string;
    execution_time?: number;
    code_blocks?: Array<{ language: string; code: string }>;
    suggestions?: string[];
  };
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: Date;
  updated_at: Date;
}

const MessageBubble: React.FC<{ message: ChatMessage; onCopy: (text: string) => void }> = ({ message, onCopy }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCopy = () => {
    onCopy(message.content);
    handleMenuClose();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
        alignItems: 'flex-start',
      }}
    >
      {!isUser && (
        <Avatar
          sx={{
            bgcolor: isSystem ? '#8b5cf6' : '#3b82f6',
            mr: 1,
            width: 32,
            height: 32,
          }}
        >
          {isSystem ? <CodeIcon fontSize="small" /> : <BotIcon fontSize="small" />}
        </Avatar>
      )}

      <Box
        sx={{
          maxWidth: '70%',
          minWidth: '200px',
        }}
      >
        <Paper
          sx={{
            p: 2,
            bgcolor: isUser ? 'primary.main' : isSystem ? 'background.default' : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
            position: 'relative',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', flexGrow: 1 }}>
              {message.content}
            </Typography>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ ml: 1, opacity: 0.7 }}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </Box>

          {message.metadata?.code_blocks && message.metadata.code_blocks.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {message.metadata.code_blocks.map((block, index) => (
                <Accordion key={index} sx={{ mt: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2">
                      {block.language.toUpperCase()} Code
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography
                      component="pre"
                      variant="body2"
                      sx={{
                        bgcolor: 'background.default',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        fontFamily: 'monospace',
                      }}
                    >
                      {block.code}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}

          {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <SuggestionIcon fontSize="small" sx={{ mr: 0.5 }} />
                Suggestions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {message.metadata.suggestions.map((suggestion, index) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {new Date(message.timestamp).toLocaleTimeString()}
              {message.agent && ` • ${message.agent}`}
            </Typography>
            {message.metadata && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {message.metadata.tokens && (
                  <Chip label={`${message.metadata.tokens} tokens`} size="small" variant="outlined" />
                )}
                {message.metadata.execution_time && (
                  <Chip label={`${message.metadata.execution_time}ms`} size="small" variant="outlined" />
                )}
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {isUser && (
        <Avatar
          sx={{
            bgcolor: 'secondary.main',
            ml: 1,
            width: 32,
            height: 32,
          }}
        >
          <PersonIcon fontSize="small" />
        </Avatar>
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleCopy}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

const QuickActions: React.FC<{ onSendMessage: (message: string) => void }> = ({ onSendMessage }) => {
  const quickActions = [
    { label: 'System Status', message: 'What is the current system status?' },
    { label: 'Active Agents', message: 'Show me all active agents and their current tasks' },
    { label: 'Performance Report', message: 'Generate a performance report for the last 24 hours' },
    { label: 'Create Agent', message: 'Help me create a new AI agent' },
    { label: 'Task Summary', message: 'Summarize all pending and in-progress tasks' },
    { label: 'Troubleshoot', message: 'Help me troubleshoot any system issues' },
  ];

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {quickActions.map((action, index) => (
            <Chip
              key={index}
              label={action.label}
              onClick={() => onSendMessage(action.message)}
              sx={{ cursor: 'pointer' }}
              variant="outlined"
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

const ChatSidebar: React.FC<{
  sessions: ChatSession[];
  currentSession: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
}> = ({ sessions, currentSession, onSelectSession, onNewSession }) => {
  return (
    <Paper sx={{ height: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Chat History</Typography>
        <Button size="small" onClick={onNewSession} startIcon={<ClearIcon />}>
          New
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <List>
        {sessions.map((session) => (
          <ListItem
            key={session.id}
            button
            selected={currentSession === session.id}
            onClick={() => onSelectSession(session.id)}
            sx={{ borderRadius: 1, mb: 1 }}
          >
            <ListItemIcon>
              <HistoryIcon />
            </ListItemIcon>
            <ListItemText
              primary={session.title}
              secondary={new Date(session.updated_at).toLocaleDateString()}
              primaryTypographyProps={{ noWrap: true }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

const ChatInterface: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initialize with a welcome message
    const welcomeMessage: ChatMessage = {
      id: '1',
      content: 'Hello! I\'m your AI assistant. I can help you manage your agents, monitor system performance, create tasks, and answer questions about your dashboard. How can I assist you today?',
      type: 'assistant',
      timestamp: new Date(),
      agent: 'Dashboard Assistant',
      metadata: {
        suggestions: [
          'Show system status',
          'List active agents',
          'Create new task',
          'Performance metrics',
        ],
      },
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || message.trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: text,
      type: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Send message via WebSocket
      websocketService.sendMessage(text, {
        sessionId: currentSession,
        context: 'dashboard',
      });

      // Simulate AI response (in real implementation, this would come via WebSocket)
      setTimeout(() => {
        const responses = [
          'I understand you want to know about the system status. Let me gather that information for you.',
          'I can help you with that. Based on the current system state, here\'s what I found...',
          'That\'s a great question. Let me analyze the available data and provide you with insights.',
          'I\'ve processed your request. Here are the results based on your current dashboard configuration.',
        ];

        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: responses[Math.floor(Math.random() * responses.length)],
          type: 'assistant',
          timestamp: new Date(),
          agent: 'Dashboard Assistant',
          metadata: {
            tokens: Math.floor(Math.random() * 500) + 100,
            execution_time: Math.floor(Math.random() * 1000) + 200,
            model: 'claude-3-sonnet',
          },
        };

        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
      }, 1000 + Math.random() * 2000);

    } catch (error) {
      console.error('Error sending message:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to send message'
      }));
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    dispatch(addNotification({
      type: 'success',
      message: 'Message copied to clipboard'
    }));
  };

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `Chat ${sessions.length + 1}`,
      messages: [],
      created_at: new Date(),
      updated_at: new Date(),
    };
    setSessions(prev => [...prev, newSession]);
    setCurrentSession(newSession.id);
    setMessages([]);
  };

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(sessionId);
      setMessages(session.messages);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex' }}>
      {/* Sidebar */}
      {showSidebar && (
        <Box sx={{ width: 300, mr: 2 }}>
          <ChatSidebar
            sessions={sessions}
            currentSession={currentSession}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
          />
        </Box>
      )}

      {/* Main Chat Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">
              AI Assistant Chat
            </Typography>
            <Box>
              <Tooltip title="Toggle Sidebar">
                <IconButton onClick={() => setShowSidebar(!showSidebar)}>
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="New Chat">
                <IconButton onClick={handleNewSession}>
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Typography variant="body2" color="textSecondary">
            Ask questions about your dashboard, manage agents, or get system insights
          </Typography>
        </Paper>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <QuickActions onSendMessage={handleSendMessage} />
        )}

        {/* Messages */}
        <Paper sx={{ flexGrow: 1, p: 2, overflow: 'auto', mb: 2 }}>
          <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} onCopy={handleCopyMessage} />
            ))}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#3b82f6', mr: 1, width: 32, height: 32 }}>
                  <BotIcon fontSize="small" />
                </Avatar>
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
                    Thinking...
                  </Typography>
                </Paper>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
        </Paper>

        {/* Input Area */}
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Ask me anything about your dashboard..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <IconButton
              color="primary"
              onClick={() => handleSendMessage()}
              disabled={!message.trim() || isLoading}
              sx={{ alignSelf: 'flex-end' }}
            >
              <SendIcon />
            </IconButton>
          </Box>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            Press Enter to send, Shift+Enter for new line
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default ChatInterface;