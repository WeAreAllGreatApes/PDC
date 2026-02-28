# Maintainer Map

## If you need to edit...

- Home screen copy/layout:
  - `src/html/home/home-screen.html`
  - `src/css/components/home.css`
- Dispatch tab (notes + map):
  - `src/html/tabs/dispatch-tab.html`
  - `src/css/components/dispatch.css`
  - `src/js/runtime/20_dispatch-map-view.js`
  - `src/js/runtime/30_dispatch-state.js`
  - `src/js/runtime/50_dispatch-notes-view.js`
- Alert tab:
  - `src/html/tabs/alert-tab.html`
  - `src/css/components/workspace-core.css`
  - `src/js/runtime/70_alert-view.js`
- Summary tab:
  - `src/html/tabs/summary-tab.html`
  - `src/css/components/summary.css`
  - `src/js/runtime/40_summary-view.js`
- Settings tab:
  - `src/html/tabs/settings-tab.html`
  - `src/css/components/workspace-core.css`
  - `src/js/runtime/10_core-shared.js`
  - `src/js/runtime/30_dispatch-state.js`
- About tab:
  - `src/html/tabs/about-tab.html`
  - `src/css/components/workspace-core.css`
  - `content/about-legal.md`
  - `src/js/runtime/60_navigation-tours-export.js`
  - `src/js/runtime/75_setup-modals-navigation.js`
- Shortcuts modal:
  - `src/html/modals/shortcuts-modal.html`
  - `src/css/components/modals.css`
  - `content/shortcuts.md`
  - `src/js/runtime/77_setup-window-shortcuts.js`
  - `src/js/runtime/80_init-and-events.js`
- Version modal:
  - `src/html/modals/version-modal.html`
  - `src/css/components/modals.css`
  - `content/version-history.md`
  - `src/js/runtime/75_setup-modals-navigation.js`
  - `src/js/runtime/80_init-and-events.js`

- Tutorial picker intro text:
  - `src/html/modals/tutorial-and-utility-modals.html`
  - `content/tutorial-picker-intro.md`
  - `src/js/runtime/75_setup-modals-navigation.js`

## Shell/Composition Issues

- Slot wiring/order:
  - `index.html`
  - `app.js`
  - `src/js/core/component-loader.js`
  - `src/js/sections/*.js`
  - `src/js/runtime/runtime-manifest.js`
  - `src/js/runtime/71_setup-shared.js`
  - `src/js/runtime/72_setup-bootstrap-state.js`
  - `src/js/runtime/73_setup-dispatch-summary.js`
  - `src/js/runtime/74_setup-alert.js`
  - `src/js/runtime/75_setup-modals-navigation.js`
  - `src/js/runtime/76_setup-dispatch-map.js`
  - `src/js/runtime/77_setup-window-shortcuts.js`
  - `src/js/runtime/78_setup-finalize.js`
  - `src/js/runtime/80_init-and-events.js`
