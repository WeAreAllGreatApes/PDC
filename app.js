import { composeAllGroups } from "./src/js/core/component-loader.js";
import { getLayoutComponents } from "./src/js/sections/layout.js";
import { getHomeComponents } from "./src/js/sections/home.js";
import { getTabComponents } from "./src/js/sections/tabs.js";
import { getModalComponents } from "./src/js/sections/modals.js";
import { RUNTIME_SCRIPT_ORDER } from "./src/js/runtime/runtime-manifest.js";

function preloadRuntimeScripts() {
  RUNTIME_SCRIPT_ORDER.forEach((scriptPath) => {
    if (document.head.querySelector(`link[rel="preload"][as="script"][href="${scriptPath}"]`)) {
      return;
    }
    const preload = document.createElement("link");
    preload.rel = "preload";
    preload.as = "script";
    preload.href = scriptPath;
    document.head.appendChild(preload);
  });
}

function setBootState(state, message) {
  if (document.body) {
    document.body.dataset.appBootState = state;
  }
  if (message) {
    const label = document.querySelector("[data-app-boot-label]");
    if (label) {
      label.textContent = message;
    }
  }
}

function hideBootSplash() {
  const splash = document.querySelector("[data-app-boot-splash]");
  if (!splash) {
    return;
  }
  window.setTimeout(() => {
    splash.hidden = true;
  }, 220);
}

async function composeApplicationShell() {
  await composeAllGroups([
    getLayoutComponents(),
    getHomeComponents(),
    getTabComponents(),
    getModalComponents(),
  ]);
}

function loadClassicScript(path) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = path;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load runtime script: ${path}`));
    document.body.appendChild(script);
  });
}

async function startRuntime() {
  for (const scriptPath of RUNTIME_SCRIPT_ORDER) {
    await loadClassicScript(scriptPath);
  }
}

async function bootstrapApp() {
  setBootState("booting", "Loading workspace...");
  preloadRuntimeScripts();
  await composeApplicationShell();
  await startRuntime();
  setBootState("ready");
  hideBootSplash();
}

bootstrapApp().catch((error) => {
  console.error("[pdc] Failed to bootstrap application shell.", error);
  setBootState("error", "Unable to load workspace.");
  window.alert(
    "This page failed to initialize correctly. Please reload and check console logs for details."
  );
});
