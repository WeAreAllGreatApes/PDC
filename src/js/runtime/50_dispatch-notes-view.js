/*
  Dispatch tab: notes editing, card rendering, and interactions
  Transitional split from the previous runtime monolith for maintainability.
*/

const minimizedDragState = { activeId: null, targetId: null, position: null };

function updateEndIfNeeded(date) {
  if (!state.endTime) {
    return;
  }
  if (date.getTime() > state.endTime.getTime()) {
    state.endTime = new Date(date.getTime());
    state.endAdjustedNote = "updated to match edited timestamp.";
    syncShiftUI();
  }
}

function updateStartIfNeeded(date) {
  if (!state.startTime) {
    return;
  }
  if (date.getTime() < state.startTime.getTime()) {
    state.startTime = new Date(date.getTime());
    syncShiftUI();
  }
}

function cycleDatalistOption(input, datalistEl, direction) {
  if (!datalistEl) {
    return;
  }
  const options = Array.from(datalistEl.options || []).map((opt) => opt.value);
  if (!options.length) {
    return;
  }
  const delta = direction === "prev" ? -1 : 1;
  let index = Number.parseInt(input.dataset.suggestIndex || "-1", 10);
  if (!Number.isFinite(index)) {
    index = -1;
  }
  let nextIndex = index + delta;
  if (nextIndex < 0) {
    nextIndex = options.length - 1;
  } else if (nextIndex >= options.length) {
    nextIndex = 0;
  }
  input.dataset.suggestIndex = String(nextIndex);
  input.value = options[nextIndex];
}

function addCommitOnEnter(input) {
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      input.blur();
    }
  });
}

function addLastFieldToPrimaryActionTabbing(
  lastField,
  primaryButton,
  { isEnabled = () => true } = {}
) {
  if (!lastField || !primaryButton) {
    return;
  }
  lastField.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || event.shiftKey) {
      return;
    }
    if (!isEnabled() || primaryButton.disabled) {
      return;
    }
    event.preventDefault();
    primaryButton.focus();
  });
  primaryButton.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || !event.shiftKey) {
      return;
    }
    if (!isEnabled()) {
      return;
    }
    event.preventDefault();
    lastField.focus();
  });
}

function createCustomSelect({
  options,
  value,
  ariaLabel,
  onChange,
  className,
  portal = false,
  matchButtonWidth = true,
}) {
  const wrap = document.createElement("div");
  wrap.className = ["select-wrap", className].filter(Boolean).join(" ");

  const button = document.createElement("button");
  button.type = "button";
  button.className = "select-button";
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-expanded", "false");
  if (ariaLabel) {
    button.setAttribute("aria-label", ariaLabel);
  }

  const menu = document.createElement("div");
  menu.className = "select-menu";
  if (portal) {
    menu.classList.add("select-menu-portal");
  }
  menu.setAttribute("role", "listbox");

  let selectedIndex = Math.max(
    0,
    options.findIndex((opt) => opt.value === value)
  );
  let activeIndex = selectedIndex;
  let isOpen = false;
  const optionEls = [];
  let closeListener = null;
  let keyListener = null;
  let suppressNextOpen = false;
  let usingPortal = false;

  function renderOptionLabel(target, option) {
    target.innerHTML = "";
    if (Array.isArray(option?.paletteColors) && option.paletteColors.length) {
      const preview = document.createElement("span");
      preview.className = "select-palette-preview";
      option.paletteColors.forEach((_, chipIndex) => {
        const chip = document.createElement("span");
        chip.className = `select-palette-chip palette-chip-${option?.value || "classic"}-${chipIndex}`;
        preview.appendChild(chip);
      });
      target.appendChild(preview);
    }
    if (option?.swatchClass) {
      const swatch = document.createElement("span");
      swatch.className = `select-color-swatch card-color-swatch ${option.swatchClass}`;
      target.appendChild(swatch);
    }
    if (option?.icon) {
      if (option.value === VEHICLE_LIST_CARD_TYPE) {
        const stack = createCardTypeIconNode(VEHICLE_LIST_CARD_TYPE);
        stack.classList.add("select-icon");
        target.appendChild(stack);
      } else {
        const icon = document.createElement("i");
        icon.setAttribute("data-lucide", option.icon);
        icon.className = "select-icon";
        target.appendChild(icon);
      }
    }
    const label = document.createElement("span");
    label.className = "select-label";
    label.textContent = option?.label || "";
    target.appendChild(label);
  }

  function syncButton() {
    renderOptionLabel(button, options[selectedIndex]);
    refreshIcons();
  }

  function syncOptions() {
    optionEls.forEach((el, index) => {
      el.classList.toggle("selected", index === selectedIndex);
      el.classList.toggle("active", index === activeIndex);
      el.setAttribute("aria-selected", String(index === selectedIndex));
    });
  }

  function setActive(index, shouldScroll = true) {
    if (!optionEls.length) {
      return;
    }
    activeIndex = index;
    syncOptions();
    if (shouldScroll) {
      optionEls[index].scrollIntoView({ block: "nearest" });
    }
  }

  function closeMenu() {
    if (!isOpen) {
      return;
    }
    isOpen = false;
    wrap.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
    if (usingPortal && menu.parentElement === document.body) {
      menu.remove();
      wrap.appendChild(menu);
      menu.style.position = "";
      menu.style.top = "";
      menu.style.left = "";
      menu.style.width = "";
      menu.style.minWidth = "";
      menu.style.display = "";
    }
    usingPortal = false;
    wrap.closest(".default-color-row")?.classList.remove("select-menu-open");
    if (closeListener) {
      document.removeEventListener("mousedown", closeListener);
      closeListener = null;
    }
    if (keyListener) {
      document.removeEventListener("keydown", keyListener, true);
      keyListener = null;
    }
    window.removeEventListener("scroll", handleReposition, true);
    window.removeEventListener("resize", handleReposition);
  }

  function handleReposition() {
    if (!isOpen || !usingPortal) {
      return;
    }
    const rect = button.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.top = `${rect.bottom + 6}px`;
    menu.style.left = `${rect.left}px`;
    if (matchButtonWidth) {
      menu.style.width = `${rect.width}px`;
    } else {
      menu.style.width = "max-content";
      menu.style.minWidth = `${rect.width}px`;
    }
  }

  function openMenu() {
    if (isOpen) {
      return;
    }
    isOpen = true;
    wrap.classList.add("open");
    button.setAttribute("aria-expanded", "true");
    setActive(selectedIndex);
    const shouldUsePortal = portal && !wrap.closest(".driver-active-element");
    usingPortal = shouldUsePortal;
    wrap.closest(".default-color-row")?.classList.add("select-menu-open");
    if (usingPortal) {
      if (menu.parentElement !== document.body) {
        menu.remove();
        document.body.appendChild(menu);
      }
      menu.style.display = "block";
      handleReposition();
      window.addEventListener("scroll", handleReposition, true);
      window.addEventListener("resize", handleReposition);
    }
    refreshIcons();
    closeListener = (event) => {
      if (!wrap.contains(event.target) && !menu.contains(event.target)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", closeListener);
    keyListener = (event) => {
      if (!isOpen) {
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        event.stopPropagation();
        const direction = event.shiftKey ? "prev" : "next";
        cycleActive(direction);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        selectIndex(activeIndex);
        closeMenu();
      }
    };
    document.addEventListener("keydown", keyListener, true);
  }

  function selectIndex(index) {
    selectedIndex = index;
    activeIndex = index;
    syncButton();
    syncOptions();
    if (onChange) {
      onChange(options[index].value, options[index]);
    }
  }

  function cycleActive(direction) {
    const delta = direction === "prev" ? -1 : 1;
    let nextIndex = activeIndex + delta;
    if (nextIndex < 0) {
      nextIndex = options.length - 1;
    } else if (nextIndex >= options.length) {
      nextIndex = 0;
    }
    setActive(nextIndex);
  }

  function suppressNextClickThrough() {
    const blockUntil = Date.now() + 450;
    suppressSelectClickThroughUntil = Math.max(suppressSelectClickThroughUntil, blockUntil);
    const blockClick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener("pointerup", blockClick, true);
    window.addEventListener("click", blockClick, true);
    window.setTimeout(() => {
      if (Date.now() < blockUntil) {
        return;
      }
      window.removeEventListener("pointerup", blockClick, true);
      window.removeEventListener("click", blockClick, true);
    }, 500);
  }

  function buildOption(option, index) {
    const optionEl = document.createElement("div");
    optionEl.className = "select-option";
    renderOptionLabel(optionEl, option);
    optionEl.setAttribute("role", "option");
    optionEl.setAttribute("aria-selected", String(index === selectedIndex));
    optionEl.addEventListener("mouseenter", () => {
      setActive(index, false);
    });
    const commitOptionSelection = (event) => {
      if (!isOpen) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (event.type === "pointerdown" || event.type === "mousedown") {
        suppressNextClickThrough();
      }
      selectIndex(index);
      closeMenu();
    };
    optionEl.addEventListener("pointerdown", commitOptionSelection);
    optionEl.addEventListener("mousedown", commitOptionSelection);
    optionEl.addEventListener("click", commitOptionSelection);
    return optionEl;
  }

  function renderOptions() {
    menu.innerHTML = "";
    optionEls.length = 0;
    options.forEach((option, index) => {
      const optionEl = buildOption(option, index);
      optionEls.push(optionEl);
      menu.appendChild(optionEl);
    });
    syncOptions();
    refreshIcons();
  }

  function setValue(nextValue, fallbackLabel) {
    let index = options.findIndex((opt) => opt.value === nextValue);
    if (index === -1) {
      const label =
        fallbackLabel || (nextValue ? `Custom (${nextValue})` : "Custom");
      options.push({ value: nextValue, label });
      index = options.length - 1;
      const optionEl = buildOption(options[index], index);
      optionEls.push(optionEl);
      menu.appendChild(optionEl);
    }
    selectedIndex = index;
    activeIndex = index;
    syncButton();
    syncOptions();
  }

  button.addEventListener("mousedown", (event) => {
    if (!isOpen) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    selectIndex(activeIndex);
    closeMenu();
    suppressNextOpen = true;
  });

  button.addEventListener("click", (event) => {
    if (Date.now() < suppressSelectClickThroughUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    event.stopPropagation();
    if (suppressNextOpen) {
      suppressNextOpen = false;
      return;
    }
    if (!isOpen) {
      openMenu();
    }
  });

  menu.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  button.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      if (!isOpen) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const direction = event.shiftKey ? "prev" : "next";
      cycleActive(direction);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
        return;
      }
      selectIndex(activeIndex);
      closeMenu();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
      }
      cycleActive("next");
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
      }
      cycleActive("prev");
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    }
  });

  renderOptions();
  syncButton();
  wrap.appendChild(button);
  wrap.appendChild(menu);

  return {
    element: wrap,
    setValue,
    close: closeMenu,
  };
}

