#!/usr/bin/env node
/* Verifies dist/pdc.html boots to "ready" when opened directly via file://.
   Reports console errors, uncaught exceptions, and failed requests. */
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const CDP_PORT = 9334;
const ROOT = path.resolve(__dirname, "..");
const FILE_URL = `file://${path.join(ROOT, "dist", "pdc.html")}`;
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
  const chrome = spawn(CHROME, [
    "--headless=new",
    `--remote-debugging-port=${CDP_PORT}`,
    "--no-first-run", "--no-default-browser-check", "--disable-gpu",
    "--user-data-dir=/var/folders/7y/k9lsr7fs5_g78mf1zscd42v80000gn/T/opencode/chrome-profile-verify-bundle",
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
    await c.send("Page.navigate", { url: FILE_URL });

    let boot = "";
    for (let i = 0; i < 100; i++) {
      await sleep(100);
      const r = await c.send("Runtime.evaluate", {
        expression: "document.body ? document.body.dataset.appBootState || '' : ''",
        returnByValue: true,
      });
      boot = r.result?.result?.value || "";
      if (boot === "ready" || boot === "error") break;
    }

    const probe = await c.send("Runtime.evaluate", {
      expression: `JSON.stringify({
        href: location.protocol + "//" + location.pathname.split("/").pop(),
        slotsFilled: [...document.querySelectorAll("[data-component-slot]")].filter(el => el.children.length).length,
        slotTotal: document.querySelectorAll("[data-component-slot]").length,
        versionLabel: document.querySelector("[data-action-open-version-modal], #versionButton")?.textContent?.trim() || "",
      })`,
      returnByValue: true,
    });

    const bad = [];
    for (const m of c.events) {
      if (m.method === "Network.loadingFailed" && !["BlockedByClient", "Canceled"].includes(m.params.errorText)) {
        bad.push(`request failed: ${m.params.errorText}`);
      }
      if (m.method === "Log.entryAdded" && m.params.entry.level === "error") {
        const text = m.params.entry.text;
        if (/beforeunload/.test(text)) continue;
        bad.push(`console: ${text.slice(0, 200)}`);
      }
      if (m.method === "Runtime.exceptionThrown") {
        const d = m.params.exceptionDetails;
        bad.push(`exception: ${d.exception?.description || d.text}`.slice(0, 240));
      }
    }

    console.log(`boot state: ${boot}`);
    console.log(probe.result?.result?.value || "{}");
    console.log(bad.length ? `ISSUES (${bad.length}):\n${[...new Set(bad)].join("\n")}` : "OK: no failed requests, console errors, or exceptions");
    if (boot !== "ready") process.exitCode = 1;
    if (bad.length) process.exitCode = 1;
    c.close();
  } finally {
    chrome.kill();
  }
})();
