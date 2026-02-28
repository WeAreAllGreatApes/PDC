/* 73 setup dispatch summary */

function bindDispatchAndSummarySection() {
  if (shiftAreaInput) {
    shiftAreaInput.value = state.area;
    shiftAreaInput.addEventListener("input", (event) => {
      state.area = event.target.value.trim();
      markDirty();
      persistState();
      updateSummary();
    });
  }

  viewToggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setViewMode(button.dataset.view || "notes");
    });
  });

  if (setCityButton) {
    setCityButton.addEventListener("click", () => {
      openLocationModal({ kind: "city" });
    });
  }
  if (centerMapButton) {
    centerMapButton.addEventListener("click", () => {
      setViewMode("split", { preserveMapView: true });
      alignMapPanelToTop({ behavior: "smooth" });
      window.setTimeout(() => {
        openLocationModal({ kind: "center-map" });
      }, 180);
    });
  }

  if (mapRadiusInput) {
    mapRadiusInput.value = state.mapSettings.radiusMiles;
    mapRadiusInput.addEventListener("change", (event) => {
      const next = Number(event.target.value);
      state.mapSettings.radiusMiles =
        Number.isFinite(next) && next > 0 ? next : DEFAULT_MAP_RADIUS_MILES;
      markDirty();
      persistMapSettings();
      persistState();
      updateCityUI();
    });
  }

  if (dispatchNewestFirstToggle) {
    dispatchNewestFirstToggle.checked = state.notesNewestFirst !== false;
    dispatchNewestFirstToggle.addEventListener("change", (event) => {
      state.notesNewestFirst = event.target.checked;
      markDirty();
      renderColumns();
      persistState();
    });
  }

  if (summarySort) {
    summarySort.value = state.summarySort || DEFAULT_SUMMARY_SORT;
    summarySort.addEventListener("change", (event) => {
      const next = event.target.value;
      state.summarySort = SUMMARY_SORT_OPTIONS.has(next) ? next : DEFAULT_SUMMARY_SORT;
      markDirty();
      persistState();
      updateSummary();
    });
  }
  if (summaryMostRecentToggle) {
    summaryMostRecentToggle.checked = Boolean(state.summaryMostRecentFirst);
    summaryMostRecentToggle.addEventListener("change", (event) => {
      state.summaryMostRecentFirst = event.target.checked;
      markDirty();
      persistState();
      updateSummary();
    });
  }
  renderSummaryDefaultExclude();
  renderCardTypeAvailability();
  renderDefaultCardTypeSelect();
  renderDefaultCardColorSettings();
  if (defaultCardColorModeSelect) {
    defaultCardColorModeSelect.addEventListener("change", (event) => {
      setCardColorMode(event.target.value);
      markDirty();
      persistState();
      renderDefaultCardColorSettings();
      renderColumns();
    });
  }

  if (summaryReportableToggle) {
    summaryReportableToggle.checked = Boolean(state.summaryReportableOnly);
    summaryReportableToggle.addEventListener("change", (event) => {
      state.summaryReportableOnly = event.target.checked;
      markDirty();
      persistState();
      updateSummary();
    });
  }
  if (summaryWarningDismiss) {
    summaryWarningDismiss.addEventListener("click", () => {
      summaryWarningDismissed = true;
      if (summaryWarning) {
        summaryWarning.classList.add("hidden");
      }
    });
  }

  if (summaryEmojiToggle) {
    summaryEmojiToggle.checked = Boolean(state.summaryIncludeEmojis);
    summaryEmojiToggle.addEventListener("change", (event) => {
      state.summaryIncludeEmojis = event.target.checked;
      markDirty();
      persistState();
      updateSummary();
    });
  }

  if (summaryLocationToggle) {
    summaryLocationToggle.checked = state.summaryIncludeLocation !== false;
    summaryLocationToggle.addEventListener("change", (event) => {
      state.summaryIncludeLocation = event.target.checked;
      syncSummaryLocationSuboptions();
      markDirty();
      persistState();
      updateSummary();
    });
  }
  if (summaryLocationAddressToggle) {
    summaryLocationAddressToggle.checked = state.summaryLocationIncludeAddress !== false;
    summaryLocationAddressToggle.addEventListener("change", (event) => {
      state.summaryLocationIncludeAddress = event.target.checked;
      markDirty();
      persistState();
      updateSummary();
    });
  }
  if (summaryLocationLatLonToggle) {
    summaryLocationLatLonToggle.checked = Boolean(state.summaryLocationIncludeLatLon);
    summaryLocationLatLonToggle.addEventListener("change", (event) => {
      state.summaryLocationIncludeLatLon = event.target.checked;
      markDirty();
      persistState();
      updateSummary();
    });
  }
  syncSummaryLocationSuboptions();

  if (summarySanitizeToggle) {
    summarySanitizeToggle.checked = state.summarySanitizeNames !== false;
    summarySanitizeToggle.addEventListener("change", (event) => {
      state.summarySanitizeNames = event.target.checked;
      markDirty();
      persistState();
      updateSummary();
    });
  }
  if (summaryBulletsToggle) {
    summaryBulletsToggle.checked = Boolean(state.summaryBulletsForNotes);
    summaryBulletsToggle.addEventListener("change", (event) => {
      state.summaryBulletsForNotes = event.target.checked;
      markDirty();
      persistState();
      updateSummary();
    });
  }
  if (summarySpaceBetweenToggle) {
    summarySpaceBetweenToggle.checked = Boolean(state.summarySpaceBetweenNotes);
    summarySpaceBetweenToggle.addEventListener("change", (event) => {
      state.summarySpaceBetweenNotes = event.target.checked;
      markDirty();
      persistState();
      updateSummary();
    });
  }

  syncSummaryTimeFormatToggle();
  if (summaryTimeFormat24) {
    summaryTimeFormat24.addEventListener("click", () => {
      if (state.summaryTime24 !== false) {
        return;
      }
      state.summaryTime24 = true;
      syncSummaryTimeFormatToggle();
      syncShiftUI();
      renderColumns();
      markDirty();
      persistState();
      updateSummary();
    });
  }
  if (summaryTimeFormat12) {
    summaryTimeFormat12.addEventListener("click", () => {
      if (state.summaryTime24 === false) {
        return;
      }
      state.summaryTime24 = false;
      syncSummaryTimeFormatToggle();
      syncShiftUI();
      renderColumns();
      markDirty();
      persistState();
      updateSummary();
    });
  }
  if (summaryGroupFieldsToggle) {
    summaryGroupFieldsToggle.checked = state.summaryGroupFields !== false;
    summaryGroupFieldsToggle.addEventListener("change", (event) => {
      state.summaryGroupFields = event.target.checked;
      markDirty();
      persistState();
      updateSummary();
    });
  }

  if (startShiftButton) {
    startShiftButton.addEventListener("click", () => {
      if (!state.startTime) {
        state.startTime = new Date();
        state.endAdjustedNote = "";
      } else if (state.endTime) {
        state.endTime = null;
        state.endAdjustedNote = "";
      }
      markDirty();
      syncShiftUI();
      renderColumns();
      persistState();
      updateSummary();
    });
  }

  if (endShiftButton) {
    endShiftButton.addEventListener("click", () => {
      if (!state.startTime) {
        return;
      }
      state.endTime = new Date();
      state.endAdjustedNote = "";
      markDirty();
      syncShiftUI();
      renderColumns();
      persistState();
      updateSummary();
    });
  }

  if (startTimeInput) {
    startTimeInput.addEventListener("blur", () => {
      if (startTimeInput.value.trim() === "—") {
        return;
      }
      const parsed = parseShiftTimestamp(startTimeInput.value);
      if (!parsed) {
        syncShiftUI();
        return;
      }
      state.startTime = parsed;
      markDirty();
      syncShiftUI();
      persistState();
      updateSummary();
    });
    addCommitOnEnter(startTimeInput);
  }

  if (endTimeInput) {
    endTimeInput.addEventListener("blur", () => {
      const trimmed = endTimeInput.value.trim();
      if (trimmed === "—" || trimmed === "Hit End When Done") {
        return;
      }
      const parsed = parseShiftTimestamp(endTimeInput.value);
      if (!parsed) {
        syncShiftUI();
        return;
      }
      state.endTime = parsed;
      state.endAdjustedNote = "";
      markDirty();
      syncShiftUI();
      persistState();
      updateSummary();
    });
    addCommitOnEnter(endTimeInput);
  }

  saveToggle.addEventListener("change", (event) => {
    state.saveEnabled = event.target.checked;
    if (!state.saveEnabled) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      persistState();
    }
  });

  if (exportButton && exportMenu) {
    setExportMenu();
    exportButton.addEventListener("click", () => {
      const isOpen = exportMenu.classList.toggle("show");
      exportButton.setAttribute("aria-expanded", String(isOpen));
    });

    exportMenu.addEventListener("click", (event) => {
      const target = event.target.closest(".dropdown-item");
      if (!target) {
        return;
      }
      const format = target.dataset.export || "csv";
      exportMenu.classList.remove("show");
      exportButton.setAttribute("aria-expanded", "false");
      if (format.startsWith("summary-")) {
        exportSummary(format);
        return;
      }
      exportNotes(format);
    });

    document.addEventListener("click", (event) => {
      if (!exportMenu.classList.contains("show")) {
        return;
      }
      const target = event.target;
      if (target === exportButton || exportMenu.contains(target)) {
        return;
      }
      exportMenu.classList.remove("show");
      exportButton.setAttribute("aria-expanded", "false");
    });
  }

  if (importButton && importFile) {
    importButton.addEventListener("click", () => {
      importFile.click();
    });
  }

  clearButton.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Clear all dispatch data? This cannot be undone."
    );
    if (!confirmed) {
      return;
    }
    resetState();
    if (!state.saveEnabled) {
      localStorage.removeItem(STORAGE_KEY);
    }
  });

  if (importFile) {
    importFile.addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) {
        return;
      }
      let payload = "";
      try {
        payload = await file.text();
      } catch (error) {
        window.alert("Unable to read that file. Please select a valid JSON backup.");
        return;
      }
      applyImportPayload(payload);
      importFile.value = "";
    });
  }

  copySummaryButton.addEventListener("click", async () => {
    const text = summaryOutput.value;
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch (error) {
        copied = false;
      }
    }
    if (!copied) {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.setAttribute("readonly", "true");
      helper.style.position = "fixed";
      helper.style.top = "-1000px";
      document.body.appendChild(helper);
      helper.focus();
      helper.select();
      try {
        copied = document.execCommand("copy");
      } catch (error) {
        copied = false;
      }
      document.body.removeChild(helper);
    }
    if (copied) {
      copyStatus.textContent = "Copied to clipboard";
      copyStatus.classList.add("show", "flash");
      copySummaryButton.textContent = "Copied";
      setTimeout(() => {
        copySummaryButton.textContent = "Copy Summary";
        copyStatus.classList.remove("flash");
      }, 1200);
      setTimeout(() => {
        copyStatus.classList.remove("show");
        copyStatus.textContent = "";
      }, 1800);
    } else {
      copyStatus.textContent = "Clipboard blocked. Press Ctrl+C / Cmd+C.";
      copyStatus.classList.add("show", "flash");
      setTimeout(() => {
        copyStatus.classList.remove("flash");
      }, 1800);
    }
  });

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => {
      handleTabSwitch(card.dataset.tab);
    });
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => handleTabSwitch(tab.dataset.tab));
  });

  const viewState = loadViewState();
  if (viewState && viewState.tab) {
    if (viewState.tab === "welcome") {
      showWelcome();
    } else {
      handleTabSwitch(viewState.tab);
    }
  }

  if (brandHome) {
    brandHome.addEventListener("click", () => {
      showWelcome();
    });
    brandHome.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showWelcome();
      }
    });
  }

}
