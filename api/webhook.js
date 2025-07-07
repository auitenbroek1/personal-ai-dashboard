// Vercel serverless function for Discord webhook
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const DiscordIntegration = require('../.claude/integrations/discord-webhook.js');
    const configPath = './.claude/automation/update-system.json';
    const projectRoot = process.cwd();
    
    const discord = new DiscordIntegration(configPath, projectRoot);
    
    const notification = req.body;
    const result = await discord.sendNotification(notification);
    
    res.status(200).json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      error: 'Failed to send webhook',
      message: error.message 
    });
  }
}