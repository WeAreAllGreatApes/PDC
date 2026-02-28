/*
  Dispatch tab: map/split view behavior and location workflows
  Transitional split from the previous runtime monolith for maintainability.
*/

function setViewMode(mode, { skipPersist, preserveMapView } = {}) {
  let nextMode = mode;
  if (!["notes", "split", "map"].includes(nextMode)) {
    return;
  }
  if (nextMode === "map" && !MAP_FEATURE_ENABLED) {
    nextMode = "notes";
  }
  if (nextMode === "split" && !SPLIT_VIEW_ENABLED) {
    nextMode = "notes";
  }
  const previousMode = state.viewMode;
  state.viewMode = nextMode;
  if (nextMode !== "notes" && nextMode !== previousMode && !preserveMapView) {
    mapNeedsFit = true;
  }
  if (!skipPersist) {
    persistState();
  }
  applyViewMode();
}

function applyViewMode() {
  if (!collectView) {
    return;
  }
  if (!MAP_FEATURE_ENABLED && state.viewMode !== "notes") {
    state.viewMode = "notes";
  }
  if (!SPLIT_VIEW_ENABLED && state.viewMode === "split") {
    state.viewMode = "notes";
  }
  collectView.classList.remove("view-notes", "view-split", "view-map");
  collectView.classList.add(`view-${state.viewMode}`);
  viewToggleButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.viewMode);
  });
  if (state.viewMode !== "notes" && MAP_FEATURE_ENABLED) {
    ensureMainMap();
    requestAnimationFrame(() => {
      if (mainMap) {
        mainMap.invalidateSize();
      }
      renderMapPins();
    });
  }
  if (isModalOpen(locationModal)) {
    syncLocationModalLayout();
  }
}

function refreshMainMapAfterReveal({ renderPins = true } = {}) {
  if (!mainMap) {
    return;
  }
  const runRefresh = () => {
    if (!mainMap) {
      return;
    }
    mainMap.invalidateSize({ pan: false });
    if (renderPins) {
      renderMapPins();
    }
  };
  requestAnimationFrame(() => {
    runRefresh();
    window.setTimeout(() => {
      requestAnimationFrame(runRefresh);
    }, 140);
  });
}

function ensureMainMap() {
  if (!mapView || !window.L) {
    return;
  }
  if (mainMap) {
    return;
  }
  mainMap = window.L.map(mapView, { zoomControl: true });
  applyMapStyle();
  mapLayerGroup = window.L.layerGroup().addTo(mainMap);
  mapNeedsFit = true;
  const center = state.mapSettings.city || DEFAULT_MAP_CENTER;
  mainMap.setView([center.lat, center.lon], 11);
  mainMap.on("click", handleMainMapLocationModalClick);
  ensureMapSidebarTools();
}

function handleMainMapLocationModalClick(event) {
  if (!isModalOpen(locationModal) || !locationModalTarget) {
    return;
  }
  const rawTarget = event.originalEvent?.target;
  if (
    rawTarget instanceof Element &&
    rawTarget.closest(
      ".map-pin, .map-pin-tooltip, .location-result-marker, .location-preview-marker"
    )
  ) {
    return;
  }
  const label = pendingLocation?.label || "Dropped pin";
  buildLocationWithReverse(event.latlng.lat, event.latlng.lng, label).then(
    async (result) => {
      if (result.needsConfirm) {
        const useNew = await openReverseGeocodeModal(result.oldLabel, result.newLabel);
        if (!useNew) {
          return;
        }
      }
      setPendingLocation(result.location, { recenter: false });
    }
  );
}

function ensureMapSidebarTools() {
  if (!mainMap || mapSidebarToolsControl || !window.L?.DomUtil) {
    return;
  }
  const SidebarToolsControl = window.L.Control.extend({
    options: { position: "topleft" },
    onAdd() {
      const container = window.L.DomUtil.create("div", "leaflet-bar map-sidebar-tools");
      const buildToolButton = (iconName, title, className, onClick) => {
        const button = window.L.DomUtil.create(
          "button",
          `map-sidebar-tool ${className}`.trim(),
          container
        );
        button.type = "button";
        button.innerHTML = `<i data-lucide="${iconName}"></i>`;
        button.setAttribute("title", title);
        button.setAttribute("aria-label", title);
        window.L.DomEvent.disableClickPropagation(button);
        window.L.DomEvent.disableScrollPropagation(button);
        window.L.DomEvent.on(button, "click", (event) => {
          window.L.DomEvent.stop(event);
          onClick();
        });
        ensureLucideIcon(button);
      };
      buildToolButton(
        "search",
        "Lookup and pin a new card",
        "map-sidebar-tool-lookup",
        () => startMapLookupCardFlow()
      );
      buildToolButton(
        "map-pin-plus-inside",
        "Drop and drag a new pin",
        "map-sidebar-tool-pin-drop",
        () => startMapDragPinCardFlow()
      );
      refreshIcons();
      return container;
    },
  });
  mapSidebarToolsControl = new SidebarToolsControl();
  mapSidebarToolsControl.addTo(mainMap);
}

function openMapCardMetaModal(columnId, options = {}) {
  if (!mapCardMetaModal || !mapCardMetaLabel || !mapCardMetaType) {
    return;
  }
  const column = state.columns.find((item) => item.id === columnId);
  if (!column) {
    return;
  }
  mapCardMetaTargetColumnId = column.id;
  mapCardMetaDiscardOnCancel = Boolean(options.discardOnCancel);
  mapCardMetaTypeLocked = Boolean(options.lockType);
  mapCardMetaLabel.value = column.labelAuto ? "" : String(column.label || "");
  mapCardMetaSelectedType = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
  mapCardMetaType.innerHTML = "";
  mapCardMetaTypeDropdown = createCustomSelect({
    options: getSelectableCardTypes(mapCardMetaSelectedType).map((type) => ({
      value: type.value,
      label: type.label,
      icon: type.icon,
    })),
    value: mapCardMetaSelectedType,
    ariaLabel: "Card type",
    className: "type-dropdown",
    portal: false,
    matchButtonWidth: false,
    onChange: (nextType) => {
      mapCardMetaSelectedType = normalizeCardType(nextType);
    },
  });
  mapCardMetaType.appendChild(mapCardMetaTypeDropdown.element);
  const typeSelectButton = mapCardMetaTypeDropdown.element.querySelector(".select-button");
  if (typeSelectButton) {
    typeSelectButton.disabled = mapCardMetaTypeLocked;
    typeSelectButton.setAttribute("aria-disabled", String(mapCardMetaTypeLocked));
    typeSelectButton.title = mapCardMetaTypeLocked ? "Set by Card" : "Card type";
  }
  if (mapCardMetaTypeHint) {
    mapCardMetaTypeHint.textContent = "Set by Card";
    mapCardMetaTypeHint.classList.toggle("hidden", !mapCardMetaTypeLocked);
  }
  refreshIcons();
  mapCardMetaModal.classList.remove("hidden");
  mapCardMetaModal.setAttribute("aria-hidden", "false");
  mapCardMetaLabel.focus();
}

function closeMapCardMetaModal(options = {}) {
  if (!mapCardMetaModal) {
    return;
  }
  blurFocusedElementWithin(mapCardMetaModal);
  const discardDraft = Boolean(options.discardDraft);
  let focusTargetOverride = options.focusTarget || null;
  const columnId = mapCardMetaTargetColumnId;
  if (!discardDraft && !focusTargetOverride && columnId) {
    const column = state.columns.find((item) => item.id === columnId);
    const assignmentResult = resolveMapPinnedLocationAssignment(column);
    if (assignmentResult?.changed) {
      markDirty();
      renderColumns();
      persistState();
      updateSummary();
      renderMapPins();
    }
    if (assignmentResult?.focusTarget) {
      focusTargetOverride = assignmentResult.focusTarget;
    }
  }
  if (discardDraft && columnId) {
    state.columns = state.columns.filter((item) => item.id !== columnId);
    if (state.selection?.columnId === columnId) {
      clearSelection();
    }
    markDirty();
    renderColumns();
    persistState();
    updateSummary();
    renderMapPins();
  }
  mapCardMetaTypeDropdown?.close?.();
  mapCardMetaTypeDropdown = null;
  mapCardMetaModal.classList.add("hidden");
  mapCardMetaModal.setAttribute("aria-hidden", "true");
  mapCardMetaTargetColumnId = null;
  mapCardMetaDiscardOnCancel = false;
  mapCardMetaTypeLocked = false;
  mapCardMetaSelectedType = null;
  if (mapCardMetaTypeHint) {
    mapCardMetaTypeHint.classList.add("hidden");
  }
  if (discardDraft) {
    return;
  }
  if (focusTargetOverride) {
    focusMapLocation(focusTargetOverride.key, focusTargetOverride.target);
    return;
  }
  if (columnId) {
  focusMapLocation(`card:${columnId}`, { kind: "card", columnId });
}
}

function openApplyCardColorsModal() {
  if (!applyCardColorsModal) {
    return;
  }
  applyCardColorsModal.classList.remove("hidden");
  applyCardColorsModal.setAttribute("aria-hidden", "false");
  applyCardColorsCancel?.focus();
}

function closeApplyCardColorsModal() {
  if (!applyCardColorsModal) {
    return;
  }
  blurFocusedElementWithin(applyCardColorsModal);
  applyCardColorsModal.classList.add("hidden");
  applyCardColorsModal.setAttribute("aria-hidden", "true");
}

function saveMapCardMetaModal() {
  if (!mapCardMetaTargetColumnId) {
    return;
  }
  const column = state.columns.find((item) => item.id === mapCardMetaTargetColumnId);
  if (!column) {
    closeMapCardMetaModal();
    return;
  }
  const nextType = normalizeCardType(
    mapCardMetaSelectedType || column.type || DEFAULT_CARD_TYPE
  );
  const nextLabelRaw = String(mapCardMetaLabel?.value || "").trim();
  const oldType = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
  if (oldType !== nextType && !confirmCardTypeChange(column, nextType)) {
    mapCardMetaSelectedType = oldType;
    mapCardMetaTypeDropdown?.setValue(oldType);
    return;
  }
  column.type = nextType;
  if (isVehicleCardType(nextType)) {
    column.vehicleProfile = normalizeVehicleInfo(column.vehicleProfile || {});
    column.observations.forEach((obs) => {
      obs.vehicleInfo = null;
    });
  } else {
    column.vehicleProfile = null;
    if (!isVehicleListType(nextType)) {
      column.observations.forEach((obs) => {
        obs.vehicleInfo = null;
      });
    }
  }
  if (nextLabelRaw) {
    column.label = nextLabelRaw;
    column.labelAuto = false;
  } else {
    if (oldType !== nextType || !column.labelAuto) {
      column.label = getNextCustomLabelForType(nextType, column.id);
    }
    column.labelAuto = true;
  }
  if (
    (state.cardColorDefaults?.mode === "manual" ||
      state.cardColorDefaults?.mode === "all-grey" ||
      state.cardColorDefaults?.mode === "color-by-type") &&
    oldType !== nextType
  ) {
    column.color = getDefaultColorForCardType(nextType);
  }
  const assignmentResult = resolveMapPinnedLocationAssignment(column, nextType);
  const focusTarget = assignmentResult?.focusTarget || null;
  markDirty();
  renderColumns();
  persistState();
  updateSummary();
  closeMapCardMetaModal({ focusTarget });
}

function createPinnedCardFromMap(location, options = {}) {
  if (!location) {
    return null;
  }
  const type = normalizeCardType(options.type || getNextCardTypeForNewColumn());
  const manualLabel = String(options.label || "").trim();
  const labelAuto = !manualLabel;
  const column = {
    id: createId(),
    type,
    minimized: false,
    color: getDefaultColorForCardType(type),
    label: labelAuto ? getNextCustomLabel(type) : manualLabel,
    labelAuto,
    reportAll: false,
    createdAt: Date.now(),
    vehicleProfile: getDefaultVehicleProfileForType(type),
    location,
    observations: [],
    mapPendingLocationAssignment: Boolean(options.assignLocationByType),
  };
  state.columns.push(column);
  selectColumn(column.id);
  markDirty();
  renderColumns();
  persistState();
  updateSummary();
  focusMapLocation(`card:${column.id}`, { kind: "card", columnId: column.id });
  if (options.assignLocationByType && options.openMetaModal === false) {
    const assignmentResult = resolveMapPinnedLocationAssignment(column, column.type);
    if (assignmentResult?.changed) {
      markDirty();
      renderColumns();
      persistState();
      updateSummary();
    }
    if (assignmentResult?.focusTarget) {
      focusMapLocation(assignmentResult.focusTarget.key, assignmentResult.focusTarget.target);
    }
  }
  if (options.openMetaModal !== false) {
    openMapCardMetaModal(column.id, {
      discardOnCancel: options.discardOnCancel !== false,
      lockType: options.lockTypeFromCard === true,
    });
  }
  return column;
}

function assignLocationByCardType(column, location, typeOverride = null) {
  if (!column) {
    return { assignedTo: "none", obs: null };
  }
  if (!location) {
    column.location = null;
    return { assignedTo: "none", obs: null };
  }
  const resolvedType = normalizeCardType(typeOverride || column.type || DEFAULT_CARD_TYPE);
  if (!shouldAssignPinnedLocationToNote(resolvedType)) {
    column.location = location;
    return { assignedTo: "card", obs: null };
  }
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
    location,
    vehicleInfo: isVehicleListType(resolvedType) ? createEmptyVehicleInfo() : null,
  };
  column.observations.push(obs);
  column.location = null;
  updateEndIfNeeded(now);
  updateStartIfNeeded(now);
  selectNote(column.id, obs.id);
  return { assignedTo: "note", obs };
}

function shouldAssignPinnedLocationToNote(type) {
  const normalized = normalizeCardType(type || DEFAULT_CARD_TYPE);
  return normalized !== "Incident" && normalized !== "Place";
}

function resolveMapPinnedLocationAssignment(column, typeOverride = null) {
  if (!column || !column.mapPendingLocationAssignment) {
    return null;
  }
  delete column.mapPendingLocationAssignment;
  const location = column.location || null;
  if (!location) {
    return {
      changed: false,
      focusTarget: {
        key: `card:${column.id}`,
        target: { kind: "card", columnId: column.id },
      },
    };
  }
  const assignment = assignLocationByCardType(column, location, typeOverride);
  if (assignment.assignedTo !== "note" || !assignment.obs) {
    return {
      changed: false,
      focusTarget: {
        key: `card:${column.id}`,
        target: { kind: "card", columnId: column.id },
      },
    };
  }
  return {
    changed: true,
    focusTarget: {
      key: `note:${column.id}:${assignment.obs.id}`,
      target: { kind: "note", columnId: column.id, obsId: assignment.obs.id },
    },
  };
}

function clearMapPlacementMarker() {
  if (mapPlacementMarker && mainMap) {
    mainMap.removeLayer(mapPlacementMarker);
  }
  mapPlacementMarker = null;
}

function startMapLookupCardFlow() {
  clearMapPlacementMarker();
  openLocationModal({
    kind: "new-card-lookup",
    initialType: getNextCardTypeForNewColumn(),
  });
}

