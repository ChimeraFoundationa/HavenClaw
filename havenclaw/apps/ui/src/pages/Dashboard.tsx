import { useState, useEffect } from 'react'
import { ExternalLink, Bot, Shield, Activity, CheckCircle, Wallet } from 'lucide-react'

export function Dashboard() {
  const [walletInfo, setWalletInfo] = useState(null)
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch wallet and agent data from server
    const fetchData = async () => {
      try {
        // Get wallet info
        const walletRes = await fetch('/api/wallet')
        const walletData = await walletRes.json()
        setWalletInfo(walletData)

        // Get agents
        const agentsRes = await fetch('/api/agents')
        const agentsData = await agentsRes.json()
        setAgents(agentsData.agents)
        
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Dashboard...</h2>
          <p className="text-gray-600">Connecting to blockchain</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto bg-red-50 border-2 border-red-200 rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-900 mb-4">Connection Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <p className="text-sm text-red-600">Make sure HAVENCLAW_PRIVATE_KEY is set</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Server Connection Banner */}
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-8">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900">
              ✅ Connected to Server-Side Wallet
            </h3>
            <p className="text-sm text-green-700">
              No MetaMask connection needed - Dashboard auto-connected
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Agents</h1>
        {walletInfo && (
          <p className="text-gray-600 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Wallet: <span className="font-mono text-indigo-600">{walletInfo.address}</span>
            <span className="text-gray-400">•</span>
            Balance: <span className="font-medium text-green-600">{parseFloat(walletInfo.balance).toFixed(4)} AVAX</span>
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<Bot className="w-6 h-6" />}
          title="Total Agents"
          value={agents.length.toString()}
          description="Agents registered on-chain"
          color="from-indigo-500 to-violet-500"
        />
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          title="Active Tasks"
          value="0"
          description="Current task completions"
          color="from-green-500 to-emerald-500"
        />
        <StatCard
          icon={<Shield className="w-6 h-6" />}
          title="Reputation"
          value="N/A"
          description="On-chain reputation score"
          color="from-amber-500 to-orange-500"
        />
      </div>

      {/* Agents List */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Registered Agents</h2>
          <a href="https://havenclaw.ai" target="_blank" rel="noopener noreferrer">
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
              + New Agent
            </button>
          </a>
        </div>

        {agents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🤖</div>
            <p className="text-lg mb-2">No agents found</p>
            <p className="text-sm mb-6">
              Register your first agent using HavenClaw CLI
            </p>
            <code className="text-xs bg-gray-900 text-green-400 px-4 py-2 rounded block max-w-md mx-auto">
              havenclaw agent register --name "My Agent" --capabilities trading,analysis
            </code>
          </div>
        ) : (
          <div className="space-y-4">
            {agents.map((agent, index) => (
              <AgentCard key={index} agent={agent} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Reference */}
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-3">📚 Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="https://docs.havenclaw.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-2">
                <ExternalLink className="w-3 h-3" /> Documentation
              </a>
            </li>
            <li>
              <a href="https://testnet.snowscan.xyz" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-2">
                <ExternalLink className="w-3 h-3" /> Snowscan Explorer
              </a>
            </li>
            <li>
              <a href="https://faucet.avax.network" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-2">
                <ExternalLink className="w-3 h-3" /> AVAX Faucet
              </a>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-3">🛠️ CLI Commands</h3>
          <ul className="space-y-2 text-xs font-mono text-gray-700">
            <li className="bg-gray-50 px-3 py-2 rounded">havenclaw agent register</li>
            <li className="bg-gray-50 px-3 py-2 rounded">havenclaw tba create</li>
            <li className="bg-gray-50 px-3 py-2 rounded">havenclaw agent info --address 0x...</li>
            <li className="bg-gray-50 px-3 py-2 rounded">havenclaw task create</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, title, value, description, color }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${color} flex items-center justify-center text-white`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  )
}

function AgentCard({ agent }) {
  return (
    <div className="border-2 border-indigo-100 rounded-xl p-6 hover:border-indigo-300 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center text-2xl">
            🤖
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{agent.name}</h3>
            <p className="text-sm text-gray-500 font-mono">{agent.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Active</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Capabilities</p>
          <div className="flex gap-2 flex-wrap">
            {agent.capabilities.map((cap, idx) => (
              <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                {cap}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-1">Registered</p>
          <p className="text-sm font-medium text-gray-900">
            {new Date(agent.registeredAt).toLocaleDateString()}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-1">Explorer</p>
          <a
            href={`https://testnet.snowscan.xyz/address/${agent.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-indigo-600 hover:underline flex items-center gap-1"
          >
            View on Snowscan
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
