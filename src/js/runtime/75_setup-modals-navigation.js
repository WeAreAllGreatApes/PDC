/* 75 setup modals navigation */

let versionHistoryLoaded = false;
let versionHistoryLoadInFlight = null;
let versionButtonLabelLoaded = false;
let versionButtonLabelLoadInFlight = null;
let aboutLegalLoaded = false;
let aboutLegalLoadInFlight = null;
let shortcutsLoaded = false;
let shortcutsLoadInFlight = null;
let howToExpectationsLoaded = false;
let howToExpectationsLoadInFlight = null;
let faqLoaded = false;
let faqLoadInFlight = null;
let tutorialPickerIntroLoaded = false;
let tutorialPickerIntroLoadInFlight = null;

function parseVersionHistoryMarkdown(markdownText) {
  const sections = [];
  const lines = String(markdownText || "").split(/\r?\n/);
  let currentSection = null;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    if (line.startsWith("## ")) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: line.replace(/^##\s+/, "").trim(),
        items: [],
      };
      continue;
    }
    if (line.startsWith("- ")) {
      if (!currentSection) {
        currentSection = {
          title: "Version Notes",
          items: [],
        };
      }
      currentSection.items.push(line.replace(/^-+\s+/, "").trim());
      continue;
    }
    if (currentSection && currentSection.items.length) {
      const index = currentSection.items.length - 1;
      currentSection.items[index] = `${currentSection.items[index]} ${line}`.trim();
    }
  }
  if (currentSection) {
    sections.push(currentSection);
  }
  return sections.filter((section) => section.title && section.items.length);
}

function updateVersionButtonLabelFromSections(sections) {
  if (!versionButton || !Array.isArray(sections) || !sections.length) {
    return;
  }
  const firstTitle = String(sections[0].title || "").trim();
  if (!firstTitle) {
    return;
  }
  const match = firstTitle.match(/^version\s+(.+)$/i);
  const label = match ? String(match[1]).trim() : firstTitle;
  if (!label) {
    return;
  }
  versionButton.textContent = `ver ${label}`;
}

async function ensureVersionButtonLabelLoaded() {
  if (!versionButton) {
    return;
  }
  if (versionButtonLabelLoaded) {
    return;
  }
  if (versionButtonLabelLoadInFlight) {
    await versionButtonLabelLoadInFlight;
    return;
  }
  versionButtonLabelLoadInFlight = (async () => {
    const response = await fetch(VERSION_HISTORY_PATH, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Unable to load ${VERSION_HISTORY_PATH} (${response.status})`);
    }
    const markdownText = await response.text();
    const sections = parseVersionHistoryMarkdown(markdownText);
    updateVersionButtonLabelFromSections(sections);
    versionButtonLabelLoaded = true;
  })();
  try {
    await versionButtonLabelLoadInFlight;
  } finally {
    versionButtonLabelLoadInFlight = null;
  }
}

function renderVersionHistoryStatus(message, className = "version-history-status") {
  if (!versionHistory) {
    return;
  }
  versionHistory.innerHTML = "";
  const status = document.createElement("div");
  status.className = className;
  status.textContent = message;
  versionHistory.appendChild(status);
}

function renderVersionHistoryMarkdown(markdownText) {
  if (!versionHistory) {
    return;
  }
  const sections = parseVersionHistoryMarkdown(markdownText);
  updateVersionButtonLabelFromSections(sections);
  versionHistory.innerHTML = "";
  if (!sections.length) {
    renderVersionHistoryStatus("No version entries found in the markdown file.");
    return;
  }
  sections.forEach((section) => {
    const block = document.createElement("div");
    block.className = "version-block";

    const heading = document.createElement("div");
    heading.className = "version-major";
    heading.textContent = section.title;

    const list = document.createElement("ul");
    list.className = "version-list";
    section.items.forEach((itemText) => {
      const listItem = document.createElement("li");
      listItem.textContent = itemText;
      list.appendChild(listItem);
    });

    block.appendChild(heading);
    block.appendChild(list);
    versionHistory.appendChild(block);
  });
}

async function ensureVersionHistoryLoaded() {
  if (!versionHistory) {
    return;
  }
  if (versionHistoryLoaded) {
    return;
  }
  if (versionHistoryLoadInFlight) {
    await versionHistoryLoadInFlight;
    return;
  }
  renderVersionHistoryStatus("Loading version notes...", "version-loading");
  versionHistoryLoadInFlight = (async () => {
    const response = await fetch(VERSION_HISTORY_PATH, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Unable to load ${VERSION_HISTORY_PATH} (${response.status})`);
    }
    const markdownText = await response.text();
    renderVersionHistoryMarkdown(markdownText);
    versionHistoryLoaded = true;
    versionButtonLabelLoaded = true;
  })();
  try {
    await versionHistoryLoadInFlight;
  } catch (error) {
    console.warn("[version-history] Failed to load markdown.", error);
    renderVersionHistoryStatus(
      "Unable to load version history markdown. Check content/version-history.md and try again."
    );
  } finally {
    versionHistoryLoadInFlight = null;
  }
}

