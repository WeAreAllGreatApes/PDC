/* 76 setup dispatch map */

function bindDispatchMapSection() {
  addColumnButton.addEventListener("click", () => {
    const nextType = getNextCardTypeForNewColumn();
    const nextLabel = getNextCustomLabel(nextType);
    state.columns.push({
      id: createId(),
      type: nextType || DEFAULT_CARD_TYPE,
      minimized: false,
      color: getDefaultColorForCardType(nextType || DEFAULT_CARD_TYPE),
      label: nextLabel,
      labelAuto: true,
      reportAll: false,
      createdAt: Date.now(),
      vehicleProfile: getDefaultVehicleProfileForType(nextType || DEFAULT_CARD_TYPE),
      location: null,
      observations: [],
    });
    markDirty();
    renderColumns();
    persistState();
    updateSummary();
  });

  if (columnsEl) {
    columnsEl.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (noteDragState.noteId) {
        return;
      }
      const dragging = columnsEl.querySelector(".column.dragging");
      if (!dragging) {
        return;
      }
      const target = event.target.closest(".column");
      if (!target && event.target === columnsEl) {
        setDragTarget(null, "end");
        return;
      }
      if (!target) {
        clearDragTargets();
        return;
      }
      if (dragging === target) {
        clearDragTargets();
        return;
      }
      const rect = target.getBoundingClientRect();
      const shouldInsertAfter = event.clientX > rect.left + rect.width / 2;
      setDragTarget(target, shouldInsertAfter ? "after" : "before");
    });
  }

  if (minimizedToggle) {
    minimizedToggle.addEventListener("click", () => {
      state.minimizedExpanded = false;
      renderColumns();
    });
  }

  if (minimizeAllCards) {
    minimizeAllCards.addEventListener("click", () => {
      let changed = false;
      state.columns.forEach((column) => {
        if (!column.minimized) {
          column.minimized = true;
          changed = true;
        }
      });
      clearSelection();
      if (!changed) {
        renderColumns();
        return;
      }
      markDirty();
      renderColumns();
      persistState();
      updateSummary();
    });
  }

  if (maximizeAllCards) {
    maximizeAllCards.addEventListener("click", () => {
      let changed = false;
      state.columns.forEach((column) => {
        if (column.minimized) {
          column.minimized = false;
          changed = true;
        }
      });
      clearSelection();
      state.minimizedExpanded = false;
      if (!changed) {
        renderColumns();
        return;
      }
      markDirty();
      renderColumns();
      persistState();
      updateSummary();
    });
  }

  if (mapLabelsButton && mapLabelsMenu) {
    mapLabelsButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = mapLabelsMenu.classList.contains("show");
      closeMapVisibilityMenu();
      closeMapTypeMenu();
      if (isOpen) {
        closeMapLabelsMenu();
      } else {
        openMapLabelsMenu();
      }
    });
    mapLabelsMenu.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    document.addEventListener("click", () => {
      if (!mapLabelsMenu.classList.contains("show")) {
        return;
      }
      closeMapLabelsMenu();
    });
  }

  if (mapVisibilityButton && mapVisibilityMenu) {
    mapVisibilityButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = mapVisibilityMenu.classList.contains("show");
      closeMapLabelsMenu();
      closeMapTypeMenu();
      if (isOpen) {
        closeMapVisibilityMenu();
      } else {
        openMapVisibilityMenu();
      }
    });
    mapVisibilityMenu.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    document.addEventListener("click", () => {
      if (!mapVisibilityMenu.classList.contains("show")) {
        return;
      }
      closeMapVisibilityMenu();
    });
  }

  if (mapTypeButton && mapTypeMenu) {
    mapTypeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = mapTypeMenu.classList.contains("show");
      closeMapLabelsMenu();
      closeMapVisibilityMenu();
      if (isOpen) {
        closeMapTypeMenu();
      } else {
        openMapTypeMenu();
      }
    });
    mapTypeMenu.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    document.addEventListener("click", () => {
      if (!mapTypeMenu.classList.contains("show")) {
        return;
      }
      closeMapTypeMenu();
    });
  }

  if (mapFilterNoticeDismiss) {
    mapFilterNoticeDismiss.addEventListener("click", () => {
      hideMapFilterNotice();
    });
  }
  if (mapGeocodeDismiss) {
    mapGeocodeDismiss.addEventListener("click", () => {
      if (mapGeocodeNotice) {
        mapGeocodeNotice.classList.add("hidden");
      }
    });
  }

  if (mapStyleButton && mapStyleMenu) {
    const closeMapStyleMenu = () => {
      mapStyleMenu.classList.remove("show");
      mapStyleButton.setAttribute("aria-expanded", "false");
    };
    const openMapStyleMenu = () => {
      renderMapStyleMenu();
      mapStyleMenu.classList.add("show");
      mapStyleButton.setAttribute("aria-expanded", "true");
    };
    mapStyleButton.addEventListener("click", (event) => {
      event.stopPropagation();
      if (mapStyleMenu.classList.contains("show")) {
        closeMapStyleMenu();
      } else {
        openMapStyleMenu();
      }
    });
    mapStyleMenu.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    document.addEventListener("click", () => {
      if (mapStyleMenu.classList.contains("show")) {
        closeMapStyleMenu();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }
    const hadOpenMenu = Boolean(
      mapLabelsMenu?.classList.contains("show") ||
      mapVisibilityMenu?.classList.contains("show") ||
      mapTypeMenu?.classList.contains("show") ||
      mapStyleMenu?.classList.contains("show")
    );
    if (!hadOpenMenu) {
      return;
    }
    closeMapLabelsMenu();
    closeMapVisibilityMenu();
    closeMapTypeMenu();
    if (mapStyleMenu?.classList.contains("show")) {
      mapStyleMenu.classList.remove("show");
      mapStyleButton?.setAttribute("aria-expanded", "false");
    }
    event.preventDefault();
    event.stopPropagation();
  });

}
