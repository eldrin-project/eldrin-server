# @eldrin-project/eldrin-server

Local development server for the Eldrin micro-frontend platform.

## Installation

```bash
npm install -g @eldrin-project/eldrin-server
```

## Usage

Start the server:

```bash
eldrin-server start
```

### Options

```bash
eldrin-server start --port 4000        # Custom port (default: 4000)
eldrin-server start --data-dir ~/data  # Custom data directory (default: ~/.eldrin)
```

## What's Included

- HTTP server for serving micro-frontend applications
- SQLite database for local data persistence
- Event bus for cross-app communication
- App registry and manifest loading

## Data Storage

By default, Eldrin Server stores data in `~/.eldrin/`:

- `eldrin.db` - SQLite database
- `config.json` - Server configuration

## Supported Platforms

- macOS (Apple Silicon & Intel)
- Linux (x64 & ARM64)
- Windows (x64)

## Requirements

- Node.js 18 or later

## License

MIT
