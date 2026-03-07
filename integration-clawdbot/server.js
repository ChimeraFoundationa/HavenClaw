// server.js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import clawdbotRoutes from './routes/clawdbot.js'
import { logger } from './middleware/logger.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  })
  next()
})

// Routes
app.use('/api/v1/clawdbot', clawdbotRoutes)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'haven-clawdbot-integration',
    version: '1.0.0'
  })
})

// API Info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Haven Framework - Clawdbot Integration API',
    version: '1.0.0',
    endpoints: {
      'POST /api/v1/clawdbot/register': 'Register agent from Clawdbot to ERC-8004 + Haven',
      'GET /api/v1/clawdbot/agent/:address': 'Get agent info by address',
      'POST /api/v1/clawdbot/analyze': 'Analyze agent with Clawdbot before registration',
      'GET /health': 'Health check'
    },
    documentation: 'https://github.com/haven-framework/integration-clawdbot'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  })
})

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  })
})

// Start server
app.listen(PORT, () => {
  logger.info(`Haven Clawdbot Integration API started`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    rpc_url: process.env.AVALANCHE_FUJI_RPC
  })
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📚 API docs: http://localhost:${PORT}/api`)
  console.log(`💚 Health check: http://localhost:${PORT}/health`)
})

export default app
