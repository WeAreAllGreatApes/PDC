/*
  Core shared state, config, selectors, and cross-view helpers
  Transitional split from the previous runtime monolith for maintainability.
*/

/*
  Transitional runtime module.
  The app shell is now composed from tab/view partials before this file loads.
  Keep behavior changes here minimal until runtime logic is split by section modules.
*/

function getRuntimeConfig() {
  const candidate =
    typeof window !== "undefined" &&
    window.__PDC_CONFIG__ &&
    typeof window.__PDC_CONFIG__ === "object"
      ? window.__PDC_CONFIG__
      : {};
  return candidate;
}

function getBooleanConfig(rawValue, fallback) {
  if (rawValue === undefined) {
    return fallback;
  }
  return Boolean(rawValue);
}

function getStringConfig(rawValue, fallback) {
  const value = String(rawValue === undefined ? fallback : rawValue).trim();
  return value || fallback;
}

function getNumberConfig(rawValue, fallback) {
  const next = Number(rawValue);
  return Number.isFinite(next) ? next : fallback;
}

function getStringArrayConfig(rawValue, fallback) {
  if (!Array.isArray(rawValue)) {
    return Array.from(fallback);
  }
  const values = rawValue.map((item) => String(item || "").trim()).filter(Boolean);
  return values.length ? values : Array.from(fallback);
}

function normalizeMapStyles(rawStyles, fallbackStyles) {
  if (!Array.isArray(rawStyles) || !rawStyles.length) {
    return fallbackStyles;
  }
  const next = rawStyles
    .map((style) => ({
      id: String(style?.id || "").trim(),
      label: String(style?.label || "").trim(),
      url: String(style?.url || "").trim(),
      attribution: String(style?.attribution || "").trim(),
      maxZoom: getNumberConfig(style?.maxZoom, 19),
    }))
    .filter((style) => style.id && style.label && style.url);
  return next.length ? next : fallbackStyles;
}

