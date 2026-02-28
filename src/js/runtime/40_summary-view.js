/*
  Summary tab: filters, grouping, and summary rendering
  Transitional split from the previous runtime monolith for maintainability.
*/

function getSummaryTypes({ reportableOnly = false } = {}) {
  const typesWithNotes = new Set();
  const typesAll = new Set();
  state.columns.forEach((column) => {
    const type = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
    const hasNotes = column.observations.some(
      (obs) => obs.text.trim() && (!reportableOnly || obs.reportable)
    );
    if (!reportableOnly) {
      typesAll.add(type);
    } else if (hasNotes) {
      typesAll.add(type);
    }
    if (hasNotes) {
      typesWithNotes.add(type);
    }
  });
  return Array.from(typesWithNotes.size ? typesWithNotes : typesAll);
}

function getSummaryExcludeSet() {
  const values = Array.isArray(state.summaryDefaultExclude)
    ? state.summaryDefaultExclude
    : Array.from(DEFAULT_SUMMARY_EXCLUDE);
  return new Set(values.map(normalizeCardType));
}

function getDefaultSummaryInclude(types) {
  const excludeSet = getSummaryExcludeSet();
  return types.filter((type) => !excludeSet.has(type));
}

function syncSummaryInclude(types) {
  if (!Array.isArray(state.summaryInclude) || !Array.isArray(state.summaryKnownTypes)) {
    state.summaryInclude = getDefaultSummaryInclude(types);
    state.summaryKnownTypes = Array.from(new Set(types));
    return;
  }
  const includeSet = new Set(state.summaryInclude);
  const knownSet = new Set(state.summaryKnownTypes);
  const excludeSet = getSummaryExcludeSet();
  types.forEach((type) => {
    if (!knownSet.has(type)) {
      if (!excludeSet.has(type)) {
        includeSet.add(type);
      }
      knownSet.add(type);
    }
  });
  state.summaryInclude = Array.from(includeSet);
  state.summaryKnownTypes = Array.from(knownSet);
}

function syncSummaryDefaultExclude(types) {
  const excludeSet = getSummaryExcludeSet();
  const normalizedTypes = types.map(normalizeCardType);
  const includeSet = new Set(
    normalizedTypes.filter((type) => !excludeSet.has(type))
  );
  state.summaryInclude = Array.from(includeSet);
  state.summaryKnownTypes = Array.from(new Set(normalizedTypes));
}

function getSummaryCategoryLabel(type) {
  return getCardTypeMeta(normalizeCardType(type)).label;
}

function getSummaryCategoryHeading(type, includeEmoji, sanitizeNames) {
  if (isObserverType(type) && sanitizeNames === false) {
    return includeEmoji ? `${TYPE_EMOJI[OBSERVER_CARD_TYPE] || ""}`.trim() : "People";
  }
  const label = getSummaryCategoryLabel(type);
  let heading = label;
  if (label.toLowerCase().endsWith("s")) {
    heading = label;
  } else {
    heading = `${label}s`;
  }
  if (includeEmoji) {
    const normalized = normalizeCardType(type);
    return `${TYPE_EMOJI[normalized] || ""} ${heading}`.trim();
  }
  return heading;
}

function getObserverIndexMap() {
  const observerColumns = state.columns
    .filter(
      (column) => isObserverType(column.type || DEFAULT_CARD_TYPE)
    )
    .slice()
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const map = new Map();
  observerColumns.forEach((column, index) => {
    map.set(column.id, index + 1);
  });
  return map;
}

