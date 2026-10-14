#!/usr/bin/env node
/*
  CSS sanity checks for the token system:
    1. Balanced braces/parens per file
    2. Every var(--x) reference resolves to a definition
    3. Report tokens that are defined but never used
    4. Report hardcoded colors outside variables.css (audit aid)
*/
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CSS_DIR = path.join(ROOT, "src", "css");
const ENTRY = path.join(ROOT, "styles.css");

const files = [];
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".css")) files.push(p);
  }
}
walk(CSS_DIR);
files.push(ENTRY);

let failures = 0;
const defined = new Map(); // name -> [file:line]
const used = new Map();

// Variables injected at runtime via JS style.setProperty() -- not expected in CSS
const JS_PROVIDED = new Set([
  "--map-inactive-label-opacity",
  "--location-overlay-right-inset",
]);

function trackVars(src, file) {
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    const stripped = line.replace(/\/\*.*?\*\//g, "");
    // definition: "  --foo:" at declaration position
    const defMatch = stripped.match(/^\s*(--[a-z0-9-]+)\s*:/i);
    if (defMatch) {
      const name = defMatch[1];
      if (!defined.has(name)) defined.set(name, []);
      defined.get(name).push(`${file}:${i + 1}`);
    }
    // usage: var(--foo)
    for (const m of stripped.matchAll(/var\((--[a-z0-9-]+)/gi)) {
      const name = m[1];
      if (!used.has(name)) used.set(name, new Set());
      used.get(name).add(`${file}:${i + 1}`);
    }
  });
}

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const src = fs.readFileSync(file, "utf8");
  const base = 0;

  // 1. balance
  let depth = 0, paren = 0, ok = true;
  for (const ch of src) {
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth < 0) ok = false; }
    else if (ch === "(") paren++;
    else if (ch === ")") paren--;
  }
  if (depth !== 0 || paren !== 0 || !ok) {
    console.log(`FAIL balance ${rel}: braces=${depth} parens=${paren}`);
    failures++;
  }

  // @import must end with ;
  src.replace(/@import[^;]*$/gm, (m, off) => {
    console.log(`FAIL ${rel}: @import missing ';' near "${m.slice(0, 40)}"`);
    failures++;
    return m;
  });

  // double semicolons
  let idx = 0;
  while ((idx = src.indexOf(";;", idx)) !== -1) {
    const line = src.slice(0, idx).split("\n").length;
    console.log(`WARN ${rel}:${line} double semicolon`);
    idx += 2;
  }

  trackVars(src, rel, base);
}

// 2. resolve references
const definedNames = new Set(defined.keys());
for (const [name, sites] of used) {
  if (definedNames.has(name) || JS_PROVIDED.has(name)) continue;
  for (const site of sites) {
    console.log(`FAIL undefined variable ${name} used at ${site}`);
    failures++;
  }
}

// 3. unused tokens (info only, ignore per-slot/palette dups)
for (const [name, sites] of defined) {
  if (!used.has(name)) {
    console.log(`INFO token defined but unused: ${name} (${sites[0]})`);
  }
}

// 4. hardcoded colors in components (audit aid)
const ALLOWED_HINTS = /map-pin|palette-chip|color-\d|driver|toast|placement|leaflet/;
for (const file of files) {
  const rel = path.relative(ROOT, file);
  if (rel.endsWith("variables.css")) continue;
  const src = fs.readFileSync(file, "utf8");
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    if (/#[0-9a-fA-F]{3,8}\b/.test(line) && !ALLOWED_HINTS.test(line) && !line.includes("var(--")) {
      console.log(`AUDIT ${rel}:${i + 1}: ${line.trim().slice(0, 90)}`);
    }
  });
}

console.log(failures === 0 ? "\nOK: all checks passed" : `\n${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