const FALLBACK_MAP_STYLES = [
  {
    id: "clean",
    label: "Clean",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
      '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  {
    id: "osm",
    label: "Default",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
];
const runtimeConfig = getRuntimeConfig();
const STORAGE_KEY = getStringConfig(runtimeConfig.storage?.stateKey, "pdc_dispatch_state");
const VIEW_STATE_KEY = getStringConfig(runtimeConfig.storage?.viewStateKey, "pdc_view_state");
const DEFAULT_TIMEZONE = getStringConfig(runtimeConfig.timezone?.default, "America/Chicago");
const MAP_SETTINGS_KEY = getStringConfig(runtimeConfig.storage?.mapSettingsKey, "pdc_map_settings");
const COMPLETED_TOURS_KEY = getStringConfig(
  runtimeConfig.storage?.completedToursKey,
  "pdc_completed_tours"
);
const TOUR_PROGRESS_KEY = getStringConfig(
  runtimeConfig.storage?.tourProgressKey,
  "pdc_tour_progress"
);
const TOUR_MANIFEST_PATH = getStringConfig(
  runtimeConfig.tours?.manifestPath,
  "tours/index.json"
);
const VERSION_HISTORY_PATH = getStringConfig(
  runtimeConfig.content?.versionHistoryPath,
  "content/version-history.md"
);
const ABOUT_LEGAL_PATH = getStringConfig(
  runtimeConfig.content?.aboutLegalPath,
  "content/about-legal.md"
);
const SHORTCUTS_PATH = getStringConfig(
  runtimeConfig.content?.shortcutsPath,
  "content/shortcuts.md"
);
const TUTORIAL_PICKER_INTRO_PATH = getStringConfig(
  runtimeConfig.content?.tutorialPickerIntroPath,
  "content/tutorial-picker-intro.md"
);
const HOW_TO_EXPECTATIONS_PATH = getStringConfig(
  runtimeConfig.content?.howToExpectationsPath,
  "content/how-to-expectations.md"
);
const FAQ_PATH = getStringConfig(runtimeConfig.content?.faqPath, "content/faq.md");
const GEO_BASE_URL = String(runtimeConfig.apis?.geocoding?.baseUrl || "").trim();
const GEO_API_ENABLED = getBooleanConfig(runtimeConfig.apis?.geocoding?.enabled, true);
const MAP_FEATURE_FLAG = getBooleanConfig(runtimeConfig.features?.map, true);
const SPLIT_VIEW_FLAG = getBooleanConfig(runtimeConfig.features?.splitView, true);
const LOCATION_TAGGING_FLAG = getBooleanConfig(runtimeConfig.features?.locationTagging, true);
const MAP_FEATURE_ENABLED = MAP_FEATURE_FLAG && GEO_API_ENABLED && Boolean(GEO_BASE_URL);
const SPLIT_VIEW_ENABLED = SPLIT_VIEW_FLAG && MAP_FEATURE_ENABLED;
const LOCATION_TAGGING_ENABLED = LOCATION_TAGGING_FLAG && MAP_FEATURE_ENABLED;
if (!MAP_FEATURE_ENABLED) {
  console.warn(
    "[config] Map/location features disabled. Configure apis.geocoding.enabled + apis.geocoding.baseUrl to enable them."
  );
}
const MAP_STYLES = normalizeMapStyles(runtimeConfig.map?.styles, FALLBACK_MAP_STYLES);
const DEFAULT_MAP_CENTER = {
  lat: getNumberConfig(runtimeConfig.map?.defaultCenter?.lat, 44.9778),
  lon: getNumberConfig(runtimeConfig.map?.defaultCenter?.lon, -93.265),
};
const DEFAULT_MAP_RADIUS_MILES = getNumberConfig(runtimeConfig.map?.defaultRadiusMiles, 50);
const DEFAULT_MAP_STYLE = getStringConfig(runtimeConfig.map?.defaultStyle, MAP_STYLES[0].id);
const DEFAULT_MAP_FILTER_SHOW_MINIMIZED =
  runtimeConfig.map?.defaultFilters?.showMinimized === undefined
    ? !getBooleanConfig(runtimeConfig.map?.defaultFilters?.hideMinimized, true)
    : Boolean(runtimeConfig.map?.defaultFilters?.showMinimized);
const DEFAULT_MAP_FILTER_LABEL_TIMES = getBooleanConfig(
  runtimeConfig.map?.defaultFilters?.labelTimes,
  true
);
const DEFAULT_MAP_FILTER_RECENCY_MODE =
  runtimeConfig.map?.defaultFilters?.recencyMode === "mostRecent" ? "mostRecent" : "all";
const DEFAULT_MAP_FILTER_NOTE_REPORTABLE_ONLY = getBooleanConfig(
  runtimeConfig.map?.defaultFilters?.noteReportableOnly,
  false
);
const DEFAULT_MAP_FILTER_INACTIVE_LABEL_OPACITY = Math.min(
  1,
  Math.max(0.25, getNumberConfig(runtimeConfig.map?.defaultFilters?.inactiveLabelOpacity, 0.6))
);
const METERS_PER_MILE = getNumberConfig(runtimeConfig.map?.metersPerMile, 1609.34);
const DEFAULT_SUMMARY_EXCLUDE = new Set(
  getStringArrayConfig(runtimeConfig.summary?.defaultExclude, ["For Lookup"])
);
const DEFAULT_SUMMARY_SORT = getStringConfig(runtimeConfig.summary?.sort, "time");
const DEFAULT_SUMMARY_MOST_RECENT_FIRST = getBooleanConfig(
  runtimeConfig.summary?.mostRecentFirst,
  false
);
const DEFAULT_SUMMARY_REPORTABLE_ONLY = getBooleanConfig(
  runtimeConfig.summary?.reportableOnly,
  false
);
const DEFAULT_SUMMARY_INCLUDE_LOCATION = getBooleanConfig(
  runtimeConfig.summary?.includeLocation,
  true
);
const DEFAULT_SUMMARY_INCLUDE_LOCATION_ADDRESS = getBooleanConfig(
  runtimeConfig.summary?.locationIncludeAddress,
  true
);
const DEFAULT_SUMMARY_INCLUDE_LOCATION_LAT_LON = getBooleanConfig(
  runtimeConfig.summary?.locationIncludeLatLon,
  false
);
const DEFAULT_SUMMARY_INCLUDE_EMOJIS = getBooleanConfig(
  runtimeConfig.summary?.includeEmojis,
  false
);
const DEFAULT_SUMMARY_SANITIZE_NAMES = getBooleanConfig(
  runtimeConfig.summary?.sanitizeNames,
  true
);
const DEFAULT_SUMMARY_BULLETS_FOR_NOTES = getBooleanConfig(
  runtimeConfig.summary?.bulletsForNotes,
  false
);
const DEFAULT_SUMMARY_SPACE_BETWEEN_NOTES = getBooleanConfig(
  runtimeConfig.summary?.spaceBetweenNotes,
  false
);
const DEFAULT_SUMMARY_TIME_24 = getBooleanConfig(runtimeConfig.summary?.time24, true);
const DEFAULT_SUMMARY_GROUP_FIELDS = getBooleanConfig(
  runtimeConfig.summary?.groupFields,
  true
);
const DEFAULT_NEW_CARD_TYPE = getStringConfig(runtimeConfig.cards?.defaultNewCardType, "last");
const DEFAULT_CARD_COLOR_MODE = getStringConfig(runtimeConfig.cards?.defaultColorMode, "cycle");
const DEFAULT_VIEW_MODE = getStringConfig(runtimeConfig.dispatch?.defaultViewMode, "notes");
const DEFAULT_NOTES_NEWEST_FIRST = getBooleanConfig(
  runtimeConfig.dispatch?.newNotesNewestFirst,
  true
);
const CHARCOAL_COLOR_INDEX = 7;
const GREY_COLOR_INDEX = 8;
const OFFWHITE_COLOR_INDEX = 9;
const CHARCOAL_COLOR_HEX = "#2f333b";
const GREY_COLOR_HEX = "#bcc4cf";
const OFFWHITE_COLOR_HEX = "#f3f1e8";
const PALETTE_COLOR_INDICES = [0, 1, 2, 3, 4, 5, 6];
const ACTIVE_COLUMN_COLOR_INDICES = [
  ...PALETTE_COLOR_INDICES,
  CHARCOAL_COLOR_INDEX,
  GREY_COLOR_INDEX,
  OFFWHITE_COLOR_INDEX,
];
const CARD_COLOR_PALETTES = [
  {
    id: "classic",
    label: "Classic",
    colors: ["#3a8fb7", "#d2963a", "#5aa563", "#7b6bc5", "#c86e5c", "#3f9a86", "#d84fb2"],
    colorNames: ["Harbor", "Amber", "Clover", "Iris", "Clay", "Lagoon", "Orchid"],
  },
  {
    id: "plasma",
    label: "Plasma",
    colors: ["#0d0887", "#5b02a3", "#9a179b", "#cb4679", "#ed7953", "#fdb42f", "#f0f921"],
    colorNames: ["Midnight", "Violet", "Fuchsia", "Rose", "Apricot", "Marigold", "Limeglow"],
  },
  {
    id: "inferno",
    label: "Inferno",
    colors: ["#000004", "#2d0b59", "#6f1d7a", "#b73779", "#e75b2d", "#fbb61a", "#fcffa4"],
    colorNames: ["Ember", "Aubergine", "Torch", "Flare", "Blaze", "Saffron", "Solar"],
  },
  {
    id: "viridis",
    label: "Viridis",
    colors: ["#440154", "#46327e", "#365c8d", "#277f8e", "#1fa187", "#4ac16d", "#fde725"],
    colorNames: ["Plum", "Indigo", "Slate", "Teal", "Jade", "Mint", "Citrine"],
  },
  {
    id: "cividis",
    label: "Cividis",
    colors: ["#00224e", "#253b6e", "#4e5a77", "#72787f", "#959774", "#bab369", "#fde737"],
    colorNames: ["Navy", "Denim", "Smoke", "Graphite", "Olive", "Khaki", "Canary"],
  },
  {
    id: "mako",
    label: "Mako",
    colors: ["#140c1c", "#302149", "#433c7a", "#3f6296", "#3688a5", "#57b7a2", "#c2d8c8"],
    colorNames: ["Ink", "Mulberry", "Twilight", "Marine", "Aegean", "Seafoam", "Mist"],
  },
  {
    id: "turbo",
    label: "Turbo",
    colors: ["#30123b", "#4667d8", "#2dbcd4", "#5be75b", "#c7df2a", "#fd9a2f", "#e44501"],
    colorNames: ["Cosmic", "Bolt", "Cyan", "Neon", "Citrus", "Tangerine", "Signal"],
  },
  {
    id: "shades-grey",
    label: "Shades of Grey",
    colors: ["#1b1b1b", "#2f2f2f", "#434343", "#575757", "#6c6c6c", "#818181", "#989898"],
    colorNames: ["Obsidian", "Char", "Ash", "Slate", "Steel", "Pewter", "Cloud"],
  },
];
const DEFAULT_CARD_COLOR_PALETTE = getStringConfig(
  runtimeConfig.cards?.defaultColorPalette,
  "classic"
);


const state = {
  startTime: null,
  endTime: null,
  endAdjustedNote: "",
  area: "",
  columns: [],
  saveEnabled: false,
  summaryInclude: null,
  summarySort: DEFAULT_SUMMARY_SORT,
  summaryMostRecentFirst: DEFAULT_SUMMARY_MOST_RECENT_FIRST,
  summaryKnownTypes: null,
  summaryReportableOnly: DEFAULT_SUMMARY_REPORTABLE_ONLY,
  summaryIncludeLocation: DEFAULT_SUMMARY_INCLUDE_LOCATION,
  summaryLocationIncludeAddress: DEFAULT_SUMMARY_INCLUDE_LOCATION_ADDRESS,
  summaryLocationIncludeLatLon: DEFAULT_SUMMARY_INCLUDE_LOCATION_LAT_LON,
  summaryIncludeEmojis: DEFAULT_SUMMARY_INCLUDE_EMOJIS,
  summarySanitizeNames: DEFAULT_SUMMARY_SANITIZE_NAMES,
  summaryBulletsForNotes: DEFAULT_SUMMARY_BULLETS_FOR_NOTES,
  summarySpaceBetweenNotes: DEFAULT_SUMMARY_SPACE_BETWEEN_NOTES,
  summaryTime24: DEFAULT_SUMMARY_TIME_24,
  summaryDefaultExclude: Array.from(DEFAULT_SUMMARY_EXCLUDE),
  defaultNewCardType: DEFAULT_NEW_CARD_TYPE,
  cardColorDefaults: {
    mode: DEFAULT_CARD_COLOR_MODE,
    palette: DEFAULT_CARD_COLOR_PALETTE,
    byType: {},
  },
  summaryGroupFields: DEFAULT_SUMMARY_GROUP_FIELDS,
  dispatchVisited: false,
  isDirty: false,
  timezone: DEFAULT_TIMEZONE,
  minimizedExpanded: false,
  selection: null,
  viewMode: DEFAULT_VIEW_MODE,
  notesNewestFirst: DEFAULT_NOTES_NEWEST_FIRST,
  mapSettings: {
    city: null,
    centerLocation: null,
    radiusMiles: DEFAULT_MAP_RADIUS_MILES,
    style: DEFAULT_MAP_STYLE,
  },
  mapFilters: {
    showMinimized: DEFAULT_MAP_FILTER_SHOW_MINIMIZED,
    labelTimes: DEFAULT_MAP_FILTER_LABEL_TIMES,
    recencyMode: DEFAULT_MAP_FILTER_RECENCY_MODE,
    noteReportableOnly: DEFAULT_MAP_FILTER_NOTE_REPORTABLE_ONLY,
    inactiveLabelOpacity: DEFAULT_MAP_FILTER_INACTIVE_LABEL_OPACITY,
    types: null,
  },
  availableCardTypes: [],
};

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const welcome = document.getElementById("welcome");
const workspace = document.getElementById("workspace");
const tabs = document.querySelectorAll(".tab");
const tabPanels = document.querySelectorAll(".tab-panel");
const columnsEl = document.getElementById("columns");
const brandHome = document.getElementById("brandHome");
const startShiftButton = document.getElementById("startShift");
const endShiftButton = document.getElementById("endShift");
const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");
const endNote = document.getElementById("endNote");
const endField = document.querySelector(".end-field");
const shiftAreaInput = document.getElementById("shiftArea");
const centerMapButton = document.getElementById("centerMapButton");
const timezoneSelect = document.getElementById("timezoneSelect");
const timezoneTime = document.getElementById("timezoneTime");
const saveToggle = document.getElementById("saveToggle");
const exportButton = document.getElementById("exportButton");
const summaryDefaultExclude = document.getElementById("summaryDefaultExclude");
const cardTypeAvailability = document.getElementById("cardTypeAvailability");
const defaultCardTypeSelect = document.getElementById("defaultCardTypeSelect");
const defaultCardColorModeSelect = document.getElementById("defaultCardColorModeSelect");
const defaultCardColorPalette = document.getElementById("defaultCardColorPalette");
const defaultCardColorByType = document.getElementById("defaultCardColorByType");
const settingsGrid = document.querySelector("#settings .settings-grid");
const applyCardColorsAll = document.getElementById("applyCardColorsAll");
const exportMenu = document.getElementById("exportMenu");
const importButton = document.getElementById("importButton");
const importFile = document.getElementById("importFile");
const clearButton = document.getElementById("clearButton");
const summaryOutputWrap = document.getElementById("summaryOutputWrap");
const summaryOutputLinkTrack = document.getElementById("summaryOutputLinkTrack");
const summaryOutput = document.getElementById("summaryOutput");
const summaryFilters = document.getElementById("summaryFilters");
const dispatchNewestFirstToggle = document.getElementById("dispatchNewestFirstToggle");
const summarySort = document.getElementById("summarySort");
const summaryMostRecentToggle = document.getElementById("summaryMostRecentToggle");
const summaryLocationToggle = document.getElementById("summaryLocationToggle");
const summaryEmojiToggle = document.getElementById("summaryEmojiToggle");
const summarySanitizeToggle = document.getElementById("summarySanitizeToggle");
const summaryReportableToggle = document.getElementById("summaryReportableToggle");
const summaryTimeFormat24 = document.getElementById("summaryTimeFormat24");
const summaryTimeFormat12 = document.getElementById("summaryTimeFormat12");
const summaryGroupFieldsToggle = document.getElementById("summaryGroupFieldsToggle");
const summaryBulletsToggle = document.getElementById("summaryBulletsToggle");
const summarySpaceBetweenToggle = document.getElementById("summarySpaceBetweenToggle");
const summaryLocationAddressToggle = document.getElementById("summaryLocationAddressToggle");
const summaryLocationLatLonToggle = document.getElementById("summaryLocationLatLonToggle");
const summaryLocationSuboptions = document.getElementById("summaryLocationSuboptions");
const summaryWarning = document.getElementById("summaryWarning");
const summaryWarningText = document.getElementById("summaryWarningText");
const summaryWarningDismiss = document.getElementById("summaryWarningDismiss");
const summaryGroupOutput = document.getElementById("summaryGroupOutput");
const copySummaryButton = document.getElementById("copySummary");
const copyStatus = document.getElementById("copyStatus");
const addColumnButton = document.getElementById("addColumn");
const addColumnWrap = document.getElementById("addColumnWrap");
const formatAlertButton = document.getElementById("formatAlert");
const formatSaluteButton = document.getElementById("formatSalute");
const formatFields = document.getElementById("formatFields");
const formatOutput = document.getElementById("formatOutput");
const copyFormatButton = document.getElementById("copyFormat");
const copyFormatStatus = document.getElementById("copyFormatStatus");
const clearFormatButton = document.getElementById("clearFormat");
const alertDesc = document.getElementById("alertDesc");
const saluteDesc = document.getElementById("saluteDesc");
const formatShortButton = document.getElementById("formatShort");
const formatLongButton = document.getElementById("formatLong");
const vehicleModal = document.getElementById("vehicleModal");
const vehicleTitle = document.getElementById("vehicleTitle");
const vehicleModalSubtitle = document.getElementById("vehicleModalSubtitle");
const vehicleClose = document.getElementById("vehicleClose");
const vehicleAdd = document.getElementById("vehicleAdd");
const vehiclePlate = document.getElementById("vehiclePlate");
const vehicleState = document.getElementById("vehicleState");
const vehicleMake = document.getElementById("vehicleMake");
const vehicleModel = document.getElementById("vehicleModel");
const vehicleColor = document.getElementById("vehicleColor");
const vehicleBody = document.getElementById("vehicleBody");
const stateOptions = document.getElementById("stateOptions");
const makeOptions = document.getElementById("makeOptions");
const modelOptions = document.getElementById("modelOptions");
const colorOptions = document.getElementById("colorOptions");
const bodyOptions = document.getElementById("bodyOptions");
const deleteModal = document.getElementById("deleteModal");
const deleteCancel = document.getElementById("deleteCancel");
const deleteConfirm = document.getElementById("deleteConfirm");
const deleteTitle = document.getElementById("deleteTitle");
const reverseGeocodeModal = document.getElementById("reverseGeocodeModal");
const reverseGeocodeOld = document.getElementById("reverseGeocodeOld");
const reverseGeocodeNew = document.getElementById("reverseGeocodeNew");
const reverseGeocodeCancel = document.getElementById("reverseGeocodeCancel");
const reverseGeocodeConfirm = document.getElementById("reverseGeocodeConfirm");
const shortcutsModal = document.getElementById("shortcutsModal");
const helpButton = document.getElementById("helpButton");
const shortcutsButton = document.getElementById("shortcutsButton");
const shortcutsClose = document.getElementById("shortcutsClose");
const minimizedSection = document.getElementById("minimizedSection");
const minimizedCards = document.getElementById("minimizedCards");
const minimizedToggle = document.getElementById("minimizedToggle");
const minimizeAllCards = document.getElementById("minimizeAllCards");
const maximizeAllCards = document.getElementById("maximizeAllCards");
const saveInfoButton = document.getElementById("saveInfoButton");
const saveInfoModal = document.getElementById("saveInfoModal");
const saveInfoClose = document.getElementById("saveInfoClose");
const versionButton = document.getElementById("versionButton");
const versionModal = document.getElementById("versionModal");
const versionClose = document.getElementById("versionClose");
const versionHistory = document.getElementById("versionHistory");
const aboutLegalContent = document.getElementById("aboutLegalContent");
const shortcutsContent = document.getElementById("shortcutsContent");
const tutorialPickerIntroText = document.getElementById("tutorialPickerIntroText");
const tutorialButton = document.getElementById("tutorialButton");
const tutorialCtaButton = document.getElementById("tutorialCtaButton");
const welcomeAboutButton = document.getElementById("welcomeAboutButton");
const aboutHowToButton = document.getElementById("aboutHowToButton");
const aboutTutorialButton = document.getElementById("aboutTutorialButton");
const howToModal = document.getElementById("howToModal");
const howToClose = document.getElementById("howToClose");
const howToTutorialCta = document.getElementById("howToTutorialCta");
const howToFaqSection = document.getElementById("howToFaqSection");
const howToExpectationsContent = document.getElementById("howToExpectationsContent");
const faqContent = document.getElementById("faqContent");
const tutorialPickerModal = document.getElementById("tutorialPickerModal");
const tutorialPickerClose = document.getElementById("tutorialPickerClose");
const tutorialList = document.getElementById("tutorialList");
const tutorialWelcomeModal = document.getElementById("tutorialWelcomeModal");
const tutorialWelcomeTitle = document.getElementById("tutorialWelcomeTitle");
const tutorialWelcomeText = document.getElementById("tutorialWelcomeText");
const tutorialWelcomeBack = document.getElementById("tutorialWelcomeBack");
const tutorialStart = document.getElementById("tutorialStart");
const tutorialCompleteModal = document.getElementById("tutorialCompleteModal");
const tutorialCompleteText = document.getElementById("tutorialCompleteText");
const tutorialCompleteClose = document.getElementById("tutorialCompleteClose");
const tutorialTakeAnother = document.getElementById("tutorialTakeAnother");
const searchButton = document.getElementById("searchButton");
const searchModal = document.getElementById("searchModal");
const searchClose = document.getElementById("searchClose");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const timezoneLink = document.getElementById("timezoneLink");
const settingsTimezone = document.getElementById("settingsTimezone");
const collectView = document.getElementById("collectView");
const viewToggleButtons = document.querySelectorAll(".view-toggle [data-view]");
const mapPanel = document.getElementById("mapPanel");
const mapView = document.getElementById("mapView");
const mapMeta = document.getElementById("mapMeta");
const locationModal = document.getElementById("locationModal");
const locationClose = document.getElementById("locationClose");
const locationDropPin = document.getElementById("locationDropPin");
const locationSearchInput = document.getElementById("locationSearchInput");
const locationResults = document.getElementById("locationResults");
const locationSetButton = document.getElementById("locationSet");
const locationClearButton = document.getElementById("locationClear");
const locationTitle = document.getElementById("locationTitle");
const locationTargetLabel = document.getElementById("locationTargetLabel");
const locationLimitDetail = document.getElementById("locationLimitDetail");
const mapCardMetaModal = document.getElementById("mapCardMetaModal");
const mapCardMetaLabel = document.getElementById("mapCardMetaLabel");
const mapCardMetaType = document.getElementById("mapCardMetaType");
const mapCardMetaTypeHint = document.getElementById("mapCardMetaTypeHint");
const mapCardMetaCancel = document.getElementById("mapCardMetaCancel");
const mapCardMetaSkip = document.getElementById("mapCardMetaSkip");
const mapCardMetaSave = document.getElementById("mapCardMetaSave");
const applyCardColorsModal = document.getElementById("applyCardColorsModal");
const applyCardColorsCancel = document.getElementById("applyCardColorsCancel");
const applyCardColorsConfirm = document.getElementById("applyCardColorsConfirm");
const setCityButton = document.getElementById("setCityButton");
const cityLabel = document.getElementById("cityLabel");
const mapRadiusInput = document.getElementById("mapRadiusInput");
const mapSettingsSection = document.getElementById("mapSettingsSection");
const mapLabelsButton = document.getElementById("mapLabelsButton");
const mapLabelsMenu = document.getElementById("mapLabelsMenu");
const mapVisibilityButton = document.getElementById("mapVisibilityButton");
const mapVisibilityMenu = document.getElementById("mapVisibilityMenu");
const mapTypeButton = document.getElementById("mapTypeButton");
const mapTypeMenu = document.getElementById("mapTypeMenu");
const mapStyleButton = document.getElementById("mapStyleButton");
const mapStyleMenu = document.getElementById("mapStyleMenu");
const mapFilterNotice = document.getElementById("mapFilterNotice");
const mapFilterNoticeDismiss = document.getElementById("mapFilterNoticeDismiss");
const mapGeocodeNotice = document.getElementById("mapGeocodeNotice");
const mapGeocodeText = document.getElementById("mapGeocodeText");
const mapGeocodeDismiss = document.getElementById("mapGeocodeDismiss");

function applyConfiguredFeatureFlags() {
  if (viewToggleButtons && viewToggleButtons.length) {
    viewToggleButtons.forEach((button) => {
      const view = button.dataset.view || "";
      if (view === "split" && !SPLIT_VIEW_ENABLED) {
        button.classList.add("hidden");
      }
      if (view === "map" && !MAP_FEATURE_ENABLED) {
        button.classList.add("hidden");
      }
    });
  }
  if (!MAP_FEATURE_ENABLED) {
    if (mapPanel) {
      mapPanel.classList.add("hidden");
    }
    if (mapSettingsSection) {
      mapSettingsSection.classList.add("hidden");
    }
    if (setCityButton) {
      setCityButton.classList.add("hidden");
    }
    if (centerMapButton) {
      centerMapButton.classList.add("hidden");
    }
    state.viewMode = "notes";
  }
}

let minimizedPillIds = new Set();
const searchState = { results: [], activeIndex: -1 };
const dragState = { activeId: null, targetId: null, position: null };
const noteDragState = { noteId: null, fromColumnId: null };
const locationSearchState = { results: [], activeIndex: -1 };
let mainMap = null;
let locationSearchLayerGroup = null;
let locationPreviewMarker = null;
let locationSearchMarkers = [];
let locationSearchToken = 0;
let locationSearchBounds = null;
let mapLayerGroup = null;
let mainTileLayer = null;
let locationModalTarget = null;
let pendingLocation = null;
let locationSearchTimer = null;
let locationModalMapViewSnapshot = null;
let locationModalShouldRestoreView = true;
let mapNeedsFit = true;
let mapMarkers = new Map();
let mapSidebarToolsControl = null;
let mapPlacementMarker = null;
let mapCardMetaTargetColumnId = null;
let mapCardMetaDiscardOnCancel = false;
let mapCardMetaTypeDropdown = null;
let mapCardMetaTypeLocked = false;
let mapCardMetaSelectedType = null;
let defaultCardTypeDropdown = null;
let mapDragWasEnabled = true;
let mapDragFallbackTimer = null;
let mapGeocodeNoticeTimer = null;
let appToastTimer = null;
const MAP_PIN_ZINDEX_STEP = 10;
const MAP_PIN_HOVER_ZINDEX_BUMP = 5;
const MAP_PIN_BASE_ZINDEX = 650;
const MAP_PIN_FOCUS_ZINDEX = 2000000;
const MAP_PIN_FOCUS_DURATION_MS = 900;
const MAP_TOOLTIP_VIEW_PADDING = 14;
const MAP_TOOLTIP_PAN_MAX_ATTEMPTS = 3;
let mapPinPaneNames = new Set();
let mapFocusedMarker = null;
let mapFocusedState = null;
let reverseGeocodeLastAt = 0;
let reverseGeocodeQueue = Promise.resolve();
const reverseGeocodeCache = new Map();
const reverseGeocodeInFlight = new Map();
let summaryWarningDismissed = false;
const summaryCopiedGroups = new Set();
let tutorialCatalog = [];
let activeTour = null;
let activeDriver = null;
let tutorialCompletedPending = false;
let activeTourStepIndex = -1;
let activeTourStepCount = 0;
let pendingTourStartIndex = 0;
let pendingTourStartCount = 0;
let pendingTourIsResume = false;
let settingsGridExpandedMinHeight = 0;
let suppressSelectClickThroughUntil = 0;

const OBSERVER_CARD_TYPE = "Observer";
const OBSERVER_BIKE_TYPE = "Observer Bike";
const OBSERVER_CAR_TYPE = "Observer Car";
const VEHICLE_LIST_CARD_TYPE = "Vehicle List";
const VEHICLE_CARD_TYPE = "Vehicle";
const FALLBACK_CARD_TYPES = [
  { value: "Incident", label: "Incident", icon: "alert-triangle" },
  { value: OBSERVER_CARD_TYPE, label: "Observer", icon: "user" },
  { value: OBSERVER_BIKE_TYPE, label: "Observer", icon: "bike" },
  { value: OBSERVER_CAR_TYPE, label: "Observer", icon: "car" },
  { value: VEHICLE_CARD_TYPE, label: "Vehicle", icon: "car" },
  { value: VEHICLE_LIST_CARD_TYPE, label: "Vehicle List", icon: "cars-stack" },
  { value: "Place", label: "Location", icon: "map-pin" },
  { value: "For Lookup", label: "For Lookup", icon: "search" },
  { value: "Notes", label: "Notes", icon: "file-text" },
  { value: "Custom", label: "Custom", icon: "pencil" },
];
const configuredCardTypes = Array.isArray(runtimeConfig.cards?.types)
  ? runtimeConfig.cards.types
      .map((item) => {
        const rawValue = String(item?.value || "").trim();
        const value = rawValue === "Vehicle" ? VEHICLE_LIST_CARD_TYPE : rawValue;
        let label = String(item?.label || "").trim();
        if (value === VEHICLE_LIST_CARD_TYPE) {
          label = "Vehicle List";
        } else if (value === VEHICLE_CARD_TYPE) {
          label = "Vehicle";
        }
        return {
          value,
          label,
          icon: String(item?.icon || "").trim(),
        };
      })
      .filter((item) => item.value && item.label && item.icon)
  : [];
const CARD_TYPES = configuredCardTypes.length ? configuredCardTypes.slice() : FALLBACK_CARD_TYPES.slice();
if (!CARD_TYPES.some((item) => item.value === VEHICLE_CARD_TYPE)) {
  CARD_TYPES.push({ value: VEHICLE_CARD_TYPE, label: "Vehicle", icon: "car" });
}
if (!CARD_TYPES.some((item) => item.value === VEHICLE_LIST_CARD_TYPE)) {
  CARD_TYPES.push({ value: VEHICLE_LIST_CARD_TYPE, label: "Vehicle List", icon: "cars-stack" });
}
const FALLBACK_TYPE_EMOJI = {
  [OBSERVER_CARD_TYPE]: "🧍",
  [OBSERVER_BIKE_TYPE]: "🚲",
  [OBSERVER_CAR_TYPE]: "🚗",
  Incident: "🚨",
  Place: "📍",
  [VEHICLE_LIST_CARD_TYPE]: "🚙",
  [VEHICLE_CARD_TYPE]: "🚘",
  "For Lookup": "🔎",
  Notes: "📝",
  Custom: "✍️",
};
const TYPE_EMOJI = Object.assign(
  {},
  FALLBACK_TYPE_EMOJI,
  runtimeConfig.cards?.typeEmoji && typeof runtimeConfig.cards.typeEmoji === "object"
    ? runtimeConfig.cards.typeEmoji
    : {}
);
const CONFIGURED_DEFAULT_CARD_TYPE = getStringConfig(
  runtimeConfig.cards?.defaultCardType,
  OBSERVER_CARD_TYPE
);

function normalizeBootstrapCardType(type) {
  if (!type) {
    return OBSERVER_CARD_TYPE;
  }
  return type === "Person" ? OBSERVER_CARD_TYPE : type;
}

const DEFAULT_CARD_TYPE = CARD_TYPES.some(
  (item) => normalizeBootstrapCardType(item.value) === normalizeBootstrapCardType(CONFIGURED_DEFAULT_CARD_TYPE)
)
  ? normalizeBootstrapCardType(CONFIGURED_DEFAULT_CARD_TYPE)
  : OBSERVER_CARD_TYPE;
const MAX_PILL_LABEL = 18;
const SUMMARY_SORT_OPTIONS = new Set(["time", "category", "card"]);

const FORMAT_DEFS = {
  ALERTA: [
    {
      letter: "A",
      label: "Activity",
      short: "A",
      long: "Activity",
      helper: "What is happening?",
      pills: ["Abduction", "Raid"],
    },
    {
      letter: "L",
      label: "Location",
      short: "L",
      long: "Location",
      helper: "Where is this happening?",
    },
    {
      letter: "E",
      label: "Equipment",
      short: "E",
      long: "Equipment",
      helper: "Are there vehicles, weapons, etc. involved?",
      vehicle: true,
    },
    {
      letter: "R",
      label: "Request aid",
      short: "R",
      long: "Request aid",
      helper: "What response is being requested?",
      pills: ["Come Support!", "Spread the Word"],
    },
    {
      letter: "T",
      label: "Time & date",
      short: "T",
      long: "Time & date",
      isTime: true,
      helper: "What is the exact time and date?",
    },
    {
      letter: "A",
      label: "Appearance",
      short: "A",
      long: "Appearance",
      helper: "Who? How many? What are they wearing?",
    },
  ],
  SALUTE: [
    { letter: "S", label: "Size/strength", short: "S", long: "Size/strength" },
    { letter: "A", label: "Actions/activity", short: "A", long: "Actions/activity" },
    { letter: "L", label: "Location & direction", short: "L", long: "Location & direction" },
    { letter: "U", label: "Uniform/clothes", short: "U", long: "Uniform/clothes" },
    {
      letter: "T",
      label: "Time & date of observation",
      short: "T",
      long: "Time & date of observation",
      isTime: true,
    },
    {
      letter: "E",
      label: "Equipment/weapons",
      short: "E",
      long: "Equipment/weapons",
      vehicle: true,
    },
    {
      letter: "R",
      label: "Response Requested",
      short: "R",
      long: "Response Requested",
      helper: "What response is being requested? (Optional)",
      pills: ["Come Support!", "Spread the Word"],
    },
  ],
};

let currentFormatMode = "ALERTA";
let labelMode = "short";
let vehicleTarget = null;
let pendingVehicleInfoNoteTarget = null;
let deleteTarget = null;
let deleteModalKeyHandler = null;
let reverseGeocodeKeyHandler = null;
let reverseGeocodeResolver = null;
let timezoneDropdown = null;
let timezoneTimer = null;

const TIMEZONE_CHOICES = [
  { value: "Etc/GMT+12", label: "GMT-12 (GMT-12)" },
  { value: "Pacific/Pago_Pago", label: "Pago Pago (GMT-11)" },
  { value: "Pacific/Honolulu", label: "Honolulu (GMT-10)" },
  { value: "America/Anchorage", label: "Anchorage (GMT-9)" },
  { value: "America/Los_Angeles", label: "Los Angeles (GMT-8)" },
  { value: "America/Denver", label: "Denver (GMT-7)" },
  { value: "America/Chicago", label: "Chicago (GMT-6)" },
  { value: "America/New_York", label: "New York (GMT-5)" },
  { value: "America/Santiago", label: "Santiago (GMT-4)" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (GMT-3)" },
  { value: "America/Noronha", label: "Noronha (GMT-2)" },
  { value: "Atlantic/Cape_Verde", label: "Cape Verde (GMT-1)" },
  { value: "Europe/London", label: "London (GMT+0)" },
  { value: "Europe/Berlin", label: "Berlin (GMT+1)" },
  { value: "Europe/Athens", label: "Athens (GMT+2)" },
  { value: "Europe/Moscow", label: "Moscow (GMT+3)" },
  { value: "Asia/Dubai", label: "Dubai (GMT+4)" },
  { value: "Asia/Karachi", label: "Karachi (GMT+5)" },
  { value: "Asia/Dhaka", label: "Dhaka (GMT+6)" },
  { value: "Asia/Bangkok", label: "Bangkok (GMT+7)" },
  { value: "Asia/Shanghai", label: "Shanghai (GMT+8)" },
  { value: "Asia/Tokyo", label: "Tokyo (GMT+9)" },
  { value: "Australia/Brisbane", label: "Brisbane (GMT+10)" },
  { value: "Pacific/Noumea", label: "Noumea (GMT+11)" },
  { value: "Pacific/Auckland", label: "Auckland (GMT+12)" },
  { value: "Pacific/Tongatapu", label: "Nuku'alofa (GMT+13)" },
  { value: "Pacific/Kiritimati", label: "Kiritimati (GMT+14)" },
];

const STATES = [
  "MN",
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "DC",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "Government Vehicle",
];

const VEHICLE_MAKES = [
  "Acura",
  "Audi",
  "BMW",
  "Buick",
  "Cadillac",
  "Chevrolet",
  "Chrysler",
  "Dodge",
  "Ford",
  "GMC",
  "Honda",
  "Hyundai",
  "Infiniti",
  "Jeep",
  "Kia",
  "Lexus",
  "Lincoln",
  "Mazda",
  "Mercedes-Benz",
  "Mitsubishi",
  "Nissan",
  "Other",
  "Ram",
  "Subaru",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo",
];

const VEHICLE_MODELS = {
  Unknown: [{ model: "Unknown", body: "Unknown" }],
  Acura: [
    { model: "Integra", body: "Hatchback" },
    { model: "ILX", body: "Sedan" },
    { model: "TLX", body: "Sedan" },
    { model: "RDX", body: "SUV" },
    { model: "MDX", body: "SUV" },
    { model: "ZDX", body: "SUV" },
  ],
  Audi: [
    { model: "A3", body: "Sedan" },
    { model: "A4", body: "Sedan" },
    { model: "A5", body: "Coupe" },
    { model: "A6", body: "Sedan" },
    { model: "Q3", body: "SUV" },
    { model: "Q4 e-tron", body: "SUV" },
    { model: "Q5", body: "SUV" },
    { model: "Q7", body: "SUV" },
    { model: "Q8", body: "SUV" },
  ],
  BMW: [
    { model: "2 Series", body: "Coupe" },
    { model: "3 Series", body: "Sedan" },
    { model: "4 Series", body: "Coupe" },
    { model: "5 Series", body: "Sedan" },
    { model: "7 Series", body: "Sedan" },
    { model: "X1", body: "SUV" },
    { model: "X3", body: "SUV" },
    { model: "X5", body: "SUV" },
    { model: "X7", body: "SUV" },
  ],
  Buick: [
    { model: "Encore", body: "SUV" },
    { model: "Encore GX", body: "SUV" },
    { model: "Envision", body: "SUV" },
    { model: "Enclave", body: "SUV" },
  ],
  Cadillac: [
    { model: "CT4", body: "Sedan" },
    { model: "CT5", body: "Sedan" },
    { model: "XT4", body: "SUV" },
    { model: "XT5", body: "SUV" },
    { model: "XT6", body: "SUV" },
    { model: "Escalade", body: "SUV" },
    { model: "Escalade ESV", body: "SUV" },
  ],
  Chevrolet: [
    { model: "Trax", body: "SUV" },
    { model: "Silverado", body: "Truck" },
    { model: "Silverado 2500HD", body: "Truck" },
    { model: "Silverado 3500HD", body: "Truck" },
    { model: "Colorado", body: "Truck" },
    { model: "Express", body: "Van" },
    { model: "Bolt EV", body: "Hatchback" },
    { model: "Bolt EUV", body: "SUV" },
    { model: "Malibu", body: "Sedan" },
    { model: "Impala", body: "Sedan" },
    { model: "Equinox", body: "SUV" },
    { model: "Equinox EV", body: "SUV" },
    { model: "Blazer", body: "SUV" },
    { model: "Blazer EV", body: "SUV" },
    { model: "Trailblazer", body: "SUV" },
    { model: "Tahoe", body: "SUV" },
    { model: "Suburban", body: "SUV" },
    { model: "Traverse", body: "SUV" },
    { model: "Camaro", body: "Coupe" },
    { model: "Corvette", body: "Coupe" },
  ],
  Chrysler: [
    { model: "300", body: "Sedan" },
    { model: "Pacifica", body: "Minivan" },
    { model: "Voyager", body: "Minivan" },
  ],
  Dodge: [
    { model: "Charger", body: "Sedan" },
    { model: "Challenger", body: "Coupe" },
    { model: "Durango", body: "SUV" },
    { model: "Hornet", body: "SUV" },
    { model: "Journey", body: "SUV" },
    { model: "Grand Caravan", body: "Minivan" },
  ],
  Ford: [
    { model: "F-150", body: "Truck" },
    { model: "F-250", body: "Truck" },
    { model: "F-350", body: "Truck" },
    { model: "Maverick", body: "Truck" },
    { model: "Super Duty", body: "Truck" },
    { model: "Explorer", body: "SUV" },
    { model: "Escape", body: "SUV" },
    { model: "Edge", body: "SUV" },
    { model: "Expedition", body: "SUV" },
    { model: "Bronco", body: "SUV" },
    { model: "Bronco Sport", body: "SUV" },
    { model: "Ranger", body: "Truck" },
    { model: "Mustang", body: "Coupe" },
    { model: "Focus", body: "Hatchback" },
    { model: "Fusion", body: "Sedan" },
    { model: "Transit", body: "Van" },
    { model: "Transit Connect", body: "Van" },
  ],
  GMC: [
    { model: "Sierra", body: "Truck" },
    { model: "Sierra 2500HD", body: "Truck" },
    { model: "Sierra 3500HD", body: "Truck" },
    { model: "Canyon", body: "Truck" },
    { model: "Terrain", body: "SUV" },
    { model: "Acadia", body: "SUV" },
    { model: "Yukon", body: "SUV" },
    { model: "Yukon XL", body: "SUV" },
    { model: "Savana", body: "Van" },
  ],
  Honda: [
    { model: "Civic", body: "Sedan" },
    { model: "Accord", body: "Sedan" },
    { model: "CR-V", body: "SUV" },
    { model: "HR-V", body: "SUV" },
    { model: "Pilot", body: "SUV" },
    { model: "Passport", body: "SUV" },
    { model: "Odyssey", body: "Minivan" },
    { model: "Ridgeline", body: "Truck" },
    { model: "Prologue", body: "SUV" },
  ],
  Hyundai: [
    { model: "Elantra", body: "Sedan" },
    { model: "Sonata", body: "Sedan" },
    { model: "Tucson", body: "SUV" },
    { model: "Santa Fe", body: "SUV" },
    { model: "Palisade", body: "SUV" },
    { model: "Kona", body: "SUV" },
    { model: "Venue", body: "SUV" },
    { model: "Santa Cruz", body: "Truck" },
    { model: "Ioniq 5", body: "SUV" },
    { model: "Ioniq 6", body: "Sedan" },
  ],
  Infiniti: [
    { model: "Q50", body: "Sedan" },
    { model: "QX50", body: "SUV" },
    { model: "QX55", body: "SUV" },
    { model: "QX60", body: "SUV" },
    { model: "QX80", body: "SUV" },
  ],
  Jeep: [
    { model: "Wrangler", body: "SUV" },
    { model: "Grand Cherokee", body: "SUV" },
    { model: "Cherokee", body: "SUV" },
    { model: "Compass", body: "SUV" },
    { model: "Renegade", body: "SUV" },
    { model: "Wagoneer", body: "SUV" },
    { model: "Grand Wagoneer", body: "SUV" },
    { model: "Gladiator", body: "Truck" },
  ],
  Kia: [
    { model: "Forte", body: "Sedan" },
    { model: "K5", body: "Sedan" },
    { model: "Sportage", body: "SUV" },
    { model: "Sorento", body: "SUV" },
    { model: "Telluride", body: "SUV" },
    { model: "Soul", body: "Hatchback" },
    { model: "Seltos", body: "SUV" },
    { model: "Niro", body: "SUV" },
    { model: "EV6", body: "SUV" },
    { model: "Carnival", body: "Minivan" },
  ],
  Lexus: [
    { model: "ES", body: "Sedan" },
    { model: "IS", body: "Sedan" },
    { model: "LS", body: "Sedan" },
    { model: "UX", body: "SUV" },
    { model: "NX", body: "SUV" },
    { model: "RX", body: "SUV" },
    { model: "GX", body: "SUV" },
    { model: "TX", body: "SUV" },
    { model: "LX", body: "SUV" },
  ],
  Lincoln: [
    { model: "Corsair", body: "SUV" },
    { model: "Nautilus", body: "SUV" },
    { model: "Aviator", body: "SUV" },
    { model: "Navigator", body: "SUV" },
  ],
  Mazda: [
    { model: "Mazda3", body: "Hatchback" },
    { model: "Mazda6", body: "Sedan" },
    { model: "CX-30", body: "SUV" },
    { model: "CX-5", body: "SUV" },
    { model: "CX-50", body: "SUV" },
    { model: "CX-70", body: "SUV" },
    { model: "CX-90", body: "SUV" },
    { model: "MX-5", body: "Coupe" },
  ],
  "Mercedes-Benz": [
    { model: "C-Class", body: "Sedan" },
    { model: "E-Class", body: "Sedan" },
    { model: "S-Class", body: "Sedan" },
    { model: "GLA", body: "SUV" },
    { model: "GLB", body: "SUV" },
    { model: "GLC", body: "SUV" },
    { model: "GLE", body: "SUV" },
    { model: "GLS", body: "SUV" },
    { model: "Sprinter", body: "Van" },
    { model: "Metris", body: "Van" },
  ],
  Mitsubishi: [
    { model: "Mirage", body: "Hatchback" },
    { model: "Outlander", body: "SUV" },
    { model: "Outlander Sport", body: "SUV" },
    { model: "Eclipse Cross", body: "SUV" },
  ],
  Nissan: [
    { model: "Altima", body: "Sedan" },
    { model: "Sentra", body: "Sedan" },
    { model: "Versa", body: "Sedan" },
    { model: "Rogue", body: "SUV" },
    { model: "Kicks", body: "SUV" },
    { model: "Murano", body: "SUV" },
    { model: "Pathfinder", body: "SUV" },
    { model: "Armada", body: "SUV" },
    { model: "Ariya", body: "SUV" },
    { model: "Frontier", body: "Truck" },
    { model: "Titan", body: "Truck" },
  ],
  Ram: [
    { model: "1500", body: "Truck" },
    { model: "2500", body: "Truck" },
    { model: "3500", body: "Truck" },
    { model: "ProMaster", body: "Van" },
    { model: "ProMaster City", body: "Van" },
  ],
  Subaru: [
    { model: "Ascent", body: "SUV" },
    { model: "Outback", body: "Wagon" },
    { model: "Forester", body: "SUV" },
    { model: "Crosstrek", body: "SUV" },
    { model: "Impreza", body: "Sedan" },
    { model: "Legacy", body: "Sedan" },
    { model: "WRX", body: "Sedan" },
    { model: "BRZ", body: "Coupe" },
  ],
  Tesla: [
    { model: "Model 3", body: "Sedan" },
    { model: "Model Y", body: "SUV" },
    { model: "Model S", body: "Sedan" },
    { model: "Model X", body: "SUV" },
    { model: "Cybertruck", body: "Truck" },
  ],
  Toyota: [
    { model: "Corolla", body: "Sedan" },
    { model: "Corolla Cross", body: "SUV" },
    { model: "Camry", body: "Sedan" },
    { model: "Prius", body: "Hatchback" },
    { model: "Prius Prime", body: "Hatchback" },
    { model: "RAV4", body: "SUV" },
    { model: "Highlander", body: "SUV" },
    { model: "Grand Highlander", body: "SUV" },
    { model: "4Runner", body: "SUV" },
    { model: "Land Cruiser", body: "SUV" },
    { model: "Sequoia", body: "SUV" },
    { model: "Tacoma", body: "Truck" },
    { model: "Tundra", body: "Truck" },
    { model: "Sienna", body: "Minivan" },
    { model: "bZ4X", body: "SUV" },
  ],
  Volkswagen: [
    { model: "Jetta", body: "Sedan" },
    { model: "Passat", body: "Sedan" },
    { model: "Tiguan", body: "SUV" },
    { model: "Atlas", body: "SUV" },
    { model: "Atlas Cross Sport", body: "SUV" },
    { model: "Taos", body: "SUV" },
    { model: "Golf", body: "Hatchback" },
    { model: "ID.4", body: "SUV" },
  ],
  Volvo: [
    { model: "S60", body: "Sedan" },
    { model: "S90", body: "Sedan" },
    { model: "XC40", body: "SUV" },
    { model: "XC60", body: "SUV" },
    { model: "XC90", body: "SUV" },
    { model: "EX30", body: "SUV" },
    { model: "EX90", body: "SUV" },
    { model: "V60", body: "Wagon" },
  ],
  Other: [{ model: "Other", body: "Other" }],
};

const VEHICLE_COLORS = [
  "Dark",
  "Black",
  "Dark gray / grey",
  "Gray / grey",
  "Light gray / grey",
  "Silver",
  "White",
  "Tan",
  "Gold",
  "Red",
  "Brown",
  "Blue",
  "Green",
  "Other",
];

const VEHICLE_PLATE_REASONS = [
  "No front plate",
  "No plates",
  "No lights",
  "Plate obscured",
];

const VEHICLE_ALL_MODELS = Object.values(VEHICLE_MODELS)
  .flat()
  .reduce((acc, item) => {
    const model = String(item?.model || "").trim();
    if (!model) {
      return acc;
    }
    const key = model.toLowerCase();
    if (!acc.find((entry) => entry.model.toLowerCase() === key)) {
      acc.push({
        model,
        body: String(item?.body || "").trim(),
      });
    }
    return acc;
  }, [])
  .sort((a, b) => a.model.localeCompare(b.model));

const VEHICLE_BODY_OPTIONS = Array.from(
  new Set(
    VEHICLE_ALL_MODELS.map((item) => String(item.body || "").trim())
      .filter(Boolean)
      .concat(["Unknown", "Other"])
  )
).sort((a, b) => a.localeCompare(b));

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getActiveTimeZone() {
  return state.timezone || DEFAULT_TIMEZONE;
}

function getMapStyleById(styleId) {
  return MAP_STYLES.find((style) => style.id === styleId) || MAP_STYLES[0];
}

function getActiveMapStyle() {
  return getMapStyleById(state.mapSettings?.style || DEFAULT_MAP_STYLE);
}

function setMapStyle(styleId) {
  const next = getMapStyleById(styleId);
  state.mapSettings.style = next.id;
  applyMapStyle();
  persistMapSettings();
  persistState();
}

function applyMapStyle() {
  if (!window.L) {
    return;
  }
  const style = getActiveMapStyle();
  if (mainMap) {
    if (mainTileLayer) {
      mainMap.removeLayer(mainTileLayer);
    }
    mainTileLayer = window.L.tileLayer(style.url, {
      attribution: style.attribution,
      maxZoom: style.maxZoom,
    }).addTo(mainMap);
  }
}

function formatTimestamp(date) {
  const use24 = state.summaryTime24 !== false;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: getActiveTimeZone(),
    weekday: "short",
    month: "short",
    day: "2-digit",
    hour: use24 ? "2-digit" : "numeric",
    minute: "2-digit",
    hour12: !use24,
  });
  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  if (use24) {
    const hour = String(parts.hour || "").padStart(2, "0");
    return `${parts.weekday}, ${parts.month} ${parts.day} ${hour}:${parts.minute || "00"}`;
  }
  const dayPeriod = (parts.dayPeriod || "").toLowerCase();
  return `${parts.weekday}, ${parts.month} ${parts.day} ${parts.hour}:${parts.minute}${dayPeriod}`;
}