function getSummaryEntryLabel(column, includeEmoji, sanitizeNames, observerIndexMap) {
  const type = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
  if (isVehicleCardType(type)) {
    const base = includeEmoji
      ? `${TYPE_EMOJI[type] || ""} ${getSummaryCategoryLabel(type)}`.trim()
      : getSummaryCategoryLabel(type);
    const details = formatVehicleInfoForSummary(normalizeVehicleInfo(column?.vehicleProfile || {}));
    return details ? `${base} ${details}`.trim() : base;
  }
  const labelText = (column.label || "").trim();
  const baseLabel = isObserverType(type)
    ? "Observer"
    : getSummaryCategoryLabel(type);
  const base = includeEmoji ? `${TYPE_EMOJI[type] || ""} ${baseLabel}`.trim() : baseLabel;
  if (isObserverType(type) && !sanitizeNames) {
    if (labelText) {
      return includeEmoji ? `${TYPE_EMOJI[type] || ""} ${labelText}`.trim() : labelText;
    }
    return includeEmoji ? `${TYPE_EMOJI[type] || ""}`.trim() : "";
  }
  if (isObserverType(type) && sanitizeNames) {
    const observerIndex = observerIndexMap.get(column.id);
    if (observerIndex) {
      return `${base} ${observerIndex}`;
    }
  }
  if (labelText && !(sanitizeNames && isObserverType(type))) {
    return `${base} ${labelText}`;
  }
  return base;
}

function getSummaryCardHeading(column, includeEmoji, sanitizeNames, observerIndexMap) {
  const type = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
  if (isVehicleCardType(type)) {
    const base = includeEmoji
      ? `${TYPE_EMOJI[type] || ""} ${getSummaryCategoryLabel(type)}`.trim()
      : getSummaryCategoryLabel(type);
    const details = formatVehicleInfoForSummary(normalizeVehicleInfo(column?.vehicleProfile || {}));
    return details ? `${base} ${details}`.trim() : base;
  }
  const labelText = (column.label || "").trim();
  const baseLabel = isObserverType(type)
    ? "Observer"
    : getSummaryCategoryLabel(type);
  const base = includeEmoji ? `${TYPE_EMOJI[type] || ""} ${baseLabel}`.trim() : baseLabel;
  if (isObserverType(type) && !sanitizeNames) {
    if (labelText) {
      return includeEmoji ? `${TYPE_EMOJI[type] || ""} ${labelText}`.trim() : labelText;
    }
    return includeEmoji ? `${TYPE_EMOJI[type] || ""}`.trim() : "";
  }
  if (isObserverType(type) && sanitizeNames) {
    const observerIndex = observerIndexMap.get(column.id);
    if (observerIndex) {
      return `${base} ${observerIndex}`;
    }
  }
  if (labelText) {
    return `${base} ${labelText}`;
  }
  return base;
}

function getSummaryJumpTitle(entry) {
  if (!entry) {
    return "Jump to card";
  }
  const column = state.columns.find((item) => String(item.id) === String(entry.columnId));
  const type = column?.type || entry.cardType || DEFAULT_CARD_TYPE;
  const label = column?.label || entry.cardLabel || "";
  const cardLabel = isVehicleCardType(type)
    ? getVehicleCardDisplayName(column)
    : getCardDisplay(type, label);
  return `Jump to ${cardLabel}`;
}

function jumpToSummarySource(entry) {
  if (!entry || !entry.columnId) {
    return;
  }
  const column = state.columns.find((item) => String(item.id) === String(entry.columnId));
  if (!column) {
    return;
  }
  const obs = entry.obsId
    ? column.observations.find((item) => String(item.id) === String(entry.obsId))
    : null;
  if (column.minimized) {
    column.minimized = false;
    column.justExpanded = true;
  }
  handleTabSwitch("dispatch");
  setViewMode("notes", { preserveMapView: true });
  if (obs) {
    selectNote(column.id, obs.id);
  } else {
    selectColumn(column.id);
  }
  renderColumns();
  applySelectionUI();
  scrollSelectionIntoView();
  requestAnimationFrame(() => {
    applySelectionUI();
    scrollSelectionIntoView();
  });
}

function createSummaryLinkButton(entry) {
  const linkButton = document.createElement("button");
  linkButton.type = "button";
  linkButton.className = "summary-output-link";
  linkButton.title = getSummaryJumpTitle(entry);
  linkButton.setAttribute("aria-label", getSummaryJumpTitle(entry));
  linkButton.innerHTML = '<i data-lucide="link-2"></i>';
  linkButton.addEventListener("click", () => {
    jumpToSummarySource(entry);
  });
  return linkButton;
}

