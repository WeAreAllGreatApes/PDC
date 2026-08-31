# Architecture (Tab/View Oriented)

This codebase is organized around visible product sections so maintainers can jump directly to the area they need.

## Runtime Flow

1. `index.html` defines component slots only.
2. `app.js` composes HTML partials into those slots.
3. `app.js` loads runtime scripts in order from `src/js/runtime/runtime-manifest.js`.

## JS Structure

- `app.js`: thin orchestrator
- `src/js/core/component-loader.js`: fetch/inject HTML partials
- `src/js/sections/layout.js`: header + workspace shell components
- `src/js/sections/home.js`: home section component
- `src/js/sections/tabs.js`: dispatch/alert/summary/settings/about tab components
- `src/js/sections/modals.js`: modal components
- `src/js/runtime/runtime-manifest.js`: ordered runtime script manifest
- `src/js/runtime/10_core-shared.js`: shared state/config/helpers
- `src/js/runtime/20_dispatch-map-view.js`: dispatch map/split workflows
- `src/js/runtime/30_dispatch-state.js`: dispatch persistence helpers
- `src/js/runtime/40_summary-view.js`: summary logic/rendering
- `src/js/runtime/50_dispatch-notes-view.js`: dispatch notes/card rendering
- `src/js/runtime/60_navigation-tours-export.js`: home navigation, tutorials, export
- `src/js/runtime/70_alert-view.js`: alert formatter UI
- `src/js/runtime/71_setup-shared.js`: setup shared globals (session detection, setup flags)
- `src/js/runtime/72_setup-bootstrap-state.js`: initial state bootstrap
- `src/js/runtime/73_setup-dispatch-summary.js`: dispatch + summary bindings
- `src/js/runtime/74_setup-alert.js`: alert bindings
- `src/js/runtime/75_setup-modals-navigation.js`: modal + navigation bindings
- `src/js/runtime/76_setup-dispatch-map.js`: dispatch map bindings
- `src/js/runtime/77_setup-window-shortcuts.js`: global window events + shortcuts
- `src/js/runtime/78_setup-finalize.js`: final icon/tour setup
- `src/js/runtime/80_init-and-events.js`: runtime entrypoint that runs setup phases
- `src/js/runtime/00_runtime-monolith.backup.js`: fallback snapshot of pre-split runtime

## HTML Components

- `src/html/layout/header.html`
- `src/html/layout/workspace-shell.html`
- `src/html/home/home-screen.html`
- `src/html/tabs/dispatch-tab.html`
- `src/html/tabs/alert-tab.html`
- `src/html/tabs/summary-tab.html`
- `src/html/tabs/settings-tab.html`
- `src/html/tabs/about-tab.html`
- `src/html/modals/tutorial-and-utility-modals.html`
- `src/html/modals/shortcuts-modal.html`
- `src/html/modals/version-modal.html`

## Maintainer Content Files

- `content/version-history.md`: Version modal entries
- `content/about-legal.md`: About / Legal tab copy
- `content/shortcuts.md`: Keyboard shortcuts modal entries
- `content/tutorial-picker-intro.md`: tutorial picker warning text

## CSS Structure

- `styles.css` is the entrypoint.
- It imports section-oriented files in order:
  - `src/css/variables.css` (design tokens: light on `:root`, dark under `@media (prefers-color-scheme: dark)`)
  - `src/css/components/home.css`
  - `src/css/components/workspace-core.css`
  - `src/css/components/dispatch.css`
  - `src/css/components/summary.css`
  - `src/css/components/modals.css`
  - `src/css/base/boot.css`
  - `src/css/base/semantic-layout.css`
- Components must use semantic tokens from `variables.css` (never raw hex values) so light and dark themes stay in sync.

## Tooling Scripts

Run with `npm run <name>` (see `package.json`):

- `check` — `scripts/check-css.js` validates brace balance, `@import` termination, and that every `var(--x)` reference resolves to a token.
- `audit` — `scripts/audit-network.js` loads the app headless (home → workspace), reports any HTTP >=400 responses, console errors, and uncaught exceptions. Must print `OK` before deploying.
- `smoke` — `scripts/smoke-render.js` renders light and dark themes headlessly and prints computed styles of key selectors (regression check for theme bugs).
- `favicons` — `scripts/gen-favicons.js` regenerates `favicon.ico`, `favicon-32.png`, and `apple-touch-icon.png` from `favicon.svg` (requires local Chrome). Re-run after changing the SVG; all four files are deployed via the Dockerfile.
- `bundle` — `scripts/bundle-pdc.js` emits one self-contained HTML file (default `dist/pdc.html`). It inlines stylesheets/icons/classic scripts, embeds fetched resources and the ordered runtime as data, swaps in a standalone CSP, and serves embedded resources through a small `fetch` shim so the file also boots from `file://`. Options include `--mapbox-token` (direct Geocoding v6), `--geocoding-url`, `--center`, `--timezone`, `--config`, `--set`, `--no-map`, `--include`, and `--minify`.

## Runtime Notes

Runtime still uses shared globals by design for compatibility. The split is file-based and section-oriented, but not yet an isolated state-module architecture.
