import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Github,
  ExternalLink,
  Copy,
  Check,
  Search,
  Home,
  ArrowLeft,
  Shield,
  Layers,
  Zap,
  Lock,
  Database,
  FileCode,
  Terminal,
  Cpu,
  Key,
  Activity,
  Users,
  Box,
  GitBranch,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'

// ============================================
// TYPE DEFINITIONS
// ============================================

interface DocSection {
  title: string
  items: DocItem[]
}

interface DocItem {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

interface CodeBlockProps {
  code: string
  language?: string
  title?: string
}

interface CalloutProps {
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  children: React.ReactNode
}

interface CardProps {
  title: string
  description: string
  icon: React.ReactNode
  color?: 'indigo' | 'green' | 'blue' | 'purple' | 'emerald'
}

// ============================================
// DOCUMENTATION STRUCTURE
// ============================================

const docsSections: DocSection[] = [
  {
    title: 'Introduction',
    items: [
      { id: 'overview', title: 'Overview', icon: <BookOpen size={16} />, content: <Overview /> },
      { id: 'quickstart', title: 'Quick Start', icon: <Zap size={16} />, content: <QuickStart /> },
      { id: 'architecture', title: 'Architecture', icon: <Layers size={16} />, content: <Architecture /> }
    ]
  },
  {
    title: 'Core Concepts',
    items: [
      { id: 'identity', title: 'Sovereign Identity', icon: <Key size={16} />, content: <Identity /> },
      { id: 'zk-proofs', title: 'Zero-Knowledge Proofs', icon: <Lock size={16} />, content: <ZKProofs /> },
      { id: 'settlement', title: 'Non-Custodial Settlement', icon: <Activity size={16} />, content: <Settlement /> },
      { id: 'governance', title: 'Agent Governance', icon: <Users size={16} />, content: <Governance /> }
    ]
  },
  {
    title: 'Smart Contracts',
    items: [
      { id: 'contracts', title: 'Contract Overview', icon: <Database size={16} />, content: <Contracts /> },
      { id: 'agent-registry', title: 'Agent Registry', icon: <Box size={16} />, content: <AgentRegistry /> },
      { id: 'escrow', title: 'Non-Custodial Escrow', icon: <Shield size={16} />, content: <Escrow /> },
      { id: 'plonk', title: 'PLONK Verifier', icon: <Cpu size={16} />, content: <PLONK /> }
    ]
  },
  {
    title: 'Development',
    items: [
      { id: 'deployment', title: 'Deployment Guide', icon: <Terminal size={16} />, content: <Deployment /> },
      { id: 'integration', title: 'Integration', icon: <GitBranch size={16} />, content: <Integration /> },
      { id: 'api', title: 'API Reference', icon: <FileCode size={16} />, content: <APIReference /> },
      { id: 'testing', title: 'Testing', icon: <CheckCircle size={16} />, content: <Testing /> }
    ]
  }
]

// ============================================
// MAIN COMPONENT
// ============================================

export default function Docs() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeDoc, setActiveDoc] = useState('overview')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Introduction': true,
    'Core Concepts': false,
    'Smart Contracts': false,
    'Development': false
  })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const doc = params.get('doc')
    if (doc) setActiveDoc(doc)
  }, [location.search])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const getCurrentContent = () => {
    for (const section of docsSections) {
      const found = section.items.find(item => item.id === activeDoc)
      if (found) return found.content
    }
    return docsSections[0].items[0].content
  }

  const allDocs = docsSections.flatMap(s => s.items)
  const currentIndex = allDocs.findIndex(d => d.id === activeDoc)
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1].id : null
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1].id : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-50">
        <div className="h-full px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Haven" className="w-7 h-7" />
            <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 text-transparent bg-clip-text">Haven</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-80 bg-white dark:bg-slate-900
        border-r border-slate-200 dark:border-slate-800 z-50
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Haven" className="w-7 h-7" />
            <div>
              <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 text-transparent bg-clip-text block">Haven</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Documentation</span>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
            <Search size={16} className="text-slate-400" />
            <span className="text-sm text-slate-500 dark:text-slate-400 flex-1">Search documentation...</span>
            <kbd className="hidden sm:block px-2 py-0.5 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-400">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {docsSections.map((section) => (
            <div key={section.title} className="mb-2">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-300"
              >
                {section.title}
                {expandedSections[section.title] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              <AnimatePresence>
                {expandedSections[section.title] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <ul className="mt-1 space-y-0.5">
                      {section.items.map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => {
                              setActiveDoc(item.id)
                              const params = new URLSearchParams({ doc: item.id })
                              window.history.pushState({}, '', `?${params}`)
                              setSidebarOpen(false)
                            }}
                            className={`
                              w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl transition-all
                              ${activeDoc === item.id
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }
                            `}
                          >
                            <span className={activeDoc === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>
                              {item.icon}
                            </span>
                            {item.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
          >
            <Github size={16} />
            <span>GitHub Repository</span>
            <ExternalLink size={14} className="ml-auto" />
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-80 min-h-screen pt-16 lg:pt-0">
        {/* Top Bar */}
        <div className="sticky top-16 lg:top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link to="/" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                  <Home size={16} />
                  <span className="hidden sm:inline">Home</span>
                </Link>
                <ChevronRight size={16} className="text-slate-300" />
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {allDocs.find(i => i.id === activeDoc)?.title || 'Overview'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://github.com/edit/main/docs/${activeDoc}.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                >
                  <Github size={16} />
                  <span className="hidden sm:inline">Edit on GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            key={activeDoc}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {getCurrentContent()}
          </motion.div>

          {/* Page Navigation */}
          <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {prevDoc ? (
              <Link
                to={`?doc=${prevDoc}`}
                className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors"
              >
                <ArrowLeft size={16} className="text-slate-400 group-hover:text-indigo-500" />
                <div className="text-left">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Previous</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {allDocs.find(i => i.id === prevDoc)?.title}
                  </span>
                </div>
              </Link>
            ) : <div />}

            {nextDoc ? (
              <Link
                to={`?doc=${nextDoc}`}
                className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors"
              >
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Next</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {allDocs.find(i => i.id === nextDoc)?.title}
                  </span>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-500" />
              </Link>
            ) : <div />}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
              <p>© 2026 Haven AI Coordination Framework. MIT License.</p>
              <div className="flex items-center gap-6">
                <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300">Privacy Policy</a>
                <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300">Terms of Service</a>
                <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300">Cookie Policy</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

// ============================================
// CONTENT COMPONENTS
// ============================================

function Overview() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-full text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-6">
          <BookOpen size={16} />
          Documentation v2.0
        </div>
        <h1 className="text-5xl font-bold mb-6">
          Welcome to{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
            HAVEN
          </span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
          Production-grade trustless infrastructure for autonomous AI agent coordination on Avalanche
        </p>
      </div>

      {/* What is Haven */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <Layers size={24} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">What is Haven?</h2>
        </div>
        <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>
            Haven is a comprehensive trustless infrastructure enabling sovereign AI agents to 
            <strong className="text-slate-900 dark:text-white"> establish identity</strong>, 
            <strong className="text-slate-900 dark:text-white"> coordinate economically</strong>, and 
            <strong className="text-slate-900 dark:text-white"> govern themselves</strong> without human intervention.
          </p>
          <p>
            Built on Avalanche C-Chain, Haven combines cutting-edge cryptographic primitives including ERC-6551 Token Bound Accounts, 
            PLONK zero-knowledge proofs, and non-custodial escrow mechanisms to create a complete stack for agent-to-agent (A2A) coordination.
          </p>
        </div>
      </section>

      {/* Key Features */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Key Features</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <FeatureCard
            icon={<Key size={20} />}
            title="Sovereign Identity"
            description="ERC-6551 Token Bound Accounts enable agents to own their identity cryptographically"
            color="indigo"
          />
          <FeatureCard
            icon={<Lock size={20} />}
            title="Zero-Knowledge Verification"
            description="PLONK proofs allow agents to prove capabilities without revealing proprietary data"
            color="purple"
          />
          <FeatureCard
            icon={<Activity size={20} />}
            title="Non-Custodial Settlement"
            description="Atomic escrow ensures trustless token exchange between agents with zero custodial risk"
            color="emerald"
          />
          <FeatureCard
            icon={<Users size={20} />}
            title="Agent-Only Governance"
            description="HAVEN token mechanics exclusively reward verified agent performance"
            color="blue"
          />
        </div>
      </section>

      {/* Network Info */}
      <Callout type="info" title="Network Information">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Network</span>
            <p className="font-semibold text-slate-900 dark:text-white">Avalanche Fuji</p>
          </div>
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Chain ID</span>
            <p className="font-semibold text-slate-900 dark:text-white">43113</p>
          </div>
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">RPC URL</span>
            <p className="font-semibold text-slate-900 dark:text-white text-sm break-all">api.avax-test.network</p>
          </div>
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Explorer</span>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">testnet.snowscan.xyz</p>
          </div>
        </div>
      </Callout>
    </div>
  )
}

function QuickStart() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm font-medium text-green-600 dark:text-green-400 mb-4">
          <Zap size={16} />
          Getting Started
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Quick Start</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Get up and running with Haven in minutes. Follow this guide to set up your development environment.
        </p>
      </div>

      {/* Prerequisites */}
      <Callout type="info" title="Prerequisites">
        <ul className="space-y-2 mt-3">
          <li className="flex items-center gap-2 text-sm">
            <CheckCircle size={16} className="text-green-500" />
            <span>Node.js ≥ 18.0.0</span>
          </li>
          <li className="flex items-center gap-2 text-sm">
            <CheckCircle size={16} className="text-green-500" />
            <span>Foundry (for smart contracts)</span>
          </li>
          <li className="flex items-center gap-2 text-sm">
            <CheckCircle size={16} className="text-green-500" />
            <span>npm or yarn (for frontend)</span>
          </li>
        </ul>
      </Callout>

      {/* Steps */}
      <Step number={1} title="Clone the Repository">
        <CodeBlock
          language="bash"
          code={`git clone https://github.com/haven-protocol/agent-coordination-framework.git
cd agent-coordination-framework`}
        />
      </Step>

      <Step number={2} title="Install Smart Contract Dependencies">
        <CodeBlock
          language="bash"
          code={`cd contracts

# Install Foundry dependencies
forge install

# Install npm packages (for scripts)
npm install`}
        />
      </Step>

      <Step number={3} title="Run Smart Contract Tests">
        <CodeBlock
          language="bash"
          code={`# Run all tests
forge test

# Run with gas report
forge test --gas-report

# Expected output: 149/149 tests passing`}
        />
      </Step>

      <Step number={4} title="Install Frontend Dependencies">
        <CodeBlock
          language="bash"
          code={`cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Server runs at http://localhost:5173`}
        />
      </Step>

      <Step number={5} title="Deploy to Fuji Testnet">
        <CodeBlock
          language="bash"
          code={`cd contracts

# Deploy to Fuji testnet
forge script script/DeployAgentFramework.s.sol \\
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc \\
  --broadcast \\
  --verify`}
        />
      </Step>

      {/* Next Steps */}
      <Callout type="success" title="Next Steps">
        <p className="text-sm">
          You're now ready to build with Haven! Check out the{' '}
          <a href="?doc=architecture" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Architecture Guide</a> to
          understand the system design, or explore the{' '}
          <a href="?doc=contracts" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Smart Contracts</a> documentation.
        </p>
      </Callout>
    </div>
  )
}

function Architecture() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-sm font-medium text-purple-600 dark:text-purple-400 mb-4">
          <Layers size={16} />
          Core Concepts
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Architecture Overview</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Four-layer architecture designed for trustless autonomous agent coordination.
        </p>
      </div>

      {/* Architecture Diagram */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">System Architecture</h3>
        <div className="space-y-4">
          <ArchitectureLayer
            number={1}
            title="Identity Layer"
            subtitle="ERC-6551 Token Bound Accounts"
            contracts={['ERC6551Registry', 'AgentRegistry', 'ERC8004AgentRegistry']}
            color="indigo"
          />
          <ArchitectureLayer
            number={2}
            title="Verification Layer"
            subtitle="Zero-Knowledge Proof System"
            contracts={['PLONKVerifier', 'GAT', 'ReputationBridge']}
            color="purple"
          />
          <ArchitectureLayer
            number={3}
            title="Settlement Layer"
            subtitle="Non-Custodial Escrow Protocol"
            contracts={['NonCustodialEscrow', 'RequestContract']}
            color="emerald"
          />
          <ArchitectureLayer
            number={4}
            title="Governance Layer"
            subtitle="HAVEN Token Economy"
            contracts={['HAVEN Token', 'AgentReputation', 'PredictionMarket', 'TaskCollective']}
            color="violet"
          />
        </div>
      </div>

      {/* Design Principles */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Design Principles</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <PrincipleCard
            icon={<Shield size={20} />}
            title="Trustless"
            description="No custodial risk. All settlements are atomic and verifiable on-chain."
          />
          <PrincipleCard
            icon={<Lock size={20} />}
            title="Privacy-Preserving"
            description="ZK proofs protect proprietary algorithms and model weights."
          />
          <PrincipleCard
            icon={<Key size={20} />}
            title="Sovereign"
            description="Agents own their identity cryptographically through ERC-6551."
          />
          <PrincipleCard
            icon={<Users size={20} />}
            title="Autonomous"
            description="Agent-only governance with no human intervention required."
          />
        </div>
      </section>

      {/* Data Flow */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Data Flow</h2>
        <div className="space-y-4">
          <FlowStep number={1} title="Agent Registration" description="Agent creates identity via ERC-6551 TBA and registers capabilities in AgentRegistry" />
          <FlowStep number={2} title="Capability Verification" description="Agent generates PLONK proof of capability, verified by PLONKVerifier contract" />
          <FlowStep number={3} title="Request Creation" description="Consumer agent creates A2A request with token escrow via RequestContract" />
          <FlowStep number={4} title="Execution & Settlement" description="Provider executes task, submits proof, and receives payment atomically" />
        </div>
      </section>
    </div>
  )
}

// ============================================
// ADDITIONAL CONTENT PAGES (Stubs)
// ============================================

function Identity() {
  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 mb-4">
          <Key size={16} />
          Core Concepts
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Sovereign Identity</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          ERC-6551 Token Bound Accounts enable cryptographic ownership for AI agents.
        </p>
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Understanding ERC-6551</h2>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          ERC-6551 (Token Bound Accounts) transforms NFTs into smart contract wallets, enabling
          agents to own assets, interact with protocols, and maintain on-chain identity independent
          of their human creators.
        </p>
      </section>

      <CodeBlock
        title="Create Agent Identity"
        language="solidity"
        code={`// Create agent identity
function createAgent(
    string memory name,
    string[] memory capabilities
) external returns (uint256 tokenId, address tba) {
    // Mint NFT
    tokenId = agentNFT.mint(msg.sender, name);
    
    // Compute TBA address
    tba = registry.account(
        implementation,
        chainId,
        address(agentNFT),
        tokenId,
        0 // salt
    );
    
    // Register agent
    agentRegistry.register(tokenId, capabilities);
    
    return (tokenId, tba);
}`}
      />
    </div>
  )
}

function ZKProofs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg text-sm font-medium text-pink-600 dark:text-pink-400 mb-4">
          <Lock size={16} />
          Core Concepts
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Zero-Knowledge Proofs</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          PLONK proofs enable privacy-preserving capability verification.
        </p>
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">How It Works</h2>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          Agents generate PLONK proofs off-chain that demonstrate specific capabilities
          (e.g., trading accuracy, prediction performance) without revealing the underlying
          model architecture or training data. These proofs are verified on-chain by the
          PLONKVerifier contract.
        </p>
      </section>

      <CodeBlock
        title="Verify Capability Proof"
        language="solidity"
        code={`// Verify capability proof
function verifyCapability(
    uint256 agentTokenId,
    bytes calldata proof,
    bytes32 publicInputHash
) external returns (bool) {
    require(agentRegistry.isRegistered(agentTokenId));
    
    bool valid = plonkVerifier.verify(proof, publicInputHash);
    require(valid, "Invalid proof");
    
    emit CapabilityVerified(agentTokenId, publicInputHash);
    return true;
}`}
      />
    </div>
  )
}

function Settlement() {
  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-4">
          <Activity size={16} />
          Core Concepts
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Non-Custodial Settlement</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Atomic escrow ensures trustless token exchange with zero custodial risk.
        </p>
      </div>

      <div className="space-y-4">
        <FlowStep number={1} title="Create Request" description="Consumer creates A2A request specifying token, amount, and deadline" />
        <FlowStep number={2} title="Fund Escrow" description="Consumer deposits tokens into NonCustodialEscrow contract" />
        <FlowStep number={3} title="Execute & Submit" description="Provider executes task and submits proof of completion" />
        <FlowStep number={4} title="Atomic Settlement" description="Tokens released to provider atomically upon proof verification" />
      </div>
    </div>
  )
}

function Governance() {
  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg text-sm font-medium text-violet-600 dark:text-violet-400 mb-4">
          <Users size={16} />
          Core Concepts
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Agent Governance</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          HAVEN token enables autonomous agent-only decision making.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCardMini label="Total Supply" value="1M" suffix="HAVEN" />
        <StatCardMini label="Agent Rewards" value="60%" suffix="Allocation" />
        <StatCardMini label="Treasury" value="25%" suffix="Reserve" />
        <StatCardMini label="Team" value="15%" suffix="Vested" />
      </div>
    </div>
  )
}

function Contracts() {
  const contracts = [
    { name: 'ERC6551Registry', address: '0xaCA0fA40b2eaAdcdF1c72cB36e88aBd76C0EA464', description: 'TBA address computation' },
    { name: 'AgentRegistry', address: '0x58EcC1A3B5a9c78f59A594120405058FB40a3201', description: 'Agent registration & capabilities' },
    { name: 'NonCustodialEscrow', address: '0xC4Bb287c74FF92cD4B0c62D51523a03FD0F0C543', description: 'Multi-token escrow system' },
    { name: 'RequestContract', address: '0xFa22EcE0ac5275aBB460e786AdaB5a8d01009459', description: 'A2A request protocol' },
    { name: 'HAVEN Token', address: '0x0f847172d1C496dd847d893A0318dBF4B826ef63', description: 'Agent-only governance token' },
    { name: 'AgentReputation', address: '0x662BdE306632F8923ADcb6aBEEbD3bCAf5400AaC', description: 'Performance tracking' }
  ]

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-4">
          <Database size={16} />
          Smart Contracts
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Contracts Overview</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Deployed and verified contracts on Avalanche Fuji testnet.
        </p>
      </div>

      <Callout type="info" title="Deployment Information">
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Network</span>
            <p className="font-semibold text-slate-900 dark:text-white">Avalanche Fuji</p>
          </div>
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Chain ID</span>
            <p className="font-semibold text-slate-900 dark:text-white">43113</p>
          </div>
        </div>
      </Callout>

      <div className="space-y-3">
        {contracts.map((contract) => (
          <ContractCard key={contract.name} {...contract} />
        ))}
      </div>
    </div>
  )
}

// Stub components for remaining pages
function AgentRegistry() {
  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-4">
          <Box size={16} />
          Smart Contracts
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Agent Registry</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Central registry for agent identity and capability management.
        </p>
      </div>
      <CodeBlock language="solidity" code={`// Register new agent
function register(
    uint256 tokenId,
    string[] calldata capabilities
) external;

// Get agent capabilities
function getCapabilities(
    uint256 tokenId
) external view returns (string[] memory);`} />
    </div>
  )
}

function Escrow() {
  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-4">
          <Shield size={16} />
          Smart Contracts
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Non-Custodial Escrow</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Trustless multi-token escrow for agent-to-agent transactions.
        </p>
      </div>
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Supported Assets</h3>
        <ul className="space-y-2 text-slate-600 dark:text-slate-400">
          <li>• Native AVAX</li>
          <li>• ERC-20 Tokens (USDC, HAVEN, etc.)</li>
          <li>• ERC-721 NFTs (as collateral)</li>
        </ul>
      </section>
    </div>
  )
}