function countTextLines(text) {
  const value = String(text || "");
  return value ? value.split("\n").length : 1;
}

function syncSummaryLinkTrack(textarea, linkTrack) {
  if (!textarea || !linkTrack) {
    return;
  }
  linkTrack.style.transform = `translateY(${-textarea.scrollTop}px)`;
}

function renderSummaryLineLinks({ textarea, linkTrack, lineLinks, totalLines, lineOffset = 0 }) {
  if (!textarea || !linkTrack) {
    return;
  }
  const computed = window.getComputedStyle(textarea);
  const lineHeight = Number.parseFloat(computed.lineHeight) || 20;
  const paddingTop = Number.parseFloat(computed.paddingTop) || 0;
  const borderTop = Number.parseFloat(computed.borderTopWidth) || 0;
  linkTrack.innerHTML = "";
  linkTrack.style.paddingTop = `${paddingTop + borderTop}px`;
  for (let index = 0; index < totalLines; index += 1) {
    const slot = document.createElement("div");
    slot.className = "summary-link-slot";
    slot.style.height = `${lineHeight}px`;
    const entry = lineLinks.get(index - lineOffset);
    if (entry) {
      slot.appendChild(createSummaryLinkButton(entry));
    } else {
      const spacer = document.createElement("span");
      spacer.className = "summary-output-gutter";
      spacer.setAttribute("aria-hidden", "true");
      slot.appendChild(spacer);
    }
    linkTrack.appendChild(slot);
  }
  if (textarea._summaryLinkSyncHandler) {
    textarea.removeEventListener("scroll", textarea._summaryLinkSyncHandler);
  }
  const onScroll = () => {
    syncSummaryLinkTrack(textarea, linkTrack);
  };
  textarea._summaryLinkSyncHandler = onScroll;
  textarea.addEventListener("scroll", onScroll, { passive: true });
  syncSummaryLinkTrack(textarea, linkTrack);
}

function renderSummaryGroupOutputs(groups) {
  if (!summaryGroupOutput) {
    return;
  }
  summaryGroupOutput.innerHTML = "";
  groups.forEach((group) => {
    const block = document.createElement("div");
    block.className = "summary-group-block";
    const title = document.createElement("div");
    title.className = "summary-group-title";
    title.textContent = group.heading;
    const editWrap = document.createElement("div");
    editWrap.className = "summary-edit-wrap summary-group-edit-wrap";
    const linkGutter = document.createElement("div");
    linkGutter.className = "summary-link-gutter";
    linkGutter.setAttribute("aria-hidden", "true");
    const linkTrack = document.createElement("div");
    linkTrack.className = "summary-link-track";
    linkGutter.appendChild(linkTrack);
    const textarea = document.createElement("textarea");
    textarea.value = group.lines.join("\n");
    textarea.wrap = "soft";
    const lineCount = Math.max(3, group.lines.length + 1);
    textarea.rows = Math.min(24, lineCount);
    textarea.dataset.groupKey = group.key;
    editWrap.appendChild(linkGutter);
    editWrap.appendChild(textarea);
    renderSummaryLineLinks({
      textarea,
      linkTrack,
      lineLinks: group.lineLinks || new Map(),
      totalLines: countTextLines(textarea.value),
      lineOffset: 1,
    });
    const actions = document.createElement("div");
    actions.className = "summary-group-actions";
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "ghost";
    copyButton.innerHTML =
      '<span class="icon" aria-hidden="true"><i data-lucide="copy"></i></span>Copy';
    const status = document.createElement("span");
    status.className = "summary-group-status";
    if (summaryCopiedGroups.has(group.key)) {
      status.textContent = "Previously copied ✓";
    }
    copyButton.addEventListener("click", () => {
      const text = textarea.value;
      navigator.clipboard.writeText(text).catch(() => {
        window.alert("Unable to copy to clipboard.");
      });
      summaryCopiedGroups.add(group.key);
      status.textContent = "Previously copied ✓";
    });
    actions.appendChild(copyButton);
    actions.appendChild(status);
    block.appendChild(title);
    block.appendChild(editWrap);
    block.appendChild(actions);
    summaryGroupOutput.appendChild(block);
  });
}

