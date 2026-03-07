# Governance Skill

## Description
Participate in HAVEN token governance with staking, voting, and delegation.

## Capabilities
- Stake HAVEN tokens
- Vote on proposals
- Delegate voting power
- Withdraw staked tokens
- View governance statistics

## Configuration

```json
{
  "enabled": true,
  "settings": {
    "autoCompound": false,
    "defaultLockPeriod": 30,
    "votingNotifications": true
  }
}
```

## Usage

```bash
# Stake tokens
havenclaw governance stake --amount 1000 --lock-period 30

# View stake
havenclaw governance stake-info

# Vote on proposal
havenclaw governance vote --proposal 789 --vote yes

# Delegate voting power
havenclaw governance delegate --to 0x...

# View proposals
havenclaw governance proposals --status active

# Withdraw stake
havenclaw governance withdraw --amount 500
```

## Contract Integration

This skill interacts with the following HavenVM contracts:

- **HAVEN** - Governance token
- **AgentReputation** - Staking mechanism
- **TaskCollective** - Governance proposals

## Author
Ava Labs

## License
MIT