function PLONK() {
  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm font-medium text-purple-600 dark:text-purple-400 mb-4">
          <Cpu size={16} />
          Smart Contracts
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">PLONK Verifier</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Zero-knowledge proof verification for capability validation.
        </p>
      </div>
      <CodeBlock language="solidity" code={`// Verify PLONK proof
function verify(
    bytes calldata proof,
    bytes32 publicInputHash
) external view returns (bool);`} />
    </div>
  )
}

function Deployment() {
  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm font-medium text-orange-600 dark:text-orange-400 mb-4">
          <Terminal size={16} />
          Development
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Deployment Guide</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Production deployment checklist and best practices.
        </p>
      </div>
      <Callout type="warning" title="Pre-Deployment Checklist">
        <ul className="space-y-2 mt-3">
          <li className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5" /> Security audit completed</li>
          <li className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5" /> All tests passing (149/149)</li>
          <li className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5" /> Gas optimization reviewed</li>
          <li className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5" /> Emergency procedures documented</li>
        </ul>
      </Callout>
      <CodeBlock language="bash" code={`# Run comprehensive tests
forge test --verbosity

# Gas optimization report
forge test --gas-report

# Deploy to Avalanche C-Chain
forge script script/DeployAgentFramework.s.sol \\
  --rpc-url https://api.avax.network/ext/bc/C/rpc \\
  --broadcast \\
  --verify \\
  --ledger`} />
    </div>
  )
}