function getSummaryLocationData(obs, column) {
  if (obs.location) {
    return obs.location;
  }
  if (column.location) {
    return column.location;
  }
  return null;
}

function formatLatLon(value) {
  const next = Number(value);
  if (!Number.isFinite(next)) {
    return "";
  }
  return next.toFixed(6);
}

function getSummaryLocationLabel(obs, column) {
  const location = getSummaryLocationData(obs, column);
  if (!location) {
    return "";
  }
  const includeAddress = state.summaryLocationIncludeAddress !== false;
  const includeLatLon = Boolean(state.summaryLocationIncludeLatLon);
  if (!includeAddress && !includeLatLon) {
    return "";
  }
  const parts = [];
  if (includeAddress) {
    const addressText = formatLocationLabel(location.displayLabel || location.label || "");
    if (addressText) {
      parts.push(addressText);
    }
  }
  if (includeLatLon) {
    const lat = formatLatLon(location.lat);
    const lon = formatLatLon(location.lon);
    if (lat && lon) {
      parts.push(`${lat}, ${lon}`);
    }
  }
  return parts.join(" | ");
}

function normalizeVehicleSummaryLine(rawLine) {
  const line = String(rawLine || "").trim().replace(/\s+/g, " ");
  if (!line) {
    return "";
  }
  const normalized = line.toLowerCase();
  if (!normalized.startsWith("plate ")) {
    return line;
  }
  const parsed = parseVehicleInfoFromText(line);
  return formatVehicleInfoForSummary(parsed);
}

function formatVehicleInfoForSummary(info) {
  const normalized = normalizeVehicleInfo(info || {});
  const parts = [];
  if (normalized.plateVisible && normalized.plate) {
    parts.push(normalized.plate.toUpperCase());
  }
  if (normalized.state) {
    parts.push(`(${normalized.state})`);
  }
  if (normalized.color) {
    parts.push(normalized.color);
  }
  if (normalized.make) {
    parts.push(normalized.make);
  }
  if (normalized.model) {
    parts.push(normalized.model);
  }
  if (normalized.body) {
    parts.push(normalized.body);
  }
  return parts.join(" ").trim();
}

function getVehicleSummaryLabelFromObservation(obs) {
  const structured = normalizeVehicleInfo(obs?.vehicleInfo || {});
  const fallback = parseVehicleInfoFromText(obs?.text || "");
  const normalized = hasVehicleInfo(structured) ? structured : fallback;
  if (normalized.plateVisible === false || !normalized.plate) {
    return "";
  }
  return normalized.state
    ? `${normalized.plate.toUpperCase()} (${normalized.state})`
    : normalized.plate.toUpperCase();
}

function getVehicleCardDisplayName(column) {
  const summary = formatVehicleInfoForSummary(normalizeVehicleInfo(column?.vehicleProfile || {}));
  return summary || getSummaryCategoryLabel(VEHICLE_CARD_TYPE);
}

function getObservationSummaryText(obs, type) {
  const normalizedType = normalizeCardType(type);
  const noteText = String(obs?.text || "").trim();
  if (!isVehicleListType(normalizedType)) {
    return noteText;
  }
  const parts = [];
  if (noteText) {
    parts.push(noteText);
  }
  const hasLegacyVehicleLine = noteText
    .split(/\r?\n/)
    .some((line) => String(line || "").trim().toLowerCase().startsWith("plate "));
  const vehicleLine = formatVehicleInfoForSummary(obs?.vehicleInfo || {});
  if (vehicleLine && !hasLegacyVehicleLine) {
    parts.push(vehicleLine);
  }
  return parts.join("\n").trim();
}

function getSummaryEntryText(entry) {
  const text = String(entry.text || "").trim();
  if (!text) {
    return "";
  }
  if (!isVehicleListType(entry.type)) {
    return text;
  }
  return text
    .split(/\r?\n/)
    .map((line) => normalizeVehicleSummaryLine(line))
    .filter(Boolean)
    .join("\n");
}

