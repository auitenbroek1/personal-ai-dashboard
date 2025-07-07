const { io } = require('socket.io-client');

console.log('🔌 Testing WebSocket connection...');

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  timeout: 10000
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server!');
  console.log('Socket ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket server');
});

socket.on('connect_error', (error) => {
  console.log('🚫 Connection error:', error.message);
});

socket.on('system-update', (data) => {
  console.log('📢 System update received:', data);
});

socket.on('metrics-update', (data) => {
  console.log('📊 Metrics update:', data);
});

// Test connection for 10 seconds then disconnect
setTimeout(() => {
  console.log('🔚 Test complete, disconnecting...');
  socket.disconnect();
  process.exit(0);
}, 10000);