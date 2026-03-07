/**
 * Dashboard Command
 */

import chalk from 'chalk'
import { createServer } from 'http'

export async function dashboard(options: {
  port: string
  open?: boolean
}) {
  console.log(chalk.blue('🖥️ Starting HavenClaw Dashboard...'))
  
  const port = parseInt(options.port)
  const url = `http://localhost:${port}`
  
  console.log(chalk.gray(`  Port: ${port}`))
  console.log(chalk.gray(`  URL: ${url}`))
  
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>HavenClaw Dashboard</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0d1117; color: #c9d1d9; margin: 0; padding: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            h1 { color: #ff4d4d; }
            .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .stat { font-size: 2em; color: #00e5cc; }
            a { color: #58a6ff; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🏛️ HavenClaw Dashboard</h1>
            <p>Agent Coordination Framework</p>
            <div class="card">
              <h2>Quick Stats</h2>
              <p class="stat">0</p>
              <p>Registered Agents</p>
            </div>
            <div class="card">
              <h2>Quick Actions</h2>
              <ul>
                <li><a href="#">Register Agent</a></li>
                <li><a href="#">Create Task</a></li>
                <li><a href="#">Prediction Markets</a></li>
                <li><a href="#">Governance</a></li>
              </ul>
            </div>
            <div class="card">
              <h2>Documentation</h2>
              <p>Visit <a href="https://docs.havenclaw.ai" target="_blank">docs.havenclaw.ai</a></p>
            </div>
          </div>
        </body>
      </html>
    `)
  })
  
  server.listen(port, () => {
    console.log(chalk.green(`\n✓ Dashboard running at ${url}`))
    console.log(chalk.gray('Press Ctrl+C to stop\n'))
  })
  
  process.on('SIGINT', () => {
    server.close()
    console.log(chalk.gray('\nDashboard stopped.'))
    process.exit(0)
  })
}