function addTabCycleDatalist(
  input,
  datalistEl,
  { allowPrefixMatch = true, minPrefixChars = 1 } = {}
) {
  function commitClosestDatalistValue() {
    if (!datalistEl || !datalistEl.options || !datalistEl.options.length) {
      return;
    }
    const options = Array.from(datalistEl.options || []).map((opt) => String(opt.value || ""));
    const rawValue = String(input.value || "").trim();
    if (!rawValue) {
      return;
    }
    const lowerValue = rawValue.toLowerCase();
    let matchIndex = options.findIndex((value) => value.toLowerCase() === lowerValue);
    if (
      allowPrefixMatch &&
      matchIndex === -1 &&
      lowerValue.length >= Math.max(1, Number(minPrefixChars) || 1)
    ) {
      matchIndex = options.findIndex((value) => value.toLowerCase().startsWith(lowerValue));
    }
    if (matchIndex === -1) {
      return;
    }
    input.value = options[matchIndex];
    input.dataset.suggestIndex = String(matchIndex);
  }

  input.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      commitClosestDatalistValue();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (datalistEl && datalistEl.options && datalistEl.options.length && !input.value) {
        input.value = datalistEl.options[0].value;
      }
      commitClosestDatalistValue();
      input.blur();
    }
  });
}

function addUppercaseInputBehavior(input) {
  if (!input) {
    return;
  }
  input.addEventListener("input", () => {
    const current = String(input.value || "");
    const upper = current.toUpperCase();
    if (current === upper) {
      return;
    }
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = upper;
    if (typeof start === "number" && typeof end === "number") {
      input.setSelectionRange(start, end);
    }
  });
}

function handleTimestampEdit(obs, input, noteEl) {
  const parsed = parseShiftTimestamp(input.value);
  if (!parsed) {
    input.value = obs.timestampText;
    return;
  }
  const formatted = formatTimeOnly(parsed);
  if (formatted !== obs.timestampText) {
    if (!obs.editedFrom) {
      obs.editedFrom = obs.timestampText;
    }
    obs.timestamp = parsed;
    obs.timestampText = formatted;
    noteEl.textContent = `time modified from ${obs.editedFrom}`;
    markDirty();
    updateEndIfNeeded(parsed);
    updateStartIfNeeded(parsed);
    persistState();
    renderColumns();
    updateSummary();
  } else {
    input.value = formatted;
  }
}

