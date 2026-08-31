const COMPONENT_FETCH_HEADERS = {
  "Content-Type": "text/html",
};

function getPackagedMarkup(path) {
  const resources = window.__PDC_PACKAGED_RESOURCES__;
  const markup = resources && resources[path];
  return typeof markup === "string" ? markup : null;
}

async function loadMarkup(path) {
  const packagedMarkup = getPackagedMarkup(path);
  if (packagedMarkup !== null) {
    return packagedMarkup;
  }
  const response = await fetch(path, { headers: COMPONENT_FETCH_HEADERS });
  if (!response.ok) {
    throw new Error(`Failed to load component partial: ${path} (${response.status})`);
  }
  return response.text();
}

export async function injectComponent({ slotSelector, path }) {
  const slot = document.querySelector(slotSelector);
  if (!slot) {
    throw new Error(`Missing component slot: ${slotSelector}`);
  }
  slot.innerHTML = await loadMarkup(path);
}

export async function composeComponentGroup(definitions) {
  const markups = await Promise.all(definitions.map((definition) => loadMarkup(definition.path)));
  definitions.forEach((definition, index) => {
    const slot = document.querySelector(definition.slotSelector);
    if (!slot) {
      throw new Error(`Missing component slot: ${definition.slotSelector}`);
    }
    slot.innerHTML = markups[index];
  });
}

export async function composeAllGroups(groups) {
  for (const group of groups) {
    await composeComponentGroup(group);
  }
}
