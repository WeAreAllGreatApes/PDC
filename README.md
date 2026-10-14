# PublicDataCleanup

PublicDataCleanup is a static, privacy-first web app for collecting field notes, formatting alert text, and exporting summaries.

## Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:8080`.

## Build: Single-File Bundle

Create one self-contained HTML file that opens directly from disk (double-click,
`file://`, webview, or any static host). All stylesheets, scripts, icons, HTML
partials, markdown content, tours, and the ordered runtime are embedded; a small
bootstrap serves them to `fetch()` so no local server is required.

```bash
npm run bundle -- --mapbox-token pk.your_public_token
```

Output: `dist/pdc.html`.

### Options

| Option | Description |
|---|---|
| `-o, --output <file>` | Output path (default `dist/pdc.html`) |
| `--mapbox-token <token>` | Embed a public (`pk.`) Mapbox token and route geocoding directly to Geocoding API v6 |
| `--geocoding-url <url>` | Use an existing PDC-compatible geocoding proxy instead of direct Mapbox |
| `--center <lat,lon>` | Set `map.defaultCenter` |
| `--timezone <iana-zone>` | Set `timezone.default` |
| `--config <file>` | Deep-merge a JSON/YAML config into `config.generated.js` |
| `--set <path=value>` | Override any config value, e.g. `--set map.defaultRadiusMiles=25`; repeatable |
| `--no-map` | Disable map, split view, and location tagging |
| `--include <file>` | Embed an additional local text resource |
| `--minify` | Minify the bundled application module |

Examples:

```bash
# Direct Mapbox with defaults from config.generated.js
npm run bundle -- --mapbox-token pk.xxx

# Proxy geocoder + custom center/timezone
npm run bundle -- --geocoding-url https://geo.example.org \
  --center 44.9778,-93.265 --timezone America/Chicago

# Everything through a YAML override
npm run bundle -- --config config.example.yml -o pdc-offline.html
```

Only embed public tokens (`pk.`/`tk.`); the token is visible inside the file.
Map features need network access for tiles/geocoding; everything else works
fully offline.

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
- `docs/GEOLOCATE.md`

## Netlify Compatibility

No build step is required for production. This is a static app with module scripts and component partials fetched at runtime from the same origin.
