#!/usr/bin/env node
/*
 * Produces a portable PDC HTML file. Local assets, fetched content, and the
 * ordered classic runtime are embedded so the output also works from file://.
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT = path.join(ROOT, "dist", "pdc.html");
const STYLESHEETS = [
  "styles.css",
  "vendor/leaflet/leaflet.css",
  "vendor/driver.js/driver.css",
];
const CLASSIC_SCRIPTS = [
  "lucide.min.js",
  "vendor/luxon/luxon.min.js",
  "vendor/leaflet/leaflet.js",
  "vendor/js-yaml/js-yaml.min.js",
  "vendor/driver.js/driver.js.iife.js",
];
const RESOURCE_DIRECTORIES = ["src/html", "content", "tours", "sessions"];
const RESOURCE_EXTENSIONS = new Set([".html", ".json", ".md", ".yaml", ".yml"]);
const MIME_TYPES = {
  ".css": "text/css",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".json": "application/json",
  ".md": "text/markdown",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".yaml": "text/yaml",
  ".yml": "text/yaml",
};

function fail(message) {
  throw new Error(message);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function isWithinRoot(filePath) {
  const relative = path.relative(ROOT, filePath);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== "..");
}

function projectPath(relativePath) {
  const absolutePath = path.resolve(ROOT, relativePath);
  if (!isWithinRoot(absolutePath)) {
    fail(`Path is outside the project: ${relativePath}`);
  }
  return absolutePath;
}

function requireOptionValue(argv, index, option) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    fail(`${option} requires a value.`);
  }
  return value;
}

function parseArgs(argv) {
  const options = {
    configPath: null,
    center: null,
    geocodingUrl: null,
    help: false,
    includes: [],
    mapboxToken: null,
    minify: false,
    noMap: false,
    output: DEFAULT_OUTPUT,
    sets: [],
    timezone: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    switch (option) {
      case "--config":
        options.configPath = requireOptionValue(argv, index, option);
        index += 1;
        break;
      case "--center":
        options.center = requireOptionValue(argv, index, option);
        index += 1;
        break;
      case "--geocoding-url":
        options.geocodingUrl = requireOptionValue(argv, index, option);
        index += 1;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--include":
        options.includes.push(requireOptionValue(argv, index, option));
        index += 1;
        break;
      case "--mapbox-token":
        options.mapboxToken = requireOptionValue(argv, index, option);
        index += 1;
        break;
      case "--minify":
        options.minify = true;
        break;
      case "--no-map":
        options.noMap = true;
        break;
      case "--output":
      case "-o":
        options.output = path.resolve(process.cwd(), requireOptionValue(argv, index, option));
        index += 1;
        break;
      case "--set":
        options.sets.push(requireOptionValue(argv, index, option));
        index += 1;
        break;
      case "--timezone":
        options.timezone = requireOptionValue(argv, index, option);
        index += 1;
        break;
      default:
        fail(`Unknown option: ${option}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage: npm run bundle -- [options]

Create one self-contained HTML file that can be opened directly from disk.

Options:
  -o, --output <file>           Output path (default: dist/pdc.html)
  --config <file>               Merge JSON or YAML configuration into config.generated.js
  --set <path=value>            Override a configuration value; repeatable
  --center <latitude,longitude> Set map.defaultCenter
  --timezone <iana-zone>        Set timezone.default
  --geocoding-url <url>         Use an existing PDC-compatible geocoding proxy
  --mapbox-token <public-token> Enable direct Mapbox Geocoding v6 requests
  --no-map                      Disable map, split-view, and location tagging
  --include <file>              Include an additional local text resource
  --minify                      Minify the bundled application module
  -h, --help                    Show this help

Mapbox tokens are embedded in the output. Supply only a public pk. or tk.
token, never a secret sk. token.`);
}

function loadGeneratedConfig() {
  const configPath = path.join(ROOT, "config.generated.js");
  const sandbox = { window: {} };
  vm.runInNewContext(readText(configPath), sandbox, { filename: configPath });
  if (!isPlainObject(sandbox.window.__PDC_CONFIG__)) {
    fail("config.generated.js did not assign window.__PDC_CONFIG__.");
  }
  return clone(sandbox.window.__PDC_CONFIG__);
}

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (isPlainObject(value) && isPlainObject(target[key])) {
      target[key] = deepMerge({ ...target[key] }, value);
    } else {
      target[key] = clone(value);
    }
  }
  return target;
}

function loadConfigOverride(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const extension = path.extname(absolutePath).toLowerCase();
  const source = readText(absolutePath);
  let parsed;

  if (extension === ".json") {
    parsed = JSON.parse(source);
  } else if (extension === ".yaml" || extension === ".yml") {
    parsed = require("js-yaml").load(source);
  } else {
    fail("--config must reference a JSON, YAML, or YML file.");
  }

  if (!isPlainObject(parsed)) {
    fail("The configuration override must be an object.");
  }
  return parsed;
}

function parseConfigValue(rawValue) {
  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue;
  }
}

function setConfigValue(config, assignment) {
  const separator = assignment.indexOf("=");
  if (separator <= 0) {
    fail(`Invalid --set value: ${assignment}. Use path=value.`);
  }

  const segments = assignment.slice(0, separator).split(".").filter(Boolean);
  if (!segments.length) {
    fail(`Invalid configuration path: ${assignment}`);
  }

  let target = config;
  for (const segment of segments.slice(0, -1)) {
    if (!isPlainObject(target[segment])) {
      target[segment] = {};
    }
    target = target[segment];
  }
  target[segments.at(-1)] = parseConfigValue(assignment.slice(separator + 1));
}

function applyOptions(config, options) {
  if (options.configPath) {
    deepMerge(config, loadConfigOverride(options.configPath));
  }

  config.apis = isPlainObject(config.apis) ? config.apis : {};
  config.apis.geocoding = isPlainObject(config.apis.geocoding) ? config.apis.geocoding : {};
  config.features = isPlainObject(config.features) ? config.features : {};
  config.map = isPlainObject(config.map) ? config.map : {};
  config.timezone = isPlainObject(config.timezone) ? config.timezone : {};

  if (options.mapboxToken && options.geocodingUrl) {
    fail("Use either --mapbox-token or --geocoding-url, not both.");
  }

  if (options.mapboxToken) {
    if (!/^(pk|tk)\./.test(options.mapboxToken)) {
      fail("--mapbox-token must be a public pk. or temporary tk. Mapbox token.");
    }
    config.mapbox = isPlainObject(config.mapbox) ? config.mapbox : {};
    config.mapbox.accessToken = options.mapboxToken;
    config.apis.geocoding.enabled = true;
    config.apis.geocoding.baseUrl = "pdc-mapbox://geocoding";
  }

  if (options.geocodingUrl) {
    config.apis.geocoding.enabled = true;
    config.apis.geocoding.baseUrl = options.geocodingUrl;
  }

  if (options.center) {
    const [latitude, longitude, extra] = options.center.split(",").map((value) => Number(value.trim()));
    if (extra !== undefined || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      fail("--center must be a latitude,longitude pair.");
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      fail("--center coordinates are outside their valid ranges.");
    }
    config.map.defaultCenter = { lat: latitude, lon: longitude };
  }

  if (options.timezone) {
    config.timezone.default = options.timezone;
  }

  for (const assignment of options.sets) {
    setConfigValue(config, assignment);
  }

  if (options.noMap) {
    config.features.map = false;
    config.features.splitView = false;
    config.features.locationTagging = false;
  }

  return config;
}

function collectResources(options) {
  const resources = {};

  function addFile(absolutePath) {
    if (!isWithinRoot(absolutePath)) {
      fail(`Cannot include a file outside the project: ${absolutePath}`);
    }
    resources[toPosixPath(path.relative(ROOT, absolutePath))] = readText(absolutePath);
  }

  function walk(relativeDirectory) {
    const absoluteDirectory = projectPath(relativeDirectory);
    if (!fs.existsSync(absoluteDirectory)) {
      return;
    }
    for (const entry of fs.readdirSync(absoluteDirectory, { withFileTypes: true })) {
      const absolutePath = path.join(absoluteDirectory, entry.name);
      if (entry.isDirectory()) {
        walk(toPosixPath(path.relative(ROOT, absolutePath)));
      } else if (entry.isFile() && RESOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        addFile(absolutePath);
      }
    }
  }

  RESOURCE_DIRECTORIES.forEach(walk);
  for (const includePath of options.includes) {
    addFile(projectPath(includePath));
  }

  return resources;
}

function readRuntimeScripts() {
  const manifestPath = path.join(ROOT, "src/js/runtime/runtime-manifest.js");
  const manifest = readText(manifestPath);
  const scriptPaths = [...manifest.matchAll(/["']([^"']+\.js)["']/g)].map((match) => match[1]);
  if (!scriptPaths.length) {
    fail("Unable to read runtime scripts from runtime-manifest.js.");
  }

  return Object.fromEntries(scriptPaths.map((scriptPath) => [scriptPath, readText(projectPath(scriptPath))]));
}

function mimeType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function dataUri(absolutePath) {
  return `data:${mimeType(absolutePath)};base64,${fs.readFileSync(absolutePath).toString("base64")}`;
}

function localCssPath(rawUrl, baseDirectory) {
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith("#") || /^(data:|https?:|\/\/)/i.test(trimmed)) {
    return null;
  }

  const suffixIndex = trimmed.search(/[?#]/);
  const pathname = suffixIndex === -1 ? trimmed : trimmed.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : trimmed.slice(suffixIndex);
  const absolutePath = path.resolve(baseDirectory, pathname);
  if (!isWithinRoot(absolutePath) || !fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    return null;
  }
  return { absolutePath, suffix };
}

function inlineCss(relativePath, ancestry = []) {
  const absolutePath = projectPath(relativePath);
  if (ancestry.includes(absolutePath)) {
    fail(`Circular CSS import: ${[...ancestry, absolutePath].map(toPosixPath).join(" -> ")}`);
  }

  const baseDirectory = path.dirname(absolutePath);
  let css = readText(absolutePath);
  css = css.replace(
    /@import\s+(?:url\(\s*)?(?:"([^"]+)"|'([^']+)')\s*\)?\s*;/gi,
    (match, doubleQuoted, singleQuoted) => {
      const imported = localCssPath(doubleQuoted || singleQuoted, baseDirectory);
      if (!imported || path.extname(imported.absolutePath).toLowerCase() !== ".css") {
        return match;
      }
      return inlineCss(toPosixPath(path.relative(ROOT, imported.absolutePath)), [...ancestry, absolutePath]);
    }
  );

  return css.replace(
    /url\(\s*(?:"([^"]*)"|'([^']*)'|([^'"\s)][^)]*))\s*\)/gi,
    (match, doubleQuoted, singleQuoted, unquoted) => {
      const asset = localCssPath(doubleQuoted ?? singleQuoted ?? unquoted, baseDirectory);
      return asset ? `url("${dataUri(asset.absolutePath)}${asset.suffix}")` : match;
    }
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceRequired(html, pattern, replacement, description) {
  let matches = 0;
  const result = html.replace(pattern, (...args) => {
    matches += 1;
    return typeof replacement === "function" ? replacement(...args) : replacement;
  });
  if (matches !== 1) {
    fail(`Expected one ${description} in index.html; found ${matches}.`);
  }
  return result;
}

function replaceStylesheet(html, href, css) {
  const pattern = new RegExp(`<link\\b[^>]*\\bhref\\s*=\\s*(["'])${escapeRegExp(href)}\\1[^>]*>`, "i");
  return replaceRequired(html, pattern, `<style>\n${css}\n</style>`, `stylesheet ${href}`);
}

function replaceIconHref(html, href, absolutePath) {
  const pattern = new RegExp(`(<link\\b[^>]*\\bhref\\s*=\\s*["'])${escapeRegExp(href)}(["'][^>]*>)`, "i");
  return replaceRequired(
    html,
    pattern,
    (match, prefix, suffix) => `${prefix}${dataUri(absolutePath)}${suffix}`,
    `icon ${href}`
  );
}

function replaceScript(html, src, replacement) {
  const pattern = new RegExp(
    `<script\\b[^>]*\\bsrc\\s*=\\s*(["'])${escapeRegExp(src)}\\1[^>]*>[\\s\\S]*?<\\/script>`,
    "i"
  );
  return replaceRequired(html, pattern, replacement, `script ${src}`);
}

function escapeInlineScript(source) {
  return source.replace(/<\/script/gi, "<\\/script");
}

function serializeForInlineScript(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function packageBootstrap(resources, runtimeScripts) {
  return `window.__PDC_PACKAGED_RESOURCES__ = ${serializeForInlineScript(resources)};
window.__PDC_PACKAGED_RUNTIME_SCRIPTS__ = ${serializeForInlineScript(runtimeScripts)};
(function () {
  const resources = window.__PDC_PACKAGED_RESOURCES__;
  const runtimeConfig = window.__PDC_CONFIG__ || {};
  const directMapboxPrefix = "pdc-mapbox://geocoding/";
  const nativeFetch = window.fetch.bind(window);

  function resourceKey(input) {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input && input.url;
    if (!raw) return null;
    const directKey = raw.split(/[?#]/, 1)[0];
    if (Object.prototype.hasOwnProperty.call(resources, directKey)) return directKey;
    try {
      const target = new URL(raw, document.baseURI);
      if (target.protocol === "file:" || target.origin === window.location.origin) {
        const basePath = decodeURIComponent(new URL(".", document.baseURI).pathname);
        const targetPath = decodeURIComponent(target.pathname);
        const relative = targetPath.startsWith(basePath)
          ? targetPath.slice(basePath.length)
          : targetPath.replace(/^\\/+/, "");
        return relative.replace(/^\\.\\//, "");
      }
    } catch (_) {
      return directKey.replace(/^\\.\\//, "").replace(/^\\//, "");
    }
    return directKey.replace(/^\\.\\//, "").replace(/^\\//, "");
  }

  function resourceType(key) {
    if (/\\.json$/i.test(key)) return "application/json";
    if (/\\.md$/i.test(key)) return "text/markdown";
    if (/\\.ya?ml$/i.test(key)) return "text/yaml";
    return "text/html";
  }

  function jsonResponse(value, status) {
    return new Response(JSON.stringify(value), {
      status: status || 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  function featureCoordinates(feature) {
    const coordinates = feature && feature.properties && feature.properties.coordinates;
    if (coordinates && Number.isFinite(coordinates.latitude) && Number.isFinite(coordinates.longitude)) {
      return { lat: coordinates.latitude, lon: coordinates.longitude };
    }
    const geometry = feature && feature.geometry && feature.geometry.coordinates;
    if (Array.isArray(geometry) && Number.isFinite(geometry[0]) && Number.isFinite(geometry[1])) {
      return { lat: geometry[1], lon: geometry[0] };
    }
    return null;
  }

  function contextName(context, key) {
    if (!context) return "";
    if (Array.isArray(context)) {
      const match = context.find((item) => item && (item.feature_type === key || item.id === key));
      return match && (match.name || match.text) || "";
    }
    const item = context[key];
    return item && (item.name || item.text) || "";
  }

  function featureLabel(feature) {
    const properties = feature && feature.properties || {};
    return properties.full_address || [properties.name || properties.name_preferred, properties.place_formatted]
      .filter(Boolean)
      .join(", ") || feature && (feature.place_name || feature.text) || "";
  }

  async function fetchMapbox(endpoint, init) {
    const token = runtimeConfig.mapbox && runtimeConfig.mapbox.accessToken;
    if (!token) return jsonResponse({ message: "Missing packaged Mapbox token." }, 500);

    let body = {};
    try {
      body = init && init.body ? JSON.parse(init.body) : {};
    } catch (_) {}

    let requestUrl;
    if (endpoint === "reverse") {
      requestUrl = new URL("https://api.mapbox.com/search/geocode/v6/reverse");
      requestUrl.searchParams.set("longitude", String(body.longitude));
      requestUrl.searchParams.set("latitude", String(body.latitude));
    } else {
      requestUrl = new URL("https://api.mapbox.com/search/geocode/v6/forward");
      requestUrl.searchParams.set("q", String(body.search || ""));
      requestUrl.searchParams.set("autocomplete", "true");
      requestUrl.searchParams.set("limit", "5");
    }
    requestUrl.searchParams.set("access_token", token);

    const response = await nativeFetch(requestUrl.href);
    if (!response.ok) return response;

    const payload = await response.json();
    const features = Array.isArray(payload.features) ? payload.features : [];

    if (endpoint === "autocomplete") {
      return jsonResponse({
        suggestions: features.map((feature) => {
          const properties = feature.properties || {};
          const mainText = properties.name || properties.name_preferred || feature.text || featureLabel(feature);
          const secondaryText = properties.place_formatted || "";
          const label = featureLabel(feature) || mainText;
          const coordinates = featureCoordinates(feature);
          return {
            placePrediction: {
              structuredFormat: {
                mainText: { text: mainText },
                secondaryText: { text: secondaryText },
              },
              text: { text: label },
              location: coordinates && {
                label,
                displayLabel: label,
                lat: coordinates.lat,
                lon: coordinates.lon,
                source: "mapbox",
                addressLabel: label,
              },
            },
          };
        }),
      });
    }

    if (endpoint === "search") {
      return jsonResponse({
        results: features.map((feature) => {
          const coordinates = featureCoordinates(feature);
          if (!coordinates) return null;
          return {
            formatted_address: featureLabel(feature),
            geometry: { location: { lat: coordinates.lat, lng: coordinates.lon } },
          };
        }).filter(Boolean),
      });
    }

    const feature = features[0];
    const properties = feature && feature.properties || {};
    const context = properties.context || feature && feature.context;
    const name = properties.name || properties.name_preferred || featureLabel(feature);
    return jsonResponse({
      result: feature ? [{
        address: featureLabel(feature),
        structuredAddress: {
          addressLines: name ? [name] : [],
          locality: contextName(context, "locality") || contextName(context, "place"),
          administrativeArea: contextName(context, "region"),
        },
      }] : [],
    });
  }

  window.fetch = function (input, init) {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input && input.url;
    const key = resourceKey(input);
    if (key && Object.prototype.hasOwnProperty.call(resources, key)) {
      return Promise.resolve(new Response(resources[key], {
        status: 200,
        headers: { "Content-Type": resourceType(key) },
      }));
    }
    if (raw && raw.startsWith(directMapboxPrefix)) {
      return fetchMapbox(raw.slice(directMapboxPrefix.length).split(/[?#]/, 1)[0], init);
    }
    return nativeFetch(input, init);
  };
})();`;
}

function bundleApplication(options) {
  const temporaryOutput = path.join(os.tmpdir(), `pdc-package-${process.pid}-${Date.now()}.js`);
  try {
    const args = ["bun", "build", "app.js", "--target=browser", "--format=esm", "--outfile", temporaryOutput];
    if (options.minify) args.push("--minify");
    execFileSync("npx", args, { cwd: ROOT, stdio: "inherit" });
    return readText(temporaryOutput);
  } finally {
    fs.rmSync(temporaryOutput, { force: true });
  }
}

function getStandaloneCsp(config) {
  const imageSources = new Set(["data:", "https:"]);
  const connectSources = new Set(["https:"]);

  function addNetworkScheme(value, sources) {
    const raw = String(value || "").trim();
    if (/^http:\/\//i.test(raw)) sources.add("http:");
    if (/^wss:\/\//i.test(raw)) sources.add("wss:");
    if (/^ws:\/\//i.test(raw)) sources.add("ws:");
  }

  addNetworkScheme(config.apis?.geocoding?.baseUrl, connectSources);
  for (const style of config.map?.styles || []) {
    addNetworkScheme(style?.url, imageSources);
  }

  return `default-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src ${[...imageSources].join(" ")}; font-src data:; connect-src ${[...connectSources].join(" ")}; media-src data: https:; frame-src 'none'; worker-src 'none'`;
}

function updateStandaloneCsp(html, config) {
  const csp = getStandaloneCsp(config);
  return replaceRequired(
    html,
    /<meta\b[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i,
    (match) => {
      const contentAttribute = /\bcontent\s*=\s*(["'])[\s\S]*?\1/i;
      if (!contentAttribute.test(match)) {
        fail("The Content-Security-Policy meta tag has no content attribute.");
      }
      return match.replace(contentAttribute, `content="${csp}"`);
    },
    "Content-Security-Policy meta tag"
  );
}

function buildHtml(config, resources, runtimeScripts, appBundle) {
  let html = updateStandaloneCsp(readText(path.join(ROOT, "index.html")), config);

  for (const stylesheet of STYLESHEETS) {
    html = replaceStylesheet(html, stylesheet, inlineCss(stylesheet));
  }

  for (const icon of ["favicon.ico", "favicon.svg", "apple-touch-icon.png"]) {
    html = replaceIconHref(html, icon, projectPath(icon));
  }

  for (const scriptPath of CLASSIC_SCRIPTS) {
    html = replaceScript(html, scriptPath, `<script>${escapeInlineScript(readText(projectPath(scriptPath)))}</script>`);
  }

  const configSource = `window.__PDC_CONFIG__ = ${serializeForInlineScript(config)};`;
  const bootstrapSource = packageBootstrap(resources, runtimeScripts);
  html = replaceScript(
    html,
    "config.generated.js",
    `<script>${configSource}</script>\n<script>${escapeInlineScript(bootstrapSource)}</script>`
  );
  html = replaceScript(html, "app.js", `<script type="module">${escapeInlineScript(appBundle)}</script>`);

  if (/<script\b[^>]*\bsrc\s*=/i.test(html)) {
    fail("The package still contains an external script reference.");
  }
  if (/<link\b[^>]*\brel\s*=\s*["']stylesheet["']/i.test(html)) {
    fail("The package still contains an external stylesheet reference.");
  }

  return html;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const config = applyOptions(loadGeneratedConfig(), options);
  const resources = collectResources(options);
  const runtimeScripts = readRuntimeScripts();
  const appBundle = bundleApplication(options);
  const html = buildHtml(config, resources, runtimeScripts, appBundle);

  fs.mkdirSync(path.dirname(options.output), { recursive: true });
  fs.writeFileSync(options.output, html, "utf8");

  console.log(`Created ${path.relative(ROOT, options.output) || options.output}`);
  console.log(`${Object.keys(resources).length} fetched resources and ${Object.keys(runtimeScripts).length} runtime scripts embedded.`);
  if (options.mapboxToken) {
    console.log("Direct Mapbox Geocoding v6 is enabled with the embedded public token.");
  }
}

try {
  main();
} catch (error) {
  console.error(`pdc bundle: ${error.message}`);
  process.exitCode = 1;
}
