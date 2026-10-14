#!/usr/bin/env node
/* Headless-Chrome smoke test: loads the app, forces light/dark via CDP,
   reports computed styles of previously-broken selectors + console errors. */
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const CONTENT_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".yaml": "text/yaml",
  ".md": "text/markdown",
  ".woff2": "font/woff2",
};

function getJSON(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => {
      if (r.statusCode < 200 || r.statusCode >= 300) {
        r.resume();
        rej(new Error(`HTTP ${r.statusCode} from ${url}`));
        return;
      }
      let d = "";
      r.on("data", (c) => (d += c));
      r.on("end", () => {
        try {
          res(JSON.parse(d));
        } catch (error) {
          rej(error);
        }
      });
    }).on("error", rej);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function startStaticServer() {
  const server = http.createServer((req, res) => {
    let urlPath;
    try {
      urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("bad request");
      return;
    }

    const filePath = path.resolve(ROOT, urlPath === "/" ? "index.html" : `.${urlPath}`);
    const withinRoot = filePath === ROOT || filePath.startsWith(`${ROOT}${path.sep}`);
    if (!withinRoot) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(`not found: ${urlPath}`);
      return;
    }

    try {
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end(`not found: ${urlPath}`);
        return;
      }
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(`not found: ${urlPath}`);
      return;
    }

    res.writeHead(200, {
      "Content-Type": CONTENT_TYPES[path.extname(filePath)] || "application/octet-stream",
    });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve, reject) => {
    const onError = (error) => reject(error);
    server.once("error", onError);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", onError);
      resolve(server);
    });
  });
}

function closeServer(server) {
  if (!server || !server.listening) return Promise.resolve();
  return new Promise((resolve) => server.close(() => resolve()));
}

function stopProcess(proc) {
  if (!proc || proc.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (proc.exitCode === null) proc.kill("SIGKILL");
      resolve();
    }, 1000);
    proc.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
    proc.kill("SIGTERM");
  });
}

async function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    else if (msg.method) events.push(msg);
  };
  return {
    send(method, params = {}) {
      return new Promise((res) => {
        const mid = ++id;
        pending.set(mid, res);
        ws.send(JSON.stringify({ id: mid, method, params }));
      });
    },
    events,
    close: () => ws.close(),
  };
}

