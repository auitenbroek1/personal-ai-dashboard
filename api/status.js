// Vercel serverless function for claude-flow status
const path = require('path');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Load the update master
    const UpdateMaster = require('../.claude/automation/update-master.js');
    const projectRoot = process.cwd();
    const updateMaster = new UpdateMaster(projectRoot);
    
    // Get system status
    const status = await updateMaster.getSystemStatus();
    
    // Add deployment info
    const deploymentStatus = {
      ...status,
      deployment: {
        platform: 'vercel',
        environment: process.env.VERCEL_ENV || 'development',
        region: process.env.VERCEL_REGION || 'unknown',
        deployed_at: new Date().toISOString(),
        version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'unknown'
      }
    };

    res.status(200).json(deploymentStatus);
  } catch (error) {
    console.error('Status API error:', error);
    res.status(500).json({ 
      error: 'Failed to get system status',
      message: error.message 
    });
  }
}