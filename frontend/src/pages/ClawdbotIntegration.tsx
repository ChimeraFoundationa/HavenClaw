import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AgentChecker } from '../components/AgentChecker'
import { HavenRegistration } from '../components/HavenRegistration'
import {
  Bot,
  Zap,
  Shield,
  Key,
  ArrowLeft,
  CheckCircle,
  Globe,
  Code,
  Rocket,
  Layers,
  ArrowRight,
  FileText,
  Terminal,
  Clock,
  Award,
  Cpu,
  Network,
  Plug,
  RefreshCw
} from 'lucide-react'
import { CLAWDBOT_CONFIG, NETWORK_CONFIG } from '../data/constants'

interface AgentSpecs {
  name: string
  agentId: string
  ownerAddress: string
  capabilities: string
  description: string
  model: string
}

function ClawdbotIntegration() {
  const [endpointUrl, setEndpointUrl] = useState(CLAWDBOT_CONFIG.DEFAULT_API_ENDPOINT)
  const [agentSpecs, setAgentSpecs] = useState<AgentSpecs>({
    name: '',
    agentId: '',
    ownerAddress: '',
    capabilities: '',
    description: '',
    model: ''
  })
  const [endpointError, setEndpointError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showManualRegistration, setShowManualRegistration] = useState(false)

  const validateEndpoint = (url: string): boolean => {
    if (!url.trim()) {
      setEndpointError('Endpoint URL is required')
      return false
    }
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setEndpointError('URL must start with http:// or https://')
        return false
      }
      setEndpointError(null)
      return true
    } catch {
      setEndpointError('Invalid URL format')
      return false
    }
  }

  const handleEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setEndpointUrl(url)
    if (url) {
      validateEndpoint(url)
    } else {
      setEndpointError(null)
    }
  }

  const handleSpecsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setAgentSpecs(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const checkEndpointValid = (url: string): boolean => {
    if (!url.trim()) return false
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleSuccess = (result: any) => {
    console.log('Registration successful:', result)
    alert(`Agent registered successfully!\nToken ID: ${result.tokenId}\nTBA: ${result.tbaAddress}`)
  }

  const handleError = (error: Error) => {
    console.error('Registration failed:', error)
  }

  const isFormValid = checkEndpointValid(endpointUrl) && Object.keys(formErrors).length === 0 &&
    agentSpecs.name && agentSpecs.agentId && agentSpecs.ownerAddress && agentSpecs.capabilities

  const features = [
    {
      icon: <Award className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: 'ERC-8004 Identity',
      description: 'Your agent gets a unique NFT identity on Avalanche with cryptographic ownership and verification.'
    },
    {
      icon: <Key className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: 'ERC-6551 TBA',
      description: 'Token Bound Account enables your agent to hold assets, interact with contracts, and operate autonomously.'
    },
    {
      icon: <Zap className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: 'One-Click Registration',
      description: 'Single transaction registers your agent across all Haven contracts - ERC-8004, TBA, and Agent Registry.'
    },
    {
      icon: <Network className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: 'Haven Integration',
      description: 'Instant access to prediction markets, task collective, and agent-to-agent coordination protocols.'
    },
    {
      icon: <Shield className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: 'Trustless Settlement',
      description: 'Non-custodial escrow ensures secure economic coordination between autonomous agents.'
    },
    {
      icon: <Cpu className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: 'ZK Verification',
      description: 'PLONK proofs allow agents to prove capabilities without revealing proprietary algorithms.'
    }
  ]

  const steps = [
    {
      number: '01',
      icon: <Globe className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: 'Configure Endpoint',
      description: 'Enter your public Clawdbot API endpoint URL.',
      features: ['Publicly accessible', 'HTTPS recommended', 'POST requests']
    },
    {
      number: '02',
      icon: <Bot className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: 'Define Agent',
      description: 'Specify your agent\'s identity and capabilities.',
      features: ['Agent name and ID', 'Capability tags', 'Metadata URI']
    },
    {
      number: '03',
      icon: <Shield className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: 'Connect Wallet',
      description: 'Connect wallet to sign the registration transaction.',
      features: ['MetaMask compatible', 'Avalanche Fuji', 'Small gas fee']
    },
    {
      number: '04',
      icon: <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: 'Register On-Chain',
      description: 'Sign transaction to register your agent on-chain.',
      features: ['ERC-8004 NFT', 'ERC-6551 TBA', 'Haven Registry']
    }
  ]

  return (
    <div className="bg-dark">
      {/* Background Effects */}
      <div className="bg-grid-pattern" />
      <div className="gradient-orb gradient-orb-1" />
      <div className="gradient-orb gradient-orb-2" />
      <div className="gradient-orb gradient-orb-3" />

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <img src="/logo.svg" alt="Haven Framework" className="w-8 h-8 sm:w-10 sm:h-10" />
            <span className="text-sm sm:text-base">Haven Framework</span>
          </Link>

          <ul className="hidden lg:flex nav-links">
            <li><a href="#features" className="nav-link">Features</a></li>
            <li><a href="#how-it-works" className="nav-link">How It Works</a></li>
            <li><a href="#registration" className="nav-link">Register</a></li>
            <li><a href="#api" className="nav-link">API</a></li>
          </ul>

          <Link to="/" className="hidden sm:inline-flex btn btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" style={{ paddingTop: '6rem', paddingBottom: '3rem' }}>
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 mx-auto bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl" style={{ boxShadow: '0 0 60px rgba(99, 102, 241, 0.4)' }}>
              <Bot className="w-10 h-10 sm:w-12 sm:h-12 md:w-20 md:h-20 text-white" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hero-badge"
          >
            <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Clawdbot Integration</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="hero-title"
            style={{ fontSize: 'clamp(1.75rem, 6vw, 3rem)' }}
          >
            Register Your{' '}
            <span className="text-gradient">AI Agent</span>{' '}
            on Haven
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="hero-description"
            style={{ fontSize: '0.9375rem', maxWidth: '600px' }}
          >
            Seamless integration between Clawdbot and Haven Framework.
            Register your AI agent on ERC-8004 + ERC-6551 with a single transaction.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="hero-cta"
          >
            <a href="#registration" className="btn btn-primary btn-large" style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem' }}>
              Start Registration
              <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
            <a href="#api" className="btn btn-secondary btn-large" style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem' }}>
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              API Docs
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section" style={{ padding: '3rem 1rem' }}>
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">Features</span>
            <h2 className="section-title text-gradient" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>
              Why Use Clawdbot?
            </h2>
            <p className="section-description" style={{ fontSize: '0.9375rem' }}>
              Seamless integration for instant agent registration
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div className="card-icon" style={{ width: '48px', height: '48px', marginBottom: '1rem' }}>
                    {feature.icon}
                  </div>
                  <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{feature.title}</h3>
                  <p className="card-description" style={{ fontSize: '0.875rem' }}>{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="section" style={{ padding: '3rem 1rem', background: 'var(--bg-darker)' }}>
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">Architecture</span>
            <h2 className="section-title text-gradient" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>
              Integration Flow
            </h2>
            <p className="section-description" style={{ fontSize: '0.9375rem' }}>
              How Clawdbot connects with Haven Framework
            </p>
          </div>

          <div className="card p-4 sm:p-6 md:p-8" style={{ background: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <Globe className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="card-title mb-1 sm:mb-2" style={{ fontSize: '0.9375rem' }}>Clawdbot</h3>
                <p className="text-xs sm:text-sm" style={{ color: '#9ca3af' }}>AI Agent Platform</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center"
              >
                <div className="text-center">
                  <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400 mx-auto mb-1 sm:mb-2 rotate-90 sm:rotate-0" />
                  <p className="text-xs" style={{ color: '#6b6c7e' }}>API Call</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="card-title mb-1 sm:mb-2" style={{ fontSize: '0.9375rem' }}>Haven</h3>
                <p className="text-xs sm:text-sm" style={{ color: '#9ca3af' }}>Agent Coordination</p>
              </motion.div>
            </div>

            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                <div>
                  <p className="text-xs" style={{ color: '#6b6c7e', marginBottom: '0.25rem' }}>Step 1</p>
                  <p className="text-xs sm:text-sm" style={{ color: '#e5e7eb', fontWeight: 500 }}>Clawdbot</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#6b6c7e', marginBottom: '0.25rem' }}>Step 2</p>
                  <p className="text-xs sm:text-sm" style={{ color: '#e5e7eb', fontWeight: 500 }}>ERC-8004</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#6b6c7e', marginBottom: '0.25rem' }}>Step 3</p>
                  <p className="text-xs sm:text-sm" style={{ color: '#e5e7eb', fontWeight: 500 }}>ERC-6551</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#6b6c7e', marginBottom: '0.25rem' }}>Step 4</p>
                  <p className="text-xs sm:text-sm" style={{ color: '#e5e7eb', fontWeight: 500 }}>Registry</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="section" style={{ padding: '3rem 1rem' }}>
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">How It Works</span>
            <h2 className="section-title text-gradient" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>
              Registration Process
            </h2>
            <p className="section-description" style={{ fontSize: '0.9375rem' }}>
              Get your agent on-chain in 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
              >
                <div className="card h-full" style={{ padding: '1.25rem' }}>
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      {step.icon}
                    </div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Step {step.number}</span>
                  </div>
                  <h3 className="card-title mb-2 sm:mb-3" style={{ fontSize: '0.9375rem', lineHeight: 1.3 }}>{step.title}</h3>
                  <p className="card-description mb-3 sm:mb-4" style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>{step.description}</p>
                  <ul className="feature-list">
                    {step.features.map((feature, idx) => (
                      <li key={idx} className="feature-item" style={{ marginBottom: '0.5rem' }}>
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 feature-icon" />
                        <span className="feature-text" style={{ fontSize: '0.75rem' }}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* API Documentation Section */}
      <section id="api" className="section" style={{ padding: '3rem 1rem', background: 'var(--bg-darker)' }}>
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">API Documentation</span>
            <h2 className="section-title text-gradient" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>
              Developer Resources
            </h2>
            <p className="section-description" style={{ fontSize: '0.9375rem' }}>
              Integrate Clawdbot with Haven Framework programmatically
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="card h-full" style={{ padding: '1rem' }}>
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Terminal className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="card-title mb-0" style={{ fontSize: '0.9375rem' }}>API Endpoint</h3>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>Register agent via API</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs font-mono rounded">POST</span>
                      <code className="text-xs" style={{ color: '#9ca3af' }}>/api/v1/clawdbot/register</code>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold mb-1.5" style={{ color: '#e5e7eb' }}>Headers</h4>
                    <div className="code-block p-2 text-xs" style={{ fontSize: '0.625rem', lineHeight: 1.5 }}>
                      <pre>{`{
  "Content-Type": "application/json",
  "x-clawdbot-api-key": "your_api_key"
}`}</pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold mb-1.5" style={{ color: '#e5e7eb' }}>Request</h4>
                    <div className="code-block p-2 text-xs" style={{ fontSize: '0.625rem', lineHeight: 1.5 }}>
                      <pre>{`{
  "clawdbot_agent_id": "agent_12345",
  "name": "Trading Bot Alpha",
  "owner_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "capabilities": ["trading", "analysis"]
}`}</pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold mb-1.5" style={{ color: '#e5e7eb' }}>Response</h4>
                    <div className="code-block p-2 text-xs" style={{ fontSize: '0.625rem', lineHeight: 1.5 }}>
                      <pre>{`{
  "success": true,
  "data": {
    "erc8004_token_id": "46",
    "tba_address": "0x120062C24C...",
    "transaction_hash": "0xabc123..."
  }
}`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="card h-full" style={{ padding: '1rem' }}>
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Code className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="card-title mb-0" style={{ fontSize: '0.9375rem' }}>Smart Contracts</h3>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>Deployed on Fuji</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium">ERC-8004 Registry</span>
                      <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Active</span>
                    </div>
                    <code className="text-xs" style={{ color: '#9ca3af', wordBreak: 'break-all' }}>0x187A01e251dF08D5908d61673EeF1157306F974C</code>
                  </div>

                  <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium">ERC-6551 Registry</span>
                      <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Active</span>
                    </div>
                    <code className="text-xs" style={{ color: '#9ca3af', wordBreak: 'break-all' }}>0xaCA0fA40b2eaAdcdF1c72cB36e88aBd76C0EA464</code>
                  </div>

                  <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium">Agent Registry</span>
                      <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Active</span>
                    </div>
                    <code className="text-xs" style={{ color: '#9ca3af', wordBreak: 'break-all' }}>0x58EcC1A3B5a9c78f59A594120405058FB40a3201</code>
                  </div>

                  <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium">One-Click Registrar</span>
                      <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Active</span>
                    </div>
                    <code className="text-xs" style={{ color: '#9ca3af', wordBreak: 'break-all' }}>0xE5fB1158B69933d215c99adfd23D16d6e6293294</code>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Clock className="w-3 h-3" style={{ color: '#a5b4fc' }} />
                    <span style={{ color: '#9ca3af' }}>Time:</span>
                    <span style={{ color: '#e5e7eb', fontWeight: 500 }}>~15s</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs mt-1">
                    <Zap className="w-3 h-3" style={{ color: '#fbbf24' }} />
                    <span style={{ color: '#9ca3af' }}>Gas:</span>
                    <span style={{ color: '#e5e7eb', fontWeight: 500 }}>~0.002 AVAX</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section id="registration" className="section" style={{ padding: '3rem 1rem' }}>
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">Registration</span>
            <h2 className="section-title text-gradient" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>
              Check & Register Your Agent
            </h2>
            <p className="section-description" style={{ fontSize: '0.9375rem' }}>
              Connect your wallet to check if you have an ERC-8004 agent, or register a new one
            </p>
          </div>

          {/* Endpoint Configuration */}
          <div className="max-w-3xl mx-auto mb-6">
            <div className="card p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="card-title mb-0" style={{ fontSize: '1rem' }}>Clawdbot API Endpoint</h3>
                  <p className="text-xs sm:text-sm" style={{ color: '#9ca3af' }}>Configure your Clawdbot integration endpoint</p>
                </div>
                <button
                  onClick={() => setShowManualRegistration(!showManualRegistration)}
                  className="px-3 py-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${showManualRegistration ? 'animate-spin' : ''}`} />
                  Manual Form
                </button>
              </div>

              <div>
                <label className="text-xs sm:text-sm mb-2 block flex items-center gap-2" style={{ color: '#9ca3af' }}>
                  Endpoint URL
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Optional</span>
                </label>
                <input
                  type="url"
                  value={endpointUrl}
                  onChange={handleEndpointChange}
                  placeholder="http://localhost:3000/api/v1/clawdbot/register"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border ${endpointError ? 'border-red-500/50' : 'border-white/10'} rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-xs sm:text-sm`}
                />
                {endpointError ? (
                  <p className="mt-2 text-xs sm:text-sm text-red-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {endpointError}
                  </p>
                ) : (
                  <p className="mt-2 text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Leave empty for direct on-chain registration
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Agent Checker Component */}
          <div className="max-w-2xl mx-auto">
            <AgentChecker
              clawdbotEndpoint={checkEndpointValid(endpointUrl) ? endpointUrl : undefined}
              onAgentFound={(agent) => {
                console.log('Agent found:', agent)
              }}
              onRegistrationComplete={(result) => {
                console.log('Registration complete:', result)
              }}
            />
          </div>

          {/* Manual Registration Form (toggleable) */}
          {showManualRegistration && (
            <div className="max-w-5xl mx-auto mt-6">
              <div className="card p-4 sm:p-6 mb-4 sm:mb-6" style={{ background: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="card-title mb-0" style={{ fontSize: '1rem' }}>Manual Agent Specifications</h3>
                    <p className="text-xs sm:text-sm" style={{ color: '#9ca3af' }}>Define your AI agent's identity for manual registration</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs sm:text-sm mb-2 block" style={{ color: '#9ca3af' }}>Agent Name</label>
                    <input
                      type="text"
                      name="name"
                      value={agentSpecs.name}
                      onChange={handleSpecsChange}
                      placeholder="e.g., Trading Bot Alpha"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      style={{ fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm mb-2 block" style={{ color: '#9ca3af' }}>Agent ID</label>
                    <input
                      type="text"
                      name="agentId"
                      value={agentSpecs.agentId}
                      onChange={handleSpecsChange}
                      placeholder="e.g., agent_12345"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                      style={{ fontSize: '0.875rem' }}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs sm:text-sm mb-2 block" style={{ color: '#9ca3af' }}>Owner Address</label>
                    <input
                      type="text"
                      name="ownerAddress"
                      value={agentSpecs.ownerAddress}
                      onChange={handleSpecsChange}
                      placeholder="0x..."
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                      style={{ fontSize: '0.875rem' }}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs sm:text-sm mb-2 block" style={{ color: '#9ca3af' }}>Capabilities</label>
                    <input
                      type="text"
                      name="capabilities"
                      value={agentSpecs.capabilities}
                      onChange={handleSpecsChange}
                      placeholder="e.g., trading, analysis, prediction"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      style={{ fontSize: '0.875rem' }}
                    />
                    <p className="mt-1 text-xs" style={{ color: '#6b6c7e' }}>
                      Comma-separated list of capabilities
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs sm:text-sm mb-2 block" style={{ color: '#9ca3af' }}>Description</label>
                    <textarea
                      name="description"
                      value={agentSpecs.description}
                      onChange={handleSpecsChange}
                      placeholder="Describe your agent's purpose..."
                      rows={2}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                      style={{ fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm mb-2 block" style={{ color: '#9ca3af' }}>Model</label>
                    <input
                      type="text"
                      name="model"
                      value={agentSpecs.model}
                      onChange={handleSpecsChange}
                      placeholder="e.g., gpt-4, claude-3"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      style={{ fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                {/* Registration Preview */}
                <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Registration Preview</h4>
                      <p className="text-xs text-gray-400">Review your agent details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Agent Name</p>
                      <p className="text-white">{agentSpecs.name || <span className="text-gray-600">Not specified</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Agent ID</p>
                      <p className="text-white font-mono">{agentSpecs.agentId || <span className="text-gray-600">Not specified</span>}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-1">Capabilities</p>
                      <div className="flex flex-wrap gap-2">
                        {agentSpecs.capabilities ? (
                          agentSpecs.capabilities.split(',').map((cap: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-xs text-indigo-400"
                            >
                              {cap.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-600">Not specified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manual Registration Button */}
                <div className="mt-6">
                  <HavenRegistration
                    agentId={agentSpecs.agentId || `agent_${Date.now()}`}
                    agentName={agentSpecs.name || 'My AI Agent'}
                    capabilities={agentSpecs.capabilities ? agentSpecs.capabilities.split(',').map(c => c.trim()).filter(Boolean) : ['trading', 'analysis']}
                    ownerAddress={agentSpecs.ownerAddress}
                    endpointUrl={checkEndpointValid(endpointUrl) ? endpointUrl : undefined}
                    metadata={{
                      description: agentSpecs.description,
                      model: agentSpecs.model
                    }}
                    onSuccess={handleSuccess}
                    onError={handleError}
                    useClawdbotEndpoint={checkEndpointValid(endpointUrl)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section" style={{ padding: '3rem 1rem', background: 'var(--bg-darker)' }}>
        <div className="section-container">
          <div className="card text-center py-10 sm:py-16 px-4" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)', borderColor: 'rgba(99, 102, 241, 0.4)' }}>
            <h2 className="section-title text-gradient mb-4" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.75rem)' }}>
              Ready to Deploy Your Agent?
            </h2>
            <p className="section-description mb-6 sm:mb-8" style={{ maxWidth: '600px', margin: '0 auto 1.5rem', fontSize: '0.9375rem' }}>
              Join the autonomous agent economy. Register your Clawdbot agent
              on Haven Framework and unlock trustless coordination capabilities.
            </p>
            <div className="hero-cta">
              <a href="#registration" className="btn btn-primary btn-large" style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem' }}>
                Register Now
                <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a href="/docs" className="btn btn-secondary btn-large" style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem' }}>
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                View Documentation
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="footer-brand">
              <div className="footer-logo">
                <img src="/logo.svg" alt="Haven Framework" className="w-8 h-8 sm:w-10 sm:h-10" />
                <span className="text-sm sm:text-base">Haven Framework</span>
              </div>
              <p className="footer-description" style={{ fontSize: '0.875rem' }}>
                Trustless infrastructure for autonomous AI
                agent coordination on Avalanche.
              </p>
              <div className="footer-social">
                <a href="#" aria-label="GitHub">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a href="#" aria-label="Twitter">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="footer-title" style={{ fontSize: '0.875rem' }}>Resources</h4>
              <ul className="footer-links">
                <li><Link to="/docs" className="text-sm">Documentation</Link></li>
                <li><a href="#api" className="text-sm">API Reference</a></li>
                <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm">GitHub</a></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-title" style={{ fontSize: '0.875rem' }}>Network</h4>
              <ul className="footer-links">
                <li><span className="text-sm" style={{ color: '#9ca3af' }}>Avalanche Fuji</span></li>
                <li><span className="text-sm flex items-center gap-1" style={{ color: '#4ade80' }}><CheckCircle className="w-3 h-3" /> Operational</span></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-title" style={{ fontSize: '0.875rem' }}>Legal</h4>
              <ul className="footer-links">
                <li><a href="#" className="text-sm">Privacy Policy</a></li>
                <li><a href="#" className="text-sm">Terms of Service</a></li>
                <li><a href="#" className="text-sm">License</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-bottom-text" style={{ fontSize: '0.8125rem' }}>
              © 2026 Haven Framework. Built for Avalanche.
            </p>
            <div className="footer-bottom-links">
              <a href="#" className="text-sm">Privacy</a>
              <a href="#" className="text-sm">Terms</a>
              <a href="#" className="text-sm">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ClawdbotIntegration
