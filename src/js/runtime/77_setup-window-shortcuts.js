/* 77 setup window shortcuts */

function bindWindowAndShortcutSection() {
  function shouldWarnOnUnload() {
    if (runtimeLiveServerSession) {
      return false;
    }
    return state.dispatchVisited || state.isDirty || hasDispatchData();
  }

  let allowReload = false;

  function requestReload(event) {
    if (runtimeLiveServerSession) {
      window.location.reload();
      return;
    }
    if (!shouldWarnOnUnload()) {
      return;
    }
    event.preventDefault();
    const proceed = window.confirm(
      "Reloading will clear any unsaved dispatch data. Continue?"
    );
    if (!proceed) {
      return;
    }
    allowReload = true;
    window.location.reload();
  }

  function handleBeforeUnload(event) {
    if (allowReload || !shouldWarnOnUnload()) {
      return;
    }
    event.preventDefault();
    event.returnValue =
      "Reloading will clear any unsaved dispatch data. Continue?";
  }

  if (!runtimeLiveServerSession) {
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.onbeforeunload = handleBeforeUnload;
  }

  window.addEventListener("keydown", (event) => {
    const isMac = navigator.platform.toLowerCase().includes("mac");
    const key = event.key.toLowerCase();
    const reloadShortcut =
      key === "f5" ||
      ((key === "r") && ((isMac && event.metaKey) || (!isMac && event.ctrlKey)));
    if (!reloadShortcut) {
      return;
    }
    requestReload(event);
  });

  window.addEventListener("keydown", (event) => {
    const isCtrlShift = event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey;
    const isCtrlMetaShift = event.ctrlKey && event.metaKey && event.shiftKey && !event.altKey;

    if (isCtrlShift && event.code === "KeyN") {
      event.preventDefault();
      const visibleColumns = getVisibleColumns();
      if (!visibleColumns.length) {
        return;
      }
      const index = getSelectedColumnIndex();
      const column = visibleColumns[index] || visibleColumns[0];
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
      markDirty();
      updateEndIfNeeded(now);
      updateStartIfNeeded(now);
      renderColumns();
      persistState();
      updateSummary();
      requestAnimationFrame(() => {
        scrollSelectionIntoView();
        focusLastNote(column.id, obs.id);
      });
      return;
    }

    if (isCtrlMetaShift && event.code === "KeyN") {
      event.preventDefault();
      const nextType = getNextCardTypeForNewColumn();
      const nextLabel = getNextCustomLabel(nextType);
      const newColumn = {
        id: createId(),
        label: nextLabel,
        observations: [],
        type: nextType,
        minimized: false,
        color: getDefaultColorForCardType(nextType || DEFAULT_CARD_TYPE),
        labelAuto: true,
        reportAll: false,
        createdAt: Date.now(),
        vehicleProfile: getDefaultVehicleProfileForType(nextType),
        location: null,
      };
      state.columns.push(newColumn);
      selectColumn(newColumn.id);
      markDirty();
      renderColumns();
      persistState();
      updateSummary();
      requestAnimationFrame(() => {
        scrollSelectionIntoView();
      });
      return;
    }

    if (isCtrlShift && event.key === "ArrowRight") {
      event.preventDefault();
      const visibleColumns = getVisibleColumns();
      if (!visibleColumns.length) {
        return;
      }
      const currentIndex = getSelectedColumnIndex();
      const nextIndex = (currentIndex + 1) % visibleColumns.length;
      selectColumn(visibleColumns[nextIndex].id);
      applySelectionUI();
      scrollSelectionIntoView();
      return;
    }

    if (
      isCtrlShift &&
      (event.code.startsWith("Digit") || event.code.startsWith("Numpad"))
    ) {
      event.preventDefault();
      const visibleColumns = getVisibleColumns();
      if (!visibleColumns.length) {
        return;
      }
      const digit = Number(event.code.replace("Digit", "").replace("Numpad", ""));
      const targetIndex = digit === 0 ? 9 : digit - 1;
      const targetColumn = visibleColumns[targetIndex];
      if (!targetColumn) {
        return;
      }
      selectColumn(targetColumn.id);
      applySelectionUI();
      scrollSelectionIntoView();
      return;
    }

    if (isCtrlShift && event.key === "ArrowLeft") {
      event.preventDefault();
      const visibleColumns = getVisibleColumns();
      if (!visibleColumns.length) {
        return;
      }
      const currentIndex = getSelectedColumnIndex();
      const nextIndex =
        (currentIndex - 1 + visibleColumns.length) % visibleColumns.length;
      selectColumn(visibleColumns[nextIndex].id);
      applySelectionUI();
      scrollSelectionIntoView();
      return;
    }

    if (isCtrlShift && event.code === "KeyC") {
      event.preventDefault();
      const nextType = getNextCardTypeForNewColumn();
      const nextLabel = getNextCustomLabel(nextType);
      const newColumn = {
        id: createId(),
        label: nextLabel,
        observations: [],
        type: nextType,
        minimized: false,
        color: getDefaultColorForCardType(nextType || DEFAULT_CARD_TYPE),
        labelAuto: true,
        reportAll: false,
        createdAt: Date.now(),
        vehicleProfile: getDefaultVehicleProfileForType(nextType),
        location: null,
      };
      state.columns.push(newColumn);
      selectColumn(newColumn.id);
      markDirty();
      renderColumns();
      persistState();
      updateSummary();
      requestAnimationFrame(() => {
        scrollSelectionIntoView();
      });
      return;
    }

    if (isCtrlShift && event.code === "KeyM") {
      event.preventDefault();
      if (state.selection?.columnId) {
        minimizeColumnById(state.selection.columnId);
      }
      return;
    }

    if (isCtrlShift && event.code === "KeyS") {
      event.preventDefault();
      openSearchModal();
      return;
    }

    if (isCtrlShift && event.code === "KeyG") {
      const activeEl = document.activeElement;
      const isEditable =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable);
      if (isEditable) {
        return;
      }
      event.preventDefault();
      goToLocationForSelection();
      return;
    }

    if (isCtrlShift && event.code === "KeyV") {
      event.preventDefault();
      const nextView =
        state.viewMode === "notes"
          ? "split"
          : state.viewMode === "split"
            ? "map"
            : "notes";
      setViewMode(nextView);
      return;
    }

    if (isCtrlMetaShift && event.code === "KeyV") {
      event.preventDefault();
      cycleWorkspaceTab();
      return;
    }

    if (isCtrlShift && event.code === "KeyL") {
      event.preventDefault();
      openLocationModalForSelection({ useDropPin: false });
      return;
    }

    if (isCtrlMetaShift && event.code === "KeyL") {
      event.preventDefault();
      openLocationModalForSelection({ useDropPin: true });
      return;
    }

    if (isCtrlShift && event.code === "KeyP") {
      event.preventDefault();
      const columnId =
        state.selection?.kind === "note"
          ? state.selection.columnId
          : state.selection?.columnId;
      if (!columnId) {
        return;
      }
      const column = state.columns.find((col) => col.id === columnId);
      if (!column) {
        return;
      }
      column.color = getNextActiveColor(column.color);
      markDirty();
      persistState();
      renderColumns();
      renderMapPins();
      return;
    }

    if (isCtrlShift && (event.code === "Slash" || event.key === "/" || event.key === "?")) {
      event.preventDefault();
      ensureShortcutsLoaded()
        .catch((error) => {
          console.warn("[shortcuts] Unable to preload shortcut content.", error);
        })
        .finally(() => {
          openShortcutsModal();
        });
      return;
    }

    if (isCtrlShift && event.code === "KeyH") {
      event.preventDefault();
      ensureHowToLoaded()
        .catch((error) => {
          console.warn("[how-to] Unable to preload help content.", error);
        })
        .finally(() => {
          openHowToModal();
        });
      return;
    }

    if (isCtrlShift && event.code === "KeyR") {
      event.preventDefault();
      if (state.selection?.kind !== "note") {
        return;
      }
      const column = state.columns.find((col) => col.id === state.selection.columnId);
      if (!column) {
        return;
      }
      const obs = column.observations.find((item) => item.id === state.selection.obsId);
      if (!obs) {
        return;
      }
      obs.reportable = !obs.reportable;
      markDirty();
      persistState();
      renderColumns();
      updateSummary();
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      if (deleteModal && !deleteModal.classList.contains("hidden")) {
        return;
      }
      const target = event.target;
      const isEditable =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      if (isEditable) {
        return;
      }
      if (state.selection?.kind === "note") {
        openDeleteModal(state.selection.columnId, state.selection.obsId);
        return;
      }
      if (state.selection?.kind === "column") {
        openColumnDeleteModal(state.selection.columnId);
      }
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }
    if (mapPlacementMarker) {
      event.preventDefault();
      clearMapPlacementMarker();
      pendingVehicleInfoNoteTarget = null;
      showAppToast("Canceled temporary pin placement.");
      return;
    }
    if (!isModalOpen(vehicleModal) &&
        !isModalOpen(deleteModal) &&
        !isModalOpen(shortcutsModal) &&
        !isModalOpen(howToModal) &&
        !isModalOpen(saveInfoModal) &&
        !isModalOpen(searchModal) &&
        !isModalOpen(locationModal) &&
        !isModalOpen(mapCardMetaModal) &&
        !isModalOpen(applyCardColorsModal) &&
        !isModalOpen(tutorialPickerModal) &&
        !isModalOpen(tutorialWelcomeModal) &&
        !isModalOpen(tutorialCompleteModal)) {
      const activeEl = document.activeElement;
      const isFocusable =
        activeEl &&
        activeEl !== document.body &&
        (activeEl.matches("button, [href], input, select, textarea, [tabindex]") ||
          activeEl.isContentEditable);
      if (isFocusable) {
        event.preventDefault();
        activeEl.blur();
      }
      return;
    }
    event.preventDefault();
    closeAllModals();
  });

  window.addEventListener("contextmenu", () => {});
  window.addEventListener("keydown", handleTourArrowNavigation, true);


  window.addEventListener("resize", () => {
    applyMinimizedLayout();
    const showTypePickers = state.cardColorDefaults?.mode !== "cycle";
    syncSettingsGridMinHeight(showTypePickers);
    syncLocationModalLayout();
  });

  refreshIcons();
}
