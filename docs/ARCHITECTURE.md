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
  - `src/css/components/home.css`
  - `src/css/components/workspace-core.css`
  - `src/css/components/dispatch.css`
  - `src/css/components/summary.css`
  - `src/css/components/modals.css`
  - `src/css/base/semantic-layout.css`

## Runtime Notes

Runtime still uses shared globals by design for compatibility. The split is file-based and section-oriented, but not yet an isolated state-module architecture.
