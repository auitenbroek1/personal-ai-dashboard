import { useState, useEffect } from 'react';
import './App.css';

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkTraffic: number;
}

interface DashboardData {
  systemMetrics: SystemMetrics;
  agentStats: {
    total: number;
    active: number;
    idle: number;
    offline: number;
  };
  taskStats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
}

function SimpleApp() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  useEffect(() => {
    // Test backend connection
    fetch('http://localhost:3001/health')
      .then(response => response.json())
      .then(data => {
        console.log('Backend health:', data);
        setConnectionStatus('Backend Connected ✅');
      })
      .catch(error => {
        console.error('Backend connection failed:', error);
        setConnectionStatus('Backend Connection Failed ❌');
      });

    // Fetch dashboard data
    fetch('http://localhost:3001/api/dashboard/overview')
      .then(response => response.json())
      .then(data => {
        console.log('Dashboard data:', data);
        setDashboardData(data);
      })
      .catch(error => {
        console.error('Dashboard data fetch failed:', error);
      });
  }, []);

  return (
    <div className="App" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🤖 Personal AI Assistant Dashboard</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <strong>Connection Status:</strong> {connectionStatus}
      </div>

      {dashboardData ? (
        <div>
          <h2>📊 System Metrics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
            <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
              <h3>💻 CPU Usage</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                {dashboardData.systemMetrics.cpuUsage.toFixed(1)}%
              </div>
            </div>
            
            <div style={{ padding: '15px', backgroundColor: '#f3e5f5', borderRadius: '8px' }}>
              <h3>🧠 Memory Usage</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7b1fa2' }}>
                {dashboardData.systemMetrics.memoryUsage.toFixed(1)}%
              </div>
            </div>
            
            <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
              <h3>💾 Disk Usage</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c' }}>
                {dashboardData.systemMetrics.diskUsage.toFixed(1)}%
              </div>
            </div>
            
            <div style={{ padding: '15px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
              <h3>🌐 Network Traffic</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
                {dashboardData.systemMetrics.networkTraffic.toFixed(1)} MB/s
              </div>
            </div>
          </div>

          <h2>🤖 Agent Status</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '30px' }}>
            <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#388e3c' }}>
                {dashboardData.agentStats.total}
              </div>
              <div>Total Agents</div>
            </div>
            
            <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1976d2' }}>
                {dashboardData.agentStats.active}
              </div>
              <div>Active</div>
            </div>
            
            <div style={{ padding: '15px', backgroundColor: '#fff3e0', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f57c00' }}>
                {dashboardData.agentStats.idle}
              </div>
              <div>Idle</div>
            </div>
            
            <div style={{ padding: '15px', backgroundColor: '#ffebee', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d32f2f' }}>
                {dashboardData.agentStats.offline}
              </div>
              <div>Offline</div>
            </div>
          </div>

          <h2>📋 Task Queue</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div style={{ padding: '15px', backgroundColor: '#f3e5f5', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7b1fa2' }}>
                {dashboardData.taskStats.total}
              </div>
              <div>Total Tasks</div>
            </div>
            
            <div style={{ padding: '15px', backgroundColor: '#fff3e0', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f57c00' }}>
                {dashboardData.taskStats.pending}
              </div>
              <div>Pending</div>
            </div>
            
            <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1976d2' }}>
                {dashboardData.taskStats.inProgress}
              </div>
              <div>In Progress</div>
            </div>
            
            <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#388e3c' }}>
                {dashboardData.taskStats.completed}
              </div>
              <div>Completed</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Loading dashboard data...</h2>
          <p>If this takes too long, check that the backend server is running on port 3001</p>
        </div>
      )}
      
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>🎯 Demo Features</h3>
        <ul style={{ textAlign: 'left' }}>
          <li>✅ Real-time system metrics</li>
          <li>✅ Agent status monitoring</li>
          <li>✅ Task queue management</li>
          <li>✅ Backend API integration</li>
          <li>✅ Professional dashboard UI</li>
        </ul>
        <p><strong>Perfect for client demonstrations!</strong></p>
      </div>
    </div>
  );
}

export default SimpleApp;