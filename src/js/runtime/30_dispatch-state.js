/*
  Dispatch tab: persistence and shift state helpers
  Transitional split from the previous runtime monolith for maintainability.
*/

function sortColumnObservations(column) {
  column.observations.sort((a, b) => {
    const timeDiff = getObservationTimestampValue(a) - getObservationTimestampValue(b);
    if (timeDiff !== 0) {
      return timeDiff;
    }
    const aCreated = typeof a.createdAt === "number" ? a.createdAt : 0;
    const bCreated = typeof b.createdAt === "number" ? b.createdAt : 0;
    if (aCreated !== bCreated) {
      return aCreated - bCreated;
    }
    return String(a.id).localeCompare(String(b.id));
  });
}

function persistState() {
  if (!state.saveEnabled) {
    return;
  }
  localStorage.setItem(STORAGE_KEY, serializeState());
}

function hasDispatchData() {
  if (state.startTime || state.endTime) {
    return true;
  }
  return state.columns.some((column) =>
    column.observations.some((obs) => obs.text.trim())
  );
}

function markDirty() {
  state.isDirty = true;
  state.dispatchVisited = true;
}

function syncShiftUI() {
  if (startTimeInput) {
    startTimeInput.value = state.startTime ? formatTimestamp(state.startTime) : "—";
  }
  if (endTimeInput) {
    const isPending = Boolean(state.startTime && !state.endTime);
    endTimeInput.value = state.endTime
      ? formatTimestamp(state.endTime)
      : isPending
        ? "Hit end when done"
        : "—";
    endTimeInput.disabled = isPending;
  }
  if (endNote) {
    endNote.textContent = state.endAdjustedNote;
  }
  if (endField) {
    endField.classList.toggle("pending", Boolean(state.startTime && !state.endTime));
  }
  if (shiftAreaInput) {
    shiftAreaInput.value = state.area;
  }
  if (endShiftButton) {
    const isEnded = Boolean(state.endTime);
    endShiftButton.disabled = !state.startTime || isEnded;
    endShiftButton.textContent = isEnded ? "Ended" : "End";
  }
  if (startShiftButton) {
    const isActive = Boolean(state.startTime && !state.endTime);
    const isResumable = Boolean(state.endTime);
    startShiftButton.textContent = isActive ? "Started" : isResumable ? "Resume" : "Start";
    startShiftButton.disabled = isActive;
    startShiftButton.classList.toggle("primary", isActive);
    startShiftButton.classList.toggle("ghost", !isActive);
    startShiftButton.classList.toggle("start-prompt", !isActive && !isResumable);
    startShiftButton.classList.toggle("active-locked", isActive);
  }
  updateTimezoneTime();
}

function updateTimezoneTime() {
  if (!timezoneTime) {
    return;
  }
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: state.timezone || DEFAULT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  timezoneTime.textContent = formatter.format(new Date());
}