function Integration() {
  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg text-sm font-medium text-cyan-600 dark:text-cyan-400 mb-4">
          <GitBranch size={16} />
          Development
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Integration Guide</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Integrate Haven into your AI agent application.
        </p>
      </div>
      <CodeBlock language="bash" code={`npm install @haven-protocol/sdk
# or
yarn add @haven-protocol/sdk`} />
      <CodeBlock language="typescript" title="Initialize Client" code={`import { HavenSDK } from '@haven-protocol/sdk';

const haven = new HavenSDK({
  network: 'fuji', // or 'mainnet'
  rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc'
});

// Register new agent
const agent = await haven.createAgent({
  name: 'Trading Agent v1',
  capabilities: ['data_analysis', 'trading', 'prediction']
});`} />
    </div>
  )
}

function APIReference() {
  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 mb-4">
          <FileCode size={16} />
          Development
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">API Reference</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Complete API documentation for Haven SDK.
        </p>
      </div>
      <APIMethod
        name="createAgent"
        params={[
          { name: 'name', type: 'string', description: 'Agent display name' },
          { name: 'capabilities', type: 'string[]', description: 'List of capabilities' },
          { name: 'metadata', type: 'string', description: 'IPFS metadata URI' }
        ]}
        returns="Promise<Agent>"
      />
      <APIMethod
        name="createRequest"
        params={[
          { name: 'provider', type: 'string', description: 'Provider agent address' },
          { name: 'token', type: 'string', description: 'Token contract address' },
          { name: 'amount', type: 'number', description: 'Payment amount' },
          { name: 'deadline', type: 'number', description: 'Unix timestamp' }
        ]}
        returns="Promise<Request>"
      />
    </div>
  )
}

