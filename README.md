# opencode-caffeinate

Prevent macOS from sleeping while OpenCode sessions are active.

## What it does

This plugin automatically runs `caffeinate -dim` when an OpenCode session starts, keeping your Mac awake during long AI coding sessions. When all sessions end, caffeinate is stopped to restore normal power management.

**Flags used:**
- `-d`: Prevent display sleep
- `-i`: Prevent idle sleep
- `-m`: Prevent disk sleep

## Installation

### From npm (recommended)

Add to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-caffeinate"]
}
```

### From local files

Clone this repo to your plugins directory:

```bash
# Global plugins
git clone https://github.com/nguyenphutrong/opencode-caffeinate.git ~/.config/opencode/plugins/opencode-caffeinate

# Or project-level
git clone https://github.com/nguyenphutrong/opencode-caffeinate.git .opencode/plugins/opencode-caffeinate
```

## Requirements

- **macOS only** - The `caffeinate` command is macOS-specific
- **Bun** >= 1.0.0
- **OpenCode** with plugin support

## How it works

1. When a session is created (`session.created` event), the plugin spawns a `caffeinate` process
2. Multiple sessions are tracked - caffeinate keeps running as long as any session is active
3. When all sessions end (`session.idle` or `session.deleted` events), caffeinate is stopped

## Development

```bash
# Install dependencies
bun install

# Type check
bun run --bun tsc --noEmit
```

## License

MIT
