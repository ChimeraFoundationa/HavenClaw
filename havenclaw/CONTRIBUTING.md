# Contributing to HavenClaw

Thank you for your interest in contributing to HavenClaw! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in your interactions. We welcome contributors of all backgrounds and experience levels.

## How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Create a new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)

### Suggesting Features

1. Check existing issues to avoid duplicates
2. Create a feature request issue with:
   - Clear description of the feature
   - Use case / problem it solves
   - Proposed implementation (optional)

### Pull Requests

1. Fork the repository
2. Create a branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test`)
5. Run linter (`pnpm lint`)
6. Update documentation if needed
7. Submit a pull request

### PR Guidelines

- **One thing per PR**: Keep PRs focused on a single change
- **Write tests**: Include tests for new features
- **Follow style**: Match existing code style
- **Document**: Update docs for new features
- **Describe**: Explain what and why in the PR description

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/havenclaw.git
cd havenclaw

# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Run in dev mode
pnpm dev
```

## Code Style

We use automated tools to maintain code quality:

```bash
# Format code
pnpm format

# Lint
pnpm lint

# Type check
pnpm check
```

## Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test path/to/test.test.ts
```

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for new functions
- Update CLI help text for new commands
- Add examples for new features

## Skills & Plugins

Contributing skills and plugins is encouraged! See [skills/README.md](skills/README.md) for guidelines.

## Release Process

Releases follow semantic versioning:

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Questions?

- Check the [documentation](https://docs.havenclaw.ai)
- Ask in [Discord](https://discord.gg/havenclaw)
- Open a [discussion](https://github.com/ava-labs/havenclaw/discussions)

Thank you for contributing to HavenClaw! 🏛️