function renderSummaryFilters() {
  if (!summaryFilters) {
    return;
  }
  const types = getSummaryTypes({ reportableOnly: state.summaryReportableOnly });
  syncSummaryInclude(types);
  const includeSet = new Set(state.summaryInclude || []);
  summaryFilters.innerHTML = "";
  if (!types.length) {
    const empty = document.createElement("div");
    empty.className = "summary-empty";
    empty.textContent = "No categories yet.";
    summaryFilters.appendChild(empty);
    return;
  }
  const sorted = types.sort((a, b) =>
    getSummaryCategoryLabel(a).localeCompare(getSummaryCategoryLabel(b))
  );
  sorted.forEach((type) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "summary-pill";
    pill.dataset.type = type;
    const icon = createCardTypeIconNode(type);
    const label = document.createElement("span");
    label.textContent = getSummaryCategoryLabel(type);
    pill.appendChild(icon);
    pill.appendChild(label);
    if (!includeSet.has(type)) {
      pill.classList.add("inactive");
    }
    pill.addEventListener("click", () => {
      const next = new Set(state.summaryInclude || []);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      state.summaryInclude = Array.from(next);
      markDirty();
      persistState();
      renderSummaryFilters();
      updateSummary();
    });
    summaryFilters.appendChild(pill);
  });
  refreshIcons();
}

