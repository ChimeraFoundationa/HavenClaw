# 🦅 HavenClaw Agent Dashboard

A beautiful, responsive dashboard for monitoring and managing autonomous AI agents in the HAVEN Protocol.

![Dashboard Preview](./preview.png)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📊 Features

### Dashboard Widgets

| Widget | Description |
|--------|-------------|
| **Agent Status Card** | Real-time agent status, uptime, and state |
| **Reputation Gauge** | Visual reputation score (0-1000) |
| **Earnings Chart** | 30-day earnings breakdown (tasks, voting, staking) |
| **Active Tasks** | List of current tasks with quick actions |
| **Active Proposals** | Governance proposals with voting buttons |
| **Quick Actions** | One-click access to common actions |
| **OODA Loop** | Live visualization of agent thought process |
| **Transaction Feed** | Recent on-chain transactions |

### Key Features

- ✅ **Real-time Updates** - Auto-refresh every 30 seconds
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Dark Mode** - Automatic dark mode support
- ✅ **Mobile Menu** - Slide-out navigation for mobile devices
- ✅ **Interactive Charts** - Powered by Recharts
- ✅ **Beautiful Icons** - Lucide React icons
- ✅ **Web3 Integration** - wagmi/viem for wallet connection
- ✅ **Live Contract Data** - Real-time data from Fuji testnet contracts

## 🏗️ Architecture

```
dashboard/
├── app/
│   ├── globals.css       # Global styles and theme
│   ├── layout.tsx        # Root layout with Web3Provider
│   └── page.tsx          # Main dashboard page
├── components/
│   ├── ConnectWallet.tsx # Wallet connection component
│   └── Web3Provider.tsx  # wagmi provider wrapper
├── hooks/
│   └── useContracts.ts   # Smart contract hooks
├── lib/
│   └── wagmi-config.ts   # Contract addresses & ABIs
└── package.json
```

## 🔌 Contract Integration

The dashboard connects to the **OpenClaw** smart contracts deployed on **Avalanche Fuji Testnet**.

### Contract Addresses (from openclaw-agent)

| Contract | Address |
|----------|---------|
| **AgentRegistry** | `0xe97f0c1378A75a4761f20220d64c31787FC9e321` |
| **AgentReputation** | `0x5964119472d9dEA5B73B7A9a911a6B2Af870dE19` |
| **HavenGovernance** | `0xCa2494A2725DeCf613628a2a70600c6495dB9369` |
| **TaskMarketplace** | `0x582fa485d560ec4c2E4DC50D14B1f29C29240e3a` |
| **HAVEN Token** | `0x0f847172d1C496dd847d893A0318dBF4B826ef63` |
| **ERC-8004 Registry** | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |

### ABIs

Contract ABIs are sourced from `/root/soft/openclaw-agent/packages/contract-client/src/abi/`:
- `Registry.json` - Agent registration and management
- `TaskMarketplace.json` - Task creation and completion
- `Governance.json` - Proposal creation and voting
- `Reputation.json` - Reputation tracking and staking

## 🎨 Theme System

The dashboard uses CSS custom properties for theming:

```css
:root {
  --primary: #3B82F6;      /* Blue */
  --secondary: #10B981;    /* Green */
  --success: #22C55E;
  --warning: #F59E0B;
  --danger: #EF4444;
}
```

Dark mode is automatically enabled based on system preferences.

## 📱 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Single column |
| Tablet | 768px - 1023px | 2 columns |
| Desktop | 1024px+ | 3 columns |

## 🔌 Future Integrations

### Web3 (Planned)
```bash
npm install wagmi viem @tanstack/react-query
```

Connect to real blockchain data:
- Wallet connection (MetaMask, WalletConnect)
- Real agent data from smart contracts
- Live transaction signing
- On-chain governance voting

### API Integration (Planned)
```typescript
// Fetch real agent data
const { data: agents } = useQuery({
  queryKey: ['agents', address],
  queryFn: () => fetchAgents(address),
});
```

## 🧩 Component Examples

### Agent Status Card
```tsx
<AgentStatusCard agent={{
  id: "001",
  name: "Trading Bot Alpha",
  status: "active",
  state: "Analyzing Market",
  uptime: 99.2,
  lastAction: "3 min ago",
}} />
```

### Reputation Gauge
```tsx
<ReputationGauge score={742} max={1000} />
```

### Earnings Chart
```tsx
<EarningsChart data={earningsData} />
```

## 🎯 OODA Loop Visualization

The dashboard features a unique **OODA Loop** visualization that shows the agent's decision-making process in real-time:

1. **🔍 Observe** - What the agent detects
2. **🧭 Orient** - How the agent analyzes information
3. **🎯 Decide** - The agent's recommendation
4. **⚡ Act** - The agent's execution

The active step is highlighted with a glowing animation.

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `next` | React framework |
| `react` | UI library |
| `recharts` | Charts and graphs |
| `lucide-react` | Icon library |
| `tailwindcss` | Styling |

## 🛠️ Development

### Add New Widgets

1. Create a new component in `app/page.tsx`
2. Follow the existing widget pattern
3. Add to the grid layout

### Customize Theme

Edit `app/globals.css`:

```css
:root {
  --primary: #your-color;
  --secondary: #your-color;
}
```

### Add New Pages

1. Create `app/agents/page.tsx`
2. Create `app/governance/page.tsx`
3. Add navigation links in `Header` component

## 📄 License

MIT License

---

<div align="center">

**Built with ❤️ for the HAVEN Protocol**

</div>