function formatTimeOnly(date) {
  const use24 = state.summaryTime24 !== false;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: getActiveTimeZone(),
    hour: use24 ? "2-digit" : "numeric",
    minute: "2-digit",
    hour12: !use24,
  });
  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  if (use24) {
    const hour = String(parts.hour || "").padStart(2, "0");
    return `${hour}:${parts.minute || "00"}`;
  }
  const dayPeriod = (parts.dayPeriod || "").toLowerCase();
  return `${parts.hour}:${parts.minute}${dayPeriod}`;
}

function formatSummaryTime(date) {
  const use24 = state.summaryTime24 !== false;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: getActiveTimeZone(),
    hour: "numeric",
    minute: "2-digit",
    hour12: !use24,
  });
  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  if (use24) {
    const hour = String(parts.hour || "").padStart(2, "0");
    return `${hour}:${parts.minute || "00"}`;
  }
  const dayPeriod = (parts.dayPeriod || "").toLowerCase();
  return `${parts.hour}:${parts.minute}${dayPeriod}`;
}

function formatSummaryTimestamp(date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: getActiveTimeZone(),
    weekday: "short",
    month: "short",
    day: "2-digit",
  });
  return `${formatter.format(date)} ${formatSummaryTime(date)}`;
}

function formatSummaryDate(date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: getActiveTimeZone(),
    weekday: "short",
    month: "short",
    day: "2-digit",
  });
  return formatter.format(date);
}