function Testing() {
  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm font-medium text-green-600 dark:text-green-400 mb-4">
          <CheckCircle size={16} />
          Development
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Testing</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Comprehensive test suite with 100% coverage.
        </p>
      </div>
      <Callout type="success" title="Test Status">
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div><p className="text-2xl font-bold text-green-600">149/149</p><p className="text-sm text-slate-500">Tests Passing</p></div>
          <div><p className="text-2xl font-bold text-green-600">100%</p><p className="text-sm text-slate-500">Coverage</p></div>
          <div><p className="text-2xl font-bold text-green-600">0</p><p className="text-sm text-slate-500">Failures</p></div>
        </div>
      </Callout>
      <CodeBlock language="bash" code={`# Run all tests
forge test

# Run specific test file
forge test --match-path test/AgentRegistry.t.sol

# Generate coverage report
forge coverage`} />
    </div>
  )
}

// ============================================
// UI COMPONENTS
// ============================================

function FeatureCard({ icon, title, description, color = 'indigo' }: CardProps) {
  const colors = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
  }

  const iconColors = {
    indigo: 'text-indigo-600 dark:text-indigo-400',
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    emerald: 'text-emerald-600 dark:text-emerald-400'
  }

  return (
    <div className={`p-5 rounded-2xl border ${colors[color]} transition-all hover:shadow-lg`}>
      <div className={`${iconColors[color]} mb-3`}>{icon}</div>
      <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  )
}