function createVehicleInfoSection(obs, { hasStarted = true } = {}) {
  obs.vehicleInfo = normalizeVehicleInfo(obs.vehicleInfo || {});
  const section = document.createElement("div");
  section.className = "vehicle-note-section";

  const title = document.createElement("div");
  title.className = "vehicle-note-title";
  const titleMain = document.createElement("div");
  titleMain.className = "vehicle-note-title-main";
  const titleIcon = document.createElement("i");
  titleIcon.setAttribute("data-lucide", "car");
  titleIcon.setAttribute("aria-hidden", "true");
  const titleText = document.createElement("span");
  titleText.textContent = "Vehicle info";
  titleMain.appendChild(titleIcon);
  titleMain.appendChild(titleText);
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "vehicle-note-copy";
  copyButton.title = "Copy Vehicle Info";
  copyButton.setAttribute("aria-label", "Copy Vehicle Info");
  copyButton.innerHTML = '<i data-lucide="copy"></i>';
  ensureLucideIcon(copyButton);
  copyButton.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const info = normalizeVehicleInfo(obs?.vehicleInfo || parseVehicleInfoFromText(obs?.text || ""));
    const line = formatVehicleInfoForSummary(info);
    if (!line) {
      showAppToast("No vehicle info to copy.");
      return;
    }
    const copied = await copyTextToClipboard(line);
    showAppToast(copied ? "Vehicle info copied to clipboard" : "Clipboard blocked. Press Ctrl+C / Cmd+C.");
  });
  title.appendChild(titleMain);
  title.appendChild(copyButton);
  section.appendChild(title);

  const plateRow = document.createElement("div");
  plateRow.className = "vehicle-note-grid vehicle-note-grid-plate";

  const plateLabel = document.createElement("label");
  plateLabel.className = "vehicle-note-field vehicle-note-field-plate";
  const plateText = document.createElement("span");
  plateText.className = "vehicle-note-field-label";
  plateText.textContent = "Plate";
  const plateInput = document.createElement("input");
  plateInput.type = "text";
  plateInput.value = obs.vehicleInfo.plate || "";
  plateInput.disabled = !hasStarted;
  addUppercaseInputBehavior(plateInput);
  plateLabel.appendChild(plateText);
  plateLabel.appendChild(plateInput);

  const stateLabel = document.createElement("label");
  stateLabel.className = "vehicle-note-field";
  const stateText = document.createElement("span");
  stateText.className = "vehicle-note-field-label";
  stateText.textContent = "State";
  const stateInput = document.createElement("input");
  const stateListId = `vehicleState-${obs.id}`;
  stateInput.setAttribute("list", stateListId);
  stateInput.value = obs.vehicleInfo.state || "";
  stateInput.disabled = !hasStarted;
  const stateList = document.createElement("datalist");
  stateList.id = stateListId;
  STATES.forEach((stateName) => {
    const opt = document.createElement("option");
    opt.value = stateName;
    stateList.appendChild(opt);
  });
  stateLabel.appendChild(stateText);
  stateLabel.appendChild(stateInput);
  stateLabel.appendChild(stateList);

  plateRow.appendChild(plateLabel);
  plateRow.appendChild(stateLabel);
  section.appendChild(plateRow);

  const infoGrid = document.createElement("div");
  infoGrid.className = "vehicle-note-grid";

  const makeLabel = document.createElement("label");
  makeLabel.className = "vehicle-note-field vehicle-note-field-make";
  const makeText = document.createElement("span");
  makeText.className = "vehicle-note-field-label";
  makeText.textContent = "Make";
  const makeInput = document.createElement("input");
  const makeListId = `vehicleMake-${obs.id}`;
  makeInput.setAttribute("list", makeListId);
  makeInput.value = obs.vehicleInfo.make || "";
  makeInput.disabled = !hasStarted;
  const makeList = document.createElement("datalist");
  makeList.id = makeListId;
  VEHICLE_MAKES.forEach((makeName) => {
    const opt = document.createElement("option");
    opt.value = makeName;
    makeList.appendChild(opt);
  });
  makeLabel.appendChild(makeText);
  makeLabel.appendChild(makeInput);
  makeLabel.appendChild(makeList);

  const modelLabel = document.createElement("label");
  modelLabel.className = "vehicle-note-field vehicle-note-field-model";
  const modelText = document.createElement("span");
  modelText.className = "vehicle-note-field-label";
  modelText.textContent = "Model";
  const modelInput = document.createElement("input");
  const modelListId = `vehicleModel-${obs.id}`;
  modelInput.setAttribute("list", modelListId);
  modelInput.value = obs.vehicleInfo.model || "";
  modelInput.disabled = !hasStarted;
  const modelList = document.createElement("datalist");
  modelList.id = modelListId;
  modelLabel.appendChild(modelText);
  modelLabel.appendChild(modelInput);
  modelLabel.appendChild(modelList);

  const colorLabel = document.createElement("label");
  colorLabel.className = "vehicle-note-field vehicle-note-field-color";
  const colorText = document.createElement("span");
  colorText.className = "vehicle-note-field-label";
  colorText.textContent = "Color";
  const colorInput = document.createElement("input");
  const colorListId = `vehicleColor-${obs.id}`;
  colorInput.setAttribute("list", colorListId);
  colorInput.value = obs.vehicleInfo.color || "";
  colorInput.disabled = !hasStarted;
  const colorList = document.createElement("datalist");
  colorList.id = colorListId;
  VEHICLE_COLORS.forEach((colorName) => {
    const opt = document.createElement("option");
    opt.value = colorName;
    colorList.appendChild(opt);
  });
  colorLabel.appendChild(colorText);
  colorLabel.appendChild(colorInput);
  colorLabel.appendChild(colorList);

  const bodyLabel = document.createElement("label");
  bodyLabel.className = "vehicle-note-field vehicle-note-field-body";
  const bodyText = document.createElement("span");
  bodyText.className = "vehicle-note-field-label";
  bodyText.textContent = "Body style";
  const bodyInput = document.createElement("input");
  const bodyListId = `vehicleBody-${obs.id}`;
  bodyInput.setAttribute("list", bodyListId);
  bodyInput.value = obs.vehicleInfo.body || "";
  bodyInput.disabled = !hasStarted;
  const bodyList = document.createElement("datalist");
  bodyList.id = bodyListId;
  VEHICLE_BODY_OPTIONS.forEach((body) => {
    const opt = document.createElement("option");
    opt.value = body;
    bodyList.appendChild(opt);
  });
  bodyLabel.appendChild(bodyText);
  bodyLabel.appendChild(bodyInput);
  bodyLabel.appendChild(bodyList);

  infoGrid.appendChild(makeLabel);
  infoGrid.appendChild(modelLabel);
  infoGrid.appendChild(colorLabel);
  infoGrid.appendChild(bodyLabel);
  section.appendChild(infoGrid);

  function updateModelList() {
    const modelRaw = String(modelInput.value || "").trim();
    const bodyRaw = String(bodyInput.value || "").trim();
    const resolvedMake = resolveVehicleMake(makeInput.value);
    if (resolvedMake && makeInput.value !== resolvedMake) {
      makeInput.value = resolvedMake;
    }
    const models = getVehicleModelsForMake(resolvedMake);
    modelList.innerHTML = "";
    models.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.model;
      modelList.appendChild(opt);
    });
    const resolvedModel = resolveVehicleModel(modelRaw, resolvedMake);
    modelInput.value = resolvedModel || modelRaw;
    const matched = models.find((item) => item.model === resolvedModel) || null;
    const bodyOptions = matched?.body
      ? [matched.body]
      : Array.from(new Set(models.map((item) => item.body).filter(Boolean)));
    const scopedBodyOptions = bodyOptions.length ? bodyOptions : VEHICLE_BODY_OPTIONS;
    bodyList.innerHTML = "";
    scopedBodyOptions.forEach((bodyName) => {
      const opt = document.createElement("option");
      opt.value = bodyName;
      bodyList.appendChild(opt);
    });
    if (matched && matched.body) {
      bodyInput.value = matched.body;
    } else {
      bodyInput.value = resolveVehicleBody(bodyRaw) || bodyRaw;
    }
    return { resolvedMake, resolvedModel, matched };
  }

  function updateVehicleSectionValidationWarnings() {
    const makeRaw = String(makeInput.value || "").trim();
    const resolvedMake = resolveVehicleMake(makeRaw);
    const modelRaw = String(modelInput.value || "").trim();
    const resolvedModel = resolveVehicleModel(modelRaw, resolvedMake);
    const colorRaw = String(colorInput.value || "").trim();
    const resolvedColor = resolveVehicleColor(colorRaw);
    const bodyRaw = String(bodyInput.value || "").trim();
    const resolvedBody = resolveVehicleBody(bodyRaw);
    setVehicleValidationWarning(
      makeInput,
      Boolean(makeRaw && !resolvedMake),
      "Not in known makes. Manual entry will be kept."
    );
    setVehicleValidationWarning(
      modelInput,
      Boolean(modelRaw && !resolvedModel),
      resolvedMake
        ? "Not in known models for selected make. Manual entry will be kept."
        : "Not in known models. Manual entry will be kept."
    );
    setVehicleValidationWarning(
      colorInput,
      Boolean(colorRaw && !resolvedColor),
      "Not in known colors. Manual entry will be kept."
    );
    setVehicleValidationWarning(
      bodyInput,
      Boolean(bodyRaw && !resolvedBody),
      "Not in known body styles. Manual entry will be kept."
    );
  }

  function commitVehicleInfo() {
    const { resolvedMake, resolvedModel, matched } = updateModelList();
    const hasPlate = Boolean((plateInput.value || "").trim());
    const nextInfo = normalizeVehicleInfo({
      plateVisible: hasPlate,
      plate: plateInput.value,
      reason: "",
      state: stateInput.value,
      color: colorInput.value,
      make: makeInput.value,
      model: modelInput.value,
      body: matched?.body || bodyInput.value,
    });
    obs.vehicleInfo = nextInfo;
    plateInput.value = nextInfo.plate || "";
    stateInput.value = nextInfo.state || "";
    colorInput.value = nextInfo.color || "";
    makeInput.value = nextInfo.make || "";
    modelInput.value = nextInfo.model || "";
    bodyInput.value = nextInfo.body || "";
    updateVehicleSectionValidationWarnings();
    markDirty();
    persistState();
    updateSummary();
    renderMapPins();
  }

  [plateInput, stateInput, colorInput, makeInput, modelInput, bodyInput]
    .forEach((input) => {
      addCommitOnEnter(input);
    });
  addTabCycleDatalist(stateInput, stateList);
  addTabCycleDatalist(makeInput, makeList, { allowPrefixMatch: false });
  addTabCycleDatalist(colorInput, colorList, { allowPrefixMatch: false });
  addTabCycleDatalist(modelInput, modelList, { allowPrefixMatch: false });
  addTabCycleDatalist(bodyInput, bodyList, { allowPrefixMatch: false });

  plateInput.addEventListener("blur", commitVehicleInfo);
  stateInput.addEventListener("blur", commitVehicleInfo);
  colorInput.addEventListener("blur", commitVehicleInfo);
  makeInput.addEventListener("input", () => {
    updateModelList();
    updateVehicleSectionValidationWarnings();
  });
  makeInput.addEventListener("blur", commitVehicleInfo);
  modelInput.addEventListener("input", () => {
    updateModelList();
    updateVehicleSectionValidationWarnings();
  });
  modelInput.addEventListener("blur", commitVehicleInfo);
  bodyInput.addEventListener("input", updateVehicleSectionValidationWarnings);
  bodyInput.addEventListener("blur", commitVehicleInfo);

  updateModelList();
  updateVehicleSectionValidationWarnings();
  return section;
}

