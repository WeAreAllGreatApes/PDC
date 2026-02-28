/* 72 setup bootstrap state */

function bootstrapRuntimeState() {
  const storedMapSettings = loadMapSettingsFromStorage();
  runtimeLiveServerSession = isLiveServerSession();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const shouldLoad = runtimeLiveServerSession
      ? true
      : window.confirm("Saved dispatch data was found on this device. Load it now?");
    if (shouldLoad) {
      state.saveEnabled = true;
      saveToggle.checked = true;
      loadState(stored);
      state.timezone = normalizeTimeZone(state.timezone);
      state.isDirty = hasDispatchData();
      state.dispatchVisited = hasDispatchData();
    } else {
      localStorage.removeItem(STORAGE_KEY);
      createDefaultColumns();
    }
  } else {
    createDefaultColumns();
  }

  if (storedMapSettings) {
    state.mapSettings = {
      ...state.mapSettings,
      ...storedMapSettings,
    };
  }

  if (!state.mapFilters) {
    state.mapFilters = {
      showMinimized: DEFAULT_MAP_FILTER_SHOW_MINIMIZED,
      labelTimes: DEFAULT_MAP_FILTER_LABEL_TIMES,
      recencyMode: DEFAULT_MAP_FILTER_RECENCY_MODE,
      noteReportableOnly: DEFAULT_MAP_FILTER_NOTE_REPORTABLE_ONLY,
      inactiveLabelOpacity: DEFAULT_MAP_FILTER_INACTIVE_LABEL_OPACITY,
      types: getDefaultMapTypeFilters(),
    };
  } else {
    if (state.mapFilters.showMinimized === undefined) {
      state.mapFilters.showMinimized =
        state.mapFilters.hideMinimized === undefined
          ? DEFAULT_MAP_FILTER_SHOW_MINIMIZED
          : !Boolean(state.mapFilters.hideMinimized);
    } else {
      state.mapFilters.showMinimized = Boolean(state.mapFilters.showMinimized);
    }
    if (!state.mapFilters.types) {
      state.mapFilters.types = getDefaultMapTypeFilters();
    }
    if (state.mapFilters.recencyMode === undefined) {
      state.mapFilters.recencyMode = DEFAULT_MAP_FILTER_RECENCY_MODE;
    } else {
      state.mapFilters.recencyMode = normalizeMapRecencyMode(state.mapFilters.recencyMode);
    }
    if (state.mapFilters.inactiveLabelOpacity === undefined) {
      state.mapFilters.inactiveLabelOpacity = DEFAULT_MAP_FILTER_INACTIVE_LABEL_OPACITY;
    } else {
      state.mapFilters.inactiveLabelOpacity = normalizeMapInactiveLabelOpacity(
        state.mapFilters.inactiveLabelOpacity
      );
    }
    if (state.mapFilters.noteReportableOnly === undefined) {
      state.mapFilters.noteReportableOnly = DEFAULT_MAP_FILTER_NOTE_REPORTABLE_ONLY;
    } else {
      state.mapFilters.noteReportableOnly = Boolean(state.mapFilters.noteReportableOnly);
    }
  }
  state.availableCardTypes = normalizeAvailableCardTypes(state.availableCardTypes);
  if (
    state.defaultNewCardType &&
    state.defaultNewCardType !== "last" &&
    !isCardTypeAvailable(state.defaultNewCardType)
  ) {
    state.defaultNewCardType = "last";
  }

  if (!state.mapSettings.style) {
    state.mapSettings.style = DEFAULT_MAP_STYLE;
  }
  if (!MAP_FEATURE_ENABLED || !["notes", "split", "map"].includes(state.viewMode)) {
    state.viewMode = "notes";
  } else if (!SPLIT_VIEW_ENABLED && state.viewMode === "split") {
    state.viewMode = "notes";
  }
  state.cardColorDefaults = normalizeCardColorDefaults(state.cardColorDefaults);

  clearSelection();

  state.timezone = normalizeTimeZone(state.timezone);
  document.addEventListener("pointerdown", handleDocumentPointerDownForMapFocus, true);
  applyConfiguredFeatureFlags();

  if (timezoneSelect) {
    const zones = getTimezones();
    const timezoneOptions = [
      { value: "detect", label: "Detect" },
      ...zones.map((zone) => ({ value: zone.value, label: zone.label })),
    ];
    if (!zones.some((zone) => zone.value === state.timezone)) {
      timezoneOptions.push({
        value: state.timezone,
        label: `Custom (${state.timezone})`,
      });
    }
    timezoneSelect.innerHTML = "";
    timezoneDropdown = createCustomSelect({
      options: timezoneOptions,
      value: state.timezone,
      ariaLabel: "Timezone",
      className: "timezone-dropdown",
      onChange: (value) => {
        if (value === "detect") {
          const detected = getSystemTimeZone();
          setTimeZone(detected);
          if (timezoneDropdown) {
            timezoneDropdown.setValue(detected, `Custom (${detected})`);
          }
          return;
        }
        setTimeZone(value);
      },
    });
    timezoneSelect.appendChild(timezoneDropdown.element);
  }
  updateTimezoneLink();

  if (timezoneLink) {
    timezoneLink.addEventListener("click", () => {
      focusTimezoneSetting();
    });
  }

  if (!state.saveEnabled) {
    state.saveEnabled = true;
    saveToggle.checked = true;
  }

  syncShiftUI();
  renderColumns();
  updateSummary();
  applyViewMode();
  updateCityUI();
  syncMapFilterControls();


}
