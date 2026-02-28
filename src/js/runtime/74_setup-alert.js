/* 74 setup alert */

function bindAlertSection() {
  if (formatAlertButton && formatSaluteButton) {
    setFormatMode("SALUTE");
    formatAlertButton.addEventListener("click", () => setFormatMode("ALERTA"));
    formatSaluteButton.addEventListener("click", () => setFormatMode("SALUTE"));
  }

  if (formatShortButton && formatLongButton) {
    formatShortButton.addEventListener("click", () => {
      labelMode = "short";
      formatShortButton.classList.add("active");
      formatLongButton.classList.remove("active");
      updateFormattedText();
    });
    formatLongButton.addEventListener("click", () => {
      labelMode = "long";
      formatLongButton.classList.add("active");
      formatShortButton.classList.remove("active");
      updateFormattedText();
    });
  }


  if (copyFormatButton) {
    copyFormatButton.addEventListener("click", async () => {
      const text = formatOutput.value;
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
        formatOutput.focus();
        formatOutput.select();
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
        copyFormatStatus.textContent = "Copied to clipboard";
        copyFormatStatus.classList.add("show", "flash");
        copyFormatButton.textContent = "Copied";
        setTimeout(() => {
          copyFormatButton.textContent = "Copy Text";
          copyFormatStatus.classList.remove("flash");
        }, 1200);
        setTimeout(() => {
          copyFormatStatus.classList.remove("show");
          copyFormatStatus.textContent = "";
        }, 1800);
      } else {
        copyFormatStatus.textContent = "Clipboard blocked. Press Ctrl+C / Cmd+C.";
        copyFormatStatus.classList.add("show", "flash");
        setTimeout(() => {
          copyFormatStatus.classList.remove("flash");
        }, 1800);
      }
    });
  }

  if (clearFormatButton) {
    clearFormatButton.addEventListener("click", () => {
      formatFields.querySelectorAll("textarea").forEach((input) => {
        input.value = "";
      });
      formatOutput.value = "";
      if (copyFormatStatus) {
        copyFormatStatus.classList.remove("show", "flash");
        copyFormatStatus.textContent = "";
      }
    });
  }

}