function getSummaryDateKey(date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: getActiveTimeZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatShortTimestamp(date) {
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");
  return `${month} ${day} @ ${formatSummaryTime(date)}`;
}

function formatPlate(raw) {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9*?&-]/g, "");
  if (/^\d{6}$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  }
  return cleaned;
}

function normalizeOptionValue(value, options) {
  const raw = String(value || "").trim();
  if (!raw || !Array.isArray(options) || !options.length) {
    return "";
  }
  const lower = raw.toLowerCase();
  const exact = options.find((item) => String(item || "").toLowerCase() === lower);
  if (exact) {
    return String(exact);
  }
  const prefix = options.find((item) => String(item || "").toLowerCase().startsWith(lower));
  return prefix ? String(prefix) : "";
}

function getVehicleModelsForMake(make) {
  const resolvedMake = resolveVehicleMake(make);
  const source = resolvedMake ? VEHICLE_MODELS[resolvedMake] || [] : VEHICLE_ALL_MODELS;
  return source.map((item) => ({
    model: String(item?.model || "").trim(),
    body: String(item?.body || "").trim(),
  }));
}

function resolveVehicleModel(value, make) {
  const models = getVehicleModelsForMake(make).map((item) => item.model);
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  const exact = models.find((item) => String(item || "").toLowerCase() === raw.toLowerCase());
  return exact ? String(exact) : "";
}

function resolveVehicleBody(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  const exact = VEHICLE_BODY_OPTIONS.find(
    (item) => String(item || "").toLowerCase() === raw.toLowerCase()
  );
  return exact ? String(exact) : "";
}

function resolveVehicleColor(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  const exact = VEHICLE_COLORS.find(
    (item) => String(item || "").toLowerCase() === raw.toLowerCase()
  );
  return exact ? String(exact) : "";
}

function setVehicleValidationWarning(input, showWarning, warningMessage) {
  if (!input) {
    return;
  }
  const show = Boolean(showWarning);
  input.classList.toggle("vehicle-validation-warning", show);
  input.setAttribute("aria-invalid", show ? "true" : "false");
  if (show && warningMessage) {
    input.title = warningMessage;
  } else {
    input.removeAttribute("title");
  }
}

function createEmptyVehicleInfo() {
  return {
    plateVisible: true,
    plate: "",
    reason: "",
    state: "",
    color: "",
    make: "",
    model: "",
    body: "",
  };
}

function normalizeVehicleInfo(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const plateVisible = source.plateVisible !== false;
  const makeRaw = String(source.make || "").trim();
  const resolvedMake = resolveVehicleMake(makeRaw);
  const make = resolvedMake || makeRaw;
  const modelRaw = String(source.model || "").trim();
  const resolvedModel = resolveVehicleModel(modelRaw, resolvedMake);
  const model = resolvedModel || modelRaw;
  const colorRaw = String(source.color || "").trim();
  const resolvedColor = resolveVehicleColor(colorRaw);
  const models = getVehicleModelsForMake(resolvedMake);
  const matchedModel = models.find((item) => item.model === resolvedModel) || null;
  const bodyRaw = String(source.body || "").trim();
  const resolvedBody = resolveVehicleBody(bodyRaw);
  const normalized = {
    plateVisible,
    plate: plateVisible ? formatPlate(source.plate || "") : "",
    reason: plateVisible ? "" : normalizeOptionValue(source.reason, VEHICLE_PLATE_REASONS),
    state: normalizeOptionValue(source.state, STATES),
    color: resolvedColor || colorRaw,
    make,
    model,
    body: resolvedBody || bodyRaw,
  };
  if (matchedModel && matchedModel.body) {
    normalized.body = matchedModel.body;
  }
  return normalized;
}

