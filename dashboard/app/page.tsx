"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  Bell,
  Settings,
  Play,
  Pause,
  ExternalLink,
  CheckCircle,
  Clock,
  TrendingUp,
  Wallet,
  Vote,
  FileText,
  RefreshCw,
  Plus,
  Upload,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { ConnectWallet } from "../components/ConnectWallet";
import {
  useAgent,
  useReputation,
  useOpenTasks,
  useActiveProposals,
} from "../hooks/useContracts";
import { formatAddress, formatEther, getTimeRemaining } from "../lib/wagmi-config";

// Mock Data (fallback when not connected)
const mockAgents = [
  {
    id: "001",
    name: "Trading Bot Alpha",
    status: "active",
    state: "Analyzing Market",
    uptime: 99.2,
    lastAction: "3 min ago",
  },
  {
    id: "002",
    name: "Governance Voter",
    status: "active",
    state: "Monitoring Proposals",
    uptime: 97.8,
    lastAction: "1 min ago",
  },
  {
    id: "003",
    name: "Task Worker",
    status: "paused",
    state: "Idle",
    uptime: 87.3,
    lastAction: "2h ago",
  },
];

const mockEarningsData = [
  { day: "Mon", tasks: 120, voting: 45, staking: 20 },
  { day: "Tue", tasks: 150, voting: 52, staking: 22 },
  { day: "Wed", tasks: 180, voting: 48, staking: 25 },
  { day: "Thu", tasks: 140, voting: 55, staking: 23 },
  { day: "Fri", tasks: 200, voting: 60, staking: 28 },
  { day: "Sat", tasks: 170, voting: 42, staking: 24 },
  { day: "Sun", tasks: 190, voting: 58, staking: 26 },
];

const mockTasks = [
  {
    id: 1,
    title: "Analyze ETH/USDC",
    type: "analysis",
    reward: "0.5 ETH",
    deadline: "4h 23m",
    status: "active",
  },
  {
    id: 2,
    title: "Market Research",
    type: "research",
    reward: "250 HAVEN",
    deadline: "12h 45m",
    status: "active",
  },
  {
    id: 3,
    title: "Liquidity Check",
    type: "monitoring",
    reward: "100 HAVEN",
    deadline: "23h 10m",
    status: "active",
  },
];

const mockProposals = [
  {
    id: 42,
    title: "Treasury Allocation",
    description: "Allocate 50K HAVEN for development",
    endsIn: "2 days",
    voted: false,
  },
  {
    id: 41,
    title: "Community Grant",
    description: "Fund community initiatives",
    endsIn: "5 days",
    voted: false,
  },
];

const mockTransactions = [
  {
    hash: "0x7a3F...8b2c",
    type: "Vote Cast",
    status: "confirmed",
    time: "3 min ago",
    gas: "$0.92",
    value: "—",
  },
  {
    hash: "0x4e9A...3f1d",
    type: "Task Completed",
    status: "confirmed",
    time: "12 min ago",
    gas: "$0.45",
    value: "+250 HAVEN",
  },
  {
    hash: "0x8c2B...7a4e",
    type: "Stake",
    status: "confirmed",
    time: "1h ago",
    gas: "$1.20",
    value: "-1000 HAVEN",
  },
  {
    hash: "0x1f5D...9c3b",
    type: "Task Accepted",
    status: "confirmed",
    time: "2h ago",
    gas: "$0.38",
    value: "—",
  },
  {
    hash: "0x6b8E...2d7f",
    type: "Agent Register",
    status: "confirmed",
    time: "1d ago",
    gas: "$2.15",
    value: "—",
  },
];

const oodaSteps = [
  {
    icon: "🔍",
    title: "OBSERVE",
    items: [
      "3 new proposals detected",
      "ETH price: $2,340 (+2.3%)",
      "Task #128 deadline: 4h",
      "Reputation: 742 (+12)",
    ],
  },
  {
    icon: "🧭",
    title: "ORIENT",
    items: [
      "Analyzing Proposal #42:",
      "- Community sentiment: +",
      "- Treasury impact: +",
      "- Risk level: Low",
      "- Similar past votes: 8/10",
    ],
  },
  {
    icon: "🎯",
    title: "DECIDE",
    items: [
      "Recommendation: VOTE FOR",
      "- Confidence: 87% (HIGH)",
      "- Expected reward: 50 HAVEN",
      "- Gas cost: ~$0.90",
      "- Alignment: DAO goals",
    ],
  },
  {
    icon: "⚡",
    title: "ACT",
    items: [
      "Transaction pending...",
      "Gas: $0.90",
      "Est. time: 30 seconds",
    ],
  },
];

// Components
function Header({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦅</span>
              <span className="font-bold text-xl">HAVENCLAW</span>
            </div>
            <nav className="hidden lg:flex items-center gap-6 ml-8">
              <a href="#" className="text-primary font-medium">
                Dashboard
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary">
                Agents
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary">
                Governance
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary">
                Tasks
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary">
                Portfolio
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              <span className="sr-only">3 notifications</span>
            </button>
            <ConnectWallet />
          </div>
        </div>
      </div>
    </header>
  );
}