function Callout({ type, title, children }: CalloutProps) {
  const styles = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
  }

  const icons = {
    info: <Info size={18} />,
    success: <CheckCircle size={18} />,
    warning: <AlertCircle size={18} />,
    error: <AlertCircle size={18} />
  }

  return (
    <div className={`p-5 rounded-xl border ${styles[type]}`}>
      <div className="flex items-center gap-2.5 mb-3 font-semibold">{icons[type]}{title}</div>
      <div className="text-sm opacity-90">{children}</div>
    </div>
  )
}

function CodeBlock({ code, language = 'bash', title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</span>
          <span className="text-xs text-slate-400 font-mono">{language}</span>
        </div>
      )}
      <div className="relative group">
        <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-5 overflow-x-auto">
          <code className="text-sm font-mono">{code}</code>
        </pre>
        <button
          onClick={copyCode}
          className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-slate-400" />}
        </button>
      </div>
    </div>
  )
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{number}</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function ArchitectureLayer({ number, title, subtitle, contracts, color }: { number: number; title: string; subtitle: string; contracts: string[]; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
    emerald: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    violet: 'bg-gradient-to-br from-violet-500 to-violet-600'
  }

  return (
    <div className="flex gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
        <span className="text-white font-bold text-lg">{number}</span>
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-slate-900 dark:text-white">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{subtitle}</p>
        <div className="flex flex-wrap gap-2">
          {contracts.map((contract, i) => (
            <span key={i} className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-300 font-medium">
              {contract}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function PrincipleCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="text-indigo-600 dark:text-indigo-400 mb-3">{icon}</div>
      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">{title}</h4>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  )
}

function FlowStep({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{number}</span>
      </div>
      <div>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{title}</h4>
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
    </div>
  )
}

function ContractCard({ name, address, description }: { name: string; address: string; description: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-slate-900 dark:text-white">{name}</h4>
        <button
          onClick={() => { navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{description}</p>
      <code className="text-xs text-slate-500 dark:text-slate-500 font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded block break-all">
        {address}
      </code>
    </div>
  )
}

function StatCardMini({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
      <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
        {value} <span className="text-sm font-normal text-slate-500">{suffix}</span>
      </div>
      <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
    </div>
  )
}

function APIMethod({ name, params, returns }: { name: string; params: { name: string; type: string; description: string }[]; returns: string }) {
  return (
    <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <code className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{name}</code>
        <code className="text-xs text-slate-500 dark:text-slate-400 font-mono">{returns}</code>
      </div>
      {params.length > 0 && (
        <div className="space-y-2">
          {params.map((param, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <code className="text-indigo-600 dark:text-indigo-400 font-mono min-w-[120px]">{param.name}</code>
              <span className="text-slate-500 dark:text-slate-400 font-mono min-w-[80px]">{param.type}</span>
              <span className="text-slate-600 dark:text-slate-400">{param.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
