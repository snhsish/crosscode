# CrossCode

Control your PC's [OpenCode](https://opencode.ai) — the terminal AI coding agent — from your phone, from anywhere in the world. Free, open source, and private: your code never touches CrossCode's servers, because there are none.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/v/crosscode)](https://www.npmjs.com/package/crosscode)
[![Node.js >=20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

## Quick Start

### 1. On your PC

Open a terminal in your project directory and run:

```bash
npx crosscode
```

This starts `opencode serve`, opens a tunnel, and prints a QR code in your terminal. (Make sure [OpenCode](https://opencode.ai) is installed first.)

### 2. On your phone

1. Install the CrossCode app — [Android](https://crosscode.site/download) (iOS coming soon)
2. Open the app and scan the QR code
3. Start chatting with your agent

That's it. No account, no configuration, no shared network.

## How It Works

Your phone connects to the OpenCode instance running on your machine through a secure tunnel, and streams everything back in real time — prompts, streaming responses, tool-call approvals, and file diffs.

## Documentation

- [CLI Reference](docs/cli.md) — all commands, flags, and configuration
- [Development](docs/development.md) — set up and build the project locally
- [Features](docs/features.md) — what CrossCode can do
- [Tunnel Server](docs/tunnel-server/README.md) — self-hosted relay for paid users

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).