function createVehicleCardHeaderSection(column, options = {}) {
  column.vehicleProfile = normalizeVehicleInfo(column.vehicleProfile || {});
  const wrap = document.createElement("div");
  wrap.className = "vehicle-card-header";

  const topRow = document.createElement("div");
  topRow.className = "vehicle-card-header-top";
  const middleRow = document.createElement("div");
  middleRow.className = "vehicle-card-header-middle";
  const bottomRow = document.createElement("div");
  bottomRow.className = "vehicle-card-header-bottom";
  const typeSelectElement = options?.typeSelect || null;
  if (typeSelectElement) {
    topRow.classList.add("has-type");
  }

  function buildField(labelText, className, listId = "") {
    const label = document.createElement("label");
    label.className = `vehicle-card-field ${className}`.trim();
    const text = document.createElement("span");
    text.className = "vehicle-card-field-label";
    text.textContent = labelText;
    const input = document.createElement("input");
    input.type = "text";
    if (listId) {
      input.setAttribute("list", listId);
    }
    label.appendChild(text);
    label.appendChild(input);
    return { label, input };
  }

  const stateListId = `vehicleCardState-${column.id}`;
  const makeListId = `vehicleCardMake-${column.id}`;
  const modelListId = `vehicleCardModel-${column.id}`;
  const colorListId = `vehicleCardColor-${column.id}`;
  const bodyListId = `vehicleCardBody-${column.id}`;

  const plateField = buildField("Plate", "plate");
  const stateField = buildField("State", "state", stateListId);
  const makeField = buildField("Make", "make", makeListId);
  const modelField = buildField("Model", "model", modelListId);
  const colorField = buildField("Color", "color", colorListId);
  const bodyField = buildField("Body Style", "body", bodyListId);

  const stateList = document.createElement("datalist");
  stateList.id = stateListId;
  STATES.forEach((stateName) => {
    const opt = document.createElement("option");
    opt.value = stateName;
    stateList.appendChild(opt);
  });
  stateField.label.appendChild(stateList);

  const makeList = document.createElement("datalist");
  makeList.id = makeListId;
  VEHICLE_MAKES.forEach((makeName) => {
    const opt = document.createElement("option");
    opt.value = makeName;
    makeList.appendChild(opt);
  });
  makeField.label.appendChild(makeList);

  const modelList = document.createElement("datalist");
  modelList.id = modelListId;
  modelField.label.appendChild(modelList);

  const colorList = document.createElement("datalist");
  colorList.id = colorListId;
  VEHICLE_COLORS.forEach((colorName) => {
    const opt = document.createElement("option");
    opt.value = colorName;
    colorList.appendChild(opt);
  });
  colorField.label.appendChild(colorList);

  const bodyList = document.createElement("datalist");
  bodyList.id = bodyListId;
  VEHICLE_BODY_OPTIONS.forEach((bodyName) => {
    const opt = document.createElement("option");
    opt.value = bodyName;
    bodyList.appendChild(opt);
  });
  bodyField.label.appendChild(bodyList);

  function updateModelList() {
    const resolvedMake = resolveVehicleMake(makeField.input.value);
    const models = getVehicleModelsForMake(resolvedMake);
    const seen = new Set();
    modelList.innerHTML = "";
    models.forEach((item) => {
      const model = String(item?.model || "").trim();
      if (!model || seen.has(model.toLowerCase())) {
        return;
      }
      seen.add(model.toLowerCase());
      const opt = document.createElement("option");
      opt.value = model;
      modelList.appendChild(opt);
    });
  }

  function commitVehicleProfile() {
    const resolvedMake = resolveVehicleMake(makeField.input.value);
    const resolvedModel = resolveVehicleModel(modelField.input.value, resolvedMake);
    const modelBody = getVehicleModelsForMake(resolvedMake).find(
      (item) => item.model === resolvedModel
    )?.body;
    const next = normalizeVehicleInfo({
      plateVisible: true,
      plate: plateField.input.value,
      reason: "",
      state: stateField.input.value,
      color: colorField.input.value,
      make: resolvedMake || makeField.input.value,
      model: resolvedModel || modelField.input.value,
      body: modelBody || bodyField.input.value,
    });
    column.vehicleProfile = next;
    plateField.input.value = next.plate || "";
    stateField.input.value = next.state || "";
    colorField.input.value = next.color || "";
    makeField.input.value = next.make || "";
    modelField.input.value = next.model || "";
    bodyField.input.value = next.body || "";
    updateModelList();
    markDirty();
    persistState();
    updateSummary();
    renderMapPins();
  }

  function updateVehicleCardHeaderValidationWarnings() {
    const makeRaw = String(makeField.input.value || "").trim();
    const resolvedMake = resolveVehicleMake(makeRaw);
    const modelRaw = String(modelField.input.value || "").trim();
    const resolvedModel = resolveVehicleModel(modelRaw, resolvedMake);
    const colorRaw = String(colorField.input.value || "").trim();
    const resolvedColor = resolveVehicleColor(colorRaw);
    const bodyRaw = String(bodyField.input.value || "").trim();
    const resolvedBody = resolveVehicleBody(bodyRaw);
    setVehicleValidationWarning(
      makeField.input,
      Boolean(makeRaw && !resolvedMake),
      "Not in known makes. Manual entry will be kept."
    );
    setVehicleValidationWarning(
      modelField.input,
      Boolean(modelRaw && !resolvedModel),
      resolvedMake
        ? "Not in known models for selected make. Manual entry will be kept."
        : "Not in known models. Manual entry will be kept."
    );
    setVehicleValidationWarning(
      colorField.input,
      Boolean(colorRaw && !resolvedColor),
      "Not in known colors. Manual entry will be kept."
    );
    setVehicleValidationWarning(
      bodyField.input,
      Boolean(bodyRaw && !resolvedBody),
      "Not in known body styles. Manual entry will be kept."
    );
  }

  plateField.input.value = column.vehicleProfile.plate || "";
  addUppercaseInputBehavior(plateField.input);
  stateField.input.value = column.vehicleProfile.state || "";
  makeField.input.value = column.vehicleProfile.make || "";
  modelField.input.value = column.vehicleProfile.model || "";
  colorField.input.value = column.vehicleProfile.color || "";
  bodyField.input.value = column.vehicleProfile.body || "";
  updateModelList();

  [plateField.input, stateField.input, makeField.input, modelField.input, colorField.input, bodyField.input]
    .forEach((input) => addCommitOnEnter(input));
  addTabCycleDatalist(stateField.input, stateList);
  addTabCycleDatalist(makeField.input, makeList, { allowPrefixMatch: false });
  addTabCycleDatalist(modelField.input, modelList, { allowPrefixMatch: false });
  addTabCycleDatalist(colorField.input, colorList, { allowPrefixMatch: false });
  addTabCycleDatalist(bodyField.input, bodyList, { allowPrefixMatch: false });

  makeField.input.addEventListener("input", () => {
    updateModelList();
    updateVehicleCardHeaderValidationWarnings();
  });
  modelField.input.addEventListener("input", () => {
    updateModelList();
    updateVehicleCardHeaderValidationWarnings();
  });
  colorField.input.addEventListener("input", updateVehicleCardHeaderValidationWarnings);
  bodyField.input.addEventListener("input", updateVehicleCardHeaderValidationWarnings);
  [plateField.input, stateField.input, makeField.input, modelField.input, colorField.input, bodyField.input]
    .forEach((input) => input.addEventListener("blur", commitVehicleProfile));

  if (typeSelectElement) {
    topRow.appendChild(typeSelectElement);
  }
  topRow.appendChild(plateField.label);
  topRow.appendChild(stateField.label);
  middleRow.appendChild(makeField.label);
  middleRow.appendChild(modelField.label);
  bottomRow.appendChild(colorField.label);
  bottomRow.appendChild(bodyField.label);
  wrap.appendChild(topRow);
  wrap.appendChild(middleRow);
  wrap.appendChild(bottomRow);
  updateVehicleCardHeaderValidationWarnings();
  return wrap;
}

