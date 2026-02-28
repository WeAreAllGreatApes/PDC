# PublicDataCleanup

PublicDataCleanup is a static, privacy-first web app for collecting field notes, formatting alert text, and exporting summaries.

## Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:8080`.

## Human-Oriented Structure

This repo is now organized by tabs/views so HTML, CSS, and JS locations are easier to match:

- Home
- Dispatch (Notes + Map)
- Alert
- Summary
- Settings
- About
- Shortcuts modal
- Version modal

## Key Files

- `index.html`: slot-based shell
- `app.js`: orchestrates component composition + runtime start
- `src/html/...`: section partials
- `src/css/components/...`: section styles
- `src/js/sections/...`: component definitions
- `src/js/runtime/runtime-manifest.js`: ordered runtime loader manifest
- `src/js/runtime/10_...80_*.js`: section-oriented runtime modules
- `content/version-history.md`: maintainer-friendly version notes source (renders in Version modal)
- `content/about-legal.md`: markdown source for About / Legal tab content
- `content/shortcuts.md`: markdown source for Keyboard Shortcuts modal
- `content/tutorial-picker-intro.md`: markdown source for tutorial picker warning text

## Docs

- `docs/ARCHITECTURE.md`
- `docs/MAINTAINER_MAP.md`

## Netlify Compatibility

No build step is required for production. This is a static app with module scripts and component partials fetched at runtime from the same origin.
