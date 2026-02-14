import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateDigestNewsletter } from './generate';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Niches Hunter Digest',
    description: 'Weekly digest newsletter for free subscribers',
    subscribersTable: process.env.SUBSCRIBERS_TABLE || 'newsletter_subscribers_test',
    timestamp: new Date().toISOString()
  });
});

// Manual trigger endpoint
app.post('/generate', async (req, res) => {
  console.log('📰 Manual digest generation triggered');
  
  // Respond immediately
  res.json({ 
    success: true, 
    message: 'Digest generation started...' 
  });

  // Generate in background
  generateDigestNewsletter().catch(err => {
    console.error('❌ Digest generation failed:', err);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Niches Hunter Digest Service`);
  console.log(`═══════════════════════════════════════════`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`📋 Subscribers: ${process.env.SUBSCRIBERS_TABLE || 'newsletter_subscribers_test'}`);
  console.log(`⏰ CRON géré par Railway (Mon/Wed/Fri)`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`📍 Generate: POST http://localhost:${PORT}/generate`);
  console.log(`═══════════════════════════════════════════\n`);
});
