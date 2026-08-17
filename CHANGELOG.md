# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-17

### Added
- FR-1: Residue scanner — finds `.bak` backup files in `~/.dsh` and profile directory
- FR-1: One-click cleanup — delete selected residue files with confirmation
- FR-2: Pre-uninstall snapshot — backs up `package.json`, `pnpm-lock.yaml`, `cordis.yml`, `cordis.patch.yml`
- FR-4: Health check — checks port 3080 usage, cordis config validity, bundle resolvability
- FR-6: Safe uninstall — snapshot → `pnpm remove` → clean data directory → clean `.bak` files
- FR-7: Plugin status panel — lists installed plugins with name, version, data directory
- Settings page UI with three tabs: Plugins, Residues, Health Check
- Shell quoting and plugin name validation to prevent command injection
- Chinese (Simplified) UI labels

### Known Limitations
- FR-3 (snapshot restore) is experimental — snapshots are created but auto-restore is not yet implemented
- FR-5 (auto-restart) is deferred per user request — restart must be done manually
- Residue scan covers top-level directories only (no deep recursion)
- No snapshot management UI yet