function AgentStatusCard({ agent }: { agent: (typeof mockAgents)[0] }) {
  const statusColors: Record<string, string> = {
    active: "status-active",
    paused: "status-paused",
    inactive: "status-inactive",
  };

  const statusIcons: Record<string, string> = {
    active: "🟢",
    paused: "🟡",
    inactive: "🔴",
  };

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            🤖 AGENT #{agent.id}
          </h3>
          <p className="text-lg font-semibold mt-1">{agent.name}</p>
        </div>
        <span className={`status-badge ${statusColors[agent.status]}`}>
          {statusIcons[agent.status]} {agent.status.toUpperCase()}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">State:</span>
          <span className="font-medium">{agent.state}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Uptime:</span>
          <span className="font-medium">{agent.uptime}% (24h)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Last action:</span>
          <span className="font-medium">{agent.lastAction}</span>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button className="flex-1 btn-secondary text-sm py-2">
          View Details
        </button>
        <button className="px-4 btn-secondary text-sm py-2">
          {agent.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function ReputationGauge({ score = 742, max = 1000 }) {
  const percentage = (score / max) * 100;
  const rotation = (percentage / 100) * 180;

  return (
    <div className="card p-6">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        📈 REPUTATION
      </h3>
      <div className="flex flex-col items-center">
        <div className="relative w-40 h-20 overflow-hidden">
          <div
            className="absolute bottom-0 w-40 h-40 rounded-full border-8 border-gray-200 dark:border-gray-700"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" }}
          />
          <div
            className="absolute bottom-0 w-40 h-40 rounded-full border-8 border-primary"
            style={{
              clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)",
              transform: `rotate(${-180 + rotation}deg)`,
              transformOrigin: "center",
            }}
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center pb-4">
            <span className="text-3xl font-bold">{score}</span>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">Top 15%</p>
          <p className="text-xs text-gray-400 mt-1">+12 from yesterday</p>
        </div>
      </div>
    </div>
  );
}

function EarningsChart() {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          💰 EARNINGS (30D)
        </h3>
        <span className="text-green-500 text-sm font-medium flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          +18.5%
        </span>
      </div>
      <div className="mb-4">
        <p className="text-3xl font-bold">$2,340.50</p>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockEarningsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#6B7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "none",
                borderRadius: "8px",
                color: "#F9FAFB",
              }}
            />
            <Bar dataKey="tasks" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="voting" stackId="a" fill="#10B981" />
            <Bar dataKey="staking" stackId="a" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-xs text-gray-500">Tasks</p>
          <p className="font-medium">$1,890.00</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Voting</p>
          <p className="font-medium">$320.50</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Staking</p>
          <p className="font-medium">$130.00</p>
        </div>
      </div>
    </div>
  );
}