function hasVehicleInfo(info) {
  const normalized = normalizeVehicleInfo(info);
  return Boolean(
    normalized.plate ||
      normalized.reason ||
      normalized.state ||
      normalized.color ||
      normalized.make ||
      normalized.model ||
      normalized.body ||
      normalized.plateVisible === false
  );
}

function toVehicleToken(prefix, value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized ? `${prefix}_${normalized}` : `${prefix}_unknown`;
}

function fromVehicleToken(token, prefix, options) {
  const value = String(token || "").trim().toLowerCase();
  if (!value.startsWith(`${prefix}_`)) {
    return "";
  }
  const decoded = value
    .slice(prefix.length + 1)
    .replace(/_/g, " ")
    .trim();
  if (!decoded || decoded === "unknown") {
    return "";
  }
  return normalizeOptionValue(decoded, options);
}

function buildVehicleSummaryLineFromInfo(info) {
  const normalized = normalizeVehicleInfo(info);
  if (!hasVehicleInfo(normalized)) {
    return "";
  }
  const plateValue =
    normalized.plateVisible && normalized.plate ? formatPlate(normalized.plate) : "unknown_plate";
  const reasonSegment =
    !normalized.plateVisible && normalized.reason ? ` reason ${normalized.reason}` : "";
  const stateToken = toVehicleToken("state", normalized.state);
  const colorToken = toVehicleToken("color", normalized.color);
  const makeToken = toVehicleToken("make", normalized.make);
  const modelToken = toVehicleToken("model", normalized.model);
  const bodyToken = toVehicleToken("body", normalized.body);
  return `plate ${plateValue}${reasonSegment} ${stateToken} ${colorToken} ${makeToken} ${modelToken} ${bodyToken}`;
}

function parseVehicleInfoFromText(rawText) {
  const text = String(rawText || "");
  if (!text.trim()) {
    return createEmptyVehicleInfo();
  }
  const line = text
    .split(/\r?\n/)
    .map((item) => String(item || "").trim())
    .find((item) => item.toLowerCase().startsWith("plate "));
  if (!line) {
    return createEmptyVehicleInfo();
  }
  const normalizedLine = normalizeVehicleSummaryLine(line);
  const parts = normalizedLine.split(" ").filter(Boolean);
  const plateToken = String(parts[1] || "unknown_plate").trim();
  const reasonIndex = parts.findIndex((part) => part.toLowerCase() === "reason");
  const tokenIndexAfterReason = parts.findIndex(
    (part, index) =>
      index > reasonIndex && /^(state_|color_|make_|model_|body_)/i.test(part)
  );
  const reasonText =
    reasonIndex > -1
      ? parts
          .slice(reasonIndex + 1, tokenIndexAfterReason > -1 ? tokenIndexAfterReason : parts.length)
          .join(" ")
      : "";
  const reason = normalizeOptionValue(reasonText, VEHICLE_PLATE_REASONS);
  const stateToken = parts.find((part) => /^state_/i.test(part)) || "";
  const colorToken = parts.find((part) => /^color_/i.test(part)) || "";
  const makeToken = parts.find((part) => /^make_/i.test(part)) || "";
  const modelToken = parts.find((part) => /^model_/i.test(part)) || "";
  const bodyToken = parts.find((part) => /^body_/i.test(part)) || "";
  return normalizeVehicleInfo({
    plateVisible: plateToken.toLowerCase() !== "unknown_plate",
    plate: plateToken.toLowerCase() === "unknown_plate" ? "" : plateToken,
    reason,
    state: fromVehicleToken(stateToken, "state", STATES),
    color: fromVehicleToken(colorToken, "color", VEHICLE_COLORS),
    make: fromVehicleToken(makeToken, "make", VEHICLE_MAKES),
    model: fromVehicleToken(modelToken, "model", VEHICLE_ALL_MODELS.map((item) => item.model)),
    body: fromVehicleToken(bodyToken, "body", VEHICLE_BODY_OPTIONS),
  });
}

function populateDatalist(list, options) {
  list.innerHTML = "";
  options.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option;
    list.appendChild(opt);
  });
}

function updateModelOptions(make, { preserveModel = false } = {}) {
  const models = getVehicleModelsForMake(make);
  const previousModel = preserveModel ? String(vehicleModel?.value || "") : "";
  const previousBody = preserveModel ? String(vehicleBody?.value || "") : "";
  modelOptions.innerHTML = "";
  models.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item.model;
    opt.dataset.body = item.body;
    modelOptions.appendChild(opt);
  });
  const resolvedModel = resolveVehicleModel(previousModel, make);
  vehicleModel.value = resolvedModel || previousModel;
  const matched = models.find((item) => item.model === resolvedModel);
  if (bodyOptions) {
    const scopedBodyOptions = matched?.body
      ? [matched.body]
      : Array.from(new Set(models.map((item) => item.body).filter(Boolean)));
    const nextBodyOptions = scopedBodyOptions.length ? scopedBodyOptions : VEHICLE_BODY_OPTIONS;
    populateDatalist(bodyOptions, nextBodyOptions);
  }
  if (matched?.body) {
    vehicleBody.value = matched.body;
  } else {
    const resolvedBody = resolveVehicleBody(previousBody);
    vehicleBody.value = resolvedBody || previousBody;
  }
}

function resolveVehicleMake(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  const match = Object.keys(VEHICLE_MODELS).find(
    (key) => key.toLowerCase() === raw.toLowerCase()
  );
  return match || "";
}

function syncVehicleMakeAndModels() {
  if (!vehicleMake || !vehicleModel) {
    return;
  }
  const resolvedMake = resolveVehicleMake(vehicleMake.value);
  if (resolvedMake && vehicleMake.value !== resolvedMake) {
    vehicleMake.value = resolvedMake;
  }
  vehicleModel.disabled = false;
  updateModelOptions(resolvedMake, { preserveModel: true });
  updateVehicleModalValidationWarnings();
}

function updateVehicleModalValidationWarnings() {
  if (!vehicleMake || !vehicleModel || !vehicleColor || !vehicleBody) {
    return;
  }
  const makeValue = String(vehicleMake.value || "").trim();
  const resolvedMake = resolveVehicleMake(makeValue);
  const modelValue = String(vehicleModel.value || "").trim();
  const resolvedModel = resolveVehicleModel(modelValue, resolvedMake);
  const colorValue = String(vehicleColor.value || "").trim();
  const resolvedColor = resolveVehicleColor(colorValue);
  const bodyValue = String(vehicleBody.value || "").trim();
  const resolvedBody = resolveVehicleBody(bodyValue);

  setVehicleValidationWarning(
    vehicleMake,
    Boolean(makeValue && !resolvedMake),
    "Not in known makes. Manual entry will be kept."
  );
  setVehicleValidationWarning(
    vehicleModel,
    Boolean(modelValue && !resolvedModel),
    resolvedMake
      ? "Not in known models for selected make. Manual entry will be kept."
      : "Not in known models. Manual entry will be kept."
  );
  setVehicleValidationWarning(
    vehicleColor,
    Boolean(colorValue && !resolvedColor),
    "Not in known colors. Manual entry will be kept."
  );
  setVehicleValidationWarning(
    vehicleBody,
    Boolean(bodyValue && !resolvedBody),
    "Not in known body styles. Manual entry will be kept."
  );
}

function openVehicleModal(target, options = {}) {
  vehicleTarget = target;
  const modalTitle = String(options.title || "").trim() || "Add Vehicle";
  const modalSubtitle =
    String(options.subtitle || "").trim() ||
    "Add what info you know about the vehicle in question.";
  if (vehicleTitle) {
    vehicleTitle.textContent = modalTitle;
  }
  if (vehicleModalSubtitle) {
    vehicleModalSubtitle.textContent = modalSubtitle;
  }
  vehicleModal.classList.remove("hidden");
  vehicleModal.setAttribute("aria-hidden", "false");
  populateDatalist(stateOptions, STATES);
  populateDatalist(makeOptions, VEHICLE_MAKES);
  populateDatalist(colorOptions, VEHICLE_COLORS);
  if (bodyOptions) {
    populateDatalist(bodyOptions, VEHICLE_BODY_OPTIONS);
  }
  const prefill = normalizeVehicleInfo(options.prefill || {});
  vehiclePlate.disabled = false;
  vehiclePlate.value = prefill.plate || "";
  vehicleState.value = prefill.state || "";
  vehicleMake.value = prefill.make || "";
  vehicleColor.value = prefill.color || "";
  updateModelOptions(prefill.make || "", { preserveModel: false });
  vehicleModel.value = prefill.model || "";
  vehicleBody.value = prefill.body || "";
  vehicleModel.disabled = false;
  updateVehicleModalValidationWarnings();
  vehiclePlate.focus();
}

function blurFocusedElementWithin(container) {
  if (!container) {
    return;
  }
  const active = document.activeElement;
  if (active && container.contains(active) && typeof active.blur === "function") {
    active.blur();
  }
}

function closeVehicleModal() {
  blurFocusedElementWithin(vehicleModal);
  vehicleModal.classList.add("hidden");
  vehicleModal.setAttribute("aria-hidden", "true");
  vehicleTarget = null;
}

function openVehicleInfoModalForNote(columnId, obsId) {
  const column = state.columns.find((col) => col.id === columnId);
  if (!column) {
    return;
  }
  const obs = column.observations.find((item) => item.id === obsId);
  if (!obs) {
    return;
  }
  const listName = String(column.label || "").trim();
  const title = isVehicleListType(column.type || DEFAULT_CARD_TYPE)
    ? `Add new vehicle to List "${listName || "Vehicle List"}"`
    : "Add Vehicle";
  openVehicleModal(
    { kind: "note-vehicle-info", columnId, obsId },
    {
      prefill: normalizeVehicleInfo(obs.vehicleInfo || {}),
      title,
    }
  );
}

function openDeleteModal(columnId, obsId) {
  deleteTarget = { kind: "note", columnId, obsId };
  if (deleteTitle) {
    deleteTitle.textContent = "Delete this note?";
  }
  if (deleteConfirm) {
    deleteConfirm.textContent = "Delete";
  }
  deleteModal.classList.remove("hidden");
  deleteModal.setAttribute("aria-hidden", "false");
  if (deleteCancel) {
    deleteCancel.focus();
  }
  if (!deleteModalKeyHandler) {
    deleteModalKeyHandler = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDeleteModal();
        return;
      }
      if (
        event.key === "Tab" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        const buttons = [deleteCancel, deleteConfirm].filter(Boolean);
        if (buttons.length < 2) {
          return;
        }
        event.preventDefault();
        const currentIndex = buttons.indexOf(document.activeElement);
        const isPrev =
          event.shiftKey || event.key === "ArrowLeft" || event.key === "ArrowUp";
        const nextIndex = isPrev
          ? (currentIndex - 1 + buttons.length) % buttons.length
          : (currentIndex + 1) % buttons.length;
        buttons[nextIndex].focus();
      }
    };
    deleteModal.addEventListener("keydown", deleteModalKeyHandler);
  }
}

function openColumnDeleteModal(columnId) {
  deleteTarget = { kind: "column", columnId };
  if (deleteTitle) {
    deleteTitle.textContent = "Delete this card?";
  }
  if (deleteConfirm) {
    deleteConfirm.textContent = "Delete";
  }
  deleteModal.classList.remove("hidden");
  deleteModal.setAttribute("aria-hidden", "false");
  if (deleteCancel) {
    deleteCancel.focus();
  }
  if (!deleteModalKeyHandler) {
    deleteModalKeyHandler = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDeleteModal();
        return;
      }
      if (
        event.key === "Tab" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        const buttons = [deleteCancel, deleteConfirm].filter(Boolean);
        if (buttons.length < 2) {
          return;
        }
        event.preventDefault();
        const currentIndex = buttons.indexOf(document.activeElement);
        const isPrev =
          event.shiftKey || event.key === "ArrowLeft" || event.key === "ArrowUp";
        const nextIndex = isPrev
          ? (currentIndex - 1 + buttons.length) % buttons.length
          : (currentIndex + 1) % buttons.length;
        buttons[nextIndex].focus();
      }
    };
    deleteModal.addEventListener("keydown", deleteModalKeyHandler);
  }
}

function closeDeleteModal() {
  blurFocusedElementWithin(deleteModal);
  deleteModal.classList.add("hidden");
  deleteModal.setAttribute("aria-hidden", "true");
  deleteTarget = null;
  if (deleteConfirm) {
    deleteConfirm.textContent = "Delete";
  }
  if (deleteModalKeyHandler) {
    deleteModal.removeEventListener("keydown", deleteModalKeyHandler);
    deleteModalKeyHandler = null;
  }
}

function openReverseGeocodeModal(oldLabel, newLabel) {
  if (!reverseGeocodeModal) {
    return Promise.resolve(false);
  }
  if (reverseGeocodeOld) {
    reverseGeocodeOld.textContent = formatFallbackLabel(oldLabel);
  }
  if (reverseGeocodeNew) {
    reverseGeocodeNew.textContent = formatFallbackLabel(newLabel);
  }
  reverseGeocodeModal.classList.remove("hidden");
  reverseGeocodeModal.setAttribute("aria-hidden", "false");
  if (reverseGeocodeCancel) {
    reverseGeocodeCancel.focus();
  }
  return new Promise((resolve) => {
    reverseGeocodeResolver = resolve;
    if (!reverseGeocodeKeyHandler) {
      reverseGeocodeKeyHandler = (event) => {
        if (event.key === "Escape" || event.key === "Enter") {
          event.preventDefault();
          closeReverseGeocodeModal(false);
          return;
        }
        if (
          event.key === "Tab" ||
          event.key === "ArrowLeft" ||
          event.key === "ArrowRight" ||
          event.key === "ArrowUp" ||
          event.key === "ArrowDown"
        ) {
          const buttons = [reverseGeocodeCancel, reverseGeocodeConfirm].filter(Boolean);
          if (buttons.length < 2) {
            return;
          }
          event.preventDefault();
          const currentIndex = buttons.indexOf(document.activeElement);
          const isPrev =
            event.shiftKey || event.key === "ArrowLeft" || event.key === "ArrowUp";
          const nextIndex = isPrev
            ? (currentIndex - 1 + buttons.length) % buttons.length
            : (currentIndex + 1) % buttons.length;
          buttons[nextIndex].focus();
        }
      };
      reverseGeocodeModal.addEventListener("keydown", reverseGeocodeKeyHandler);
    }
  });
}

function closeReverseGeocodeModal(useNew) {
  if (reverseGeocodeModal) {
    blurFocusedElementWithin(reverseGeocodeModal);
    reverseGeocodeModal.classList.add("hidden");
    reverseGeocodeModal.setAttribute("aria-hidden", "true");
  }
  if (reverseGeocodeKeyHandler && reverseGeocodeModal) {
    reverseGeocodeModal.removeEventListener("keydown", reverseGeocodeKeyHandler);
    reverseGeocodeKeyHandler = null;
  }
  if (reverseGeocodeResolver) {
    reverseGeocodeResolver(Boolean(useNew));
    reverseGeocodeResolver = null;
  }
}

