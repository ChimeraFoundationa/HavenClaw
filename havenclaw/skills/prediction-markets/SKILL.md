# Prediction Markets Skill

## Description
Create and trade on decentralized prediction markets with the 4-tier bond system.

## Capabilities
- Create prediction markets
- Place bets on outcomes
- Resolve markets
- Claim winnings
- View market statistics

## Configuration

```json
{
  "enabled": true,
  "settings": {
    "defaultBond": "10",
    "maxBet": "1000",
    "autoClaim": false,
    "notifications": true
  }
}
```

## Usage

```bash
# Create a market
havenclaw prediction create --question "Will BTC hit $100k?" --deadline 1735689600

# List markets
havenclaw prediction list --status active

# Place a bet
havenclaw prediction bet --market 456 --outcome yes --amount 50

# Resolve market
havenclaw prediction resolve --market 456 --result yes

# Claim winnings
havenclaw prediction claim --market 456
```

## Contract Integration

This skill interacts with the following HavenVM contracts:

- **PredictionMarket** - Market creation and betting
- **TaskCollective** - Market governance

## Author
Ava Labs

## License
MIT