async function waitForPage(chrome, port, chromeState) {
  let lastError;
  for (let i = 0; i < 30; i++) {
    if (chromeState.error) throw chromeState.error;
    if (chrome.exitCode !== null) {
      throw new Error(`Chrome exited before DevTools became available (code ${chrome.exitCode})`);
    }
    await sleep(300);
    try {
      const targets = await getJSON(`http://127.0.0.1:${port}/json`);
      const page = targets.find((target) => target.type === "page");
      if (page) return page;
      lastError = new Error("Chrome returned no page target");
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(
    `Chrome DevTools did not become available on port ${port}: ${lastError?.message || "unknown error"}`
  );
}

async function evaluate(c, expression) {
  const response = await c.send("Runtime.evaluate", { expression, returnByValue: true });
  if (response.error) {
    throw new Error(response.error.message || "CDP evaluation failed");
  }
  if (response.result?.exceptionDetails) {
    const details = response.result.exceptionDetails;
    throw new Error(details.text || details.exception?.description || "Page evaluation failed");
  }
  return response.result?.result?.value;
}

async function navigate(c, url) {
  const response = await c.send("Page.navigate", { url });
  if (response.error) {
    throw new Error(response.error.message || `Navigation failed: ${url}`);
  }
  if (response.result?.errorText) {
    throw new Error(`${response.result.errorText}: ${url}`);
  }
}

async function waitForApp(c, appUrl) {
  let lastState = "unavailable";
  for (let i = 0; i < 80; i++) {
    let state;
    try {
      state = JSON.parse(await evaluate(c, `JSON.stringify({
        href: window.location.href,
        boot: document.body?.dataset.appBootState || "",
      })`));
      lastState = `${state.href} (${state.boot || "no boot state"})`;
    } catch (error) {
      lastState = error.message;
    }
    if (state?.href === appUrl && state.boot === "ready") return;
    if (state?.href === appUrl && state.boot === "error") {
      throw new Error("the app reported an initialization error");
    }
    await sleep(100);
  }
  throw new Error(`App did not reach ready state at ${appUrl}; last state: ${lastState}`);
}

const PROBE = `(function(){
  const cs = (sel, prop) => {
    const el = document.querySelector(sel);
    return el ? getComputedStyle(el)[prop] : "MISSING:" + sel;
  };
  const root = getComputedStyle(document.documentElement);
  const body = getComputedStyle(document.body);
  return JSON.stringify({
    title: document.title,
    modalPosition: cs(".modal", "position"),
    columnsDisplay: cs(".columns", "display"),
    tabsDisplay: cs(".tabs", "display"),
    bodyBackground: body.backgroundImage !== "none"
      ? body.backgroundImage.slice(0, 60)
      : body.backgroundColor,
    ink: root.getPropertyValue("--ink").trim(),
    selected: root.getPropertyValue("--selected").trim(),
    cardLevel2: root.getPropertyValue("--card-level-2-bg").trim(),
    warningBg: root.getPropertyValue("--warning-bg").trim(),
    noteBg: root.getPropertyValue("--note-bg").trim(),
    sheetRules: [...document.styleSheets].map(s => { try { return s.cssRules.length } catch(e){ return "blocked" } }),
  });
})()`;

async function runTheme(c, scheme) {
  await c.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: scheme }],
  });
  await sleep(150);
  const probe = JSON.parse(await evaluate(c, PROBE));
  console.log(`\n=== ${scheme.toUpperCase()} ===`);
  console.log(JSON.stringify(probe));
  const missing = [
    "title",
    "modalPosition",
    "columnsDisplay",
    "tabsDisplay",
    "bodyBackground",
    "ink",
    "selected",
    "cardLevel2",
    "warningBg",
    "noteBg",
  ].filter((key) => !probe[key] || String(probe[key]).startsWith("MISSING:"));
  if (missing.length) {
    throw new Error(`${scheme} probe is incomplete: ${missing.join(", ")}`);
  }
  const errs = c.events.filter(
    (m) => m.method === "Log.entryAdded" && m.params.entry.level === "error"
  ).filter((m) => !/beforeunload/.test(m.params.entry.text));
  for (const e of errs) console.log(`CONSOLE ERROR: ${e.params.entry.text}`);
  return errs.map((e) => e.params.entry.text);
}

(async () => {
  let server;
  let proc;
  let c;
  let profile;

  try {
    server = await startStaticServer();
    const appPort = server.address().port;
    const appUrl = `http://127.0.0.1:${appPort}/index.html`;
    const cdpPort = await getFreePort();
    profile = fs.mkdtempSync(path.join(os.tmpdir(), "pdc-smoke-chrome-"));
    proc = spawn(CHROME, [
      "--headless=new",
      `--remote-debugging-port=${cdpPort}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      `--user-data-dir=${profile}`,
      "about:blank",
    ], { stdio: "ignore" });
    const chromeState = { error: null };
    proc.once("error", (error) => { chromeState.error = error; });

    const page = await waitForPage(proc, cdpPort, chromeState);
    c = await cdp(page.webSocketDebuggerUrl);
    await c.send("Page.enable");
    await c.send("Log.enable");
    await c.send("Runtime.enable");
    await c.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-color-scheme", value: "light" }],
    });
    await navigate(c, appUrl);
    await waitForApp(c, appUrl);
    const errors = await runTheme(c, "light");
    c.events.length = 0;
    await c.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-color-scheme", value: "dark" }],
    });
    await sleep(150);
    await waitForApp(c, appUrl);
    errors.push(...(await runTheme(c, "dark")));
    if (errors.length) {
      throw new Error(`${errors.length} unexpected console error(s)`);
    }
    console.log("\nOK: smoke render passed");
  } finally {
    if (c) c.close();
    await stopProcess(proc);
    await closeServer(server);
    if (profile) fs.rmSync(profile, { recursive: true, force: true });
  }
})();