function parseMarkdownSections(markdownText) {
  const sections = [];
  const lines = String(markdownText || "").split(/\r?\n/);
  let current = null;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (current) {
        current.lines.push("");
      }
      continue;
    }
    if (line.startsWith("## ")) {
      if (current) {
        sections.push(current);
      }
      current = { title: line.replace(/^##\s+/, "").trim(), lines: [] };
      continue;
    }
    if (!current) {
      current = { title: "Section", lines: [] };
    }
    current.lines.push(line);
  }
  if (current) {
    sections.push(current);
  }
  return sections.filter((section) => section.title);
}

function parseMarkdownLink(line) {
  const match = line.match(/^\[(.+)\]\((https?:\/\/.+)\)$/i);
  if (!match) {
    return null;
  }
  return { label: match[1].trim(), href: match[2].trim() };
}

function createIconSpan(iconName) {
  const iconWrap = document.createElement("span");
  iconWrap.className = "icon";
  iconWrap.setAttribute("aria-hidden", "true");
  const placeholder = document.createElement("i");
  placeholder.setAttribute("data-lucide", iconName);
  iconWrap.appendChild(placeholder);
  return iconWrap;
}

function renderAboutLegalStatus(message) {
  if (!aboutLegalContent) {
    return;
  }
  aboutLegalContent.innerHTML = "";
  const status = document.createElement("div");
  status.className = "version-loading";
  status.textContent = message;
  aboutLegalContent.appendChild(status);
}

function renderAboutLegalMarkdown(markdownText) {
  if (!aboutLegalContent) {
    return;
  }
  const sections = parseMarkdownSections(markdownText);
  aboutLegalContent.innerHTML = "";
  if (!sections.length) {
    renderAboutLegalStatus("No about/legal content found.");
    return;
  }

  sections.forEach((section) => {
    const title = section.title.toLowerCase();
    const nonEmptyLines = section.lines.filter(Boolean);
    if (!nonEmptyLines.length) {
      return;
    }

    if (title.includes("banner")) {
      const banner = document.createElement("div");
      banner.className = "about-banner";
      banner.appendChild(createIconSpan("users"));
      const text = document.createElement("span");
      text.textContent = nonEmptyLines.join(" ");
      banner.appendChild(text);
      aboutLegalContent.appendChild(banner);
      return;
    }

    if (title.includes("quote")) {
      const quote = document.createElement("blockquote");
      quote.className = "about-quote";
      const linkLine = nonEmptyLines.find((line) => parseMarkdownLink(line));
      const quoteLine = nonEmptyLines.find((line) => !parseMarkdownLink(line)) || "";
      quote.textContent = quoteLine;
      if (linkLine) {
        const parsedLink = parseMarkdownLink(linkLine);
        if (parsedLink) {
          quote.appendChild(document.createTextNode(" "));
          const anchor = document.createElement("a");
          anchor.href = parsedLink.href;
          anchor.target = "_blank";
          anchor.rel = "noreferrer";
          anchor.textContent = parsedLink.label;
          quote.appendChild(anchor);
        }
      }
      aboutLegalContent.appendChild(quote);
      return;
    }

    const sectionWrap = document.createElement("div");
    sectionWrap.className = "about-section";
    const paragraph = document.createElement("p");
    if (title.includes("legal")) {
      paragraph.appendChild(createIconSpan("scale"));
    } else if (title.includes("privacy")) {
      paragraph.appendChild(createIconSpan("globe-lock"));
    } else {
      paragraph.appendChild(createIconSpan("info"));
    }
    paragraph.appendChild(document.createTextNode(` ${nonEmptyLines.join(" ")}`));
    sectionWrap.appendChild(paragraph);
    aboutLegalContent.appendChild(sectionWrap);
  });
  refreshIcons();
}