function startMapDragPinCardFlow(options = {}) {
  ensureMainMap();
  if (!mainMap || !window.L) {
    return;
  }
  setViewMode("split");
  clearMapPlacementMarker();
  const placementPaneName = "map-placement-pane";
  let placementPane = mainMap.getPane(placementPaneName);
  if (!placementPane) {
    placementPane = mainMap.createPane(placementPaneName);
  }
  placementPane.style.zIndex = String(MAP_PIN_FOCUS_ZINDEX + 2000);
  const center = mainMap.getCenter();
  const pinIcon = window.L.divIcon({
    className: "map-pin map-placement-pin",
    html: '<span class="map-pin-dot map-placement-dot"></span>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
  mapPlacementMarker = window.L.marker(center, {
    draggable: true,
    icon: pinIcon,
    zIndexOffset: MAP_PIN_FOCUS_ZINDEX + 1000,
    pane: placementPaneName,
  }).addTo(mainMap);
  mapPlacementMarker.bindTooltip("Drag to place this new pin", {
    permanent: true,
    direction: "right",
    offset: [10, 0],
    className: "map-pin-tooltip map-placement-tooltip is-expanded",
    opacity: 1,
    pane: placementPaneName,
  });
  mapPlacementMarker.on("tooltipopen", () => {
    bindTooltipDragHandle(mapPlacementMarker, true, null);
  });
  requestAnimationFrame(() => {
    bindTooltipDragHandle(mapPlacementMarker, true, null);
  });
  mapPlacementMarker.on("dragend", async (event) => {
    const next = event.target.getLatLng();
    clearMapPlacementMarker();
    const locationResult = await buildLocationWithReverse(
      next.lat,
      next.lng,
      formatLatLonLabel(next.lat, next.lng)
    );
    createPinnedCardFromMap(locationResult.location, {
      type: options.type || getNextCardTypeForNewColumn(),
      assignLocationByType: true,
      openMetaModal: true,
      lockTypeFromCard: options.lockTypeFromCard === true,
    });
  });
  mainMap.panTo(center, { animate: true });
  showAppToast("Drag the temporary pin to create a new card.");
}

function setPinDragFocus(marker, isDragging) {
  const markerEl = marker?.getElement?.();
  if (markerEl) {
    markerEl.classList.toggle("is-dragging", isDragging);
  }
  const tooltipEl = marker?.getTooltip?.()?.getElement?.();
  if (tooltipEl) {
    tooltipEl.classList.toggle("is-dragging", isDragging);
  }
}

function setMapDragState(isDragging, marker) {
  if (!mainMap) {
    return;
  }
  if (isDragging) {
    mapDragWasEnabled = mainMap.dragging?.enabled?.() ?? true;
    if (mainMap.dragging?.disable) {
      mainMap.dragging.disable();
    }
    if (mapView) {
      mapView.classList.add("dragging-pin");
    }
    if (mapDragFallbackTimer) {
      window.clearTimeout(mapDragFallbackTimer);
      mapDragFallbackTimer = null;
    }
    const release = () => {
      setMapDragState(false, marker);
    };
    window.addEventListener("pointerup", release, { once: true });
    window.addEventListener("pointercancel", release, { once: true });
    window.addEventListener("blur", release, { once: true });
    mapDragFallbackTimer = window.setTimeout(release, 4000);
  } else {
    if (mainMap.dragging?.enable) {
      mainMap.dragging.enable();
    }
    if (mapView) {
      mapView.classList.remove("dragging-pin");
    }
    if (mapDragFallbackTimer) {
      window.clearTimeout(mapDragFallbackTimer);
      mapDragFallbackTimer = null;
    }
  }
  setPinDragFocus(marker, isDragging);
}

function startMarkerDragFromTooltip(event, marker, canDrag) {
  if (!canDrag || !marker || !mainMap) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const mapRect = mainMap.getContainer().getBoundingClientRect();
  const getClientPoint = (sourceEvent) => {
    if (!sourceEvent) {
      return null;
    }
    const touchPoint =
      sourceEvent.touches && sourceEvent.touches.length
        ? sourceEvent.touches[0]
        : sourceEvent.changedTouches && sourceEvent.changedTouches.length
          ? sourceEvent.changedTouches[0]
          : sourceEvent;
    if (
      typeof touchPoint?.clientX !== "number" ||
      typeof touchPoint?.clientY !== "number"
    ) {
      return null;
    }
    return {
      clientX: touchPoint.clientX,
      clientY: touchPoint.clientY,
    };
  };
  const initialPoint = getClientPoint(event);
  if (!initialPoint) {
    return;
  }
  const markerPoint = mainMap.latLngToContainerPoint(marker.getLatLng());
  const pointerStartPoint = window.L.point(
    initialPoint.clientX - mapRect.left,
    initialPoint.clientY - mapRect.top
  );
  const pointerOffset = pointerStartPoint.subtract(markerPoint);
  let draggingActive = true;
  const moveMarker = (moveEvent) => {
    if (!draggingActive) {
      return;
    }
    moveEvent.preventDefault?.();
    const point = getClientPoint(moveEvent);
    if (!point) {
      return;
    }
    const containerPoint = window.L.point(
      point.clientX - mapRect.left,
      point.clientY - mapRect.top
    );
    marker.setLatLng(mainMap.containerPointToLatLng(containerPoint.subtract(pointerOffset)));
  };
  const stopDrag = (stopEvent) => {
    if (!draggingActive) {
      return;
    }
    stopEvent?.preventDefault?.();
    draggingActive = false;
    window.removeEventListener("pointermove", moveMarker);
    window.removeEventListener("pointerup", stopDrag);
    window.removeEventListener("pointercancel", stopDrag);
    window.removeEventListener("mousemove", moveMarker);
    window.removeEventListener("mouseup", stopDrag);
    window.removeEventListener("touchmove", moveMarker);
    window.removeEventListener("touchend", stopDrag);
    window.removeEventListener("touchcancel", stopDrag);
    window.removeEventListener("blur", stopDrag);
    setMapDragState(false, marker);
    marker.fire("dragend", { target: marker });
  };

  setMapDragState(true, marker);
  marker.fire("dragstart", { target: marker });
  moveMarker(event);
  window.addEventListener("pointermove", moveMarker, { passive: false });
  window.addEventListener("pointerup", stopDrag, { once: true });
  window.addEventListener("pointercancel", stopDrag, { once: true });
  window.addEventListener("mousemove", moveMarker);
  window.addEventListener("mouseup", stopDrag, { once: true });
  window.addEventListener("touchmove", moveMarker, { passive: false });
  window.addEventListener("touchend", stopDrag, { once: true });
  window.addEventListener("touchcancel", stopDrag, { once: true });
  window.addEventListener("blur", stopDrag, { once: true });
}

function bindTooltipDragHandle(marker, canDrag, handleSelector = ".map-tooltip-label") {
  const tooltipEl = marker?.getTooltip?.()?.getElement?.();
  if (!tooltipEl) {
    return;
  }
  const dragBindKey = handleSelector ? "dragBoundLabel" : "dragBoundTooltip";
  if (tooltipEl.dataset[dragBindKey]) {
    return;
  }
  tooltipEl.dataset[dragBindKey] = "true";
  const handles = handleSelector
    ? Array.from(tooltipEl.querySelectorAll(handleSelector))
    : [tooltipEl];
  if (!handles.length) {
    return;
  }
  const beginDragFromHandle = (dragEvent) => {
    if (dragEvent.type === "mousedown" && typeof window.PointerEvent !== "undefined") {
      return;
    }
    const button = typeof dragEvent.button === "number" ? dragEvent.button : 0;
    if (button !== 0) {
      return;
    }
    startMarkerDragFromTooltip(dragEvent, marker, canDrag);
  };
  handles.forEach((handle) => {
    handle.addEventListener("pointerdown", beginDragFromHandle);
    handle.addEventListener("mousedown", beginDragFromHandle);
    handle.addEventListener("touchstart", beginDragFromHandle, {
      passive: false,
    });
  });
}

function renderMapPins() {
  if (!mainMap || !mapLayerGroup) {
    return;
  }
  updateMapInactiveLabelOpacityCssVar();
  clearFocusedMapMarker();
  mapLayerGroup.clearLayers();
  mapMarkers.clear();
  const items = collectMapLocations().slice().sort(compareMapItemsByAge);
  if (!items.length) {
    cleanupMapPinPanes(new Set());
    return;
  }
  const bounds = [];
  const activePaneNames = new Set();
  items.forEach((item, index) => {
    const baseZIndex = MAP_PIN_BASE_ZINDEX + (index + 1) * MAP_PIN_ZINDEX_STEP;
    const hoverZIndex = baseZIndex + MAP_PIN_HOVER_ZINDEX_BUMP;
    const expandedPaneZIndex = Math.max(hoverZIndex, MAP_PIN_FOCUS_ZINDEX + 3000);
    const paneName = getMapPinPaneName(item.key);
    activePaneNames.add(paneName);
    const pane = ensureMapPinPane(paneName, baseZIndex);
    const setTooltipZIndex = (zIndex) => {
      const tooltipEl = marker.getTooltip()?.getElement?.();
      if (tooltipEl) {
        tooltipEl.style.zIndex = String(zIndex);
      }
      pane.style.zIndex = String(zIndex);
    };
    const canDrag = !item.isLocked;
    const pinIcon = window.L.divIcon({
      className: "map-pin",
      html: `<span class="map-pin-dot color-${item.colorIndex}"></span>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });
    const marker = window.L.marker([item.location.lat, item.location.lon], {
      draggable: canDrag,
      icon: pinIcon,
      pane: paneName,
    });
    const tooltip = buildMapTooltipContent(item);
    marker.bindTooltip(tooltip, {
      permanent: true,
      direction: "right",
      offset: [10, 0],
      className: `map-pin-tooltip color-${item.colorIndex}`,
      opacity: 1,
      interactive: true,
      pane: paneName,
    });
    if (marker.dragging && !canDrag) {
      marker.dragging.disable();
    }
    marker.setZIndexOffset(baseZIndex);
    setTooltipZIndex(baseZIndex);
    marker.on("tooltipopen", (event) => {
      const tooltipEl = event.tooltip?.getElement();
      if (!tooltipEl) {
        return;
      }
      setTooltipZIndex(baseZIndex);
      tooltipEl.classList.toggle("is-previous", Boolean(item.isPreviousLocation));
      if (tooltipEl.dataset.hoverBound) {
        return;
      }
      tooltipEl.dataset.hoverBound = "true";
      bindTooltipDragHandle(marker, canDrag, ".map-tooltip-label");
      tooltipEl.addEventListener("mouseenter", () => {
        tooltipEl.classList.add("is-expanded");
        marker.setZIndexOffset(hoverZIndex);
        setTooltipZIndex(expandedPaneZIndex);
      });
      tooltipEl.addEventListener("mouseleave", () => {
        if (tooltipEl.classList.contains("is-focus-target")) {
          return;
        }
        tooltipEl.classList.remove("is-expanded");
        marker.setZIndexOffset(baseZIndex);
        setTooltipZIndex(baseZIndex);
      });
      tooltipEl.addEventListener("click", (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        setFocusedMapMarker(marker);
        tooltipEl.classList.add("is-expanded");
        requestAnimationFrame(() => keepMapTooltipInView(marker));
      });
      tooltipEl.addEventListener("dblclick", (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        activateMapLabelTarget(item);
      });
    });
    marker.on("click", (event) => {
      event.originalEvent?.stopPropagation?.();
      const tooltipEl = marker.getTooltip()?.getElement();
      setFocusedMapMarker(marker);
      if (tooltipEl) {
        tooltipEl.classList.add("is-expanded");
      }
      requestAnimationFrame(() => keepMapTooltipInView(marker));
    });
    marker.on("mouseover", () => {
      const tooltipEl = marker.getTooltip()?.getElement();
      if (tooltipEl) {
        tooltipEl.classList.add("is-expanded");
        setTooltipZIndex(expandedPaneZIndex);
      }
      marker.setZIndexOffset(hoverZIndex);
    });
    marker.on("mouseout", () => {
      const tooltipEl = marker.getTooltip()?.getElement();
      if (tooltipEl?.classList.contains("is-focus-target")) {
        tooltipEl.classList.add("is-expanded");
        return;
      }
      if (tooltipEl) {
        tooltipEl.classList.remove("is-expanded");
        setTooltipZIndex(baseZIndex);
      }
      marker.setZIndexOffset(baseZIndex);
    });
    marker.on("dragstart", () => {
      setMapDragState(true, marker);
    });
    marker.on("dragend", async (event) => {
      setMapDragState(false, marker);
      const next = event.target.getLatLng();
      const currentLabel =
        item.location?.displayLabel || item.location?.label || "Dropped pin";
      const result = await buildLocationWithReverse(next.lat, next.lng, currentLabel);
      if (result.needsConfirm) {
        const useNew = await openReverseGeocodeModal(result.oldLabel, result.newLabel);
        if (!useNew) {
          renderMapPins();
          return;
        }
      }
      applyLocationToTarget(item, result.location, { preserveMapView: true });
    });
    marker.addTo(mapLayerGroup);
    mapMarkers.set(item.key, marker);
    bounds.push([item.location.lat, item.location.lon]);
  });
  cleanupMapPinPanes(activePaneNames);
  if (bounds.length && state.viewMode !== "notes" && mapNeedsFit) {
    const leafletBounds = window.L.latLngBounds(bounds);
    mainMap.fitBounds(leafletBounds, { padding: [40, 40], maxZoom: 15 });
    mapNeedsFit = false;
  }
}

function getMapPinPaneName(key) {
  return `map-pin-pane-${String(key || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")}`;
}

function ensureMapPinPane(name, zIndex) {
  let pane = mainMap.getPane(name);
  if (!pane) {
    pane = mainMap.createPane(name);
  }
  pane.style.zIndex = String(zIndex);
  mapPinPaneNames.add(name);
  return pane;
}

function cleanupMapPinPanes(activeNames) {
  if (!mainMap) {
    return;
  }
  const next = new Set();
  mapPinPaneNames.forEach((name) => {
    if (activeNames.has(name)) {
      next.add(name);
      return;
    }
    const pane = mainMap.getPane(name);
    if (pane?.parentNode) {
      pane.parentNode.removeChild(pane);
    }
    if (mainMap._panes && Object.prototype.hasOwnProperty.call(mainMap._panes, name)) {
      delete mainMap._panes[name];
    }
  });
  mapPinPaneNames = next;
}

function collectMapLocations() {
  const items = [];
  const mostRecentOnly = normalizeMapRecencyMode(state.mapFilters?.recencyMode) === "mostRecent";
  const reportableOnly = Boolean(state.mapFilters?.noteReportableOnly);
  state.columns.forEach((column) => {
    if (!state.mapFilters?.showMinimized && column.minimized) {
      return;
    }
    const normalizedType = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
    if (state.mapFilters?.types && !state.mapFilters.types[normalizedType]) {
      return;
    }
    const colorIndex = normalizeColorIndex(column.color);
    const label = getMapLabelForColumn(column);
    const vehicleListDetailHeading = isVehicleListType(normalizedType)
      ? (() => {
          const listName = String(column.label || "").trim();
          return listName ? `Vehicle List: ${listName}` : "Vehicle List";
        })()
      : "";
    const isObserver = isObserverType(normalizedType);
    const usePreviousNoteStyling =
      (isObserver || isVehicleListType(normalizedType) || isVehicleCardType(normalizedType)) &&
      !column.location;
    const latestLocationObs = getLatestLocationObservationInColumn(column, {
      reportableOnly,
    });
    const latestNotePin = usePreviousNoteStyling
      ? latestLocationObs
      : null;
    if (column.location) {
      const sortedObservations = column.observations
        .filter((obs) => obs.text && obs.text.trim())
        .slice()
        .sort((a, b) => getObservationTimestampValue(b) - getObservationTimestampValue(a));
      const latestObs = sortedObservations[0] || null;
      const latestByTime = column.observations.reduce((latest, obs) => {
        if (!latest) {
          return obs;
        }
        const latestTime = getObservationTimestampValue(latest);
        const obsTime = getObservationTimestampValue(obs);
        if (obsTime !== latestTime) {
          return obsTime > latestTime ? obs : latest;
        }
        const latestCreated = typeof latest.createdAt === "number" ? latest.createdAt : 0;
        const obsCreated = typeof obs.createdAt === "number" ? obs.createdAt : 0;
        if (obsCreated !== latestCreated) {
          return obsCreated > latestCreated ? obs : latest;
        }
        return String(obs.id).localeCompare(String(latest.id)) > 0 ? obs : latest;
      }, null);
      const sortTimestamp = latestByTime
        ? getObservationTimestampValue(latestByTime)
        : typeof column.createdAt === "number"
          ? column.createdAt
          : 0;
      items.push({
        kind: "card",
        columnId: column.id,
        key: `card:${column.id}`,
        location: column.location,
        locationLabel: column.location.displayLabel || column.location.label || "",
        latestTimestampText: latestObs ? formatTimeOnly(latestObs.timestamp) : "",
        latestText: latestObs ? latestObs.text || "" : "",
        label,
        vehicleListDetailHeading,
        cardType: normalizedType,
        colorIndex,
        labelTimestamp: latestObs ? formatTimeOnly(latestObs.timestamp) : "",
        isLocked: false,
        sortTimestamp,
        sortCreatedAt: latestByTime && typeof latestByTime.createdAt === "number"
          ? latestByTime.createdAt
          : typeof column.createdAt === "number"
            ? column.createdAt
            : 0,
        sortId: String(column.id),
      });
    }
    column.observations.forEach((obs) => {
      if (!obs.location) {
        return;
      }
      if (reportableOnly && !obs.reportable) {
        return;
      }
      if (mostRecentOnly && latestLocationObs && String(latestLocationObs.id) !== String(obs.id)) {
        return;
      }
      const vehicleMapInfo = getVehicleMapInfoForObservation(column, obs);
      const noteLabel = getMapLabelForObservation(column, obs, label, vehicleMapInfo);
      items.push({
        kind: "note",
        columnId: column.id,
        obsId: obs.id,
        key: `note:${column.id}:${obs.id}`,
        location: obs.location,
        locationLabel: obs.location.displayLabel || obs.location.label || "",
        timestampText: formatTimeOnly(obs.timestamp),
        text: obs.text || "",
        label: noteLabel,
        vehicleListDetailHeading,
        vehicleDetailLine: getVehicleMapDetailLine(vehicleMapInfo),
        cardType: normalizedType,
        colorIndex,
        labelTimestamp: formatTimeOnly(obs.timestamp),
        isPreviousLocation:
          usePreviousNoteStyling &&
          latestNotePin &&
          latestNotePin.id !== obs.id,
        isLocked: Boolean(column.location),
        sortTimestamp: getObservationTimestampValue(obs),
        sortCreatedAt: typeof obs.createdAt === "number" ? obs.createdAt : 0,
        sortId: String(obs.id),
      });
    });
  });
  return items;
}

function getMapLabelForColumn(column) {
  const type = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
  if (isVehicleCardType(type)) {
    const vehicleSummary = formatVehicleInfoForSummary(
      normalizeVehicleInfo(column.vehicleProfile || {})
    );
    if (vehicleSummary) {
      return vehicleSummary;
    }
  }
  const labelText = (column.label || "").trim();
  const name = labelText ? labelText : getCardTypeMeta(type).label;
  return name;
}

function getVehicleMapInfoForObservation(column, obs) {
  const type = normalizeCardType(column?.type || DEFAULT_CARD_TYPE);
  if (isVehicleCardType(type)) {
    return normalizeVehicleInfo(column?.vehicleProfile || {});
  }
  if (!isVehicleListType(type)) {
    return null;
  }
  const structured = normalizeVehicleInfo(obs?.vehicleInfo || {});
  if (hasVehicleInfo(structured)) {
    return structured;
  }
  const parsed = parseVehicleInfoFromText(obs?.text || "");
  if (hasVehicleInfo(parsed)) {
    return parsed;
  }
  return structured;
}

function getVehiclePlateStateLabel(info) {
  if (!info || info.plateVisible === false || !info.plate) {
    return "";
  }
  const state = String(info.state || "").trim();
  return state ? `${info.plate} (${state})` : info.plate;
}

function getVehicleMapLabelFromInfo(info) {
  const normalized = normalizeVehicleInfo(info || {});
  const plateLabel = getVehiclePlateStateLabel(normalized);
  if (plateLabel) {
    return plateLabel;
  }
  const fallback = [normalized.color, normalized.make, normalized.model, normalized.body]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
  return fallback || "Unk Vehicle";
}

function getVehicleMapDetailLine(info) {
  if (!info) {
    return "";
  }
  const makeModel = [info.make, info.model].filter(Boolean).join(" ").trim();
  const color = String(info.color || "").trim();
  const body = String(info.body || "").trim();
  return [makeModel, color, body].filter(Boolean).join(" • ");
}

function getMapLabelForObservation(column, obs, fallbackLabel, vehicleMapInfo = null) {
  const type = normalizeCardType(column?.type || DEFAULT_CARD_TYPE);
  if (!isVehicleListType(type) && !isVehicleCardType(type)) {
    return fallbackLabel;
  }
  const info = vehicleMapInfo || getVehicleMapInfoForObservation(column, obs);
  return getVehicleMapLabelFromInfo(info);
}

function buildMapTooltipContent(item) {
  const wrap = document.createElement("div");
  wrap.className = "map-tooltip";
  const labelLine = document.createElement("div");
  labelLine.className = "map-tooltip-label";
  const includeLabelTimes = Boolean(state.mapFilters?.labelTimes);
  const labelTime =
    includeLabelTimes && item.labelTimestamp ? `—${item.labelTimestamp}` : "";
  const labelText = `${item.label}${labelTime}`.trim();
  if (item.cardType) {
    const iconWrap = document.createElement("span");
    iconWrap.className = "label-icon";
    const icon = createCardTypeIconNode(item.cardType);
    iconWrap.appendChild(icon);
    labelLine.appendChild(iconWrap);
  }
  if (labelText) {
    labelLine.appendChild(document.createTextNode(labelText));
  }
  ensureLucideIcon(labelLine);
  wrap.appendChild(labelLine);

  const extra = document.createElement("div");
  extra.className = "map-tooltip-extra";
  if (item.vehicleListDetailHeading) {
    const listHeadingLine = document.createElement("div");
    listHeadingLine.className = "map-tooltip-time";
    listHeadingLine.textContent = item.vehicleListDetailHeading;
    extra.appendChild(listHeadingLine);
  }
  if (item.kind === "note" && item.vehicleDetailLine) {
    const vehicleLine = document.createElement("div");
    vehicleLine.className = "map-tooltip-text";
    vehicleLine.textContent = item.vehicleDetailLine;
    extra.appendChild(vehicleLine);
  }
  const locationText = formatLocationLabel(
    item.locationLabel || item.location.displayLabel || item.location.label || ""
  );
  if (locationText) {
    const { addressLine, cityLine } = splitLocationLines(locationText);
    const locationRow = document.createElement("div");
    locationRow.className = "map-tooltip-location-row";
    const locationBlock = document.createElement("div");
    locationBlock.className = "map-tooltip-location-block";
    const locationLine = document.createElement("div");
    locationLine.className = "map-tooltip-location";
    locationLine.textContent = addressLine || locationText;
    locationBlock.appendChild(locationLine);
    if (cityLine) {
      const cityStateLine = document.createElement("div");
      cityStateLine.className = "map-tooltip-city";
      cityStateLine.textContent = cityLine;
      locationBlock.appendChild(cityStateLine);
    }
    const copyAddressText = [addressLine || locationText, cityLine].filter(Boolean).join(", ");
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "map-tooltip-copy";
    copyButton.title = "Copy address";
    copyButton.setAttribute("aria-label", "Copy address");
    copyButton.innerHTML = '<i data-lucide="copy"></i>';
    ensureLucideIcon(copyButton);
    copyButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const copied = await copyTextToClipboard(copyAddressText);
      showAppToast(copied ? "Address copied to clipboard" : "Clipboard blocked. Press Ctrl+C / Cmd+C.");
    });
    locationRow.appendChild(locationBlock);
    locationRow.appendChild(copyButton);
    extra.appendChild(locationRow);
  }

  if (item.kind === "note") {
    const timeLine = document.createElement("div");
    timeLine.className = "map-tooltip-time";
    timeLine.textContent = item.timestampText || "";
    extra.appendChild(timeLine);
    const textLine = document.createElement("div");
    textLine.className = "map-tooltip-text";
    textLine.textContent = (item.text || "").replace(/\s*\n\s*/g, " ").trim();
    extra.appendChild(textLine);
  } else if (item.latestText) {
    const latestLabel = document.createElement("div");
    latestLabel.className = "map-tooltip-time";
    latestLabel.textContent = "LATEST:";
    extra.appendChild(latestLabel);
    const latestLine = document.createElement("div");
    latestLine.className = "map-tooltip-text";
    const latestTime = item.latestTimestampText ? `${item.latestTimestampText} ` : "";
    latestLine.textContent = `${latestTime}${item.latestText}`
      .replace(/\s*\n\s*/g, " ")
      .trim();
    extra.appendChild(latestLine);
  }

  const newerActions = document.createElement("div");
  newerActions.className = "map-tooltip-newer-actions";
  const addNewerButton = document.createElement("button");
  addNewerButton.type = "button";
  addNewerButton.className = "map-tooltip-add-newer";
  const addIsVehicle = isVehicleListType(item.cardType);
  addNewerButton.innerHTML =
    `<i data-lucide="map-pin-plus-inside"></i><span>${addIsVehicle ? "+ New Vehicle" : "+ Newer Location"}</span>`;
  ensureLucideIcon(addNewerButton);
  addNewerButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const column = state.columns.find((col) => col.id === item.columnId);
    if (!column) {
      return;
    }
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
    if (addIsVehicle) {
      pendingVehicleInfoNoteTarget = { columnId: column.id, obsId: obs.id };
    }
    markDirty();
    updateEndIfNeeded(now);
    updateStartIfNeeded(now);
    renderColumns();
    persistState();
    updateSummary();
    requestAnimationFrame(() => {
      scrollSelectionIntoView();
      focusLastNote(column.id, obs.id);
      openLocationModalForSelection({ useDropPin: true });
    });
  });
  newerActions.appendChild(addNewerButton);
  extra.appendChild(newerActions);

  const actions = document.createElement("div");
  actions.className = "map-tooltip-actions";
  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "map-tooltip-open";
  openButton.textContent = item.kind === "note" ? "Open Note" : "Open Latest";
  openButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    activateMapLabelTarget(item);
  });
  actions.appendChild(openButton);
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "map-tooltip-delete";
  deleteButton.title = "Delete pin";
  deleteButton.setAttribute("aria-label", "Delete pin");
  deleteButton.innerHTML = '<i data-lucide="trash-2"></i>';
  ensureLucideIcon(deleteButton);
  deleteButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (item.kind === "note") {
      openDeleteModal(item.columnId, item.obsId);
      return;
    }
    openColumnDeleteModal(item.columnId);
  });
  actions.appendChild(deleteButton);
  extra.appendChild(actions);

  wrap.appendChild(extra);
  return wrap;
}