function renderColumns() {
  applyDynamicCardColorStyles();
  const scrollPositions = new Map();
  const notePositions = new Map();
  if (columnsEl) {
    columnsEl.querySelectorAll(".column").forEach((columnEl) => {
      const columnId = columnEl.dataset.columnId;
      const observationsEl = columnEl.querySelector(".observations");
      if (columnId && observationsEl) {
        scrollPositions.set(columnId, observationsEl.scrollTop);
      }
      columnEl.querySelectorAll(".observation[data-note-id]").forEach((obsEl) => {
        if (!obsEl.dataset.noteId || !columnId) {
          return;
        }
        notePositions.set(obsEl.dataset.noteId, {
          columnId,
          top: obsEl.offsetTop,
        });
      });
    });
  }

  columnsEl.innerHTML = "";
  const visibleColumns = state.columns.filter((column) => !column.minimized);
  const pendingScrollRestore = [];
  visibleColumns.forEach((column) => {
    sortColumnObservations(column);
    const columnEl = document.createElement("div");
    columnEl.className = "column";
    if (column.justExpanded) {
      columnEl.classList.add("expanding");
      column.justExpanded = false;
    }
    columnEl.dataset.color = String(normalizeColorIndex(column.color));
    columnEl.dataset.columnId = column.id;
    columnEl.addEventListener("click", (event) => {
      if (event.target.closest(".column-header") || event.target.closest(".observation")) {
        return;
      }
      selectColumn(column.id);
      applySelectionUI();
      scrollSelectionIntoView();
    });
    const hasStarted = Boolean(state.startTime);
    if (!hasStarted) {
      columnEl.classList.add("disabled");
    }

    const headerEl = document.createElement("div");
    headerEl.className = "column-header";

    const headerLeft = document.createElement("div");
    headerLeft.className = "header-left";

    let typeSelect = null;
    typeSelect = createCustomSelect({
      options: getSelectableCardTypes(column.type || DEFAULT_CARD_TYPE).map((type) => ({
        value: type.value,
        label: type.label,
        icon: type.icon,
      })),
      value: column.type || DEFAULT_CARD_TYPE,
      ariaLabel: "Card type",
      className: "type-dropdown",
      portal: true,
      matchButtonWidth: false,
      onChange: (nextType) => {
        const oldType = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
        const resolvedNextType = normalizeCardType(nextType);
        if (
          oldType !== resolvedNextType &&
          !confirmCardTypeChange(column, resolvedNextType)
        ) {
          typeSelect?.setValue(oldType);
          return;
        }
        column.type = resolvedNextType;
        if (column.labelAuto) {
          column.label = getNextCustomLabelForType(resolvedNextType, column.id);
        }
        if (isVehicleCardType(resolvedNextType)) {
          column.vehicleProfile = normalizeVehicleInfo(column.vehicleProfile || {});
          column.observations.forEach((obs) => {
            obs.vehicleInfo = null;
          });
        } else {
          column.vehicleProfile = null;
          if (!isVehicleListType(resolvedNextType)) {
            column.observations.forEach((obs) => {
              obs.vehicleInfo = null;
            });
          }
        }
        if (
          (state.cardColorDefaults?.mode === "manual" ||
            state.cardColorDefaults?.mode === "all-grey" ||
            state.cardColorDefaults?.mode === "color-by-type") &&
          oldType !== resolvedNextType
        ) {
          column.color = getDefaultColorForCardType(resolvedNextType);
        }
        markDirty();
        persistState();
        renderColumns();
        updateSummary();
      },
    });

    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.className = "label-input";
    labelInput.placeholder = "Label";
    labelInput.value = column.label || "";
    addCommitOnEnter(labelInput);
    labelInput.addEventListener("input", (event) => {
      column.label = event.target.value;
      column.labelAuto = false;
      markDirty();
      persistState();
      updateSummary();
      renderMapPins();
    });

    const actionsWrap = document.createElement("div");
    actionsWrap.className = "card-actions-top";

    let cardPinButton = null;
    if (LOCATION_TAGGING_ENABLED) {
      cardPinButton = createPinButton({
        disabled: false,
        title: column.location
          ? "Location set for all notes.\nClick to change"
          : "Pin location for ALL NOTES on this card",
        active: Boolean(column.location),
      });
      cardPinButton.classList.add("card-pin");
      cardPinButton.addEventListener("click", (event) => {
        event.stopPropagation();
        openLocationModal({ kind: "card", columnId: column.id });
      });
    }

    const reportAllButton = document.createElement("button");
    reportAllButton.className = "card-action report-all";
    reportAllButton.type = "button";
    reportAllButton.textContent = "Report All";
    reportAllButton.setAttribute("aria-label", "Report all notes in card");
    reportAllButton.title = "Make all notes on this card\nreportable in summary";
    reportAllButton.setAttribute("aria-pressed", String(Boolean(column.reportAll)));
    reportAllButton.classList.toggle("active", Boolean(column.reportAll));
    reportAllButton.addEventListener("click", () => {
      column.reportAll = !column.reportAll;
      reportAllButton.classList.toggle("active", column.reportAll);
      reportAllButton.setAttribute("aria-pressed", String(column.reportAll));
      column.observations.forEach((obs) => {
        obs.reportable = column.reportAll;
      });
      const columnSelector = `[data-column-id="${escapeSelector(column.id)}"]`;
      const columnNode = columnsEl ? columnsEl.querySelector(columnSelector) : null;
      if (columnNode) {
        columnNode.querySelectorAll(".reportable-toggle").forEach((toggle) => {
          toggle.classList.toggle("active", column.reportAll);
          toggle.setAttribute("aria-pressed", String(column.reportAll));
          if (column.reportAll) {
            toggle.classList.add("animate");
            setTimeout(() => {
              toggle.classList.remove("animate");
            }, 300);
          }
        });
      }
      markDirty();
      persistState();
      updateSummary();
    });
    const reportAllCheck = document.createElement("span");
    reportAllCheck.className = "report-all-check";
    reportAllCheck.setAttribute("aria-hidden", "true");
    reportAllCheck.textContent = "✓";
    reportAllButton.appendChild(reportAllCheck);

    const colorWrap = document.createElement("div");
    colorWrap.className = "card-color-dropdown";

    const colorButton = document.createElement("button");
    colorButton.className = "card-action color-action";
    colorButton.type = "button";
    colorButton.setAttribute("aria-label", "Card color");
    colorButton.setAttribute("aria-haspopup", "menu");
    colorButton.setAttribute("aria-expanded", "false");
    colorButton.title = "Change color";
    const paletteIcon = document.createElement("i");
    paletteIcon.setAttribute("data-lucide", "droplet");
    colorButton.appendChild(paletteIcon);
    colorWrap.appendChild(colorButton);

    const colorMenu = document.createElement("div");
    colorMenu.className = "card-color-menu";
    colorMenu.setAttribute("role", "menu");
    const colorTitle = document.createElement("div");
    colorTitle.className = "card-color-title";
    colorTitle.textContent = "Color Override";
    colorMenu.appendChild(colorTitle);
    const colorSettingsLink = document.createElement("button");
    colorSettingsLink.type = "button";
    colorSettingsLink.className = "card-color-settings-link";
    colorSettingsLink.textContent = "Color Settings";
    colorSettingsLink.addEventListener("click", (event) => {
      event.stopPropagation();
      closeColorMenu();
      focusCardColorSettings();
    });
    const colorOptions = [];

    let colorMenuOpen = false;
    let colorMenuCloseListener = null;
    let colorMenuKeyListener = null;

    function closeColorMenu() {
      if (!colorMenuOpen) {
        return;
      }
      colorMenuOpen = false;
      colorWrap.classList.remove("open");
      colorButton.setAttribute("aria-expanded", "false");
      if (colorMenuCloseListener) {
        document.removeEventListener("mousedown", colorMenuCloseListener);
        colorMenuCloseListener = null;
      }
      if (colorMenuKeyListener) {
        document.removeEventListener("keydown", colorMenuKeyListener, true);
        colorMenuKeyListener = null;
      }
    }

    function openColorMenu() {
      if (colorMenuOpen) {
        return;
      }
      colorMenuOpen = true;
      colorWrap.classList.add("open");
      colorButton.setAttribute("aria-expanded", "true");
      colorOptions.forEach((optionEl) => {
        optionEl.classList.remove("active");
      });
      const selectedOption =
        colorOptions.find((optionEl) => optionEl.classList.contains("selected")) ||
        colorOptions[0];
      if (selectedOption) {
        selectedOption.classList.add("active");
        selectedOption.focus();
      }
      colorMenuCloseListener = (event) => {
        if (!colorWrap.contains(event.target)) {
          closeColorMenu();
        }
      };
      document.addEventListener("mousedown", colorMenuCloseListener);
      colorMenuKeyListener = (event) => {
        if (!colorMenuOpen) {
          return;
        }
        if (event.key === "Escape") {
          closeColorMenu();
          colorButton.focus();
          event.preventDefault();
          return;
        }
        if (event.key === "Tab") {
          event.preventDefault();
          const focusableElements = [...colorOptions, colorSettingsLink];
          const current = document.activeElement;
          let currentIndex = focusableElements.findIndex((optionEl) => optionEl === current);
          if (currentIndex === -1) {
            currentIndex = colorOptions.findIndex((optionEl) =>
              optionEl.classList.contains("active")
            );
          }
          if (currentIndex === -1) {
            currentIndex = 0;
          }
          const delta = event.shiftKey ? -1 : 1;
          let nextIndex = currentIndex + delta;
          if (nextIndex < 0) {
            nextIndex = focusableElements.length - 1;
          } else if (nextIndex >= focusableElements.length) {
            nextIndex = 0;
          }
          colorOptions.forEach((optionEl) => optionEl.classList.remove("active"));
          const nextOption = focusableElements[nextIndex];
          if (nextOption) {
            if (colorOptions.includes(nextOption)) {
              nextOption.classList.add("active");
            }
            nextOption.focus();
          }
        }
      };
      document.addEventListener("keydown", colorMenuKeyListener, true);
    }

    ACTIVE_COLUMN_COLOR_INDICES.forEach((colorIndex) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "card-color-option";
      option.setAttribute("role", "menuitem");
      option.tabIndex = 0;
      option.classList.toggle("selected", colorIndex === normalizeColorIndex(column.color));
      const swatch = document.createElement("span");
      swatch.className = `card-color-swatch color-${colorIndex}`;
      const label = document.createElement("span");
      label.className = "card-color-label";
      label.textContent = getColorNameByIndex(colorIndex);
      option.appendChild(swatch);
      option.appendChild(label);
      option.addEventListener("click", (event) => {
        event.stopPropagation();
        if (normalizeColorIndex(column.color) !== colorIndex) {
          column.color = colorIndex;
          markDirty();
          persistState();
          renderColumns();
          renderMapPins();
        }
        colorOptions.forEach((optionEl) => {
          optionEl.classList.remove("active");
        });
        option.classList.add("active");
        closeColorMenu();
      });
      colorMenu.appendChild(option);
      colorOptions.push(option);
    });
    colorMenu.appendChild(colorSettingsLink);

    colorButton.addEventListener("click", (event) => {
      event.stopPropagation();
      if (colorMenuOpen) {
        closeColorMenu();
      } else {
        openColorMenu();
      }
    });

    colorMenu.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    colorMenu.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeColorMenu();
        colorButton.focus();
        return;
      }
      if (event.key === "Enter") {
        const target = document.activeElement;
        if (target && colorMenu.contains(target)) {
          event.preventDefault();
          target.click();
        }
      }
    });

    colorWrap.appendChild(colorMenu);

    const actionsRight = document.createElement("div");
    actionsRight.className = "card-actions-right";

    const reorderHandle = document.createElement("div");
    reorderHandle.className = "reorder-handle";
    reorderHandle.setAttribute("aria-hidden", "true");
    reorderHandle.title = "Hold and drag to move card";
    reorderHandle.draggable = true;
    const gripIcon = document.createElement("i");
    gripIcon.setAttribute("data-lucide", "move");
    reorderHandle.appendChild(gripIcon);
    reorderHandle.addEventListener("dragstart", (event) => {
      dragState.activeId = column.id;
      dragState.targetId = null;
      dragState.position = null;
      columnEl.classList.add("dragging");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", column.id);
      }
    });
    reorderHandle.addEventListener("dragend", () => {
      columnEl.classList.remove("dragging");
      commitColumnReorder();
    });

    const minimizeButton = document.createElement("button");
    minimizeButton.className = "card-action";
    minimizeButton.type = "button";
    minimizeButton.textContent = "−";
    minimizeButton.setAttribute("aria-label", "Minimize card");
    minimizeButton.title = "Minimize card";
    minimizeButton.addEventListener("click", () => {
      columnEl.classList.add("minimizing");
      const finalize = () => {
        column.minimized = true;
        markDirty();
        renderColumns();
        persistState();
        updateSummary();
      };
      let settled = false;
      const onDone = () => {
        if (settled) {
          return;
        }
        settled = true;
        finalize();
      };
      columnEl.addEventListener("transitionend", onDone, { once: true });
      setTimeout(onDone, 260);
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "card-action";
    deleteButton.type = "button";
    deleteButton.textContent = "✕";
    deleteButton.setAttribute("aria-label", "Delete card");
    deleteButton.title = "Delete card";
    deleteButton.addEventListener("click", () => {
      openColumnDeleteModal(column.id);
    });

    actionsRight.appendChild(minimizeButton);
    actionsRight.appendChild(deleteButton);
    if (cardPinButton) {
      actionsWrap.appendChild(cardPinButton);
    }
    actionsWrap.appendChild(reportAllButton);
    actionsWrap.appendChild(colorWrap);
    actionsWrap.appendChild(reorderHandle);
    actionsWrap.appendChild(actionsRight);

    if (isVehicleCardType(column.type || DEFAULT_CARD_TYPE)) {
      headerLeft.classList.add("vehicle-card-header-left");
      headerLeft.appendChild(
        createVehicleCardHeaderSection(column, { typeSelect: typeSelect.element })
      );
    } else {
      headerLeft.appendChild(typeSelect.element);
      headerLeft.appendChild(labelInput);
    }
    const cardHeaderRow = document.createElement("div");
    cardHeaderRow.className = "card-header-row";
    cardHeaderRow.appendChild(headerLeft);

    headerEl.appendChild(actionsWrap);
    headerEl.appendChild(cardHeaderRow);
    if (LOCATION_TAGGING_ENABLED && column.location) {
      headerEl.appendChild(
        createLocationRow(column.location, `card:${column.id}`, {
          kind: "card",
          columnId: column.id,
        })
      );
    }
    headerEl.draggable = false;
    headerEl.addEventListener("click", (event) => {
      if (event.target.closest("input, button, .select-wrap")) {
        return;
      }
      selectColumn(column.id);
      applySelectionUI();
      scrollSelectionIntoView();
    });
    if (!isVehicleCardType(column.type || DEFAULT_CARD_TYPE)) {
      labelInput.addEventListener("focus", () => {
        selectColumn(column.id);
        applySelectionUI();
        scrollSelectionIntoView();
      });
    }

    const observationsEl = document.createElement("div");
    observationsEl.className = "observations";
    observationsEl.addEventListener("dragover", (event) => {
      if (!noteDragState.noteId) {
        return;
      }
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
      if (noteDragState.fromColumnId === column.id) {
        return;
      }
      columnEl.classList.add("note-drop-target");
    });
    observationsEl.addEventListener("dragleave", (event) => {
      if (!noteDragState.noteId) {
        return;
      }
      if (!observationsEl.contains(event.relatedTarget)) {
        columnEl.classList.remove("note-drop-target");
      }
    });
    observationsEl.addEventListener("drop", (event) => {
      if (!noteDragState.noteId) {
        return;
      }
      event.preventDefault();
      const { noteId, fromColumnId } = noteDragState;
      noteDragState.noteId = null;
      noteDragState.fromColumnId = null;
      clearNoteDropTargets();
      moveObservationToColumn(fromColumnId, column.id, noteId);
    });
    if (scrollPositions.has(column.id)) {
      pendingScrollRestore.push({ columnId: column.id, target: observationsEl });
    }

    if (!hasStarted) {
      const helper = document.createElement("div");
      helper.className = "column-helper";
      helper.textContent = "Hit Start to begin taking notes.";
      observationsEl.appendChild(helper);
    }

    const observationsForRender =
      state.notesNewestFirst === false
        ? column.observations
        : column.observations.slice().reverse();
    observationsForRender.forEach((obs) => {
      const obsEl = document.createElement("div");
      obsEl.className = "observation";
      obsEl.dataset.noteId = obs.id;
      obsEl.draggable = true;
      obsEl.addEventListener("dragstart", (event) => {
        if (event.target.closest("input, textarea, button, .select-wrap")) {
          event.preventDefault();
          return;
        }
        const activeEl = document.activeElement;
        if (activeEl && obsEl.contains(activeEl) && activeEl.matches("input, textarea")) {
          event.preventDefault();
          return;
        }
        noteDragState.noteId = obs.id;
        noteDragState.fromColumnId = column.id;
        obsEl.classList.add("dragging-note");
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", obs.id);
        }
      });
      obsEl.addEventListener("dragend", () => {
        obsEl.classList.remove("dragging-note");
        noteDragState.noteId = null;
        noteDragState.fromColumnId = null;
        clearNoteDropTargets();
      });

      obs.timestampText = formatTimeOnly(obs.timestamp);

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-note";
      deleteButton.type = "button";
      deleteButton.textContent = "X";
      deleteButton.setAttribute("aria-label", "Delete note");
      deleteButton.title = "Delete note";
      deleteButton.addEventListener("click", () => {
        openDeleteModal(column.id, obs.id);
      });

      const reportableButton = document.createElement("button");
      reportableButton.className = "reportable-toggle";
      reportableButton.type = "button";
      reportableButton.setAttribute("aria-pressed", String(Boolean(obs.reportable)));
      reportableButton.setAttribute("aria-label", "Toggle report note");
      reportableButton.title = "Make this note reportable in summary";
      reportableButton.disabled = !hasStarted;
      reportableButton.classList.toggle("active", Boolean(obs.reportable));
      reportableButton.addEventListener("click", (event) => {
        event.stopPropagation();
        selectNote(column.id, obs.id);
        applySelectionUI();
        obs.reportable = !obs.reportable;
        reportableButton.classList.toggle("active", obs.reportable);
        reportableButton.setAttribute("aria-pressed", String(obs.reportable));
        if (obs.reportable) {
          reportableButton.classList.add("animate");
          setTimeout(() => {
            reportableButton.classList.remove("animate");
          }, 300);
        }
        markDirty();
        persistState();
        updateSummary();
      });
      const reportableLabel = document.createElement("span");
      reportableLabel.className = "reportable-label";
      reportableLabel.textContent = "Report";
      const reportableCheck = document.createElement("span");
      reportableCheck.className = "reportable-check";
      reportableCheck.setAttribute("aria-hidden", "true");
      reportableCheck.textContent = "✓";
      reportableButton.appendChild(reportableLabel);
      reportableButton.appendChild(reportableCheck);

      const timestampInput = document.createElement("input");
      timestampInput.className = "timestamp";
      timestampInput.type = "text";
      timestampInput.value = formatTimeOnly(obs.timestamp);
      timestampInput.disabled = !hasStarted;
      timestampInput.title = "Click to edit timestamp";
      addCommitOnEnter(timestampInput);
      timestampInput.addEventListener("focus", () => {
        obsEl.draggable = false;
      });
      timestampInput.addEventListener("blur", () => {
        obsEl.draggable = true;
      });

      const noteHeaderRow = document.createElement("div");
      noteHeaderRow.className = "note-header-row";
      const notePinDisabled = Boolean(column.location);
      noteHeaderRow.appendChild(timestampInput);
      if (LOCATION_TAGGING_ENABLED) {
        const notePinButton = createPinButton({
          disabled: notePinDisabled,
          title: notePinDisabled
            ? "\nLocation inherited from Card.\nClear it to assign different note locations."
            : obs.location
              ? "Change location"
              : "Pin to a location",
          active: Boolean(obs.location),
        });
        if (notePinDisabled) {
          notePinButton.classList.add("inherited");
        }
        notePinButton.addEventListener("click", (event) => {
          event.stopPropagation();
          if (notePinDisabled) {
            return;
          }
          openLocationModal({ kind: "note", columnId: column.id, obsId: obs.id });
        });
        noteHeaderRow.appendChild(notePinButton);
      }

      const editedNote = document.createElement("div");
      editedNote.className = "edited-note";
      editedNote.textContent = obs.editedFrom ? `edited from ${obs.editedFrom}` : "";

      const timestampRule = document.createElement("div");
      timestampRule.className = "timestamp-rule";

      const textArea = document.createElement("textarea");
      textArea.value = obs.text;
      textArea.disabled = !hasStarted;
      textArea.addEventListener("input", (event) => {
        obs.text = event.target.value;
        markDirty();
        persistState();
        updateSummary();
      });
      textArea.addEventListener("focus", () => {
        obsEl.draggable = false;
      });
      textArea.addEventListener("blur", () => {
        obsEl.draggable = true;
      });
      textArea.addEventListener("focus", () => {
        selectNote(column.id, obs.id);
        applySelectionUI();
      });
      textArea.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          textArea.blur();
          selectNote(column.id, obs.id);
          applySelectionUI();
        }
      });

      timestampInput.addEventListener("blur", () => {
        handleTimestampEdit(obs, timestampInput, editedNote);
      });

      obsEl.appendChild(reportableButton);
      obsEl.appendChild(deleteButton);
      obsEl.appendChild(noteHeaderRow);
      obsEl.appendChild(editedNote);
      obsEl.appendChild(timestampRule);
      if (LOCATION_TAGGING_ENABLED && obs.location) {
        obsEl.appendChild(
          createLocationRow(obs.location, `note:${column.id}:${obs.id}`, {
            kind: "note",
            columnId: column.id,
            obsId: obs.id,
          })
        );
      }
      if (isVehicleListType(column.type || DEFAULT_CARD_TYPE)) {
        obsEl.appendChild(createVehicleInfoSection(obs, { hasStarted }));
      }
      obsEl.appendChild(textArea);
      obsEl.addEventListener("click", (event) => {
        event.stopPropagation();
        selectNote(column.id, obs.id);
        applySelectionUI();
      });
      observationsEl.appendChild(obsEl);
    });

      const addButton = document.createElement("button");
      addButton.className = "add-observation";
      addButton.textContent = "+ Note";
      addButton.title = "Add note";
      addButton.disabled = !hasStarted;
      addButton.addEventListener("click", () => {
        const now = new Date();
        const formatted = formatTimeOnly(now);
        const obs = {
          id: createId(),
          timestamp: now,
          timestampText: formatted,
          originalTimestampText: formatted,
          createdAt: now.getTime(),
          editedFrom: "",
          text: "",
          reportable: Boolean(column.reportAll),
          location: null,
          vehicleInfo:
            isVehicleListType(column.type || DEFAULT_CARD_TYPE)
              ? createEmptyVehicleInfo()
              : null,
        };
        column.observations.push(obs);
        selectNote(column.id, obs.id);
        markDirty();
        updateEndIfNeeded(now);
        updateStartIfNeeded(now);
        renderColumns();
        persistState();
        updateSummary();
        requestAnimationFrame(() => {
          focusLastNote(column.id, obs.id);
        });
      });

  columnEl.appendChild(headerEl);
  columnEl.appendChild(observationsEl);
  columnEl.appendChild(addButton);
  columnsEl.appendChild(columnEl);
  });

  if (addColumnWrap) {
    columnsEl.appendChild(addColumnWrap);
  }

  applySelectionUI();
  renderMinimizedCards();
  renderMapPins();
  refreshIcons();
  animateNoteReorder(notePositions);
  if (pendingScrollRestore.length) {
    requestAnimationFrame(() => {
      pendingScrollRestore.forEach(({ columnId, target }) => {
        if (!target) {
          return;
        }
        const desired = scrollPositions.get(columnId);
        if (typeof desired === "number") {
          target.scrollTop = desired;
        }
      });
    });
  }
}

