/*
  Alert tab (SALUTE/ALERTA) formatter UI
  Transitional split from the previous runtime monolith for maintainability.
*/

function renderFormatFields(formatKey) {
  formatFields.innerHTML = "";
  const fields = FORMAT_DEFS[formatKey];
  fields.forEach((field, index) => {
    const fieldRow = document.createElement("div");
    fieldRow.className = "format-field";

    const letter = document.createElement("div");
    letter.className = "format-letter";
    letter.textContent = field.letter;

    const textWrap = document.createElement("div");
    const label = document.createElement("label");
    label.textContent = field.label;
    if (field.isTime) {
      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "inline-button";
      addButton.textContent = "Add Current";
      addButton.addEventListener("click", () => {
        const stamp = formatShortTimestamp(new Date());
        if (input.value.trim()) {
          input.value = `${input.value.trim()} ${stamp}`;
        } else {
          input.value = stamp;
        }
        updateFormattedText();
      });
      label.appendChild(addButton);
    }
    const input = document.createElement("textarea");
    input.rows = 2;
    input.dataset.letter = field.letter;
    input.dataset.short = field.short || field.letter;
    input.dataset.long = field.long || field.label;
    input.dataset.index = String(index);
    input.addEventListener("input", updateFormattedText);

    textWrap.appendChild(label);
    if (field.helper) {
      const helper = document.createElement("span");
      helper.className = "format-helper-inline";
      helper.textContent = ` ${field.helper}`;
      label.appendChild(helper);
    }
    if (field.vehicle) {
      const vehicleButton = document.createElement("button");
      vehicleButton.type = "button";
      vehicleButton.className = "inline-button";
      vehicleButton.textContent = "Add Vehicle";
      vehicleButton.addEventListener("click", () => {
        openVehicleModal(input);
      });
      label.appendChild(vehicleButton);
    }
    if (field.pills && field.pills.length) {
      const pillWrap = document.createElement("div");
      pillWrap.className = "format-pills";
      field.pills.forEach((pill) => {
        const pillButton = document.createElement("button");
        pillButton.type = "button";
        pillButton.className = "pill-button";
        pillButton.textContent = pill;
        pillButton.addEventListener("click", () => {
          const current = input.value.trim();
          input.value = current ? `${current}, ${pill}` : pill;
          updateFormattedText();
        });
        pillWrap.appendChild(pillButton);
      });
      textWrap.appendChild(pillWrap);
    }
    textWrap.appendChild(input);

    fieldRow.appendChild(letter);
    fieldRow.appendChild(textWrap);
    formatFields.appendChild(fieldRow);
  });
  updateFormattedText();
}

function updateFormattedText() {
  const lines = [];
  formatFields.querySelectorAll("textarea").forEach((input) => {
    const text = input.value.trim() || "Unknown";
    const label = labelMode === "long" ? input.dataset.long : input.dataset.short;
    lines.push(`${label}-${text}`);
  });
  formatOutput.value = lines.join("\n");
}

function setFormatMode(mode) {
  const isAlert = mode === "ALERTA";
  currentFormatMode = mode;
  formatAlertButton.classList.toggle("active", isAlert);
  formatSaluteButton.classList.toggle("active", !isAlert);
  alertDesc.classList.toggle("hidden", !isAlert);
  saluteDesc.classList.toggle("hidden", isAlert);
  renderFormatFields(mode);
}