function buildLocation(displayLabel, lat, lon, source, addressLabel) {
  return {
    label: String(displayLabel || addressLabel || "Dropped pin"),
    displayLabel: String(displayLabel || addressLabel || "Dropped pin"),
    addressLabel: String(addressLabel || ""),
    lat,
    lon,
    source: source || "manual",
    updatedAt: Date.now(),
  };
}

function applyLocationToTarget(target, location, options = {}) {
  if (!LOCATION_TAGGING_ENABLED) {
    return;
  }
  if (!target) {
    return;
  }
  if (target.kind === "new-card-lookup") {
    createPinnedCardFromMap(location, {
      type: target.initialType || getNextCardTypeForNewColumn(),
      openMetaModal: true,
      assignLocationByType: true,
      discardOnCancel: true,
    });
    return;
  }
  const preserveMapView = Boolean(options.preserveMapView);
  if (target.kind === "city") {
    state.mapSettings.city = location;
    updateCityUI();
    persistMapSettings();
    persistState();
    applyViewMode();
    mapNeedsFit = true;
    if (mainMap) {
      const center = location || DEFAULT_MAP_CENTER;
      mainMap.setView([center.lat, center.lon], 11);
    }
    return;
  }
  if (target.kind === "center-map") {
    state.mapSettings.centerLocation = location ? { ...location } : null;
    persistMapSettings();
    persistState();
    if (mainMap && location) {
      mainMap.setView([location.lat, location.lon], mainMap.getZoom());
    }
    return;
  }
  const column = state.columns.find((col) => col.id === target.columnId);
  if (!column) {
    return;
  }
  let shouldOpenVehicleInfoModal = false;
  if (target.kind === "card") {
    if (location) {
      assignLocationByCardType(column, location);
    } else {
      column.location = null;
    }
    if (location) {
      setViewMode("split");
    }
    if (!preserveMapView) {
      mapNeedsFit = true;
    } else {
      mapNeedsFit = false;
    }
  } else if (target.kind === "note") {
    const obs = column.observations.find((item) => item.id === target.obsId);
    if (obs) {
      obs.location = location;
      if (
        location &&
        pendingVehicleInfoNoteTarget &&
        pendingVehicleInfoNoteTarget.columnId === target.columnId &&
        pendingVehicleInfoNoteTarget.obsId === target.obsId
      ) {
        shouldOpenVehicleInfoModal = true;
        pendingVehicleInfoNoteTarget = null;
      }
      if (!preserveMapView) {
        mapNeedsFit = true;
      } else {
        mapNeedsFit = false;
      }
    }
  }
  markDirty();
  renderColumns();
  persistState();
  updateSummary();
  renderMapPins();
  if (shouldOpenVehicleInfoModal) {
    requestAnimationFrame(() => {
      openVehicleInfoModalForNote(target.columnId, target.obsId);
    });
  }
}

function alignMapPanelToTop(options = {}) {
  if (!mapPanel) {
    return;
  }
  const behavior = options.behavior || "smooth";
  mapPanel.scrollIntoView({ block: "start", behavior });
  requestAnimationFrame(() => {
    const topOffset = Math.abs(mapPanel.getBoundingClientRect().top);
    if (topOffset > 2) {
      mapPanel.scrollIntoView({ block: "start", behavior });
    }
  });
}

function openLocationModal(target) {
  if (!LOCATION_TAGGING_ENABLED) {
    console.warn("[config] Location tagging is disabled by configuration.");
    return;
  }
  if (!locationModal || !locationSearchInput || !locationResults) {
    return;
  }
  locationModalTarget = target;
  locationModalShouldRestoreView = true;
  locationSearchToken += 1;
  clearMapPlacementMarker();
  const viewModeBeforeModal = state.viewMode;
  locationModalMapViewSnapshot = snapshotMainMapView();
  if (viewModeBeforeModal === "notes") {
    setViewMode("split", { preserveMapView: true });
  }
  ensureMainMap();
  if (!locationModalMapViewSnapshot) {
    locationModalMapViewSnapshot = snapshotMainMapView();
  }
  ensureLocationSearchLayer();
  const shouldAlignWithMap =
    target &&
    (target.kind === "card" || target.kind === "note" || target.kind === "center-map");
  if (shouldAlignWithMap && mapPanel) {
    alignMapPanelToTop({ behavior: "smooth" });
  }
  const existing = getTargetLocation(target);
  pendingLocation = existing ? { ...existing } : null;
  locationSearchInput.value = existing?.label || "";
  locationSearchState.results = [];
  locationSearchState.activeIndex = -1;
  locationResults.innerHTML = "<div class=\"search-empty\">Start typing to search.</div>";

  if (locationTitle) {
    locationTitle.textContent =
      target.kind === "city"
        ? "Set Search City"
        : target.kind === "center-map"
          ? "Center Map"
        : target.kind === "new-card-lookup"
          ? "Lookup + Place New Pin"
          : "Set Location";
  }
  if (locationDropPin) {
    const centerOnly = target.kind === "center-map";
    locationDropPin.classList.toggle("hidden", centerOnly);
    locationDropPin.disabled = centerOnly;
  }
  if (locationTargetLabel) {
    locationTargetLabel.textContent = describeLocationTarget(target);
  }
  updateLocationLimitDetail();
  if (locationClearButton) {
    locationClearButton.disabled = !existing;
  }
  if (locationSetButton) {
    locationSetButton.textContent =
      target.kind === "center-map" ? "Center Map" : "Set Location";
    locationSetButton.disabled = !pendingLocation;
  }

  locationModal.classList.remove("hidden");
  locationModal.setAttribute("aria-hidden", "false");
  syncLocationModalLayout();
  if (pendingLocation) {
    updateLocationPreviewMarker(pendingLocation, { zoom: 14, recenter: false });
  } else {
    centerLocationPreviewMap();
  }
  locationSearchInput.focus();
}

function closeLocationModal() {
  if (!locationModal) {
    return;
  }
  blurFocusedElementWithin(locationModal);
  locationModal.classList.add("hidden");
  locationModal.setAttribute("aria-hidden", "true");
  syncLocationModalLayout();
  locationSearchToken += 1;
  locationModalTarget = null;
  pendingLocation = null;
  clearMapPlacementMarker();
  clearLocationSearchMarkers();
  clearLocationPreviewMarker();
  if (locationModalShouldRestoreView) {
    restoreLocationModalMapView();
  } else {
    locationModalMapViewSnapshot = null;
  }
  locationModalShouldRestoreView = true;
  locationSearchState.results = [];
  locationSearchState.activeIndex = -1;
  if (locationSearchTimer) {
    window.clearTimeout(locationSearchTimer);
    locationSearchTimer = null;
  }
}