function openSaveInfoModal() {
  if (!saveInfoModal) {
    return;
  }
  saveInfoModal.classList.remove("hidden");
  saveInfoModal.setAttribute("aria-hidden", "false");
}

function closeSaveInfoModal() {
  if (!saveInfoModal) {
    return;
  }
  blurFocusedElementWithin(saveInfoModal);
  saveInfoModal.classList.add("hidden");
  saveInfoModal.setAttribute("aria-hidden", "true");
}

function openVersionModal() {
  if (!versionModal) {
    return;
  }
  versionModal.classList.remove("hidden");
  versionModal.setAttribute("aria-hidden", "false");
  if (versionClose) {
    versionClose.focus();
  }
}

function closeVersionModal() {
  if (!versionModal) {
    return;
  }
  if (versionClose && versionClose === document.activeElement) {
    versionButton?.focus();
  }
  blurFocusedElementWithin(versionModal);
  versionModal.classList.add("hidden");
  versionModal.setAttribute("aria-hidden", "true");
}

function openLocationClearModal(target) {
  if (!deleteModal) {
    return;
  }
  deleteTarget = { kind: "location", target };
  if (deleteTitle) {
    deleteTitle.textContent = "Clear location pin?";
  }
  if (deleteConfirm) {
    deleteConfirm.textContent = "Clear";
  }
  deleteModal.classList.remove("hidden");
  deleteModal.setAttribute("aria-hidden", "false");
  if (deleteCancel) {
    deleteCancel.focus();
  }
  if (!deleteModalKeyHandler) {
    deleteModalKeyHandler = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDeleteModal();
        return;
      }
      if (
        event.key === "Tab" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        const buttons = [deleteCancel, deleteConfirm].filter(Boolean);
        if (buttons.length < 2) {
          return;
        }
        event.preventDefault();
        const currentIndex = buttons.indexOf(document.activeElement);
        const isPrev =
          event.shiftKey || event.key === "ArrowLeft" || event.key === "ArrowUp";
        const nextIndex = isPrev
          ? (currentIndex - 1 + buttons.length) % buttons.length
          : (currentIndex + 1) % buttons.length;
        buttons[nextIndex].focus();
      }
    };
    deleteModal.addEventListener("keydown", deleteModalKeyHandler);
  }
}

function parseTimestamp(text) {
  const trimmed = text.trim();
  const regex12 =
    /^(?:[A-Za-z]{3},\s*)?([A-Za-z]{3})\s(\d{1,2})\s(\d{1,2}):(\d{2})(am|pm)$/i;
  const regex24 = /^(?:[A-Za-z]{3},\s*)?([A-Za-z]{3})\s(\d{1,2})\s(\d{1,2}):(\d{2})$/i;
  const timeOnlyRegex12 = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i;
  const timeOnlyRegex24 = /^(\d{1,2}):(\d{2})$/i;
  const match12 = trimmed.match(regex12);
  const match24 = trimmed.match(regex24);
  const timeOnlyMatch12 = trimmed.match(timeOnlyRegex12);
  const timeOnlyMatch24 = trimmed.match(timeOnlyRegex24);
  let monthIndex = null;
  let dayNum = null;
  let hourNum = null;
  let minuteNum = null;
  let meridian = "";
  let is24Input = false;
  if (match12) {
    const [, monthRaw, dayRaw, hourRaw, minuteRawRaw, meridianRaw] = match12;
    monthIndex = months.findIndex(
      (month) => month.toLowerCase() === monthRaw.toLowerCase()
    );
    if (monthIndex === -1) {
      return null;
    }
    dayNum = Number(dayRaw);
    hourNum = Number(hourRaw);
    minuteNum = Number(minuteRawRaw);
    meridian = meridianRaw;
  } else if (match24) {
    const [, monthRaw, dayRaw, hourRaw, minuteRawRaw] = match24;
    monthIndex = months.findIndex(
      (month) => month.toLowerCase() === monthRaw.toLowerCase()
    );
    if (monthIndex === -1) {
      return null;
    }
    dayNum = Number(dayRaw);
    hourNum = Number(hourRaw);
    minuteNum = Number(minuteRawRaw);
    is24Input = true;
  } else if (timeOnlyMatch12) {
    const [, hourRaw, minuteRawRaw, meridianRaw] = timeOnlyMatch12;
    const now = new Date();
    monthIndex = now.getMonth();
    dayNum = now.getDate();
    hourNum = Number(hourRaw);
    minuteNum = Number(minuteRawRaw);
    meridian = meridianRaw;
  } else if (timeOnlyMatch24) {
    const [, hourRaw, minuteRawRaw] = timeOnlyMatch24;
    const now = new Date();
    monthIndex = now.getMonth();
    dayNum = now.getDate();
    hourNum = Number(hourRaw);
    minuteNum = Number(minuteRawRaw);
    is24Input = true;
  } else {
    return null;
  }
  const invalidHour = is24Input
    ? hourNum < 0 || hourNum > 23
    : hourNum < 1 || hourNum > 12;
  if (dayNum < 1 || dayNum > 31 || invalidHour || minuteNum > 59) {
    return null;
  }
  let hours = hourNum;
  if (!is24Input) {
    hours = hourNum % 12;
    if (meridian.toLowerCase() === "pm") {
      hours += 12;
    }
  }
  const now = new Date();
  const date = new Date(now.getFullYear(), monthIndex, dayNum, hours, minuteNum);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function parseShiftTimestamp(text) {
  const luxon = window.luxon;
  if (!luxon || !luxon.DateTime) {
    return parseTimestamp(text);
  }
  const trimmed = text.trim();
  const regex12 =
    /^(?:[A-Za-z]{3},\s*)?([A-Za-z]{3})\s(\d{1,2})\s(\d{1,2}):(\d{2})(am|pm)$/i;
  const regex24 = /^(?:[A-Za-z]{3},\s*)?([A-Za-z]{3})\s(\d{1,2})\s(\d{1,2}):(\d{2})$/i;
  const timeOnlyRegex12 = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i;
  const timeOnlyRegex24 = /^(\d{1,2}):(\d{2})$/i;
  const match12 = trimmed.match(regex12);
  const match24 = trimmed.match(regex24);
  const timeOnlyMatch12 = trimmed.match(timeOnlyRegex12);
  const timeOnlyMatch24 = trimmed.match(timeOnlyRegex24);
  let monthIndex = null;
  let dayNum = null;
  let hourNum = null;
  let minuteNum = null;
  let meridian = "";
  let is24Input = false;
  const zone = getActiveTimeZone();
  const nowInZone = luxon.DateTime.now().setZone(zone);
  const baseYear = nowInZone.isValid ? nowInZone.year : new Date().getFullYear();
  const baseMonth = nowInZone.isValid ? nowInZone.month - 1 : new Date().getMonth();
  const baseDay = nowInZone.isValid ? nowInZone.day : new Date().getDate();
  if (match12) {
    const [, monthRaw, dayRaw, hourRaw, minuteRawRaw, meridianRaw] = match12;
    monthIndex = months.findIndex(
      (month) => month.toLowerCase() === monthRaw.toLowerCase()
    );
    if (monthIndex === -1) {
      return null;
    }
    dayNum = Number(dayRaw);
    hourNum = Number(hourRaw);
    minuteNum = Number(minuteRawRaw);
    meridian = meridianRaw;
  } else if (match24) {
    const [, monthRaw, dayRaw, hourRaw, minuteRawRaw] = match24;
    monthIndex = months.findIndex(
      (month) => month.toLowerCase() === monthRaw.toLowerCase()
    );
    if (monthIndex === -1) {
      return null;
    }
    dayNum = Number(dayRaw);
    hourNum = Number(hourRaw);
    minuteNum = Number(minuteRawRaw);
    is24Input = true;
  } else if (timeOnlyMatch12) {
    const [, hourRaw, minuteRawRaw, meridianRaw] = timeOnlyMatch12;
    monthIndex = baseMonth;
    dayNum = baseDay;
    hourNum = Number(hourRaw);
    minuteNum = Number(minuteRawRaw);
    meridian = meridianRaw;
  } else if (timeOnlyMatch24) {
    const [, hourRaw, minuteRawRaw] = timeOnlyMatch24;
    monthIndex = baseMonth;
    dayNum = baseDay;
    hourNum = Number(hourRaw);
    minuteNum = Number(minuteRawRaw);
    is24Input = true;
  } else {
    return null;
  }
  const invalidHour = is24Input
    ? hourNum < 0 || hourNum > 23
    : hourNum < 1 || hourNum > 12;
  if (dayNum < 1 || dayNum > 31 || invalidHour || minuteNum > 59) {
    return null;
  }
  let hours = hourNum;
  if (!is24Input) {
    hours = hourNum % 12;
    if (meridian.toLowerCase() === "pm") {
      hours += 12;
    }
  }
  const zoned = luxon.DateTime.fromObject(
    {
      year: baseYear,
      month: monthIndex + 1,
      day: dayNum,
      hour: hours,
      minute: minuteNum,
    },
    { zone }
  );
  if (!zoned.isValid) {
    return null;
  }
  return zoned.toJSDate();
}

function createDefaultColumns() {
  const typeCounts = {};
  const baseTime = Date.now();
  const baseType = getNextCardTypeForNewColumn();
  state.columns = [];
  state.columns.push(
    {
      id: createId(),
      type: baseType,
      minimized: false,
      color: getDefaultColorForCardType(baseType),
      label: getNextCustomLabel(baseType, typeCounts),
      labelAuto: true,
      reportAll: false,
      createdAt: baseTime,
      vehicleProfile: getDefaultVehicleProfileForType(baseType),
      location: null,
      observations: [],
    },
    {
      id: createId(),
      type: baseType,
      minimized: false,
      color: getDefaultColorForCardType(baseType),
      label: getNextCustomLabel(baseType, typeCounts),
      labelAuto: true,
      reportAll: false,
      createdAt: baseTime + 1,
      vehicleProfile: getDefaultVehicleProfileForType(baseType),
      location: null,
      observations: [],
    },
    {
      id: createId(),
      type: baseType,
      minimized: false,
      color: getDefaultColorForCardType(baseType),
      label: getNextCustomLabel(baseType, typeCounts),
      labelAuto: true,
      reportAll: false,
      createdAt: baseTime + 2,
      vehicleProfile: getDefaultVehicleProfileForType(baseType),
      location: null,
      observations: [],
    },
  );
}

function getTimezones() {
  return TIMEZONE_CHOICES;
}

function getTimezoneLabel(value) {
  const match = TIMEZONE_CHOICES.find((zone) => zone.value === value);
  if (match) {
    return match.label;
  }
  return value ? `Custom (${value})` : "Custom";
}

function updateTimezoneLink() {
  if (!timezoneLink) {
    return;
  }
  timezoneLink.textContent = getTimezoneLabel(state.timezone || DEFAULT_TIMEZONE);
}

function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

function renderSummaryDefaultExclude() {
  if (!summaryDefaultExclude) {
    return;
  }
  const excludeSet = getSummaryExcludeSet();
  summaryDefaultExclude.innerHTML = "";
  const seen = new Set();
  const getSummaryExcludeLabel = (typeValue) => {
    const normalized = normalizeCardType(typeValue);
    if (normalized === OBSERVER_BIKE_TYPE) {
      return "Observer Bike";
    }
    if (normalized === OBSERVER_CAR_TYPE) {
      return "Observer Car";
    }
    if (normalized === OBSERVER_CARD_TYPE) {
      return "Observer";
    }
    return getCardTypeMeta(normalized).label;
  };
  getCardTypeOptionsUnique().forEach((type) => {
    const normalizedType = normalizeCardType(type.value);
    if (seen.has(normalizedType)) {
      return;
    }
    seen.add(normalizedType);
    const label = document.createElement("label");
    label.className = "summary-checkbox settings-checkbox";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = normalizedType;
    input.checked = excludeSet.has(normalizedType);
    input.addEventListener("change", () => {
      const next = new Set(getSummaryExcludeSet());
      if (input.checked) {
        next.add(normalizedType);
      } else {
        next.delete(normalizedType);
      }
      state.summaryDefaultExclude = Array.from(next);
      syncSummaryDefaultExclude(getSummaryTypes({ reportableOnly: false }));
      markDirty();
      persistState();
      renderSummaryFilters();
      updateSummary();
    });
    const text = document.createElement("span");
    text.textContent = getSummaryExcludeLabel(type.value);
    label.appendChild(input);
    label.appendChild(text);
    summaryDefaultExclude.appendChild(label);
  });
}

function renderCardTypeAvailability() {
  if (!cardTypeAvailability) {
    return;
  }
  const available = getAvailableCardTypeSet();
  const options = getCardTypeOptionsUnique();
  cardTypeAvailability.innerHTML = "";
  options.forEach((type) => {
    const normalizedType = normalizeCardType(type.value);
    const label = document.createElement("label");
    label.className = "summary-checkbox settings-checkbox";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = normalizedType;
    input.checked = available.has(normalizedType);
    input.addEventListener("change", () => {
      const next = new Set(getAvailableCardTypeSet());
      if (input.checked) {
        next.add(normalizedType);
      } else {
        next.delete(normalizedType);
      }
      if (!next.size) {
        input.checked = true;
        showAppToast("At least one card type must stay enabled.");
        return;
      }
      state.availableCardTypes = Array.from(next);
      if (state.defaultNewCardType !== "last" && !next.has(normalizeCardType(state.defaultNewCardType))) {
        state.defaultNewCardType = "last";
      }
      markDirty();
      persistState();
      renderCardTypeAvailability();
      renderDefaultCardTypeSelect();
      renderDefaultCardColorSettings();
    });
    const text = document.createElement("span");
    if (normalizedType === OBSERVER_BIKE_TYPE) {
      text.textContent = "Observer Bike";
    } else if (normalizedType === OBSERVER_CAR_TYPE) {
      text.textContent = "Observer Car";
    } else if (normalizedType === OBSERVER_CARD_TYPE) {
      text.textContent = "Observer";
    } else {
      text.textContent = type.label;
    }
    label.appendChild(input);
    label.appendChild(text);
    cardTypeAvailability.appendChild(label);
  });
}

function renderDefaultCardTypeSelect() {
  if (!defaultCardTypeSelect) {
    return;
  }
  defaultCardTypeSelect.innerHTML = "";
  defaultCardTypeDropdown = createCustomSelect({
    options: [
      { value: "last", label: "Last used (default)", icon: "history" },
      ...getSelectableCardTypes(state.defaultNewCardType).map((type) => ({
        value: type.value,
        label: type.label,
        icon: type.icon,
      })),
    ],
    value: state.defaultNewCardType || "last",
    ariaLabel: "Default new card type",
    className: "default-card-type-dropdown",
    portal: false,
    matchButtonWidth: true,
    onChange: (nextType) => {
      state.defaultNewCardType = nextType || "last";
      markDirty();
      persistState();
    },
  });
  defaultCardTypeSelect.appendChild(defaultCardTypeDropdown.element);
}

function renderDefaultCardColorSettings() {
  state.cardColorDefaults = normalizeCardColorDefaults(state.cardColorDefaults);
  applyDynamicCardColorStyles();
  if (defaultCardColorModeSelect) {
    defaultCardColorModeSelect.value = state.cardColorDefaults.mode;
  }
  if (defaultCardColorPalette) {
    defaultCardColorPalette.innerHTML = "";
    const palettePicker = createCustomSelect({
      options: CARD_COLOR_PALETTES.map((palette) => ({
        value: palette.id,
        label: palette.label,
        paletteColors: palette.colors,
      })),
      value: state.cardColorDefaults.palette || DEFAULT_CARD_COLOR_PALETTE,
      ariaLabel: "Default card color palette",
      className: "default-palette-dropdown",
      portal: false,
      matchButtonWidth: true,
      onChange: (nextPalette) => {
        state.cardColorDefaults.palette = getCardPaletteById(nextPalette).id;
        if (
          state.cardColorDefaults.mode === "color-by-type" ||
          state.cardColorDefaults.mode === "all-grey"
        ) {
          state.cardColorDefaults.byType = getCardTypePresetColorMap(state.cardColorDefaults.mode);
        }
        markDirty();
        persistState();
        renderDefaultCardColorSettings();
        renderColumns();
      },
    });
    defaultCardColorPalette.appendChild(palettePicker.element);
  }
  if (!defaultCardColorByType) {
    return;
  }
  defaultCardColorByType.innerHTML = "";
  const showTypePickers = state.cardColorDefaults.mode !== "cycle";
  defaultCardColorByType.classList.toggle("hidden", !showTypePickers);
  syncSettingsGridMinHeight(showTypePickers);
  if (!showTypePickers) {
    const cycleNote = document.createElement("div");
    cycleNote.className = "default-color-cycle-note";
    cycleNote.textContent =
      "New cards get the next sequential color, regardless of type.";
    defaultCardColorByType.appendChild(cycleNote);
    return;
  }
  const effectiveMap = getEffectiveCardTypeColorMap();
  const groupsWrap = document.createElement("div");
  groupsWrap.className = "default-color-groups";
  getCardColorSettingGroups().forEach((group) => {
    const row = document.createElement("div");
    row.className = "default-color-row";

    const label = document.createElement("div");
    label.className = "default-color-label";
    const icon = createCardTypeIconNode(group.types[0] || group.label);
    icon.setAttribute("aria-hidden", "true");
    const labelText = document.createElement("span");
    labelText.textContent = group.label;
    label.appendChild(icon);
    label.appendChild(labelText);

    const selectedColor = getGroupDefaultColor(group.types, effectiveMap);
    const pickerHost = document.createElement("div");
    pickerHost.className = "default-color-picker";
    const picker = createCustomSelect({
      options: getDefaultColorPickerOptions(),
      value: String(selectedColor),
      ariaLabel: `${group.label} default color`,
      className: "default-color-dropdown",
      portal: false,
      matchButtonWidth: true,
      onChange: (nextColorValue) => {
        const colorIndex = Number(nextColorValue);
        const currentMap = getEffectiveCardTypeColorMap();
        group.types.forEach((type) => {
          currentMap[type] = colorIndex;
        });
        state.cardColorDefaults.mode = "manual";
        state.cardColorDefaults.byType = currentMap;
        if (defaultCardColorModeSelect) {
          defaultCardColorModeSelect.value = "manual";
        }
        markDirty();
        persistState();
        renderDefaultCardColorSettings();
      },
    });
    pickerHost.appendChild(picker.element);

    row.appendChild(label);
    row.appendChild(pickerHost);
    groupsWrap.appendChild(row);
  });
  defaultCardColorByType.appendChild(groupsWrap);
  refreshIcons();
  syncSettingsGridMinHeight(true);
}

function syncSettingsGridMinHeight(showTypePickers) {
  if (!settingsGrid) {
    return;
  }
  if (!showTypePickers) {
    if (settingsGridExpandedMinHeight > 0) {
      settingsGrid.style.minHeight = `${settingsGridExpandedMinHeight}px`;
    }
    return;
  }
  const colorSection = defaultCardColorModeSelect?.closest(".settings-section");
  if (!colorSection) {
    return;
  }
  requestAnimationFrame(() => {
    const expandedHeight = Math.ceil(colorSection.getBoundingClientRect().height);
    if (expandedHeight <= 0) {
      return;
    }
    settingsGridExpandedMinHeight = expandedHeight;
    settingsGrid.style.minHeight = `${settingsGridExpandedMinHeight}px`;
  });
}

function getDefaultColorPickerOptions() {
  const options = PALETTE_COLOR_INDICES.map((colorIndex) => {
    return {
      value: String(colorIndex),
      label: getColorNameByIndex(colorIndex),
      swatchClass: `color-${colorIndex}`,
    };
  });
  options.push({
    value: String(CHARCOAL_COLOR_INDEX),
    label: "Charcoal",
    swatchClass: `color-${CHARCOAL_COLOR_INDEX}`,
  });
  options.push({
    value: String(GREY_COLOR_INDEX),
    label: "Grey",
    swatchClass: `color-${GREY_COLOR_INDEX}`,
  });
  options.push({
    value: String(OFFWHITE_COLOR_INDEX),
    label: "Off-white",
    swatchClass: `color-${OFFWHITE_COLOR_INDEX}`,
  });
  return options;
}

function getCardColorSettingGroups() {
  const groups = [];
  getSelectableCardTypes().forEach((typeMeta) => {
    const type = normalizeCardType(typeMeta.value);
    const already = groups.find((group) => group.types.includes(type));
    if (already) {
      return;
    }
    groups.push({
      label: typeMeta.label,
      types: [type],
    });
  });
  return groups;
}

function getGroupDefaultColor(types, colorMap = null) {
  const sourceMap = colorMap || state.cardColorDefaults?.byType || {};
  // Use the first valid configured color found in the group.
  for (const type of types) {
    const next = Number(sourceMap[type]);
    if (ACTIVE_COLUMN_COLOR_INDICES.includes(next)) {
      return next;
    }
  }
  return PALETTE_COLOR_INDICES[0];
}

function createCardTypeIconNode(type) {
  const normalized = normalizeCardType(type);
  const createLucideSvg = (iconName) => {
    if (!window.lucide?.createElement || !window.lucide?.icons) {
      const fallback = document.createElement("i");
      fallback.setAttribute("data-lucide", iconName);
      return fallback;
    }
    const key = String(iconName || "")
      .split(/[-_\s]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
    const iconNode = window.lucide.icons[key] || window.lucide.icons[iconName];
    if (!iconNode) {
      const fallback = document.createElement("i");
      fallback.setAttribute("data-lucide", iconName);
      return fallback;
    }
    const svg = window.lucide.createElement(iconNode);
    svg.classList.add("lucide");
    return svg;
  };
  if (normalized === VEHICLE_LIST_CARD_TYPE) {
    const stack = document.createElement("span");
    stack.className = "stack-cars-icon";
    const rear = document.createElement("span");
    rear.className = "stack-car rear";
    rear.appendChild(createLucideSvg("car"));
    const back = document.createElement("span");
    back.className = "stack-car back";
    back.appendChild(createLucideSvg("car"));
    const front = document.createElement("span");
    front.className = "stack-car front";
    front.appendChild(createLucideSvg("car"));
    stack.appendChild(rear);
    stack.appendChild(back);
    stack.appendChild(front);
    return stack;
  }
  const icon = document.createElement("i");
  icon.setAttribute("data-lucide", getCardTypeMeta(normalized).icon);
  return icon;
}

function getNextCardTypeForNewColumn() {
  const availableTypes = getSelectableCardTypes();
  const fallback = availableTypes[0]?.value || DEFAULT_CARD_TYPE;
  if (state.defaultNewCardType && state.defaultNewCardType !== "last") {
    const preferred = normalizeCardType(state.defaultNewCardType);
    if (isCardTypeAvailable(preferred)) {
      return preferred;
    }
    return fallback;
  }
  const lastColumn = state.columns[state.columns.length - 1];
  const lastType = normalizeCardType(lastColumn?.type || DEFAULT_CARD_TYPE);
  if (isCardTypeAvailable(lastType)) {
    return lastType;
  }
  return fallback;
}

function ensureLucideIcon(container) {
  if (!container) {
    return;
  }
  const existing = container.querySelector("svg.lucide");
  if (existing) {
    return;
  }
  const placeholder = container.querySelector("[data-lucide]");
  if (!placeholder) {
    return;
  }
  const name = placeholder.getAttribute("data-lucide");
  if (!name || !window.lucide?.createElement || !window.lucide?.icons) {
    return;
  }
  const key = name
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const iconNode = window.lucide.icons[key] || window.lucide.icons[name];
  if (!iconNode) {
    return;
  }
  const svg = window.lucide.createElement(iconNode);
  placeholder.replaceWith(svg);
}

async function copyTextToClipboard(text) {
  const value = String(text || "").trim();
  if (!value) {
    return false;
  }
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      // Fall through to legacy copy path.
    }
  }
  const hiddenInput = document.createElement("textarea");
  hiddenInput.value = value;
  hiddenInput.setAttribute("readonly", "readonly");
  hiddenInput.style.position = "fixed";
  hiddenInput.style.top = "-9999px";
  hiddenInput.style.left = "-9999px";
  hiddenInput.style.opacity = "0";
  hiddenInput.style.pointerEvents = "none";
  document.body.appendChild(hiddenInput);
  hiddenInput.focus();
  hiddenInput.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (error) {
    copied = false;
  }
  hiddenInput.remove();
  return copied;
}

