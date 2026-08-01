# Contributing to CrossCode

Thank you for your interest in contributing to CrossCode! This project is free and open source, and we welcome contributions of all kinds: bug fixes, features, documentation, and more.

## Code of Conduct

Be respectful, be helpful, and assume good faith. We're all here to build something great together.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) >= 20
- [pnpm](https://pnpm.io) >= 9
- [OpenCode](https://opencode.ai) installed (for testing the CLI)
- [Cloudflare Tunnel](https://developers.cloudflare.com/tunnel) installed (for testing the CLI)

### Setup

```bash
# Fork and clone the repo
git clone https://github.com/snhsish/crosscode.git
cd crosscode

# Install dependencies
pnpm install

# Create a branch for your changes
git checkout -b my-feature
```

### Development Workflow

```bash
# Start all apps in development mode
pnpm dev

# Build everything
pnpm build

# Run linter
pnpm lint
```

### Project Structure

```
crosscode/
├── apps/
│   ├── mobile/          # React Native + Expo app
│   └── web/             # Web app (placeholder)
├── packages/
│   ├── crosscode/       # Companion CLI (`npx crosscode`)
│   └── shared/          # Shared types and utilities
```

- **`packages/crosscode/`**: The companion CLI. Run `pnpm dev` in this directory for watch mode.
- **`apps/mobile/`**: The React Native mobile app. Run `pnpm start` to launch the Expo dev server.
- **`packages/shared/`**: Shared TypeScript types, constants, and the QR payload encode/decode logic.

## Making Changes

### 1. Find or Create an Issue

Before starting work, check if there's an existing issue. If not, open one to discuss your idea first. This avoids duplicate work and ensures your contribution aligns with the project's direction.

### 2. Create a Branch

Always work on a feature branch — never push directly to `main`. Use these prefixes:

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `chore/` - Maintenance, dependencies
- `refactor/` - Code refactoring
- `test/` - Tests

Example: `git checkout -b feat/your-feature-name`

### 3. Make Your Changes

- Follow the existing code style and conventions
- Keep commits focused and atomic
- Write clear commit messages (prefer [Conventional Commits](https://www.conventionalcommits.org/))

### 4. Test Your Changes

- Test the CLI locally with `npx crosscode` from the built output
- Test the mobile app on a real device or emulator
- Make sure `pnpm build` and `pnpm lint` pass

### 5. Open a Pull Request

- Push your branch to your fork
- Open a PR against `main`
- Describe what you changed and why
- Link any relevant issues

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Update documentation if your change affects usage
- Make sure CI passes (lint, build, typecheck)
- Be responsive to review feedback

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:

```
feat(mobile): add biometric lock screen
fix(cli): handle missing cloudflared gracefully
docs: update README with new setup steps
```

## Reporting Bugs

When reporting a bug, include:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Your environment (OS, Node version, opencode version, app version)

## Suggesting Features

Feature suggestions are welcome! Please include:

- A clear description of the feature
- Why it would be useful
- Any relevant mockups or examples

## License

By contributing to CrossCode, you agree that your contributions will be licensed under the [MIT License](LICENSE).