async function ensureAboutLegalLoaded() {
  if (!aboutLegalContent) {
    return;
  }
  if (aboutLegalLoaded) {
    return;
  }
  if (aboutLegalLoadInFlight) {
    await aboutLegalLoadInFlight;
    return;
  }
  renderAboutLegalStatus("Loading about content...");
  aboutLegalLoadInFlight = (async () => {
    const response = await fetch(ABOUT_LEGAL_PATH, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Unable to load ${ABOUT_LEGAL_PATH} (${response.status})`);
    }
    const markdownText = await response.text();
    renderAboutLegalMarkdown(markdownText);
    aboutLegalLoaded = true;
  })();
  try {
    await aboutLegalLoadInFlight;
  } catch (error) {
    console.warn("[about-legal] Failed to load markdown.", error);
    renderAboutLegalStatus(
      "Unable to load about/legal content. Check content/about-legal.md and try again."
    );
  } finally {
    aboutLegalLoadInFlight = null;
  }
}

function renderShortcutsStatus(message) {
  if (!shortcutsContent) {
    return;
  }
  shortcutsContent.innerHTML = "";
  const status = document.createElement("div");
  status.className = "version-loading";
  status.textContent = message;
  shortcutsContent.appendChild(status);
}

function getShortcutGroupIcon(title) {
  const normalized = title.toLowerCase();
  if (normalized.includes("navigation") || normalized.includes("view")) return "compass";
  if (normalized.includes("create")) return "plus-square";
  if (normalized.includes("location")) return "map-pin-plus-inside";
  if (normalized.includes("search")) return "search";
  if (normalized.includes("card")) return "square-mouse-pointer";
  return "keyboard";
}

function renderShortcutsMarkdown(markdownText) {
  if (!shortcutsContent) {
    return;
  }
  const sections = parseMarkdownSections(markdownText);
  shortcutsContent.innerHTML = "";
  if (!sections.length) {
    renderShortcutsStatus("No shortcuts found in markdown.");
    return;
  }

  sections.forEach((section) => {
    const group = document.createElement("div");
    group.className = "shortcuts-group";

    const title = document.createElement("div");
    title.className = "section-title shortcuts-section-title";
    title.appendChild(createIconSpan(getShortcutGroupIcon(section.title)));
    const titleText = document.createElement("span");
    titleText.textContent = section.title;
    title.appendChild(titleText);
    group.appendChild(title);

    section.lines
      .filter((line) => line.startsWith("- "))
      .forEach((line) => {
        const entry = line.replace(/^-+\s+/, "");
        const [keysRaw, labelRaw, detailRaw] = entry.split("|").map((part) => (part || "").trim());
        if (!keysRaw || !labelRaw) {
          return;
        }
        const item = document.createElement("div");
        item.className = "modal-list-item";
        const keys = document.createElement("span");
        keys.className = "kbd";
        keys.textContent = keysRaw;
        item.appendChild(keys);

        const body = document.createElement("span");
        const label = document.createElement("span");
        label.className = "shortcut-title";
        label.textContent = labelRaw;
        body.appendChild(label);
        if (detailRaw) {
          body.appendChild(document.createTextNode(`: ${detailRaw}`));
        }
        item.appendChild(body);
        group.appendChild(item);
      });

    shortcutsContent.appendChild(group);
  });
  refreshIcons();
}

async function ensureShortcutsLoaded() {
  if (!shortcutsContent) {
    return;
  }
  if (shortcutsLoaded) {
    return;
  }
  if (shortcutsLoadInFlight) {
    await shortcutsLoadInFlight;
    return;
  }
  renderShortcutsStatus("Loading shortcuts...");
  shortcutsLoadInFlight = (async () => {
    const response = await fetch(SHORTCUTS_PATH, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Unable to load ${SHORTCUTS_PATH} (${response.status})`);
    }
    const markdownText = await response.text();
    renderShortcutsMarkdown(markdownText);
    shortcutsLoaded = true;
  })();
  try {
    await shortcutsLoadInFlight;
  } catch (error) {
    console.warn("[shortcuts] Failed to load markdown.", error);
    renderShortcutsStatus(
      "Unable to load shortcuts content. Check content/shortcuts.md and try again."
    );
  } finally {
    shortcutsLoadInFlight = null;
  }
}

function appendInlineMarkdown(target, text) {
  const source = String(text || "");
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi;
  let lastIndex = 0;
  let match;
  while ((match = linkPattern.exec(source))) {
    if (match.index > lastIndex) {
      target.appendChild(document.createTextNode(source.slice(lastIndex, match.index)));
    }
    const anchor = document.createElement("a");
    anchor.href = match[2];
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    anchor.textContent = match[1];
    target.appendChild(anchor);
    lastIndex = linkPattern.lastIndex;
  }
  if (lastIndex < source.length) {
    target.appendChild(document.createTextNode(source.slice(lastIndex)));
  }
}

function renderHowToExpectationsStatus(message) {
  if (!howToExpectationsContent) {
    return;
  }
  howToExpectationsContent.innerHTML = "";
  const status = document.createElement("div");
  status.className = "version-loading";
  status.textContent = message;
  howToExpectationsContent.appendChild(status);
}

function renderHowToExpectationsMarkdown(markdownText) {
  if (!howToExpectationsContent) {
    return;
  }
  const sections = parseMarkdownSections(markdownText);
  howToExpectationsContent.innerHTML = "";
  if (!sections.length) {
    renderHowToExpectationsStatus("No setup guidance found.");
    return;
  }
  sections.forEach((section) => {
    const normalizedTitle = String(section.title || "").trim().toLowerCase();
    const shouldCollapse =
      normalizedTitle === "before you start" || normalizedTitle === "recommended workflow";
    const block = document.createElement("div");
    block.className = shouldCollapse ? "how-to-block how-to-accordion" : "how-to-block";
    const contentWrap = document.createElement("div");
    contentWrap.className = shouldCollapse ? "how-to-accordion-body" : "how-to-body";

    let paragraphLines = [];
    let activeList = null;
    const flushParagraph = () => {
      if (!paragraphLines.length) {
        return;
      }
      const paragraph = document.createElement("p");
      paragraph.className = "how-to-paragraph";
      appendInlineMarkdown(paragraph, paragraphLines.join(" "));
      contentWrap.appendChild(paragraph);
      paragraphLines = [];
    };

    section.lines.forEach((line) => {
      if (!line) {
        flushParagraph();
        activeList = null;
        return;
      }
      if (line.startsWith("- ")) {
        flushParagraph();
        if (!activeList) {
          activeList = document.createElement("ul");
          activeList.className = "how-to-list";
          contentWrap.appendChild(activeList);
        }
        const item = document.createElement("li");
        appendInlineMarkdown(item, line.replace(/^-+\s+/, ""));
        activeList.appendChild(item);
        return;
      }
      activeList = null;
      paragraphLines.push(line);
    });
    flushParagraph();
    if (shouldCollapse) {
      const accordion = document.createElement("details");
      accordion.className = "how-to-accordion-item";
      const summary = document.createElement("summary");
      summary.className = "how-to-heading how-to-accordion-summary";
      summary.textContent = section.title;
      accordion.appendChild(summary);
      accordion.appendChild(contentWrap);
      block.appendChild(accordion);
    } else {
      const heading = document.createElement("h4");
      heading.className = "how-to-heading";
      heading.textContent = section.title;
      block.appendChild(heading);
      block.appendChild(contentWrap);
    }
    howToExpectationsContent.appendChild(block);
  });
}