function showAppToast(message, durationMs = 1800) {
  const text = String(message || "").trim();
  if (!text) {
    return;
  }
  let toast = document.getElementById("appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = "app-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.add("show");
  if (appToastTimer) {
    window.clearTimeout(appToastTimer);
  }
  appToastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, durationMs);
}

function focusTimezoneSetting() {
  handleTabSwitch("settings");
  requestAnimationFrame(() => {
    if (settingsTimezone) {
      settingsTimezone.classList.remove("settings-highlight");
      void settingsTimezone.offsetWidth;
      settingsTimezone.classList.add("settings-highlight");
      settingsTimezone.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const button = timezoneSelect?.querySelector(".select-button");
    if (button) {
      button.focus({ preventScroll: true });
    }
  });
}

function focusMapSettings() {
  handleTabSwitch("settings");
  requestAnimationFrame(() => {
    if (mapSettingsSection) {
      mapSettingsSection.classList.remove("settings-highlight");
      void mapSettingsSection.offsetWidth;
      mapSettingsSection.classList.add("settings-highlight");
      mapSettingsSection.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (setCityButton) {
      setCityButton.focus({ preventScroll: true });
    }
  });
}

function focusCardColorSettings() {
  handleTabSwitch("settings");
  requestAnimationFrame(() => {
    const colorSection = defaultCardColorModeSelect?.closest(".settings-section");
    if (colorSection) {
      colorSection.classList.remove("settings-highlight");
      void colorSection.offsetWidth;
      colorSection.classList.add("settings-highlight");
      colorSection.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const focusTarget =
      defaultCardColorPalette?.querySelector(".select-button") || defaultCardColorModeSelect;
    if (focusTarget) {
      focusTarget.focus({ preventScroll: true });
    }
  });
}

function getSystemTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
}

function isValidTimeZone(value) {
  if (!value) {
    return false;
  }
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch (error) {
    return false;
  }
}

function normalizeTimeZone(value) {
  if (value === "detect") {
    return getSystemTimeZone();
  }
  if (!isValidTimeZone(value)) {
    return DEFAULT_TIMEZONE;
  }
  return value;
}

function selectColumn(columnId) {
  state.selection = { kind: "column", columnId, obsId: null };
}

function selectNote(columnId, obsId) {
  state.selection = { kind: "note", columnId, obsId };
}

function clearSelection() {
  state.selection = null;
}

function isColumnSelected(columnId) {
  return state.selection?.kind === "column" && state.selection.columnId === columnId;
}

function isNoteSelected(columnId, obsId) {
  return (
    state.selection?.kind === "note" &&
    state.selection.columnId === columnId &&
    state.selection.obsId === obsId
  );
}

function minimizeColumnById(columnId) {
  const column = state.columns.find((col) => col.id === columnId);
  if (!column || column.minimized) {
    return;
  }
  const selector = `[data-column-id=\"${escapeSelector(columnId)}\"]`;
  const columnEl = columnsEl ? columnsEl.querySelector(selector) : null;
  const finalize = () => {
    column.minimized = true;
    if (state.selection?.columnId === columnId) {
      clearSelection();
    }
    markDirty();
    renderColumns();
    persistState();
    updateSummary();
  };
  if (!columnEl) {
    finalize();
    return;
  }
  columnEl.classList.add("minimizing");
  let settled = false;
  const onDone = () => {
    if (settled) {
      return;
    }
    settled = true;
    finalize();
  };
  columnEl.addEventListener("transitionend", onDone, { once: true });
  setTimeout(onDone, 260);
}

function escapeSelector(value) {
  if (typeof CSS !== "undefined" && CSS.escape) {
    return CSS.escape(value);
  }
  return String(value).replace(/\"/g, "\\\"");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applySelectionUI() {
  if (!columnsEl) {
    return;
  }
  columnsEl.querySelectorAll(".column.selected").forEach((el) => {
    el.classList.remove("selected");
  });
  columnsEl.querySelectorAll(".observation.selected").forEach((el) => {
    el.classList.remove("selected");
  });
  if (!state.selection) {
    return;
  }
  if (state.selection.kind === "column") {
    const selector = `[data-column-id=\"${escapeSelector(state.selection.columnId)}\"]`;
    const columnEl = columnsEl.querySelector(selector);
    if (columnEl) {
      columnEl.classList.add("selected");
    }
  } else if (state.selection.kind === "note") {
    const selector = `[data-note-id=\"${escapeSelector(state.selection.obsId)}\"]`;
    const noteEl = columnsEl.querySelector(selector);
    if (noteEl) {
      noteEl.classList.add("selected");
    }
  }
}

function getColumnRects() {
  if (!columnsEl) {
    return new Map();
  }
  const rects = new Map();
  columnsEl.querySelectorAll(".column[data-column-id]").forEach((columnEl) => {
    if (columnEl.classList.contains("dragging")) {
      return;
    }
    rects.set(columnEl.dataset.columnId, columnEl.getBoundingClientRect());
  });
  return rects;
}

function animateColumnSwap(previousRects) {
  if (!columnsEl || !previousRects.size) {
    return;
  }
  requestAnimationFrame(() => {
    columnsEl.querySelectorAll(".column[data-column-id]").forEach((columnEl) => {
      if (columnEl.classList.contains("dragging")) {
        return;
      }
      const prev = previousRects.get(columnEl.dataset.columnId);
      if (!prev) {
        return;
      }
      const next = columnEl.getBoundingClientRect();
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (!dx && !dy) {
        return;
      }
      columnEl.style.transition = "none";
      columnEl.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        columnEl.style.transition = "transform 180ms ease";
        columnEl.style.transform = "";
        const cleanup = () => {
          columnEl.style.transition = "";
          columnEl.removeEventListener("transitionend", cleanup);
        };
        columnEl.addEventListener("transitionend", cleanup);
      });
    });
  });
}

function animateNoteReorder(previousPositions) {
  if (!columnsEl || !previousPositions.size) {
    return;
  }
  requestAnimationFrame(() => {
    columnsEl.querySelectorAll(".column[data-column-id]").forEach((columnEl) => {
      const columnId = columnEl.dataset.columnId;
      columnEl.querySelectorAll(".observation[data-note-id]").forEach((obsEl) => {
        const noteId = obsEl.dataset.noteId;
        if (!noteId) {
          return;
        }
        const prev = previousPositions.get(noteId);
        if (!prev || prev.columnId !== columnId) {
          return;
        }
        const nextTop = obsEl.offsetTop;
        const dy = prev.top - nextTop;
        if (!dy) {
          return;
        }
        obsEl.style.transition = "none";
        obsEl.style.transform = `translateY(${dy}px)`;
        requestAnimationFrame(() => {
          obsEl.style.transition = "transform 200ms ease";
          obsEl.style.transform = "";
          const cleanup = () => {
            obsEl.style.transition = "";
            obsEl.removeEventListener("transitionend", cleanup);
          };
          obsEl.addEventListener("transitionend", cleanup);
        });
      });
    });
  });
}

function clearDragTargets() {
  if (!columnsEl) {
    return;
  }
  columnsEl.querySelectorAll(".column.drag-target").forEach((columnEl) => {
    columnEl.classList.remove("drag-target", "drag-target-before", "drag-target-after");
  });
  if (addColumnWrap) {
    addColumnWrap.classList.remove("drag-target");
  }
}

function setDragTarget(targetEl, position) {
  clearDragTargets();
  dragState.position = position;
  if (!targetEl) {
    if (addColumnWrap) {
      addColumnWrap.classList.add("drag-target");
    }
    dragState.targetId = null;
    return;
  }
  dragState.targetId = targetEl.dataset.columnId || null;
  targetEl.classList.add("drag-target");
  if (position === "before") {
    targetEl.classList.add("drag-target-before");
  } else if (position === "after") {
    targetEl.classList.add("drag-target-after");
  }
}

function commitColumnReorder() {
  if (!dragState.activeId || !columnsEl) {
    clearDragTargets();
    dragState.activeId = null;
    dragState.targetId = null;
    dragState.position = null;
    return;
  }
  if (!dragState.targetId && !dragState.position) {
    clearDragTargets();
    dragState.activeId = null;
    dragState.targetId = null;
    dragState.position = null;
    return;
  }
  const visible = state.columns.filter((column) => !column.minimized);
  const minimized = state.columns.filter((column) => column.minimized);
  const draggedIndex = visible.findIndex((col) => col.id === dragState.activeId);
  if (draggedIndex === -1) {
    clearDragTargets();
    dragState.activeId = null;
    dragState.targetId = null;
    dragState.position = null;
    return;
  }
  const [dragged] = visible.splice(draggedIndex, 1);
  if (dragState.targetId) {
    let targetIndex = visible.findIndex((col) => col.id === dragState.targetId);
    if (targetIndex === -1) {
      visible.push(dragged);
    } else {
      if (dragState.position === "after") {
        targetIndex += 1;
      }
      visible.splice(targetIndex, 0, dragged);
    }
  } else {
    visible.push(dragged);
  }
  const nextOrder = visible.map((col) => col.id).join("|");
  const currentOrder = state.columns
    .filter((column) => !column.minimized)
    .map((col) => col.id)
    .join("|");
  clearDragTargets();
  dragState.activeId = null;
  dragState.targetId = null;
  dragState.position = null;
  if (nextOrder === currentOrder) {
    return;
  }
  const previousRects = getColumnRects();
  state.columns = [...visible, ...minimized];
  markDirty();
  persistState();
  renderColumns();
  updateSummary();
  animateColumnSwap(previousRects);
}

function clearNoteDropTargets() {
  if (!columnsEl) {
    return;
  }
  columnsEl.querySelectorAll(".column.note-drop-target").forEach((columnEl) => {
    columnEl.classList.remove("note-drop-target");
  });
}

function moveObservationToColumn(fromColumnId, toColumnId, obsId) {
  if (!fromColumnId || !toColumnId || fromColumnId === toColumnId) {
    return;
  }
  const source = state.columns.find((column) => column.id === fromColumnId);
  const target = state.columns.find((column) => column.id === toColumnId);
  if (!source || !target) {
    return;
  }
  const obsIndex = source.observations.findIndex((obs) => obs.id === obsId);
  if (obsIndex === -1) {
    return;
  }
  const [obs] = source.observations.splice(obsIndex, 1);
  if (!obs) {
    return;
  }
  if (target.reportAll) {
    obs.reportable = true;
  }
  target.observations.push(obs);
  selectNote(target.id, obs.id);
  markDirty();
  persistState();
  renderColumns();
  updateSummary();
}

function applyColumnOrderFromDom() {
  if (!columnsEl) {
    return;
  }
  const orderedIds = Array.from(
    columnsEl.querySelectorAll(".column[data-column-id]")
  ).map((el) => el.dataset.columnId);
  if (!orderedIds.length) {
    return;
  }
  const byId = new Map(state.columns.map((column) => [String(column.id), column]));
  const visible = orderedIds.map((id) => byId.get(String(id))).filter(Boolean);
  const minimized = state.columns.filter((column) => column.minimized);
  state.columns = [...visible, ...minimized];
  markDirty();
  persistState();
  renderColumns();
  updateSummary();
}

function scrollSelectionIntoView() {
  if (!columnsEl || !state.selection) {
    return;
  }
  if (state.selection.kind === "column") {
    const selector = `[data-column-id=\"${escapeSelector(state.selection.columnId)}\"]`;
    const columnEl = columnsEl.querySelector(selector);
    if (columnEl) {
      columnEl.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }
    return;
  }
  const selector = `[data-note-id=\"${escapeSelector(state.selection.obsId)}\"]`;
  const noteEl = columnsEl.querySelector(selector);
  if (noteEl) {
    noteEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  }
}

function openShortcutsModal() {
  if (!shortcutsModal) {
    return;
  }
  shortcutsModal.classList.remove("hidden");
  shortcutsModal.setAttribute("aria-hidden", "false");
  if (shortcutsClose) {
    shortcutsClose.focus();
  }
}

function closeShortcutsModal() {
  if (!shortcutsModal) {
    return;
  }
  blurFocusedElementWithin(shortcutsModal);
  shortcutsModal.classList.add("hidden");
  shortcutsModal.setAttribute("aria-hidden", "true");
}

function openHowToModal() {
  if (!howToModal) {
    return;
  }
  howToModal.classList.remove("hidden");
  howToModal.setAttribute("aria-hidden", "false");
  if (howToClose) {
    howToClose.focus();
  }
}

function closeHowToModal() {
  if (!howToModal) {
    return;
  }
  blurFocusedElementWithin(howToModal);
  howToModal.classList.add("hidden");
  howToModal.setAttribute("aria-hidden", "true");
}

function getSearchTokens(query) {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

function matchesTokens(text, tokens) {
  const lower = text.toLowerCase();
  return tokens.every((token) => lower.includes(token));
}

function createHighlightedFragment(text, tokens) {
  const fragment = document.createDocumentFragment();
  const safeText = text || "";
  if (!tokens.length || !safeText) {
    fragment.appendChild(document.createTextNode(safeText));
    return fragment;
  }
  const pattern = new RegExp(tokens.map(escapeRegExp).join("|"), "ig");
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(safeText)) !== null) {
    if (match.index > lastIndex) {
      fragment.appendChild(
        document.createTextNode(safeText.slice(lastIndex, match.index))
      );
    }
    const mark = document.createElement("mark");
    mark.className = "search-mark";
    mark.textContent = safeText.slice(match.index, match.index + match[0].length);
    fragment.appendChild(mark);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < safeText.length) {
    fragment.appendChild(document.createTextNode(safeText.slice(lastIndex)));
  }
  return fragment;
}

