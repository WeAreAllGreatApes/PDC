#!/usr/bin/env node
/* Loads the app headless, enters the workspace, and records every HTTP >=400
   response plus console errors / uncaught exceptions.
   Usage: node scripts/audit-network.js */
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const CDP_PORT = 9333;
const APP_PORT = 8742;
const ROOT = `${__dirname}/..`;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJSON(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => {
      let d = "";
      r.on("data", (c) => (d += c));
      r.on("end", () => res(JSON.parse(d)));
    }).on("error", rej);
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

(async () => {
  const staticServer = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let filePath = `${ROOT}${urlPath === "/" ? "/index.html" : urlPath}`;
    const notFound = () => {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(`not found: ${urlPath}`);
    };
    if (!filePath.startsWith(ROOT)) return notFound();
    try {
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return notFound();
    } catch {
      return notFound();
    }
    const types = {
      ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
      ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
      ".ico": "image/x-icon", ".yaml": "text/yaml", ".md": "text/markdown",
      ".woff2": "font/woff2",
    };
    res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });
  await new Promise((r) => staticServer.listen(APP_PORT, r));

  const chrome = spawn(CHROME, [
    "--headless=new",
    `--remote-debugging-port=${CDP_PORT}`,
    "--no-first-run", "--no-default-browser-check", "--disable-gpu",
    "--user-data-dir=/var/folders/7y/k9lsr7fs5_g78mf1zscd42v80000gn/T/opencode/chrome-profile-audit",
    "about:blank",
  ], { stdio: "ignore" });

  try {
    let targets;
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      try { targets = await getJSON(`http://localhost:${CDP_PORT}/json`); break; } catch {}
    }
    const page = targets.find((t) => t.type === "page");
    const c = await cdp(page.webSocketDebuggerUrl);
    await c.send("Page.enable");
    await c.send("Log.enable");
    await c.send("Runtime.enable");
    await c.send("Network.enable");
    await c.send("Page.navigate", { url: `http://localhost:${APP_PORT}/` });
    await sleep(3000);

    // Enter the workspace like a user (dispatch tab card).
    await c.send("Runtime.evaluate", {
      expression: `document.querySelector('button.card[data-tab="dispatch"]')?.click(); "ok"`,
      returnByValue: true,
    });
    await sleep(4000);

    const bad = [];
    for (const m of c.events) {
      if (m.method === "Network.responseReceived") {
        const { status, url } = m.params.response;
        if (status >= 400) bad.push(`${status}  ${url.replace(`http://localhost:${APP_PORT}`, "")}`);
      }
      if (m.method === "Log.entryAdded" && m.params.entry.level === "error") {
        const text = m.params.entry.text;
        // Known-benign: intentional beforeunload guard fires without user
        // gesture under headless automation; real browsers show the dialog.
        if (/beforeunload/.test(text)) continue;
        bad.push(`console: ${text} (${m.params.entry.url || "inline"}:${m.params.entry.lineNumber ?? "?"})`);
      }
      if (m.method === "Runtime.exceptionThrown") {
        const d = m.params.exceptionDetails;
        bad.push(`exception: ${d.exception?.description || d.text} @ ${d.url || "?"}:${d.lineNumber ?? "?"}`);
      }
    }

    // Also probe the classic favicon path directly.
    const fav = await new Promise((res) => {
      http.get(`http://localhost:${APP_PORT}/favicon.ico`, (r) => res(r.statusCode)).on("error", () => res("ERR"));
    });
    if (fav !== 200) bad.push(`${fav}  /favicon.ico (implicit browser request)`);

    console.log(bad.length ? `ISSUES (${bad.length}):\n${[...new Set(bad)].join("\n")}` : "OK: no failed requests, console errors, or exceptions");
    c.close();
  } finally {
    chrome.kill();
    staticServer.close();
  }
})();