async function ensureHowToExpectationsLoaded() {
  if (!howToExpectationsContent) {
    return;
  }
  if (howToExpectationsLoaded) {
    return;
  }
  if (howToExpectationsLoadInFlight) {
    await howToExpectationsLoadInFlight;
    return;
  }
  renderHowToExpectationsStatus("Loading setup guidance...");
  howToExpectationsLoadInFlight = (async () => {
    const response = await fetch(HOW_TO_EXPECTATIONS_PATH, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Unable to load ${HOW_TO_EXPECTATIONS_PATH} (${response.status})`);
    }
    const markdownText = await response.text();
    renderHowToExpectationsMarkdown(markdownText);
    howToExpectationsLoaded = true;
  })();
  try {
    await howToExpectationsLoadInFlight;
  } catch (error) {
    console.warn("[how-to] Failed to load expectations markdown.", error);
    renderHowToExpectationsStatus(
      "Unable to load setup guidance. Check content/how-to-expectations.md and try again."
    );
  } finally {
    howToExpectationsLoadInFlight = null;
  }
}

function parseFaqMarkdown(markdownText) {
  const sections = [];
  const lines = String(markdownText || "").split(/\r?\n/);
  let currentSection = null;
  let currentItem = null;
  const pushItem = () => {
    if (!currentSection || !currentItem || !currentItem.question) {
      return;
    }
    currentItem.answerLines = (currentItem.answerLines || []).filter(
      (line, index, arr) => line || (index > 0 && arr[index - 1])
    );
    currentSection.items.push(currentItem);
    currentItem = null;
  };
  const pushSection = () => {
    pushItem();
    if (currentSection && currentSection.title && currentSection.items.length) {
      sections.push(currentSection);
    }
    currentSection = null;
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (line.startsWith("## ")) {
      pushSection();
      currentSection = { title: line.replace(/^##\s+/, ""), items: [] };
      return;
    }
    if (!currentSection) {
      currentSection = { title: "General", items: [] };
    }
    if (line.startsWith("### ")) {
      pushItem();
      currentItem = {
        question: line.replace(/^###\s+/, "").trim(),
        answerLines: [],
      };
      return;
    }
    if (line.startsWith("- Q:")) {
      pushItem();
      currentItem = {
        question: line.replace(/^-+\s*Q:\s*/i, "").trim(),
        answerLines: [],
      };
      return;
    }
    if (!currentItem) {
      return;
    }
    if (line.startsWith("A:")) {
      currentItem.answerLines.push(line.replace(/^A:\s*/i, "").trim());
      return;
    }
    currentItem.answerLines.push(line);
  });

  pushSection();
  return sections;
}

function renderFaqStatus(message) {
  if (!faqContent) {
    return;
  }
  faqContent.innerHTML = "";
  const status = document.createElement("div");
  status.className = "version-loading";
  status.textContent = message;
  faqContent.appendChild(status);
}

function renderFaqMarkdown(markdownText) {
  if (!faqContent) {
    return;
  }
  const sections = parseFaqMarkdown(markdownText);
  faqContent.innerHTML = "";
  if (!sections.length) {
    renderFaqStatus("No FAQ entries found.");
    return;
  }

  sections.forEach((section) => {
    const sectionBlock = document.createElement("div");
    sectionBlock.className = "faq-section";
    const heading = document.createElement("h4");
    heading.className = "faq-section-title";
    heading.textContent = section.title;
    sectionBlock.appendChild(heading);

    section.items.forEach((item) => {
      const details = document.createElement("details");
      details.className = "faq-item";
      const summary = document.createElement("summary");
      summary.className = "faq-question";
      summary.textContent = item.question;
      details.appendChild(summary);

      const answer = document.createElement("div");
      answer.className = "faq-answer";
      let paragraphLines = [];
      let activeList = null;
      const flushParagraph = () => {
        if (!paragraphLines.length) {
          return;
        }
        const paragraph = document.createElement("p");
        appendInlineMarkdown(paragraph, paragraphLines.join(" "));
        answer.appendChild(paragraph);
        paragraphLines = [];
      };
      (item.answerLines || []).forEach((line) => {
        if (!line) {
          flushParagraph();
          activeList = null;
          return;
        }
        if (line.startsWith("- ")) {
          flushParagraph();
          if (!activeList) {
            activeList = document.createElement("ul");
            activeList.className = "faq-answer-list";
            answer.appendChild(activeList);
          }
          const li = document.createElement("li");
          appendInlineMarkdown(li, line.replace(/^-+\s+/, ""));
          activeList.appendChild(li);
          return;
        }
        activeList = null;
        paragraphLines.push(line);
      });
      flushParagraph();
      details.appendChild(answer);
      sectionBlock.appendChild(details);
    });

    faqContent.appendChild(sectionBlock);
  });
}

async function ensureFaqLoaded() {
  if (!faqContent) {
    return;
  }
  if (faqLoaded) {
    return;
  }
  if (faqLoadInFlight) {
    await faqLoadInFlight;
    return;
  }
  renderFaqStatus("Loading FAQ...");
  faqLoadInFlight = (async () => {
    const response = await fetch(FAQ_PATH, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Unable to load ${FAQ_PATH} (${response.status})`);
    }
    const markdownText = await response.text();
    renderFaqMarkdown(markdownText);
    faqLoaded = true;
  })();
  try {
    await faqLoadInFlight;
  } catch (error) {
    console.warn("[faq] Failed to load markdown.", error);
    renderFaqStatus("Unable to load FAQ content. Check content/faq.md and try again.");
  } finally {
    faqLoadInFlight = null;
  }
}

