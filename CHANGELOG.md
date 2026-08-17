# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-17

### Changed
- Complete UI redesign to match DSH official settings page design language
- Replaced all emoji with official DSH SVG outline icons (IconTrashOutline16, IconWarningOutline16, etc.)
- Switched from inline styles to CSS Modules (injected `<style>` + class names) for proper hover/focus/disabled pseudo-class support
- Layout changed from entry-cards to tab + card-list (matching official plugins settings section)
- Removed redundant page padding and large title (settings modal already provides these)
- Buttons now have proper hover, focus-visible, and disabled states
- Rounded corners unified to official values: 8px (buttons), 12px (cards), 999px (badges)

### Fixed
- Dark mode bug: button text color was hardcoded `#fff`, invisible on near-white brand-primary background in dark mode — now uses `var(--dsw-alias-label-primary-foreground)`
- CSS variable prefix typo: `--dsh-alias-*` corrected to `--dsw-alias-*` (d-s-w, not d-s-h)
- Replaced `window.confirm()` with custom confirmation dialog featuring "I understand the consequences" checkbox

### Added
- Custom confirmation dialog component for dangerous operations (uninstall, cleanup)
- Official DSH UI primitives integration (icons from `@deepseek-ai/dsh-client-ui-primitives`)
- Status dots (7px circles) for health check results — success/warn/error colors
- Hint text for health check anomalies with repair suggestions

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
