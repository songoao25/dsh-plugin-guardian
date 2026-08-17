# DSH Plugin Guardian

[English](./README.md) | [中文](./README.zh-CN.md)

> Safe uninstall with snapshot rollback for DeepSeek Harness plugins.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Platform](https://img.shields.io/badge/platform-DeepSeek%20Harness-orange.svg)

## What is this?

A plugin for DeepSeek Harness that helps you **safely uninstall other plugins** — no leftover files, no broken startup, no command line needed.

If you've ever uninstalled a DSH plugin and found leftover `.bak` files, orphaned data directories, or your Harness refusing to start — this is the tool that fixes that.

## Features

- **Plugin List** — See all installed plugins with versions and data directories
- **Residue Scanner** — Find `.bak` backup files and orphaned data left behind by previous operations
- **One-Click Cleanup** — Delete residue files with preview and confirmation
- **Pre-Uninstall Snapshot** — Automatically backs up your config files before any uninstall
- **Safe Uninstall** — One button does: snapshot → uninstall → clean data → clean leftovers
- **Health Check** — Check port 3080, config validity, and bundle status before startup

## Installation

```bash
# In your DSH workspace directory
dsh plugin add dsh-plugin-guardian
```

Or manually copy this directory into your DSH plugins folder and restart Harness.

## Usage

1. Open DSH Settings (gear icon in sidebar)
2. Find the **"插件管家"** (Plugin Guardian) tab
3. Click any of the three buttons:
   - **已装插件** (Installed Plugins) — View and uninstall plugins
   - **扫描残留** (Scan Residues) — Find and clean leftover files
   - **启动前体检** (Health Check) — Check system health before restart

### Uninstalling a plugin

1. Click **已装插件** to see your installed plugins
2. Click **卸载** (Uninstall) next to the plugin you want to remove
3. Confirm the action — Guardian will automatically:
   - Create a snapshot of your config files
   - Run `pnpm remove` to uninstall the package
   - Clean up the plugin's data directory
   - Clean up related `.bak` files
4. **Manually restart DSH** to apply changes (e.g., `zsh scripts/restart-deepseek-harness.sh`)

## FAQ

**Q: Why do I need to restart manually after uninstalling?**
A: DSH assembles plugins at startup — removing one requires reassembly. Auto-restart is planned for a future version.

**Q: Where are snapshots stored?**
A: In `~/.dsh/.plugin-guard-snapshots/<timestamp>-<plugin-name>/`. They're local only, never uploaded.

**Q: Is it safe?**
A: All delete operations require confirmation. Plugin names are validated against injection attacks. Shell commands are properly quoted.

## Limitations

- Snapshot auto-restore is experimental (snapshots are created but auto-restore UI is not yet available)
- Auto-restart is deferred — manual restart required after uninstall
- Residue scan covers top-level directories only

## License

MIT © 2026 songsong