function renderMinimizedCards() {
  if (!minimizedSection || !minimizedCards) {
    return;
  }
  ensureLucideIcon(minimizeAllCards);
  ensureLucideIcon(maximizeAllCards);
  bindMinimizedDragEvents();
  minimizedCards.innerHTML = "";
  const minimized = state.columns.filter((column) => column.minimized);
  const nextIds = new Set(minimized.map((column) => String(column.id)));
  minimizedSection.classList.toggle("hidden", minimized.length === 0);
  if (!minimized.length) {
    state.minimizedExpanded = false;
    minimizedPillIds = new Set();
    return;
  }

  minimized.forEach((column) => {
    const columnId = String(column.id);
    const isNew = !minimizedPillIds.has(columnId);
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "minimized-pill";
    pill.dataset.color = String(normalizeColorIndex(column.color));
    pill.dataset.columnId = columnId;
    pill.draggable = true;
    const icon = createCardTypeIconNode(column.type || DEFAULT_CARD_TYPE);
    const label = document.createElement("span");
    label.textContent = getMinimizedPillLabel(column);
    pill.appendChild(icon);
    pill.appendChild(label);
    pill.addEventListener("dragstart", (event) => {
      minimizedDragState.activeId = column.id;
      minimizedDragState.targetId = null;
      minimizedDragState.position = null;
      pill.classList.add("dragging");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", column.id);
      }
    });
    pill.addEventListener("dragend", () => {
      pill.classList.remove("dragging");
      commitMinimizedReorder();
    });
    pill.addEventListener("click", () => {
      column.minimized = false;
      column.justExpanded = true;
      selectColumn(column.id);
      markDirty();
      renderColumns();
      applySelectionUI();
      requestAnimationFrame(() => {
        scrollSelectionIntoView();
      });
      persistState();
      updateSummary();
    });
    minimizedCards.appendChild(pill);
    if (isNew) {
      requestAnimationFrame(() => {
        pill.classList.add("reveal");
      });
    } else {
      pill.classList.add("ready");
    }
  });

  minimizedPillIds = nextIds;
  requestAnimationFrame(() => {
    applyMinimizedLayout();
  });
}