async function ensureHowToLoaded() {
  await Promise.all([ensureHowToExpectationsLoaded(), ensureFaqLoaded()]);
}

async function ensureTutorialPickerIntroLoaded() {
  if (!tutorialPickerIntroText) {
    return;
  }
  if (tutorialPickerIntroLoaded) {
    return;
  }
  if (tutorialPickerIntroLoadInFlight) {
    await tutorialPickerIntroLoadInFlight;
    return;
  }
  tutorialPickerIntroLoadInFlight = (async () => {
    const response = await fetch(TUTORIAL_PICKER_INTRO_PATH, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Unable to load ${TUTORIAL_PICKER_INTRO_PATH} (${response.status})`);
    }
    const text = (await response.text()).replace(/\s+/g, " ").trim();
    tutorialPickerIntroText.textContent = text || tutorialPickerIntroText.textContent;
    tutorialPickerIntroLoaded = true;
  })();
  try {
    await tutorialPickerIntroLoadInFlight;
  } catch (error) {
    console.warn("[tutorial-picker] Failed to load intro markdown.", error);
  } finally {
    tutorialPickerIntroLoadInFlight = null;
  }
}

function bindModalAndNavigationSection() {
  if (vehicleMake) {
    vehicleMake.addEventListener("input", () => {
      syncVehicleMakeAndModels();
    });
    vehicleMake.addEventListener("change", () => {
      syncVehicleMakeAndModels();
    });
    vehicleMake.addEventListener("blur", () => {
      syncVehicleMakeAndModels();
    });
    addTabCycleDatalist(vehicleMake, makeOptions, {
      allowPrefixMatch: false,
    });
    addCommitOnEnter(vehicleMake);
  }

  if (vehicleModel) {
    vehicleModel.addEventListener("input", () => {
      const models = getVehicleModelsForMake(vehicleMake.value);
      const match = models.find((item) => item.model === vehicleModel.value);
      if (match) {
        vehicleBody.value = match.body;
      }
      updateVehicleModalValidationWarnings();
    });
    vehicleModel.addEventListener("change", () => {
      updateVehicleModalValidationWarnings();
    });
    vehicleModel.addEventListener("blur", () => {
      updateVehicleModalValidationWarnings();
    });
    addTabCycleDatalist(vehicleModel, modelOptions, {
      allowPrefixMatch: false,
    });
    addCommitOnEnter(vehicleModel);
  }

  if (vehicleBody) {
    if (bodyOptions) {
      addTabCycleDatalist(vehicleBody, bodyOptions, {
        allowPrefixMatch: false,
      });
    }
    vehicleBody.addEventListener("input", () => {
      updateVehicleModalValidationWarnings();
    });
    vehicleBody.addEventListener("change", () => {
      updateVehicleModalValidationWarnings();
    });
    vehicleBody.addEventListener("blur", () => {
      updateVehicleModalValidationWarnings();
    });
    addCommitOnEnter(vehicleBody);
  }

  if (vehicleClose) {
    vehicleClose.addEventListener("click", () => {
      closeVehicleModal();
    });
  }
  addUppercaseInputBehavior(vehiclePlate);

  if (vehicleAdd) {
    vehicleAdd.addEventListener("click", () => {
      if (!vehicleTarget) {
        closeVehicleModal();
        return;
      }
      const plate = formatPlate(vehiclePlate.value || "");
      const vehicleInfo = normalizeVehicleInfo({
        plateVisible: Boolean(plate),
        plate,
        reason: "",
        state: vehicleState.value,
        color: vehicleColor.value,
        make: vehicleMake.value,
        model: vehicleModel.value,
        body: vehicleBody.value,
      });
      if (vehicleTarget && typeof vehicleTarget === "object" && vehicleTarget.kind === "note-vehicle-info") {
        const column = state.columns.find((col) => col.id === vehicleTarget.columnId);
        const obs = column?.observations?.find((item) => item.id === vehicleTarget.obsId);
        if (obs) {
          obs.vehicleInfo = vehicleInfo;
          markDirty();
          renderColumns();
          persistState();
          updateSummary();
          renderMapPins();
        }
        closeVehicleModal();
        return;
      }
      const vehicleString = formatVehicleInfoForSummary(vehicleInfo);
      if (!vehicleString) {
        closeVehicleModal();
        return;
      }
      const current = vehicleTarget.value.trim();
      vehicleTarget.value = current ? `${current}\n${vehicleString}` : vehicleString;
      updateFormattedText();
      closeVehicleModal();
    });
  }

  if (vehicleState) {
    addTabCycleDatalist(vehicleState, stateOptions);
    addCommitOnEnter(vehicleState);
  }

  if (vehicleColor) {
    vehicleColor.addEventListener("input", () => {
      updateVehicleModalValidationWarnings();
    });
    vehicleColor.addEventListener("change", () => {
      updateVehicleModalValidationWarnings();
    });
    vehicleColor.addEventListener("blur", () => {
      updateVehicleModalValidationWarnings();
    });
    addTabCycleDatalist(vehicleColor, colorOptions, { allowPrefixMatch: false });
    addCommitOnEnter(vehicleColor);
  }
  addLastFieldToPrimaryActionTabbing(vehicleBody, vehicleAdd, {
    isEnabled: () => isModalOpen(vehicleModal),
  });
  addLastFieldToPrimaryActionTabbing(locationSearchInput, locationSetButton, {
    isEnabled: () =>
      isModalOpen(locationModal) &&
      locationSearchState.results.length === 0,
  });
  addLastFieldToPrimaryActionTabbing(mapCardMetaLabel, mapCardMetaSave, {
    isEnabled: () => isModalOpen(mapCardMetaModal),
  });

  if (deleteCancel) {
    deleteCancel.addEventListener("click", () => {
      closeDeleteModal();
    });
  }

  if (deleteConfirm) {
    deleteConfirm.addEventListener("click", () => {
      if (!deleteTarget) {
        closeDeleteModal();
        return;
      }
      if (deleteTarget.kind === "note") {
        const column = state.columns.find((col) => col.id === deleteTarget.columnId);
        if (column) {
          if (
            pendingVehicleInfoNoteTarget &&
            pendingVehicleInfoNoteTarget.columnId === deleteTarget.columnId &&
            pendingVehicleInfoNoteTarget.obsId === deleteTarget.obsId
          ) {
            pendingVehicleInfoNoteTarget = null;
          }
          column.observations = column.observations.filter(
            (obs) => obs.id !== deleteTarget.obsId
          );
          if (isNoteSelected(deleteTarget.columnId, deleteTarget.obsId)) {
            clearSelection();
          }
          markDirty();
          renderColumns();
          persistState();
          updateSummary();
        }
      } else if (deleteTarget.kind === "column") {
        state.columns = state.columns.filter((col) => col.id !== deleteTarget.columnId);
        if (state.selection?.columnId === deleteTarget.columnId) {
          clearSelection();
        }
        markDirty();
        renderColumns();
        persistState();
        updateSummary();
      } else if (deleteTarget.kind === "location") {
        if (deleteTarget.target) {
          applyLocationToTarget(deleteTarget.target, null);
        }
      }
      closeDeleteModal();
    });
  }

  if (reverseGeocodeCancel) {
    reverseGeocodeCancel.addEventListener("click", () => {
      closeReverseGeocodeModal(false);
    });
  }

  if (reverseGeocodeConfirm) {
    reverseGeocodeConfirm.addEventListener("click", () => {
      closeReverseGeocodeModal(true);
    });
  }

  if (shortcutsButton) {
    shortcutsButton.addEventListener("click", () => {
      ensureShortcutsLoaded()
        .catch((error) => {
          console.warn("[shortcuts] Unable to preload shortcut content.", error);
        })
        .finally(() => {
          openShortcutsModal();
        });
    });
  }

  if (shortcutsClose) {
    shortcutsClose.addEventListener("click", () => {
      closeShortcutsModal();
    });
  }

  if (shortcutsModal) {
    shortcutsModal.addEventListener("click", (event) => {
      if (event.target.classList.contains("modal-backdrop")) {
        closeShortcutsModal();
      }
    });
  }

  if (searchButton) {
    searchButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openSearchModal();
    });
  }

  if (searchClose) {
    searchClose.addEventListener("click", () => {
      closeSearchModal();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderSearchResults(searchInput.value);
    });
    searchInput.addEventListener("keydown", handleSearchKeydown);
  }

  if (searchModal) {
    searchModal.addEventListener("keydown", handleSearchKeydown);
    searchModal.addEventListener("click", (event) => {
      if (event.target.classList.contains("modal-backdrop")) {
        closeSearchModal();
      }
    });
  }

  if (locationClose) {
    locationClose.addEventListener("click", () => {
      closeLocationModal();
    });
  }

  if (locationDropPin) {
    locationDropPin.addEventListener("click", () => {
      const target = locationModalTarget ? { ...locationModalTarget } : null;
      if (!target) {
        return;
      }
      locationModalShouldRestoreView = false;
      closeLocationModal();
      if (target.kind === "new-card-lookup") {
        startMapDragPinCardFlow();
        return;
      }
      startLocationDropPinMode(target);
    });
  }

  if (locationModal) {
    locationModal.addEventListener("click", (event) => {
      if (event.target.classList.contains("modal-backdrop")) {
        event.preventDefault();
      }
    });
  }

  if (mapCardMetaModal) {
    mapCardMetaModal.addEventListener("click", (event) => {
      if (event.target.classList.contains("modal-backdrop")) {
        closeMapCardMetaModal();
      }
    });
  }
  if (applyCardColorsModal) {
    applyCardColorsModal.addEventListener("click", (event) => {
      if (event.target.classList.contains("modal-backdrop")) {
        closeApplyCardColorsModal();
      }
    });
  }

  if (locationResults) {
    locationResults.addEventListener("keydown", (event) => {
      if (event.key === "Tab") {
        const options = Array.from(
          locationResults.querySelectorAll(".location-result")
        );
        if (!options.length) {
          return;
        }
        event.preventDefault();
        const current = document.activeElement;
        const currentIndex = options.indexOf(current);
        let nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;
        if (currentIndex === -1) {
          nextIndex = event.shiftKey ? options.length - 1 : 0;
        } else if (nextIndex < 0) {
          nextIndex = options.length - 1;
        } else if (nextIndex >= options.length) {
          nextIndex = 0;
        }
        const nextOption = options[nextIndex];
        if (nextOption) {
          nextOption.focus();
          highlightLocationResult(nextIndex);
        }
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const options = Array.from(
          locationResults.querySelectorAll(".location-result")
        );
        if (!options.length) {
          return;
        }
        const current = document.activeElement;
        let currentIndex = options.indexOf(current);
        if (currentIndex === -1) {
          currentIndex = locationSearchState.activeIndex;
        }
        if (currentIndex === -1) {
          currentIndex = 0;
        }
        const delta = event.key === "ArrowDown" ? 1 : -1;
        let nextIndex = currentIndex + delta;
        if (nextIndex < 0) {
          nextIndex = options.length - 1;
        } else if (nextIndex >= options.length) {
          nextIndex = 0;
        }
        const nextOption = options[nextIndex];
        if (nextOption) {
          nextOption.focus();
          highlightLocationResult(nextIndex);
        }
        return;
      }
    });
  }

  if (locationLimitDetail) {
    locationLimitDetail.addEventListener("click", () => {
      if (!state.mapSettings.city) {
        focusMapSettings();
      }
    });
  }

  if (locationSearchInput) {
    locationSearchInput.addEventListener("input", (event) => {
      const value = event.target.value || "";
      if (locationSearchTimer) {
        window.clearTimeout(locationSearchTimer);
      }
      locationSearchTimer = window.setTimeout(() => {
        runLocationSearch(value);
      }, 300);
    });
    locationSearchInput.addEventListener("keydown", (event) => {
      if (event.key === "Tab" && locationSearchState.results.length) {
        event.preventDefault();
        const options = Array.from(
          locationResults?.querySelectorAll(".location-result") || []
        );
        if (!options.length) {
          return;
        }
        const nextIndex = event.shiftKey ? options.length - 1 : 0;
        const nextOption = options[nextIndex];
        if (nextOption) {
          nextOption.focus();
          highlightLocationResult(nextIndex);
        }
        return;
      }
      if (event.key === "ArrowDown" && locationSearchState.results.length) {
        event.preventDefault();
        const first = locationResults?.querySelector(".location-result");
        if (first) {
          first.focus();
          highlightLocationResult(0);
        }
        return;
      }
      if (event.key === "Enter" && locationSearchState.results.length) {
        event.preventDefault();
        const targetIndex =
          locationSearchState.activeIndex !== -1 ? locationSearchState.activeIndex : 0;
        selectLocationResult(locationSearchState.results[targetIndex], targetIndex, {
          source: "keyboard",
          focusSetButton: true,
        });
      }
    });
  }

  if (locationSetButton) {
    locationSetButton.addEventListener("click", () => {
      applyPendingLocationFromModal();
    });
  }

  if (locationClearButton) {
    locationClearButton.addEventListener("click", () => {
      if (!locationSearchInput) {
        return;
      }
      locationSearchInput.value = "";
      locationSearchState.results = [];
      locationSearchState.activeIndex = -1;
      locationSearchState.selectedIndex = -1;
      locationResults.innerHTML = "<div class=\"search-empty\">Start typing to search.</div>";
      clearLocationSearchMarkers();
      pendingLocation = null;
      if (locationSetButton) {
        locationSetButton.disabled = true;
      }
      if (locationClearButton) {
        locationClearButton.disabled = true;
      }
      centerLocationPreviewMap();
      locationSearchInput.focus();
    });
  }

  if (mapCardMetaCancel) {
    mapCardMetaCancel.addEventListener("click", () => {
      closeMapCardMetaModal({
        discardDraft: mapCardMetaDiscardOnCancel,
      });
    });
  }
  if (mapCardMetaSkip) {
    mapCardMetaSkip.addEventListener("click", () => {
      closeMapCardMetaModal();
    });
  }
  if (mapCardMetaSave) {
    mapCardMetaSave.addEventListener("click", () => {
      saveMapCardMetaModal();
    });
  }
  if (mapCardMetaLabel) {
    mapCardMetaLabel.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        saveMapCardMetaModal();
      }
    });
  }
  if (applyCardColorsAll) {
    applyCardColorsAll.addEventListener("click", () => {
      openApplyCardColorsModal();
    });
  }
  if (applyCardColorsCancel) {
    applyCardColorsCancel.addEventListener("click", () => {
      closeApplyCardColorsModal();
    });
  }
  if (applyCardColorsConfirm) {
    applyCardColorsConfirm.addEventListener("click", () => {
      applyCardColorsToAllColumns();
      closeApplyCardColorsModal();
    });
  }
  if (saveInfoButton) {
    saveInfoButton.addEventListener("click", () => {
      openSaveInfoModal();
    });
  }

  if (saveInfoClose) {
    saveInfoClose.addEventListener("click", () => {
      closeSaveInfoModal();
    });
  }

  if (versionButton) {
    ensureVersionButtonLabelLoaded().catch((error) => {
      console.warn("[version-history] Unable to load version button label.", error);
    });
    versionButton.addEventListener("click", async () => {
      await ensureVersionHistoryLoaded();
      openVersionModal();
    });
  }

  if (versionClose) {
    versionClose.addEventListener("click", () => {
      closeVersionModal();
    });
  }

  if (versionModal) {
    versionModal.addEventListener("click", (event) => {
      if (event.target.classList.contains("modal-backdrop")) {
        closeVersionModal();
      }
    });
    versionModal.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeVersionModal();
      }
    });
  }

  const openTutorialPicker = async () => {
    try {
      try {
        await ensureTutorialPickerIntroLoaded();
      } catch (error) {
        console.warn("[tutorial-picker] Intro content unavailable.", error);
      }
      await loadTutorialCatalog({ force: true });
      renderTutorialList();
      openTutorialPickerModal();
    } catch (error) {
      window.alert(error.message || "Unable to load tutorial catalog.");
    }
  };

  const openHowTo = async () => {
    try {
      await ensureHowToLoaded();
      openHowToModal();
    } catch (error) {
      window.alert(error.message || "Unable to load How to Use content.");
    }
  };

  if (tutorialButton) {
    tutorialButton.addEventListener("click", openHowTo);
  }
  if (helpButton) {
    helpButton.addEventListener("click", openHowTo);
  }
  if (aboutHowToButton) {
    aboutHowToButton.addEventListener("click", openHowTo);
  }
  if (tutorialCtaButton) {
    tutorialCtaButton.addEventListener("click", openTutorialPicker);
  }
  if (welcomeAboutButton) {
    welcomeAboutButton.addEventListener("click", () => {
      handleTabSwitch("about");
    });
  }
  if (aboutTutorialButton) {
    aboutTutorialButton.addEventListener("click", openTutorialPicker);
  }
  if (howToClose) {
    howToClose.addEventListener("click", () => {
      closeHowToModal();
    });
  }
  if (howToTutorialCta) {
    howToTutorialCta.addEventListener("click", async () => {
      closeHowToModal();
      await openTutorialPicker();
    });
  }
  if (howToModal) {
    howToModal.addEventListener("click", (event) => {
      if (event.target.classList.contains("modal-backdrop")) {
        closeHowToModal();
      }
    });
    howToModal.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeHowToModal();
      }
    });
  }

  ensureAboutLegalLoaded().catch((error) => {
    console.warn("[about-legal] Unable to initialize about content.", error);
  });
  ensureHowToLoaded().catch((error) => {
    console.warn("[how-to] Unable to initialize How to Use content.", error);
  });
  ensureTutorialPickerIntroLoaded().catch((error) => {
    console.warn("[tutorial-picker] Unable to initialize intro content.", error);
  });

  if (tutorialPickerClose) {
    tutorialPickerClose.addEventListener("click", () => {
      closeTutorialPickerModal();
    });
  }

  if (tutorialStart) {
    tutorialStart.addEventListener("click", () => {
      closeTutorialWelcomeModal();
      startActiveTour({ startIndex: pendingTourStartIndex });
    });
  }
  if (tutorialWelcomeBack) {
    tutorialWelcomeBack.addEventListener("click", async () => {
      closeTutorialWelcomeModal();
      try {
        await loadTutorialCatalog({ force: true });
        renderTutorialList();
        openTutorialPickerModal();
      } catch (error) {
        window.alert(error.message || "Unable to load tutorial catalog.");
      }
    });
  }

  if (tutorialCompleteClose) {
    tutorialCompleteClose.addEventListener("click", () => {
      closeTutorialCompleteModal();
    });
  }
  if (tutorialTakeAnother) {
    tutorialTakeAnother.addEventListener("click", async () => {
      closeTutorialCompleteModal();
      try {
        await loadTutorialCatalog({ force: true });
        renderTutorialList();
        openTutorialPickerModal();
      } catch (error) {
        window.alert(error.message || "Unable to load tutorial catalog.");
      }
    });
  }

}