function collectSearchResults(tokens) {
  const cards = [];
  const notes = [];
  state.columns.forEach((column) => {
    const type = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
    const typeLabel = getCardTypeMeta(type).label;
    const cardLabel = isVehicleCardType(type)
      ? getVehicleCardDisplayName(column)
      : column.label || "";
    const cardMatchText = `${typeLabel} ${cardLabel}`.trim();
    const cardDisplay = isVehicleCardType(type)
      ? `${typeLabel} ${cardLabel}`.trim()
      : getCardDisplay(type, column.label);
    if (cardMatchText && matchesTokens(cardMatchText, tokens)) {
      cards.push({
        kind: "card",
        columnId: column.id,
        title: cardDisplay,
      });
    }
    column.observations.forEach((obs) => {
      const noteText = obs.text || "";
      const noteTime = formatTimeOnly(obs.timestamp);
      const noteMatchText = `${noteTime} ${noteText}`.trim();
      if (noteMatchText && matchesTokens(noteMatchText, tokens)) {
        notes.push({
          kind: "note",
          columnId: column.id,
          obsId: obs.id,
          title: noteMatchText,
          meta: cardDisplay,
        });
      }
    });
  });
  return { cards, notes };
}

function getSearchButtons() {
  if (!searchResults) {
    return [];
  }
  return Array.from(searchResults.querySelectorAll(".search-result"));
}

function updateSearchActiveIndex(index, { focus = true } = {}) {
  const buttons = getSearchButtons();
  if (!buttons.length) {
    searchState.activeIndex = -1;
    return;
  }
  const nextIndex = Math.max(0, Math.min(index, buttons.length - 1));
  searchState.activeIndex = nextIndex;
  buttons.forEach((button, buttonIndex) => {
    button.classList.toggle("active", buttonIndex === nextIndex);
  });
  if (focus) {
    buttons[nextIndex].focus();
  }
}

function renderSearchResults(query) {
  if (!searchResults) {
    return;
  }
  searchResults.innerHTML = "";
  searchState.results = [];
  searchState.activeIndex = -1;
  const tokens = getSearchTokens(query);
  if (!tokens.length) {
    const empty = document.createElement("div");
    empty.className = "search-empty";
    empty.textContent = "Start typing to search.";
    searchResults.appendChild(empty);
    return;
  }
  const { cards, notes } = collectSearchResults(tokens);
  const addSection = (titleText, iconName, items) => {
    const section = document.createElement("div");
    section.className = "search-section";
    const title = document.createElement("div");
    title.className = "search-section-title";
    if (iconName) {
      const icon = document.createElement("i");
      icon.setAttribute("data-lucide", iconName);
      title.appendChild(icon);
    }
    const label = document.createElement("span");
    label.textContent = titleText;
    title.appendChild(label);
    section.appendChild(title);
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "search-empty";
      empty.textContent = `No ${titleText.toLowerCase()} matches.`;
      section.appendChild(empty);
      searchResults.appendChild(section);
      return;
    }
    items.forEach((item) => {
      const index = searchState.results.length;
      searchState.results.push(item);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-result";
      button.dataset.resultIndex = String(index);
      button.addEventListener("click", () => {
        activateSearchResult(index);
      });
      button.addEventListener("focus", () => {
        updateSearchActiveIndex(index, { focus: false });
      });
      const titleEl = document.createElement("div");
      titleEl.className = "search-title";
      titleEl.appendChild(createHighlightedFragment(item.title, tokens));
      button.appendChild(titleEl);
      if (item.meta) {
        const metaEl = document.createElement("div");
        metaEl.className = "search-meta";
        metaEl.appendChild(createHighlightedFragment(item.meta, tokens));
        button.appendChild(metaEl);
      }
      section.appendChild(button);
    });
    searchResults.appendChild(section);
  };
  addSection("Cards", "layout-grid", cards);
  addSection("Notes", "sticky-note", notes);
  if (searchState.results.length) {
    updateSearchActiveIndex(0, { focus: false });
  }
  refreshIcons();
}

function activateSearchResult(index) {
  const result = searchState.results[index];
  if (!result) {
    return;
  }
  const column = state.columns.find((col) => col.id === result.columnId);
  if (!column) {
    return;
  }
  if (column.minimized) {
    column.minimized = false;
    column.justExpanded = true;
  }
  if (result.kind === "note") {
    selectNote(result.columnId, result.obsId);
  } else {
    selectColumn(result.columnId);
  }
  renderColumns();
  applySelectionUI();
  scrollSelectionIntoView();
  if (result.kind === "note") {
    requestAnimationFrame(() => {
      const selector = `[data-note-id=\"${escapeSelector(result.obsId)}\"] textarea`;
      const noteInput = columnsEl ? columnsEl.querySelector(selector) : null;
      if (noteInput) {
        noteInput.focus();
      }
    });
  }
  closeSearchModal();
}

function openSearchModal() {
  if (!searchModal || !searchInput || !searchResults) {
    return;
  }
  const shiftHidden = shiftControls && shiftControls.classList.contains("hidden");
  if (shiftHidden) {
    return;
  }
  searchModal.classList.remove("hidden");
  searchModal.setAttribute("aria-hidden", "false");
  searchInput.value = "";
  renderSearchResults("");
  searchInput.focus();
}

function closeSearchModal() {
  if (!searchModal) {
    return;
  }
  blurFocusedElementWithin(searchModal);
  searchModal.classList.add("hidden");
  searchModal.setAttribute("aria-hidden", "true");
}

function handleSearchKeydown(event) {
  if (!isModalOpen(searchModal)) {
    return;
  }
  const buttons = getSearchButtons();
  if (!buttons.length) {
    return;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    const currentIndex = buttons.findIndex((btn) => btn === document.activeElement);
    const nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, buttons.length - 1);
    updateSearchActiveIndex(nextIndex);
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    const currentIndex = buttons.findIndex((btn) => btn === document.activeElement);
    const nextIndex =
      currentIndex === -1 ? buttons.length - 1 : Math.max(currentIndex - 1, 0);
    updateSearchActiveIndex(nextIndex);
    return;
  }
  if (event.key === "Enter" && document.activeElement === searchInput) {
    if (searchState.activeIndex >= 0) {
      event.preventDefault();
      activateSearchResult(searchState.activeIndex);
    }
  }
}
