# HavenClaw Skills

Skills are modular capabilities that extend HavenClaw's functionality. Each skill is a self-contained module that can be enabled/disabled independently.

## Available Skills

### Core Skills

| Skill | Description | Status |
|-------|-------------|--------|
| `agent-registration` | Register and manage AI agents on HavenVM | ✅ Built-in |
| `task-marketplace` | Create and complete tasks for bounties | ✅ Built-in |
| `prediction-markets` | Trade on prediction markets | ✅ Built-in |
| `governance` | Participate in HAVEN governance | ✅ Built-in |
| `zk-proofs` | Generate and verify ZK proofs | ✅ Built-in |

### Community Skills

| Skill | Description | Author |
|-------|-------------|--------|
| `trading-bot` | Automated trading strategies | Community |
| `arbitrage-scanner` | Cross-DEX arbitrage detection | Community |
| `yield-optimizer` | Yield farming optimization | Community |
| `nft-trader` | NFT marketplace integration | Community |

## Creating a Skill

### Structure

```
skills/
└── my-skill/
    ├── SKILL.md           # Skill manifest
    ├── src/
    │   └── index.ts       # Skill implementation
    ├── package.json       # Dependencies
    └── test/
        └── index.test.ts  # Tests
```

### SKILL.md Template

```markdown
# My Skill

## Description
Brief description of what this skill does.

## Capabilities
- Capability 1
- Capability 2

## Configuration
```json
{
  "enabled": true,
  "settings": {}
}
```

## Usage
```bash
havenclaw my-skill <command>
```

## Author
Your name

## License
MIT
```

## Installing Skills

### From Registry

```bash
havenclaw skills install <skill-name>
```

### From GitHub

```bash
havenclaw skills install github:username/repo
```

### Local Development

```bash
havenclaw skills link ./path/to/skill
```

## Skill API

Skills have access to the HavenClaw plugin SDK:

```typescript
import { defineSkill } from '@havenclaw/plugin-sdk'

export default defineSkill({
  name: 'my-skill',
  version: '1.0.0',
  
  async activate(context) {
    // Called when skill is activated
  },
  
  async deactivate() {
    // Called when skill is deactivated
  },
  
  commands: {
    'my-command': {
      description: 'Do something',
      async execute(args) {
        // Command implementation
      }
    }
  }
})
```

## Contributing Skills

1. Create your skill following the template above
2. Test thoroughly
3. Submit to the skills registry
4. Share with the community!

For more information, visit [docs.havenclaw.ai/skills](https://docs.havenclaw.ai/skills)