function TaskList({ blockchainTasks }: { blockchainTasks?: any[] }) {
  const typeIcons: Record<string, string> = {
    analysis: "🔵",
    research: "🟡",
    monitoring: "🟢",
  };

  // Use blockchain tasks if available, otherwise use mock data
  const tasks = blockchainTasks && blockchainTasks.length > 0
    ? blockchainTasks.map((task) => ({
        id: Number(task.taskId),
        title: task.description.slice(0, 30) + "...",
        type: "analysis" as const,
        reward: `${formatEther(task.reward)} ETH`,
        deadline: getTimeRemaining(Number(task.deadline)),
        status: "active" as const,
        taskId: task.taskId,
        creator: task.creator,
        solver: task.solver,
        requiredCapability: task.requiredCapability,
      }))
    : mockTasks;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          📋 ACTIVE TASKS ({tasks.length})
        </h3>
        <button className="text-primary text-sm font-medium hover:underline">
          View All
        </button>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span>{typeIcons[task.type]}</span>
                  <span className="font-medium text-sm">{task.title}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Reward: {task.reward} • Due: {task.deadline}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button className="flex-1 btn-primary text-xs py-1.5">
                Complete
              </button>
              <button className="px-3 btn-secondary text-xs py-1.5">
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProposalList({ blockchainProposals }: { blockchainProposals?: any[] }) {
  // Use blockchain proposals if available, otherwise use mock data
  const proposals = blockchainProposals && blockchainProposals.length > 0
    ? blockchainProposals.map((proposal) => ({
        id: Number(proposal.proposalId),
        title: proposal.description.slice(0, 40) + "...",
        description: proposal.description,
        endsIn: getTimeRemaining(Number(proposal.endBlock) * 12), // Approximate block time
        voted: false,
        proposalId: proposal.proposalId,
        forVotes: formatEther(proposal.forVotes),
        againstVotes: formatEther(proposal.againstVotes),
        proposer: proposal.proposer,
        state: proposal.state,
      }))
    : mockProposals;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          🗳️ ACTIVE PROPOSALS ({proposals.length})
        </h3>
        <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3">
        {proposals.map((proposal) => (
          <div
            key={proposal.id}
            className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">📜</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">
                    Proposal #{proposal.id}
                  </p>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {proposal.endsIn}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {proposal.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {proposal.description.slice(0, 50)}...
                </p>
                {!proposal.voted && (
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-1.5 px-3 rounded transition-colors">
                      Vote For
                    </button>
                    <button className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-1.5 px-3 rounded transition-colors">
                      Against
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { icon: "💎", label: "Stake", color: "bg-blue-500" },
    { icon: "🗳️", label: "Vote", color: "bg-green-500" },
    { icon: "📝", label: "Accept Task", color: "bg-purple-500" },
    { icon: "✅", label: "Complete", color: "bg-orange-500" },
    { icon: "🔄", label: "Refresh", color: "bg-gray-500" },
    { icon: "⚙️", label: "Settings", color: "bg-gray-600" },
  ];

  return (
    <div className="card p-6">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        ⚡ QUICK ACTIONS
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
          >
            <span className={`w-10 h-10 ${action.color} rounded-full flex items-center justify-center text-white`}>
              {action.icon}
            </span>
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function OODALoop() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % oodaSteps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card p-6">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        🧠 AGENT THOUGHT PROCESS (Live)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {oodaSteps.map((step, index) => (
          <div
            key={step.title}
            className={`p-4 rounded-lg transition-all duration-300 ${
              index === activeStep
                ? "bg-blue-50 dark:bg-blue-900/20 ooda-active border-2 border-primary"
                : "bg-gray-50 dark:bg-gray-800 border-2 border-transparent"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{step.icon}</span>
              <span className="font-semibold text-sm">{step.title}</span>
            </div>
            <ul className="space-y-1">
              {step.items.map((item, i) => (
                <li key={i} className="text-xs text-gray-600 dark:text-gray-400">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionFeed() {
  const statusIcons: Record<string, string> = {
    confirmed: "✅",
    pending: "⏳",
    failed: "❌",
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          📜 RECENT TRANSACTIONS
        </h3>
        <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
          View All <ExternalLink className="w-4 h-4" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
              <th className="pb-3 font-medium">Hash</th>
              <th className="pb-3 font-medium">Type</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Time</th>
              <th className="pb-3 font-medium">Gas</th>
              <th className="pb-3 font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {mockTransactions.map((tx) => (
              <tr
                key={tx.hash}
                className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td className="py-3 font-mono text-sm">{tx.hash}</td>
                <td className="py-3 text-sm">{tx.type}</td>
                <td className="py-3">
                  <span className="text-sm">
                    {statusIcons[tx.status]}{" "}
                    <span className="capitalize">{tx.status}</span>
                  </span>
                </td>
                <td className="py-3 text-sm text-gray-500">{tx.time}</td>
                <td className="py-3 text-sm font-mono">{tx.gas}</td>
                <td className="py-3 text-sm font-mono">{tx.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 z-50 transform transition-transform duration-300 lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦅</span>
              <span className="font-bold text-xl">HAVENCLAW</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          <a href="#" className="block px-4 py-2 rounded-lg bg-primary text-white font-medium">
            Dashboard
          </a>
          <a href="#" className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            Agents
          </a>
          <a href="#" className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            Governance
          </a>
          <a href="#" className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            Tasks
          </a>
          <a href="#" className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            Portfolio
          </a>
        </nav>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch real blockchain data when connected
  const { isRegistered, agentInfo } = useAgent(address);
  const { reputation } = useReputation(address);
  const { tasks } = useOpenTasks();
  const { proposals } = useActiveProposals();

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Convert blockchain data to UI format
  const realAgent = agentInfo ? {
    id: agentInfo.nftTokenId.toString(),
    name: `Agent #${agentInfo.nftTokenId}`,
    status: agentInfo.isActive ? "active" : "inactive",
    state: "On-Chain Active",
    uptime: 99.5,
    lastAction: "Just now",
  } : null;

  const realReputationScore = reputation?.score ? Number(reputation.score) : 742;

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setMobileMenuOpen(true)} />
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              {isConnected ? "Welcome back, Agent Owner!" : "Welcome to HavenClaw!"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {isConnected && isRegistered
                ? `Agent #${agentInfo?.nftTokenId} | Reputation: ${realReputationScore}`
                : isConnected && !isRegistered
                ? "Connect an agent wallet or register a new agent"
                : "Connect your wallet to manage agents"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <button className="btn-secondary flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Customize
            </button>
          </div>
        </div>

        {/* Top Row - Agent Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <AgentStatusCard agent={realAgent || mockAgents[0]} />
          <ReputationGauge score={isConnected ? realReputationScore : 742} max={1000} />
          <EarningsChart />
        </div>

        {/* Middle Row - Tasks, Proposals, Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <TaskList blockchainTasks={isConnected ? tasks : undefined} />
          <ProposalList blockchainProposals={isConnected ? proposals : undefined} />
          <QuickActions />
        </div>

        {/* OODA Loop */}
        <div className="mb-6">
          <OODALoop />
        </div>

        {/* Transaction Feed */}
        <TransactionFeed />
      </main>
    </div>
  );
}
