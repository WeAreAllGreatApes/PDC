/*
  Navigation/home view, tutorials, and export flows
  Transitional split from the previous runtime monolith for maintainability.
*/

function getExportStamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showWelcome() {
  welcome.classList.remove("hidden");
  workspace.classList.add("hidden");
  saveViewState({ tab: "welcome" });
}

function saveViewState({ tab }) {
  try {
    localStorage.setItem(VIEW_STATE_KEY, JSON.stringify({ tab }));
  } catch (error) {
    return;
  }
}

function loadViewState() {
  const raw = localStorage.getItem(VIEW_STATE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function loadCompletedTours() {
  try {
    const raw = localStorage.getItem(COMPLETED_TOURS_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveCompletedTours(completed) {
  try {
    localStorage.setItem(COMPLETED_TOURS_KEY, JSON.stringify(completed || {}));
  } catch (error) {
    return;
  }
}

function isTourCompleted(filePath) {
  const completed = loadCompletedTours();
  return Boolean(completed[filePath]);
}

function markTourCompleted(filePath) {
  if (!filePath) {
    return;
  }
  const completed = loadCompletedTours();
  completed[filePath] = new Date().toISOString();
  saveCompletedTours(completed);
}

function loadTourProgressMap() {
  try {
    const raw = localStorage.getItem(TOUR_PROGRESS_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveTourProgressMap(progressMap) {
  try {
    localStorage.setItem(TOUR_PROGRESS_KEY, JSON.stringify(progressMap || {}));
  } catch (error) {
    return;
  }
}

function getTourProgress(filePath) {
  if (!filePath) {
    return null;
  }
  const progressMap = loadTourProgressMap();
  const entry = progressMap[filePath];
  if (!entry || typeof entry !== "object") {
    return null;
  }
  const stepIndex = Number(entry.stepIndex);
  const stepCount = Number(entry.stepCount);
  if (!Number.isFinite(stepIndex) || !Number.isFinite(stepCount) || stepIndex < 0 || stepCount <= 0) {
    return null;
  }
  return {
    stepIndex: Math.floor(stepIndex),
    stepCount: Math.floor(stepCount),
    updatedAt: entry.updatedAt || null,
  };
}

function saveTourProgress(filePath, { stepIndex, stepCount }) {
  if (!filePath) {
    return;
  }
  const normalizedIndex = Number(stepIndex);
  const normalizedCount = Number(stepCount);
  if (
    !Number.isFinite(normalizedIndex) ||
    !Number.isFinite(normalizedCount) ||
    normalizedIndex < 0 ||
    normalizedCount <= 0
  ) {
    return;
  }
  const progressMap = loadTourProgressMap();
  progressMap[filePath] = {
    stepIndex: Math.floor(normalizedIndex),
    stepCount: Math.floor(normalizedCount),
    updatedAt: new Date().toISOString(),
  };
  saveTourProgressMap(progressMap);
}

function clearTourProgress(filePath) {
  if (!filePath) {
    return;
  }
  const progressMap = loadTourProgressMap();
  if (!progressMap[filePath]) {
    return;
  }
  delete progressMap[filePath];
  saveTourProgressMap(progressMap);
}

function getMostRecentTourProgressEntry() {
  const progressMap = loadTourProgressMap();
  const entries = Object.entries(progressMap)
    .map(([filePath, value]) => {
      const parsed = getTourProgress(filePath);
      if (!parsed) {
        return null;
      }
      const updatedAtMs = parsed.updatedAt ? Date.parse(parsed.updatedAt) : 0;
      return {
        filePath,
        stepIndex: parsed.stepIndex,
        stepCount: parsed.stepCount,
        updatedAtMs: Number.isFinite(updatedAtMs) ? updatedAtMs : 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  return entries[0] || null;
}

function applyImportPayload(payload, { confirmOverwrite = true } = {}) {
  const normalized = (payload || "").trim();
  if (!normalized) {
    window.alert("Select a JSON backup to import.");
    return false;
  }
  try {
    JSON.parse(normalized);
  } catch (error) {
    window.alert("Unable to read that JSON backup. Please select a valid session.");
    return false;
  }
  if (confirmOverwrite) {
    const confirmMessage =
      "Warning: This will overwrite the current session in local storage.\n\n" +
      "Make sure you save a backup with Export -> Save Session Backup if it is important to recover the current session data.";
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) {
      return false;
    }
  }
  state.saveEnabled = true;
  if (saveToggle) {
    saveToggle.checked = true;
  }
  localStorage.setItem(STORAGE_KEY, normalized);
  loadState(normalized);
  clearSelection();
  state.isDirty = hasDispatchData();
  state.dispatchVisited = hasDispatchData();
  syncShiftUI();
  renderColumns();
  renderDefaultCardTypeSelect();
  renderDefaultCardColorSettings();
  updateSummary();
  applyViewMode();
  updateCityUI();
  syncMapFilterControls();
  return true;
}

function sanitizeTourPath(pathValue, expectedExtension) {
  if (typeof pathValue !== "string") {
    return null;
  }
  const trimmed = pathValue.trim();
  if (!trimmed || trimmed.includes("..") || trimmed.startsWith("/") || trimmed.includes("://")) {
    return null;
  }
  const allowed = Array.isArray(expectedExtension) ? expectedExtension : [expectedExtension];
  const lower = trimmed.toLowerCase();
  const hasAllowedExt = allowed.some((ext) => lower.endsWith(ext));
  if (!hasAllowedExt) {
    return null;
  }
  return trimmed;
}

function normalizeTourFilename(value) {
  const clean = sanitizeTourPath(value, [".yaml", ".yml"]);
  if (!clean) {
    return null;
  }
  return clean.startsWith("tours/") ? clean : `tours/${clean}`;
}

function formatTourLabel(filePath) {
  const fileName = filePath.split("/").pop() || filePath;
  const noExt = fileName.replace(/\.ya?ml$/i, "");
  return stripTourOrderPrefix(noExt).replace(/[-_]+/g, " ").trim();
}

function toTitleCase(text) {
  return String(text || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function stripTourOrderPrefix(name) {
  return String(name || "").replace(/^\d+[_-]+/, "");
}

function getTourOrder(filePath) {
  const fileName = (filePath.split("/").pop() || "").replace(/\.ya?ml$/i, "");
  const match = fileName.match(/^(\d+)[_-]+/);
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }
  const order = Number(match[1]);
  return Number.isFinite(order) ? order : Number.MAX_SAFE_INTEGER;
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getTourClassSelector(rawClassName) {
  const className = String(rawClassName || "").trim();
  if (!className) {
    return null;
  }
  const firstClass = className.split(/\s+/)[0];
  const safeClass = firstClass.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeClass) {
    return null;
  }
  return `.${safeClass}`;
}

function closeTutorialPickerModal() {
  if (!tutorialPickerModal) {
    return;
  }
  blurFocusedElementWithin(tutorialPickerModal);
  tutorialPickerModal.classList.add("hidden");
  tutorialPickerModal.setAttribute("aria-hidden", "true");
}

function openTutorialPickerModal() {
  if (!tutorialPickerModal) {
    return;
  }
  tutorialPickerModal.classList.remove("hidden");
  tutorialPickerModal.setAttribute("aria-hidden", "false");
  tutorialPickerClose?.focus();
}

function closeTutorialWelcomeModal() {
  if (!tutorialWelcomeModal) {
    return;
  }
  blurFocusedElementWithin(tutorialWelcomeModal);
  tutorialWelcomeModal.classList.add("hidden");
  tutorialWelcomeModal.setAttribute("aria-hidden", "true");
}

function closeTutorialCompleteModal() {
  if (!tutorialCompleteModal) {
    return;
  }
  blurFocusedElementWithin(tutorialCompleteModal);
  tutorialCompleteModal.classList.add("hidden");
  tutorialCompleteModal.setAttribute("aria-hidden", "true");
}

function ensureTourTargetVisible(selector) {
  if (!selector) {
    return null;
  }
  const target = document.querySelector(selector);
  if (!target) {
    return null;
  }
  const panel = target.closest(".tab-panel");
  if (panel && !panel.classList.contains("active")) {
    handleTabSwitch(panel.id);
  } else if (!target.closest("#welcome") && workspace?.classList.contains("hidden")) {
    handleTabSwitch("dispatch");
  } else if (target.closest("#welcome") && welcome?.classList.contains("hidden")) {
    showWelcome();
  }
  return target;
}

function validateTourDefinition(rawTour, filePath) {
  if (!rawTour || typeof rawTour !== "object") {
    throw new Error(`Invalid tour in ${filePath}: root must be an object.`);
  }
  const welcomeText = String(rawTour.welcome || "").trim();
  const completionText = String(rawTour.completion || "").trim();
  if (!welcomeText) {
    throw new Error(`Invalid tour in ${filePath}: missing 'welcome' text.`);
  }
  if (!completionText) {
    throw new Error(`Invalid tour in ${filePath}: missing 'completion' text.`);
  }
  const exampleFileRaw = rawTour.example_file;
  const exampleFile =
    exampleFileRaw == null ? null : sanitizeTourPath(String(exampleFileRaw), ".json");
  if (exampleFileRaw != null && !exampleFile) {
    throw new Error(
      `Invalid tour in ${filePath}: 'example_file' must be null or a safe .json relative path.`
    );
  }
  if (!Array.isArray(rawTour.stops) || rawTour.stops.length === 0) {
    throw new Error(`Invalid tour in ${filePath}: 'stops' must be a non-empty list.`);
  }
  const stops = rawTour.stops.map((stop, index) => {
    if (!stop || typeof stop !== "object") {
      throw new Error(`Invalid stop #${index + 1} in ${filePath}: stop must be an object.`);
    }
    const selector = getTourClassSelector(stop.class);
    if (!selector) {
      throw new Error(`Invalid stop #${index + 1} in ${filePath}: missing/invalid 'class'.`);
    }
    const heading = String(stop.heading || "").trim();
    const detail = String(stop.detail || "").trim();
    const tryThis = String(stop.try_this || "").trim();
    if (!heading || !detail) {
      throw new Error(
        `Invalid stop #${index + 1} in ${filePath}: each stop needs 'heading' and 'detail'.`
      );
    }
    return {
      selector,
      heading,
      detail,
      tryThis: tryThis || null,
      keepOpen: Boolean(tryThis),
    };
  });
  return {
    filePath,
    label: formatTourLabel(filePath),
    welcome: welcomeText,
    completion: completionText,
    exampleFile,
    stops,
  };
}

async function loadTourDefinition(filePath) {
  const response = await fetch(filePath, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load tutorial file: ${filePath}`);
  }
  const rawText = await response.text();
  const parser = window.jsyaml;
  if (!parser || typeof parser.load !== "function") {
    throw new Error("YAML parser is unavailable.");
  }
  const parsed = parser.load(rawText);
  return validateTourDefinition(parsed, filePath);
}

async function loadTutorialCatalog({ force = false } = {}) {
  if (!force && tutorialCatalog.length) {
    return tutorialCatalog;
  }
  const response = await fetch(TOUR_MANIFEST_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load tours/index.json");
  }
  const manifest = await response.json();
  if (!Array.isArray(manifest)) {
    throw new Error("tours/index.json must be an array.");
  }
  tutorialCatalog = manifest
    .map((entry) => {
      if (typeof entry === "string") {
        const file = normalizeTourFilename(entry);
        if (!file) {
          return null;
        }
        return { file, label: formatTourLabel(file), order: getTourOrder(file) };
      }
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const file = normalizeTourFilename(entry.file);
      if (!file) {
        return null;
      }
      const label = String(entry.label || formatTourLabel(file)).trim();
      return {
        file,
        label: label || formatTourLabel(file),
        order: getTourOrder(file),
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.label.localeCompare(b.label);
    });
  return tutorialCatalog;
}

function renderTutorialList() {
  if (!tutorialList) {
    return;
  }
  tutorialList.innerHTML = "";
  if (!tutorialCatalog.length) {
    tutorialList.innerHTML = "<div class=\"search-empty\">No tutorials found.</div>";
    return;
  }
  tutorialCatalog.forEach((entry) => {
    const completed = isTourCompleted(entry.file);
    const progress = getTourProgress(entry.file);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tutorial-item";
    if (completed) {
      button.classList.add("completed");
    }
    button.dataset.tourFile = entry.file;
    const titleRow = document.createElement("div");
    titleRow.className = "tutorial-item-title-row";
    const title = document.createElement("div");
    title.className = "tutorial-item-title";
    title.textContent = entry.label;
    titleRow.appendChild(title);
    if (progress) {
      const status = document.createElement("span");
      const stepNumber = Math.min(progress.stepCount, progress.stepIndex + 1);
      status.className = "tutorial-item-status";
      status.textContent = `In progress ${stepNumber}/${progress.stepCount}`;
      titleRow.appendChild(status);
    } else if (completed) {
      const status = document.createElement("span");
      status.className = "tutorial-item-status";
      status.textContent = "✓ Completed";
      titleRow.appendChild(status);
    }
    const meta = document.createElement("div");
    meta.className = "tutorial-item-meta";
    meta.textContent = progress
      ? `${entry.file} • Resume step ${Math.min(progress.stepCount, progress.stepIndex + 1)}`
      : entry.file;
    button.appendChild(titleRow);
    button.appendChild(meta);
    button.addEventListener("click", () => {
      openTutorialFromEntry(entry).catch((error) => {
        window.alert(error.message || "Unable to load tutorial.");
      });
    });
    tutorialList.appendChild(button);
  });
}

function openTutorialWelcomeModal(tour, { startIndex = 0, stepCount = 0, resume = false } = {}) {
  if (!tutorialWelcomeModal || !tutorialWelcomeTitle || !tutorialWelcomeText) {
    return;
  }
  pendingTourStartIndex = Number.isFinite(startIndex) ? Math.max(0, Math.floor(startIndex)) : 0;
  pendingTourStartCount = Number.isFinite(stepCount) ? Math.max(0, Math.floor(stepCount)) : 0;
  pendingTourIsResume = Boolean(resume);
  const fileName = (tour.filePath.split("/").pop() || tour.filePath).replace(/\.ya?ml$/i, "");
  const titleBase = toTitleCase(stripTourOrderPrefix(fileName).replace(/[_-]+/g, " "));
  tutorialWelcomeTitle.textContent = `${titleBase} Tour`;
  tutorialWelcomeText.textContent =
    pendingTourIsResume && pendingTourStartCount > 0
      ? `${tour.welcome}\n\nResume at step ${Math.min(pendingTourStartCount, pendingTourStartIndex + 1)} of ${pendingTourStartCount}.`
      : tour.welcome;
  if (tutorialStart) {
    tutorialStart.textContent = pendingTourIsResume ? "RESUME" : "START";
  }
  tutorialWelcomeModal.classList.remove("hidden");
  tutorialWelcomeModal.setAttribute("aria-hidden", "false");
  tutorialStart?.focus();
}

function openTutorialCompleteModal(text) {
  if (!tutorialCompleteModal || !tutorialCompleteText) {
    return;
  }
  tutorialCompleteText.textContent = text;
  tutorialCompleteModal.classList.remove("hidden");
  tutorialCompleteModal.setAttribute("aria-hidden", "false");
  tutorialCompleteClose?.focus();
}

async function maybeLoadTourExample(tour, { confirmOverwrite = true } = {}) {
  if (!tour.exampleFile) {
    return true;
  }
  const response = await fetch(tour.exampleFile, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load tutorial example file: ${tour.exampleFile}`);
  }
  const payload = await response.text();
  return applyImportPayload(payload, { confirmOverwrite });
}

function getDriverFactory() {
  if (window.driver?.js && typeof window.driver.js.driver === "function") {
    return window.driver.js.driver;
  }
  if (typeof window.driver === "function") {
    return window.driver;
  }
  return null;
}

function stopActiveTour() {
  tutorialCompletedPending = false;
  activeTourStepIndex = -1;
  activeTourStepCount = 0;
  if (activeDriver && typeof activeDriver.destroy === "function") {
    activeDriver.destroy();
  } else {
    activeDriver = null;
  }
}

function isEditableTarget(target) {
  if (!target) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function handleTourArrowNavigation(event) {
  if (!activeDriver) {
    return;
  }
  if (isEditableTarget(event.target)) {
    return;
  }
  const isPrevKey = event.key === "ArrowLeft" || event.key === "ArrowDown";
  const isNextKey = event.key === "ArrowRight" || event.key === "ArrowUp";
  if (!isPrevKey && !isNextKey) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  if (isPrevKey) {
    if (typeof activeDriver.movePrevious === "function") {
      activeDriver.movePrevious();
      return;
    }
    if (typeof activeDriver.movePrev === "function") {
      activeDriver.movePrev();
    }
    return;
  }
  if (activeTourStepCount > 0 && activeTourStepIndex >= activeTourStepCount - 1) {
    tutorialCompletedPending = true;
    activeDriver.destroy();
    return;
  }
  if (typeof activeDriver.moveNext === "function") {
    activeDriver.moveNext();
  }
}

function startActiveTour({ startIndex = 0 } = {}) {
  if (!activeTour) {
    return;
  }
  const driverFactory = getDriverFactory();
  if (!driverFactory) {
    window.alert("Tutorial engine failed to load.");
    return;
  }
  stopActiveTour();
  tutorialCompletedPending = false;
  const validStops = activeTour.stops.filter((stop) => {
    const visible = ensureTourTargetVisible(stop.selector);
    return Boolean(visible);
  });
  if (!validStops.length) {
    window.alert("This tutorial has no valid targets in the current app state.");
    return;
  }
  const resumeIndex = Number.isFinite(startIndex) ? Math.floor(startIndex) : 0;
  const clampedStartIndex = Math.min(Math.max(resumeIndex, 0), validStops.length - 1);
  activeTourStepCount = validStops.length;
  activeTourStepIndex = clampedStartIndex;
  saveTourProgress(activeTour.filePath, {
    stepIndex: clampedStartIndex,
    stepCount: validStops.length,
  });
  const steps = validStops.map((stop, index) => ({
    element: stop.selector,
    onHighlightStarted: () => {
      activeTourStepIndex = index;
      saveTourProgress(activeTour.filePath, {
        stepIndex: index,
        stepCount: validStops.length,
      });
      ensureTourTargetVisible(stop.selector);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          refreshIcons();
        });
      });
    },
    popover: {
      title: stop.heading,
      description: stop.tryThis
        ? `<div class="tour-step-detail">${escapeHtml(stop.detail)}</div>` +
          `<div class="tour-try-this"><span class="icon" aria-hidden="true">` +
          `<i data-lucide="square-mouse-pointer"></i></span>` +
          `<span><strong>Try this now:</strong> ${escapeHtml(stop.tryThis)}</span></div>`
        : `<div class="tour-step-detail">${escapeHtml(stop.detail)}</div>`,
      showButtons: ["previous", "next", "close"],
      prevBtnText: "Prev",
      nextBtnText: index === validStops.length - 1 ? "Finish" : "Next",
      onNextClick: () => {
        if (!activeDriver) {
          return;
        }
        if (index === validStops.length - 1) {
          tutorialCompletedPending = true;
          activeDriver.destroy();
          return;
        }
        if (typeof activeDriver.moveNext === "function") {
          activeDriver.moveNext();
        }
      },
    },
  }));
  activeDriver = driverFactory({
    animate: true,
    smoothScroll: true,
    showProgress: true,
    allowClose: true,
    overlayClickBehavior: () => {},
    stagePadding: 10,
    stageRadius: 12,
    overlayOpacity: 0.34,
    steps,
    onDestroyed: () => {
      const shouldShowComplete = tutorialCompletedPending;
      tutorialCompletedPending = false;
      activeDriver = null;
      if (shouldShowComplete && activeTour) {
        markTourCompleted(activeTour.filePath);
        clearTourProgress(activeTour.filePath);
        openTutorialCompleteModal(activeTour.completion);
        return;
      }
      if (activeTour && activeTourStepIndex >= 0 && activeTourStepCount > 0) {
        saveTourProgress(activeTour.filePath, {
          stepIndex: Math.min(activeTourStepIndex, activeTourStepCount - 1),
          stepCount: activeTourStepCount,
        });
      }
    },
  });
  activeDriver.drive(clampedStartIndex);
}

async function openTutorialFromEntry(entry) {
  const tour = await loadTourDefinition(entry.file);
  const progress = getTourProgress(tour.filePath);
  const hasProgress = Boolean(progress);
  let shouldResume = false;
  if (hasProgress) {
    const stepNumber = Math.min(progress.stepCount, progress.stepIndex + 1);
    const restartWarning = tour.exampleFile
      ? "Choose Cancel to restart from the beginning. Restarting can overwrite your current session with tutorial example data."
      : "Choose Cancel to restart from the beginning.";
    shouldResume = window.confirm(
      `Resume this tour at step ${stepNumber} of ${progress.stepCount}?\n\n` +
        restartWarning
    );
  }
  if (!shouldResume) {
    let shouldConfirmRestartOverwrite = false;
    if (hasProgress && tour.exampleFile) {
      shouldConfirmRestartOverwrite = !window.confirm(
        "Restarting this tutorial will load example data and can overwrite your current session. Continue?"
      );
    }
    if (shouldConfirmRestartOverwrite) {
      return;
    }
    const imported = await maybeLoadTourExample(tour, {
      confirmOverwrite: !(hasProgress && tour.exampleFile),
    });
    if (!imported) {
      return;
    }
  }
  activeTour = tour;
  closeTutorialPickerModal();
  closeTutorialCompleteModal();
  openTutorialWelcomeModal(tour, {
    startIndex: shouldResume && progress ? progress.stepIndex : 0,
    stepCount: shouldResume && progress ? progress.stepCount : tour.stops.length,
    resume: shouldResume,
  });
}

async function maybeResumeTourAfterReload() {
  const progress = getMostRecentTourProgressEntry();
  if (!progress) {
    return;
  }
  try {
    const tour = await loadTourDefinition(progress.filePath);
    activeTour = tour;
    closeTutorialPickerModal();
    closeTutorialCompleteModal();
    closeTutorialWelcomeModal();
    startActiveTour({ startIndex: progress.stepIndex });
  } catch (error) {
    clearTourProgress(progress.filePath);
    window.alert(error.message || "Unable to resume the saved tour.");
  }
}

function buildDispatchCsv() {
  const rows = [["Observer", "Timestamp", "Notes", "Reportable"]];
  state.columns.forEach((column) => {
    const label = getCardDisplay(column.type || DEFAULT_CARD_TYPE, column.label);
    column.observations.forEach((obs) => {
      rows.push([
        label,
        obs.timestampText,
        obs.text.replaceAll("\n", " "),
        obs.reportable ? "T" : "F",
      ]);
    });
  });
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
            return `"${value.replaceAll("\"", "\"\"")}"`;
          }
          return value;
        })
        .join(",")
    )
    .join("\n");
}

function exportNotes(format) {
  const stamp = getExportStamp();
  if (format === "clipboard") {
    const csv = buildDispatchCsv();
    navigator.clipboard.writeText(csv).catch(() => {
      window.alert("Unable to copy to clipboard.");
    });
    return;
  }
  if (format === "json") {
    const payload = serializeState();
    downloadFile(payload, `dispatch-session-backup-${stamp}.json`, "application/json");
    return;
  }
  const csv = buildDispatchCsv();
  downloadFile(csv, `dispatch-session-${stamp}.csv`, "text/csv");
}

function exportSummary(format) {
  if (!summaryOutput) {
    return;
  }
  const text = summaryOutput.value;
  if (format === "summary-clipboard") {
    navigator.clipboard.writeText(text).catch(() => {
      window.alert("Unable to copy to clipboard.");
    });
    return;
  }
  if (format === "summary-txt") {
    const stamp = getExportStamp();
    downloadFile(text, `dispatch-summary-${stamp}.txt`, "text/plain");
  }
}

function setExportMenu() {
  if (!exportMenu || !exportButton) {
    return;
  }
  exportButton.innerHTML =
    '<span class="icon" aria-hidden="true"><i data-lucide="download"></i></span>Export';
  exportMenu.innerHTML = "";
  const items = [
    { value: "summary-clipboard", label: "Copy Summary to Clipboard" },
    { value: "summary-txt", label: "Export Summary (TXT)" },
    { value: "csv", label: "Export Note Data (CSV)" },
    { value: "clipboard", label: "Copy Note Data to Clipboard" },
    { value: "json", label: "Save Session Backup (JSON)" },
  ];
  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dropdown-item";
    button.setAttribute("role", "menuitem");
    button.dataset.export = item.value;
    button.textContent = item.label;
    exportMenu.appendChild(button);
  });
  refreshIcons();
  ensureLucideIcon(exportButton);
}

function resetState() {
  state.startTime = null;
  state.endTime = null;
  state.endAdjustedNote = "";
  state.area = "";
  state.summaryInclude = null;
  state.summarySort = DEFAULT_SUMMARY_SORT;
  state.summaryMostRecentFirst = DEFAULT_SUMMARY_MOST_RECENT_FIRST;
  state.summaryKnownTypes = null;
  state.summaryReportableOnly = DEFAULT_SUMMARY_REPORTABLE_ONLY;
  state.summaryIncludeLocation = DEFAULT_SUMMARY_INCLUDE_LOCATION;
  state.summaryLocationIncludeAddress = DEFAULT_SUMMARY_INCLUDE_LOCATION_ADDRESS;
  state.summaryLocationIncludeLatLon = DEFAULT_SUMMARY_INCLUDE_LOCATION_LAT_LON;
  state.summaryIncludeEmojis = DEFAULT_SUMMARY_INCLUDE_EMOJIS;
  state.summarySanitizeNames = DEFAULT_SUMMARY_SANITIZE_NAMES;
  state.summaryBulletsForNotes = DEFAULT_SUMMARY_BULLETS_FOR_NOTES;
  state.summarySpaceBetweenNotes = DEFAULT_SUMMARY_SPACE_BETWEEN_NOTES;
  state.summaryTime24 = DEFAULT_SUMMARY_TIME_24;
  state.summaryGroupFields = DEFAULT_SUMMARY_GROUP_FIELDS;
  state.summaryDefaultExclude = Array.from(DEFAULT_SUMMARY_EXCLUDE);
  state.availableCardTypes = normalizeAvailableCardTypes(null);
  state.defaultNewCardType = DEFAULT_NEW_CARD_TYPE;
  state.cardColorDefaults = normalizeCardColorDefaults(null);
  state.viewMode = DEFAULT_VIEW_MODE;
  state.notesNewestFirst = DEFAULT_NOTES_NEWEST_FIRST;
  state.mapSettings = {
    city: null,
    centerLocation: null,
    radiusMiles: DEFAULT_MAP_RADIUS_MILES,
    style: DEFAULT_MAP_STYLE,
  };
  state.mapFilters = {
    showMinimized: DEFAULT_MAP_FILTER_SHOW_MINIMIZED,
    labelTimes: DEFAULT_MAP_FILTER_LABEL_TIMES,
    recencyMode: DEFAULT_MAP_FILTER_RECENCY_MODE,
    noteReportableOnly: DEFAULT_MAP_FILTER_NOTE_REPORTABLE_ONLY,
    inactiveLabelOpacity: DEFAULT_MAP_FILTER_INACTIVE_LABEL_OPACITY,
    types: getDefaultMapTypeFilters(),
  };
  state.isDirty = false;
  if (summarySort) {
    summarySort.value = DEFAULT_SUMMARY_SORT;
  }
  if (summaryMostRecentToggle) {
    summaryMostRecentToggle.checked = DEFAULT_SUMMARY_MOST_RECENT_FIRST;
  }
  if (dispatchNewestFirstToggle) {
    dispatchNewestFirstToggle.checked = DEFAULT_NOTES_NEWEST_FIRST;
  }
  if (shiftAreaInput) {
    shiftAreaInput.value = "";
  }
  if (summaryReportableToggle) {
    summaryReportableToggle.checked = DEFAULT_SUMMARY_REPORTABLE_ONLY;
  }
  if (summaryEmojiToggle) {
    summaryEmojiToggle.checked = DEFAULT_SUMMARY_INCLUDE_EMOJIS;
  }
  if (summaryLocationToggle) {
    summaryLocationToggle.checked = DEFAULT_SUMMARY_INCLUDE_LOCATION;
  }
  if (summaryLocationAddressToggle) {
    summaryLocationAddressToggle.checked = DEFAULT_SUMMARY_INCLUDE_LOCATION_ADDRESS;
  }
  if (summaryLocationLatLonToggle) {
    summaryLocationLatLonToggle.checked = DEFAULT_SUMMARY_INCLUDE_LOCATION_LAT_LON;
  }
  if (summaryBulletsToggle) {
    summaryBulletsToggle.checked = DEFAULT_SUMMARY_BULLETS_FOR_NOTES;
  }
  if (summarySpaceBetweenToggle) {
    summarySpaceBetweenToggle.checked = DEFAULT_SUMMARY_SPACE_BETWEEN_NOTES;
  }
  if (summarySanitizeToggle) {
    summarySanitizeToggle.checked = DEFAULT_SUMMARY_SANITIZE_NAMES;
  }
  syncSummaryLocationSuboptions();
  syncSummaryTimeFormatToggle();
  createDefaultColumns();
  syncShiftUI();
  renderColumns();
  updateSummary();
  renderSummaryDefaultExclude();
  renderCardTypeAvailability();
  renderDefaultCardTypeSelect();
  renderDefaultCardColorSettings();
  applyViewMode();
  updateCityUI();
  syncMapFilterControls();
  persistState();
}

function syncSummaryTimeFormatToggle() {
  const use24 = state.summaryTime24 !== false;
  if (summaryTimeFormat24) {
    summaryTimeFormat24.classList.toggle("active", use24);
    summaryTimeFormat24.setAttribute("aria-pressed", String(use24));
  }
  if (summaryTimeFormat12) {
    summaryTimeFormat12.classList.toggle("active", !use24);
    summaryTimeFormat12.setAttribute("aria-pressed", String(!use24));
  }
}

function syncSummaryLocationSuboptions() {
  const enabled = state.summaryIncludeLocation !== false;
  if (summaryLocationSuboptions) {
    summaryLocationSuboptions.classList.toggle("hidden", !enabled);
  }
  if (summaryLocationAddressToggle) {
    summaryLocationAddressToggle.disabled = !enabled;
  }
  if (summaryLocationLatLonToggle) {
    summaryLocationLatLonToggle.disabled = !enabled;
  }
}