function updateSummary() {
  if (!summaryOutput) {
    return;
  }
  renderSummaryFilters();
  const entries = [];
  const allEntries = [];
  const includeSet = new Set(state.summaryInclude || []);
  const reportableOnly = Boolean(state.summaryReportableOnly);

  const includeLocation = state.summaryIncludeLocation !== false;
  const includeBullets = Boolean(state.summaryBulletsForNotes);
  const addSpaceBetweenNotes = Boolean(state.summarySpaceBetweenNotes);
  const includeEmojis = Boolean(state.summaryIncludeEmojis);
  const sanitizeNames = state.summarySanitizeNames !== false;
  const observerIndexMap = sanitizeNames ? getObserverIndexMap() : new Map();
  state.columns.forEach((column) => {
    const type = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
    const defaultLabel = getSummaryEntryLabel(
      column,
      includeEmojis,
      sanitizeNames,
      observerIndexMap
    );
    column.observations.forEach((obs) => {
      const summaryText = getObservationSummaryText(obs, type);
      if (!summaryText) {
        return;
      }
      const vehicleLabel = isVehicleListType(type)
          ? getVehicleSummaryLabelFromObservation(obs)
          : "";
      const label = vehicleLabel || defaultLabel;
      const vehicleInfoSummary = isVehicleCardType(type)
        ? formatVehicleInfoForSummary(normalizeVehicleInfo(column?.vehicleProfile || {}))
        : isVehicleListType(type)
          ? formatVehicleInfoForSummary(
              normalizeVehicleInfo(obs?.vehicleInfo || parseVehicleInfoFromText(obs?.text || ""))
            )
          : "";
      const entry = {
        timestamp: obs.timestamp,
        timestampText: formatSummaryTime(obs.timestamp),
        editedFrom: obs.editedFrom,
        text: summaryText,
        locationLabel: includeLocation ? getSummaryLocationLabel(obs, column) : "",
        type,
        columnId: column.id,
        obsId: obs.id,
        cardType: column.type || DEFAULT_CARD_TYPE,
        cardLabel: column.label || "",
        label,
        vehicleLabel,
        vehicleInfoSummary,
        isReportable: Boolean(obs.reportable),
      };
      allEntries.push(entry);
      if (!includeSet.has(type)) {
        return;
      }
      if (reportableOnly && !obs.reportable) {
        return;
      }
      entries.push(entry);
    });
  });

  const startTime = state.startTime
    ? state.startTime
    : entries.length
      ? new Date(Math.min(...entries.map((entry) => entry.timestamp.getTime())))
      : null;
  const endTime = state.endTime
    ? state.endTime
    : entries.length
      ? new Date(Math.max(...entries.map((entry) => entry.timestamp.getTime())))
      : null;
  const isOngoing = Boolean(state.startTime && !state.endTime);
  const startDateText = startTime ? formatSummaryDate(startTime) : "—";
  const endDateText = endTime ? formatSummaryDate(endTime) : "—";
  const startTimeText = startTime ? formatSummaryTime(startTime) : "—";
  const endTimeText = endTime ? formatSummaryTime(endTime) : "—";
  const sameDate =
    startTime && endTime && getSummaryDateKey(startTime) === getSummaryDateKey(endTime);
  const dateLine = sameDate ? startDateText : `${startDateText}–${endDateText}`;
  const timeLine = `${startTimeText}–${endTimeText}`;
  const areaText = state.area ? ` for ${state.area}` : "";
  const header = `DISPATCH NOTES${areaText}${isOngoing ? " (ongoing)" : ""}\n${dateLine}\n${timeLine}\n=================`;

  if (summaryWarning) {
    const warningLines = [];
    if (isOngoing) {
      warningLines.push("The Shift in the Collect Mode has not ended.");
    }
    const reportableFilteredOut = allEntries.some(
      (entry) => entry.isReportable && !includeSet.has(entry.type)
    );
    if (reportableFilteredOut) {
      warningLines.push("Some reportable notes are excluded by filters.");
    }
    if (warningLines.length && !summaryWarningDismissed) {
      if (summaryWarningText) {
        summaryWarningText.textContent = `! ${warningLines.join(" ")}`;
      }
      summaryWarning.classList.remove("hidden");
    } else {
      summaryWarning.classList.add("hidden");
    }
  }

  const headerLines = header.split("\n");
  const mainLineLinks = new Map();
  if (!entries.length) {
    summaryOutput.value = header;
    if (summaryGroupOutput) {
      summaryGroupOutput.classList.add("hidden");
    }
    if (summaryOutputWrap) {
      summaryOutputWrap.classList.remove("hidden");
    }
    summaryOutput.classList.remove("hidden");
    renderSummaryLineLinks({
      textarea: summaryOutput,
      linkTrack: summaryOutputLinkTrack,
      lineLinks: mainLineLinks,
      totalLines: headerLines.length,
    });
    refreshIcons();
    return;
  }

  const stripDuplicateVehicleInfoLine = (text, vehicleInfoSummary) => {
    const inline = String(vehicleInfoSummary || "").trim().toLowerCase();
    if (!inline) {
      return String(text || "").trim();
    }
    return String(text || "")
      .split(/\r?\n/)
      .map((line) => String(line || "").trim())
      .filter((line) => line && line.toLowerCase() !== inline)
      .join("\n");
  };
  const indentSummaryBody = (text) =>
    String(text || "")
      .split(/\r?\n/)
      .map((line) => (line ? `  ${line}` : line))
      .join("\n");

  const cleanLine = (entry, includeLabel = true, includeTimestampBullet = true) => {
    const isVehicle = isVehicleListType(entry.type);
    let cleanText = getSummaryEntryText(entry);
    if (isVehicle && entry.vehicleInfoSummary) {
      cleanText = stripDuplicateVehicleInfoLine(cleanText, entry.vehicleInfoSummary);
    }
    const indentedText = indentSummaryBody(cleanText);
    const locationSegment = entry.locationLabel ? `{ ${entry.locationLabel} }` : "";
    const locationLine = locationSegment ? `  ${locationSegment}` : "";
    const timestampPrefix = includeBullets && includeTimestampBullet ? "• " : "";
    if (isVehicle && entry.vehicleInfoSummary) {
      const lineHead = `${timestampPrefix}${entry.timestampText} Vehicle ${entry.vehicleInfoSummary}:`.trim();
      if (locationLine) {
        return `${lineHead}\n${locationLine}\n${indentedText}`.trim();
      }
      return `${lineHead}\n${indentedText}`.trim();
    }
    if (!entry.label || !includeLabel) {
      const lineHead = `${timestampPrefix}${entry.timestampText}`.trim();
      if (locationLine) {
        return `${lineHead}\n${locationLine}\n${indentedText}`.trim();
      }
      return `${lineHead}\n${indentedText}`.trim();
    }
    const lineHead = `${timestampPrefix}${entry.timestampText} ${entry.label}:`.trim();
    if (locationLine) {
      return `${lineHead}\n${locationLine}\n${indentedText}`.trim();
    }
    return `${lineHead}\n${indentedText}`.trim();
  };
  const cleanCardGroupLine = (entry) => {
    let cleanText = getSummaryEntryText(entry);
    const isVehicle = isVehicleListType(entry.type);
    if (isVehicle && entry.vehicleInfoSummary) {
      cleanText = stripDuplicateVehicleInfoLine(cleanText, entry.vehicleInfoSummary);
    }
    const indentedText = indentSummaryBody(cleanText);
    const locationSegment = entry.locationLabel ? `{ ${entry.locationLabel} }` : "";
    const locationLine = locationSegment ? `  ${locationSegment}` : "";
    const vehicleInfoSegment =
      isVehicle && entry.vehicleInfoSummary ? ` ${entry.vehicleInfoSummary}` : "";
    const lineHead = `${includeBullets ? "•" : "-"} ${entry.timestampText}${vehicleInfoSegment}`.trim();
    if (locationLine) {
      return `${lineHead}\n${locationLine}\n${indentedText}`.trim();
    }
    return `${lineHead}\n${indentedText}`.trim();
  };
  const cleanCategoryGroupLine = (entry) => {
    const isVehicle = isVehicleListType(entry.type);
    if (!isVehicle || !entry.vehicleInfoSummary) {
      return cleanLine(entry, true, false);
    }
    let cleanText = getSummaryEntryText(entry);
    cleanText = stripDuplicateVehicleInfoLine(cleanText, entry.vehicleInfoSummary);
    const indentedText = indentSummaryBody(cleanText);
    const locationSegment = entry.locationLabel ? `{ ${entry.locationLabel} }` : "";
    const locationLine = locationSegment ? `  ${locationSegment}` : "";
    const lineHead = `${entry.timestampText} ${entry.vehicleInfoSummary}`.trim();
    if (locationLine) {
      return `${lineHead}\n${locationLine}\n${indentedText}`.trim();
    }
    return `${lineHead}\n${indentedText}`.trim();
  };

  let lines = [];
  let groups = [];
  let mainLineCursor = headerLines.length;
  const timeSort = (a, b) =>
    state.summaryMostRecentFirst ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
  if (state.summarySort === "category") {
    const grouped = new Map();
    entries.forEach((entry) => {
      if (!grouped.has(entry.type)) {
        grouped.set(entry.type, []);
      }
      grouped.get(entry.type).push(entry);
    });
    const orderedTypes = Array.from(grouped.keys()).sort((a, b) =>
      getSummaryCategoryLabel(a).localeCompare(getSummaryCategoryLabel(b))
    );
    orderedTypes.forEach((type, index) => {
      const groupEntries = grouped.get(type).sort(timeSort);
      const heading = `${getSummaryCategoryHeading(type, includeEmojis, sanitizeNames).toUpperCase()}:`;
      const groupPrefix = includeBullets ? "•" : "-";
      const groupRows = groupEntries.map((entry) => ({
        text: `${groupPrefix} ${cleanCategoryGroupLine(entry)}`,
        entry,
      }));
      const groupLines = [heading];
      const groupLineLinks = new Map();
      let groupLineCursor = 0;
      lines.push(heading);
      mainLineCursor += 1;
      groupRows.forEach((row, rowIndex) => {
        lines.push(row.text);
        groupLines.push(row.text);
        mainLineLinks.set(mainLineCursor, row.entry);
        groupLineLinks.set(groupLineCursor, row.entry);
        mainLineCursor += countTextLines(row.text);
        groupLineCursor += countTextLines(row.text);
        if (addSpaceBetweenNotes && rowIndex < groupRows.length - 1) {
          lines.push("");
          groupLines.push("");
          mainLineCursor += 1;
          groupLineCursor += 1;
        }
      });
      groups.push({
        key: `category:${type}`,
        heading,
        lines: groupLines,
        lineLinks: groupLineLinks,
      });
      if (index < orderedTypes.length - 1) {
        lines.push("");
        mainLineCursor += 1;
      }
    });
  } else if (state.summarySort === "card") {
    const groupMap = new Map();
    entries.forEach((entry) => {
      if (!groupMap.has(entry.columnId)) {
        groupMap.set(entry.columnId, []);
      }
      groupMap.get(entry.columnId).push(entry);
    });
    const sortedColumns = state.columns
      .filter((column) => groupMap.has(column.id))
      .slice()
      .sort((a, b) => {
        const labelCompare = getSummaryCategoryLabel(
          a.type || DEFAULT_CARD_TYPE
        ).localeCompare(getSummaryCategoryLabel(b.type || DEFAULT_CARD_TYPE));
        if (labelCompare !== 0) {
          return labelCompare;
        }
        const aIndex = observerIndexMap.get(a.id) || 0;
        const bIndex = observerIndexMap.get(b.id) || 0;
        if (aIndex && bIndex && aIndex !== bIndex) {
          return aIndex - bIndex;
        }
        const aCreated = a.createdAt || 0;
        const bCreated = b.createdAt || 0;
        if (aCreated !== bCreated) {
          return aCreated - bCreated;
        }
        return String(a.label || "").localeCompare(String(b.label || ""));
      });
    sortedColumns.forEach((column, index) => {
      const groupEntries = groupMap.get(column.id).sort(timeSort);
      const headingLabel = getSummaryCardHeading(
        column,
        includeEmojis,
        sanitizeNames,
        observerIndexMap
      );
      const heading = `${headingLabel}:`;
      const groupRows = groupEntries.map((entry) => ({
        text: cleanCardGroupLine(entry),
        entry,
      }));
      const groupLines = [heading];
      const groupLineLinks = new Map();
      let groupLineCursor = 0;
      lines.push(heading);
      mainLineCursor += 1;
      groupRows.forEach((row, rowIndex) => {
        lines.push(row.text);
        groupLines.push(row.text);
        mainLineLinks.set(mainLineCursor, row.entry);
        groupLineLinks.set(groupLineCursor, row.entry);
        mainLineCursor += countTextLines(row.text);
        groupLineCursor += countTextLines(row.text);
        if (addSpaceBetweenNotes && rowIndex < groupRows.length - 1) {
          lines.push("");
          groupLines.push("");
          mainLineCursor += 1;
          groupLineCursor += 1;
        }
      });
      groups.push({
        key: `card:${column.id}`,
        heading,
        lines: groupLines,
        lineLinks: groupLineLinks,
      });
      if (index < sortedColumns.length - 1) {
        lines.push("");
        mainLineCursor += 1;
      }
    });
  } else {
    entries.sort(timeSort);
    entries.forEach((entry, index) => {
      const lineText = cleanLine(entry);
      lines.push(lineText);
      mainLineLinks.set(mainLineCursor, entry);
      mainLineCursor += countTextLines(lineText);
      if (addSpaceBetweenNotes && index < entries.length - 1) {
        lines.push("");
        mainLineCursor += 1;
      }
    });
  }

  summaryOutput.value = [header, ...lines].join("\n");
  const groupMode =
    state.summaryGroupFields !== false &&
    (state.summarySort === "category" || state.summarySort === "card");
  if (summaryGroupOutput) {
    summaryGroupOutput.classList.toggle("hidden", !groupMode);
  }
  if (summaryOutputWrap) {
    summaryOutputWrap.classList.toggle("hidden", groupMode);
  }
  summaryOutput.classList.toggle("hidden", groupMode);
  renderSummaryLineLinks({
    textarea: summaryOutput,
    linkTrack: summaryOutputLinkTrack,
    lineLinks: mainLineLinks,
    totalLines: countTextLines(summaryOutput.value),
  });
  if (groupMode) {
    renderSummaryGroupOutputs(groups);
  }
  refreshIcons();
}

