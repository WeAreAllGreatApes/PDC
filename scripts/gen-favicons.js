#!/usr/bin/env node
/* Renders favicon.svg to PNG sizes via headless Chrome and assembles
   favicon.ico (PNG-compressed entry). Usage: node scripts/gen-favicons.js */
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const CDP_PORT = 9333;
const ROOT = `${__dirname}/..`;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SIZES = [16, 32, 180]; // 16+32 -> ico, 180 -> apple-touch-icon
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
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  };
  return {
    send(method, params = {}) {
      return new Promise((res) => {
        const mid = ++id;
        pending.set(mid, res);
        ws.send(JSON.stringify({ id: mid, method, params }));
      });
    },
    close: () => ws.close(),
  };
}

function buildIco(pngs) {
  // ICO container with PNG-compressed entries.
  const entries = Object.entries(pngs); // [[sizeStr, Buffer], ...]
  const header = Buffer.alloc(6 + 16 * entries.length);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4); // count
  let offset = header.length;
  entries.forEach(([sizeStr, png], i) => {
    const size = Number(sizeStr);
    const e = 6 + 16 * i;
    header.writeUInt8(size === 256 ? 0 : size, e);     // width
    header.writeUInt8(size === 256 ? 0 : size, e + 1); // height
    header.writeUInt8(0, e + 2);  // palette
    header.writeUInt8(0, e + 3);  // reserved
    header.writeUInt16LE(1, e + 4);   // color planes
    header.writeUInt16LE(32, e + 6);  // bits per pixel
    header.writeUInt32LE(png.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...entries.map(([, png]) => png)]);
}

(async () => {
  const chrome = spawn(CHROME, [
    "--headless=new",
    `--remote-debugging-port=${CDP_PORT}`,
    "--no-first-run", "--no-default-browser-check", "--disable-gpu",
    "--user-data-dir=/var/folders/7y/k9lsr7fs5_g78mf1zscd42v80000gn/T/opencode/chrome-profile-favicons",
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

    const svgPath = path.join(ROOT, "favicon.svg");
    const svg = fs.readFileSync(svgPath, "utf8");
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

    const pngs = {};
    for (const size of SIZES) {
      await c.send("Emulation.setDeviceMetricsOverride", {
        width: size, height: size, deviceScaleFactor: 1, mobile: false,
      });
      await c.send("Page.navigate", { url: "about:blank" });
      await sleep(200);
      await c.send("Runtime.evaluate", {
        expression: `document.open(); document.write('<style>html,body{margin:0;padding:0;background:transparent}img{display:block;width:${size}px;height:${size}px}</style><img src="${dataUrl}">'); document.close(); "ok"`,
      });
      await sleep(400);
      const shot = await c.send("Page.captureScreenshot", {
        format: "png", clip: { x: 0, y: 0, width: size, height: size, scale: 1 },
        captureBeyondViewport: false,
      });
      pngs[size] = Buffer.from(shot.result.data, "base64");
    }

    fs.writeFileSync(path.join(ROOT, "favicon-32.png"), pngs[32]);
    fs.writeFileSync(path.join(ROOT, "apple-touch-icon.png"), pngs[180]);
    fs.writeFileSync(
      path.join(ROOT, "favicon.ico"),
      buildIco({ 16: pngs[16], 32: pngs[32] })
    );
    for (const [size, buf] of Object.entries(pngs)) {
      console.log(`${size}px: ${buf.length} bytes`);
    }
    console.log("Wrote favicon.ico, favicon-32.png, apple-touch-icon.png");
    c.close();
  } finally {
    chrome.kill();
  }
})();