function bindMinimizedDragEvents() {
  if (!minimizedCards || minimizedCards.dataset.dragBound === "true") {
    return;
  }
  minimizedCards.dataset.dragBound = "true";
  minimizedCards.addEventListener("dragover", (event) => {
    if (!minimizedDragState.activeId) {
      return;
    }
    event.preventDefault();
    const dragging = minimizedCards.querySelector(".minimized-pill.dragging");
    if (!dragging) {
      clearMinimizedDragTargets();
      return;
    }
    const target = event.target.closest(".minimized-pill");
    if (!target || target.classList.contains("more-pill")) {
      setMinimizedDragTarget(null, "end");
      return;
    }
    if (target === dragging) {
      clearMinimizedDragTargets();
      return;
    }
    const rect = target.getBoundingClientRect();
    const shouldInsertAfter = event.clientX > rect.left + rect.width / 2;
    setMinimizedDragTarget(target, shouldInsertAfter ? "after" : "before");
  });
  minimizedCards.addEventListener("drop", (event) => {
    if (!minimizedDragState.activeId) {
      return;
    }
    event.preventDefault();
    commitMinimizedReorder();
  });
}

function clearMinimizedDragTargets() {
  if (!minimizedCards) {
    return;
  }
  minimizedCards
    .querySelectorAll(".minimized-pill.minimized-drag-target")
    .forEach((pill) => pill.classList.remove("minimized-drag-target", "minimized-drag-before", "minimized-drag-after"));
  minimizedDragState.targetId = null;
  minimizedDragState.position = null;
}