function startLocationDropPinMode(target = null) {
  const resolvedTarget = target || locationModalTarget;
  if (!resolvedTarget) {
    return false;
  }
  ensureMainMap();
  if (state.viewMode === "notes") {
    setViewMode("split", { preserveMapView: true });
  }
  if (mapPanel) {
    mapPanel.scrollIntoView({ block: "start" });
  }
  if (!mainMap || !window.L) {
    return false;
  }
  clearMapPlacementMarker();
  const placementPaneName = "map-placement-pane";
  let placementPane = mainMap.getPane(placementPaneName);
  if (!placementPane) {
    placementPane = mainMap.createPane(placementPaneName);
  }
  placementPane.style.zIndex = String(MAP_PIN_FOCUS_ZINDEX + 2000);
  const center = mainMap.getCenter();
  const pinIcon = window.L.divIcon({
    className: "map-pin map-placement-pin",
    html: '<span class="map-pin-dot map-placement-dot"></span>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
  mapPlacementMarker = window.L.marker(center, {
    draggable: true,
    icon: pinIcon,
    zIndexOffset: MAP_PIN_FOCUS_ZINDEX + 1000,
    pane: placementPaneName,
  }).addTo(mainMap);
  mapPlacementMarker.bindTooltip("Drag to place location", {
    permanent: true,
    direction: "right",
    offset: [10, 0],
    className: "map-pin-tooltip map-placement-tooltip is-expanded",
    opacity: 1,
    pane: placementPaneName,
  });
  mapPlacementMarker.on("tooltipopen", () => {
    bindTooltipDragHandle(mapPlacementMarker, true, null);
  });
  requestAnimationFrame(() => {
    bindTooltipDragHandle(mapPlacementMarker, true, null);
  });
  mapPlacementMarker.on("dragend", async (event) => {
    const next = event.target.getLatLng();
    clearMapPlacementMarker();
    const existing = getTargetLocation(resolvedTarget);
    const label = existing?.label || formatLatLonLabel(next.lat, next.lng);
    const locationResult = await buildLocationWithReverse(next.lat, next.lng, label);
    if (locationResult.needsConfirm) {
      const useNew = await openReverseGeocodeModal(
        locationResult.oldLabel,
        locationResult.newLabel
      );
      if (!useNew) {
        return;
      }
    }
    applyLocationToTarget(resolvedTarget, locationResult.location, {
      preserveMapView: true,
    });
  });
  mainMap.panTo(center, { animate: true });
  showAppToast("Drag the temporary pin to set location.");
  return true;
}

function openLocationModalForSelection(options = {}) {
  const useDropPin = options.useDropPin === true;
  if (state.selection?.kind === "note") {
    const column = state.columns.find((col) => col.id === state.selection.columnId);
    if (!column) {
      return false;
    }
    const obs = column.observations.find((item) => item.id === state.selection.obsId);
    if (!obs) {
      return false;
    }
    if (column.location) {
      showAppToast("Clear card location first to assign a separate note pin.");
      return false;
    }
    const target = { kind: "note", columnId: column.id, obsId: obs.id };
    if (useDropPin) {
      startLocationDropPinMode(target);
      return true;
    }
    openLocationModal(target);
    return true;
  }
  if (state.selection?.kind === "column") {
    const target = { kind: "card", columnId: state.selection.columnId };
    if (useDropPin) {
      startLocationDropPinMode(target);
      return true;
    }
    openLocationModal(target);
    return true;
  }
  return false;
}

function snapshotMainMapView() {
  if (!mainMap) {
    return null;
  }
  const center = mainMap.getCenter();
  if (!center) {
    return null;
  }
  return { lat: center.lat, lon: center.lng, zoom: mainMap.getZoom() };
}

function restoreLocationModalMapView() {
  if (!locationModalMapViewSnapshot || !mainMap) {
    locationModalMapViewSnapshot = null;
    return;
  }
  const snapshot = locationModalMapViewSnapshot;
  locationModalMapViewSnapshot = null;
  if (typeof snapshot.zoom !== "number") {
    return;
  }
  mainMap.setView([snapshot.lat, snapshot.lon], snapshot.zoom);
}

function shouldUseSplitLocationOverlay() {
  return state.viewMode === "split" && window.innerWidth > 900 && Boolean(mapPanel);
}

function syncLocationModalLayout() {
  if (!locationModal) {
    return;
  }
  if (locationModal.classList.contains("hidden")) {
    locationModal.classList.remove("location-modal-split-overlay");
    locationModal.style.removeProperty("--location-overlay-right-inset");
    return;
  }
  const useSplitOverlay = shouldUseSplitLocationOverlay();
  locationModal.classList.toggle("location-modal-split-overlay", useSplitOverlay);
  if (!useSplitOverlay) {
    locationModal.style.removeProperty("--location-overlay-right-inset");
    return;
  }
  const mapLeft = mapPanel?.getBoundingClientRect().left;
  const rightInset = Number.isFinite(mapLeft)
    ? Math.max(0, window.innerWidth - mapLeft)
    : 0;
  locationModal.style.setProperty("--location-overlay-right-inset", `${rightInset}px`);
}

function ensureLocationSearchLayer() {
  if (!mainMap || !window.L) {
    return;
  }
  const paneName = "location-search-preview-pane";
  let pane = mainMap.getPane(paneName);
  if (!pane) {
    pane = mainMap.createPane(paneName);
  }
  pane.style.zIndex = String(MAP_PIN_FOCUS_ZINDEX + 2500);
  if (!locationSearchLayerGroup) {
    locationSearchLayerGroup = window.L.layerGroup().addTo(mainMap);
  }
}

function centerLocationPreviewMap() {
  if (!mainMap) {
    return;
  }
  clearLocationPreviewMarker();
}

function clearLocationPreviewMarker() {
  if (locationPreviewMarker && mainMap) {
    mainMap.removeLayer(locationPreviewMarker);
  }
  locationPreviewMarker = null;
}

function updateLocationPreviewMarker(location, options = {}) {
  if (!mainMap || !window.L) {
    return;
  }
  ensureLocationSearchLayer();
  const recenter = options.recenter !== false;
  const zoom = typeof options.zoom === "number" ? options.zoom : 14;
  const transitionFromIndex =
    typeof options.transitionFromIndex === "number" ? options.transitionFromIndex : -1;
  const sourceMarker =
    transitionFromIndex >= 0 ? locationSearchMarkers[transitionFromIndex] || null : null;
  const sourceMarkerEl = sourceMarker?.getElement?.() || null;
  if (sourceMarkerEl) {
    sourceMarkerEl.classList.add("is-transition-out");
  }
  clearLocationPreviewMarker();
  const icon = window.L.divIcon({
    className: "location-preview-marker",
    html: "<span class=\"location-preview-dot\"></span>",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
  locationPreviewMarker = window.L.marker([location.lat, location.lon], {
    draggable: true,
    icon,
    pane: "location-search-preview-pane",
    zIndexOffset: MAP_PIN_FOCUS_ZINDEX + 2200,
  }).addTo(mainMap);
  const previewEl = locationPreviewMarker.getElement?.();
  if (previewEl) {
    previewEl.classList.toggle("is-entering", Boolean(sourceMarkerEl));
    if (sourceMarkerEl) {
      window.setTimeout(() => {
        previewEl.classList.remove("is-entering");
      }, 260);
    }
  }
  locationPreviewMarker.on("dragend", async (event) => {
    const next = event.target.getLatLng();
    const label = pendingLocation?.label || "Dropped pin";
    const result = await buildLocationWithReverse(next.lat, next.lng, label);
    if (result.needsConfirm) {
      const useNew = await openReverseGeocodeModal(result.oldLabel, result.newLabel);
      if (!useNew) {
        if (pendingLocation) {
          updateLocationPreviewMarker(pendingLocation, { recenter: false });
        }
        return;
      }
    }
    setPendingLocation(result.location, { recenter: false });
  });
  if (recenter) {
    mainMap.setView([location.lat, location.lon], zoom);
  }
}

function setPendingLocation(location, options = {}) {
  pendingLocation = location;
  const showPreview = options.showPreview !== false;
  if (locationSetButton) {
    locationSetButton.disabled = !pendingLocation;
  }
  if (locationClearButton) {
    locationClearButton.disabled = !pendingLocation;
  }
  if (location && showPreview) {
    updateLocationPreviewMarker(location, options);
  } else {
    clearLocationPreviewMarker();
  }
}

function showMapGeocodeNotice(message) {
  if (!mapGeocodeNotice || !mapGeocodeText) {
    return;
  }
  mapGeocodeText.textContent = message;
  mapGeocodeNotice.classList.remove("hidden");
  if (mapGeocodeNoticeTimer) {
    window.clearTimeout(mapGeocodeNoticeTimer);
  }
  mapGeocodeNoticeTimer = window.setTimeout(() => {
    mapGeocodeNotice.classList.add("hidden");
  }, 4000);
}

function describeLocationTarget(target) {
  if (target.kind === "city") {
    return "Default city for geocoding + radius filtering.";
  }
  if (target.kind === "center-map") {
    return "Search for a location to center the map.";
  }
  if (target.kind === "new-card-lookup") {
    return "Search for a location to create a new pinned card.";
  }
  const column = state.columns.find((col) => col.id === target.columnId);
  if (!column) {
    return "";
  }
  const cardLabel = getCardDisplay(column.type || DEFAULT_CARD_TYPE, column.label);
  if (target.kind === "card") {
    return `Card: ${cardLabel}`;
  }
  const obs = column.observations.find((item) => item.id === target.obsId);
  const noteTime = obs ? formatTimeOnly(obs.timestamp) : "";
  return `Note: ${cardLabel} ${noteTime}`.trim();
}

function getTargetLocation(target) {
  if (!target) {
    return null;
  }
  if (target.kind === "city") {
    return state.mapSettings.city;
  }
  if (target.kind === "center-map") {
    return state.mapSettings.centerLocation || null;
  }
  if (target.kind === "new-card-lookup") {
    return null;
  }
  const column = state.columns.find((col) => col.id === target.columnId);
  if (!column) {
    return null;
  }
  if (target.kind === "card") {
    return column.location || null;
  }
  const obs = column.observations.find((item) => item.id === target.obsId);
  return obs?.location || null;
}

function getLocationSuggestionScore(result, query) {
  const label = String(result?.label || "");
  const labelLower = label.toLowerCase();
  const queryLower = String(query || "").trim().toLowerCase();
  const cityLabel = String(state.mapSettings?.city?.label || "").trim().toLowerCase();

  const hasStreetNumber = /\b\d{1,5}\b/.test(label);
  const hasStreetWord =
    /\b(st|street|ave|avenue|rd|road|blvd|boulevard|ln|lane|dr|drive|hwy|highway|pkwy|parkway|ct|court|cir|circle|pl|place|trl|trail)\b/i.test(
      label
    );
  const segmentCount = label.split(",").map((part) => part.trim()).filter(Boolean).length;
  const startsWithQuery = queryLower ? labelLower.startsWith(queryLower) : false;
  const includesQuery = queryLower ? labelLower.includes(queryLower) : false;
  const includesConfiguredCity = cityLabel ? labelLower.includes(cityLabel) : false;
  const looksLikeGenericCity =
    !hasStreetNumber && !hasStreetWord && (segmentCount <= 2 || includesConfiguredCity);

  let score = 0;
  if (hasStreetNumber) score += 60;
  if (hasStreetWord) score += 35;
  if (startsWithQuery) score += 20;
  if (includesQuery) score += 10;
  score += Math.min(segmentCount, 4) * 3;
  if (looksLikeGenericCity) score -= 45;
  return score;
}

function rankLocationSearchResults(query, results) {
  if (!Array.isArray(results) || results.length <= 1) {
    return Array.isArray(results) ? results : [];
  }
  return results
    .map((result, index) => ({
      result,
      index,
      score: getLocationSuggestionScore(result, query),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.index - b.index;
    })
    .map((item) => item.result);
}

async function runLocationSearch(query) {
  if (!locationResults) {
    return;
  }
  if (!isModalOpen(locationModal)) {
    return;
  }
  const searchToken = (locationSearchToken += 1);
  if (!query.trim()) {
    locationResults.innerHTML = "<div class=\"search-empty\">Start typing to search.</div>";
    clearLocationSearchMarkers();
    return;
  }
  clearLocationSearchMarkers();
  locationResults.innerHTML = "<div class=\"search-empty\">Searching...</div>";
  let results = await fetchAutocompleteResults(query);
  if (searchToken !== locationSearchToken || !isModalOpen(locationModal)) {
    return;
  }
  results = rankLocationSearchResults(query, results);
  if (!results.length) {
    const fallback = await fetchGeoResults(query);
    if (searchToken !== locationSearchToken || !isModalOpen(locationModal)) {
      return;
    }
    if (fallback) {
      results = [{ label: fallback.label, location: fallback }];
    }
  }
  if (searchToken !== locationSearchToken || !isModalOpen(locationModal)) {
    return;
  }
  renderLocationResults(results);
}

function getLocationResultKey(index) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (index < alphabet.length) {
    return alphabet[index];
  }
  return "?";
}

function buildLocationResultMarkerIcon(key, isActive = false) {
  if (!window.L) {
    return null;
  }
  return window.L.divIcon({
    className: `location-result-marker${isActive ? " is-active" : ""}`,
    html: `<span>${key}</span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function clearLocationSearchMarkers() {
  locationSearchMarkers = [];
  locationSearchBounds = null;
  if (locationSearchLayerGroup) {
    locationSearchLayerGroup.clearLayers();
  }
}

function highlightLocationResult(index, options = {}) {
  const allowMapPan = options.allowMapPan !== false;
  if (!locationResults) {
    return;
  }
  locationSearchState.activeIndex = index;
  Array.from(locationResults.children).forEach((child, childIndex) => {
    child.classList.toggle("highlighted", childIndex === index);
  });
  locationSearchMarkers.forEach((marker, markerIndex) => {
    if (!marker) {
      return;
    }
    const isActive = markerIndex === index;
    marker.setZIndexOffset(markerIndex === index ? 500 : 0);
    const key = marker._locationResultKey || getLocationResultKey(markerIndex);
    const icon = buildLocationResultMarkerIcon(key, isActive);
    if (icon) {
      marker.setIcon(icon);
    }
    const el = marker.getElement();
    if (el) {
      if (!isActive) {
        el.classList.remove("is-transition-out");
      }
      el.classList.toggle("is-active", isActive);
    }
  });

  // Keep keyboard-highlighted results visible even if fitBounds was imperfect.
  if (allowMapPan && index >= 0 && mainMap) {
    const activeMarker = locationSearchMarkers[index];
    const activeLatLng = activeMarker?.getLatLng?.();
    if (activeLatLng) {
      const currentBounds = mainMap.getBounds?.();
      const isVisible = currentBounds?.pad ? currentBounds.pad(-0.08).contains(activeLatLng) : true;
      if (!isVisible) {
        mainMap.panTo(activeLatLng, { animate: true });
      }
    }
  }
}

async function updateLocationSearchMarkers(results, token) {
  if (!mainMap || !isModalOpen(locationModal)) {
    return;
  }
  ensureLocationSearchLayer();
  if (!locationSearchLayerGroup) {
    return;
  }
  clearLocationSearchMarkers();
  const bounds = [];
  const resolvedLocations = await Promise.all(
    results.map(async (result) => {
      if (result.location) {
        return result.location;
      }
      const fetched = await fetchGeoResults(result.searchText || result.label);
      if (fetched) {
        result.location = fetched;
      }
      return fetched;
    })
  );
  if (token !== locationSearchToken || !isModalOpen(locationModal)) {
    return;
  }
  for (let i = 0; i < results.length; i += 1) {
    const location = resolvedLocations[i];
    if (!location) {
      locationSearchMarkers[i] = null;
      continue;
    }
    const key = getLocationResultKey(i);
    const marker = window.L.marker([location.lat, location.lon], {
      icon: buildLocationResultMarkerIcon(key, false),
      pane: "location-search-preview-pane",
      zIndexOffset: MAP_PIN_FOCUS_ZINDEX + 1800,
    });
    marker._locationResultKey = key;
    marker.addTo(locationSearchLayerGroup);
    locationSearchMarkers[i] = marker;
    bounds.push([location.lat, location.lon]);
  }
  if (token !== locationSearchToken || !isModalOpen(locationModal)) {
    return;
  }
  if (bounds.length) {
    locationSearchBounds = window.L.latLngBounds(bounds);
    // In split/modal transitions Leaflet may need a size invalidation before fitting.
    mainMap.invalidateSize({ pan: false, animate: false });
    mainMap.fitBounds(locationSearchBounds, { padding: [40, 40], maxZoom: 14 });
    requestAnimationFrame(() => {
      if (!isModalOpen(locationModal) || !locationSearchBounds) {
        return;
      }
      mainMap.invalidateSize({ pan: false, animate: false });
      mainMap.fitBounds(locationSearchBounds, { padding: [40, 40], maxZoom: 14 });
    });
  }
  highlightLocationResult(locationSearchState.activeIndex);
}

function renderLocationResults(results) {
  if (!locationResults || !isModalOpen(locationModal)) {
    return;
  }
  locationSearchState.results = results;
  locationSearchState.activeIndex = -1;
  locationSearchState.selectedIndex = -1;
  locationSearchState.hoverIndex = -1;
  locationResults.innerHTML = "";
  locationSearchToken += 1;
  const token = locationSearchToken;
  clearLocationSearchMarkers();
  if (!results.length) {
    locationResults.innerHTML = "<div class=\"search-empty\">No matches found.</div>";
    return;
  }
  results.forEach((result, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "location-result";
    const key = getLocationResultKey(index);
    const keyEl = document.createElement("span");
    keyEl.className = "location-result-key";
    keyEl.textContent = key;
    const textEl = document.createElement("span");
    textEl.textContent = result.label;
    button.appendChild(keyEl);
    button.appendChild(textEl);
    button.addEventListener("click", () => {
      selectLocationResult(result, index, { source: "mouse" });
    });
    button.addEventListener("keydown", async (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      await selectLocationResult(result, index, {
        source: "keyboard",
        focusSetButton: true,
      });
    });
    button.addEventListener("focus", () => {
      highlightLocationResult(index);
    });
    button.addEventListener("mouseenter", () => {
      highlightLocationResult(index, { allowMapPan: false });
    });
    locationResults.appendChild(button);
  });
  updateLocationSearchMarkers(results, token);
}

async function selectLocationResult(result, index, options = {}) {
  const source = options.source || "unknown";
  const focusSetButton = options.focusSetButton === true;
  if (!result) {
    return;
  }
  if (
    source === "mouse" &&
    locationSearchState.selectedIndex === index &&
    pendingLocation &&
    locationSetButton &&
    !locationSetButton.disabled
  ) {
    locationSearchState.selectedIndex = -1;
    locationSearchState.activeIndex = -1;
    locationSearchState.hoverIndex = -1;
    Array.from(locationResults.children).forEach((child) => {
      child.classList.remove("active", "highlighted");
    });
    highlightLocationResult(-1);
    if (locationSearchBounds && mainMap) {
      mainMap.fitBounds(locationSearchBounds, { padding: [40, 40], maxZoom: 14 });
    }
    pendingLocation = null;
    clearLocationPreviewMarker();
    if (locationSetButton) {
      locationSetButton.disabled = true;
    }
    if (locationClearButton) {
      locationClearButton.disabled = true;
    }
    return;
  }
  const wasSelected = locationSearchState.selectedIndex !== -1;
  locationSearchState.selectedIndex = index;
  Array.from(locationResults.children).forEach((child, childIndex) => {
    child.classList.toggle("active", childIndex === index);
  });
  highlightLocationResult(index);
  const location = result.location || (await fetchGeoResults(result.searchText || result.label));
  if (location) {
    if (result.label) {
      location.displayLabel = result.label;
      location.label = result.label;
    }
    setPendingLocation(location, { recenter: false, showPreview: false });
    if (mainMap) {
      const isCenterMapTarget = locationModalTarget?.kind === "center-map";
      const zoom = isCenterMapTarget ? mainMap.getZoom() : wasSelected ? mainMap.getZoom() : 16;
      mainMap.setView([location.lat, location.lon], zoom);
    }
    if (
      focusSetButton &&
      locationSetButton &&
      !locationSetButton.disabled &&
      typeof locationSetButton.focus === "function"
    ) {
      locationSetButton.focus();
    }
  }
}

function applyPendingLocationFromModal() {
  if (!locationModalTarget || !pendingLocation) {
    return;
  }
  const selectedIndex =
    typeof locationSearchState.selectedIndex === "number"
      ? locationSearchState.selectedIndex
      : -1;
  const selectedMarkerEl =
    selectedIndex >= 0 ? locationSearchMarkers[selectedIndex]?.getElement?.() : null;
  if (selectedMarkerEl) {
    selectedMarkerEl.classList.add("is-transition-out");
  }
  const previewEl = locationPreviewMarker?.getElement?.();
  if (previewEl) {
    previewEl.classList.add("is-confirming");
  }
  const finalizeApply = () => {
    if (mainMap && locationModalTarget?.kind !== "center-map") {
      mainMap.setView(
        [pendingLocation.lat, pendingLocation.lon],
        Math.max(mainMap.getZoom(), 16)
      );
    }
    locationModalShouldRestoreView = false;
    applyLocationToTarget(locationModalTarget, pendingLocation, {
      preserveMapView: true,
    });
    closeLocationModal();
  };
  if (selectedMarkerEl || previewEl) {
    window.setTimeout(finalizeApply, 170);
    return;
  }
  finalizeApply();
}

function buildGeoSearchQuery(query) {
  const cleaned = query.trim();
  if (!state.mapSettings.city || !state.mapSettings.city.label) {
    return cleaned;
  }
  const cityLabel = state.mapSettings.city.label.trim();
  if (!cityLabel) {
    return cleaned;
  }
  if (cleaned.toLowerCase().includes(cityLabel.toLowerCase())) {
    return cleaned;
  }
  return `${cleaned} ${cityLabel}`;
}

async function fetchAutocompleteResults(query) {
  if (!MAP_FEATURE_ENABLED || !GEO_BASE_URL) {
    return [];
  }
  try {
    const payload = { search: buildGeoSearchQuery(query) };
    const response = await fetch(`${GEO_BASE_URL}/autocomplete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
    return suggestions
      .map((item) => {
        const prediction = item.placePrediction || {};
        const structured = prediction.structuredFormat || {};
        const mainText = structured.mainText?.text || prediction.text?.text || "";
        const secondary = structured.secondaryText?.text || "";
        const label = secondary ? `${mainText}, ${secondary}` : mainText;
        return {
          label: label || "Unknown",
          searchText: label || prediction.text?.text || "",
        };
      })
      .filter((item) => item.label);
  } catch (error) {
    return [];
  }
}

async function fetchGeoResults(query) {
  if (!MAP_FEATURE_ENABLED || !GEO_BASE_URL) {
    return null;
  }
  try {
    const payload = { search: buildGeoSearchQuery(query) };
    const response = await fetch(`${GEO_BASE_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];
    const normalizedQuery = String(query || "").toLowerCase();
    const match =
      results.find((result) =>
        String(result.formatted_address || "").toLowerCase().includes(normalizedQuery)
      ) || results[0];
    if (!match) {
      return null;
    }
    const lat = match.geometry?.location?.lat;
    const lon = match.geometry?.location?.lng;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }
    const address = match.formatted_address || query;
    return buildLocation(address, lat, lon, "geolocate", address);
  } catch (error) {
    return null;
  }
}

async function fetchReverseGeocode(lat, lon) {
  if (!MAP_FEATURE_ENABLED || !GEO_BASE_URL) {
    return { label: null, rateLimited: false };
  }
  try {
    const payload = { latitude: lat, longitude: lon };
    const response = await fetch(`${GEO_BASE_URL}/reverse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.status === 429) {
      return { label: null, rateLimited: true };
    }
    if (!response.ok) {
      return { label: null, rateLimited: false };
    }
    const data = await response.json();
    const results = Array.isArray(data?.result) ? data.result : [];
    if (!results.length) {
      return { label: null, rateLimited: false };
    }
    const best = results[0];
    const structured = best?.structuredAddress || null;
    let label = "";
    if (structured && Array.isArray(structured.addressLines) && structured.addressLines.length) {
      const addressLine = structured.addressLines.filter(Boolean).join(", ");
      const locality = String(structured.locality || "").trim();
      const admin = normalizeStateAbbrev(structured.administrativeArea);
      const cityLine = [locality, admin].filter(Boolean).join(", ");
      label = [addressLine, cityLine].filter(Boolean).join(", ");
    } else {
      const raw = String(best?.address || "").replace(/,\s*USA$/i, "").trim();
      if (raw) {
        const parts = raw.split(/\s*[,，]\s*/).filter(Boolean);
        const line1 = parts[0] || "";
        let line2 = parts.slice(1).join(", ");
        if (line1 && isSpecificAddressText(line1)) {
          line2 = line2.replace(/\s+\d{5}(?:-\d{4})?$/, "").trim();
        }
        label = [line1, line2].filter(Boolean).join(", ");
      }
    }
    return { label: label ? String(label) : null, rateLimited: false };
  } catch (error) {
    return { label: null, rateLimited: false };
  }
}

function formatLatLonLabel(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return "";
  }
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

function formatNearLabel(label) {
  const cleaned = String(label || "").trim();
  if (!cleaned) {
    return "";
  }
  return cleaned.toLowerCase().startsWith("near ") ? cleaned : `near ${cleaned}`;
}

function formatFallbackLabel(label) {
  const formatted = formatLocationLabel(label);
  return formatted || "None";
}

async function buildLocationWithReverse(lat, lon, fallbackLabel = "Dropped pin") {
  const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
  if (reverseGeocodeCache.has(key)) {
    const cached = reverseGeocodeCache.get(key);
    if (cached?.label) {
      const displayLabel = formatNearLabel(cached.label);
      return {
        location: buildLocation(displayLabel, lat, lon, "reverse", cached.label),
        needsConfirm: !isSpecificAddressText(cached.label),
        oldLabel: formatFallbackLabel(fallbackLabel),
        newLabel: formatLocationLabel(displayLabel) || formatFallbackLabel(displayLabel),
      };
    }
  }
  if (reverseGeocodeInFlight.has(key)) {
    const inFlight = reverseGeocodeInFlight.get(key);
    if (inFlight) {
      const resolved = await inFlight;
      const displayLabel =
        formatNearLabel(resolved?.label) ||
        formatNearLabel(formatLatLonLabel(lat, lon)) ||
        "Dropped pin";
      return {
        location: buildLocation(
          displayLabel,
          lat,
          lon,
          resolved?.label ? "reverse" : "manual",
          resolved?.label || ""
        ),
        needsConfirm: !resolved?.label || !isSpecificAddressText(resolved.label),
        oldLabel: formatFallbackLabel(fallbackLabel),
        newLabel: formatLocationLabel(displayLabel) || formatFallbackLabel(displayLabel),
      };
    }
  }
  const task = reverseGeocodeQueue.then(async () => {
    const now = Date.now();
    const wait = Math.max(0, 500 - (now - reverseGeocodeLastAt));
    if (wait) {
      await new Promise((resolve) => window.setTimeout(resolve, wait));
    }
    reverseGeocodeLastAt = Date.now();
    const result = await fetchReverseGeocode(lat, lon);
    if (result?.label) {
      reverseGeocodeCache.set(key, { label: result.label, ts: Date.now() });
    }
    return result;
  });
  reverseGeocodeQueue = task.catch(() => ({}));
  reverseGeocodeInFlight.set(key, task);
  const resolved = await task.finally(() => {
    reverseGeocodeInFlight.delete(key);
  });
  if (resolved?.rateLimited) {
    showMapGeocodeNotice("Rate limited — using the existing pin label.");
  }
  const displayLabel =
    formatNearLabel(resolved?.label) ||
    formatNearLabel(formatLatLonLabel(lat, lon)) ||
    "Dropped pin";
  return {
    location: buildLocation(
      displayLabel,
      lat,
      lon,
      resolved?.label ? "reverse" : "manual",
      resolved?.label || ""
    ),
    needsConfirm: !resolved?.label || !isSpecificAddressText(resolved.label),
    oldLabel: formatFallbackLabel(fallbackLabel),
    newLabel: formatLocationLabel(displayLabel) || formatFallbackLabel(displayLabel),
  };
}

function updateCityUI() {
  if (cityLabel) {
    cityLabel.textContent = state.mapSettings.city
      ? state.mapSettings.city.displayLabel || state.mapSettings.city.label
      : "No city set.";
  }
  if (mapRadiusInput) {
    mapRadiusInput.value = state.mapSettings.radiusMiles;
  }
  updateLocationLimitDetail();
  updateMapStyleButton();
}

function syncMapFilterControls() {
  if (!state.mapFilters) {
    return;
  }
  if (state.mapFilters.showMinimized === undefined) {
    state.mapFilters.showMinimized =
      state.mapFilters.hideMinimized === undefined
        ? DEFAULT_MAP_FILTER_SHOW_MINIMIZED
        : !Boolean(state.mapFilters.hideMinimized);
  } else {
    state.mapFilters.showMinimized = Boolean(state.mapFilters.showMinimized);
  }
  state.mapFilters.recencyMode = normalizeMapRecencyMode(state.mapFilters.recencyMode);
  if (state.mapFilters.noteReportableOnly === undefined) {
    state.mapFilters.noteReportableOnly = DEFAULT_MAP_FILTER_NOTE_REPORTABLE_ONLY;
  } else {
    state.mapFilters.noteReportableOnly = Boolean(state.mapFilters.noteReportableOnly);
  }
  state.mapFilters.inactiveLabelOpacity = normalizeMapInactiveLabelOpacity(
    state.mapFilters.inactiveLabelOpacity
  );
  updateMapInactiveLabelOpacityCssVar();
  if (mapLabelsButton) {
    mapLabelsButton.setAttribute("aria-expanded", "false");
  }
  mapLabelsMenu?.classList.remove("show");
  if (mapVisibilityButton) {
    mapVisibilityButton.setAttribute("aria-expanded", "false");
  }
  mapVisibilityMenu?.classList.remove("show");
  if (mapTypeButton) {
    mapTypeButton.setAttribute("aria-expanded", "false");
  }
  mapTypeMenu?.classList.remove("show");
  if (mapStyleButton) {
    mapStyleButton.setAttribute("aria-expanded", "false");
  }
  mapStyleMenu?.classList.remove("show");
  updateMapTypeButtonState(state.mapFilters.types);
}

function updateMapInactiveLabelOpacityCssVar() {
  const opacity = normalizeMapInactiveLabelOpacity(state.mapFilters?.inactiveLabelOpacity);
  document.documentElement.style.setProperty("--map-inactive-label-opacity", String(opacity));
  if (mapView) {
    mapView.style.setProperty("--map-inactive-label-opacity", String(opacity));
  }
}

function isMapTypeNoneSelected(filters) {
  if (!filters) {
    return false;
  }
  return Object.values(filters).every((value) => !value);
}

function updateMapTypeButtonState(filters) {
  if (!mapTypeButton) {
    return;
  }
  mapTypeButton.classList.toggle("hazard", isMapTypeNoneSelected(filters));
}

function showMapFilterNotice() {
  if (mapFilterNotice) {
    mapFilterNotice.classList.remove("hidden");
  }
}

function hideMapFilterNotice() {
  if (mapFilterNotice) {
    mapFilterNotice.classList.add("hidden");
  }
}

function isMapPinFiltered(targetKey) {
  if (!targetKey) {
    return false;
  }
  const [kind, columnId, obsId] = targetKey.split(":");
  const column = state.columns.find((col) => String(col.id) === String(columnId));
  if (!column) {
    return false;
  }
  if (!state.mapFilters?.showMinimized && column.minimized) {
    return true;
  }
  const normalizedType = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
  if (state.mapFilters?.types && !state.mapFilters.types[normalizedType]) {
    return true;
  }
  if (kind === "note" && Boolean(state.mapFilters?.noteReportableOnly)) {
    const obs = column.observations.find((item) => String(item.id) === String(obsId));
    if (obs && !obs.reportable) {
      return true;
    }
  }
  if (kind === "note" && normalizeMapRecencyMode(state.mapFilters?.recencyMode) === "mostRecent") {
    const latestLocationObs = getLatestLocationObservationInColumn(column, {
      reportableOnly: Boolean(state.mapFilters?.noteReportableOnly),
    });
    if (latestLocationObs && String(latestLocationObs.id) !== String(obsId)) {
      return true;
    }
  }
  return false;
}

function renderMapLabelsMenu(filters) {
  if (!mapLabelsMenu) {
    return;
  }
  mapLabelsMenu.innerHTML = "";
  const timeToggle = document.createElement("label");
  timeToggle.className = "map-type-item";
  const timeCheckbox = document.createElement("input");
  timeCheckbox.type = "checkbox";
  timeCheckbox.checked = Boolean(filters.labelTimes);
  timeCheckbox.addEventListener("change", () => {
    state.mapFilters.labelTimes = timeCheckbox.checked;
    renderMapPins();
    persistState();
    hideMapFilterNotice();
  });
  const timeText = document.createElement("span");
  timeText.textContent = "Show label times";
  timeToggle.appendChild(timeCheckbox);
  timeToggle.appendChild(timeText);
  mapLabelsMenu.appendChild(timeToggle);

  const opacityWrap = document.createElement("label");
  opacityWrap.className = "map-label-opacity";
  const opacityRow = document.createElement("div");
  opacityRow.className = "map-label-opacity-row";
  const opacityText = document.createElement("span");
  opacityText.textContent = "Inactive label opacity";
  const opacityValue = document.createElement("span");
  opacityValue.className = "map-label-opacity-value";
  opacityRow.appendChild(opacityText);
  opacityRow.appendChild(opacityValue);
  const opacityInput = document.createElement("input");
  opacityInput.type = "range";
  opacityInput.min = "25";
  opacityInput.max = "100";
  opacityInput.step = "5";
  const normalized = normalizeMapInactiveLabelOpacity(filters.inactiveLabelOpacity);
  opacityInput.value = String(Math.round(normalized * 100));
  opacityValue.textContent = `${opacityInput.value}%`;
  opacityInput.addEventListener("input", () => {
    opacityValue.textContent = `${opacityInput.value}%`;
    state.mapFilters.inactiveLabelOpacity = normalizeMapInactiveLabelOpacity(
      Number(opacityInput.value) / 100
    );
    updateMapInactiveLabelOpacityCssVar();
    renderMapPins();
    persistState();
    hideMapFilterNotice();
  });
  opacityWrap.appendChild(opacityRow);
  opacityWrap.appendChild(opacityInput);
  mapLabelsMenu.appendChild(opacityWrap);
}

function renderMapVisibilityMenu(filters) {
  if (!mapVisibilityMenu) {
    return;
  }
  mapVisibilityMenu.innerHTML = "";

  const cardSettingsLabel = document.createElement("div");
  cardSettingsLabel.className = "map-visibility-recency-label";
  cardSettingsLabel.textContent = "Card-based settings";
  mapVisibilityMenu.appendChild(cardSettingsLabel);

  const minimizedToggle = document.createElement("label");
  minimizedToggle.className = "map-type-item";
  const minimizedCheckbox = document.createElement("input");
  minimizedCheckbox.type = "checkbox";
  minimizedCheckbox.checked = Boolean(filters.showMinimized);
  minimizedCheckbox.addEventListener("change", () => {
    state.mapFilters.showMinimized = minimizedCheckbox.checked;
    renderMapPins();
    persistState();
    hideMapFilterNotice();
  });
  const minimizedText = document.createElement("span");
  minimizedText.textContent = "Show minimized";
  minimizedToggle.appendChild(minimizedCheckbox);
  minimizedToggle.appendChild(minimizedText);
  mapVisibilityMenu.appendChild(minimizedToggle);

  const recencyWrap = document.createElement("div");
  recencyWrap.className = "map-visibility-recency";
  const recencyLabel = document.createElement("div");
  recencyLabel.className = "map-visibility-recency-label";
  recencyLabel.textContent = "Note-based settings";
  recencyWrap.appendChild(recencyLabel);

  const recentOption = document.createElement("label");
  recentOption.className = "map-type-item";
  const recentCheckbox = document.createElement("input");
  recentCheckbox.type = "checkbox";
  recentCheckbox.checked = normalizeMapRecencyMode(filters.recencyMode) === "mostRecent";
  recentCheckbox.addEventListener("change", () => {
    state.mapFilters.recencyMode = recentCheckbox.checked ? "mostRecent" : "all";
    renderMapPins();
    persistState();
    hideMapFilterNotice();
  });
  const recentText = document.createElement("span");
  recentText.textContent = "Show only most recent";
  recentOption.appendChild(recentCheckbox);
  recentOption.appendChild(recentText);
  recencyWrap.appendChild(recentOption);

  const reportableOption = document.createElement("label");
  reportableOption.className = "map-type-item";
  const reportableCheckbox = document.createElement("input");
  reportableCheckbox.type = "checkbox";
  reportableCheckbox.checked = Boolean(filters.noteReportableOnly);
  reportableCheckbox.addEventListener("change", () => {
    state.mapFilters.noteReportableOnly = reportableCheckbox.checked;
    renderMapPins();
    persistState();
    hideMapFilterNotice();
  });
  const reportableText = document.createElement("span");
  reportableText.textContent = "Show only reportable";
  reportableOption.appendChild(reportableCheckbox);
  reportableOption.appendChild(reportableText);
  recencyWrap.appendChild(reportableOption);

  mapVisibilityMenu.appendChild(recencyWrap);
}

function renderMapTypeMenu(filters) {
  if (!mapTypeMenu) {
    return;
  }
  mapTypeMenu.innerHTML = "";
  const labelCounts = CARD_TYPES.reduce((acc, type) => {
    acc[type.label] = (acc[type.label] || 0) + 1;
    return acc;
  }, {});
  const uniqueTypes = [];
  const seenTypes = new Set();
  CARD_TYPES.forEach((type) => {
    const normalized = normalizeCardType(type.value);
    if (seenTypes.has(normalized)) {
      return;
    }
    seenTypes.add(normalized);
    uniqueTypes.push(type);
  });
  uniqueTypes.forEach((type) => {
    const normalized = normalizeCardType(type.value);
    const label = document.createElement("label");
    label.className = "map-type-item";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(filters[normalized]);
    checkbox.addEventListener("change", () => {
      const next = normalizeMapTypeFilters(state.mapFilters.types);
      next[normalized] = checkbox.checked;
      applyMapTypeFilters(next);
    });
    const icon = createCardTypeIconNode(normalized);
    const text = document.createElement("span");
    text.textContent =
      labelCounts[type.label] > 1 ? type.value : type.label;
    label.appendChild(checkbox);
    label.appendChild(icon);
    label.appendChild(text);
    mapTypeMenu.appendChild(label);
  });
  const actions = document.createElement("div");
  actions.className = "map-type-actions";
  const showAllButton = document.createElement("button");
  showAllButton.type = "button";
  showAllButton.className = "map-type-apply";
  showAllButton.textContent = "Show All";
  showAllButton.addEventListener("click", (event) => {
    event.preventDefault();
    const defaults = getDefaultMapTypeFilters();
    applyMapTypeFilters(defaults);
    renderMapTypeMenu(state.mapFilters.types);
  });
  actions.appendChild(showAllButton);
  mapTypeMenu.appendChild(actions);
  refreshIcons();
}

function renderMapStyleMenu() {
  if (!mapStyleMenu) {
    return;
  }
  mapStyleMenu.innerHTML = "";
  const active = getActiveMapStyle().id;
  MAP_STYLES.forEach((style) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-style-item";
    button.classList.toggle("active", style.id === active);
    button.textContent = style.label;
    button.addEventListener("click", () => {
      setMapStyle(style.id);
      updateMapStyleButton();
      mapStyleMenu.classList.remove("show");
      mapStyleButton?.setAttribute("aria-expanded", "false");
    });
    mapStyleMenu.appendChild(button);
  });
}

function updateMapStyleButton() {
  if (!mapStyleButton) {
    return;
  }
  const style = getActiveMapStyle();
  mapStyleButton.textContent = `Style: ${style.label} ▾`;
}

function applyMapTypeFilters(next) {
  state.mapFilters.types = normalizeMapTypeFilters(next);
  updateMapTypeButtonState(state.mapFilters.types);
  mapNeedsFit = true;
  renderMapPins();
  persistState();
  hideMapFilterNotice();
}

function openMapLabelsMenu() {
  if (!mapLabelsMenu || !mapLabelsButton) {
    return;
  }
  renderMapLabelsMenu(state.mapFilters);
  mapLabelsMenu.classList.add("show");
  mapLabelsButton.setAttribute("aria-expanded", "true");
}

function closeMapLabelsMenu() {
  if (!mapLabelsMenu || !mapLabelsButton) {
    return;
  }
  mapLabelsMenu.classList.remove("show");
  mapLabelsButton.setAttribute("aria-expanded", "false");
}

function openMapVisibilityMenu() {
  if (!mapVisibilityMenu || !mapVisibilityButton) {
    return;
  }
  renderMapVisibilityMenu(state.mapFilters);
  mapVisibilityMenu.classList.add("show");
  mapVisibilityButton.setAttribute("aria-expanded", "true");
}

function closeMapVisibilityMenu() {
  if (!mapVisibilityMenu || !mapVisibilityButton) {
    return;
  }
  mapVisibilityMenu.classList.remove("show");
  mapVisibilityButton.setAttribute("aria-expanded", "false");
}

function openMapTypeMenu() {
  if (!mapTypeMenu || !mapTypeButton) {
    return;
  }
  renderMapTypeMenu(state.mapFilters.types);
  mapTypeMenu.classList.add("show");
  mapTypeButton.setAttribute("aria-expanded", "true");
}

function closeMapTypeMenu() {
  if (!mapTypeMenu || !mapTypeButton) {
    return;
  }
  updateMapTypeButtonState(state.mapFilters.types);
  mapTypeMenu.classList.remove("show");
  mapTypeButton.setAttribute("aria-expanded", "false");
}

function updateLocationLimitDetail() {
  if (!locationLimitDetail) {
    return;
  }
  const city = state.mapSettings.city;
  const radius = state.mapSettings.radiusMiles;
  if (city && radius) {
    const cityLabel = city.displayLabel || city.label;
    locationLimitDetail.textContent = `(Limit results to ${radius} miles of ${cityLabel})`;
    locationLimitDetail.classList.remove("is-link");
    locationLimitDetail.disabled = true;
  } else {
    locationLimitDetail.textContent = "Click to limit results to a region";
    locationLimitDetail.classList.add("is-link");
    locationLimitDetail.disabled = false;
  }
}

function isModalOpen(modal) {
  return modal && !modal.classList.contains("hidden");
}

function closeAllModals() {
  if (isModalOpen(vehicleModal)) {
    closeVehicleModal();
  }
  if (isModalOpen(deleteModal)) {
    closeDeleteModal();
  }
  if (isModalOpen(shortcutsModal)) {
    closeShortcutsModal();
  }
  if (isModalOpen(howToModal)) {
    closeHowToModal();
  }
  if (isModalOpen(saveInfoModal)) {
    closeSaveInfoModal();
  }
  if (isModalOpen(searchModal)) {
    closeSearchModal();
  }
  if (isModalOpen(locationModal)) {
    closeLocationModal();
  }
  if (isModalOpen(mapCardMetaModal)) {
    closeMapCardMetaModal();
  }
  if (isModalOpen(applyCardColorsModal)) {
    closeApplyCardColorsModal();
  }
  if (isModalOpen(tutorialPickerModal)) {
    closeTutorialPickerModal();
  }
  if (isModalOpen(tutorialWelcomeModal)) {
    closeTutorialWelcomeModal();
  }
  if (isModalOpen(tutorialCompleteModal)) {
    closeTutorialCompleteModal();
  }
}

function getSelectedColumnIndex() {
  const visible = getVisibleColumns();
  if (!visible.length) {
    return -1;
  }
  if (!state.selection) {
    return 0;
  }
  const index = visible.findIndex((col) => col.id === state.selection.columnId);
  return index === -1 ? 0 : index;
}

function getVisibleColumns() {
  return state.columns.filter((col) => !col.minimized);
}

function ensureNoteFullyVisible(noteEl) {
  if (!noteEl) {
    return;
  }
  const container = noteEl.closest(".observations");
  if (!container) {
    noteEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    return;
  }
  const padding = 10;
  const containerRect = container.getBoundingClientRect();
  const noteRect = noteEl.getBoundingClientRect();
  let nextScrollTop = container.scrollTop;
  const maxVisibleHeight = container.clientHeight - padding * 2;

  if (noteRect.height >= maxVisibleHeight) {
    nextScrollTop += noteRect.top - (containerRect.top + padding);
  } else if (noteRect.top < containerRect.top + padding) {
    nextScrollTop += noteRect.top - (containerRect.top + padding);
  } else if (noteRect.bottom > containerRect.bottom - padding) {
    nextScrollTop += noteRect.bottom - (containerRect.bottom - padding);
  }

  const boundedTop = Math.max(0, nextScrollTop);
  if (Math.abs(boundedTop - container.scrollTop) > 1) {
    container.scrollTo({ top: boundedTop, behavior: "smooth" });
  }
}

function focusLastNote(columnId, noteId = null) {
  const columnSelector = `[data-column-id=\"${escapeSelector(columnId)}\"]`;
  const columnEl = columnsEl.querySelector(columnSelector);
  if (!columnEl) {
    return;
  }
  const noteEls = columnEl.querySelectorAll(".observation[data-note-id]");
  if (!noteEls.length) {
    return;
  }
  let targetNoteEl = null;
  if (noteId) {
    targetNoteEl = columnEl.querySelector(`[data-note-id=\"${escapeSelector(noteId)}\"]`);
  }
  if (!targetNoteEl) {
    targetNoteEl =
      state.notesNewestFirst === false
        ? noteEls[noteEls.length - 1]
        : noteEls[0];
  }
  ensureNoteFullyVisible(targetNoteEl);
  const column = state.columns.find((col) => col.id === columnId);
  const isVehicleList = isVehicleListType(column?.type || DEFAULT_CARD_TYPE);
  if (isVehicleList) {
    const plateInput =
      targetNoteEl.querySelector(".vehicle-note-field-plate input") ||
      targetNoteEl.querySelector(".vehicle-note-grid-plate .vehicle-note-field input");
    if (plateInput && !plateInput.disabled) {
      plateInput.focus();
      return;
    }
  }
  const noteTextArea = targetNoteEl.querySelector("textarea");
  if (noteTextArea && !noteTextArea.disabled) {
    noteTextArea.focus();
  }
}

function setTimeZone(value) {
  state.timezone = normalizeTimeZone(value);
  state.dispatchVisited = true;
  persistState();
  if (timezoneDropdown) {
    timezoneDropdown.setValue(state.timezone, `Custom (${state.timezone})`);
  }
  updateTimezoneLink();
  syncShiftUI();
  renderColumns();
  renderDefaultCardTypeSelect();
  renderDefaultCardColorSettings();
  updateSummary();
  applyViewMode();
  updateCityUI();
  syncMapFilterControls();
  updateTimezoneTime();
  if (!timezoneTimer) {
    timezoneTimer = setInterval(updateTimezoneTime, 60 * 1000);
  }
  updateTimezoneTime();
}

function serializeState() {
  return JSON.stringify({
    startTime: state.startTime ? state.startTime.toISOString() : null,
    endTime: state.endTime ? state.endTime.toISOString() : null,
    endAdjustedNote: state.endAdjustedNote,
    area: state.area,
    timezone: state.timezone,
    viewMode: state.viewMode,
    mapSettings: {
      city: serializeLocation(state.mapSettings.city),
      centerLocation: serializeLocation(state.mapSettings.centerLocation),
      radiusMiles: state.mapSettings.radiusMiles,
      style: state.mapSettings.style,
    },
    mapFilters: {
      showMinimized:
        state.mapFilters?.showMinimized === undefined
          ? DEFAULT_MAP_FILTER_SHOW_MINIMIZED
          : Boolean(state.mapFilters.showMinimized),
      labelTimes:
        state.mapFilters?.labelTimes === undefined
          ? true
          : Boolean(state.mapFilters.labelTimes),
      recencyMode: normalizeMapRecencyMode(state.mapFilters?.recencyMode),
      noteReportableOnly: Boolean(state.mapFilters?.noteReportableOnly),
      inactiveLabelOpacity: normalizeMapInactiveLabelOpacity(
        state.mapFilters?.inactiveLabelOpacity
      ),
      types: normalizeMapTypeFilters(state.mapFilters?.types),
    },
    notesNewestFirst: state.notesNewestFirst !== false,
    summaryInclude: state.summaryInclude,
    summarySort: state.summarySort,
    summaryMostRecentFirst: Boolean(state.summaryMostRecentFirst),
    summaryKnownTypes: state.summaryKnownTypes,
    summaryReportableOnly: state.summaryReportableOnly,
    summaryIncludeLocation: state.summaryIncludeLocation,
    summaryLocationIncludeAddress: state.summaryLocationIncludeAddress !== false,
    summaryLocationIncludeLatLon: Boolean(state.summaryLocationIncludeLatLon),
    summaryIncludeEmojis: state.summaryIncludeEmojis,
    summarySanitizeNames: state.summarySanitizeNames,
    summaryBulletsForNotes: Boolean(state.summaryBulletsForNotes),
    summarySpaceBetweenNotes: Boolean(state.summarySpaceBetweenNotes),
    summaryTime24: state.summaryTime24,
    summaryGroupFields: state.summaryGroupFields,
    summaryDefaultExclude: state.summaryDefaultExclude,
    availableCardTypes: normalizeAvailableCardTypes(state.availableCardTypes),
    defaultNewCardType: state.defaultNewCardType,
    cardColorDefaults: normalizeCardColorDefaults(state.cardColorDefaults),
    columns: state.columns.map((column) => ({
      id: column.id,
      type: normalizeCardType(column.type),
      minimized: column.minimized,
      color: column.color,
      label: column.label,
      labelAuto: column.labelAuto,
      reportAll: Boolean(column.reportAll),
      createdAt: column.createdAt,
      vehicleProfile: column.vehicleProfile ? normalizeVehicleInfo(column.vehicleProfile) : null,
      location: serializeLocation(column.location),
      observations: column.observations.map((obs) => ({
        id: obs.id,
        timestamp: obs.timestamp.toISOString(),
        timestampText: obs.timestampText,
        originalTimestampText: obs.originalTimestampText,
        createdAt: obs.createdAt,
        editedFrom: obs.editedFrom,
        text: obs.text,
        reportable: Boolean(obs.reportable),
        location: serializeLocation(obs.location),
        vehicleInfo: obs.vehicleInfo ? normalizeVehicleInfo(obs.vehicleInfo) : null,
      })),
    })),
  });
}

function serializeLocation(location) {
  if (!location) {
    return null;
  }
  return {
    label: location.label || "",
    displayLabel: location.displayLabel || location.label || "",
    addressLabel: location.addressLabel || "",
    lat: location.lat,
    lon: location.lon,
    source: location.source || "manual",
    updatedAt: location.updatedAt || Date.now(),
  };
}

function loadState(raw) {
  try {
    const data = JSON.parse(raw);
    const isLegacyVehicleSchema = data.availableCardTypes === undefined;
    const typeCounts = {};
    state.startTime = data.startTime ? new Date(data.startTime) : null;
    state.endTime = data.endTime ? new Date(data.endTime) : null;
    state.endAdjustedNote = data.endAdjustedNote || "";
    state.area = data.area || "";
    state.timezone = normalizeTimeZone(data.timezone || DEFAULT_TIMEZONE);
    state.notesNewestFirst =
      data.notesNewestFirst === undefined
        ? DEFAULT_NOTES_NEWEST_FIRST
        : Boolean(data.notesNewestFirst);
    state.summaryInclude = Array.isArray(data.summaryInclude)
      ? Array.from(new Set(data.summaryInclude.map(normalizeCardType)))
      : null;
    state.summarySort = SUMMARY_SORT_OPTIONS.has(data.summarySort)
      ? data.summarySort
      : DEFAULT_SUMMARY_SORT;
    state.summaryMostRecentFirst = Boolean(data.summaryMostRecentFirst);
    state.summaryKnownTypes = Array.isArray(data.summaryKnownTypes)
      ? Array.from(new Set(data.summaryKnownTypes.map(normalizeCardType)))
      : null;
    state.summaryReportableOnly = Boolean(data.summaryReportableOnly);
    state.summaryIncludeLocation =
      data.summaryIncludeLocation === undefined
        ? DEFAULT_SUMMARY_INCLUDE_LOCATION
        : Boolean(data.summaryIncludeLocation);
    state.summaryLocationIncludeAddress =
      data.summaryLocationIncludeAddress === undefined
        ? DEFAULT_SUMMARY_INCLUDE_LOCATION_ADDRESS
        : Boolean(data.summaryLocationIncludeAddress);
    state.summaryLocationIncludeLatLon =
      data.summaryLocationIncludeLatLon === undefined
        ? DEFAULT_SUMMARY_INCLUDE_LOCATION_LAT_LON
        : Boolean(data.summaryLocationIncludeLatLon);
    state.summaryIncludeEmojis =
      data.summaryIncludeEmojis === undefined
        ? DEFAULT_SUMMARY_INCLUDE_EMOJIS
        : Boolean(data.summaryIncludeEmojis);
    state.summarySanitizeNames =
      data.summarySanitizeNames === undefined
        ? DEFAULT_SUMMARY_SANITIZE_NAMES
        : Boolean(data.summarySanitizeNames);
    state.summaryBulletsForNotes =
      data.summaryBulletsForNotes === undefined
        ? DEFAULT_SUMMARY_BULLETS_FOR_NOTES
        : Boolean(data.summaryBulletsForNotes);
    state.summarySpaceBetweenNotes =
      data.summarySpaceBetweenNotes === undefined
        ? DEFAULT_SUMMARY_SPACE_BETWEEN_NOTES
        : Boolean(data.summarySpaceBetweenNotes);
    state.summaryTime24 =
      data.summaryTime24 === undefined ? DEFAULT_SUMMARY_TIME_24 : Boolean(data.summaryTime24);
    state.summaryGroupFields =
      data.summaryGroupFields === undefined
        ? DEFAULT_SUMMARY_GROUP_FIELDS
        : Boolean(data.summaryGroupFields);
    state.summaryDefaultExclude = Array.isArray(data.summaryDefaultExclude)
      ? Array.from(new Set(data.summaryDefaultExclude.map(normalizeCardType)))
      : Array.from(DEFAULT_SUMMARY_EXCLUDE);
    state.availableCardTypes = normalizeAvailableCardTypes(data.availableCardTypes);
    if (
      Array.isArray(data.availableCardTypes) &&
      data.availableCardTypes.includes(VEHICLE_LIST_CARD_TYPE) &&
      !data.availableCardTypes.includes(VEHICLE_CARD_TYPE) &&
      !state.availableCardTypes.includes(VEHICLE_CARD_TYPE)
    ) {
      state.availableCardTypes.push(VEHICLE_CARD_TYPE);
    }
    state.defaultNewCardType =
      data.defaultNewCardType && data.defaultNewCardType !== "last"
        ? normalizeCardType(data.defaultNewCardType)
        : DEFAULT_NEW_CARD_TYPE;
    if (
      state.defaultNewCardType &&
      state.defaultNewCardType !== "last" &&
      !normalizeAvailableCardTypes(data.availableCardTypes).includes(state.defaultNewCardType)
    ) {
      state.defaultNewCardType = "last";
    }
    state.cardColorDefaults = normalizeCardColorDefaults(data.cardColorDefaults);
    const isLegacyColorModel = !data.cardColorDefaults || !data.cardColorDefaults.palette;
    state.viewMode = ["notes", "split", "map"].includes(data.viewMode)
      ? data.viewMode
      : "notes";
    state.mapSettings = hydrateMapSettings(data.mapSettings);
    state.mapFilters = {
      showMinimized:
        data.mapFilters?.showMinimized === undefined
          ? data.mapFilters?.hideMinimized === undefined
            ? DEFAULT_MAP_FILTER_SHOW_MINIMIZED
            : !Boolean(data.mapFilters.hideMinimized)
          : Boolean(data.mapFilters.showMinimized),
      labelTimes:
        data.mapFilters?.labelTimes === undefined
          ? DEFAULT_MAP_FILTER_LABEL_TIMES
          : Boolean(data.mapFilters.labelTimes),
      recencyMode:
        data.mapFilters?.recencyMode === undefined
          ? DEFAULT_MAP_FILTER_RECENCY_MODE
          : normalizeMapRecencyMode(data.mapFilters.recencyMode),
      noteReportableOnly:
        data.mapFilters?.noteReportableOnly === undefined
          ? DEFAULT_MAP_FILTER_NOTE_REPORTABLE_ONLY
          : Boolean(data.mapFilters.noteReportableOnly),
      inactiveLabelOpacity:
        data.mapFilters?.inactiveLabelOpacity === undefined
          ? DEFAULT_MAP_FILTER_INACTIVE_LABEL_OPACITY
          : normalizeMapInactiveLabelOpacity(data.mapFilters.inactiveLabelOpacity),
      types: normalizeMapTypeFilters(data.mapFilters?.types),
    };
    state.columns = (data.columns || []).map((column, index) => {
      let type = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
      if (isLegacyVehicleSchema && type === VEHICLE_CARD_TYPE) {
        type = VEHICLE_LIST_CARD_TYPE;
      }
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      const label =
        column.label == null
          ? isVehicleCardType(type)
            ? ""
            : String(typeCounts[type])
          : String(column.label);
      const createdAt =
        typeof column.createdAt === "number"
          ? column.createdAt
          : Date.now() + index;
      return {
        id: column.id || createId(),
        type,
        minimized: Boolean(column.minimized),
        color: Number.isInteger(column.color)
          ? normalizeLoadedColorIndex(column.color, isLegacyColorModel)
          : PALETTE_COLOR_INDICES[index % PALETTE_COLOR_INDICES.length],
        label,
        labelAuto: column.labelAuto ?? column.label == null,
        reportAll: Boolean(column.reportAll),
        createdAt,
        vehicleProfile: isVehicleCardType(type)
          ? normalizeVehicleInfo(column.vehicleProfile || {})
          : null,
        location: loadLocation(column.location),
        observations: (column.observations || []).map((obs) => {
          let timestamp = new Date(obs.timestamp);
          let timestampValue = timestamp.getTime();
          if (!Number.isFinite(timestampValue)) {
            const parsedFromText = parseShiftTimestamp(obs.timestampText || "");
            if (parsedFromText) {
              timestamp = parsedFromText;
              timestampValue = parsedFromText.getTime();
            } else if (typeof obs.createdAt === "number" && Number.isFinite(obs.createdAt)) {
              timestamp = new Date(obs.createdAt);
              timestampValue = timestamp.getTime();
            } else {
              timestamp = new Date();
              timestampValue = timestamp.getTime();
            }
          }
          return {
            id: obs.id || createId(),
            timestamp,
            timestampText: obs.timestampText || formatTimeOnly(timestamp),
            originalTimestampText: obs.originalTimestampText || obs.timestampText,
            createdAt:
              typeof obs.createdAt === "number"
                ? obs.createdAt
                : Number.isFinite(timestampValue)
                  ? timestampValue
                  : Date.now(),
            editedFrom: obs.editedFrom || "",
            text: obs.text || "",
            reportable: Boolean(obs.reportable),
            location: loadLocation(obs.location),
            vehicleInfo: obs.vehicleInfo
              ? normalizeVehicleInfo(obs.vehicleInfo)
              : isVehicleListType(type)
                ? normalizeVehicleInfo(parseVehicleInfoFromText(obs.text))
                : null,
          };
        }),
      };
    });
  } catch (error) {
    createDefaultColumns();
  }
}

function hydrateMapSettings(raw) {
  const fallback = {
    city: null,
    centerLocation: null,
    radiusMiles: DEFAULT_MAP_RADIUS_MILES,
    style: DEFAULT_MAP_STYLE,
  };
  if (!raw || typeof raw !== "object") {
    return fallback;
  }
  const radius = Number(raw.radiusMiles);
  const style = raw.style ? String(raw.style) : DEFAULT_MAP_STYLE;
  return {
    city: loadLocation(raw.city),
    centerLocation: loadLocation(raw.centerLocation),
    radiusMiles: Number.isFinite(radius) && radius > 0 ? radius : DEFAULT_MAP_RADIUS_MILES,
    style,
  };
}

function persistMapSettings() {
  try {
    const payload = JSON.stringify({
      city: serializeLocation(state.mapSettings.city),
      centerLocation: serializeLocation(state.mapSettings.centerLocation),
      radiusMiles: state.mapSettings.radiusMiles,
      style: state.mapSettings.style,
    });
    localStorage.setItem(MAP_SETTINGS_KEY, payload);
  } catch (error) {
    return;
  }
}

function loadMapSettingsFromStorage() {
  try {
    const raw = localStorage.getItem(MAP_SETTINGS_KEY);
    if (!raw) {
      return null;
    }
    return hydrateMapSettings(JSON.parse(raw));
  } catch (error) {
    return null;
  }
}

function loadLocation(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const lat = Number(raw.lat);
  const lon = Number(raw.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }
  return {
    label: String(raw.label || raw.displayLabel || ""),
    displayLabel: String(raw.displayLabel || raw.label || ""),
    addressLabel: String(raw.addressLabel || ""),
    lat,
    lon,
    source: raw.source || "manual",
    updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : Date.now(),
  };
}

function getCardTypeMeta(type) {
  return CARD_TYPES.find((item) => item.value === type) || CARD_TYPES[0];
}

function getCardTypeOptionsUnique() {
  const options = [];
  const seen = new Set();
  CARD_TYPES.forEach((item) => {
    const normalized = normalizeCardType(item.value);
    if (seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    let label = item.label;
    if (normalized === OBSERVER_BIKE_TYPE) {
      label = "Observer Bike";
    } else if (normalized === OBSERVER_CAR_TYPE) {
      label = "Observer Car";
    } else if (normalized === OBSERVER_CARD_TYPE) {
      label = "Observer";
    } else if (normalized === VEHICLE_LIST_CARD_TYPE) {
      label = "Vehicle List";
    } else if (normalized === VEHICLE_CARD_TYPE) {
      label = "Vehicle";
    }
    options.push({
      value: normalized,
      label,
      icon: item.icon,
    });
  });
  const priority = new Map([
    ["Incident", 0],
    [OBSERVER_CARD_TYPE, 1],
    [OBSERVER_BIKE_TYPE, 2],
    [OBSERVER_CAR_TYPE, 3],
    [VEHICLE_CARD_TYPE, 4],
    [VEHICLE_LIST_CARD_TYPE, 5],
  ]);
  options.sort((a, b) => {
    const pa = priority.has(a.value) ? priority.get(a.value) : 100;
    const pb = priority.has(b.value) ? priority.get(b.value) : 100;
    if (pa !== pb) {
      return pa - pb;
    }
    return a.label.localeCompare(b.label);
  });
  return options;
}

function normalizeAvailableCardTypes(values) {
  const valid = new Set(getCardTypeOptionsUnique().map((item) => normalizeCardType(item.value)));
  const fromInput = Array.isArray(values) ? values : Array.from(valid);
  const next = Array.from(
    new Set(fromInput.map((item) => normalizeCardType(item)).filter((item) => valid.has(item)))
  );
  if (!next.length) {
    return Array.from(valid);
  }
  return next;
}

function getAvailableCardTypeSet() {
  state.availableCardTypes = normalizeAvailableCardTypes(state.availableCardTypes);
  return new Set(state.availableCardTypes);
}

function isCardTypeAvailable(type) {
  return getAvailableCardTypeSet().has(normalizeCardType(type));
}

function getSelectableCardTypes(includeType = null) {
  const includeNormalized = includeType ? normalizeCardType(includeType) : null;
  const available = getAvailableCardTypeSet();
  return getCardTypeOptionsUnique().filter((item) => {
    const normalized = normalizeCardType(item.value);
    return available.has(normalized) || normalized === includeNormalized;
  });
}

function normalizeCardType(type) {
  if (!type) {
    return DEFAULT_CARD_TYPE;
  }
  if (type === "Person") {
    return OBSERVER_CARD_TYPE;
  }
  return type;
}

function isObserverType(type) {
  const normalized = normalizeCardType(type);
  return (
    normalized === OBSERVER_CARD_TYPE ||
    normalized === OBSERVER_BIKE_TYPE ||
    normalized === OBSERVER_CAR_TYPE
  );
}

function isVehicleListType(type) {
  return normalizeCardType(type) === VEHICLE_LIST_CARD_TYPE;
}

function isVehicleCardType(type) {
  return normalizeCardType(type) === VEHICLE_CARD_TYPE;
}

function buildCardTypeDataLossWarning(column, nextType) {
  if (!column) {
    return "";
  }
  const oldType = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
  const resolvedNextType = normalizeCardType(nextType || oldType);
  if (oldType === resolvedNextType) {
    return "";
  }
  const losses = [];
  if (isVehicleListType(oldType) && !isVehicleListType(resolvedNextType)) {
    const noteCount = Array.isArray(column.observations) ? column.observations.length : 0;
    if (noteCount > 0) {
      losses.push("Vehicle Info fields on notes");
    }
  }
  if (isVehicleCardType(oldType) && !isVehicleCardType(resolvedNextType)) {
    if (hasVehicleInfo(column.vehicleProfile || {})) {
      losses.push("Vehicle header info");
    }
  }
  if (!losses.length) {
    return "";
  }
  const oldLabel = getCardTypeMeta(oldType).label;
  const nextLabel = getCardTypeMeta(resolvedNextType).label;
  return (
    `Switching card type from "${oldLabel}" to "${nextLabel}" will remove ` +
    `${losses.join(" and ")}. Continue?`
  );
}

function confirmCardTypeChange(column, nextType) {
  const warning = buildCardTypeDataLossWarning(column, nextType);
  if (!warning) {
    return true;
  }
  return window.confirm(warning);
}

function getDefaultVehicleProfileForType(type) {
  return isVehicleCardType(type) ? createEmptyVehicleInfo() : null;
}

function getDefaultMapTypeFilters() {
  const filters = {};
  CARD_TYPES.forEach((card) => {
    filters[normalizeCardType(card.value)] = true;
  });
  return filters;
}

function normalizeMapTypeFilters(raw) {
  const defaults = getDefaultMapTypeFilters();
  const normalized = {};
  Object.keys(defaults).forEach((key) => {
    if (raw && raw[key] !== undefined) {
      normalized[key] = Boolean(raw[key]);
      return;
    }
    if (raw && key === VEHICLE_LIST_CARD_TYPE && raw.Vehicle !== undefined) {
      normalized[key] = Boolean(raw.Vehicle);
      return;
    }
    normalized[key] = true;
  });
  return normalized;
}

function normalizeMapRecencyMode(value) {
  return value === "mostRecent" ? "mostRecent" : "all";
}

function normalizeMapInactiveLabelOpacity(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_MAP_FILTER_INACTIVE_LABEL_OPACITY;
  }
  return Math.min(1, Math.max(0.25, numeric));
}

function getCardDisplay(type, label) {
  const meta = getCardTypeMeta(normalizeCardType(type));
  const labelText = (label || "").trim();
  const displayText = labelText ? `${meta.label} ${labelText}` : meta.label;
  return displayText;
}

function getPillLabel(type, label) {
  const display = getCardDisplay(type, label);
  if (display.length <= MAX_PILL_LABEL) {
    return display;
  }
  return `${display.slice(0, MAX_PILL_LABEL - 3)}...`;
}

function getMinimizedPillLabel(column) {
  const type = column.type || DEFAULT_CARD_TYPE;
  if (isVehicleCardType(type)) {
    const vehicleName = formatVehicleInfoForSummary(normalizeVehicleInfo(column.vehicleProfile || {}));
    if (vehicleName) {
      return vehicleName.length <= MAX_PILL_LABEL
        ? vehicleName
        : `${vehicleName.slice(0, MAX_PILL_LABEL - 3)}...`;
    }
  }
  const meta = getCardTypeMeta(type);
  const labelText = (column.label || "").trim();
  const useCustom = labelText && !column.labelAuto;
  const baseText = useCustom ? labelText : `${meta.label} ${labelText || ""}`.trim();
  const display = baseText.trim();
  if (display.length <= MAX_PILL_LABEL) {
    return display;
  }
  return `${display.slice(0, MAX_PILL_LABEL - 3)}...`;
}

function getNextCustomLabel(type, counts) {
  if (isVehicleCardType(type)) {
    return "";
  }
  const tracker = counts || null;
  if (tracker) {
    tracker[type] = (tracker[type] || 0) + 1;
    return String(tracker[type]);
  }
  const count = state.columns.filter((column) => column.type === type).length;
  return String(count + 1);
}

function getNextCustomLabelForType(type, excludeId) {
  if (isVehicleCardType(type)) {
    return "";
  }
  const count = state.columns.filter(
    (column) => column.type === type && column.id !== excludeId
  ).length;
  return String(count + 1);
}

function normalizeCardColorDefaults(raw) {
  const mode = [
    "cycle",
    "color-by-type",
    "manual",
    "all-grey",
  ].includes(raw?.mode)
    ? raw.mode
    : "cycle";
  const palette = getCardPaletteById(raw?.palette)?.id || DEFAULT_CARD_COLOR_PALETTE;
  const byType = {};
  const defaults = getDefaultMapTypeFilters();
  Object.keys(defaults).forEach((type) => {
    const next = Number(raw?.byType?.[type]);
    byType[type] = ACTIVE_COLUMN_COLOR_INDICES.includes(next)
      ? next
      : PALETTE_COLOR_INDICES[0];
  });
  return { mode, palette, byType };
}

function isNotesCardType(type) {
  return normalizeCardType(type) === "Notes";
}

function isCustomCardType(type) {
  return normalizeCardType(type) === "Custom";
}

function getCardPaletteById(id) {
  return CARD_COLOR_PALETTES.find((palette) => palette.id === id) || CARD_COLOR_PALETTES[0];
}

function getActivePalette() {
  return getCardPaletteById(state.cardColorDefaults?.palette || DEFAULT_CARD_COLOR_PALETTE);
}

function getColorHexByIndex(colorIndex) {
  if (colorIndex === CHARCOAL_COLOR_INDEX) {
    return CHARCOAL_COLOR_HEX;
  }
  if (colorIndex === GREY_COLOR_INDEX) {
    return GREY_COLOR_HEX;
  }
  if (colorIndex === OFFWHITE_COLOR_INDEX) {
    return OFFWHITE_COLOR_HEX;
  }
  const colors = getActivePalette().colors || [];
  const safeIndex = Number(colorIndex);
  if (Number.isInteger(safeIndex) && safeIndex >= 0 && safeIndex < colors.length) {
    return colors[safeIndex];
  }
  return colors[0] || GREY_COLOR_HEX;
}

function getColorRgbString(hex) {
  const cleaned = String(hex || "").replace("#", "");
  if (cleaned.length !== 6) {
    return "124, 135, 151";
  }
  const value = Number.parseInt(cleaned, 16);
  if (!Number.isFinite(value)) {
    return "124, 135, 151";
  }
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `${r}, ${g}, ${b}`;
}

function mixWithWhite(hex, amount = 0.86) {
  const rgb = getColorRgbString(hex).split(",").map((v) => Number(v.trim()));
  if (rgb.length !== 3 || rgb.some((v) => !Number.isFinite(v))) {
    return "#f1f4f7";
  }
  const mixed = rgb.map((v) => Math.round(v * (1 - amount) + 255 * amount));
  return `#${mixed.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function darkenHex(hex, amount = 0.2) {
  const rgb = getColorRgbString(hex).split(",").map((v) => Number(v.trim()));
  if (rgb.length !== 3 || rgb.some((v) => !Number.isFinite(v))) {
    return "#5d6570";
  }
  const darkened = rgb.map((v) => Math.round(v * (1 - amount)));
  return `#${darkened.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function applyDynamicCardColorStyles() {
  const paletteId = getActivePalette().id || DEFAULT_CARD_COLOR_PALETTE;
  document.documentElement.setAttribute("data-card-palette", paletteId);
}

function getCardTypePresetColorMap(mode) {
  const mapping = {};
  const groupList = getCardColorSettingGroups();
  if (mode === "all-grey") {
    groupList.forEach((group) => {
      group.types.forEach((type) => {
        mapping[type] = GREY_COLOR_INDEX;
      });
    });
    return mapping;
  }
  const standardGroups = groupList.filter(
    (group) => !group.types.some((type) => isNotesCardType(type) || isCustomCardType(type))
  );
  const paletteOrder = PALETTE_COLOR_INDICES.slice();
  standardGroups.forEach((group, index) => {
    const nextColor = paletteOrder[index % paletteOrder.length];
    group.types.forEach((type) => {
      mapping[type] = nextColor;
    });
  });
  groupList.forEach((group) => {
    group.types.forEach((type) => {
      if (isNotesCardType(type)) {
        mapping[type] = CHARCOAL_COLOR_INDEX;
      } else if (isCustomCardType(type)) {
        mapping[type] = OFFWHITE_COLOR_INDEX;
      } else if (!ACTIVE_COLUMN_COLOR_INDICES.includes(Number(mapping[type]))) {
        mapping[type] = PALETTE_COLOR_INDICES[0];
      }
    });
  });
  return mapping;
}

function getEffectiveCardTypeColorMap() {
  const defaults = normalizeCardColorDefaults(state.cardColorDefaults);
  if (defaults.mode === "manual") {
    return { ...defaults.byType };
  }
  if (defaults.mode === "color-by-type" || defaults.mode === "all-grey") {
    return getCardTypePresetColorMap(defaults.mode);
  }
  return getCardTypePresetColorMap("color-by-type");
}

function setCardColorMode(mode) {
  const nextMode = String(mode || "cycle");
  const defaults = normalizeCardColorDefaults(state.cardColorDefaults);
  defaults.mode = ["cycle", "color-by-type", "manual", "all-grey"].includes(nextMode)
    ? nextMode
    : "cycle";
  if (defaults.mode === "color-by-type" || defaults.mode === "all-grey") {
    defaults.byType = getCardTypePresetColorMap(defaults.mode);
  }
  state.cardColorDefaults = defaults;
  applyDynamicCardColorStyles();
}

function getColorByModeForColumn(column, index) {
  const mode = state.cardColorDefaults?.mode || "cycle";
  if (mode === "cycle") {
    return PALETTE_COLOR_INDICES[index % PALETTE_COLOR_INDICES.length];
  }
  const mapping = getEffectiveCardTypeColorMap();
  const type = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
  return normalizeColorIndex(mapping[type]);
}

function applyCardColorsToAllColumns() {
  const mode = state.cardColorDefaults?.mode || "cycle";
  if (mode === "cycle") {
    const columnsByCreated = state.columns
      .map((column, index) => ({ column, index }))
      .sort((a, b) => {
        const aCreated = Number.isFinite(a.column?.createdAt) ? a.column.createdAt : Number.POSITIVE_INFINITY;
        const bCreated = Number.isFinite(b.column?.createdAt) ? b.column.createdAt : Number.POSITIVE_INFINITY;
        if (aCreated !== bCreated) {
          return aCreated - bCreated;
        }
        return a.index - b.index;
      });
    columnsByCreated.forEach((entry, orderIndex) => {
      entry.column.color = PALETTE_COLOR_INDICES[orderIndex % PALETTE_COLOR_INDICES.length];
    });
  } else {
    state.columns.forEach((column, index) => {
      column.color = getColorByModeForColumn(column, index);
    });
  }
  markDirty();
  renderColumns();
  persistState();
  updateSummary();
}

function getColorNameByIndex(colorIndex) {
  if (colorIndex === CHARCOAL_COLOR_INDEX) {
    return "Charcoal";
  }
  if (colorIndex === GREY_COLOR_INDEX) {
    return "Grey";
  }
  if (colorIndex === OFFWHITE_COLOR_INDEX) {
    return "Off-white";
  }
  const normalizedIndex = Number(colorIndex);
  if (PALETTE_COLOR_INDICES.includes(normalizedIndex)) {
    const activePalette = getActivePalette();
    const friendly = activePalette?.colorNames?.[normalizedIndex];
    if (friendly) {
      return friendly;
    }
    return `Color ${normalizedIndex + 1}`;
  }
  return `Color ${String(colorIndex)}`;
}

function normalizeColorIndex(colorIndex) {
  const next = Number(colorIndex);
  if (ACTIVE_COLUMN_COLOR_INDICES.includes(next)) {
    return next;
  }
  return PALETTE_COLOR_INDICES[0];
}

function normalizeLoadedColorIndex(colorIndex, isLegacyModel = false) {
  const next = Number(colorIndex);
  if (isLegacyModel && next === 6) {
    return GREY_COLOR_INDEX;
  }
  return normalizeColorIndex(next);
}

function getNextColumnColor() {
  const nextIndex = state.columns.length % PALETTE_COLOR_INDICES.length;
  return PALETTE_COLOR_INDICES[nextIndex];
}

function getDefaultColorForCardType(type) {
  const normalized = normalizeCardType(type || DEFAULT_CARD_TYPE);
  const defaults = normalizeCardColorDefaults(state.cardColorDefaults);
  state.cardColorDefaults = defaults;
  if (defaults.mode === "cycle") {
    return getNextColumnColor();
  }
  const mapping = getEffectiveCardTypeColorMap();
  return normalizeColorIndex(mapping[normalized]);
}

function getNextActiveColor(current) {
  const index = ACTIVE_COLUMN_COLOR_INDICES.indexOf(current);
  if (index === -1) {
    return ACTIVE_COLUMN_COLOR_INDICES[0];
  }
  return ACTIVE_COLUMN_COLOR_INDICES[(index + 1) % ACTIVE_COLUMN_COLOR_INDICES.length];
}

function getObservationTimestampValue(obs) {
  let value = 0;
  if (obs.timestamp instanceof Date) {
    value = obs.timestamp.getTime();
  } else if (obs.timestamp) {
    value = new Date(obs.timestamp).getTime();
  }
  if (Number.isFinite(value)) {
    return value;
  }
  const timestampText = String(obs.timestampText || "").trim();
  const hasExplicitDate = /\d{1,2}\/\d{1,2}/.test(timestampText);
  if (hasExplicitDate) {
    const parsedFromText = parseShiftTimestamp(timestampText);
    if (parsedFromText) {
      return parsedFromText.getTime();
    }
  }
  if (typeof obs.createdAt === "number" && Number.isFinite(obs.createdAt)) {
    return obs.createdAt;
  }
  return 0;
}

function compareMapItemsByAge(a, b) {
  const aTimestamp = Number.isFinite(a?.sortTimestamp) ? a.sortTimestamp : 0;
  const bTimestamp = Number.isFinite(b?.sortTimestamp) ? b.sortTimestamp : 0;
  if (aTimestamp !== bTimestamp) {
    return aTimestamp - bTimestamp;
  }
  const aCreated = Number.isFinite(a?.sortCreatedAt) ? a.sortCreatedAt : 0;
  const bCreated = Number.isFinite(b?.sortCreatedAt) ? b.sortCreatedAt : 0;
  if (aCreated !== bCreated) {
    return aCreated - bCreated;
  }
  if (a.kind !== b.kind) {
    return a.kind === "card" ? 1 : -1;
  }
  return String(a?.sortId || a?.key || "").localeCompare(String(b?.sortId || b?.key || ""));
}

function formatLocationLabel(label) {
  return String(label || "")
    .replace(/,\s*USA$/i, "")
    .replace(/^near\s+/i, "")
    .trim();
}

function splitLocationLines(locationText) {
  const parts = String(locationText || "").split(/\s*[,，]\s*/).filter(Boolean);
  if (parts.length >= 3) {
    const addressLine = parts.slice(0, -2).join(", ");
    const cityLine = parts.slice(-2).join(", ");
    return normalizeLocationLines(addressLine, cityLine);
  }
  if (parts.length === 2) {
    return normalizeLocationLines(parts[0], parts[1]);
  }
  return normalizeLocationLines(parts[0] || "", "");
}

function isSpecificAddressText(value) {
  const text = String(value || "").toLowerCase();
  return (
    /\d/.test(text) ||
    /\b(st|street|ave|avenue|rd|road|blvd|boulevard|ln|lane|dr|drive|way|pl|place|ct|court|ter|terrace|pkwy|parkway|hwy|highway)\b/.test(
      text
    ) ||
    /\b(&|and)\b/.test(text)
  );
}

function normalizeLocationLines(addressLine, cityLine) {
  const address = String(addressLine || "").trim();
  let city = String(cityLine || "").trim();
  if (address && city && isSpecificAddressText(address)) {
    city = city.replace(/\s+\d{5}(?:-\d{4})?$/, "").trim();
  }
  return { addressLine: address, cityLine: city };
}

function normalizeStateAbbrev(region) {
  const value = String(region || "").trim();
  if (!value) {
    return "";
  }
  if (value.length === 2) {
    return value.toUpperCase();
  }
  const lookup = {
    alabama: "AL",
    alaska: "AK",
    arizona: "AZ",
    arkansas: "AR",
    california: "CA",
    colorado: "CO",
    connecticut: "CT",
    delaware: "DE",
    florida: "FL",
    georgia: "GA",
    hawaii: "HI",
    idaho: "ID",
    illinois: "IL",
    indiana: "IN",
    iowa: "IA",
    kansas: "KS",
    kentucky: "KY",
    louisiana: "LA",
    maine: "ME",
    maryland: "MD",
    massachusetts: "MA",
    michigan: "MI",
    minnesota: "MN",
    mississippi: "MS",
    missouri: "MO",
    montana: "MT",
    nebraska: "NE",
    nevada: "NV",
    "new hampshire": "NH",
    "new jersey": "NJ",
    "new mexico": "NM",
    "new york": "NY",
    "north carolina": "NC",
    "north dakota": "ND",
    ohio: "OH",
    oklahoma: "OK",
    oregon: "OR",
    pennsylvania: "PA",
    "rhode island": "RI",
    "south carolina": "SC",
    "south dakota": "SD",
    tennessee: "TN",
    texas: "TX",
    utah: "UT",
    vermont: "VT",
    virginia: "VA",
    washington: "WA",
    "west virginia": "WV",
    wisconsin: "WI",
    wyoming: "WY",
    "district of columbia": "DC",
  };
  const key = value.toLowerCase();
  return lookup[key] || value;
}

function ensureStateAbbrev(label, region) {
  const abbrev = normalizeStateAbbrev(region);
  if (!abbrev) {
    return String(label || "").trim();
  }
  const current = String(label || "").trim();
  if (!current) {
    return abbrev;
  }
  const upper = current.toUpperCase();
  if (upper.includes(`, ${abbrev}`) || upper.endsWith(` ${abbrev}`)) {
    return current;
  }
  return `${current}, ${abbrev}`;
}

function createLocationRow(location, targetKey, target) {
  const row = document.createElement("div");
  row.className = "location-row";
  row.title = "Go to location";
  const icon = document.createElement("span");
  icon.className = "icon";
  const iconSvg = document.createElement("i");
  iconSvg.setAttribute("data-lucide", "map-pin");
  icon.appendChild(iconSvg);
  const text = document.createElement("span");
  text.textContent = formatLocationLabel(location.displayLabel || location.label);
  row.appendChild(icon);
  row.appendChild(text);
  if (target) {
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "location-clear";
    clearButton.title = "Clear location pin";
    clearButton.setAttribute("aria-label", "Clear location pin");
    clearButton.textContent = "×";
    clearButton.addEventListener("click", (event) => {
      event.stopPropagation();
      openLocationClearModal(target);
    });
    row.appendChild(clearButton);
  }
  if (targetKey) {
    row.classList.add("is-link");
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
    row.addEventListener("click", () => {
      focusMapLocation(targetKey, target);
    });
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        focusMapLocation(targetKey, target);
      }
    });
  }
  return row;
}

function createPinButton({ disabled, title, active }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pin-button";
  button.classList.toggle("active", Boolean(active));
  if (title) {
    button.title = title;
  }
  button.disabled = Boolean(disabled) || !LOCATION_TAGGING_ENABLED;
  const icon = document.createElement("i");
  icon.setAttribute(
    "data-lucide",
    active ? "map-pin-check-inside" : "map-pin-plus-inside"
  );
  button.appendChild(icon);
  return button;
}

function getLatestObservationInColumn(column) {
  if (!column || !Array.isArray(column.observations) || !column.observations.length) {
    return null;
  }
  return column.observations.reduce((latest, obs) => {
    if (!latest) {
      return obs;
    }
    const latestTime = getObservationTimestampValue(latest);
    const obsTime = getObservationTimestampValue(obs);
    if (obsTime !== latestTime) {
      return obsTime > latestTime ? obs : latest;
    }
    const latestCreated = typeof latest.createdAt === "number" ? latest.createdAt : 0;
    const obsCreated = typeof obs.createdAt === "number" ? obs.createdAt : 0;
    if (obsCreated !== latestCreated) {
      return obsCreated > latestCreated ? obs : latest;
    }
    return String(obs.id).localeCompare(String(latest.id)) > 0 ? obs : latest;
  }, null);
}

function getLatestLocationObservationInColumn(column, options = {}) {
  const reportableOnly = options.reportableOnly === true;
  if (!column || !Array.isArray(column.observations) || !column.observations.length) {
    return null;
  }
  return column.observations.reduce((latest, obs) => {
    if (!obs?.location) {
      return latest;
    }
    if (reportableOnly && !obs.reportable) {
      return latest;
    }
    if (!latest) {
      return obs;
    }
    const latestTime = getObservationTimestampValue(latest);
    const obsTime = getObservationTimestampValue(obs);
    if (obsTime !== latestTime) {
      return obsTime > latestTime ? obs : latest;
    }
    const latestCreated = typeof latest.createdAt === "number" ? latest.createdAt : 0;
    const obsCreated = typeof obs.createdAt === "number" ? obs.createdAt : 0;
    if (obsCreated !== latestCreated) {
      return obsCreated > latestCreated ? obs : latest;
    }
    return String(obs.id).localeCompare(String(latest.id)) > 0 ? obs : latest;
  }, null);
}

function activateMapLabelTarget(item) {
  if (!item || !item.columnId) {
    return;
  }
  const column = state.columns.find((col) => String(col.id) === String(item.columnId));
  if (!column) {
    return;
  }
  let selectedObsId = null;
  if (column.minimized) {
    column.minimized = false;
    column.justExpanded = true;
  }
  if (item.kind === "card") {
    const latestObs = getLatestObservationInColumn(column);
    if (latestObs) {
      selectNote(column.id, latestObs.id);
      selectedObsId = latestObs.id;
    } else {
      selectColumn(column.id);
    }
  } else if (item.kind === "note" && item.obsId) {
    selectNote(column.id, item.obsId);
    selectedObsId = item.obsId;
  } else {
    selectColumn(column.id);
  }
  setViewMode("split", { preserveMapView: true });
  renderColumns();
  applySelectionUI();
  scrollSelectionIntoView();
  requestAnimationFrame(() => {
    applySelectionUI();
    scrollSelectionIntoView();
    if (!columnsEl || !selectedObsId) {
      return;
    }
    const selector = `[data-note-id="${escapeSelector(selectedObsId)}"]`;
    const noteEl = columnsEl.querySelector(selector);
    if (noteEl) {
      noteEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
  });
}

function resolveMapFocusTarget(targetKey, target) {
  if (!target || !target.kind) {
    return { key: targetKey || null, location: null };
  }
  if (target.kind === "note") {
    const column = state.columns.find((col) => String(col.id) === String(target.columnId));
    const obs = column?.observations?.find((item) => String(item.id) === String(target.obsId));
    return {
      key: `note:${target.columnId}:${target.obsId}`,
      location: obs?.location || null,
    };
  }
  if (target.kind === "card") {
    const column = state.columns.find((col) => String(col.id) === String(target.columnId));
    if (!column) {
      return { key: targetKey || null, location: null };
    }
    if (column.location) {
      return {
        key: `card:${column.id}`,
        location: column.location,
      };
    }
    const latestObs = getLatestObservationInColumn(column);
    if (latestObs?.location) {
      return {
        key: `note:${column.id}:${latestObs.id}`,
        location: latestObs.location,
      };
    }
    return { key: `card:${column.id}`, location: null };
  }
  return { key: targetKey || null, location: null };
}

function restoreStyleProperty(style, property, value, priority = "") {
  if (!style) {
    return;
  }
  if (value === "" || value == null) {
    style.removeProperty(property);
    return;
  }
  style.setProperty(property, value, priority || "");
}

function clearFocusedMapMarker() {
  if (!mapFocusedState) {
    return;
  }
  const {
    marker,
    pane,
    tooltipPane,
    tooltipEl,
    previousPaneZ,
    previousPanePriority,
    previousTooltipPaneZ,
    previousTooltipPanePriority,
    previousTooltipZ,
    previousTooltipPriority,
    previousOffset,
  } = mapFocusedState;
  if (marker?._focusPulseTimer) {
    window.clearTimeout(marker._focusPulseTimer);
    marker._focusPulseTimer = null;
  }
  const markerEl = marker?.getElement?.();
  const dotEl = markerEl?.querySelector(".map-pin-dot");
  markerEl?.classList.remove("is-focus-target", "is-focus-pulse");
  dotEl?.classList.remove("is-focus-target", "is-focus-pulse");
  tooltipEl?.classList.remove("is-focus-target", "is-focus-pulse", "is-expanded");
  restoreStyleProperty(pane?.style, "z-index", previousPaneZ, previousPanePriority);
  restoreStyleProperty(
    tooltipPane?.style,
    "z-index",
    previousTooltipPaneZ,
    previousTooltipPanePriority
  );
  restoreStyleProperty(tooltipEl?.style, "z-index", previousTooltipZ, previousTooltipPriority);
  if (marker && Number.isFinite(previousOffset)) {
    marker.setZIndexOffset(previousOffset);
  }
  mapFocusedMarker = null;
  mapFocusedState = null;
}

function setFocusedMapMarker(marker, attempt = 0) {
  const markerEl = marker?.getElement?.();
  if (!markerEl) {
    if (attempt < 6) {
      requestAnimationFrame(() => setFocusedMapMarker(marker, attempt + 1));
    }
    return;
  }
  if (mapFocusedMarker === marker && mapFocusedState) {
    return;
  }
  clearFocusedMapMarker();
  const dotEl = markerEl.querySelector(".map-pin-dot");
  const paneName = marker.options?.pane;
  const pane = paneName && mainMap ? mainMap.getPane(paneName) : null;
  const tooltipEl = marker.getTooltip?.()?.getElement?.() || null;
  const tooltipPane = tooltipEl?.closest(".leaflet-pane") || null;
  const previousPaneZ = pane ? pane.style.getPropertyValue("z-index") : "";
  const previousPanePriority = pane ? pane.style.getPropertyPriority("z-index") : "";
  const previousTooltipPaneZ = tooltipPane
    ? tooltipPane.style.getPropertyValue("z-index")
    : "";
  const previousTooltipPanePriority = tooltipPane
    ? tooltipPane.style.getPropertyPriority("z-index")
    : "";
  const previousTooltipZ = tooltipEl ? tooltipEl.style.getPropertyValue("z-index") : "";
  const previousTooltipPriority = tooltipEl
    ? tooltipEl.style.getPropertyPriority("z-index")
    : "";
  const previousOffset = Number.isFinite(marker.options?.zIndexOffset)
    ? marker.options.zIndexOffset
    : 0;

  markerEl.classList.add("is-focus-target");
  dotEl?.classList.add("is-focus-target");

  if (pane) {
    pane.style.setProperty("z-index", String(MAP_PIN_FOCUS_ZINDEX), "important");
  }
  if (tooltipPane) {
    tooltipPane.style.setProperty("z-index", String(MAP_PIN_FOCUS_ZINDEX), "important");
  }
  marker.setZIndexOffset(MAP_PIN_FOCUS_ZINDEX);
  if (typeof marker.bringToFront === "function") {
    marker.bringToFront();
  }
  if (tooltipEl) {
    tooltipEl.classList.add("is-focus-target");
    tooltipEl.classList.add("is-expanded");
    tooltipEl.style.setProperty("z-index", String(MAP_PIN_FOCUS_ZINDEX), "important");
  }

  mapFocusedMarker = marker;
  mapFocusedState = {
    marker,
    pane,
    tooltipPane,
    tooltipEl,
    previousPaneZ,
    previousPanePriority,
    previousTooltipPaneZ,
    previousTooltipPanePriority,
    previousTooltipZ,
    previousTooltipPriority,
    previousOffset,
  };
}

function pulseMapMarker(marker, attempt = 0) {
  const markerEl = marker?.getElement?.();
  if (!markerEl) {
    if (attempt < 6) {
      requestAnimationFrame(() => pulseMapMarker(marker, attempt + 1));
    }
    return;
  }
  const dotEl = markerEl.querySelector(".map-pin-dot");
  markerEl.classList.remove("is-focus-pulse");
  dotEl?.classList.remove("is-focus-pulse");
  void markerEl.offsetWidth;
  markerEl.classList.add("is-focus-pulse");
  dotEl?.classList.add("is-focus-pulse");
  if (dotEl?.animate) {
    const focusRgb = window
      .getComputedStyle(dotEl)
      .getPropertyValue("--focus-color-rgb")
      .trim() || "43, 143, 108";
    dotEl.animate(
      [
        { transform: "scale(1)", filter: `drop-shadow(0 0 0 rgba(${focusRgb},0))` },
        { transform: "scale(1.6)", filter: `drop-shadow(0 0 10px rgba(${focusRgb},0.95))` },
        { transform: "scale(1)", filter: `drop-shadow(0 0 0 rgba(${focusRgb},0))` },
      ],
      { duration: MAP_PIN_FOCUS_DURATION_MS, easing: "ease-out" }
    );
  }
  if (marker._focusPulseTimer) {
    window.clearTimeout(marker._focusPulseTimer);
  }
  marker._focusPulseTimer = window.setTimeout(() => {
    markerEl.classList.remove("is-focus-pulse");
    dotEl?.classList.remove("is-focus-pulse");
    marker._focusPulseTimer = null;
  }, MAP_PIN_FOCUS_DURATION_MS);
}

function keepMapTooltipInView(marker, attempt = 0) {
  if (!mainMap || state.viewMode === "notes" || !marker) {
    return;
  }
  const mapEl = mainMap.getContainer?.();
  const tooltipEl = marker.getTooltip?.()?.getElement?.();
  if (!mapEl || !tooltipEl) {
    if (attempt < MAP_TOOLTIP_PAN_MAX_ATTEMPTS) {
      requestAnimationFrame(() => keepMapTooltipInView(marker, attempt + 1));
    }
    return;
  }
  const mapRect = mapEl.getBoundingClientRect();
  const tooltipRect = tooltipEl.getBoundingClientRect();
  const extraEl = tooltipEl.querySelector(".map-tooltip-extra");
  const extraRect =
    extraEl && tooltipEl.classList.contains("is-expanded")
      ? extraEl.getBoundingClientRect()
      : null;
  const bounds = {
    left: Math.min(tooltipRect.left, extraRect?.left ?? tooltipRect.left),
    top: Math.min(tooltipRect.top, extraRect?.top ?? tooltipRect.top),
    right: Math.max(tooltipRect.right, extraRect?.right ?? tooltipRect.right),
    bottom: Math.max(tooltipRect.bottom, extraRect?.bottom ?? tooltipRect.bottom),
  };
  if (!mapRect.width || !mapRect.height || !(bounds.right - bounds.left) || !(bounds.bottom - bounds.top)) {
    if (attempt < MAP_TOOLTIP_PAN_MAX_ATTEMPTS) {
      requestAnimationFrame(() => keepMapTooltipInView(marker, attempt + 1));
    }
    return;
  }

  const leftLimit = mapRect.left + MAP_TOOLTIP_VIEW_PADDING;
  const rightLimit = mapRect.right - MAP_TOOLTIP_VIEW_PADDING;
  const topLimit = mapRect.top + MAP_TOOLTIP_VIEW_PADDING;
  const bottomLimit = mapRect.bottom - MAP_TOOLTIP_VIEW_PADDING;

  let panX = 0;
  let panY = 0;
  if (bounds.left < leftLimit) {
    panX = bounds.left - leftLimit;
  } else if (bounds.right > rightLimit) {
    panX = bounds.right - rightLimit;
  }
  if (bounds.top < topLimit) {
    panY = bounds.top - topLimit;
  } else if (bounds.bottom > bottomLimit) {
    panY = bounds.bottom - bottomLimit;
  }

  if (Math.abs(panX) <= 1 && Math.abs(panY) <= 1) {
    return;
  }

  const offset = [Math.round(panX), Math.round(panY)];
  if (attempt < MAP_TOOLTIP_PAN_MAX_ATTEMPTS) {
    mainMap.once("moveend", () => {
      requestAnimationFrame(() => keepMapTooltipInView(marker, attempt + 1));
    });
  }
  mainMap.panBy(offset, { animate: true, duration: 0.25, noMoveStart: true });
}

function focusMapLocation(targetKey, target = null) {
  setViewMode("split");
  alignMapPanelToTop({ behavior: "smooth" });
  requestAnimationFrame(() => {
    ensureMainMap();
    renderMapPins();
    const resolved = resolveMapFocusTarget(targetKey, target);
    focusResolvedMapTarget(resolved, targetKey);
  });
}

function goToLocationForSelection() {
  if (!state.selection) {
    showAppToast("Select a note or card with a location first.");
    return false;
  }
  if (state.selection.kind === "note") {
    const column = state.columns.find((col) => col.id === state.selection.columnId);
    const obs = column?.observations?.find((item) => item.id === state.selection.obsId);
    if (!obs?.location) {
      showAppToast("Selected note has no location.");
      return false;
    }
    focusMapLocation(`note:${state.selection.columnId}:${state.selection.obsId}`, {
      kind: "note",
      columnId: state.selection.columnId,
      obsId: state.selection.obsId,
    });
    return true;
  }
  if (state.selection.kind === "column") {
    const column = state.columns.find((col) => col.id === state.selection.columnId);
    if (!column?.location) {
      showAppToast("Selected card has no location.");
      return false;
    }
    focusMapLocation(`card:${state.selection.columnId}`, {
      kind: "card",
      columnId: state.selection.columnId,
    });
    return true;
  }
  showAppToast("Select a note or card with a location first.");
  return false;
}

function focusResolvedMapTarget(resolved, fallbackKey, attempt = 0) {
  if (!mainMap) {
    return;
  }
  const marker = resolved?.key ? mapMarkers.get(resolved.key) : null;
  if (!marker) {
    if (attempt < 3) {
      requestAnimationFrame(() => focusResolvedMapTarget(resolved, fallbackKey, attempt + 1));
      return;
    }
    if (resolved?.location) {
      mainMap.setView(
        [resolved.location.lat, resolved.location.lon],
        Math.max(mainMap.getZoom(), 14)
      );
    }
    if (isMapPinFiltered(resolved?.key || fallbackKey)) {
      showMapFilterNotice();
    }
    return;
  }
  hideMapFilterNotice();
  const point = marker.getLatLng();
  let didPulse = false;
  const runPulse = () => {
    if (didPulse) {
      return;
    }
    didPulse = true;
    setFocusedMapMarker(marker);
    pulseMapMarker(marker);
  };
  mainMap.once("moveend", runPulse);
  mainMap.setView(point, Math.max(mainMap.getZoom(), 14));
  window.setTimeout(runPulse, 160);
}

function handleDocumentPointerDownForMapFocus(event) {
  if (!mapFocusedMarker || !mapFocusedState) {
    return;
  }
  const target = event.target;
  const markerEl = mapFocusedMarker.getElement?.();
  const tooltipEl = mapFocusedMarker.getTooltip?.()?.getElement?.();
  if (
    (markerEl && target instanceof Node && markerEl.contains(target)) ||
    (tooltipEl && target instanceof Node && tooltipEl.contains(target))
  ) {
    return;
  }
  clearFocusedMapMarker();
}