function setMinimizedDragTarget(targetEl, position) {
  clearMinimizedDragTargets();
  minimizedDragState.position = position;
  if (!targetEl) {
    minimizedDragState.targetId = null;
    return;
  }
  minimizedDragState.targetId = targetEl.dataset.columnId || null;
  targetEl.classList.add("minimized-drag-target");
  if (position === "before") {
    targetEl.classList.add("minimized-drag-before");
  } else if (position === "after") {
    targetEl.classList.add("minimized-drag-after");
  }
}

function commitMinimizedReorder() {
  if (!minimizedDragState.activeId || !minimizedCards) {
    clearMinimizedDragTargets();
    minimizedDragState.activeId = null;
    minimizedDragState.targetId = null;
    minimizedDragState.position = null;
    return;
  }
  const visible = state.columns.filter((column) => !column.minimized);
  const minimized = state.columns.filter((column) => column.minimized);
  const draggedIndex = minimized.findIndex((col) => String(col.id) === String(minimizedDragState.activeId));
  if (draggedIndex === -1) {
    clearMinimizedDragTargets();
    minimizedDragState.activeId = null;
    minimizedDragState.targetId = null;
    minimizedDragState.position = null;
    return;
  }
  const [dragged] = minimized.splice(draggedIndex, 1);
  if (minimizedDragState.targetId) {
    let targetIndex = minimized.findIndex((col) => String(col.id) === String(minimizedDragState.targetId));
    if (targetIndex === -1) {
      minimized.push(dragged);
    } else {
      if (minimizedDragState.position === "after") {
        targetIndex += 1;
      }
      minimized.splice(targetIndex, 0, dragged);
    }
  } else {
    minimized.push(dragged);
  }
  const nextOrder = minimized.map((col) => String(col.id)).join("|");
  const currentOrder = state.columns
    .filter((column) => column.minimized)
    .map((col) => String(col.id))
    .join("|");
  clearMinimizedDragTargets();
  minimizedDragState.activeId = null;
  minimizedDragState.targetId = null;
  minimizedDragState.position = null;
  if (nextOrder === currentOrder) {
    return;
  }
  state.columns = [...visible, ...minimized];
  markDirty();
  persistState();
  renderColumns();
  updateSummary();
}

function applyMinimizedLayout() {
  if (!minimizedCards || !minimizedSection) {
    return;
  }
  const existingMore = minimizedCards.querySelector(".more-pill");
  if (existingMore) {
    existingMore.remove();
  }
  const pills = Array.from(minimizedCards.querySelectorAll(".minimized-pill"));
  if (!pills.length) {
    return;
  }

  pills.forEach((pill) => {
    pill.hidden = false;
  });

  const rowTops = new Set(pills.map((pill) => pill.offsetTop));
  const hasOverflow = rowTops.size > 1;

  if (minimizedToggle) {
    minimizedToggle.classList.toggle("hidden", !state.minimizedExpanded || !hasOverflow);
    minimizedToggle.textContent = "Collapse";
  }

  if (!hasOverflow) {
    state.minimizedExpanded = false;
  }

  if (state.minimizedExpanded || !hasOverflow) {
    pills.forEach((pill) => {
      pill.hidden = false;
    });
    return;
  }

  const firstRowTop = pills[0].offsetTop;
  const firstRow = pills.filter((pill) => pill.offsetTop === firstRowTop);
  const keepCount = Math.max(0, firstRow.length - 1);
  const hiddenCount = pills.length - keepCount;

  pills.forEach((pill, index) => {
    pill.hidden = index >= keepCount;
  });

  const morePill = document.createElement("button");
  morePill.type = "button";
  morePill.className = "minimized-pill more-pill";
  morePill.textContent = `+${hiddenCount} more`;
  morePill.addEventListener("click", () => {
    state.minimizedExpanded = true;
    renderColumns();
  });
  minimizedCards.appendChild(morePill);
  requestAnimationFrame(() => {
    morePill.classList.add("reveal");
  });
}

function handleTabSwitch(tabName) {
  workspace.classList.remove("hidden");
  welcome.classList.add("hidden");
  const nextTab = tabName === "parse" ? "summary" : tabName;

  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === nextTab);
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === nextTab);
  });

  if (nextTab === "dispatch") {
    state.dispatchVisited = true;
    if (MAP_FEATURE_ENABLED && state.viewMode !== "notes") {
      ensureMainMap();
      refreshMainMapAfterReveal({ renderPins: true });
    }
  }

  saveViewState({ tab: nextTab });
}

function cycleWorkspaceTab() {
  const orderedTabs = Array.from(tabs)
    .map((tab) => tab.dataset.tab)
    .filter(Boolean);
  if (!orderedTabs.length) {
    return;
  }
  const activeTabButton = Array.from(tabs).find((tab) => tab.classList.contains("active"));
  const activeTab = activeTabButton?.dataset.tab;
  const activeIndex = orderedTabs.indexOf(activeTab);
  const nextIndex = activeIndex >= 0 ? (activeIndex + 1) % orderedTabs.length : 0;
  handleTabSwitch(orderedTabs[nextIndex]);
}
