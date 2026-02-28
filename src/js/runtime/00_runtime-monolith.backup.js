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
const DEFAULT_MAP_FILTER_HIDE_MINIMIZED = getBooleanConfig(
  runtimeConfig.map?.defaultFilters?.hideMinimized,
  true
);
const DEFAULT_MAP_FILTER_LABEL_TIMES = getBooleanConfig(
  runtimeConfig.map?.defaultFilters?.labelTimes,
  true
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
    radiusMiles: DEFAULT_MAP_RADIUS_MILES,
    style: DEFAULT_MAP_STYLE,
  },
  mapFilters: {
    hideMinimized: DEFAULT_MAP_FILTER_HIDE_MINIMIZED,
    labelTimes: DEFAULT_MAP_FILTER_LABEL_TIMES,
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
const shortcutsButton = document.getElementById("shortcutsButton");
const shortcutsClose = document.getElementById("shortcutsClose");
const minimizedSection = document.getElementById("minimizedSection");
const minimizedCards = document.getElementById("minimizedCards");
const minimizedToggle = document.getElementById("minimizedToggle");
const saveInfoButton = document.getElementById("saveInfoButton");
const saveInfoModal = document.getElementById("saveInfoModal");
const saveInfoClose = document.getElementById("saveInfoClose");
const versionButton = document.getElementById("versionButton");
const versionModal = document.getElementById("versionModal");
const versionClose = document.getElementById("versionClose");
const tutorialButton = document.getElementById("tutorialButton");
const welcomeAboutButton = document.getElementById("welcomeAboutButton");
const aboutTutorialButton = document.getElementById("aboutTutorialButton");
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
const mapFilterLabelTimes = document.getElementById("mapFilterLabelTimes");
const mapFilterMinimized = document.getElementById("mapFilterMinimized");
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
const DEFAULT_CARD_TYPE = CARD_TYPES.some(
  (item) => normalizeCardType(item.value) === normalizeCardType(CONFIGURED_DEFAULT_CARD_TYPE)
)
  ? normalizeCardType(CONFIGURED_DEFAULT_CARD_TYPE)
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
  const models = getVehicleModelsForMake(resolvedMake);
  const matchedModel = models.find((item) => item.model === resolvedModel) || null;
  const bodyRaw = String(source.body || "").trim();
  const resolvedBody = resolveVehicleBody(bodyRaw);
  const normalized = {
    plateVisible,
    plate: plateVisible ? formatPlate(source.plate || "") : "",
    reason: plateVisible ? "" : normalizeOptionValue(source.reason, VEHICLE_PLATE_REASONS),
    state: normalizeOptionValue(source.state, STATES),
    color: normalizeOptionValue(source.color, VEHICLE_COLORS),
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
  if (!vehicleMake || !vehicleModel || !vehicleBody) {
    return;
  }
  const makeValue = String(vehicleMake.value || "").trim();
  const resolvedMake = resolveVehicleMake(makeValue);
  const modelValue = String(vehicleModel.value || "").trim();
  const resolvedModel = resolveVehicleModel(modelValue, resolvedMake);
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

function setViewMode(mode, { skipPersist, preserveMapView } = {}) {
  let nextMode = mode;
  if (!["notes", "split", "map"].includes(nextMode)) {
    return;
  }
  if (nextMode === "map" && !MAP_FEATURE_ENABLED) {
    nextMode = "notes";
  }
  if (nextMode === "split" && !SPLIT_VIEW_ENABLED) {
    nextMode = "notes";
  }
  const previousMode = state.viewMode;
  state.viewMode = nextMode;
  if (nextMode !== "notes" && nextMode !== previousMode && !preserveMapView) {
    mapNeedsFit = true;
  }
  if (!skipPersist) {
    persistState();
  }
  applyViewMode();
}

function applyViewMode() {
  if (!collectView) {
    return;
  }
  if (!MAP_FEATURE_ENABLED && state.viewMode !== "notes") {
    state.viewMode = "notes";
  }
  if (!SPLIT_VIEW_ENABLED && state.viewMode === "split") {
    state.viewMode = "notes";
  }
  collectView.classList.remove("view-notes", "view-split", "view-map");
  collectView.classList.add(`view-${state.viewMode}`);
  viewToggleButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.viewMode);
  });
  if (state.viewMode !== "notes" && MAP_FEATURE_ENABLED) {
    ensureMainMap();
    requestAnimationFrame(() => {
      if (mainMap) {
        mainMap.invalidateSize();
      }
      renderMapPins();
    });
  }
  if (isModalOpen(locationModal)) {
    syncLocationModalLayout();
  }
}

function refreshMainMapAfterReveal({ renderPins = true } = {}) {
  if (!mainMap) {
    return;
  }
  const runRefresh = () => {
    if (!mainMap) {
      return;
    }
    mainMap.invalidateSize({ pan: false });
    if (renderPins) {
      renderMapPins();
    }
  };
  requestAnimationFrame(() => {
    runRefresh();
    window.setTimeout(() => {
      requestAnimationFrame(runRefresh);
    }, 140);
  });
}

function ensureMainMap() {
  if (!mapView || !window.L) {
    return;
  }
  if (mainMap) {
    return;
  }
  mainMap = window.L.map(mapView, { zoomControl: true });
  applyMapStyle();
  mapLayerGroup = window.L.layerGroup().addTo(mainMap);
  mapNeedsFit = true;
  const center = state.mapSettings.city || DEFAULT_MAP_CENTER;
  mainMap.setView([center.lat, center.lon], 11);
  mainMap.on("click", handleMainMapLocationModalClick);
  ensureMapSidebarTools();
}

function handleMainMapLocationModalClick(event) {
  if (!isModalOpen(locationModal) || !locationModalTarget) {
    return;
  }
  const rawTarget = event.originalEvent?.target;
  if (
    rawTarget instanceof Element &&
    rawTarget.closest(
      ".map-pin, .map-pin-tooltip, .location-result-marker, .location-preview-marker"
    )
  ) {
    return;
  }
  const label = pendingLocation?.label || "Dropped pin";
  buildLocationWithReverse(event.latlng.lat, event.latlng.lng, label).then(
    async (result) => {
      if (result.needsConfirm) {
        const useNew = await openReverseGeocodeModal(result.oldLabel, result.newLabel);
        if (!useNew) {
          return;
        }
      }
      setPendingLocation(result.location, { recenter: false });
    }
  );
}

function ensureMapSidebarTools() {
  if (!mainMap || mapSidebarToolsControl || !window.L?.DomUtil) {
    return;
  }
  const SidebarToolsControl = window.L.Control.extend({
    options: { position: "topleft" },
    onAdd() {
      const container = window.L.DomUtil.create("div", "leaflet-bar map-sidebar-tools");
      const buildToolButton = (iconName, title, className, onClick) => {
        const button = window.L.DomUtil.create(
          "button",
          `map-sidebar-tool ${className}`.trim(),
          container
        );
        button.type = "button";
        button.innerHTML = `<i data-lucide="${iconName}"></i>`;
        button.setAttribute("title", title);
        button.setAttribute("aria-label", title);
        window.L.DomEvent.disableClickPropagation(button);
        window.L.DomEvent.disableScrollPropagation(button);
        window.L.DomEvent.on(button, "click", (event) => {
          window.L.DomEvent.stop(event);
          onClick();
        });
        ensureLucideIcon(button);
      };
      buildToolButton(
        "search",
        "Lookup and pin a new card",
        "map-sidebar-tool-lookup",
        () => startMapLookupCardFlow()
      );
      buildToolButton(
        "map-pin-plus-inside",
        "Drop and drag a new pin",
        "map-sidebar-tool-pin-drop",
        () => startMapDragPinCardFlow()
      );
      refreshIcons();
      return container;
    },
  });
  mapSidebarToolsControl = new SidebarToolsControl();
  mapSidebarToolsControl.addTo(mainMap);
}

function openMapCardMetaModal(columnId, options = {}) {
  if (!mapCardMetaModal || !mapCardMetaLabel || !mapCardMetaType) {
    return;
  }
  const column = state.columns.find((item) => item.id === columnId);
  if (!column) {
    return;
  }
  mapCardMetaTargetColumnId = column.id;
  mapCardMetaDiscardOnCancel = Boolean(options.discardOnCancel);
  mapCardMetaTypeLocked = Boolean(options.lockType);
  mapCardMetaLabel.value = column.labelAuto ? "" : String(column.label || "");
  mapCardMetaSelectedType = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
  mapCardMetaType.innerHTML = "";
  mapCardMetaTypeDropdown = createCustomSelect({
    options: getSelectableCardTypes(mapCardMetaSelectedType).map((type) => ({
      value: type.value,
      label: type.label,
      icon: type.icon,
    })),
    value: mapCardMetaSelectedType,
    ariaLabel: "Card type",
    className: "type-dropdown",
    portal: false,
    matchButtonWidth: false,
    onChange: (nextType) => {
      mapCardMetaSelectedType = normalizeCardType(nextType);
    },
  });
  mapCardMetaType.appendChild(mapCardMetaTypeDropdown.element);
  const typeSelectButton = mapCardMetaTypeDropdown.element.querySelector(".select-button");
  if (typeSelectButton) {
    typeSelectButton.disabled = mapCardMetaTypeLocked;
    typeSelectButton.setAttribute("aria-disabled", String(mapCardMetaTypeLocked));
    typeSelectButton.title = mapCardMetaTypeLocked ? "Set by Card" : "Card type";
  }
  if (mapCardMetaTypeHint) {
    mapCardMetaTypeHint.textContent = "Set by Card";
    mapCardMetaTypeHint.classList.toggle("hidden", !mapCardMetaTypeLocked);
  }
  refreshIcons();
  mapCardMetaModal.classList.remove("hidden");
  mapCardMetaModal.setAttribute("aria-hidden", "false");
  mapCardMetaLabel.focus();
}

function closeMapCardMetaModal(options = {}) {
  if (!mapCardMetaModal) {
    return;
  }
  blurFocusedElementWithin(mapCardMetaModal);
  const discardDraft = Boolean(options.discardDraft);
  let focusTargetOverride = options.focusTarget || null;
  const columnId = mapCardMetaTargetColumnId;
  if (!discardDraft && !focusTargetOverride && columnId) {
    const column = state.columns.find((item) => item.id === columnId);
    const assignmentResult = resolveMapPinnedLocationAssignment(column);
    if (assignmentResult?.changed) {
      markDirty();
      renderColumns();
      persistState();
      updateSummary();
      renderMapPins();
    }
    if (assignmentResult?.focusTarget) {
      focusTargetOverride = assignmentResult.focusTarget;
    }
  }
  if (discardDraft && columnId) {
    state.columns = state.columns.filter((item) => item.id !== columnId);
    if (state.selection?.columnId === columnId) {
      clearSelection();
    }
    markDirty();
    renderColumns();
    persistState();
    updateSummary();
    renderMapPins();
  }
  mapCardMetaTypeDropdown?.close?.();
  mapCardMetaTypeDropdown = null;
  mapCardMetaModal.classList.add("hidden");
  mapCardMetaModal.setAttribute("aria-hidden", "true");
  mapCardMetaTargetColumnId = null;
  mapCardMetaDiscardOnCancel = false;
  mapCardMetaTypeLocked = false;
  mapCardMetaSelectedType = null;
  if (mapCardMetaTypeHint) {
    mapCardMetaTypeHint.classList.add("hidden");
  }
  if (discardDraft) {
    return;
  }
  if (focusTargetOverride) {
    focusMapLocation(focusTargetOverride.key, focusTargetOverride.target);
    return;
  }
  if (columnId) {
  focusMapLocation(`card:${columnId}`, { kind: "card", columnId });
}
}

function openApplyCardColorsModal() {
  if (!applyCardColorsModal) {
    return;
  }
  applyCardColorsModal.classList.remove("hidden");
  applyCardColorsModal.setAttribute("aria-hidden", "false");
  applyCardColorsCancel?.focus();
}

function closeApplyCardColorsModal() {
  if (!applyCardColorsModal) {
    return;
  }
  blurFocusedElementWithin(applyCardColorsModal);
  applyCardColorsModal.classList.add("hidden");
  applyCardColorsModal.setAttribute("aria-hidden", "true");
}

function saveMapCardMetaModal() {
  if (!mapCardMetaTargetColumnId) {
    return;
  }
  const column = state.columns.find((item) => item.id === mapCardMetaTargetColumnId);
  if (!column) {
    closeMapCardMetaModal();
    return;
  }
  const nextType = normalizeCardType(
    mapCardMetaSelectedType || column.type || DEFAULT_CARD_TYPE
  );
  const nextLabelRaw = String(mapCardMetaLabel?.value || "").trim();
  const oldType = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
  if (oldType !== nextType && !confirmCardTypeChange(column, nextType)) {
    mapCardMetaSelectedType = oldType;
    mapCardMetaTypeDropdown?.setValue(oldType);
    return;
  }
  column.type = nextType;
  if (isVehicleCardType(nextType)) {
    column.vehicleProfile = normalizeVehicleInfo(column.vehicleProfile || {});
    column.observations.forEach((obs) => {
      obs.vehicleInfo = null;
    });
  } else {
    column.vehicleProfile = null;
    if (!isVehicleListType(nextType)) {
      column.observations.forEach((obs) => {
        obs.vehicleInfo = null;
      });
    }
  }
  if (nextLabelRaw) {
    column.label = nextLabelRaw;
    column.labelAuto = false;
  } else {
    if (oldType !== nextType || !column.labelAuto) {
      column.label = getNextCustomLabelForType(nextType, column.id);
    }
    column.labelAuto = true;
  }
  if (
    (state.cardColorDefaults?.mode === "manual" ||
      state.cardColorDefaults?.mode === "all-grey" ||
      state.cardColorDefaults?.mode === "color-by-type") &&
    oldType !== nextType
  ) {
    column.color = getDefaultColorForCardType(nextType);
  }
  const assignmentResult = resolveMapPinnedLocationAssignment(column, nextType);
  const focusTarget = assignmentResult?.focusTarget || null;
  markDirty();
  renderColumns();
  persistState();
  updateSummary();
  closeMapCardMetaModal({ focusTarget });
}

function createPinnedCardFromMap(location, options = {}) {
  if (!location) {
    return null;
  }
  const type = normalizeCardType(options.type || getNextCardTypeForNewColumn());
  const manualLabel = String(options.label || "").trim();
  const labelAuto = !manualLabel;
  const column = {
    id: createId(),
    type,
    minimized: false,
    color: getDefaultColorForCardType(type),
    label: labelAuto ? getNextCustomLabel(type) : manualLabel,
    labelAuto,
    reportAll: false,
    createdAt: Date.now(),
    vehicleProfile: getDefaultVehicleProfileForType(type),
    location,
    observations: [],
    mapPendingLocationAssignment: Boolean(options.assignLocationByType),
  };
  state.columns.push(column);
  selectColumn(column.id);
  markDirty();
  renderColumns();
  persistState();
  updateSummary();
  focusMapLocation(`card:${column.id}`, { kind: "card", columnId: column.id });
  if (options.assignLocationByType && options.openMetaModal === false) {
    const assignmentResult = resolveMapPinnedLocationAssignment(column, column.type);
    if (assignmentResult?.changed) {
      markDirty();
      renderColumns();
      persistState();
      updateSummary();
    }
    if (assignmentResult?.focusTarget) {
      focusMapLocation(assignmentResult.focusTarget.key, assignmentResult.focusTarget.target);
    }
  }
  if (options.openMetaModal !== false) {
    openMapCardMetaModal(column.id, {
      discardOnCancel: options.discardOnCancel !== false,
      lockType: options.lockTypeFromCard === true,
    });
  }
  return column;
}

function assignLocationByCardType(column, location, typeOverride = null) {
  if (!column) {
    return { assignedTo: "none", obs: null };
  }
  if (!location) {
    column.location = null;
    return { assignedTo: "none", obs: null };
  }
  const resolvedType = normalizeCardType(typeOverride || column.type || DEFAULT_CARD_TYPE);
  if (!shouldAssignPinnedLocationToNote(resolvedType)) {
    column.location = location;
    return { assignedTo: "card", obs: null };
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
    location,
    vehicleInfo: isVehicleListType(resolvedType) ? createEmptyVehicleInfo() : null,
  };
  column.observations.push(obs);
  column.location = null;
  updateEndIfNeeded(now);
  updateStartIfNeeded(now);
  selectNote(column.id, obs.id);
  return { assignedTo: "note", obs };
}

function shouldAssignPinnedLocationToNote(type) {
  const normalized = normalizeCardType(type || DEFAULT_CARD_TYPE);
  return normalized !== "Incident" && normalized !== "Place";
}

function resolveMapPinnedLocationAssignment(column, typeOverride = null) {
  if (!column || !column.mapPendingLocationAssignment) {
    return null;
  }
  delete column.mapPendingLocationAssignment;
  const location = column.location || null;
  if (!location) {
    return {
      changed: false,
      focusTarget: {
        key: `card:${column.id}`,
        target: { kind: "card", columnId: column.id },
      },
    };
  }
  const assignment = assignLocationByCardType(column, location, typeOverride);
  if (assignment.assignedTo !== "note" || !assignment.obs) {
    return {
      changed: false,
      focusTarget: {
        key: `card:${column.id}`,
        target: { kind: "card", columnId: column.id },
      },
    };
  }
  return {
    changed: true,
    focusTarget: {
      key: `note:${column.id}:${assignment.obs.id}`,
      target: { kind: "note", columnId: column.id, obsId: assignment.obs.id },
    },
  };
}

function clearMapPlacementMarker() {
  if (mapPlacementMarker && mainMap) {
    mainMap.removeLayer(mapPlacementMarker);
  }
  mapPlacementMarker = null;
}

function startMapLookupCardFlow() {
  clearMapPlacementMarker();
  openLocationModal({
    kind: "new-card-lookup",
    initialType: getNextCardTypeForNewColumn(),
  });
}

function startMapDragPinCardFlow(options = {}) {
  ensureMainMap();
  if (!mainMap || !window.L) {
    return;
  }
  setViewMode("split");
  clearMapPlacementMarker();
  const placementPaneName = "map-placement-pane";
  let placementPane = mainMap.getPane(placementPaneName);
  if (!placementPane) {
    placementPane = mainMap.createPane(placementPaneName);
  }
  placementPane.style.zIndex = String(MAP_PIN_FOCUS_ZINDEX + 2000);
  const center = mainMap.getCenter();
  const pinIcon = window.L.divIcon({
    className: "map-pin map-placement-pin",
    html: '<span class="map-pin-dot map-placement-dot"></span>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
  mapPlacementMarker = window.L.marker(center, {
    draggable: true,
    icon: pinIcon,
    zIndexOffset: MAP_PIN_FOCUS_ZINDEX + 1000,
    pane: placementPaneName,
  }).addTo(mainMap);
  mapPlacementMarker.bindTooltip("Drag to place this new pin", {
    permanent: true,
    direction: "right",
    offset: [10, 0],
    className: "map-pin-tooltip map-placement-tooltip is-expanded",
    opacity: 1,
    pane: placementPaneName,
  });
  mapPlacementMarker.on("tooltipopen", () => {
    bindTooltipDragHandle(mapPlacementMarker, true, null);
  });
  requestAnimationFrame(() => {
    bindTooltipDragHandle(mapPlacementMarker, true, null);
  });
  mapPlacementMarker.on("dragend", async (event) => {
    const next = event.target.getLatLng();
    clearMapPlacementMarker();
    const locationResult = await buildLocationWithReverse(
      next.lat,
      next.lng,
      formatLatLonLabel(next.lat, next.lng)
    );
    createPinnedCardFromMap(locationResult.location, {
      type: options.type || getNextCardTypeForNewColumn(),
      assignLocationByType: true,
      openMetaModal: true,
      lockTypeFromCard: options.lockTypeFromCard === true,
    });
  });
  mainMap.panTo(center, { animate: true });
  showAppToast("Drag the temporary pin to create a new card.");
}

function setPinDragFocus(marker, isDragging) {
  const markerEl = marker?.getElement?.();
  if (markerEl) {
    markerEl.classList.toggle("is-dragging", isDragging);
  }
  const tooltipEl = marker?.getTooltip?.()?.getElement?.();
  if (tooltipEl) {
    tooltipEl.classList.toggle("is-dragging", isDragging);
  }
}

function setMapDragState(isDragging, marker) {
  if (!mainMap) {
    return;
  }
  if (isDragging) {
    mapDragWasEnabled = mainMap.dragging?.enabled?.() ?? true;
    if (mainMap.dragging?.disable) {
      mainMap.dragging.disable();
    }
    if (mapView) {
      mapView.classList.add("dragging-pin");
    }
    if (mapDragFallbackTimer) {
      window.clearTimeout(mapDragFallbackTimer);
      mapDragFallbackTimer = null;
    }
    const release = () => {
      setMapDragState(false, marker);
    };
    window.addEventListener("pointerup", release, { once: true });
    window.addEventListener("pointercancel", release, { once: true });
    window.addEventListener("blur", release, { once: true });
    mapDragFallbackTimer = window.setTimeout(release, 4000);
  } else {
    if (mainMap.dragging?.enable) {
      mainMap.dragging.enable();
    }
    if (mapView) {
      mapView.classList.remove("dragging-pin");
    }
    if (mapDragFallbackTimer) {
      window.clearTimeout(mapDragFallbackTimer);
      mapDragFallbackTimer = null;
    }
  }
  setPinDragFocus(marker, isDragging);
}

function startMarkerDragFromTooltip(event, marker, canDrag) {
  if (!canDrag || !marker || !mainMap) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const mapRect = mainMap.getContainer().getBoundingClientRect();
  const getClientPoint = (sourceEvent) => {
    if (!sourceEvent) {
      return null;
    }
    const touchPoint =
      sourceEvent.touches && sourceEvent.touches.length
        ? sourceEvent.touches[0]
        : sourceEvent.changedTouches && sourceEvent.changedTouches.length
          ? sourceEvent.changedTouches[0]
          : sourceEvent;
    if (
      typeof touchPoint?.clientX !== "number" ||
      typeof touchPoint?.clientY !== "number"
    ) {
      return null;
    }
    return {
      clientX: touchPoint.clientX,
      clientY: touchPoint.clientY,
    };
  };
  const initialPoint = getClientPoint(event);
  if (!initialPoint) {
    return;
  }
  const markerPoint = mainMap.latLngToContainerPoint(marker.getLatLng());
  const pointerStartPoint = window.L.point(
    initialPoint.clientX - mapRect.left,
    initialPoint.clientY - mapRect.top
  );
  const pointerOffset = pointerStartPoint.subtract(markerPoint);
  let draggingActive = true;
  const moveMarker = (moveEvent) => {
    if (!draggingActive) {
      return;
    }
    moveEvent.preventDefault?.();
    const point = getClientPoint(moveEvent);
    if (!point) {
      return;
    }
    const containerPoint = window.L.point(
      point.clientX - mapRect.left,
      point.clientY - mapRect.top
    );
    marker.setLatLng(mainMap.containerPointToLatLng(containerPoint.subtract(pointerOffset)));
  };
  const stopDrag = (stopEvent) => {
    if (!draggingActive) {
      return;
    }
    stopEvent?.preventDefault?.();
    draggingActive = false;
    window.removeEventListener("pointermove", moveMarker);
    window.removeEventListener("pointerup", stopDrag);
    window.removeEventListener("pointercancel", stopDrag);
    window.removeEventListener("mousemove", moveMarker);
    window.removeEventListener("mouseup", stopDrag);
    window.removeEventListener("touchmove", moveMarker);
    window.removeEventListener("touchend", stopDrag);
    window.removeEventListener("touchcancel", stopDrag);
    window.removeEventListener("blur", stopDrag);
    setMapDragState(false, marker);
    marker.fire("dragend", { target: marker });
  };

  setMapDragState(true, marker);
  marker.fire("dragstart", { target: marker });
  moveMarker(event);
  window.addEventListener("pointermove", moveMarker, { passive: false });
  window.addEventListener("pointerup", stopDrag, { once: true });
  window.addEventListener("pointercancel", stopDrag, { once: true });
  window.addEventListener("mousemove", moveMarker);
  window.addEventListener("mouseup", stopDrag, { once: true });
  window.addEventListener("touchmove", moveMarker, { passive: false });
  window.addEventListener("touchend", stopDrag, { once: true });
  window.addEventListener("touchcancel", stopDrag, { once: true });
  window.addEventListener("blur", stopDrag, { once: true });
}

function bindTooltipDragHandle(marker, canDrag, handleSelector = ".map-tooltip-label") {
  const tooltipEl = marker?.getTooltip?.()?.getElement?.();
  if (!tooltipEl) {
    return;
  }
  const dragBindKey = handleSelector ? "dragBoundLabel" : "dragBoundTooltip";
  if (tooltipEl.dataset[dragBindKey]) {
    return;
  }
  tooltipEl.dataset[dragBindKey] = "true";
  const handles = handleSelector
    ? Array.from(tooltipEl.querySelectorAll(handleSelector))
    : [tooltipEl];
  if (!handles.length) {
    return;
  }
  const beginDragFromHandle = (dragEvent) => {
    if (dragEvent.type === "mousedown" && typeof window.PointerEvent !== "undefined") {
      return;
    }
    const button = typeof dragEvent.button === "number" ? dragEvent.button : 0;
    if (button !== 0) {
      return;
    }
    startMarkerDragFromTooltip(dragEvent, marker, canDrag);
  };
  handles.forEach((handle) => {
    handle.addEventListener("pointerdown", beginDragFromHandle);
    handle.addEventListener("mousedown", beginDragFromHandle);
    handle.addEventListener("touchstart", beginDragFromHandle, {
      passive: false,
    });
  });
}

function renderMapPins() {
  if (!mainMap || !mapLayerGroup) {
    return;
  }
  clearFocusedMapMarker();
  mapLayerGroup.clearLayers();
  mapMarkers.clear();
  const items = collectMapLocations().slice().sort(compareMapItemsByAge);
  if (!items.length) {
    cleanupMapPinPanes(new Set());
    return;
  }
  const bounds = [];
  const activePaneNames = new Set();
  items.forEach((item, index) => {
    const baseZIndex = MAP_PIN_BASE_ZINDEX + (index + 1) * MAP_PIN_ZINDEX_STEP;
    const hoverZIndex = baseZIndex + MAP_PIN_HOVER_ZINDEX_BUMP;
    const expandedPaneZIndex = Math.max(hoverZIndex, MAP_PIN_FOCUS_ZINDEX + 3000);
    const paneName = getMapPinPaneName(item.key);
    activePaneNames.add(paneName);
    const pane = ensureMapPinPane(paneName, baseZIndex);
    const setTooltipZIndex = (zIndex) => {
      const tooltipEl = marker.getTooltip()?.getElement?.();
      if (tooltipEl) {
        tooltipEl.style.zIndex = String(zIndex);
      }
      pane.style.zIndex = String(zIndex);
    };
    const canDrag = !item.isLocked;
    const pinIcon = window.L.divIcon({
      className: "map-pin",
      html: `<span class="map-pin-dot color-${item.colorIndex}"></span>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });
    const marker = window.L.marker([item.location.lat, item.location.lon], {
      draggable: canDrag,
      icon: pinIcon,
      pane: paneName,
    });
    const tooltip = buildMapTooltipContent(item);
    marker.bindTooltip(tooltip, {
      permanent: true,
      direction: "right",
      offset: [10, 0],
      className: `map-pin-tooltip color-${item.colorIndex}`,
      opacity: 1,
      interactive: true,
      pane: paneName,
    });
    if (marker.dragging && !canDrag) {
      marker.dragging.disable();
    }
    marker.setZIndexOffset(baseZIndex);
    setTooltipZIndex(baseZIndex);
    marker.on("tooltipopen", (event) => {
      const tooltipEl = event.tooltip?.getElement();
      if (!tooltipEl) {
        return;
      }
      setTooltipZIndex(baseZIndex);
      tooltipEl.classList.toggle("is-previous", Boolean(item.isPreviousLocation));
      if (tooltipEl.dataset.hoverBound) {
        return;
      }
      tooltipEl.dataset.hoverBound = "true";
      bindTooltipDragHandle(marker, canDrag, ".map-tooltip-label");
      tooltipEl.addEventListener("mouseenter", () => {
        tooltipEl.classList.add("is-expanded");
        marker.setZIndexOffset(hoverZIndex);
        setTooltipZIndex(expandedPaneZIndex);
      });
      tooltipEl.addEventListener("mouseleave", () => {
        if (tooltipEl.classList.contains("is-focus-target")) {
          return;
        }
        tooltipEl.classList.remove("is-expanded");
        marker.setZIndexOffset(baseZIndex);
        setTooltipZIndex(baseZIndex);
      });
      tooltipEl.addEventListener("click", (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        setFocusedMapMarker(marker);
        tooltipEl.classList.add("is-expanded");
        requestAnimationFrame(() => keepMapTooltipInView(marker));
      });
      tooltipEl.addEventListener("dblclick", (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        activateMapLabelTarget(item);
      });
    });
    marker.on("click", (event) => {
      event.originalEvent?.stopPropagation?.();
      const tooltipEl = marker.getTooltip()?.getElement();
      setFocusedMapMarker(marker);
      if (tooltipEl) {
        tooltipEl.classList.add("is-expanded");
      }
      requestAnimationFrame(() => keepMapTooltipInView(marker));
    });
    marker.on("mouseover", () => {
      const tooltipEl = marker.getTooltip()?.getElement();
      if (tooltipEl) {
        tooltipEl.classList.add("is-expanded");
        setTooltipZIndex(expandedPaneZIndex);
      }
      marker.setZIndexOffset(hoverZIndex);
    });
    marker.on("mouseout", () => {
      const tooltipEl = marker.getTooltip()?.getElement();
      if (tooltipEl?.classList.contains("is-focus-target")) {
        tooltipEl.classList.add("is-expanded");
        return;
      }
      if (tooltipEl) {
        tooltipEl.classList.remove("is-expanded");
        setTooltipZIndex(baseZIndex);
      }
      marker.setZIndexOffset(baseZIndex);
    });
    marker.on("dragstart", () => {
      setMapDragState(true, marker);
    });
    marker.on("dragend", async (event) => {
      setMapDragState(false, marker);
      const next = event.target.getLatLng();
      const currentLabel =
        item.location?.displayLabel || item.location?.label || "Dropped pin";
      const result = await buildLocationWithReverse(next.lat, next.lng, currentLabel);
      if (result.needsConfirm) {
        const useNew = await openReverseGeocodeModal(result.oldLabel, result.newLabel);
        if (!useNew) {
          renderMapPins();
          return;
        }
      }
      applyLocationToTarget(item, result.location, { preserveMapView: true });
    });
    marker.addTo(mapLayerGroup);
    mapMarkers.set(item.key, marker);
    bounds.push([item.location.lat, item.location.lon]);
  });
  cleanupMapPinPanes(activePaneNames);
  if (bounds.length && state.viewMode !== "notes" && mapNeedsFit) {
    const leafletBounds = window.L.latLngBounds(bounds);
    mainMap.fitBounds(leafletBounds, { padding: [40, 40], maxZoom: 15 });
    mapNeedsFit = false;
  }
}

function getMapPinPaneName(key) {
  return `map-pin-pane-${String(key || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")}`;
}

function ensureMapPinPane(name, zIndex) {
  let pane = mainMap.getPane(name);
  if (!pane) {
    pane = mainMap.createPane(name);
  }
  pane.style.zIndex = String(zIndex);
  mapPinPaneNames.add(name);
  return pane;
}

function cleanupMapPinPanes(activeNames) {
  if (!mainMap) {
    return;
  }
  const next = new Set();
  mapPinPaneNames.forEach((name) => {
    if (activeNames.has(name)) {
      next.add(name);
      return;
    }
    const pane = mainMap.getPane(name);
    if (pane?.parentNode) {
      pane.parentNode.removeChild(pane);
    }
    if (mainMap._panes && Object.prototype.hasOwnProperty.call(mainMap._panes, name)) {
      delete mainMap._panes[name];
    }
  });
  mapPinPaneNames = next;
}

function collectMapLocations() {
  const items = [];
  state.columns.forEach((column) => {
    if (state.mapFilters?.hideMinimized && column.minimized) {
      return;
    }
    const normalizedType = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
    if (state.mapFilters?.types && !state.mapFilters.types[normalizedType]) {
      return;
    }
    const colorIndex = normalizeColorIndex(column.color);
    const label = getMapLabelForColumn(column);
    const vehicleListDetailHeading = isVehicleListType(normalizedType)
      ? (() => {
          const listName = String(column.label || "").trim();
          return listName ? `Vehicle List: ${listName}` : "Vehicle List";
        })()
      : "";
    const isObserver = isObserverType(normalizedType);
    const usePreviousNoteStyling =
      (isObserver || isVehicleListType(normalizedType) || isVehicleCardType(normalizedType)) &&
      !column.location;
    const notePins = column.observations.filter((obs) => obs.location);
    const latestNotePin = usePreviousNoteStyling
      ? notePins.reduce((latest, obs) => {
          if (!latest) {
            return obs;
          }
          const latestTime = getObservationTimestampValue(latest);
          const obsTime = getObservationTimestampValue(obs);
          if (obsTime !== latestTime) {
            return obsTime > latestTime ? obs : latest;
          }
          const latestCreated = typeof latest.createdAt === "number" ? latest.createdAt : 0;
          const obsCreated = typeof obs.createdAt === "number" ? obs.createdAt : 0;
          if (obsCreated !== latestCreated) {
            return obsCreated > latestCreated ? obs : latest;
          }
          return obs;
        }, null)
      : null;
    if (column.location) {
      const sortedObservations = column.observations
        .filter((obs) => obs.text && obs.text.trim())
        .slice()
        .sort((a, b) => getObservationTimestampValue(b) - getObservationTimestampValue(a));
      const latestObs = sortedObservations[0] || null;
      const latestByTime = column.observations.reduce((latest, obs) => {
        if (!latest) {
          return obs;
        }
        const latestTime = getObservationTimestampValue(latest);
        const obsTime = getObservationTimestampValue(obs);
        if (obsTime !== latestTime) {
          return obsTime > latestTime ? obs : latest;
        }
        const latestCreated = typeof latest.createdAt === "number" ? latest.createdAt : 0;
        const obsCreated = typeof obs.createdAt === "number" ? obs.createdAt : 0;
        if (obsCreated !== latestCreated) {
          return obsCreated > latestCreated ? obs : latest;
        }
        return String(obs.id).localeCompare(String(latest.id)) > 0 ? obs : latest;
      }, null);
      const sortTimestamp = latestByTime
        ? getObservationTimestampValue(latestByTime)
        : typeof column.createdAt === "number"
          ? column.createdAt
          : 0;
      items.push({
        kind: "card",
        columnId: column.id,
        key: `card:${column.id}`,
        location: column.location,
        locationLabel: column.location.displayLabel || column.location.label || "",
        latestTimestampText: latestObs ? formatTimeOnly(latestObs.timestamp) : "",
        latestText: latestObs ? latestObs.text || "" : "",
        label,
        vehicleListDetailHeading,
        cardType: normalizedType,
        colorIndex,
        labelTimestamp: latestObs ? formatTimeOnly(latestObs.timestamp) : "",
        isLocked: false,
        sortTimestamp,
        sortCreatedAt: latestByTime && typeof latestByTime.createdAt === "number"
          ? latestByTime.createdAt
          : typeof column.createdAt === "number"
            ? column.createdAt
            : 0,
        sortId: String(column.id),
      });
    }
    column.observations.forEach((obs) => {
      if (!obs.location) {
        return;
      }
      const vehicleMapInfo = getVehicleMapInfoForObservation(column, obs);
      const noteLabel = getMapLabelForObservation(column, obs, label, vehicleMapInfo);
      items.push({
        kind: "note",
        columnId: column.id,
        obsId: obs.id,
        key: `note:${column.id}:${obs.id}`,
        location: obs.location,
        locationLabel: obs.location.displayLabel || obs.location.label || "",
        timestampText: formatTimeOnly(obs.timestamp),
        text: obs.text || "",
        label: noteLabel,
        vehicleListDetailHeading,
        vehicleDetailLine: getVehicleMapDetailLine(vehicleMapInfo),
        cardType: normalizedType,
        colorIndex,
        labelTimestamp: formatTimeOnly(obs.timestamp),
        isPreviousLocation:
          usePreviousNoteStyling &&
          latestNotePin &&
          latestNotePin.id !== obs.id,
        isLocked: Boolean(column.location),
        sortTimestamp: getObservationTimestampValue(obs),
        sortCreatedAt: typeof obs.createdAt === "number" ? obs.createdAt : 0,
        sortId: String(obs.id),
      });
    });
  });
  return items;
}

function getMapLabelForColumn(column) {
  const type = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
  if (isVehicleCardType(type)) {
    const vehicleSummary = formatVehicleInfoForSummary(
      normalizeVehicleInfo(column.vehicleProfile || {})
    );
    if (vehicleSummary) {
      return vehicleSummary;
    }
  }
  const labelText = (column.label || "").trim();
  const name = labelText ? labelText : getCardTypeMeta(type).label;
  return name;
}

function getVehicleMapInfoForObservation(column, obs) {
  const type = normalizeCardType(column?.type || DEFAULT_CARD_TYPE);
  if (isVehicleCardType(type)) {
    return normalizeVehicleInfo(column?.vehicleProfile || {});
  }
  if (!isVehicleListType(type)) {
    return null;
  }
  const structured = normalizeVehicleInfo(obs?.vehicleInfo || {});
  if (hasVehicleInfo(structured)) {
    return structured;
  }
  const parsed = parseVehicleInfoFromText(obs?.text || "");
  if (hasVehicleInfo(parsed)) {
    return parsed;
  }
  return structured;
}

function getVehiclePlateStateLabel(info) {
  if (!info || info.plateVisible === false || !info.plate) {
    return "";
  }
  const state = String(info.state || "").trim();
  return state ? `${info.plate} (${state})` : info.plate;
}

function getVehicleMapLabelFromInfo(info) {
  const normalized = normalizeVehicleInfo(info || {});
  const plateLabel = getVehiclePlateStateLabel(normalized);
  if (plateLabel) {
    return plateLabel;
  }
  const fallback = [normalized.color, normalized.make, normalized.model, normalized.body]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
  return fallback || "Unk Vehicle";
}

function getVehicleMapDetailLine(info) {
  if (!info) {
    return "";
  }
  const makeModel = [info.make, info.model].filter(Boolean).join(" ").trim();
  const color = String(info.color || "").trim();
  const body = String(info.body || "").trim();
  return [makeModel, color, body].filter(Boolean).join(" • ");
}

function getMapLabelForObservation(column, obs, fallbackLabel, vehicleMapInfo = null) {
  const type = normalizeCardType(column?.type || DEFAULT_CARD_TYPE);
  if (!isVehicleListType(type) && !isVehicleCardType(type)) {
    return fallbackLabel;
  }
  const info = vehicleMapInfo || getVehicleMapInfoForObservation(column, obs);
  return getVehicleMapLabelFromInfo(info);
}

function buildMapTooltipContent(item) {
  const wrap = document.createElement("div");
  wrap.className = "map-tooltip";
  const labelLine = document.createElement("div");
  labelLine.className = "map-tooltip-label";
  const includeLabelTimes = Boolean(state.mapFilters?.labelTimes);
  const labelTime =
    includeLabelTimes && item.labelTimestamp ? `—${item.labelTimestamp}` : "";
  const labelText = `${item.label}${labelTime}`.trim();
  if (item.cardType) {
    const iconWrap = document.createElement("span");
    iconWrap.className = "label-icon";
    const icon = createCardTypeIconNode(item.cardType);
    iconWrap.appendChild(icon);
    labelLine.appendChild(iconWrap);
  }
  if (labelText) {
    labelLine.appendChild(document.createTextNode(labelText));
  }
  ensureLucideIcon(labelLine);
  wrap.appendChild(labelLine);

  const extra = document.createElement("div");
  extra.className = "map-tooltip-extra";
  if (item.vehicleListDetailHeading) {
    const listHeadingLine = document.createElement("div");
    listHeadingLine.className = "map-tooltip-time";
    listHeadingLine.textContent = item.vehicleListDetailHeading;
    extra.appendChild(listHeadingLine);
  }
  if (item.kind === "note" && item.vehicleDetailLine) {
    const vehicleLine = document.createElement("div");
    vehicleLine.className = "map-tooltip-text";
    vehicleLine.textContent = item.vehicleDetailLine;
    extra.appendChild(vehicleLine);
  }
  const locationText = formatLocationLabel(
    item.locationLabel || item.location.displayLabel || item.location.label || ""
  );
  if (locationText) {
    const { addressLine, cityLine } = splitLocationLines(locationText);
    const locationRow = document.createElement("div");
    locationRow.className = "map-tooltip-location-row";
    const locationBlock = document.createElement("div");
    locationBlock.className = "map-tooltip-location-block";
    const locationLine = document.createElement("div");
    locationLine.className = "map-tooltip-location";
    locationLine.textContent = addressLine || locationText;
    locationBlock.appendChild(locationLine);
    if (cityLine) {
      const cityStateLine = document.createElement("div");
      cityStateLine.className = "map-tooltip-city";
      cityStateLine.textContent = cityLine;
      locationBlock.appendChild(cityStateLine);
    }
    const copyAddressText = [addressLine || locationText, cityLine].filter(Boolean).join(", ");
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "map-tooltip-copy";
    copyButton.title = "Copy address";
    copyButton.setAttribute("aria-label", "Copy address");
    copyButton.innerHTML = '<i data-lucide="copy"></i>';
    ensureLucideIcon(copyButton);
    copyButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const copied = await copyTextToClipboard(copyAddressText);
      showAppToast(copied ? "Address copied to clipboard" : "Clipboard blocked. Press Ctrl+C / Cmd+C.");
    });
    locationRow.appendChild(locationBlock);
    locationRow.appendChild(copyButton);
    extra.appendChild(locationRow);
  }

  if (item.kind === "note") {
    const timeLine = document.createElement("div");
    timeLine.className = "map-tooltip-time";
    timeLine.textContent = item.timestampText || "";
    extra.appendChild(timeLine);
    const textLine = document.createElement("div");
    textLine.className = "map-tooltip-text";
    textLine.textContent = (item.text || "").replace(/\s*\n\s*/g, " ").trim();
    extra.appendChild(textLine);
  } else if (item.latestText) {
    const latestLabel = document.createElement("div");
    latestLabel.className = "map-tooltip-time";
    latestLabel.textContent = "LATEST:";
    extra.appendChild(latestLabel);
    const latestLine = document.createElement("div");
    latestLine.className = "map-tooltip-text";
    const latestTime = item.latestTimestampText ? `${item.latestTimestampText} ` : "";
    latestLine.textContent = `${latestTime}${item.latestText}`
      .replace(/\s*\n\s*/g, " ")
      .trim();
    extra.appendChild(latestLine);
  }

  const newerActions = document.createElement("div");
  newerActions.className = "map-tooltip-newer-actions";
  const addNewerButton = document.createElement("button");
  addNewerButton.type = "button";
  addNewerButton.className = "map-tooltip-add-newer";
  const addIsVehicle = isVehicleListType(item.cardType);
  addNewerButton.innerHTML =
    `<i data-lucide="map-pin-plus-inside"></i><span>${addIsVehicle ? "+ New Vehicle" : "+ Newer Location"}</span>`;
  ensureLucideIcon(addNewerButton);
  addNewerButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const column = state.columns.find((col) => col.id === item.columnId);
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
    if (addIsVehicle) {
      pendingVehicleInfoNoteTarget = { columnId: column.id, obsId: obs.id };
    }
    markDirty();
    updateEndIfNeeded(now);
    updateStartIfNeeded(now);
    renderColumns();
    persistState();
    updateSummary();
    requestAnimationFrame(() => {
      scrollSelectionIntoView();
      focusLastNote(column.id, obs.id);
      openLocationModalForSelection({ useDropPin: true });
    });
  });
  newerActions.appendChild(addNewerButton);
  extra.appendChild(newerActions);

  const actions = document.createElement("div");
  actions.className = "map-tooltip-actions";
  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "map-tooltip-open";
  openButton.textContent = item.kind === "note" ? "Open Note" : "Open Latest";
  openButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    activateMapLabelTarget(item);
  });
  actions.appendChild(openButton);
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "map-tooltip-delete";
  deleteButton.title = "Delete pin";
  deleteButton.setAttribute("aria-label", "Delete pin");
  deleteButton.innerHTML = '<i data-lucide="trash-2"></i>';
  ensureLucideIcon(deleteButton);
  deleteButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (item.kind === "note") {
      openDeleteModal(item.columnId, item.obsId);
      return;
    }
    openColumnDeleteModal(item.columnId);
  });
  actions.appendChild(deleteButton);
  extra.appendChild(actions);

  wrap.appendChild(extra);
  return wrap;
}

function buildLocation(displayLabel, lat, lon, source, addressLabel) {
  return {
    label: String(displayLabel || addressLabel || "Dropped pin"),
    displayLabel: String(displayLabel || addressLabel || "Dropped pin"),
    addressLabel: String(addressLabel || ""),
    lat,
    lon,
    source: source || "manual",
    updatedAt: Date.now(),
  };
}

function applyLocationToTarget(target, location, options = {}) {
  if (!LOCATION_TAGGING_ENABLED) {
    return;
  }
  if (!target) {
    return;
  }
  if (target.kind === "new-card-lookup") {
    createPinnedCardFromMap(location, {
      type: target.initialType || getNextCardTypeForNewColumn(),
      openMetaModal: true,
      assignLocationByType: true,
      discardOnCancel: true,
    });
    return;
  }
  const preserveMapView = Boolean(options.preserveMapView);
  if (target.kind === "city") {
    state.mapSettings.city = location;
    updateCityUI();
    persistMapSettings();
    persistState();
    applyViewMode();
    mapNeedsFit = true;
    if (mainMap) {
      const center = location || DEFAULT_MAP_CENTER;
      mainMap.setView([center.lat, center.lon], 11);
    }
    return;
  }
  const column = state.columns.find((col) => col.id === target.columnId);
  if (!column) {
    return;
  }
  let shouldOpenVehicleInfoModal = false;
  if (target.kind === "card") {
    if (location) {
      assignLocationByCardType(column, location);
    } else {
      column.location = null;
    }
    if (location) {
      setViewMode("split");
    }
    if (!preserveMapView) {
      mapNeedsFit = true;
    } else {
      mapNeedsFit = false;
    }
  } else if (target.kind === "note") {
    const obs = column.observations.find((item) => item.id === target.obsId);
    if (obs) {
      obs.location = location;
      if (
        location &&
        pendingVehicleInfoNoteTarget &&
        pendingVehicleInfoNoteTarget.columnId === target.columnId &&
        pendingVehicleInfoNoteTarget.obsId === target.obsId
      ) {
        shouldOpenVehicleInfoModal = true;
        pendingVehicleInfoNoteTarget = null;
      }
      if (!preserveMapView) {
        mapNeedsFit = true;
      } else {
        mapNeedsFit = false;
      }
    }
  }
  markDirty();
  renderColumns();
  persistState();
  updateSummary();
  renderMapPins();
  if (shouldOpenVehicleInfoModal) {
    requestAnimationFrame(() => {
      openVehicleInfoModalForNote(target.columnId, target.obsId);
    });
  }
}

function openLocationModal(target) {
  if (!LOCATION_TAGGING_ENABLED) {
    console.warn("[config] Location tagging is disabled by configuration.");
    return;
  }
  if (!locationModal || !locationSearchInput || !locationResults) {
    return;
  }
  locationModalTarget = target;
  locationModalShouldRestoreView = true;
  locationSearchToken += 1;
  clearMapPlacementMarker();
  const viewModeBeforeModal = state.viewMode;
  locationModalMapViewSnapshot = snapshotMainMapView();
  if (viewModeBeforeModal === "notes") {
    setViewMode("split", { preserveMapView: true });
  }
  ensureMainMap();
  if (!locationModalMapViewSnapshot) {
    locationModalMapViewSnapshot = snapshotMainMapView();
  }
  ensureLocationSearchLayer();
  if (viewModeBeforeModal === "notes" && mapPanel) {
    mapPanel.scrollIntoView({ block: "start" });
  }
  const existing = getTargetLocation(target);
  pendingLocation = existing ? { ...existing } : null;
  locationSearchInput.value = existing?.label || "";
  locationSearchState.results = [];
  locationSearchState.activeIndex = -1;
  locationResults.innerHTML = "<div class=\"search-empty\">Start typing to search.</div>";

  if (locationTitle) {
    locationTitle.textContent =
      target.kind === "city"
        ? "Set Search City"
        : target.kind === "new-card-lookup"
          ? "Lookup + Place New Pin"
          : "Set Location";
  }
  if (locationTargetLabel) {
    locationTargetLabel.textContent = describeLocationTarget(target);
  }
  updateLocationLimitDetail();
  if (locationClearButton) {
    locationClearButton.disabled = !existing;
  }
  if (locationSetButton) {
    locationSetButton.disabled = !pendingLocation;
  }

  locationModal.classList.remove("hidden");
  locationModal.setAttribute("aria-hidden", "false");
  syncLocationModalLayout();
  if (pendingLocation) {
    updateLocationPreviewMarker(pendingLocation, { zoom: 14, recenter: false });
  } else {
    centerLocationPreviewMap();
  }
  locationSearchInput.focus();
}

function closeLocationModal() {
  if (!locationModal) {
    return;
  }
  blurFocusedElementWithin(locationModal);
  locationModal.classList.add("hidden");
  locationModal.setAttribute("aria-hidden", "true");
  syncLocationModalLayout();
  locationSearchToken += 1;
  locationModalTarget = null;
  pendingLocation = null;
  clearMapPlacementMarker();
  clearLocationSearchMarkers();
  clearLocationPreviewMarker();
  if (locationModalShouldRestoreView) {
    restoreLocationModalMapView();
  } else {
    locationModalMapViewSnapshot = null;
  }
  locationModalShouldRestoreView = true;
  locationSearchState.results = [];
  locationSearchState.activeIndex = -1;
  if (locationSearchTimer) {
    window.clearTimeout(locationSearchTimer);
    locationSearchTimer = null;
  }
}

function startLocationDropPinMode(target = null) {
  const resolvedTarget = target || locationModalTarget;
  if (!resolvedTarget) {
    return false;
  }
  ensureMainMap();
  if (state.viewMode === "notes") {
    setViewMode("split", { preserveMapView: true });
  }
  if (mapPanel) {
    mapPanel.scrollIntoView({ block: "start" });
  }
  if (!mainMap || !window.L) {
    return false;
  }
  clearMapPlacementMarker();
  const placementPaneName = "map-placement-pane";
  let placementPane = mainMap.getPane(placementPaneName);
  if (!placementPane) {
    placementPane = mainMap.createPane(placementPaneName);
  }
  placementPane.style.zIndex = String(MAP_PIN_FOCUS_ZINDEX + 2000);
  const center = mainMap.getCenter();
  const pinIcon = window.L.divIcon({
    className: "map-pin map-placement-pin",
    html: '<span class="map-pin-dot map-placement-dot"></span>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
  mapPlacementMarker = window.L.marker(center, {
    draggable: true,
    icon: pinIcon,
    zIndexOffset: MAP_PIN_FOCUS_ZINDEX + 1000,
    pane: placementPaneName,
  }).addTo(mainMap);
  mapPlacementMarker.bindTooltip("Drag to place location", {
    permanent: true,
    direction: "right",
    offset: [10, 0],
    className: "map-pin-tooltip map-placement-tooltip is-expanded",
    opacity: 1,
    pane: placementPaneName,
  });
  mapPlacementMarker.on("dragend", async (event) => {
    const next = event.target.getLatLng();
    clearMapPlacementMarker();
    const existing = getTargetLocation(resolvedTarget);
    const label = existing?.label || formatLatLonLabel(next.lat, next.lng);
    const locationResult = await buildLocationWithReverse(next.lat, next.lng, label);
    if (locationResult.needsConfirm) {
      const useNew = await openReverseGeocodeModal(
        locationResult.oldLabel,
        locationResult.newLabel
      );
      if (!useNew) {
        return;
      }
    }
    applyLocationToTarget(resolvedTarget, locationResult.location, {
      preserveMapView: true,
    });
  });
  mainMap.panTo(center, { animate: true });
  showAppToast("Drag the temporary pin to set location.");
  return true;
}

function openLocationModalForSelection(options = {}) {
  const useDropPin = options.useDropPin === true;
  if (state.selection?.kind === "note") {
    const column = state.columns.find((col) => col.id === state.selection.columnId);
    if (!column) {
      return false;
    }
    const obs = column.observations.find((item) => item.id === state.selection.obsId);
    if (!obs) {
      return false;
    }
    if (column.location) {
      showAppToast("Clear card location first to assign a separate note pin.");
      return false;
    }
    const target = { kind: "note", columnId: column.id, obsId: obs.id };
    if (useDropPin) {
      startLocationDropPinMode(target);
      return true;
    }
    openLocationModal(target);
    return true;
  }
  if (state.selection?.kind === "column") {
    const target = { kind: "card", columnId: state.selection.columnId };
    if (useDropPin) {
      startLocationDropPinMode(target);
      return true;
    }
    openLocationModal(target);
    return true;
  }
  return false;
}

function snapshotMainMapView() {
  if (!mainMap) {
    return null;
  }
  const center = mainMap.getCenter();
  if (!center) {
    return null;
  }
  return { lat: center.lat, lon: center.lng, zoom: mainMap.getZoom() };
}

function restoreLocationModalMapView() {
  if (!locationModalMapViewSnapshot || !mainMap) {
    locationModalMapViewSnapshot = null;
    return;
  }
  const snapshot = locationModalMapViewSnapshot;
  locationModalMapViewSnapshot = null;
  if (typeof snapshot.zoom !== "number") {
    return;
  }
  mainMap.setView([snapshot.lat, snapshot.lon], snapshot.zoom);
}

function shouldUseSplitLocationOverlay() {
  return state.viewMode === "split" && window.innerWidth > 900 && Boolean(mapPanel);
}

function syncLocationModalLayout() {
  if (!locationModal) {
    return;
  }
  if (locationModal.classList.contains("hidden")) {
    locationModal.classList.remove("location-modal-split-overlay");
    locationModal.style.removeProperty("--location-overlay-right-inset");
    return;
  }
  const useSplitOverlay = shouldUseSplitLocationOverlay();
  locationModal.classList.toggle("location-modal-split-overlay", useSplitOverlay);
  if (!useSplitOverlay) {
    locationModal.style.removeProperty("--location-overlay-right-inset");
    return;
  }
  const mapLeft = mapPanel?.getBoundingClientRect().left;
  const rightInset = Number.isFinite(mapLeft)
    ? Math.max(0, window.innerWidth - mapLeft)
    : 0;
  locationModal.style.setProperty("--location-overlay-right-inset", `${rightInset}px`);
}

function ensureLocationSearchLayer() {
  if (!mainMap || !window.L) {
    return;
  }
  const paneName = "location-search-preview-pane";
  let pane = mainMap.getPane(paneName);
  if (!pane) {
    pane = mainMap.createPane(paneName);
  }
  pane.style.zIndex = String(MAP_PIN_FOCUS_ZINDEX + 2500);
  if (!locationSearchLayerGroup) {
    locationSearchLayerGroup = window.L.layerGroup().addTo(mainMap);
  }
}

function centerLocationPreviewMap() {
  if (!mainMap) {
    return;
  }
  clearLocationPreviewMarker();
}

function clearLocationPreviewMarker() {
  if (locationPreviewMarker && mainMap) {
    mainMap.removeLayer(locationPreviewMarker);
  }
  locationPreviewMarker = null;
}

function updateLocationPreviewMarker(location, options = {}) {
  if (!mainMap || !window.L) {
    return;
  }
  ensureLocationSearchLayer();
  const recenter = options.recenter !== false;
  const zoom = typeof options.zoom === "number" ? options.zoom : 14;
  const transitionFromIndex =
    typeof options.transitionFromIndex === "number" ? options.transitionFromIndex : -1;
  const sourceMarker =
    transitionFromIndex >= 0 ? locationSearchMarkers[transitionFromIndex] || null : null;
  const sourceMarkerEl = sourceMarker?.getElement?.() || null;
  if (sourceMarkerEl) {
    sourceMarkerEl.classList.add("is-transition-out");
  }
  clearLocationPreviewMarker();
  const icon = window.L.divIcon({
    className: "location-preview-marker",
    html: "<span class=\"location-preview-dot\"></span>",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
  locationPreviewMarker = window.L.marker([location.lat, location.lon], {
    draggable: true,
    icon,
    pane: "location-search-preview-pane",
    zIndexOffset: MAP_PIN_FOCUS_ZINDEX + 2200,
  }).addTo(mainMap);
  const previewEl = locationPreviewMarker.getElement?.();
  if (previewEl) {
    previewEl.classList.toggle("is-entering", Boolean(sourceMarkerEl));
    if (sourceMarkerEl) {
      window.setTimeout(() => {
        previewEl.classList.remove("is-entering");
      }, 260);
    }
  }
  locationPreviewMarker.on("dragend", async (event) => {
    const next = event.target.getLatLng();
    const label = pendingLocation?.label || "Dropped pin";
    const result = await buildLocationWithReverse(next.lat, next.lng, label);
    if (result.needsConfirm) {
      const useNew = await openReverseGeocodeModal(result.oldLabel, result.newLabel);
      if (!useNew) {
        if (pendingLocation) {
          updateLocationPreviewMarker(pendingLocation, { recenter: false });
        }
        return;
      }
    }
    setPendingLocation(result.location, { recenter: false });
  });
  if (recenter) {
    mainMap.setView([location.lat, location.lon], zoom);
  }
}

function setPendingLocation(location, options = {}) {
  pendingLocation = location;
  const showPreview = options.showPreview !== false;
  if (locationSetButton) {
    locationSetButton.disabled = !pendingLocation;
  }
  if (locationClearButton) {
    locationClearButton.disabled = !pendingLocation;
  }
  if (location && showPreview) {
    updateLocationPreviewMarker(location, options);
  } else {
    clearLocationPreviewMarker();
  }
}

function showMapGeocodeNotice(message) {
  if (!mapGeocodeNotice || !mapGeocodeText) {
    return;
  }
  mapGeocodeText.textContent = message;
  mapGeocodeNotice.classList.remove("hidden");
  if (mapGeocodeNoticeTimer) {
    window.clearTimeout(mapGeocodeNoticeTimer);
  }
  mapGeocodeNoticeTimer = window.setTimeout(() => {
    mapGeocodeNotice.classList.add("hidden");
  }, 4000);
}

function describeLocationTarget(target) {
  if (target.kind === "city") {
    return "Default city for geocoding + radius filtering.";
  }
  if (target.kind === "new-card-lookup") {
    return "Search for a location to create a new pinned card.";
  }
  const column = state.columns.find((col) => col.id === target.columnId);
  if (!column) {
    return "";
  }
  const cardLabel = getCardDisplay(column.type || DEFAULT_CARD_TYPE, column.label);
  if (target.kind === "card") {
    return `Card: ${cardLabel}`;
  }
  const obs = column.observations.find((item) => item.id === target.obsId);
  const noteTime = obs ? formatTimeOnly(obs.timestamp) : "";
  return `Note: ${cardLabel} ${noteTime}`.trim();
}

function getTargetLocation(target) {
  if (!target) {
    return null;
  }
  if (target.kind === "city") {
    return state.mapSettings.city;
  }
  if (target.kind === "new-card-lookup") {
    return null;
  }
  const column = state.columns.find((col) => col.id === target.columnId);
  if (!column) {
    return null;
  }
  if (target.kind === "card") {
    return column.location || null;
  }
  const obs = column.observations.find((item) => item.id === target.obsId);
  return obs?.location || null;
}

async function runLocationSearch(query) {
  if (!locationResults) {
    return;
  }
  if (!isModalOpen(locationModal)) {
    return;
  }
  if (!query.trim()) {
    locationResults.innerHTML = "<div class=\"search-empty\">Start typing to search.</div>";
    clearLocationSearchMarkers();
    return;
  }
  clearLocationSearchMarkers();
  locationResults.innerHTML = "<div class=\"search-empty\">Searching...</div>";
  let results = await fetchAutocompleteResults(query);
  if (!results.length) {
    const fallback = await fetchGeoResults(query);
    if (fallback) {
      results = [{ label: fallback.label, location: fallback }];
    }
  }
  if (!isModalOpen(locationModal)) {
    return;
  }
  renderLocationResults(results);
}

function getLocationResultKey(index) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (index < alphabet.length) {
    return alphabet[index];
  }
  return "?";
}

function buildLocationResultMarkerIcon(key, isActive = false) {
  if (!window.L) {
    return null;
  }
  return window.L.divIcon({
    className: `location-result-marker${isActive ? " is-active" : ""}`,
    html: `<span>${key}</span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function clearLocationSearchMarkers() {
  locationSearchMarkers = [];
  locationSearchBounds = null;
  if (locationSearchLayerGroup) {
    locationSearchLayerGroup.clearLayers();
  }
}

function highlightLocationResult(index) {
  if (!locationResults) {
    return;
  }
  locationSearchState.activeIndex = index;
  Array.from(locationResults.children).forEach((child, childIndex) => {
    child.classList.toggle("highlighted", childIndex === index);
  });
  locationSearchMarkers.forEach((marker, markerIndex) => {
    if (!marker) {
      return;
    }
    const isActive = markerIndex === index;
    marker.setZIndexOffset(markerIndex === index ? 500 : 0);
    const key = marker._locationResultKey || getLocationResultKey(markerIndex);
    const icon = buildLocationResultMarkerIcon(key, isActive);
    if (icon) {
      marker.setIcon(icon);
    }
    const el = marker.getElement();
    if (el) {
      if (!isActive) {
        el.classList.remove("is-transition-out");
      }
      el.classList.toggle("is-active", isActive);
    }
  });
}

async function updateLocationSearchMarkers(results, token) {
  if (!mainMap || !isModalOpen(locationModal)) {
    return;
  }
  ensureLocationSearchLayer();
  if (!locationSearchLayerGroup) {
    return;
  }
  clearLocationSearchMarkers();
  const bounds = [];
  for (let i = 0; i < results.length; i += 1) {
    if (token !== locationSearchToken) {
      return;
    }
    const result = results[i];
    let location = result.location || null;
    if (!location) {
      location = await fetchGeoResults(result.searchText || result.label);
      if (location) {
        result.location = location;
      }
    }
    if (!location) {
      locationSearchMarkers[i] = null;
      continue;
    }
    const key = getLocationResultKey(i);
    const marker = window.L.marker([location.lat, location.lon], {
      icon: buildLocationResultMarkerIcon(key, false),
      pane: "location-search-preview-pane",
      zIndexOffset: MAP_PIN_FOCUS_ZINDEX + 1800,
    });
    marker._locationResultKey = key;
    marker.addTo(locationSearchLayerGroup);
    locationSearchMarkers[i] = marker;
    bounds.push([location.lat, location.lon]);
  }
  if (bounds.length) {
    locationSearchBounds = window.L.latLngBounds(bounds);
    mainMap.fitBounds(locationSearchBounds, { padding: [40, 40], maxZoom: 14 });
  }
  highlightLocationResult(locationSearchState.activeIndex);
}

function renderLocationResults(results) {
  if (!locationResults || !isModalOpen(locationModal)) {
    return;
  }
  locationSearchState.results = results;
  locationSearchState.activeIndex = -1;
  locationSearchState.selectedIndex = -1;
  locationSearchState.hoverIndex = -1;
  locationResults.innerHTML = "";
  locationSearchToken += 1;
  const token = locationSearchToken;
  clearLocationSearchMarkers();
  if (!results.length) {
    locationResults.innerHTML = "<div class=\"search-empty\">No matches found.</div>";
    return;
  }
  results.forEach((result, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "location-result";
    const key = getLocationResultKey(index);
    const keyEl = document.createElement("span");
    keyEl.className = "location-result-key";
    keyEl.textContent = key;
    const textEl = document.createElement("span");
    textEl.textContent = result.label;
    button.appendChild(keyEl);
    button.appendChild(textEl);
    button.addEventListener("click", () => {
      selectLocationResult(result, index, { source: "mouse" });
    });
    button.addEventListener("keydown", async (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      await selectLocationResult(result, index, {
        source: "keyboard",
        focusSetButton: true,
      });
    });
    button.addEventListener("focus", () => {
      highlightLocationResult(index);
    });
    button.addEventListener("mouseenter", () => {
      highlightLocationResult(index);
    });
    locationResults.appendChild(button);
  });
  updateLocationSearchMarkers(results, token);
}

async function selectLocationResult(result, index, options = {}) {
  const source = options.source || "unknown";
  const focusSetButton = options.focusSetButton === true;
  if (!result) {
    return;
  }
  if (
    source === "mouse" &&
    locationSearchState.selectedIndex === index &&
    pendingLocation &&
    locationSetButton &&
    !locationSetButton.disabled
  ) {
    locationSearchState.selectedIndex = -1;
    locationSearchState.activeIndex = -1;
    locationSearchState.hoverIndex = -1;
    Array.from(locationResults.children).forEach((child) => {
      child.classList.remove("active", "highlighted");
    });
    highlightLocationResult(-1);
    if (locationSearchBounds && mainMap) {
      mainMap.fitBounds(locationSearchBounds, { padding: [40, 40], maxZoom: 14 });
    }
    pendingLocation = null;
    clearLocationPreviewMarker();
    if (locationSetButton) {
      locationSetButton.disabled = true;
    }
    if (locationClearButton) {
      locationClearButton.disabled = true;
    }
    return;
  }
  const wasSelected = locationSearchState.selectedIndex !== -1;
  locationSearchState.selectedIndex = index;
  Array.from(locationResults.children).forEach((child, childIndex) => {
    child.classList.toggle("active", childIndex === index);
  });
  highlightLocationResult(index);
  const location = result.location || (await fetchGeoResults(result.searchText || result.label));
  if (location) {
    if (result.label) {
      location.displayLabel = result.label;
      location.label = result.label;
    }
    setPendingLocation(location, { recenter: false, showPreview: false });
    if (mainMap) {
      const zoom = wasSelected ? mainMap.getZoom() : 16;
      mainMap.setView([location.lat, location.lon], zoom);
    }
    if (
      focusSetButton &&
      locationSetButton &&
      !locationSetButton.disabled &&
      typeof locationSetButton.focus === "function"
    ) {
      locationSetButton.focus();
    }
  }
}

function applyPendingLocationFromModal() {
  if (!locationModalTarget || !pendingLocation) {
    return;
  }
  const selectedIndex =
    typeof locationSearchState.selectedIndex === "number"
      ? locationSearchState.selectedIndex
      : -1;
  const selectedMarkerEl =
    selectedIndex >= 0 ? locationSearchMarkers[selectedIndex]?.getElement?.() : null;
  if (selectedMarkerEl) {
    selectedMarkerEl.classList.add("is-transition-out");
  }
  const previewEl = locationPreviewMarker?.getElement?.();
  if (previewEl) {
    previewEl.classList.add("is-confirming");
  }
  const finalizeApply = () => {
    if (mainMap) {
      mainMap.setView(
        [pendingLocation.lat, pendingLocation.lon],
        Math.max(mainMap.getZoom(), 16)
      );
    }
    locationModalShouldRestoreView = false;
    applyLocationToTarget(locationModalTarget, pendingLocation, {
      preserveMapView: true,
    });
    closeLocationModal();
  };
  if (selectedMarkerEl || previewEl) {
    window.setTimeout(finalizeApply, 170);
    return;
  }
  finalizeApply();
}

function buildGeoSearchQuery(query) {
  const cleaned = query.trim();
  if (!state.mapSettings.city || !state.mapSettings.city.label) {
    return cleaned;
  }
  const cityLabel = state.mapSettings.city.label.trim();
  if (!cityLabel) {
    return cleaned;
  }
  if (cleaned.toLowerCase().includes(cityLabel.toLowerCase())) {
    return cleaned;
  }
  return `${cleaned} ${cityLabel}`;
}

async function fetchAutocompleteResults(query) {
  if (!MAP_FEATURE_ENABLED || !GEO_BASE_URL) {
    return [];
  }
  try {
    const payload = { search: buildGeoSearchQuery(query) };
    const response = await fetch(`${GEO_BASE_URL}/autocomplete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
    return suggestions
      .map((item) => {
        const prediction = item.placePrediction || {};
        const structured = prediction.structuredFormat || {};
        const mainText = structured.mainText?.text || prediction.text?.text || "";
        const secondary = structured.secondaryText?.text || "";
        const label = secondary ? `${mainText}, ${secondary}` : mainText;
        return {
          label: label || "Unknown",
          searchText: label || prediction.text?.text || "",
        };
      })
      .filter((item) => item.label);
  } catch (error) {
    return [];
  }
}

async function fetchGeoResults(query) {
  if (!MAP_FEATURE_ENABLED || !GEO_BASE_URL) {
    return null;
  }
  try {
    const payload = { search: buildGeoSearchQuery(query) };
    const response = await fetch(`${GEO_BASE_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];
    const normalizedQuery = String(query || "").toLowerCase();
    const match =
      results.find((result) =>
        String(result.formatted_address || "").toLowerCase().includes(normalizedQuery)
      ) || results[0];
    if (!match) {
      return null;
    }
    const lat = match.geometry?.location?.lat;
    const lon = match.geometry?.location?.lng;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }
    const address = match.formatted_address || query;
    return buildLocation(address, lat, lon, "geolocate", address);
  } catch (error) {
    return null;
  }
}

async function fetchReverseGeocode(lat, lon) {
  if (!MAP_FEATURE_ENABLED || !GEO_BASE_URL) {
    return { label: null, rateLimited: false };
  }
  try {
    const payload = { latitude: lat, longitude: lon };
    const response = await fetch(`${GEO_BASE_URL}/reverse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.status === 429) {
      return { label: null, rateLimited: true };
    }
    if (!response.ok) {
      return { label: null, rateLimited: false };
    }
    const data = await response.json();
    const results = Array.isArray(data?.result) ? data.result : [];
    if (!results.length) {
      return { label: null, rateLimited: false };
    }
    const best = results[0];
    const structured = best?.structuredAddress || null;
    let label = "";
    if (structured && Array.isArray(structured.addressLines) && structured.addressLines.length) {
      const addressLine = structured.addressLines.filter(Boolean).join(", ");
      const locality = String(structured.locality || "").trim();
      const admin = normalizeStateAbbrev(structured.administrativeArea);
      const cityLine = [locality, admin].filter(Boolean).join(", ");
      label = [addressLine, cityLine].filter(Boolean).join(", ");
    } else {
      const raw = String(best?.address || "").replace(/,\s*USA$/i, "").trim();
      if (raw) {
        const parts = raw.split(/\s*[,，]\s*/).filter(Boolean);
        const line1 = parts[0] || "";
        let line2 = parts.slice(1).join(", ");
        if (line1 && isSpecificAddressText(line1)) {
          line2 = line2.replace(/\s+\d{5}(?:-\d{4})?$/, "").trim();
        }
        label = [line1, line2].filter(Boolean).join(", ");
      }
    }
    return { label: label ? String(label) : null, rateLimited: false };
  } catch (error) {
    return { label: null, rateLimited: false };
  }
}

function formatLatLonLabel(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return "";
  }
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

function formatNearLabel(label) {
  const cleaned = String(label || "").trim();
  if (!cleaned) {
    return "";
  }
  return cleaned.toLowerCase().startsWith("near ") ? cleaned : `near ${cleaned}`;
}

function formatFallbackLabel(label) {
  const formatted = formatLocationLabel(label);
  return formatted || "None";
}

async function buildLocationWithReverse(lat, lon, fallbackLabel = "Dropped pin") {
  const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
  if (reverseGeocodeCache.has(key)) {
    const cached = reverseGeocodeCache.get(key);
    if (cached?.label) {
      const displayLabel = formatNearLabel(cached.label);
      return {
        location: buildLocation(displayLabel, lat, lon, "reverse", cached.label),
        needsConfirm: !isSpecificAddressText(cached.label),
        oldLabel: formatFallbackLabel(fallbackLabel),
        newLabel: formatLocationLabel(displayLabel) || formatFallbackLabel(displayLabel),
      };
    }
  }
  if (reverseGeocodeInFlight.has(key)) {
    const inFlight = reverseGeocodeInFlight.get(key);
    if (inFlight) {
      const resolved = await inFlight;
      const displayLabel =
        formatNearLabel(resolved?.label) ||
        formatNearLabel(formatLatLonLabel(lat, lon)) ||
        "Dropped pin";
      return {
        location: buildLocation(
          displayLabel,
          lat,
          lon,
          resolved?.label ? "reverse" : "manual",
          resolved?.label || ""
        ),
        needsConfirm: !resolved?.label || !isSpecificAddressText(resolved.label),
        oldLabel: formatFallbackLabel(fallbackLabel),
        newLabel: formatLocationLabel(displayLabel) || formatFallbackLabel(displayLabel),
      };
    }
  }
  const task = reverseGeocodeQueue.then(async () => {
    const now = Date.now();
    const wait = Math.max(0, 500 - (now - reverseGeocodeLastAt));
    if (wait) {
      await new Promise((resolve) => window.setTimeout(resolve, wait));
    }
    reverseGeocodeLastAt = Date.now();
    const result = await fetchReverseGeocode(lat, lon);
    if (result?.label) {
      reverseGeocodeCache.set(key, { label: result.label, ts: Date.now() });
    }
    return result;
  });
  reverseGeocodeQueue = task.catch(() => ({}));
  reverseGeocodeInFlight.set(key, task);
  const resolved = await task.finally(() => {
    reverseGeocodeInFlight.delete(key);
  });
  if (resolved?.rateLimited) {
    showMapGeocodeNotice("Rate limited — using the existing pin label.");
  }
  const displayLabel =
    formatNearLabel(resolved?.label) ||
    formatNearLabel(formatLatLonLabel(lat, lon)) ||
    "Dropped pin";
  return {
    location: buildLocation(
      displayLabel,
      lat,
      lon,
      resolved?.label ? "reverse" : "manual",
      resolved?.label || ""
    ),
    needsConfirm: !resolved?.label || !isSpecificAddressText(resolved.label),
    oldLabel: formatFallbackLabel(fallbackLabel),
    newLabel: formatLocationLabel(displayLabel) || formatFallbackLabel(displayLabel),
  };
}

function updateCityUI() {
  if (cityLabel) {
    cityLabel.textContent = state.mapSettings.city
      ? state.mapSettings.city.displayLabel || state.mapSettings.city.label
      : "No city set.";
  }
  if (mapRadiusInput) {
    mapRadiusInput.value = state.mapSettings.radiusMiles;
  }
  updateLocationLimitDetail();
  updateMapStyleButton();
}

function syncMapFilterControls() {
  if (mapFilterMinimized) {
    mapFilterMinimized.classList.toggle("active", state.mapFilters.hideMinimized);
    mapFilterMinimized.setAttribute("aria-pressed", String(state.mapFilters.hideMinimized));
  }
  if (mapFilterLabelTimes) {
    mapFilterLabelTimes.classList.toggle("active", state.mapFilters.labelTimes);
    mapFilterLabelTimes.setAttribute("aria-pressed", String(state.mapFilters.labelTimes));
  }
  updateMapTypeButtonState(state.mapFilters.types);
}

function isMapTypeNoneSelected(filters) {
  if (!filters) {
    return false;
  }
  return Object.values(filters).every((value) => !value);
}

function updateMapTypeButtonState(filters) {
  if (!mapTypeButton) {
    return;
  }
  mapTypeButton.classList.toggle("hazard", isMapTypeNoneSelected(filters));
}

function showMapFilterNotice() {
  if (mapFilterNotice) {
    mapFilterNotice.classList.remove("hidden");
  }
}

function hideMapFilterNotice() {
  if (mapFilterNotice) {
    mapFilterNotice.classList.add("hidden");
  }
}

function isMapPinFiltered(targetKey) {
  if (!targetKey) {
    return false;
  }
  const [kind, columnId] = targetKey.split(":");
  const column = state.columns.find((col) => String(col.id) === String(columnId));
  if (!column) {
    return false;
  }
  if (state.mapFilters?.hideMinimized && column.minimized) {
    return true;
  }
  const normalizedType = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
  if (state.mapFilters?.types && !state.mapFilters.types[normalizedType]) {
    return true;
  }
  return false;
}

function renderMapTypeMenu(filters) {
  if (!mapTypeMenu) {
    return;
  }
  mapTypeMenu.innerHTML = "";
  const labelCounts = CARD_TYPES.reduce((acc, type) => {
    acc[type.label] = (acc[type.label] || 0) + 1;
    return acc;
  }, {});
  const uniqueTypes = [];
  const seenTypes = new Set();
  CARD_TYPES.forEach((type) => {
    const normalized = normalizeCardType(type.value);
    if (seenTypes.has(normalized)) {
      return;
    }
    seenTypes.add(normalized);
    uniqueTypes.push(type);
  });
  uniqueTypes.forEach((type) => {
    const normalized = normalizeCardType(type.value);
    const label = document.createElement("label");
    label.className = "map-type-item";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(filters[normalized]);
    checkbox.addEventListener("change", () => {
      filters[normalized] = checkbox.checked;
      updateMapTypeButtonState(filters);
    });
    const icon = createCardTypeIconNode(normalized);
    const text = document.createElement("span");
    text.textContent =
      labelCounts[type.label] > 1 ? type.value : type.label;
    label.appendChild(checkbox);
    label.appendChild(icon);
    label.appendChild(text);
    mapTypeMenu.appendChild(label);
  });
  const actions = document.createElement("div");
  actions.className = "map-type-actions";
  const showAllButton = document.createElement("button");
  showAllButton.type = "button";
  showAllButton.className = "map-type-apply";
  showAllButton.textContent = "Show All";
  showAllButton.addEventListener("click", (event) => {
    event.preventDefault();
    const defaults = getDefaultMapTypeFilters();
    Object.keys(defaults).forEach((key) => {
      filters[key] = defaults[key];
    });
    renderMapTypeMenu(filters);
    updateMapTypeButtonState(filters);
  });
  actions.appendChild(showAllButton);
  const applyButton = document.createElement("button");
  applyButton.type = "button";
  applyButton.className = "map-type-apply";
  applyButton.textContent = "Apply";
  applyButton.addEventListener("click", (event) => {
    event.preventDefault();
    closeMapTypeMenu(true);
  });
  actions.appendChild(applyButton);
  mapTypeMenu.appendChild(actions);
  refreshIcons();
}

function renderMapStyleMenu() {
  if (!mapStyleMenu) {
    return;
  }
  mapStyleMenu.innerHTML = "";
  const active = getActiveMapStyle().id;
  MAP_STYLES.forEach((style) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-style-item";
    button.classList.toggle("active", style.id === active);
    button.textContent = style.label;
    button.addEventListener("click", () => {
      setMapStyle(style.id);
      updateMapStyleButton();
      mapStyleMenu.classList.remove("show");
      mapStyleButton?.setAttribute("aria-expanded", "false");
    });
    mapStyleMenu.appendChild(button);
  });
}

function updateMapStyleButton() {
  if (!mapStyleButton) {
    return;
  }
  const style = getActiveMapStyle();
  mapStyleButton.textContent = `Style: ${style.label} ▾`;
}

function applyMapTypeFilters(next) {
  state.mapFilters.types = normalizeMapTypeFilters(next);
  updateMapTypeButtonState(state.mapFilters.types);
  mapNeedsFit = true;
  renderMapPins();
  persistState();
  hideMapFilterNotice();
}

let mapTypeDraft = null;

function openMapTypeMenu() {
  if (!mapTypeMenu || !mapTypeButton) {
    return;
  }
  mapTypeDraft = normalizeMapTypeFilters(state.mapFilters.types);
  renderMapTypeMenu(mapTypeDraft);
  mapTypeMenu.classList.add("show");
  mapTypeButton.setAttribute("aria-expanded", "true");
}

function closeMapTypeMenu(applyChanges) {
  if (!mapTypeMenu || !mapTypeButton) {
    return;
  }
  if (applyChanges && mapTypeDraft) {
    applyMapTypeFilters(mapTypeDraft);
  } else {
    updateMapTypeButtonState(state.mapFilters.types);
  }
  mapTypeMenu.classList.remove("show");
  mapTypeButton.setAttribute("aria-expanded", "false");
  mapTypeDraft = null;
}

function updateLocationLimitDetail() {
  if (!locationLimitDetail) {
    return;
  }
  const city = state.mapSettings.city;
  const radius = state.mapSettings.radiusMiles;
  if (city && radius) {
    const cityLabel = city.displayLabel || city.label;
    locationLimitDetail.textContent = `(Limit results to ${radius} miles of ${cityLabel})`;
    locationLimitDetail.classList.remove("is-link");
    locationLimitDetail.disabled = true;
  } else {
    locationLimitDetail.textContent = "Click to limit results to a region";
    locationLimitDetail.classList.add("is-link");
    locationLimitDetail.disabled = false;
  }
}

function isModalOpen(modal) {
  return modal && !modal.classList.contains("hidden");
}

function closeAllModals() {
  if (isModalOpen(vehicleModal)) {
    closeVehicleModal();
  }
  if (isModalOpen(deleteModal)) {
    closeDeleteModal();
  }
  if (isModalOpen(shortcutsModal)) {
    closeShortcutsModal();
  }
  if (isModalOpen(saveInfoModal)) {
    closeSaveInfoModal();
  }
  if (isModalOpen(searchModal)) {
    closeSearchModal();
  }
  if (isModalOpen(locationModal)) {
    closeLocationModal();
  }
  if (isModalOpen(mapCardMetaModal)) {
    closeMapCardMetaModal();
  }
  if (isModalOpen(applyCardColorsModal)) {
    closeApplyCardColorsModal();
  }
  if (isModalOpen(tutorialPickerModal)) {
    closeTutorialPickerModal();
  }
  if (isModalOpen(tutorialWelcomeModal)) {
    closeTutorialWelcomeModal();
  }
  if (isModalOpen(tutorialCompleteModal)) {
    closeTutorialCompleteModal();
  }
}

function getSelectedColumnIndex() {
  const visible = getVisibleColumns();
  if (!visible.length) {
    return -1;
  }
  if (!state.selection) {
    return 0;
  }
  const index = visible.findIndex((col) => col.id === state.selection.columnId);
  return index === -1 ? 0 : index;
}

function getVisibleColumns() {
  return state.columns.filter((col) => !col.minimized);
}

function ensureNoteFullyVisible(noteEl) {
  if (!noteEl) {
    return;
  }
  const container = noteEl.closest(".observations");
  if (!container) {
    noteEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    return;
  }
  const padding = 10;
  const containerRect = container.getBoundingClientRect();
  const noteRect = noteEl.getBoundingClientRect();
  let nextScrollTop = container.scrollTop;
  const maxVisibleHeight = container.clientHeight - padding * 2;

  if (noteRect.height >= maxVisibleHeight) {
    nextScrollTop += noteRect.top - (containerRect.top + padding);
  } else if (noteRect.top < containerRect.top + padding) {
    nextScrollTop += noteRect.top - (containerRect.top + padding);
  } else if (noteRect.bottom > containerRect.bottom - padding) {
    nextScrollTop += noteRect.bottom - (containerRect.bottom - padding);
  }

  const boundedTop = Math.max(0, nextScrollTop);
  if (Math.abs(boundedTop - container.scrollTop) > 1) {
    container.scrollTo({ top: boundedTop, behavior: "smooth" });
  }
}

function focusLastNote(columnId, noteId = null) {
  const columnSelector = `[data-column-id=\"${escapeSelector(columnId)}\"]`;
  const columnEl = columnsEl.querySelector(columnSelector);
  if (!columnEl) {
    return;
  }
  const noteEls = columnEl.querySelectorAll(".observation[data-note-id]");
  if (!noteEls.length) {
    return;
  }
  let targetNoteEl = null;
  if (noteId) {
    targetNoteEl = columnEl.querySelector(`[data-note-id=\"${escapeSelector(noteId)}\"]`);
  }
  if (!targetNoteEl) {
    targetNoteEl =
      state.notesNewestFirst === false
        ? noteEls[noteEls.length - 1]
        : noteEls[0];
  }
  ensureNoteFullyVisible(targetNoteEl);
  const column = state.columns.find((col) => col.id === columnId);
  const isVehicleList = isVehicleListType(column?.type || DEFAULT_CARD_TYPE);
  if (isVehicleList) {
    const plateInput =
      targetNoteEl.querySelector(".vehicle-note-field-plate input") ||
      targetNoteEl.querySelector(".vehicle-note-grid-plate .vehicle-note-field input");
    if (plateInput && !plateInput.disabled) {
      plateInput.focus();
      return;
    }
  }
  const noteTextArea = targetNoteEl.querySelector("textarea");
  if (noteTextArea && !noteTextArea.disabled) {
    noteTextArea.focus();
  }
}

function setTimeZone(value) {
  state.timezone = normalizeTimeZone(value);
  state.dispatchVisited = true;
  persistState();
  if (timezoneDropdown) {
    timezoneDropdown.setValue(state.timezone, `Custom (${state.timezone})`);
  }
  updateTimezoneLink();
  syncShiftUI();
  renderColumns();
  renderDefaultCardTypeSelect();
  renderDefaultCardColorSettings();
  updateSummary();
  applyViewMode();
  updateCityUI();
  syncMapFilterControls();
  updateTimezoneTime();
  if (!timezoneTimer) {
    timezoneTimer = setInterval(updateTimezoneTime, 60 * 1000);
  }
  updateTimezoneTime();
}

function serializeState() {
  return JSON.stringify({
    startTime: state.startTime ? state.startTime.toISOString() : null,
    endTime: state.endTime ? state.endTime.toISOString() : null,
    endAdjustedNote: state.endAdjustedNote,
    area: state.area,
    timezone: state.timezone,
    viewMode: state.viewMode,
    mapSettings: {
      city: serializeLocation(state.mapSettings.city),
      radiusMiles: state.mapSettings.radiusMiles,
      style: state.mapSettings.style,
    },
    mapFilters: {
      hideMinimized:
        state.mapFilters?.hideMinimized === undefined
          ? true
          : Boolean(state.mapFilters.hideMinimized),
      labelTimes:
        state.mapFilters?.labelTimes === undefined
          ? true
          : Boolean(state.mapFilters.labelTimes),
      types: normalizeMapTypeFilters(state.mapFilters?.types),
    },
    notesNewestFirst: state.notesNewestFirst !== false,
    summaryInclude: state.summaryInclude,
    summarySort: state.summarySort,
    summaryMostRecentFirst: Boolean(state.summaryMostRecentFirst),
    summaryKnownTypes: state.summaryKnownTypes,
    summaryReportableOnly: state.summaryReportableOnly,
    summaryIncludeLocation: state.summaryIncludeLocation,
    summaryLocationIncludeAddress: state.summaryLocationIncludeAddress !== false,
    summaryLocationIncludeLatLon: Boolean(state.summaryLocationIncludeLatLon),
    summaryIncludeEmojis: state.summaryIncludeEmojis,
    summarySanitizeNames: state.summarySanitizeNames,
    summaryBulletsForNotes: Boolean(state.summaryBulletsForNotes),
    summarySpaceBetweenNotes: Boolean(state.summarySpaceBetweenNotes),
    summaryTime24: state.summaryTime24,
    summaryGroupFields: state.summaryGroupFields,
    summaryDefaultExclude: state.summaryDefaultExclude,
    availableCardTypes: normalizeAvailableCardTypes(state.availableCardTypes),
    defaultNewCardType: state.defaultNewCardType,
    cardColorDefaults: normalizeCardColorDefaults(state.cardColorDefaults),
    columns: state.columns.map((column) => ({
      id: column.id,
      type: normalizeCardType(column.type),
      minimized: column.minimized,
      color: column.color,
      label: column.label,
      labelAuto: column.labelAuto,
      reportAll: Boolean(column.reportAll),
      createdAt: column.createdAt,
      vehicleProfile: column.vehicleProfile ? normalizeVehicleInfo(column.vehicleProfile) : null,
      location: serializeLocation(column.location),
      observations: column.observations.map((obs) => ({
        id: obs.id,
        timestamp: obs.timestamp.toISOString(),
        timestampText: obs.timestampText,
        originalTimestampText: obs.originalTimestampText,
        createdAt: obs.createdAt,
        editedFrom: obs.editedFrom,
        text: obs.text,
        reportable: Boolean(obs.reportable),
        location: serializeLocation(obs.location),
        vehicleInfo: obs.vehicleInfo ? normalizeVehicleInfo(obs.vehicleInfo) : null,
      })),
    })),
  });
}

function serializeLocation(location) {
  if (!location) {
    return null;
  }
  return {
    label: location.label || "",
    displayLabel: location.displayLabel || location.label || "",
    addressLabel: location.addressLabel || "",
    lat: location.lat,
    lon: location.lon,
    source: location.source || "manual",
    updatedAt: location.updatedAt || Date.now(),
  };
}

function loadState(raw) {
  try {
    const data = JSON.parse(raw);
    const isLegacyVehicleSchema = data.availableCardTypes === undefined;
    const typeCounts = {};
    state.startTime = data.startTime ? new Date(data.startTime) : null;
    state.endTime = data.endTime ? new Date(data.endTime) : null;
    state.endAdjustedNote = data.endAdjustedNote || "";
    state.area = data.area || "";
    state.timezone = normalizeTimeZone(data.timezone || DEFAULT_TIMEZONE);
    state.notesNewestFirst =
      data.notesNewestFirst === undefined
        ? DEFAULT_NOTES_NEWEST_FIRST
        : Boolean(data.notesNewestFirst);
    state.summaryInclude = Array.isArray(data.summaryInclude)
      ? Array.from(new Set(data.summaryInclude.map(normalizeCardType)))
      : null;
    state.summarySort = SUMMARY_SORT_OPTIONS.has(data.summarySort)
      ? data.summarySort
      : DEFAULT_SUMMARY_SORT;
    state.summaryMostRecentFirst = Boolean(data.summaryMostRecentFirst);
    state.summaryKnownTypes = Array.isArray(data.summaryKnownTypes)
      ? Array.from(new Set(data.summaryKnownTypes.map(normalizeCardType)))
      : null;
    state.summaryReportableOnly = Boolean(data.summaryReportableOnly);
    state.summaryIncludeLocation =
      data.summaryIncludeLocation === undefined
        ? DEFAULT_SUMMARY_INCLUDE_LOCATION
        : Boolean(data.summaryIncludeLocation);
    state.summaryLocationIncludeAddress =
      data.summaryLocationIncludeAddress === undefined
        ? DEFAULT_SUMMARY_INCLUDE_LOCATION_ADDRESS
        : Boolean(data.summaryLocationIncludeAddress);
    state.summaryLocationIncludeLatLon =
      data.summaryLocationIncludeLatLon === undefined
        ? DEFAULT_SUMMARY_INCLUDE_LOCATION_LAT_LON
        : Boolean(data.summaryLocationIncludeLatLon);
    state.summaryIncludeEmojis =
      data.summaryIncludeEmojis === undefined
        ? DEFAULT_SUMMARY_INCLUDE_EMOJIS
        : Boolean(data.summaryIncludeEmojis);
    state.summarySanitizeNames =
      data.summarySanitizeNames === undefined
        ? DEFAULT_SUMMARY_SANITIZE_NAMES
        : Boolean(data.summarySanitizeNames);
    state.summaryBulletsForNotes =
      data.summaryBulletsForNotes === undefined
        ? DEFAULT_SUMMARY_BULLETS_FOR_NOTES
        : Boolean(data.summaryBulletsForNotes);
    state.summarySpaceBetweenNotes =
      data.summarySpaceBetweenNotes === undefined
        ? DEFAULT_SUMMARY_SPACE_BETWEEN_NOTES
        : Boolean(data.summarySpaceBetweenNotes);
    state.summaryTime24 =
      data.summaryTime24 === undefined ? DEFAULT_SUMMARY_TIME_24 : Boolean(data.summaryTime24);
    state.summaryGroupFields =
      data.summaryGroupFields === undefined
        ? DEFAULT_SUMMARY_GROUP_FIELDS
        : Boolean(data.summaryGroupFields);
    state.summaryDefaultExclude = Array.isArray(data.summaryDefaultExclude)
      ? Array.from(new Set(data.summaryDefaultExclude.map(normalizeCardType)))
      : Array.from(DEFAULT_SUMMARY_EXCLUDE);
    state.availableCardTypes = normalizeAvailableCardTypes(data.availableCardTypes);
    if (
      Array.isArray(data.availableCardTypes) &&
      data.availableCardTypes.includes(VEHICLE_LIST_CARD_TYPE) &&
      !data.availableCardTypes.includes(VEHICLE_CARD_TYPE) &&
      !state.availableCardTypes.includes(VEHICLE_CARD_TYPE)
    ) {
      state.availableCardTypes.push(VEHICLE_CARD_TYPE);
    }
    state.defaultNewCardType =
      data.defaultNewCardType && data.defaultNewCardType !== "last"
        ? normalizeCardType(data.defaultNewCardType)
        : DEFAULT_NEW_CARD_TYPE;
    if (
      state.defaultNewCardType &&
      state.defaultNewCardType !== "last" &&
      !normalizeAvailableCardTypes(data.availableCardTypes).includes(state.defaultNewCardType)
    ) {
      state.defaultNewCardType = "last";
    }
    state.cardColorDefaults = normalizeCardColorDefaults(data.cardColorDefaults);
    const isLegacyColorModel = !data.cardColorDefaults || !data.cardColorDefaults.palette;
    state.viewMode = ["notes", "split", "map"].includes(data.viewMode)
      ? data.viewMode
      : "notes";
    state.mapSettings = hydrateMapSettings(data.mapSettings);
    state.mapFilters = {
      hideMinimized:
        data.mapFilters?.hideMinimized === undefined
          ? DEFAULT_MAP_FILTER_HIDE_MINIMIZED
          : Boolean(data.mapFilters.hideMinimized),
      labelTimes:
        data.mapFilters?.labelTimes === undefined
          ? DEFAULT_MAP_FILTER_LABEL_TIMES
          : Boolean(data.mapFilters.labelTimes),
      types: normalizeMapTypeFilters(data.mapFilters?.types),
    };
    state.columns = (data.columns || []).map((column, index) => {
      let type = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
      if (isLegacyVehicleSchema && type === VEHICLE_CARD_TYPE) {
        type = VEHICLE_LIST_CARD_TYPE;
      }
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      const label =
        column.label == null
          ? isVehicleCardType(type)
            ? ""
            : String(typeCounts[type])
          : String(column.label);
      const createdAt =
        typeof column.createdAt === "number"
          ? column.createdAt
          : Date.now() + index;
      return {
        id: column.id || createId(),
        type,
        minimized: Boolean(column.minimized),
        color: Number.isInteger(column.color)
          ? normalizeLoadedColorIndex(column.color, isLegacyColorModel)
          : PALETTE_COLOR_INDICES[index % PALETTE_COLOR_INDICES.length],
        label,
        labelAuto: column.labelAuto ?? column.label == null,
        reportAll: Boolean(column.reportAll),
        createdAt,
        vehicleProfile: isVehicleCardType(type)
          ? normalizeVehicleInfo(column.vehicleProfile || {})
          : null,
        location: loadLocation(column.location),
        observations: (column.observations || []).map((obs) => {
          let timestamp = new Date(obs.timestamp);
          let timestampValue = timestamp.getTime();
          if (!Number.isFinite(timestampValue)) {
            const parsedFromText = parseShiftTimestamp(obs.timestampText || "");
            if (parsedFromText) {
              timestamp = parsedFromText;
              timestampValue = parsedFromText.getTime();
            } else if (typeof obs.createdAt === "number" && Number.isFinite(obs.createdAt)) {
              timestamp = new Date(obs.createdAt);
              timestampValue = timestamp.getTime();
            } else {
              timestamp = new Date();
              timestampValue = timestamp.getTime();
            }
          }
          return {
            id: obs.id || createId(),
            timestamp,
            timestampText: obs.timestampText || formatTimeOnly(timestamp),
            originalTimestampText: obs.originalTimestampText || obs.timestampText,
            createdAt:
              typeof obs.createdAt === "number"
                ? obs.createdAt
                : Number.isFinite(timestampValue)
                  ? timestampValue
                  : Date.now(),
            editedFrom: obs.editedFrom || "",
            text: obs.text || "",
            reportable: Boolean(obs.reportable),
            location: loadLocation(obs.location),
            vehicleInfo: obs.vehicleInfo
              ? normalizeVehicleInfo(obs.vehicleInfo)
              : isVehicleListType(type)
                ? normalizeVehicleInfo(parseVehicleInfoFromText(obs.text))
                : null,
          };
        }),
      };
    });
  } catch (error) {
    createDefaultColumns();
  }
}

function hydrateMapSettings(raw) {
  const fallback = { city: null, radiusMiles: DEFAULT_MAP_RADIUS_MILES, style: DEFAULT_MAP_STYLE };
  if (!raw || typeof raw !== "object") {
    return fallback;
  }
  const radius = Number(raw.radiusMiles);
  const style = raw.style ? String(raw.style) : DEFAULT_MAP_STYLE;
  return {
    city: loadLocation(raw.city),
    radiusMiles: Number.isFinite(radius) && radius > 0 ? radius : DEFAULT_MAP_RADIUS_MILES,
    style,
  };
}

function persistMapSettings() {
  try {
    const payload = JSON.stringify({
      city: serializeLocation(state.mapSettings.city),
      radiusMiles: state.mapSettings.radiusMiles,
      style: state.mapSettings.style,
    });
    localStorage.setItem(MAP_SETTINGS_KEY, payload);
  } catch (error) {
    return;
  }
}

function loadMapSettingsFromStorage() {
  try {
    const raw = localStorage.getItem(MAP_SETTINGS_KEY);
    if (!raw) {
      return null;
    }
    return hydrateMapSettings(JSON.parse(raw));
  } catch (error) {
    return null;
  }
}

function loadLocation(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const lat = Number(raw.lat);
  const lon = Number(raw.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }
  return {
    label: String(raw.label || raw.displayLabel || ""),
    displayLabel: String(raw.displayLabel || raw.label || ""),
    addressLabel: String(raw.addressLabel || ""),
    lat,
    lon,
    source: raw.source || "manual",
    updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : Date.now(),
  };
}

function getCardTypeMeta(type) {
  return CARD_TYPES.find((item) => item.value === type) || CARD_TYPES[0];
}

function getCardTypeOptionsUnique() {
  const options = [];
  const seen = new Set();
  CARD_TYPES.forEach((item) => {
    const normalized = normalizeCardType(item.value);
    if (seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    let label = item.label;
    if (normalized === OBSERVER_BIKE_TYPE) {
      label = "Observer Bike";
    } else if (normalized === OBSERVER_CAR_TYPE) {
      label = "Observer Car";
    } else if (normalized === OBSERVER_CARD_TYPE) {
      label = "Observer";
    } else if (normalized === VEHICLE_LIST_CARD_TYPE) {
      label = "Vehicle List";
    } else if (normalized === VEHICLE_CARD_TYPE) {
      label = "Vehicle";
    }
    options.push({
      value: normalized,
      label,
      icon: item.icon,
    });
  });
  const priority = new Map([
    ["Incident", 0],
    [OBSERVER_CARD_TYPE, 1],
    [OBSERVER_BIKE_TYPE, 2],
    [OBSERVER_CAR_TYPE, 3],
    [VEHICLE_CARD_TYPE, 4],
    [VEHICLE_LIST_CARD_TYPE, 5],
  ]);
  options.sort((a, b) => {
    const pa = priority.has(a.value) ? priority.get(a.value) : 100;
    const pb = priority.has(b.value) ? priority.get(b.value) : 100;
    if (pa !== pb) {
      return pa - pb;
    }
    return a.label.localeCompare(b.label);
  });
  return options;
}

function normalizeAvailableCardTypes(values) {
  const valid = new Set(getCardTypeOptionsUnique().map((item) => normalizeCardType(item.value)));
  const fromInput = Array.isArray(values) ? values : Array.from(valid);
  const next = Array.from(
    new Set(fromInput.map((item) => normalizeCardType(item)).filter((item) => valid.has(item)))
  );
  if (!next.length) {
    return Array.from(valid);
  }
  return next;
}

function getAvailableCardTypeSet() {
  state.availableCardTypes = normalizeAvailableCardTypes(state.availableCardTypes);
  return new Set(state.availableCardTypes);
}

function isCardTypeAvailable(type) {
  return getAvailableCardTypeSet().has(normalizeCardType(type));
}

function getSelectableCardTypes(includeType = null) {
  const includeNormalized = includeType ? normalizeCardType(includeType) : null;
  const available = getAvailableCardTypeSet();
  return getCardTypeOptionsUnique().filter((item) => {
    const normalized = normalizeCardType(item.value);
    return available.has(normalized) || normalized === includeNormalized;
  });
}

function normalizeCardType(type) {
  if (!type) {
    return DEFAULT_CARD_TYPE;
  }
  if (type === "Person") {
    return OBSERVER_CARD_TYPE;
  }
  return type;
}

function isObserverType(type) {
  const normalized = normalizeCardType(type);
  return (
    normalized === OBSERVER_CARD_TYPE ||
    normalized === OBSERVER_BIKE_TYPE ||
    normalized === OBSERVER_CAR_TYPE
  );
}

function isVehicleListType(type) {
  return normalizeCardType(type) === VEHICLE_LIST_CARD_TYPE;
}

function isVehicleCardType(type) {
  return normalizeCardType(type) === VEHICLE_CARD_TYPE;
}

function buildCardTypeDataLossWarning(column, nextType) {
  if (!column) {
    return "";
  }
  const oldType = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
  const resolvedNextType = normalizeCardType(nextType || oldType);
  if (oldType === resolvedNextType) {
    return "";
  }
  const losses = [];
  if (isVehicleListType(oldType) && !isVehicleListType(resolvedNextType)) {
    const noteCount = Array.isArray(column.observations) ? column.observations.length : 0;
    if (noteCount > 0) {
      losses.push("Vehicle Info fields on notes");
    }
  }
  if (isVehicleCardType(oldType) && !isVehicleCardType(resolvedNextType)) {
    if (hasVehicleInfo(column.vehicleProfile || {})) {
      losses.push("Vehicle header info");
    }
  }
  if (!losses.length) {
    return "";
  }
  const oldLabel = getCardTypeMeta(oldType).label;
  const nextLabel = getCardTypeMeta(resolvedNextType).label;
  return (
    `Switching card type from "${oldLabel}" to "${nextLabel}" will remove ` +
    `${losses.join(" and ")}. Continue?`
  );
}

function confirmCardTypeChange(column, nextType) {
  const warning = buildCardTypeDataLossWarning(column, nextType);
  if (!warning) {
    return true;
  }
  return window.confirm(warning);
}

function getDefaultVehicleProfileForType(type) {
  return isVehicleCardType(type) ? createEmptyVehicleInfo() : null;
}

function getDefaultMapTypeFilters() {
  const filters = {};
  CARD_TYPES.forEach((card) => {
    filters[normalizeCardType(card.value)] = true;
  });
  return filters;
}

function normalizeMapTypeFilters(raw) {
  const defaults = getDefaultMapTypeFilters();
  const normalized = {};
  Object.keys(defaults).forEach((key) => {
    if (raw && raw[key] !== undefined) {
      normalized[key] = Boolean(raw[key]);
      return;
    }
    if (raw && key === VEHICLE_LIST_CARD_TYPE && raw.Vehicle !== undefined) {
      normalized[key] = Boolean(raw.Vehicle);
      return;
    }
    normalized[key] = true;
  });
  return normalized;
}

function getCardDisplay(type, label) {
  const meta = getCardTypeMeta(normalizeCardType(type));
  const labelText = (label || "").trim();
  const displayText = labelText ? `${meta.label} ${labelText}` : meta.label;
  return displayText;
}

function getPillLabel(type, label) {
  const display = getCardDisplay(type, label);
  if (display.length <= MAX_PILL_LABEL) {
    return display;
  }
  return `${display.slice(0, MAX_PILL_LABEL - 3)}...`;
}

function getMinimizedPillLabel(column) {
  const type = column.type || DEFAULT_CARD_TYPE;
  if (isVehicleCardType(type)) {
    const vehicleName = formatVehicleInfoForSummary(normalizeVehicleInfo(column.vehicleProfile || {}));
    if (vehicleName) {
      return vehicleName.length <= MAX_PILL_LABEL
        ? vehicleName
        : `${vehicleName.slice(0, MAX_PILL_LABEL - 3)}...`;
    }
  }
  const meta = getCardTypeMeta(type);
  const labelText = (column.label || "").trim();
  const useCustom = labelText && !column.labelAuto;
  const baseText = useCustom ? labelText : `${meta.label} ${labelText || ""}`.trim();
  const display = baseText.trim();
  if (display.length <= MAX_PILL_LABEL) {
    return display;
  }
  return `${display.slice(0, MAX_PILL_LABEL - 3)}...`;
}

function getNextCustomLabel(type, counts) {
  if (isVehicleCardType(type)) {
    return "";
  }
  const tracker = counts || null;
  if (tracker) {
    tracker[type] = (tracker[type] || 0) + 1;
    return String(tracker[type]);
  }
  const count = state.columns.filter((column) => column.type === type).length;
  return String(count + 1);
}

function getNextCustomLabelForType(type, excludeId) {
  if (isVehicleCardType(type)) {
    return "";
  }
  const count = state.columns.filter(
    (column) => column.type === type && column.id !== excludeId
  ).length;
  return String(count + 1);
}

function normalizeCardColorDefaults(raw) {
  const mode = [
    "cycle",
    "color-by-type",
    "manual",
    "all-grey",
  ].includes(raw?.mode)
    ? raw.mode
    : "cycle";
  const palette = getCardPaletteById(raw?.palette)?.id || DEFAULT_CARD_COLOR_PALETTE;
  const byType = {};
  const defaults = getDefaultMapTypeFilters();
  Object.keys(defaults).forEach((type) => {
    const next = Number(raw?.byType?.[type]);
    byType[type] = ACTIVE_COLUMN_COLOR_INDICES.includes(next)
      ? next
      : PALETTE_COLOR_INDICES[0];
  });
  return { mode, palette, byType };
}

function isNotesCardType(type) {
  return normalizeCardType(type) === "Notes";
}

function isCustomCardType(type) {
  return normalizeCardType(type) === "Custom";
}

function getCardPaletteById(id) {
  return CARD_COLOR_PALETTES.find((palette) => palette.id === id) || CARD_COLOR_PALETTES[0];
}

function getActivePalette() {
  return getCardPaletteById(state.cardColorDefaults?.palette || DEFAULT_CARD_COLOR_PALETTE);
}

function getColorHexByIndex(colorIndex) {
  if (colorIndex === CHARCOAL_COLOR_INDEX) {
    return CHARCOAL_COLOR_HEX;
  }
  if (colorIndex === GREY_COLOR_INDEX) {
    return GREY_COLOR_HEX;
  }
  if (colorIndex === OFFWHITE_COLOR_INDEX) {
    return OFFWHITE_COLOR_HEX;
  }
  const colors = getActivePalette().colors || [];
  const safeIndex = Number(colorIndex);
  if (Number.isInteger(safeIndex) && safeIndex >= 0 && safeIndex < colors.length) {
    return colors[safeIndex];
  }
  return colors[0] || GREY_COLOR_HEX;
}

function getColorRgbString(hex) {
  const cleaned = String(hex || "").replace("#", "");
  if (cleaned.length !== 6) {
    return "124, 135, 151";
  }
  const value = Number.parseInt(cleaned, 16);
  if (!Number.isFinite(value)) {
    return "124, 135, 151";
  }
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `${r}, ${g}, ${b}`;
}

function mixWithWhite(hex, amount = 0.86) {
  const rgb = getColorRgbString(hex).split(",").map((v) => Number(v.trim()));
  if (rgb.length !== 3 || rgb.some((v) => !Number.isFinite(v))) {
    return "#f1f4f7";
  }
  const mixed = rgb.map((v) => Math.round(v * (1 - amount) + 255 * amount));
  return `#${mixed.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function darkenHex(hex, amount = 0.2) {
  const rgb = getColorRgbString(hex).split(",").map((v) => Number(v.trim()));
  if (rgb.length !== 3 || rgb.some((v) => !Number.isFinite(v))) {
    return "#5d6570";
  }
  const darkened = rgb.map((v) => Math.round(v * (1 - amount)));
  return `#${darkened.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function applyDynamicCardColorStyles() {
  const paletteId = getActivePalette().id || DEFAULT_CARD_COLOR_PALETTE;
  document.documentElement.setAttribute("data-card-palette", paletteId);
}

function getCardTypePresetColorMap(mode) {
  const mapping = {};
  const groupList = getCardColorSettingGroups();
  if (mode === "all-grey") {
    groupList.forEach((group) => {
      group.types.forEach((type) => {
        mapping[type] = GREY_COLOR_INDEX;
      });
    });
    return mapping;
  }
  const standardGroups = groupList.filter(
    (group) => !group.types.some((type) => isNotesCardType(type) || isCustomCardType(type))
  );
  const paletteOrder = PALETTE_COLOR_INDICES.slice();
  standardGroups.forEach((group, index) => {
    const nextColor = paletteOrder[index % paletteOrder.length];
    group.types.forEach((type) => {
      mapping[type] = nextColor;
    });
  });
  groupList.forEach((group) => {
    group.types.forEach((type) => {
      if (isNotesCardType(type)) {
        mapping[type] = CHARCOAL_COLOR_INDEX;
      } else if (isCustomCardType(type)) {
        mapping[type] = OFFWHITE_COLOR_INDEX;
      } else if (!ACTIVE_COLUMN_COLOR_INDICES.includes(Number(mapping[type]))) {
        mapping[type] = PALETTE_COLOR_INDICES[0];
      }
    });
  });
  return mapping;
}

function getEffectiveCardTypeColorMap() {
  const defaults = normalizeCardColorDefaults(state.cardColorDefaults);
  if (defaults.mode === "manual") {
    return { ...defaults.byType };
  }
  if (defaults.mode === "color-by-type" || defaults.mode === "all-grey") {
    return getCardTypePresetColorMap(defaults.mode);
  }
  return getCardTypePresetColorMap("color-by-type");
}

function setCardColorMode(mode) {
  const nextMode = String(mode || "cycle");
  const defaults = normalizeCardColorDefaults(state.cardColorDefaults);
  defaults.mode = ["cycle", "color-by-type", "manual", "all-grey"].includes(nextMode)
    ? nextMode
    : "cycle";
  if (defaults.mode === "color-by-type" || defaults.mode === "all-grey") {
    defaults.byType = getCardTypePresetColorMap(defaults.mode);
  }
  state.cardColorDefaults = defaults;
  applyDynamicCardColorStyles();
}

function getColorByModeForColumn(column, index) {
  const mode = state.cardColorDefaults?.mode || "cycle";
  if (mode === "cycle") {
    return PALETTE_COLOR_INDICES[index % PALETTE_COLOR_INDICES.length];
  }
  const mapping = getEffectiveCardTypeColorMap();
  const type = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
  return normalizeColorIndex(mapping[type]);
}

function applyCardColorsToAllColumns() {
  const mode = state.cardColorDefaults?.mode || "cycle";
  if (mode === "cycle") {
    const columnsByCreated = state.columns
      .map((column, index) => ({ column, index }))
      .sort((a, b) => {
        const aCreated = Number.isFinite(a.column?.createdAt) ? a.column.createdAt : Number.POSITIVE_INFINITY;
        const bCreated = Number.isFinite(b.column?.createdAt) ? b.column.createdAt : Number.POSITIVE_INFINITY;
        if (aCreated !== bCreated) {
          return aCreated - bCreated;
        }
        return a.index - b.index;
      });
    columnsByCreated.forEach((entry, orderIndex) => {
      entry.column.color = PALETTE_COLOR_INDICES[orderIndex % PALETTE_COLOR_INDICES.length];
    });
  } else {
    state.columns.forEach((column, index) => {
      column.color = getColorByModeForColumn(column, index);
    });
  }
  markDirty();
  renderColumns();
  persistState();
  updateSummary();
}

function getColorNameByIndex(colorIndex) {
  if (colorIndex === CHARCOAL_COLOR_INDEX) {
    return "Charcoal";
  }
  if (colorIndex === GREY_COLOR_INDEX) {
    return "Grey";
  }
  if (colorIndex === OFFWHITE_COLOR_INDEX) {
    return "Off-white";
  }
  const normalizedIndex = Number(colorIndex);
  if (PALETTE_COLOR_INDICES.includes(normalizedIndex)) {
    const activePalette = getActivePalette();
    const friendly = activePalette?.colorNames?.[normalizedIndex];
    if (friendly) {
      return friendly;
    }
    return `Color ${normalizedIndex + 1}`;
  }
  return `Color ${String(colorIndex)}`;
}

function normalizeColorIndex(colorIndex) {
  const next = Number(colorIndex);
  if (ACTIVE_COLUMN_COLOR_INDICES.includes(next)) {
    return next;
  }
  return PALETTE_COLOR_INDICES[0];
}

function normalizeLoadedColorIndex(colorIndex, isLegacyModel = false) {
  const next = Number(colorIndex);
  if (isLegacyModel && next === 6) {
    return GREY_COLOR_INDEX;
  }
  return normalizeColorIndex(next);
}

function getNextColumnColor() {
  const nextIndex = state.columns.length % PALETTE_COLOR_INDICES.length;
  return PALETTE_COLOR_INDICES[nextIndex];
}

function getDefaultColorForCardType(type) {
  const normalized = normalizeCardType(type || DEFAULT_CARD_TYPE);
  const defaults = normalizeCardColorDefaults(state.cardColorDefaults);
  state.cardColorDefaults = defaults;
  if (defaults.mode === "cycle") {
    return getNextColumnColor();
  }
  const mapping = getEffectiveCardTypeColorMap();
  return normalizeColorIndex(mapping[normalized]);
}

function getNextActiveColor(current) {
  const index = ACTIVE_COLUMN_COLOR_INDICES.indexOf(current);
  if (index === -1) {
    return ACTIVE_COLUMN_COLOR_INDICES[0];
  }
  return ACTIVE_COLUMN_COLOR_INDICES[(index + 1) % ACTIVE_COLUMN_COLOR_INDICES.length];
}

function getObservationTimestampValue(obs) {
  let value = 0;
  if (obs.timestamp instanceof Date) {
    value = obs.timestamp.getTime();
  } else if (obs.timestamp) {
    value = new Date(obs.timestamp).getTime();
  }
  if (Number.isFinite(value)) {
    return value;
  }
  const timestampText = String(obs.timestampText || "").trim();
  const hasExplicitDate = /\d{1,2}\/\d{1,2}/.test(timestampText);
  if (hasExplicitDate) {
    const parsedFromText = parseShiftTimestamp(timestampText);
    if (parsedFromText) {
      return parsedFromText.getTime();
    }
  }
  if (typeof obs.createdAt === "number" && Number.isFinite(obs.createdAt)) {
    return obs.createdAt;
  }
  return 0;
}

function compareMapItemsByAge(a, b) {
  const aTimestamp = Number.isFinite(a?.sortTimestamp) ? a.sortTimestamp : 0;
  const bTimestamp = Number.isFinite(b?.sortTimestamp) ? b.sortTimestamp : 0;
  if (aTimestamp !== bTimestamp) {
    return aTimestamp - bTimestamp;
  }
  const aCreated = Number.isFinite(a?.sortCreatedAt) ? a.sortCreatedAt : 0;
  const bCreated = Number.isFinite(b?.sortCreatedAt) ? b.sortCreatedAt : 0;
  if (aCreated !== bCreated) {
    return aCreated - bCreated;
  }
  if (a.kind !== b.kind) {
    return a.kind === "card" ? 1 : -1;
  }
  return String(a?.sortId || a?.key || "").localeCompare(String(b?.sortId || b?.key || ""));
}

function formatLocationLabel(label) {
  return String(label || "")
    .replace(/,\s*USA$/i, "")
    .replace(/^near\s+/i, "")
    .trim();
}

function splitLocationLines(locationText) {
  const parts = String(locationText || "").split(/\s*[,，]\s*/).filter(Boolean);
  if (parts.length >= 3) {
    const addressLine = parts.slice(0, -2).join(", ");
    const cityLine = parts.slice(-2).join(", ");
    return normalizeLocationLines(addressLine, cityLine);
  }
  if (parts.length === 2) {
    return normalizeLocationLines(parts[0], parts[1]);
  }
  return normalizeLocationLines(parts[0] || "", "");
}

function isSpecificAddressText(value) {
  const text = String(value || "").toLowerCase();
  return (
    /\d/.test(text) ||
    /\b(st|street|ave|avenue|rd|road|blvd|boulevard|ln|lane|dr|drive|way|pl|place|ct|court|ter|terrace|pkwy|parkway|hwy|highway)\b/.test(
      text
    ) ||
    /\b(&|and)\b/.test(text)
  );
}

function normalizeLocationLines(addressLine, cityLine) {
  const address = String(addressLine || "").trim();
  let city = String(cityLine || "").trim();
  if (address && city && isSpecificAddressText(address)) {
    city = city.replace(/\s+\d{5}(?:-\d{4})?$/, "").trim();
  }
  return { addressLine: address, cityLine: city };
}

function normalizeStateAbbrev(region) {
  const value = String(region || "").trim();
  if (!value) {
    return "";
  }
  if (value.length === 2) {
    return value.toUpperCase();
  }
  const lookup = {
    alabama: "AL",
    alaska: "AK",
    arizona: "AZ",
    arkansas: "AR",
    california: "CA",
    colorado: "CO",
    connecticut: "CT",
    delaware: "DE",
    florida: "FL",
    georgia: "GA",
    hawaii: "HI",
    idaho: "ID",
    illinois: "IL",
    indiana: "IN",
    iowa: "IA",
    kansas: "KS",
    kentucky: "KY",
    louisiana: "LA",
    maine: "ME",
    maryland: "MD",
    massachusetts: "MA",
    michigan: "MI",
    minnesota: "MN",
    mississippi: "MS",
    missouri: "MO",
    montana: "MT",
    nebraska: "NE",
    nevada: "NV",
    "new hampshire": "NH",
    "new jersey": "NJ",
    "new mexico": "NM",
    "new york": "NY",
    "north carolina": "NC",
    "north dakota": "ND",
    ohio: "OH",
    oklahoma: "OK",
    oregon: "OR",
    pennsylvania: "PA",
    "rhode island": "RI",
    "south carolina": "SC",
    "south dakota": "SD",
    tennessee: "TN",
    texas: "TX",
    utah: "UT",
    vermont: "VT",
    virginia: "VA",
    washington: "WA",
    "west virginia": "WV",
    wisconsin: "WI",
    wyoming: "WY",
    "district of columbia": "DC",
  };
  const key = value.toLowerCase();
  return lookup[key] || value;
}

function ensureStateAbbrev(label, region) {
  const abbrev = normalizeStateAbbrev(region);
  if (!abbrev) {
    return String(label || "").trim();
  }
  const current = String(label || "").trim();
  if (!current) {
    return abbrev;
  }
  const upper = current.toUpperCase();
  if (upper.includes(`, ${abbrev}`) || upper.endsWith(` ${abbrev}`)) {
    return current;
  }
  return `${current}, ${abbrev}`;
}

function createLocationRow(location, targetKey, target) {
  const row = document.createElement("div");
  row.className = "location-row";
  row.title = "Go to location";
  const icon = document.createElement("span");
  icon.className = "icon";
  const iconSvg = document.createElement("i");
  iconSvg.setAttribute("data-lucide", "map-pin");
  icon.appendChild(iconSvg);
  const text = document.createElement("span");
  text.textContent = formatLocationLabel(location.displayLabel || location.label);
  row.appendChild(icon);
  row.appendChild(text);
  if (target) {
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "location-clear";
    clearButton.title = "Clear location pin";
    clearButton.setAttribute("aria-label", "Clear location pin");
    clearButton.textContent = "×";
    clearButton.addEventListener("click", (event) => {
      event.stopPropagation();
      openLocationClearModal(target);
    });
    row.appendChild(clearButton);
  }
  if (targetKey) {
    row.classList.add("is-link");
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
    row.addEventListener("click", () => {
      focusMapLocation(targetKey, target);
    });
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        focusMapLocation(targetKey, target);
      }
    });
  }
  return row;
}

function createPinButton({ disabled, title, active }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pin-button";
  button.classList.toggle("active", Boolean(active));
  if (title) {
    button.title = title;
  }
  button.disabled = Boolean(disabled) || !LOCATION_TAGGING_ENABLED;
  const icon = document.createElement("i");
  icon.setAttribute(
    "data-lucide",
    active ? "map-pin-check-inside" : "map-pin-plus-inside"
  );
  button.appendChild(icon);
  return button;
}

function getLatestObservationInColumn(column) {
  if (!column || !Array.isArray(column.observations) || !column.observations.length) {
    return null;
  }
  return column.observations.reduce((latest, obs) => {
    if (!latest) {
      return obs;
    }
    const latestTime = getObservationTimestampValue(latest);
    const obsTime = getObservationTimestampValue(obs);
    if (obsTime !== latestTime) {
      return obsTime > latestTime ? obs : latest;
    }
    const latestCreated = typeof latest.createdAt === "number" ? latest.createdAt : 0;
    const obsCreated = typeof obs.createdAt === "number" ? obs.createdAt : 0;
    if (obsCreated !== latestCreated) {
      return obsCreated > latestCreated ? obs : latest;
    }
    return String(obs.id).localeCompare(String(latest.id)) > 0 ? obs : latest;
  }, null);
}

function activateMapLabelTarget(item) {
  if (!item || !item.columnId) {
    return;
  }
  const column = state.columns.find((col) => String(col.id) === String(item.columnId));
  if (!column) {
    return;
  }
  let selectedObsId = null;
  if (column.minimized) {
    column.minimized = false;
    column.justExpanded = true;
  }
  if (item.kind === "card") {
    const latestObs = getLatestObservationInColumn(column);
    if (latestObs) {
      selectNote(column.id, latestObs.id);
      selectedObsId = latestObs.id;
    } else {
      selectColumn(column.id);
    }
  } else if (item.kind === "note" && item.obsId) {
    selectNote(column.id, item.obsId);
    selectedObsId = item.obsId;
  } else {
    selectColumn(column.id);
  }
  setViewMode("split", { preserveMapView: true });
  renderColumns();
  applySelectionUI();
  scrollSelectionIntoView();
  requestAnimationFrame(() => {
    applySelectionUI();
    scrollSelectionIntoView();
    if (!columnsEl || !selectedObsId) {
      return;
    }
    const selector = `[data-note-id="${escapeSelector(selectedObsId)}"]`;
    const noteEl = columnsEl.querySelector(selector);
    if (noteEl) {
      noteEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
  });
}

function resolveMapFocusTarget(targetKey, target) {
  if (!target || !target.kind) {
    return { key: targetKey || null, location: null };
  }
  if (target.kind === "note") {
    const column = state.columns.find((col) => String(col.id) === String(target.columnId));
    const obs = column?.observations?.find((item) => String(item.id) === String(target.obsId));
    return {
      key: `note:${target.columnId}:${target.obsId}`,
      location: obs?.location || null,
    };
  }
  if (target.kind === "card") {
    const column = state.columns.find((col) => String(col.id) === String(target.columnId));
    if (!column) {
      return { key: targetKey || null, location: null };
    }
    const latestObs = getLatestObservationInColumn(column);
    if (latestObs?.location) {
      return {
        key: `note:${column.id}:${latestObs.id}`,
        location: latestObs.location,
      };
    }
    return {
      key: `card:${column.id}`,
      location: column.location || null,
    };
  }
  return { key: targetKey || null, location: null };
}

function restoreStyleProperty(style, property, value, priority = "") {
  if (!style) {
    return;
  }
  if (value === "" || value == null) {
    style.removeProperty(property);
    return;
  }
  style.setProperty(property, value, priority || "");
}

function clearFocusedMapMarker() {
  if (!mapFocusedState) {
    return;
  }
  const {
    marker,
    pane,
    tooltipPane,
    tooltipEl,
    previousPaneZ,
    previousPanePriority,
    previousTooltipPaneZ,
    previousTooltipPanePriority,
    previousTooltipZ,
    previousTooltipPriority,
    previousOffset,
  } = mapFocusedState;
  if (marker?._focusPulseTimer) {
    window.clearTimeout(marker._focusPulseTimer);
    marker._focusPulseTimer = null;
  }
  const markerEl = marker?.getElement?.();
  const dotEl = markerEl?.querySelector(".map-pin-dot");
  markerEl?.classList.remove("is-focus-target", "is-focus-pulse");
  dotEl?.classList.remove("is-focus-target", "is-focus-pulse");
  tooltipEl?.classList.remove("is-focus-target", "is-focus-pulse", "is-expanded");
  restoreStyleProperty(pane?.style, "z-index", previousPaneZ, previousPanePriority);
  restoreStyleProperty(
    tooltipPane?.style,
    "z-index",
    previousTooltipPaneZ,
    previousTooltipPanePriority
  );
  restoreStyleProperty(tooltipEl?.style, "z-index", previousTooltipZ, previousTooltipPriority);
  if (marker && Number.isFinite(previousOffset)) {
    marker.setZIndexOffset(previousOffset);
  }
  mapFocusedMarker = null;
  mapFocusedState = null;
}

function setFocusedMapMarker(marker, attempt = 0) {
  const markerEl = marker?.getElement?.();
  if (!markerEl) {
    if (attempt < 6) {
      requestAnimationFrame(() => setFocusedMapMarker(marker, attempt + 1));
    }
    return;
  }
  if (mapFocusedMarker === marker && mapFocusedState) {
    return;
  }
  clearFocusedMapMarker();
  const dotEl = markerEl.querySelector(".map-pin-dot");
  const paneName = marker.options?.pane;
  const pane = paneName && mainMap ? mainMap.getPane(paneName) : null;
  const tooltipEl = marker.getTooltip?.()?.getElement?.() || null;
  const tooltipPane = tooltipEl?.closest(".leaflet-pane") || null;
  const previousPaneZ = pane ? pane.style.getPropertyValue("z-index") : "";
  const previousPanePriority = pane ? pane.style.getPropertyPriority("z-index") : "";
  const previousTooltipPaneZ = tooltipPane
    ? tooltipPane.style.getPropertyValue("z-index")
    : "";
  const previousTooltipPanePriority = tooltipPane
    ? tooltipPane.style.getPropertyPriority("z-index")
    : "";
  const previousTooltipZ = tooltipEl ? tooltipEl.style.getPropertyValue("z-index") : "";
  const previousTooltipPriority = tooltipEl
    ? tooltipEl.style.getPropertyPriority("z-index")
    : "";
  const previousOffset = Number.isFinite(marker.options?.zIndexOffset)
    ? marker.options.zIndexOffset
    : 0;

  markerEl.classList.add("is-focus-target");
  dotEl?.classList.add("is-focus-target");

  if (pane) {
    pane.style.setProperty("z-index", String(MAP_PIN_FOCUS_ZINDEX), "important");
  }
  if (tooltipPane) {
    tooltipPane.style.setProperty("z-index", String(MAP_PIN_FOCUS_ZINDEX), "important");
  }
  marker.setZIndexOffset(MAP_PIN_FOCUS_ZINDEX);
  if (typeof marker.bringToFront === "function") {
    marker.bringToFront();
  }
  if (tooltipEl) {
    tooltipEl.classList.add("is-focus-target");
    tooltipEl.classList.add("is-expanded");
    tooltipEl.style.setProperty("z-index", String(MAP_PIN_FOCUS_ZINDEX), "important");
  }

  mapFocusedMarker = marker;
  mapFocusedState = {
    marker,
    pane,
    tooltipPane,
    tooltipEl,
    previousPaneZ,
    previousPanePriority,
    previousTooltipPaneZ,
    previousTooltipPanePriority,
    previousTooltipZ,
    previousTooltipPriority,
    previousOffset,
  };
}

function pulseMapMarker(marker, attempt = 0) {
  const markerEl = marker?.getElement?.();
  if (!markerEl) {
    if (attempt < 6) {
      requestAnimationFrame(() => pulseMapMarker(marker, attempt + 1));
    }
    return;
  }
  const dotEl = markerEl.querySelector(".map-pin-dot");
  markerEl.classList.remove("is-focus-pulse");
  dotEl?.classList.remove("is-focus-pulse");
  void markerEl.offsetWidth;
  markerEl.classList.add("is-focus-pulse");
  dotEl?.classList.add("is-focus-pulse");
  if (dotEl?.animate) {
    const focusRgb = window
      .getComputedStyle(dotEl)
      .getPropertyValue("--focus-color-rgb")
      .trim() || "43, 143, 108";
    dotEl.animate(
      [
        { transform: "scale(1)", filter: `drop-shadow(0 0 0 rgba(${focusRgb},0))` },
        { transform: "scale(1.6)", filter: `drop-shadow(0 0 10px rgba(${focusRgb},0.95))` },
        { transform: "scale(1)", filter: `drop-shadow(0 0 0 rgba(${focusRgb},0))` },
      ],
      { duration: MAP_PIN_FOCUS_DURATION_MS, easing: "ease-out" }
    );
  }
  if (marker._focusPulseTimer) {
    window.clearTimeout(marker._focusPulseTimer);
  }
  marker._focusPulseTimer = window.setTimeout(() => {
    markerEl.classList.remove("is-focus-pulse");
    dotEl?.classList.remove("is-focus-pulse");
    marker._focusPulseTimer = null;
  }, MAP_PIN_FOCUS_DURATION_MS);
}

function keepMapTooltipInView(marker, attempt = 0) {
  if (!mainMap || state.viewMode === "notes" || !marker) {
    return;
  }
  const mapEl = mainMap.getContainer?.();
  const tooltipEl = marker.getTooltip?.()?.getElement?.();
  if (!mapEl || !tooltipEl) {
    if (attempt < MAP_TOOLTIP_PAN_MAX_ATTEMPTS) {
      requestAnimationFrame(() => keepMapTooltipInView(marker, attempt + 1));
    }
    return;
  }
  const mapRect = mapEl.getBoundingClientRect();
  const tooltipRect = tooltipEl.getBoundingClientRect();
  const extraEl = tooltipEl.querySelector(".map-tooltip-extra");
  const extraRect =
    extraEl && tooltipEl.classList.contains("is-expanded")
      ? extraEl.getBoundingClientRect()
      : null;
  const bounds = {
    left: Math.min(tooltipRect.left, extraRect?.left ?? tooltipRect.left),
    top: Math.min(tooltipRect.top, extraRect?.top ?? tooltipRect.top),
    right: Math.max(tooltipRect.right, extraRect?.right ?? tooltipRect.right),
    bottom: Math.max(tooltipRect.bottom, extraRect?.bottom ?? tooltipRect.bottom),
  };
  if (!mapRect.width || !mapRect.height || !(bounds.right - bounds.left) || !(bounds.bottom - bounds.top)) {
    if (attempt < MAP_TOOLTIP_PAN_MAX_ATTEMPTS) {
      requestAnimationFrame(() => keepMapTooltipInView(marker, attempt + 1));
    }
    return;
  }

  const leftLimit = mapRect.left + MAP_TOOLTIP_VIEW_PADDING;
  const rightLimit = mapRect.right - MAP_TOOLTIP_VIEW_PADDING;
  const topLimit = mapRect.top + MAP_TOOLTIP_VIEW_PADDING;
  const bottomLimit = mapRect.bottom - MAP_TOOLTIP_VIEW_PADDING;

  let panX = 0;
  let panY = 0;
  if (bounds.left < leftLimit) {
    panX = bounds.left - leftLimit;
  } else if (bounds.right > rightLimit) {
    panX = bounds.right - rightLimit;
  }
  if (bounds.top < topLimit) {
    panY = bounds.top - topLimit;
  } else if (bounds.bottom > bottomLimit) {
    panY = bounds.bottom - bottomLimit;
  }

  if (Math.abs(panX) <= 1 && Math.abs(panY) <= 1) {
    return;
  }

  const offset = [Math.round(panX), Math.round(panY)];
  if (attempt < MAP_TOOLTIP_PAN_MAX_ATTEMPTS) {
    mainMap.once("moveend", () => {
      requestAnimationFrame(() => keepMapTooltipInView(marker, attempt + 1));
    });
  }
  mainMap.panBy(offset, { animate: true, duration: 0.25, noMoveStart: true });
}

function focusMapLocation(targetKey, target = null) {
  setViewMode("split");
  requestAnimationFrame(() => {
    ensureMainMap();
    renderMapPins();
    const resolved = resolveMapFocusTarget(targetKey, target);
    focusResolvedMapTarget(resolved, targetKey);
  });
}

function goToLocationForSelection() {
  if (!state.selection) {
    showAppToast("Select a note or card with a location first.");
    return false;
  }
  if (state.selection.kind === "note") {
    const column = state.columns.find((col) => col.id === state.selection.columnId);
    const obs = column?.observations?.find((item) => item.id === state.selection.obsId);
    if (!obs?.location) {
      showAppToast("Selected note has no location.");
      return false;
    }
    focusMapLocation(`note:${state.selection.columnId}:${state.selection.obsId}`, {
      kind: "note",
      columnId: state.selection.columnId,
      obsId: state.selection.obsId,
    });
    return true;
  }
  if (state.selection.kind === "column") {
    const column = state.columns.find((col) => col.id === state.selection.columnId);
    if (!column?.location) {
      showAppToast("Selected card has no location.");
      return false;
    }
    focusMapLocation(`card:${state.selection.columnId}`, {
      kind: "card",
      columnId: state.selection.columnId,
    });
    return true;
  }
  showAppToast("Select a note or card with a location first.");
  return false;
}

function focusResolvedMapTarget(resolved, fallbackKey, attempt = 0) {
  if (!mainMap) {
    return;
  }
  const marker = resolved?.key ? mapMarkers.get(resolved.key) : null;
  if (!marker) {
    if (attempt < 3) {
      requestAnimationFrame(() => focusResolvedMapTarget(resolved, fallbackKey, attempt + 1));
      return;
    }
    if (resolved?.location) {
      mainMap.setView(
        [resolved.location.lat, resolved.location.lon],
        Math.max(mainMap.getZoom(), 14)
      );
    }
    if (isMapPinFiltered(resolved?.key || fallbackKey)) {
      showMapFilterNotice();
    }
    return;
  }
  hideMapFilterNotice();
  const point = marker.getLatLng();
  let didPulse = false;
  const runPulse = () => {
    if (didPulse) {
      return;
    }
    didPulse = true;
    setFocusedMapMarker(marker);
    pulseMapMarker(marker);
    keepMapTooltipInView(marker);
  };
  mainMap.once("moveend", runPulse);
  mainMap.setView(point, Math.max(mainMap.getZoom(), 14));
  window.setTimeout(runPulse, 160);
}

function handleDocumentPointerDownForMapFocus(event) {
  if (!mapFocusedMarker || !mapFocusedState) {
    return;
  }
  const target = event.target;
  const markerEl = mapFocusedMarker.getElement?.();
  const tooltipEl = mapFocusedMarker.getTooltip?.()?.getElement?.();
  if (
    (markerEl && target instanceof Node && markerEl.contains(target)) ||
    (tooltipEl && target instanceof Node && tooltipEl.contains(target))
  ) {
    return;
  }
  clearFocusedMapMarker();
}

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

function getSummaryTypes({ reportableOnly = false } = {}) {
  const typesWithNotes = new Set();
  const typesAll = new Set();
  state.columns.forEach((column) => {
    const type = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
    const hasNotes = column.observations.some(
      (obs) => obs.text.trim() && (!reportableOnly || obs.reportable)
    );
    if (!reportableOnly) {
      typesAll.add(type);
    } else if (hasNotes) {
      typesAll.add(type);
    }
    if (hasNotes) {
      typesWithNotes.add(type);
    }
  });
  return Array.from(typesWithNotes.size ? typesWithNotes : typesAll);
}

function getSummaryExcludeSet() {
  const values = Array.isArray(state.summaryDefaultExclude)
    ? state.summaryDefaultExclude
    : Array.from(DEFAULT_SUMMARY_EXCLUDE);
  return new Set(values.map(normalizeCardType));
}

function getDefaultSummaryInclude(types) {
  const excludeSet = getSummaryExcludeSet();
  return types.filter((type) => !excludeSet.has(type));
}

function syncSummaryInclude(types) {
  if (!Array.isArray(state.summaryInclude) || !Array.isArray(state.summaryKnownTypes)) {
    state.summaryInclude = getDefaultSummaryInclude(types);
    state.summaryKnownTypes = Array.from(new Set(types));
    return;
  }
  const includeSet = new Set(state.summaryInclude);
  const knownSet = new Set(state.summaryKnownTypes);
  const excludeSet = getSummaryExcludeSet();
  types.forEach((type) => {
    if (!knownSet.has(type)) {
      if (!excludeSet.has(type)) {
        includeSet.add(type);
      }
      knownSet.add(type);
    }
  });
  state.summaryInclude = Array.from(includeSet);
  state.summaryKnownTypes = Array.from(knownSet);
}

function syncSummaryDefaultExclude(types) {
  const excludeSet = getSummaryExcludeSet();
  const normalizedTypes = types.map(normalizeCardType);
  const includeSet = new Set(
    normalizedTypes.filter((type) => !excludeSet.has(type))
  );
  state.summaryInclude = Array.from(includeSet);
  state.summaryKnownTypes = Array.from(new Set(normalizedTypes));
}

function getSummaryCategoryLabel(type) {
  return getCardTypeMeta(normalizeCardType(type)).label;
}

function getSummaryCategoryHeading(type, includeEmoji, sanitizeNames) {
  if (isObserverType(type) && sanitizeNames === false) {
    return includeEmoji ? `${TYPE_EMOJI[OBSERVER_CARD_TYPE] || ""}`.trim() : "People";
  }
  const label = getSummaryCategoryLabel(type);
  let heading = label;
  if (label.toLowerCase().endsWith("s")) {
    heading = label;
  } else {
    heading = `${label}s`;
  }
  if (includeEmoji) {
    const normalized = normalizeCardType(type);
    return `${TYPE_EMOJI[normalized] || ""} ${heading}`.trim();
  }
  return heading;
}

function getObserverIndexMap() {
  const observerColumns = state.columns
    .filter(
      (column) => isObserverType(column.type || DEFAULT_CARD_TYPE)
    )
    .slice()
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const map = new Map();
  observerColumns.forEach((column, index) => {
    map.set(column.id, index + 1);
  });
  return map;
}

function getSummaryEntryLabel(column, includeEmoji, sanitizeNames, observerIndexMap) {
  const type = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
  if (isVehicleCardType(type)) {
    const base = includeEmoji
      ? `${TYPE_EMOJI[type] || ""} ${getSummaryCategoryLabel(type)}`.trim()
      : getSummaryCategoryLabel(type);
    const details = formatVehicleInfoForSummary(normalizeVehicleInfo(column?.vehicleProfile || {}));
    return details ? `${base} ${details}`.trim() : base;
  }
  const labelText = (column.label || "").trim();
  const baseLabel = isObserverType(type)
    ? "Observer"
    : getSummaryCategoryLabel(type);
  const base = includeEmoji ? `${TYPE_EMOJI[type] || ""} ${baseLabel}`.trim() : baseLabel;
  if (isObserverType(type) && !sanitizeNames) {
    if (labelText) {
      return includeEmoji ? `${TYPE_EMOJI[type] || ""} ${labelText}`.trim() : labelText;
    }
    return includeEmoji ? `${TYPE_EMOJI[type] || ""}`.trim() : "";
  }
  if (isObserverType(type) && sanitizeNames) {
    const observerIndex = observerIndexMap.get(column.id);
    if (observerIndex) {
      return `${base} ${observerIndex}`;
    }
  }
  if (labelText && !(sanitizeNames && isObserverType(type))) {
    return `${base} ${labelText}`;
  }
  return base;
}

function getSummaryCardHeading(column, includeEmoji, sanitizeNames, observerIndexMap) {
  const type = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
  if (isVehicleCardType(type)) {
    const base = includeEmoji
      ? `${TYPE_EMOJI[type] || ""} ${getSummaryCategoryLabel(type)}`.trim()
      : getSummaryCategoryLabel(type);
    const details = formatVehicleInfoForSummary(normalizeVehicleInfo(column?.vehicleProfile || {}));
    return details ? `${base} ${details}`.trim() : base;
  }
  const labelText = (column.label || "").trim();
  const baseLabel = isObserverType(type)
    ? "Observer"
    : getSummaryCategoryLabel(type);
  const base = includeEmoji ? `${TYPE_EMOJI[type] || ""} ${baseLabel}`.trim() : baseLabel;
  if (isObserverType(type) && !sanitizeNames) {
    if (labelText) {
      return includeEmoji ? `${TYPE_EMOJI[type] || ""} ${labelText}`.trim() : labelText;
    }
    return includeEmoji ? `${TYPE_EMOJI[type] || ""}`.trim() : "";
  }
  if (isObserverType(type) && sanitizeNames) {
    const observerIndex = observerIndexMap.get(column.id);
    if (observerIndex) {
      return `${base} ${observerIndex}`;
    }
  }
  if (labelText) {
    return `${base} ${labelText}`;
  }
  return base;
}

function getSummaryJumpTitle(entry) {
  if (!entry) {
    return "Jump to card";
  }
  const column = state.columns.find((item) => String(item.id) === String(entry.columnId));
  const type = column?.type || entry.cardType || DEFAULT_CARD_TYPE;
  const label = column?.label || entry.cardLabel || "";
  const cardLabel = isVehicleCardType(type)
    ? getVehicleCardDisplayName(column)
    : getCardDisplay(type, label);
  return `Jump to ${cardLabel}`;
}

function jumpToSummarySource(entry) {
  if (!entry || !entry.columnId) {
    return;
  }
  const column = state.columns.find((item) => String(item.id) === String(entry.columnId));
  if (!column) {
    return;
  }
  const obs = entry.obsId
    ? column.observations.find((item) => String(item.id) === String(entry.obsId))
    : null;
  if (column.minimized) {
    column.minimized = false;
    column.justExpanded = true;
  }
  handleTabSwitch("dispatch");
  setViewMode("notes", { preserveMapView: true });
  if (obs) {
    selectNote(column.id, obs.id);
  } else {
    selectColumn(column.id);
  }
  renderColumns();
  applySelectionUI();
  scrollSelectionIntoView();
  requestAnimationFrame(() => {
    applySelectionUI();
    scrollSelectionIntoView();
  });
}

function createSummaryLinkButton(entry) {
  const linkButton = document.createElement("button");
  linkButton.type = "button";
  linkButton.className = "summary-output-link";
  linkButton.title = getSummaryJumpTitle(entry);
  linkButton.setAttribute("aria-label", getSummaryJumpTitle(entry));
  linkButton.innerHTML = '<i data-lucide="link-2"></i>';
  linkButton.addEventListener("click", () => {
    jumpToSummarySource(entry);
  });
  return linkButton;
}

function countTextLines(text) {
  const value = String(text || "");
  return value ? value.split("\n").length : 1;
}

function syncSummaryLinkTrack(textarea, linkTrack) {
  if (!textarea || !linkTrack) {
    return;
  }
  linkTrack.style.transform = `translateY(${-textarea.scrollTop}px)`;
}

function renderSummaryLineLinks({ textarea, linkTrack, lineLinks, totalLines, lineOffset = 0 }) {
  if (!textarea || !linkTrack) {
    return;
  }
  const computed = window.getComputedStyle(textarea);
  const lineHeight = Number.parseFloat(computed.lineHeight) || 20;
  const paddingTop = Number.parseFloat(computed.paddingTop) || 0;
  const borderTop = Number.parseFloat(computed.borderTopWidth) || 0;
  linkTrack.innerHTML = "";
  linkTrack.style.paddingTop = `${paddingTop + borderTop}px`;
  for (let index = 0; index < totalLines; index += 1) {
    const slot = document.createElement("div");
    slot.className = "summary-link-slot";
    slot.style.height = `${lineHeight}px`;
    const entry = lineLinks.get(index - lineOffset);
    if (entry) {
      slot.appendChild(createSummaryLinkButton(entry));
    } else {
      const spacer = document.createElement("span");
      spacer.className = "summary-output-gutter";
      spacer.setAttribute("aria-hidden", "true");
      slot.appendChild(spacer);
    }
    linkTrack.appendChild(slot);
  }
  if (textarea._summaryLinkSyncHandler) {
    textarea.removeEventListener("scroll", textarea._summaryLinkSyncHandler);
  }
  const onScroll = () => {
    syncSummaryLinkTrack(textarea, linkTrack);
  };
  textarea._summaryLinkSyncHandler = onScroll;
  textarea.addEventListener("scroll", onScroll, { passive: true });
  syncSummaryLinkTrack(textarea, linkTrack);
}

function renderSummaryGroupOutputs(groups) {
  if (!summaryGroupOutput) {
    return;
  }
  summaryGroupOutput.innerHTML = "";
  groups.forEach((group) => {
    const block = document.createElement("div");
    block.className = "summary-group-block";
    const title = document.createElement("div");
    title.className = "summary-group-title";
    title.textContent = group.heading;
    const editWrap = document.createElement("div");
    editWrap.className = "summary-edit-wrap summary-group-edit-wrap";
    const linkGutter = document.createElement("div");
    linkGutter.className = "summary-link-gutter";
    linkGutter.setAttribute("aria-hidden", "true");
    const linkTrack = document.createElement("div");
    linkTrack.className = "summary-link-track";
    linkGutter.appendChild(linkTrack);
    const textarea = document.createElement("textarea");
    textarea.value = group.lines.join("\n");
    textarea.wrap = "soft";
    const lineCount = Math.max(3, group.lines.length + 1);
    textarea.rows = Math.min(24, lineCount);
    textarea.dataset.groupKey = group.key;
    editWrap.appendChild(linkGutter);
    editWrap.appendChild(textarea);
    renderSummaryLineLinks({
      textarea,
      linkTrack,
      lineLinks: group.lineLinks || new Map(),
      totalLines: countTextLines(textarea.value),
      lineOffset: 1,
    });
    const actions = document.createElement("div");
    actions.className = "summary-group-actions";
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "ghost";
    copyButton.innerHTML =
      '<span class="icon" aria-hidden="true"><i data-lucide="copy"></i></span>Copy';
    const status = document.createElement("span");
    status.className = "summary-group-status";
    if (summaryCopiedGroups.has(group.key)) {
      status.textContent = "Previously copied ✓";
    }
    copyButton.addEventListener("click", () => {
      const text = textarea.value;
      navigator.clipboard.writeText(text).catch(() => {
        window.alert("Unable to copy to clipboard.");
      });
      summaryCopiedGroups.add(group.key);
      status.textContent = "Previously copied ✓";
    });
    actions.appendChild(copyButton);
    actions.appendChild(status);
    block.appendChild(title);
    block.appendChild(editWrap);
    block.appendChild(actions);
    summaryGroupOutput.appendChild(block);
  });
}

function getSummaryLocationData(obs, column) {
  if (obs.location) {
    return obs.location;
  }
  if (column.location) {
    return column.location;
  }
  return null;
}

function formatLatLon(value) {
  const next = Number(value);
  if (!Number.isFinite(next)) {
    return "";
  }
  return next.toFixed(6);
}

function getSummaryLocationLabel(obs, column) {
  const location = getSummaryLocationData(obs, column);
  if (!location) {
    return "";
  }
  const includeAddress = state.summaryLocationIncludeAddress !== false;
  const includeLatLon = Boolean(state.summaryLocationIncludeLatLon);
  if (!includeAddress && !includeLatLon) {
    return "";
  }
  const parts = [];
  if (includeAddress) {
    const addressText = formatLocationLabel(location.displayLabel || location.label || "");
    if (addressText) {
      parts.push(addressText);
    }
  }
  if (includeLatLon) {
    const lat = formatLatLon(location.lat);
    const lon = formatLatLon(location.lon);
    if (lat && lon) {
      parts.push(`${lat}, ${lon}`);
    }
  }
  return parts.join(" | ");
}

function normalizeVehicleSummaryLine(rawLine) {
  const line = String(rawLine || "").trim().replace(/\s+/g, " ");
  if (!line) {
    return "";
  }
  const normalized = line.toLowerCase();
  if (!normalized.startsWith("plate ")) {
    return line;
  }
  const parsed = parseVehicleInfoFromText(line);
  return formatVehicleInfoForSummary(parsed);
}

function formatVehicleInfoForSummary(info) {
  const normalized = normalizeVehicleInfo(info || {});
  const parts = [];
  if (normalized.plateVisible && normalized.plate) {
    parts.push(normalized.plate.toUpperCase());
  }
  if (normalized.state) {
    parts.push(`(${normalized.state})`);
  }
  if (normalized.color) {
    parts.push(normalized.color);
  }
  if (normalized.make) {
    parts.push(normalized.make);
  }
  if (normalized.model) {
    parts.push(normalized.model);
  }
  if (normalized.body) {
    parts.push(normalized.body);
  }
  return parts.join(" ").trim();
}

function getVehicleSummaryLabelFromObservation(obs) {
  const structured = normalizeVehicleInfo(obs?.vehicleInfo || {});
  const fallback = parseVehicleInfoFromText(obs?.text || "");
  const normalized = hasVehicleInfo(structured) ? structured : fallback;
  if (normalized.plateVisible === false || !normalized.plate) {
    return "";
  }
  return normalized.state
    ? `${normalized.plate.toUpperCase()} (${normalized.state})`
    : normalized.plate.toUpperCase();
}

function getVehicleCardDisplayName(column) {
  const summary = formatVehicleInfoForSummary(normalizeVehicleInfo(column?.vehicleProfile || {}));
  return summary || getSummaryCategoryLabel(VEHICLE_CARD_TYPE);
}

function getObservationSummaryText(obs, type) {
  const normalizedType = normalizeCardType(type);
  const noteText = String(obs?.text || "").trim();
  if (!isVehicleListType(normalizedType)) {
    return noteText;
  }
  const parts = [];
  if (noteText) {
    parts.push(noteText);
  }
  const hasLegacyVehicleLine = noteText
    .split(/\r?\n/)
    .some((line) => String(line || "").trim().toLowerCase().startsWith("plate "));
  const vehicleLine = formatVehicleInfoForSummary(obs?.vehicleInfo || {});
  if (vehicleLine && !hasLegacyVehicleLine) {
    parts.push(vehicleLine);
  }
  return parts.join("\n").trim();
}

function getSummaryEntryText(entry) {
  const text = String(entry.text || "").trim();
  if (!text) {
    return "";
  }
  if (!isVehicleListType(entry.type)) {
    return text;
  }
  return text
    .split(/\r?\n/)
    .map((line) => normalizeVehicleSummaryLine(line))
    .filter(Boolean)
    .join("\n");
}

function renderSummaryFilters() {
  if (!summaryFilters) {
    return;
  }
  const types = getSummaryTypes({ reportableOnly: state.summaryReportableOnly });
  syncSummaryInclude(types);
  const includeSet = new Set(state.summaryInclude || []);
  summaryFilters.innerHTML = "";
  if (!types.length) {
    const empty = document.createElement("div");
    empty.className = "summary-empty";
    empty.textContent = "No categories yet.";
    summaryFilters.appendChild(empty);
    return;
  }
  const sorted = types.sort((a, b) =>
    getSummaryCategoryLabel(a).localeCompare(getSummaryCategoryLabel(b))
  );
  sorted.forEach((type) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "summary-pill";
    pill.dataset.type = type;
    const icon = createCardTypeIconNode(type);
    const label = document.createElement("span");
    label.textContent = getSummaryCategoryLabel(type);
    pill.appendChild(icon);
    pill.appendChild(label);
    if (!includeSet.has(type)) {
      pill.classList.add("inactive");
    }
    pill.addEventListener("click", () => {
      const next = new Set(state.summaryInclude || []);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      state.summaryInclude = Array.from(next);
      markDirty();
      persistState();
      renderSummaryFilters();
      updateSummary();
    });
    summaryFilters.appendChild(pill);
  });
  refreshIcons();
}

function updateSummary() {
  if (!summaryOutput) {
    return;
  }
  renderSummaryFilters();
  const entries = [];
  const allEntries = [];
  const includeSet = new Set(state.summaryInclude || []);
  const reportableOnly = Boolean(state.summaryReportableOnly);

  const includeLocation = state.summaryIncludeLocation !== false;
  const includeBullets = Boolean(state.summaryBulletsForNotes);
  const addSpaceBetweenNotes = Boolean(state.summarySpaceBetweenNotes);
  const includeEmojis = Boolean(state.summaryIncludeEmojis);
  const sanitizeNames = state.summarySanitizeNames !== false;
  const observerIndexMap = sanitizeNames ? getObserverIndexMap() : new Map();
  state.columns.forEach((column) => {
    const type = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
    const defaultLabel = getSummaryEntryLabel(
      column,
      includeEmojis,
      sanitizeNames,
      observerIndexMap
    );
    column.observations.forEach((obs) => {
      const summaryText = getObservationSummaryText(obs, type);
      if (!summaryText) {
        return;
      }
      const vehicleLabel = isVehicleListType(type)
          ? getVehicleSummaryLabelFromObservation(obs)
          : "";
      const label = vehicleLabel || defaultLabel;
      const vehicleInfoSummary = isVehicleCardType(type)
        ? formatVehicleInfoForSummary(normalizeVehicleInfo(column?.vehicleProfile || {}))
        : isVehicleListType(type)
          ? formatVehicleInfoForSummary(
              normalizeVehicleInfo(obs?.vehicleInfo || parseVehicleInfoFromText(obs?.text || ""))
            )
          : "";
      const entry = {
        timestamp: obs.timestamp,
        timestampText: formatSummaryTime(obs.timestamp),
        editedFrom: obs.editedFrom,
        text: summaryText,
        locationLabel: includeLocation ? getSummaryLocationLabel(obs, column) : "",
        type,
        columnId: column.id,
        obsId: obs.id,
        cardType: column.type || DEFAULT_CARD_TYPE,
        cardLabel: column.label || "",
        label,
        vehicleLabel,
        vehicleInfoSummary,
        isReportable: Boolean(obs.reportable),
      };
      allEntries.push(entry);
      if (!includeSet.has(type)) {
        return;
      }
      if (reportableOnly && !obs.reportable) {
        return;
      }
      entries.push(entry);
    });
  });

  const startTime = state.startTime
    ? state.startTime
    : entries.length
      ? new Date(Math.min(...entries.map((entry) => entry.timestamp.getTime())))
      : null;
  const endTime = state.endTime
    ? state.endTime
    : entries.length
      ? new Date(Math.max(...entries.map((entry) => entry.timestamp.getTime())))
      : null;
  const isOngoing = Boolean(state.startTime && !state.endTime);
  const startDateText = startTime ? formatSummaryDate(startTime) : "—";
  const endDateText = endTime ? formatSummaryDate(endTime) : "—";
  const startTimeText = startTime ? formatSummaryTime(startTime) : "—";
  const endTimeText = endTime ? formatSummaryTime(endTime) : "—";
  const sameDate =
    startTime && endTime && getSummaryDateKey(startTime) === getSummaryDateKey(endTime);
  const dateLine = sameDate ? startDateText : `${startDateText}–${endDateText}`;
  const timeLine = `${startTimeText}–${endTimeText}`;
  const areaText = state.area ? ` for ${state.area}` : "";
  const header = `DISPATCH NOTES${areaText}${isOngoing ? " (ongoing)" : ""}\n${dateLine}\n${timeLine}\n=================`;

  if (summaryWarning) {
    const warningLines = [];
    if (isOngoing) {
      warningLines.push("The Shift in the Collect Mode has not ended.");
    }
    const reportableFilteredOut = allEntries.some(
      (entry) => entry.isReportable && !includeSet.has(entry.type)
    );
    if (reportableFilteredOut) {
      warningLines.push("Some reportable notes are excluded by filters.");
    }
    if (warningLines.length && !summaryWarningDismissed) {
      if (summaryWarningText) {
        summaryWarningText.textContent = `! ${warningLines.join(" ")}`;
      }
      summaryWarning.classList.remove("hidden");
    } else {
      summaryWarning.classList.add("hidden");
    }
  }

  const headerLines = header.split("\n");
  const mainLineLinks = new Map();
  if (!entries.length) {
    summaryOutput.value = header;
    if (summaryGroupOutput) {
      summaryGroupOutput.classList.add("hidden");
    }
    if (summaryOutputWrap) {
      summaryOutputWrap.classList.remove("hidden");
    }
    summaryOutput.classList.remove("hidden");
    renderSummaryLineLinks({
      textarea: summaryOutput,
      linkTrack: summaryOutputLinkTrack,
      lineLinks: mainLineLinks,
      totalLines: headerLines.length,
    });
    refreshIcons();
    return;
  }

  const stripDuplicateVehicleInfoLine = (text, vehicleInfoSummary) => {
    const inline = String(vehicleInfoSummary || "").trim().toLowerCase();
    if (!inline) {
      return String(text || "").trim();
    }
    return String(text || "")
      .split(/\r?\n/)
      .map((line) => String(line || "").trim())
      .filter((line) => line && line.toLowerCase() !== inline)
      .join("\n");
  };
  const indentSummaryBody = (text) =>
    String(text || "")
      .split(/\r?\n/)
      .map((line) => (line ? `  ${line}` : line))
      .join("\n");

  const cleanLine = (entry, includeLabel = true, includeTimestampBullet = true) => {
    const isVehicle = isVehicleListType(entry.type);
    let cleanText = getSummaryEntryText(entry);
    if (isVehicle && entry.vehicleInfoSummary) {
      cleanText = stripDuplicateVehicleInfoLine(cleanText, entry.vehicleInfoSummary);
    }
    const indentedText = indentSummaryBody(cleanText);
    const locationSegment = entry.locationLabel ? `{ ${entry.locationLabel} }` : "";
    const locationLine = locationSegment ? `  ${locationSegment}` : "";
    const timestampPrefix = includeBullets && includeTimestampBullet ? "• " : "";
    if (isVehicle && entry.vehicleInfoSummary) {
      const lineHead = `${timestampPrefix}${entry.timestampText} Vehicle ${entry.vehicleInfoSummary}:`.trim();
      if (locationLine) {
        return `${lineHead}\n${locationLine}\n${indentedText}`.trim();
      }
      return `${lineHead}\n${indentedText}`.trim();
    }
    if (!entry.label || !includeLabel) {
      const lineHead = `${timestampPrefix}${entry.timestampText}`.trim();
      if (locationLine) {
        return `${lineHead}\n${locationLine}\n${indentedText}`.trim();
      }
      return `${lineHead}\n${indentedText}`.trim();
    }
    const lineHead = `${timestampPrefix}${entry.timestampText} ${entry.label}:`.trim();
    if (locationLine) {
      return `${lineHead}\n${locationLine}\n${indentedText}`.trim();
    }
    return `${lineHead}\n${indentedText}`.trim();
  };
  const cleanCardGroupLine = (entry) => {
    let cleanText = getSummaryEntryText(entry);
    const isVehicle = isVehicleListType(entry.type);
    if (isVehicle && entry.vehicleInfoSummary) {
      cleanText = stripDuplicateVehicleInfoLine(cleanText, entry.vehicleInfoSummary);
    }
    const indentedText = indentSummaryBody(cleanText);
    const locationSegment = entry.locationLabel ? `{ ${entry.locationLabel} }` : "";
    const locationLine = locationSegment ? `  ${locationSegment}` : "";
    const vehicleInfoSegment =
      isVehicle && entry.vehicleInfoSummary ? ` ${entry.vehicleInfoSummary}` : "";
    const lineHead = `${includeBullets ? "•" : "-"} ${entry.timestampText}${vehicleInfoSegment}`.trim();
    if (locationLine) {
      return `${lineHead}\n${locationLine}\n${indentedText}`.trim();
    }
    return `${lineHead}\n${indentedText}`.trim();
  };
  const cleanCategoryGroupLine = (entry) => {
    const isVehicle = isVehicleListType(entry.type);
    if (!isVehicle || !entry.vehicleInfoSummary) {
      return cleanLine(entry, true, false);
    }
    let cleanText = getSummaryEntryText(entry);
    cleanText = stripDuplicateVehicleInfoLine(cleanText, entry.vehicleInfoSummary);
    const indentedText = indentSummaryBody(cleanText);
    const locationSegment = entry.locationLabel ? `{ ${entry.locationLabel} }` : "";
    const locationLine = locationSegment ? `  ${locationSegment}` : "";
    const lineHead = `${entry.timestampText} ${entry.vehicleInfoSummary}`.trim();
    if (locationLine) {
      return `${lineHead}\n${locationLine}\n${indentedText}`.trim();
    }
    return `${lineHead}\n${indentedText}`.trim();
  };

  let lines = [];
  let groups = [];
  let mainLineCursor = headerLines.length;
  const timeSort = (a, b) =>
    state.summaryMostRecentFirst ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
  if (state.summarySort === "category") {
    const grouped = new Map();
    entries.forEach((entry) => {
      if (!grouped.has(entry.type)) {
        grouped.set(entry.type, []);
      }
      grouped.get(entry.type).push(entry);
    });
    const orderedTypes = Array.from(grouped.keys()).sort((a, b) =>
      getSummaryCategoryLabel(a).localeCompare(getSummaryCategoryLabel(b))
    );
    orderedTypes.forEach((type, index) => {
      const groupEntries = grouped.get(type).sort(timeSort);
      const heading = `${getSummaryCategoryHeading(type, includeEmojis, sanitizeNames).toUpperCase()}:`;
      const groupPrefix = includeBullets ? "•" : "-";
      const groupRows = groupEntries.map((entry) => ({
        text: `${groupPrefix} ${cleanCategoryGroupLine(entry)}`,
        entry,
      }));
      const groupLines = [heading];
      const groupLineLinks = new Map();
      let groupLineCursor = 0;
      lines.push(heading);
      mainLineCursor += 1;
      groupRows.forEach((row, rowIndex) => {
        lines.push(row.text);
        groupLines.push(row.text);
        mainLineLinks.set(mainLineCursor, row.entry);
        groupLineLinks.set(groupLineCursor, row.entry);
        mainLineCursor += countTextLines(row.text);
        groupLineCursor += countTextLines(row.text);
        if (addSpaceBetweenNotes && rowIndex < groupRows.length - 1) {
          lines.push("");
          groupLines.push("");
          mainLineCursor += 1;
          groupLineCursor += 1;
        }
      });
      groups.push({
        key: `category:${type}`,
        heading,
        lines: groupLines,
        lineLinks: groupLineLinks,
      });
      if (index < orderedTypes.length - 1) {
        lines.push("");
        mainLineCursor += 1;
      }
    });
  } else if (state.summarySort === "card") {
    const groupMap = new Map();
    entries.forEach((entry) => {
      if (!groupMap.has(entry.columnId)) {
        groupMap.set(entry.columnId, []);
      }
      groupMap.get(entry.columnId).push(entry);
    });
    const sortedColumns = state.columns
      .filter((column) => groupMap.has(column.id))
      .slice()
      .sort((a, b) => {
        const labelCompare = getSummaryCategoryLabel(
          a.type || DEFAULT_CARD_TYPE
        ).localeCompare(getSummaryCategoryLabel(b.type || DEFAULT_CARD_TYPE));
        if (labelCompare !== 0) {
          return labelCompare;
        }
        const aIndex = observerIndexMap.get(a.id) || 0;
        const bIndex = observerIndexMap.get(b.id) || 0;
        if (aIndex && bIndex && aIndex !== bIndex) {
          return aIndex - bIndex;
        }
        const aCreated = a.createdAt || 0;
        const bCreated = b.createdAt || 0;
        if (aCreated !== bCreated) {
          return aCreated - bCreated;
        }
        return String(a.label || "").localeCompare(String(b.label || ""));
      });
    sortedColumns.forEach((column, index) => {
      const groupEntries = groupMap.get(column.id).sort(timeSort);
      const headingLabel = getSummaryCardHeading(
        column,
        includeEmojis,
        sanitizeNames,
        observerIndexMap
      );
      const heading = `${headingLabel}:`;
      const groupRows = groupEntries.map((entry) => ({
        text: cleanCardGroupLine(entry),
        entry,
      }));
      const groupLines = [heading];
      const groupLineLinks = new Map();
      let groupLineCursor = 0;
      lines.push(heading);
      mainLineCursor += 1;
      groupRows.forEach((row, rowIndex) => {
        lines.push(row.text);
        groupLines.push(row.text);
        mainLineLinks.set(mainLineCursor, row.entry);
        groupLineLinks.set(groupLineCursor, row.entry);
        mainLineCursor += countTextLines(row.text);
        groupLineCursor += countTextLines(row.text);
        if (addSpaceBetweenNotes && rowIndex < groupRows.length - 1) {
          lines.push("");
          groupLines.push("");
          mainLineCursor += 1;
          groupLineCursor += 1;
        }
      });
      groups.push({
        key: `card:${column.id}`,
        heading,
        lines: groupLines,
        lineLinks: groupLineLinks,
      });
      if (index < sortedColumns.length - 1) {
        lines.push("");
        mainLineCursor += 1;
      }
    });
  } else {
    entries.sort(timeSort);
    entries.forEach((entry, index) => {
      const lineText = cleanLine(entry);
      lines.push(lineText);
      mainLineLinks.set(mainLineCursor, entry);
      mainLineCursor += countTextLines(lineText);
      if (addSpaceBetweenNotes && index < entries.length - 1) {
        lines.push("");
        mainLineCursor += 1;
      }
    });
  }

  summaryOutput.value = [header, ...lines].join("\n");
  const groupMode =
    state.summaryGroupFields !== false &&
    (state.summarySort === "category" || state.summarySort === "card");
  if (summaryGroupOutput) {
    summaryGroupOutput.classList.toggle("hidden", !groupMode);
  }
  if (summaryOutputWrap) {
    summaryOutputWrap.classList.toggle("hidden", groupMode);
  }
  summaryOutput.classList.toggle("hidden", groupMode);
  renderSummaryLineLinks({
    textarea: summaryOutput,
    linkTrack: summaryOutputLinkTrack,
    lineLinks: mainLineLinks,
    totalLines: countTextLines(summaryOutput.value),
  });
  if (groupMode) {
    renderSummaryGroupOutputs(groups);
  }
  refreshIcons();
}

function updateEndIfNeeded(date) {
  if (!state.endTime) {
    return;
  }
  if (date.getTime() > state.endTime.getTime()) {
    state.endTime = new Date(date.getTime());
    state.endAdjustedNote = "updated to match edited timestamp.";
    syncShiftUI();
  }
}

function updateStartIfNeeded(date) {
  if (!state.startTime) {
    return;
  }
  if (date.getTime() < state.startTime.getTime()) {
    state.startTime = new Date(date.getTime());
    syncShiftUI();
  }
}

function cycleDatalistOption(input, datalistEl, direction) {
  if (!datalistEl) {
    return;
  }
  const options = Array.from(datalistEl.options || []).map((opt) => opt.value);
  if (!options.length) {
    return;
  }
  const delta = direction === "prev" ? -1 : 1;
  let index = Number.parseInt(input.dataset.suggestIndex || "-1", 10);
  if (!Number.isFinite(index)) {
    index = -1;
  }
  let nextIndex = index + delta;
  if (nextIndex < 0) {
    nextIndex = options.length - 1;
  } else if (nextIndex >= options.length) {
    nextIndex = 0;
  }
  input.dataset.suggestIndex = String(nextIndex);
  input.value = options[nextIndex];
}

function addCommitOnEnter(input) {
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      input.blur();
    }
  });
}

function addLastFieldToPrimaryActionTabbing(
  lastField,
  primaryButton,
  { isEnabled = () => true } = {}
) {
  if (!lastField || !primaryButton) {
    return;
  }
  lastField.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || event.shiftKey) {
      return;
    }
    if (!isEnabled() || primaryButton.disabled) {
      return;
    }
    event.preventDefault();
    primaryButton.focus();
  });
  primaryButton.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || !event.shiftKey) {
      return;
    }
    if (!isEnabled()) {
      return;
    }
    event.preventDefault();
    lastField.focus();
  });
}

function createCustomSelect({
  options,
  value,
  ariaLabel,
  onChange,
  className,
  portal = false,
  matchButtonWidth = true,
}) {
  const wrap = document.createElement("div");
  wrap.className = ["select-wrap", className].filter(Boolean).join(" ");

  const button = document.createElement("button");
  button.type = "button";
  button.className = "select-button";
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-expanded", "false");
  if (ariaLabel) {
    button.setAttribute("aria-label", ariaLabel);
  }

  const menu = document.createElement("div");
  menu.className = "select-menu";
  if (portal) {
    menu.classList.add("select-menu-portal");
  }
  menu.setAttribute("role", "listbox");

  let selectedIndex = Math.max(
    0,
    options.findIndex((opt) => opt.value === value)
  );
  let activeIndex = selectedIndex;
  let isOpen = false;
  const optionEls = [];
  let closeListener = null;
  let keyListener = null;
  let suppressNextOpen = false;
  let usingPortal = false;

  function renderOptionLabel(target, option) {
    target.innerHTML = "";
    if (Array.isArray(option?.paletteColors) && option.paletteColors.length) {
      const preview = document.createElement("span");
      preview.className = "select-palette-preview";
      option.paletteColors.forEach((_, chipIndex) => {
        const chip = document.createElement("span");
        chip.className = `select-palette-chip palette-chip-${option?.value || "classic"}-${chipIndex}`;
        preview.appendChild(chip);
      });
      target.appendChild(preview);
    }
    if (option?.swatchClass) {
      const swatch = document.createElement("span");
      swatch.className = `select-color-swatch card-color-swatch ${option.swatchClass}`;
      target.appendChild(swatch);
    }
    if (option?.icon) {
      if (option.value === VEHICLE_LIST_CARD_TYPE) {
        const stack = createCardTypeIconNode(VEHICLE_LIST_CARD_TYPE);
        stack.classList.add("select-icon");
        target.appendChild(stack);
      } else {
        const icon = document.createElement("i");
        icon.setAttribute("data-lucide", option.icon);
        icon.className = "select-icon";
        target.appendChild(icon);
      }
    }
    const label = document.createElement("span");
    label.className = "select-label";
    label.textContent = option?.label || "";
    target.appendChild(label);
  }

  function syncButton() {
    renderOptionLabel(button, options[selectedIndex]);
    refreshIcons();
  }

  function syncOptions() {
    optionEls.forEach((el, index) => {
      el.classList.toggle("selected", index === selectedIndex);
      el.classList.toggle("active", index === activeIndex);
      el.setAttribute("aria-selected", String(index === selectedIndex));
    });
  }

  function setActive(index, shouldScroll = true) {
    if (!optionEls.length) {
      return;
    }
    activeIndex = index;
    syncOptions();
    if (shouldScroll) {
      optionEls[index].scrollIntoView({ block: "nearest" });
    }
  }

  function closeMenu() {
    if (!isOpen) {
      return;
    }
    isOpen = false;
    wrap.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
    if (usingPortal && menu.parentElement === document.body) {
      menu.remove();
      wrap.appendChild(menu);
      menu.style.position = "";
      menu.style.top = "";
      menu.style.left = "";
      menu.style.width = "";
      menu.style.minWidth = "";
      menu.style.display = "";
    }
    usingPortal = false;
    wrap.closest(".default-color-row")?.classList.remove("select-menu-open");
    if (closeListener) {
      document.removeEventListener("mousedown", closeListener);
      closeListener = null;
    }
    if (keyListener) {
      document.removeEventListener("keydown", keyListener, true);
      keyListener = null;
    }
    window.removeEventListener("scroll", handleReposition, true);
    window.removeEventListener("resize", handleReposition);
  }

  function handleReposition() {
    if (!isOpen || !usingPortal) {
      return;
    }
    const rect = button.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.top = `${rect.bottom + 6}px`;
    menu.style.left = `${rect.left}px`;
    if (matchButtonWidth) {
      menu.style.width = `${rect.width}px`;
    } else {
      menu.style.width = "max-content";
      menu.style.minWidth = `${rect.width}px`;
    }
  }

  function openMenu() {
    if (isOpen) {
      return;
    }
    isOpen = true;
    wrap.classList.add("open");
    button.setAttribute("aria-expanded", "true");
    setActive(selectedIndex);
    const shouldUsePortal = portal && !wrap.closest(".driver-active-element");
    usingPortal = shouldUsePortal;
    wrap.closest(".default-color-row")?.classList.add("select-menu-open");
    if (usingPortal) {
      if (menu.parentElement !== document.body) {
        menu.remove();
        document.body.appendChild(menu);
      }
      menu.style.display = "block";
      handleReposition();
      window.addEventListener("scroll", handleReposition, true);
      window.addEventListener("resize", handleReposition);
    }
    refreshIcons();
    closeListener = (event) => {
      if (!wrap.contains(event.target) && !menu.contains(event.target)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", closeListener);
    keyListener = (event) => {
      if (!isOpen) {
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        event.stopPropagation();
        const direction = event.shiftKey ? "prev" : "next";
        cycleActive(direction);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        selectIndex(activeIndex);
        closeMenu();
      }
    };
    document.addEventListener("keydown", keyListener, true);
  }

  function selectIndex(index) {
    selectedIndex = index;
    activeIndex = index;
    syncButton();
    syncOptions();
    if (onChange) {
      onChange(options[index].value, options[index]);
    }
  }

  function cycleActive(direction) {
    const delta = direction === "prev" ? -1 : 1;
    let nextIndex = activeIndex + delta;
    if (nextIndex < 0) {
      nextIndex = options.length - 1;
    } else if (nextIndex >= options.length) {
      nextIndex = 0;
    }
    setActive(nextIndex);
  }

  function suppressNextClickThrough() {
    const blockUntil = Date.now() + 450;
    suppressSelectClickThroughUntil = Math.max(suppressSelectClickThroughUntil, blockUntil);
    const blockClick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener("pointerup", blockClick, true);
    window.addEventListener("click", blockClick, true);
    window.setTimeout(() => {
      if (Date.now() < blockUntil) {
        return;
      }
      window.removeEventListener("pointerup", blockClick, true);
      window.removeEventListener("click", blockClick, true);
    }, 500);
  }

  function buildOption(option, index) {
    const optionEl = document.createElement("div");
    optionEl.className = "select-option";
    renderOptionLabel(optionEl, option);
    optionEl.setAttribute("role", "option");
    optionEl.setAttribute("aria-selected", String(index === selectedIndex));
    optionEl.addEventListener("mouseenter", () => {
      setActive(index, false);
    });
    const commitOptionSelection = (event) => {
      if (!isOpen) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (event.type === "pointerdown" || event.type === "mousedown") {
        suppressNextClickThrough();
      }
      selectIndex(index);
      closeMenu();
    };
    optionEl.addEventListener("pointerdown", commitOptionSelection);
    optionEl.addEventListener("mousedown", commitOptionSelection);
    optionEl.addEventListener("click", commitOptionSelection);
    return optionEl;
  }

  function renderOptions() {
    menu.innerHTML = "";
    optionEls.length = 0;
    options.forEach((option, index) => {
      const optionEl = buildOption(option, index);
      optionEls.push(optionEl);
      menu.appendChild(optionEl);
    });
    syncOptions();
    refreshIcons();
  }

  function setValue(nextValue, fallbackLabel) {
    let index = options.findIndex((opt) => opt.value === nextValue);
    if (index === -1) {
      const label =
        fallbackLabel || (nextValue ? `Custom (${nextValue})` : "Custom");
      options.push({ value: nextValue, label });
      index = options.length - 1;
      const optionEl = buildOption(options[index], index);
      optionEls.push(optionEl);
      menu.appendChild(optionEl);
    }
    selectedIndex = index;
    activeIndex = index;
    syncButton();
    syncOptions();
  }

  button.addEventListener("mousedown", (event) => {
    if (!isOpen) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    selectIndex(activeIndex);
    closeMenu();
    suppressNextOpen = true;
  });

  button.addEventListener("click", (event) => {
    if (Date.now() < suppressSelectClickThroughUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    event.stopPropagation();
    if (suppressNextOpen) {
      suppressNextOpen = false;
      return;
    }
    if (!isOpen) {
      openMenu();
    }
  });

  menu.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  button.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      if (!isOpen) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const direction = event.shiftKey ? "prev" : "next";
      cycleActive(direction);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
        return;
      }
      selectIndex(activeIndex);
      closeMenu();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
      }
      cycleActive("next");
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
      }
      cycleActive("prev");
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    }
  });

  renderOptions();
  syncButton();
  wrap.appendChild(button);
  wrap.appendChild(menu);

  return {
    element: wrap,
    setValue,
    close: closeMenu,
  };
}

function addTabCycleDatalist(
  input,
  datalistEl,
  { allowPrefixMatch = true, minPrefixChars = 1 } = {}
) {
  function commitClosestDatalistValue() {
    if (!datalistEl || !datalistEl.options || !datalistEl.options.length) {
      return;
    }
    const options = Array.from(datalistEl.options || []).map((opt) => String(opt.value || ""));
    const rawValue = String(input.value || "").trim();
    if (!rawValue) {
      return;
    }
    const lowerValue = rawValue.toLowerCase();
    let matchIndex = options.findIndex((value) => value.toLowerCase() === lowerValue);
    if (
      allowPrefixMatch &&
      matchIndex === -1 &&
      lowerValue.length >= Math.max(1, Number(minPrefixChars) || 1)
    ) {
      matchIndex = options.findIndex((value) => value.toLowerCase().startsWith(lowerValue));
    }
    if (matchIndex === -1) {
      return;
    }
    input.value = options[matchIndex];
    input.dataset.suggestIndex = String(matchIndex);
  }

  input.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      commitClosestDatalistValue();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (datalistEl && datalistEl.options && datalistEl.options.length && !input.value) {
        input.value = datalistEl.options[0].value;
      }
      commitClosestDatalistValue();
      input.blur();
    }
  });
}

function addUppercaseInputBehavior(input) {
  if (!input) {
    return;
  }
  input.addEventListener("input", () => {
    const current = String(input.value || "");
    const upper = current.toUpperCase();
    if (current === upper) {
      return;
    }
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = upper;
    if (typeof start === "number" && typeof end === "number") {
      input.setSelectionRange(start, end);
    }
  });
}

function handleTimestampEdit(obs, input, noteEl) {
  const parsed = parseShiftTimestamp(input.value);
  if (!parsed) {
    input.value = obs.timestampText;
    return;
  }
  const formatted = formatTimeOnly(parsed);
  if (formatted !== obs.timestampText) {
    if (!obs.editedFrom) {
      obs.editedFrom = obs.timestampText;
    }
    obs.timestamp = parsed;
    obs.timestampText = formatted;
    noteEl.textContent = `time modified from ${obs.editedFrom}`;
    markDirty();
    updateEndIfNeeded(parsed);
    updateStartIfNeeded(parsed);
    persistState();
    renderColumns();
    updateSummary();
  } else {
    input.value = formatted;
  }
}

function createVehicleInfoSection(obs, { hasStarted = true } = {}) {
  obs.vehicleInfo = normalizeVehicleInfo(obs.vehicleInfo || {});
  const section = document.createElement("div");
  section.className = "vehicle-note-section";

  const title = document.createElement("div");
  title.className = "vehicle-note-title";
  const titleMain = document.createElement("div");
  titleMain.className = "vehicle-note-title-main";
  const titleIcon = document.createElement("i");
  titleIcon.setAttribute("data-lucide", "car");
  titleIcon.setAttribute("aria-hidden", "true");
  const titleText = document.createElement("span");
  titleText.textContent = "Vehicle info";
  titleMain.appendChild(titleIcon);
  titleMain.appendChild(titleText);
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "vehicle-note-copy";
  copyButton.title = "Copy Vehicle Info";
  copyButton.setAttribute("aria-label", "Copy Vehicle Info");
  copyButton.innerHTML = '<i data-lucide="copy"></i>';
  ensureLucideIcon(copyButton);
  copyButton.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const info = normalizeVehicleInfo(obs?.vehicleInfo || parseVehicleInfoFromText(obs?.text || ""));
    const line = formatVehicleInfoForSummary(info);
    if (!line) {
      showAppToast("No vehicle info to copy.");
      return;
    }
    const copied = await copyTextToClipboard(line);
    showAppToast(copied ? "Vehicle info copied to clipboard" : "Clipboard blocked. Press Ctrl+C / Cmd+C.");
  });
  title.appendChild(titleMain);
  title.appendChild(copyButton);
  section.appendChild(title);

  const plateRow = document.createElement("div");
  plateRow.className = "vehicle-note-grid vehicle-note-grid-plate";

  const plateLabel = document.createElement("label");
  plateLabel.className = "vehicle-note-field vehicle-note-field-plate";
  const plateText = document.createElement("span");
  plateText.className = "vehicle-note-field-label";
  plateText.textContent = "Plate";
  const plateInput = document.createElement("input");
  plateInput.type = "text";
  plateInput.value = obs.vehicleInfo.plate || "";
  plateInput.disabled = !hasStarted;
  addUppercaseInputBehavior(plateInput);
  plateLabel.appendChild(plateText);
  plateLabel.appendChild(plateInput);

  const stateLabel = document.createElement("label");
  stateLabel.className = "vehicle-note-field";
  const stateText = document.createElement("span");
  stateText.className = "vehicle-note-field-label";
  stateText.textContent = "State";
  const stateInput = document.createElement("input");
  const stateListId = `vehicleState-${obs.id}`;
  stateInput.setAttribute("list", stateListId);
  stateInput.value = obs.vehicleInfo.state || "";
  stateInput.disabled = !hasStarted;
  const stateList = document.createElement("datalist");
  stateList.id = stateListId;
  STATES.forEach((stateName) => {
    const opt = document.createElement("option");
    opt.value = stateName;
    stateList.appendChild(opt);
  });
  stateLabel.appendChild(stateText);
  stateLabel.appendChild(stateInput);
  stateLabel.appendChild(stateList);

  plateRow.appendChild(plateLabel);
  plateRow.appendChild(stateLabel);
  section.appendChild(plateRow);

  const infoGrid = document.createElement("div");
  infoGrid.className = "vehicle-note-grid";

  const makeLabel = document.createElement("label");
  makeLabel.className = "vehicle-note-field vehicle-note-field-make";
  const makeText = document.createElement("span");
  makeText.className = "vehicle-note-field-label";
  makeText.textContent = "Make";
  const makeInput = document.createElement("input");
  const makeListId = `vehicleMake-${obs.id}`;
  makeInput.setAttribute("list", makeListId);
  makeInput.value = obs.vehicleInfo.make || "";
  makeInput.disabled = !hasStarted;
  const makeList = document.createElement("datalist");
  makeList.id = makeListId;
  VEHICLE_MAKES.forEach((makeName) => {
    const opt = document.createElement("option");
    opt.value = makeName;
    makeList.appendChild(opt);
  });
  makeLabel.appendChild(makeText);
  makeLabel.appendChild(makeInput);
  makeLabel.appendChild(makeList);

  const modelLabel = document.createElement("label");
  modelLabel.className = "vehicle-note-field vehicle-note-field-model";
  const modelText = document.createElement("span");
  modelText.className = "vehicle-note-field-label";
  modelText.textContent = "Model";
  const modelInput = document.createElement("input");
  const modelListId = `vehicleModel-${obs.id}`;
  modelInput.setAttribute("list", modelListId);
  modelInput.value = obs.vehicleInfo.model || "";
  modelInput.disabled = !hasStarted;
  const modelList = document.createElement("datalist");
  modelList.id = modelListId;
  modelLabel.appendChild(modelText);
  modelLabel.appendChild(modelInput);
  modelLabel.appendChild(modelList);

  const colorLabel = document.createElement("label");
  colorLabel.className = "vehicle-note-field vehicle-note-field-color";
  const colorText = document.createElement("span");
  colorText.className = "vehicle-note-field-label";
  colorText.textContent = "Color";
  const colorInput = document.createElement("input");
  const colorListId = `vehicleColor-${obs.id}`;
  colorInput.setAttribute("list", colorListId);
  colorInput.value = obs.vehicleInfo.color || "";
  colorInput.disabled = !hasStarted;
  const colorList = document.createElement("datalist");
  colorList.id = colorListId;
  VEHICLE_COLORS.forEach((colorName) => {
    const opt = document.createElement("option");
    opt.value = colorName;
    colorList.appendChild(opt);
  });
  colorLabel.appendChild(colorText);
  colorLabel.appendChild(colorInput);
  colorLabel.appendChild(colorList);

  const bodyLabel = document.createElement("label");
  bodyLabel.className = "vehicle-note-field vehicle-note-field-body";
  const bodyText = document.createElement("span");
  bodyText.className = "vehicle-note-field-label";
  bodyText.textContent = "Body style";
  const bodyInput = document.createElement("input");
  const bodyListId = `vehicleBody-${obs.id}`;
  bodyInput.setAttribute("list", bodyListId);
  bodyInput.value = obs.vehicleInfo.body || "";
  bodyInput.disabled = !hasStarted;
  const bodyList = document.createElement("datalist");
  bodyList.id = bodyListId;
  VEHICLE_BODY_OPTIONS.forEach((body) => {
    const opt = document.createElement("option");
    opt.value = body;
    bodyList.appendChild(opt);
  });
  bodyLabel.appendChild(bodyText);
  bodyLabel.appendChild(bodyInput);
  bodyLabel.appendChild(bodyList);

  infoGrid.appendChild(makeLabel);
  infoGrid.appendChild(modelLabel);
  infoGrid.appendChild(colorLabel);
  infoGrid.appendChild(bodyLabel);
  section.appendChild(infoGrid);

  function updateModelList() {
    const modelRaw = String(modelInput.value || "").trim();
    const bodyRaw = String(bodyInput.value || "").trim();
    const resolvedMake = resolveVehicleMake(makeInput.value);
    if (resolvedMake && makeInput.value !== resolvedMake) {
      makeInput.value = resolvedMake;
    }
    const models = getVehicleModelsForMake(resolvedMake);
    modelList.innerHTML = "";
    models.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.model;
      modelList.appendChild(opt);
    });
    const resolvedModel = resolveVehicleModel(modelRaw, resolvedMake);
    modelInput.value = resolvedModel || modelRaw;
    const matched = models.find((item) => item.model === resolvedModel) || null;
    const bodyOptions = matched?.body
      ? [matched.body]
      : Array.from(new Set(models.map((item) => item.body).filter(Boolean)));
    const scopedBodyOptions = bodyOptions.length ? bodyOptions : VEHICLE_BODY_OPTIONS;
    bodyList.innerHTML = "";
    scopedBodyOptions.forEach((bodyName) => {
      const opt = document.createElement("option");
      opt.value = bodyName;
      bodyList.appendChild(opt);
    });
    if (matched && matched.body) {
      bodyInput.value = matched.body;
    } else {
      bodyInput.value = resolveVehicleBody(bodyRaw) || bodyRaw;
    }
    return { resolvedMake, resolvedModel, matched };
  }

  function updateVehicleSectionValidationWarnings() {
    const makeRaw = String(makeInput.value || "").trim();
    const resolvedMake = resolveVehicleMake(makeRaw);
    const modelRaw = String(modelInput.value || "").trim();
    const resolvedModel = resolveVehicleModel(modelRaw, resolvedMake);
    const bodyRaw = String(bodyInput.value || "").trim();
    const resolvedBody = resolveVehicleBody(bodyRaw);
    setVehicleValidationWarning(
      makeInput,
      Boolean(makeRaw && !resolvedMake),
      "Not in known makes. Manual entry will be kept."
    );
    setVehicleValidationWarning(
      modelInput,
      Boolean(modelRaw && !resolvedModel),
      resolvedMake
        ? "Not in known models for selected make. Manual entry will be kept."
        : "Not in known models. Manual entry will be kept."
    );
    setVehicleValidationWarning(
      bodyInput,
      Boolean(bodyRaw && !resolvedBody),
      "Not in known body styles. Manual entry will be kept."
    );
  }

  function commitVehicleInfo() {
    const { resolvedMake, resolvedModel, matched } = updateModelList();
    const hasPlate = Boolean((plateInput.value || "").trim());
    const nextInfo = normalizeVehicleInfo({
      plateVisible: hasPlate,
      plate: plateInput.value,
      reason: "",
      state: stateInput.value,
      color: colorInput.value,
      make: makeInput.value,
      model: modelInput.value,
      body: matched?.body || bodyInput.value,
    });
    obs.vehicleInfo = nextInfo;
    plateInput.value = nextInfo.plate || "";
    stateInput.value = nextInfo.state || "";
    colorInput.value = nextInfo.color || "";
    makeInput.value = nextInfo.make || "";
    modelInput.value = nextInfo.model || "";
    bodyInput.value = nextInfo.body || "";
    updateVehicleSectionValidationWarnings();
    markDirty();
    persistState();
    updateSummary();
    renderMapPins();
  }

  [plateInput, stateInput, colorInput, makeInput, modelInput, bodyInput]
    .forEach((input) => {
      addCommitOnEnter(input);
    });
  addTabCycleDatalist(stateInput, stateList);
  addTabCycleDatalist(makeInput, makeList, { allowPrefixMatch: true, minPrefixChars: 2 });
  addTabCycleDatalist(colorInput, colorList);
  addTabCycleDatalist(modelInput, modelList, { allowPrefixMatch: true, minPrefixChars: 2 });
  addTabCycleDatalist(bodyInput, bodyList, { allowPrefixMatch: true, minPrefixChars: 2 });

  plateInput.addEventListener("blur", commitVehicleInfo);
  stateInput.addEventListener("blur", commitVehicleInfo);
  colorInput.addEventListener("blur", commitVehicleInfo);
  makeInput.addEventListener("input", () => {
    updateModelList();
    updateVehicleSectionValidationWarnings();
  });
  makeInput.addEventListener("blur", commitVehicleInfo);
  modelInput.addEventListener("input", () => {
    updateModelList();
    updateVehicleSectionValidationWarnings();
  });
  modelInput.addEventListener("blur", commitVehicleInfo);
  bodyInput.addEventListener("input", updateVehicleSectionValidationWarnings);
  bodyInput.addEventListener("blur", commitVehicleInfo);

  updateModelList();
  updateVehicleSectionValidationWarnings();
  return section;
}

function createVehicleCardHeaderSection(column, options = {}) {
  column.vehicleProfile = normalizeVehicleInfo(column.vehicleProfile || {});
  const wrap = document.createElement("div");
  wrap.className = "vehicle-card-header";

  const topRow = document.createElement("div");
  topRow.className = "vehicle-card-header-top";
  const middleRow = document.createElement("div");
  middleRow.className = "vehicle-card-header-middle";
  const bottomRow = document.createElement("div");
  bottomRow.className = "vehicle-card-header-bottom";
  const typeSelectElement = options?.typeSelect || null;
  if (typeSelectElement) {
    topRow.classList.add("has-type");
  }

  function buildField(labelText, className, listId = "") {
    const label = document.createElement("label");
    label.className = `vehicle-card-field ${className}`.trim();
    const text = document.createElement("span");
    text.className = "vehicle-card-field-label";
    text.textContent = labelText;
    const input = document.createElement("input");
    input.type = "text";
    if (listId) {
      input.setAttribute("list", listId);
    }
    label.appendChild(text);
    label.appendChild(input);
    return { label, input };
  }

  const stateListId = `vehicleCardState-${column.id}`;
  const makeListId = `vehicleCardMake-${column.id}`;
  const modelListId = `vehicleCardModel-${column.id}`;
  const colorListId = `vehicleCardColor-${column.id}`;
  const bodyListId = `vehicleCardBody-${column.id}`;

  const plateField = buildField("Plate", "plate");
  const stateField = buildField("State", "state", stateListId);
  const makeField = buildField("Make", "make", makeListId);
  const modelField = buildField("Model", "model", modelListId);
  const colorField = buildField("Color", "color", colorListId);
  const bodyField = buildField("Body Style", "body", bodyListId);

  const stateList = document.createElement("datalist");
  stateList.id = stateListId;
  STATES.forEach((stateName) => {
    const opt = document.createElement("option");
    opt.value = stateName;
    stateList.appendChild(opt);
  });
  stateField.label.appendChild(stateList);

  const makeList = document.createElement("datalist");
  makeList.id = makeListId;
  VEHICLE_MAKES.forEach((makeName) => {
    const opt = document.createElement("option");
    opt.value = makeName;
    makeList.appendChild(opt);
  });
  makeField.label.appendChild(makeList);

  const modelList = document.createElement("datalist");
  modelList.id = modelListId;
  modelField.label.appendChild(modelList);

  const colorList = document.createElement("datalist");
  colorList.id = colorListId;
  VEHICLE_COLORS.forEach((colorName) => {
    const opt = document.createElement("option");
    opt.value = colorName;
    colorList.appendChild(opt);
  });
  colorField.label.appendChild(colorList);

  const bodyList = document.createElement("datalist");
  bodyList.id = bodyListId;
  VEHICLE_BODY_OPTIONS.forEach((bodyName) => {
    const opt = document.createElement("option");
    opt.value = bodyName;
    bodyList.appendChild(opt);
  });
  bodyField.label.appendChild(bodyList);

  function updateModelList() {
    const resolvedMake = resolveVehicleMake(makeField.input.value);
    const models = getVehicleModelsForMake(resolvedMake);
    const seen = new Set();
    modelList.innerHTML = "";
    models.forEach((item) => {
      const model = String(item?.model || "").trim();
      if (!model || seen.has(model.toLowerCase())) {
        return;
      }
      seen.add(model.toLowerCase());
      const opt = document.createElement("option");
      opt.value = model;
      modelList.appendChild(opt);
    });
  }

  function commitVehicleProfile() {
    const resolvedMake = resolveVehicleMake(makeField.input.value);
    const resolvedModel = resolveVehicleModel(modelField.input.value, resolvedMake);
    const modelBody = getVehicleModelsForMake(resolvedMake).find(
      (item) => item.model === resolvedModel
    )?.body;
    const next = normalizeVehicleInfo({
      plateVisible: true,
      plate: plateField.input.value,
      reason: "",
      state: stateField.input.value,
      color: colorField.input.value,
      make: resolvedMake || makeField.input.value,
      model: resolvedModel || modelField.input.value,
      body: modelBody || bodyField.input.value,
    });
    column.vehicleProfile = next;
    plateField.input.value = next.plate || "";
    stateField.input.value = next.state || "";
    colorField.input.value = next.color || "";
    makeField.input.value = next.make || "";
    modelField.input.value = next.model || "";
    bodyField.input.value = next.body || "";
    updateModelList();
    markDirty();
    persistState();
    updateSummary();
    renderMapPins();
  }

  plateField.input.value = column.vehicleProfile.plate || "";
  addUppercaseInputBehavior(plateField.input);
  stateField.input.value = column.vehicleProfile.state || "";
  makeField.input.value = column.vehicleProfile.make || "";
  modelField.input.value = column.vehicleProfile.model || "";
  colorField.input.value = column.vehicleProfile.color || "";
  bodyField.input.value = column.vehicleProfile.body || "";
  updateModelList();

  [plateField.input, stateField.input, makeField.input, modelField.input, colorField.input, bodyField.input]
    .forEach((input) => addCommitOnEnter(input));
  addTabCycleDatalist(stateField.input, stateList);
  addTabCycleDatalist(makeField.input, makeList, { allowPrefixMatch: true, minPrefixChars: 2 });
  addTabCycleDatalist(modelField.input, modelList, { allowPrefixMatch: true, minPrefixChars: 2 });
  addTabCycleDatalist(colorField.input, colorList);
  addTabCycleDatalist(bodyField.input, bodyList, { allowPrefixMatch: true, minPrefixChars: 2 });

  makeField.input.addEventListener("input", updateModelList);
  modelField.input.addEventListener("input", updateModelList);
  [plateField.input, stateField.input, makeField.input, modelField.input, colorField.input, bodyField.input]
    .forEach((input) => input.addEventListener("blur", commitVehicleProfile));

  if (typeSelectElement) {
    topRow.appendChild(typeSelectElement);
  }
  topRow.appendChild(plateField.label);
  topRow.appendChild(stateField.label);
  middleRow.appendChild(makeField.label);
  middleRow.appendChild(modelField.label);
  bottomRow.appendChild(colorField.label);
  bottomRow.appendChild(bodyField.label);
  wrap.appendChild(topRow);
  wrap.appendChild(middleRow);
  wrap.appendChild(bottomRow);
  return wrap;
}

function renderColumns() {
  applyDynamicCardColorStyles();
  const scrollPositions = new Map();
  const notePositions = new Map();
  if (columnsEl) {
    columnsEl.querySelectorAll(".column").forEach((columnEl) => {
      const columnId = columnEl.dataset.columnId;
      const observationsEl = columnEl.querySelector(".observations");
      if (columnId && observationsEl) {
        scrollPositions.set(columnId, observationsEl.scrollTop);
      }
      columnEl.querySelectorAll(".observation[data-note-id]").forEach((obsEl) => {
        if (!obsEl.dataset.noteId || !columnId) {
          return;
        }
        notePositions.set(obsEl.dataset.noteId, {
          columnId,
          top: obsEl.offsetTop,
        });
      });
    });
  }

  columnsEl.innerHTML = "";
  const visibleColumns = state.columns.filter((column) => !column.minimized);
  const pendingScrollRestore = [];
  visibleColumns.forEach((column) => {
    sortColumnObservations(column);
    const columnEl = document.createElement("div");
    columnEl.className = "column";
    if (column.justExpanded) {
      columnEl.classList.add("expanding");
      column.justExpanded = false;
    }
    columnEl.dataset.color = String(normalizeColorIndex(column.color));
    columnEl.dataset.columnId = column.id;
    columnEl.addEventListener("click", (event) => {
      if (event.target.closest(".column-header") || event.target.closest(".observation")) {
        return;
      }
      selectColumn(column.id);
      applySelectionUI();
      scrollSelectionIntoView();
    });
    const hasStarted = Boolean(state.startTime);
    if (!hasStarted) {
      columnEl.classList.add("disabled");
    }

    const headerEl = document.createElement("div");
    headerEl.className = "column-header";

    const headerLeft = document.createElement("div");
    headerLeft.className = "header-left";

    let typeSelect = null;
    typeSelect = createCustomSelect({
      options: getSelectableCardTypes(column.type || DEFAULT_CARD_TYPE).map((type) => ({
        value: type.value,
        label: type.label,
        icon: type.icon,
      })),
      value: column.type || DEFAULT_CARD_TYPE,
      ariaLabel: "Card type",
      className: "type-dropdown",
      portal: true,
      matchButtonWidth: false,
      onChange: (nextType) => {
        const oldType = normalizeCardType(column.type || DEFAULT_CARD_TYPE);
        const resolvedNextType = normalizeCardType(nextType);
        if (
          oldType !== resolvedNextType &&
          !confirmCardTypeChange(column, resolvedNextType)
        ) {
          typeSelect?.setValue(oldType);
          return;
        }
        column.type = resolvedNextType;
        if (column.labelAuto) {
          column.label = getNextCustomLabelForType(resolvedNextType, column.id);
        }
        if (isVehicleCardType(resolvedNextType)) {
          column.vehicleProfile = normalizeVehicleInfo(column.vehicleProfile || {});
          column.observations.forEach((obs) => {
            obs.vehicleInfo = null;
          });
        } else {
          column.vehicleProfile = null;
          if (!isVehicleListType(resolvedNextType)) {
            column.observations.forEach((obs) => {
              obs.vehicleInfo = null;
            });
          }
        }
        if (
          (state.cardColorDefaults?.mode === "manual" ||
            state.cardColorDefaults?.mode === "all-grey" ||
            state.cardColorDefaults?.mode === "color-by-type") &&
          oldType !== resolvedNextType
        ) {
          column.color = getDefaultColorForCardType(resolvedNextType);
        }
        markDirty();
        persistState();
        renderColumns();
        updateSummary();
      },
    });

    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.className = "label-input";
    labelInput.placeholder = "Label";
    labelInput.value = column.label || "";
    addCommitOnEnter(labelInput);
    labelInput.addEventListener("input", (event) => {
      column.label = event.target.value;
      column.labelAuto = false;
      markDirty();
      persistState();
      updateSummary();
      renderMapPins();
    });

    const actionsWrap = document.createElement("div");
    actionsWrap.className = "card-actions-top";

    let cardPinButton = null;
    if (LOCATION_TAGGING_ENABLED) {
      cardPinButton = createPinButton({
        disabled: false,
        title: column.location
          ? "Location set for all notes.\nClick to change"
          : "Pin location for ALL NOTES on this card",
        active: Boolean(column.location),
      });
      cardPinButton.classList.add("card-pin");
      cardPinButton.addEventListener("click", (event) => {
        event.stopPropagation();
        openLocationModal({ kind: "card", columnId: column.id });
      });
    }

    const reportAllButton = document.createElement("button");
    reportAllButton.className = "card-action report-all";
    reportAllButton.type = "button";
    reportAllButton.textContent = "Report All";
    reportAllButton.setAttribute("aria-label", "Report all notes in card");
    reportAllButton.title = "Make all notes on this card\nreportable in summary";
    reportAllButton.setAttribute("aria-pressed", String(Boolean(column.reportAll)));
    reportAllButton.classList.toggle("active", Boolean(column.reportAll));
    reportAllButton.addEventListener("click", () => {
      column.reportAll = !column.reportAll;
      reportAllButton.classList.toggle("active", column.reportAll);
      reportAllButton.setAttribute("aria-pressed", String(column.reportAll));
      column.observations.forEach((obs) => {
        obs.reportable = column.reportAll;
      });
      const columnSelector = `[data-column-id="${escapeSelector(column.id)}"]`;
      const columnNode = columnsEl ? columnsEl.querySelector(columnSelector) : null;
      if (columnNode) {
        columnNode.querySelectorAll(".reportable-toggle").forEach((toggle) => {
          toggle.classList.toggle("active", column.reportAll);
          toggle.setAttribute("aria-pressed", String(column.reportAll));
          if (column.reportAll) {
            toggle.classList.add("animate");
            setTimeout(() => {
              toggle.classList.remove("animate");
            }, 300);
          }
        });
      }
      markDirty();
      persistState();
      updateSummary();
    });
    const reportAllCheck = document.createElement("span");
    reportAllCheck.className = "report-all-check";
    reportAllCheck.setAttribute("aria-hidden", "true");
    reportAllCheck.textContent = "✓";
    reportAllButton.appendChild(reportAllCheck);

    const colorWrap = document.createElement("div");
    colorWrap.className = "card-color-dropdown";

    const colorButton = document.createElement("button");
    colorButton.className = "card-action color-action";
    colorButton.type = "button";
    colorButton.setAttribute("aria-label", "Card color");
    colorButton.setAttribute("aria-haspopup", "menu");
    colorButton.setAttribute("aria-expanded", "false");
    colorButton.title = "Change color";
    const paletteIcon = document.createElement("i");
    paletteIcon.setAttribute("data-lucide", "droplet");
    colorButton.appendChild(paletteIcon);
    colorWrap.appendChild(colorButton);

    const colorMenu = document.createElement("div");
    colorMenu.className = "card-color-menu";
    colorMenu.setAttribute("role", "menu");
    const colorTitle = document.createElement("div");
    colorTitle.className = "card-color-title";
    colorTitle.textContent = "Color Override";
    colorMenu.appendChild(colorTitle);
    const colorSettingsLink = document.createElement("button");
    colorSettingsLink.type = "button";
    colorSettingsLink.className = "card-color-settings-link";
    colorSettingsLink.textContent = "Color Settings";
    colorSettingsLink.addEventListener("click", (event) => {
      event.stopPropagation();
      closeColorMenu();
      focusCardColorSettings();
    });
    const colorOptions = [];

    let colorMenuOpen = false;
    let colorMenuCloseListener = null;
    let colorMenuKeyListener = null;

    function closeColorMenu() {
      if (!colorMenuOpen) {
        return;
      }
      colorMenuOpen = false;
      colorWrap.classList.remove("open");
      colorButton.setAttribute("aria-expanded", "false");
      if (colorMenuCloseListener) {
        document.removeEventListener("mousedown", colorMenuCloseListener);
        colorMenuCloseListener = null;
      }
      if (colorMenuKeyListener) {
        document.removeEventListener("keydown", colorMenuKeyListener, true);
        colorMenuKeyListener = null;
      }
    }

    function openColorMenu() {
      if (colorMenuOpen) {
        return;
      }
      colorMenuOpen = true;
      colorWrap.classList.add("open");
      colorButton.setAttribute("aria-expanded", "true");
      colorOptions.forEach((optionEl) => {
        optionEl.classList.remove("active");
      });
      const selectedOption =
        colorOptions.find((optionEl) => optionEl.classList.contains("selected")) ||
        colorOptions[0];
      if (selectedOption) {
        selectedOption.classList.add("active");
        selectedOption.focus();
      }
      colorMenuCloseListener = (event) => {
        if (!colorWrap.contains(event.target)) {
          closeColorMenu();
        }
      };
      document.addEventListener("mousedown", colorMenuCloseListener);
      colorMenuKeyListener = (event) => {
        if (!colorMenuOpen) {
          return;
        }
        if (event.key === "Escape") {
          closeColorMenu();
          colorButton.focus();
          event.preventDefault();
          return;
        }
        if (event.key === "Tab") {
          event.preventDefault();
          const focusableElements = [...colorOptions, colorSettingsLink];
          const current = document.activeElement;
          let currentIndex = focusableElements.findIndex((optionEl) => optionEl === current);
          if (currentIndex === -1) {
            currentIndex = colorOptions.findIndex((optionEl) =>
              optionEl.classList.contains("active")
            );
          }
          if (currentIndex === -1) {
            currentIndex = 0;
          }
          const delta = event.shiftKey ? -1 : 1;
          let nextIndex = currentIndex + delta;
          if (nextIndex < 0) {
            nextIndex = focusableElements.length - 1;
          } else if (nextIndex >= focusableElements.length) {
            nextIndex = 0;
          }
          colorOptions.forEach((optionEl) => optionEl.classList.remove("active"));
          const nextOption = focusableElements[nextIndex];
          if (nextOption) {
            if (colorOptions.includes(nextOption)) {
              nextOption.classList.add("active");
            }
            nextOption.focus();
          }
        }
      };
      document.addEventListener("keydown", colorMenuKeyListener, true);
    }

    ACTIVE_COLUMN_COLOR_INDICES.forEach((colorIndex) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "card-color-option";
      option.setAttribute("role", "menuitem");
      option.tabIndex = 0;
      option.classList.toggle("selected", colorIndex === normalizeColorIndex(column.color));
      const swatch = document.createElement("span");
      swatch.className = `card-color-swatch color-${colorIndex}`;
      const label = document.createElement("span");
      label.className = "card-color-label";
      label.textContent = getColorNameByIndex(colorIndex);
      option.appendChild(swatch);
      option.appendChild(label);
      option.addEventListener("click", (event) => {
        event.stopPropagation();
        if (normalizeColorIndex(column.color) !== colorIndex) {
          column.color = colorIndex;
          markDirty();
          persistState();
          renderColumns();
          renderMapPins();
        }
        colorOptions.forEach((optionEl) => {
          optionEl.classList.remove("active");
        });
        option.classList.add("active");
        closeColorMenu();
      });
      colorMenu.appendChild(option);
      colorOptions.push(option);
    });
    colorMenu.appendChild(colorSettingsLink);

    colorButton.addEventListener("click", (event) => {
      event.stopPropagation();
      if (colorMenuOpen) {
        closeColorMenu();
      } else {
        openColorMenu();
      }
    });

    colorMenu.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    colorMenu.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeColorMenu();
        colorButton.focus();
        return;
      }
      if (event.key === "Enter") {
        const target = document.activeElement;
        if (target && colorMenu.contains(target)) {
          event.preventDefault();
          target.click();
        }
      }
    });

    colorWrap.appendChild(colorMenu);

    const actionsRight = document.createElement("div");
    actionsRight.className = "card-actions-right";

    const reorderHandle = document.createElement("div");
    reorderHandle.className = "reorder-handle";
    reorderHandle.setAttribute("aria-hidden", "true");
    reorderHandle.title = "Hold and drag to move card";
    reorderHandle.draggable = true;
    const gripIcon = document.createElement("i");
    gripIcon.setAttribute("data-lucide", "move");
    reorderHandle.appendChild(gripIcon);
    reorderHandle.addEventListener("dragstart", (event) => {
      dragState.activeId = column.id;
      dragState.targetId = null;
      dragState.position = null;
      columnEl.classList.add("dragging");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", column.id);
      }
    });
    reorderHandle.addEventListener("dragend", () => {
      columnEl.classList.remove("dragging");
      commitColumnReorder();
    });

    const minimizeButton = document.createElement("button");
    minimizeButton.className = "card-action";
    minimizeButton.type = "button";
    minimizeButton.textContent = "−";
    minimizeButton.setAttribute("aria-label", "Minimize card");
    minimizeButton.title = "Minimize card";
    minimizeButton.addEventListener("click", () => {
      columnEl.classList.add("minimizing");
      const finalize = () => {
        column.minimized = true;
        markDirty();
        renderColumns();
        persistState();
        updateSummary();
      };
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
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "card-action";
    deleteButton.type = "button";
    deleteButton.textContent = "✕";
    deleteButton.setAttribute("aria-label", "Delete card");
    deleteButton.title = "Delete card";
    deleteButton.addEventListener("click", () => {
      openColumnDeleteModal(column.id);
    });

    actionsRight.appendChild(minimizeButton);
    actionsRight.appendChild(deleteButton);
    if (cardPinButton) {
      actionsWrap.appendChild(cardPinButton);
    }
    actionsWrap.appendChild(reportAllButton);
    actionsWrap.appendChild(colorWrap);
    actionsWrap.appendChild(reorderHandle);
    actionsWrap.appendChild(actionsRight);

    if (isVehicleCardType(column.type || DEFAULT_CARD_TYPE)) {
      headerLeft.classList.add("vehicle-card-header-left");
      headerLeft.appendChild(
        createVehicleCardHeaderSection(column, { typeSelect: typeSelect.element })
      );
    } else {
      headerLeft.appendChild(typeSelect.element);
      headerLeft.appendChild(labelInput);
    }
    const cardHeaderRow = document.createElement("div");
    cardHeaderRow.className = "card-header-row";
    cardHeaderRow.appendChild(headerLeft);

    headerEl.appendChild(actionsWrap);
    headerEl.appendChild(cardHeaderRow);
    if (LOCATION_TAGGING_ENABLED && column.location) {
      headerEl.appendChild(
        createLocationRow(column.location, `card:${column.id}`, {
          kind: "card",
          columnId: column.id,
        })
      );
    }
    headerEl.draggable = false;
    headerEl.addEventListener("click", (event) => {
      if (event.target.closest("input, button, .select-wrap")) {
        return;
      }
      selectColumn(column.id);
      applySelectionUI();
      scrollSelectionIntoView();
    });
    if (!isVehicleCardType(column.type || DEFAULT_CARD_TYPE)) {
      labelInput.addEventListener("focus", () => {
        selectColumn(column.id);
        applySelectionUI();
        scrollSelectionIntoView();
      });
    }

    const observationsEl = document.createElement("div");
    observationsEl.className = "observations";
    observationsEl.addEventListener("dragover", (event) => {
      if (!noteDragState.noteId) {
        return;
      }
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
      if (noteDragState.fromColumnId === column.id) {
        return;
      }
      columnEl.classList.add("note-drop-target");
    });
    observationsEl.addEventListener("dragleave", (event) => {
      if (!noteDragState.noteId) {
        return;
      }
      if (!observationsEl.contains(event.relatedTarget)) {
        columnEl.classList.remove("note-drop-target");
      }
    });
    observationsEl.addEventListener("drop", (event) => {
      if (!noteDragState.noteId) {
        return;
      }
      event.preventDefault();
      const { noteId, fromColumnId } = noteDragState;
      noteDragState.noteId = null;
      noteDragState.fromColumnId = null;
      clearNoteDropTargets();
      moveObservationToColumn(fromColumnId, column.id, noteId);
    });
    if (scrollPositions.has(column.id)) {
      pendingScrollRestore.push({ columnId: column.id, target: observationsEl });
    }

    if (!hasStarted) {
      const helper = document.createElement("div");
      helper.className = "column-helper";
      helper.textContent = "Hit Start to begin taking notes.";
      observationsEl.appendChild(helper);
    }

    const observationsForRender =
      state.notesNewestFirst === false
        ? column.observations
        : column.observations.slice().reverse();
    observationsForRender.forEach((obs) => {
      const obsEl = document.createElement("div");
      obsEl.className = "observation";
      obsEl.dataset.noteId = obs.id;
      obsEl.draggable = true;
      obsEl.addEventListener("dragstart", (event) => {
        if (event.target.closest("input, textarea, button, .select-wrap")) {
          event.preventDefault();
          return;
        }
        const activeEl = document.activeElement;
        if (activeEl && obsEl.contains(activeEl) && activeEl.matches("input, textarea")) {
          event.preventDefault();
          return;
        }
        noteDragState.noteId = obs.id;
        noteDragState.fromColumnId = column.id;
        obsEl.classList.add("dragging-note");
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", obs.id);
        }
      });
      obsEl.addEventListener("dragend", () => {
        obsEl.classList.remove("dragging-note");
        noteDragState.noteId = null;
        noteDragState.fromColumnId = null;
        clearNoteDropTargets();
      });

      obs.timestampText = formatTimeOnly(obs.timestamp);

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-note";
      deleteButton.type = "button";
      deleteButton.textContent = "X";
      deleteButton.setAttribute("aria-label", "Delete note");
      deleteButton.title = "Delete note";
      deleteButton.addEventListener("click", () => {
        openDeleteModal(column.id, obs.id);
      });

      const reportableButton = document.createElement("button");
      reportableButton.className = "reportable-toggle";
      reportableButton.type = "button";
      reportableButton.setAttribute("aria-pressed", String(Boolean(obs.reportable)));
      reportableButton.setAttribute("aria-label", "Toggle report note");
      reportableButton.title = "Make this note reportable in summary";
      reportableButton.disabled = !hasStarted;
      reportableButton.classList.toggle("active", Boolean(obs.reportable));
      reportableButton.addEventListener("click", (event) => {
        event.stopPropagation();
        selectNote(column.id, obs.id);
        applySelectionUI();
        obs.reportable = !obs.reportable;
        reportableButton.classList.toggle("active", obs.reportable);
        reportableButton.setAttribute("aria-pressed", String(obs.reportable));
        if (obs.reportable) {
          reportableButton.classList.add("animate");
          setTimeout(() => {
            reportableButton.classList.remove("animate");
          }, 300);
        }
        markDirty();
        persistState();
        updateSummary();
      });
      const reportableLabel = document.createElement("span");
      reportableLabel.className = "reportable-label";
      reportableLabel.textContent = "Report";
      const reportableCheck = document.createElement("span");
      reportableCheck.className = "reportable-check";
      reportableCheck.setAttribute("aria-hidden", "true");
      reportableCheck.textContent = "✓";
      reportableButton.appendChild(reportableLabel);
      reportableButton.appendChild(reportableCheck);

      const timestampInput = document.createElement("input");
      timestampInput.className = "timestamp";
      timestampInput.type = "text";
      timestampInput.value = formatTimeOnly(obs.timestamp);
      timestampInput.disabled = !hasStarted;
      timestampInput.title = "Click to edit timestamp";
      addCommitOnEnter(timestampInput);
      timestampInput.addEventListener("focus", () => {
        obsEl.draggable = false;
      });
      timestampInput.addEventListener("blur", () => {
        obsEl.draggable = true;
      });

      const noteHeaderRow = document.createElement("div");
      noteHeaderRow.className = "note-header-row";
      const notePinDisabled = Boolean(column.location);
      noteHeaderRow.appendChild(timestampInput);
      if (LOCATION_TAGGING_ENABLED) {
        const notePinButton = createPinButton({
          disabled: notePinDisabled,
          title: notePinDisabled
            ? "\nLocation inherited from Card.\nClear it to assign different note locations."
            : obs.location
              ? "Change location"
              : "Pin to a location",
          active: Boolean(obs.location),
        });
        if (notePinDisabled) {
          notePinButton.classList.add("inherited");
        }
        notePinButton.addEventListener("click", (event) => {
          event.stopPropagation();
          if (notePinDisabled) {
            return;
          }
          openLocationModal({ kind: "note", columnId: column.id, obsId: obs.id });
        });
        noteHeaderRow.appendChild(notePinButton);
      }

      const editedNote = document.createElement("div");
      editedNote.className = "edited-note";
      editedNote.textContent = obs.editedFrom ? `edited from ${obs.editedFrom}` : "";

      const timestampRule = document.createElement("div");
      timestampRule.className = "timestamp-rule";

      const textArea = document.createElement("textarea");
      textArea.value = obs.text;
      textArea.disabled = !hasStarted;
      textArea.addEventListener("input", (event) => {
        obs.text = event.target.value;
        markDirty();
        persistState();
        updateSummary();
      });
      textArea.addEventListener("focus", () => {
        obsEl.draggable = false;
      });
      textArea.addEventListener("blur", () => {
        obsEl.draggable = true;
      });
      textArea.addEventListener("focus", () => {
        selectNote(column.id, obs.id);
        applySelectionUI();
      });
      textArea.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          textArea.blur();
          selectNote(column.id, obs.id);
          applySelectionUI();
        }
      });

      timestampInput.addEventListener("blur", () => {
        handleTimestampEdit(obs, timestampInput, editedNote);
      });

      obsEl.appendChild(reportableButton);
      obsEl.appendChild(deleteButton);
      obsEl.appendChild(noteHeaderRow);
      obsEl.appendChild(editedNote);
      obsEl.appendChild(timestampRule);
      if (LOCATION_TAGGING_ENABLED && obs.location) {
        obsEl.appendChild(
          createLocationRow(obs.location, `note:${column.id}:${obs.id}`, {
            kind: "note",
            columnId: column.id,
            obsId: obs.id,
          })
        );
      }
      if (isVehicleListType(column.type || DEFAULT_CARD_TYPE)) {
        obsEl.appendChild(createVehicleInfoSection(obs, { hasStarted }));
      }
      obsEl.appendChild(textArea);
      obsEl.addEventListener("click", (event) => {
        event.stopPropagation();
        selectNote(column.id, obs.id);
        applySelectionUI();
      });
      observationsEl.appendChild(obsEl);
    });

      const addButton = document.createElement("button");
      addButton.className = "add-observation";
      addButton.textContent = "+ Note";
      addButton.title = "Add note";
      addButton.disabled = !hasStarted;
      addButton.addEventListener("click", () => {
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
          focusLastNote(column.id, obs.id);
        });
      });

  columnEl.appendChild(headerEl);
  columnEl.appendChild(observationsEl);
  columnEl.appendChild(addButton);
  columnsEl.appendChild(columnEl);
  });

  if (addColumnWrap) {
    columnsEl.appendChild(addColumnWrap);
  }

  applySelectionUI();
  renderMinimizedCards();
  renderMapPins();
  refreshIcons();
  animateNoteReorder(notePositions);
  if (pendingScrollRestore.length) {
    requestAnimationFrame(() => {
      pendingScrollRestore.forEach(({ columnId, target }) => {
        if (!target) {
          return;
        }
        const desired = scrollPositions.get(columnId);
        if (typeof desired === "number") {
          target.scrollTop = desired;
        }
      });
    });
  }
}

function renderMinimizedCards() {
  if (!minimizedSection || !minimizedCards) {
    return;
  }
  minimizedCards.innerHTML = "";
  const minimized = state.columns.filter((column) => column.minimized);
  const nextIds = new Set(minimized.map((column) => String(column.id)));
  minimizedSection.classList.toggle("hidden", minimized.length === 0);
  if (!minimized.length) {
    state.minimizedExpanded = false;
    minimizedPillIds = new Set();
    return;
  }

  minimized.forEach((column) => {
    const columnId = String(column.id);
    const isNew = !minimizedPillIds.has(columnId);
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "minimized-pill";
    pill.dataset.color = String(normalizeColorIndex(column.color));
    pill.dataset.columnId = columnId;
    const icon = createCardTypeIconNode(column.type || DEFAULT_CARD_TYPE);
    const label = document.createElement("span");
    label.textContent = getMinimizedPillLabel(column);
    pill.appendChild(icon);
    pill.appendChild(label);
    pill.addEventListener("click", () => {
      column.minimized = false;
      column.justExpanded = true;
      selectColumn(column.id);
      markDirty();
      renderColumns();
      applySelectionUI();
      requestAnimationFrame(() => {
        scrollSelectionIntoView();
      });
      persistState();
      updateSummary();
    });
    minimizedCards.appendChild(pill);
    if (isNew) {
      requestAnimationFrame(() => {
        pill.classList.add("reveal");
      });
    } else {
      pill.classList.add("ready");
    }
  });

  minimizedPillIds = nextIds;
  requestAnimationFrame(() => {
    applyMinimizedLayout();
  });
}

function applyMinimizedLayout() {
  if (!minimizedCards || !minimizedSection) {
    return;
  }
  const existingMore = minimizedCards.querySelector(".more-pill");
  if (existingMore) {
    existingMore.remove();
  }
  const pills = Array.from(minimizedCards.querySelectorAll(".minimized-pill"));
  if (!pills.length) {
    return;
  }

  pills.forEach((pill) => {
    pill.hidden = false;
  });

  const rowTops = new Set(pills.map((pill) => pill.offsetTop));
  const hasOverflow = rowTops.size > 1;

  if (minimizedToggle) {
    minimizedToggle.classList.toggle("hidden", !state.minimizedExpanded || !hasOverflow);
    minimizedToggle.textContent = "Collapse";
  }

  if (!hasOverflow) {
    state.minimizedExpanded = false;
  }

  if (state.minimizedExpanded || !hasOverflow) {
    pills.forEach((pill) => {
      pill.hidden = false;
    });
    return;
  }

  const firstRowTop = pills[0].offsetTop;
  const firstRow = pills.filter((pill) => pill.offsetTop === firstRowTop);
  const keepCount = Math.max(0, firstRow.length - 1);
  const hiddenCount = pills.length - keepCount;

  pills.forEach((pill, index) => {
    pill.hidden = index >= keepCount;
  });

  const morePill = document.createElement("button");
  morePill.type = "button";
  morePill.className = "minimized-pill more-pill";
  morePill.textContent = `+${hiddenCount} more`;
  morePill.addEventListener("click", () => {
    state.minimizedExpanded = true;
    renderColumns();
  });
  minimizedCards.appendChild(morePill);
  requestAnimationFrame(() => {
    morePill.classList.add("reveal");
  });
}

function handleTabSwitch(tabName) {
  workspace.classList.remove("hidden");
  welcome.classList.add("hidden");
  const nextTab = tabName === "parse" ? "summary" : tabName;

  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === nextTab);
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === nextTab);
  });

  if (nextTab === "dispatch") {
    state.dispatchVisited = true;
    if (MAP_FEATURE_ENABLED && state.viewMode !== "notes") {
      ensureMainMap();
      refreshMainMapAfterReveal({ renderPins: true });
    }
  }

  saveViewState({ tab: nextTab });
}

function cycleWorkspaceTab() {
  const orderedTabs = Array.from(tabs)
    .map((tab) => tab.dataset.tab)
    .filter(Boolean);
  if (!orderedTabs.length) {
    return;
  }
  const activeTabButton = Array.from(tabs).find((tab) => tab.classList.contains("active"));
  const activeTab = activeTabButton?.dataset.tab;
  const activeIndex = orderedTabs.indexOf(activeTab);
  const nextIndex = activeIndex >= 0 ? (activeIndex + 1) % orderedTabs.length : 0;
  handleTabSwitch(orderedTabs[nextIndex]);
}

function getExportStamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showWelcome() {
  welcome.classList.remove("hidden");
  workspace.classList.add("hidden");
  saveViewState({ tab: "welcome" });
}

function saveViewState({ tab }) {
  try {
    localStorage.setItem(VIEW_STATE_KEY, JSON.stringify({ tab }));
  } catch (error) {
    return;
  }
}

function loadViewState() {
  const raw = localStorage.getItem(VIEW_STATE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function loadCompletedTours() {
  try {
    const raw = localStorage.getItem(COMPLETED_TOURS_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveCompletedTours(completed) {
  try {
    localStorage.setItem(COMPLETED_TOURS_KEY, JSON.stringify(completed || {}));
  } catch (error) {
    return;
  }
}

function isTourCompleted(filePath) {
  const completed = loadCompletedTours();
  return Boolean(completed[filePath]);
}

function markTourCompleted(filePath) {
  if (!filePath) {
    return;
  }
  const completed = loadCompletedTours();
  completed[filePath] = new Date().toISOString();
  saveCompletedTours(completed);
}

function loadTourProgressMap() {
  try {
    const raw = localStorage.getItem(TOUR_PROGRESS_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveTourProgressMap(progressMap) {
  try {
    localStorage.setItem(TOUR_PROGRESS_KEY, JSON.stringify(progressMap || {}));
  } catch (error) {
    return;
  }
}

function getTourProgress(filePath) {
  if (!filePath) {
    return null;
  }
  const progressMap = loadTourProgressMap();
  const entry = progressMap[filePath];
  if (!entry || typeof entry !== "object") {
    return null;
  }
  const stepIndex = Number(entry.stepIndex);
  const stepCount = Number(entry.stepCount);
  if (!Number.isFinite(stepIndex) || !Number.isFinite(stepCount) || stepIndex < 0 || stepCount <= 0) {
    return null;
  }
  return {
    stepIndex: Math.floor(stepIndex),
    stepCount: Math.floor(stepCount),
    updatedAt: entry.updatedAt || null,
  };
}

function saveTourProgress(filePath, { stepIndex, stepCount }) {
  if (!filePath) {
    return;
  }
  const normalizedIndex = Number(stepIndex);
  const normalizedCount = Number(stepCount);
  if (
    !Number.isFinite(normalizedIndex) ||
    !Number.isFinite(normalizedCount) ||
    normalizedIndex < 0 ||
    normalizedCount <= 0
  ) {
    return;
  }
  const progressMap = loadTourProgressMap();
  progressMap[filePath] = {
    stepIndex: Math.floor(normalizedIndex),
    stepCount: Math.floor(normalizedCount),
    updatedAt: new Date().toISOString(),
  };
  saveTourProgressMap(progressMap);
}

function clearTourProgress(filePath) {
  if (!filePath) {
    return;
  }
  const progressMap = loadTourProgressMap();
  if (!progressMap[filePath]) {
    return;
  }
  delete progressMap[filePath];
  saveTourProgressMap(progressMap);
}

function getMostRecentTourProgressEntry() {
  const progressMap = loadTourProgressMap();
  const entries = Object.entries(progressMap)
    .map(([filePath, value]) => {
      const parsed = getTourProgress(filePath);
      if (!parsed) {
        return null;
      }
      const updatedAtMs = parsed.updatedAt ? Date.parse(parsed.updatedAt) : 0;
      return {
        filePath,
        stepIndex: parsed.stepIndex,
        stepCount: parsed.stepCount,
        updatedAtMs: Number.isFinite(updatedAtMs) ? updatedAtMs : 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  return entries[0] || null;
}

function applyImportPayload(payload, { confirmOverwrite = true } = {}) {
  const normalized = (payload || "").trim();
  if (!normalized) {
    window.alert("Select a JSON backup to import.");
    return false;
  }
  try {
    JSON.parse(normalized);
  } catch (error) {
    window.alert("Unable to read that JSON backup. Please select a valid session.");
    return false;
  }
  if (confirmOverwrite) {
    const confirmMessage =
      "Warning: This will overwrite the current session in local storage.\n\n" +
      "Make sure you save a backup with Export -> Save Session Backup if it is important to recover the current session data.";
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) {
      return false;
    }
  }
  state.saveEnabled = true;
  if (saveToggle) {
    saveToggle.checked = true;
  }
  localStorage.setItem(STORAGE_KEY, normalized);
  loadState(normalized);
  clearSelection();
  state.isDirty = hasDispatchData();
  state.dispatchVisited = hasDispatchData();
  syncShiftUI();
  renderColumns();
  renderDefaultCardTypeSelect();
  renderDefaultCardColorSettings();
  updateSummary();
  applyViewMode();
  updateCityUI();
  syncMapFilterControls();
  return true;
}

function sanitizeTourPath(pathValue, expectedExtension) {
  if (typeof pathValue !== "string") {
    return null;
  }
  const trimmed = pathValue.trim();
  if (!trimmed || trimmed.includes("..") || trimmed.startsWith("/") || trimmed.includes("://")) {
    return null;
  }
  const allowed = Array.isArray(expectedExtension) ? expectedExtension : [expectedExtension];
  const lower = trimmed.toLowerCase();
  const hasAllowedExt = allowed.some((ext) => lower.endsWith(ext));
  if (!hasAllowedExt) {
    return null;
  }
  return trimmed;
}

function normalizeTourFilename(value) {
  const clean = sanitizeTourPath(value, [".yaml", ".yml"]);
  if (!clean) {
    return null;
  }
  return clean.startsWith("tours/") ? clean : `tours/${clean}`;
}

function formatTourLabel(filePath) {
  const fileName = filePath.split("/").pop() || filePath;
  const noExt = fileName.replace(/\.ya?ml$/i, "");
  return stripTourOrderPrefix(noExt).replace(/[-_]+/g, " ").trim();
}

function toTitleCase(text) {
  return String(text || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function stripTourOrderPrefix(name) {
  return String(name || "").replace(/^\d+[_-]+/, "");
}

function getTourOrder(filePath) {
  const fileName = (filePath.split("/").pop() || "").replace(/\.ya?ml$/i, "");
  const match = fileName.match(/^(\d+)[_-]+/);
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }
  const order = Number(match[1]);
  return Number.isFinite(order) ? order : Number.MAX_SAFE_INTEGER;
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getTourClassSelector(rawClassName) {
  const className = String(rawClassName || "").trim();
  if (!className) {
    return null;
  }
  const firstClass = className.split(/\s+/)[0];
  const safeClass = firstClass.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeClass) {
    return null;
  }
  return `.${safeClass}`;
}

function closeTutorialPickerModal() {
  if (!tutorialPickerModal) {
    return;
  }
  blurFocusedElementWithin(tutorialPickerModal);
  tutorialPickerModal.classList.add("hidden");
  tutorialPickerModal.setAttribute("aria-hidden", "true");
}

function openTutorialPickerModal() {
  if (!tutorialPickerModal) {
    return;
  }
  tutorialPickerModal.classList.remove("hidden");
  tutorialPickerModal.setAttribute("aria-hidden", "false");
  tutorialPickerClose?.focus();
}

function closeTutorialWelcomeModal() {
  if (!tutorialWelcomeModal) {
    return;
  }
  blurFocusedElementWithin(tutorialWelcomeModal);
  tutorialWelcomeModal.classList.add("hidden");
  tutorialWelcomeModal.setAttribute("aria-hidden", "true");
}

function closeTutorialCompleteModal() {
  if (!tutorialCompleteModal) {
    return;
  }
  blurFocusedElementWithin(tutorialCompleteModal);
  tutorialCompleteModal.classList.add("hidden");
  tutorialCompleteModal.setAttribute("aria-hidden", "true");
}

function ensureTourTargetVisible(selector) {
  if (!selector) {
    return null;
  }
  const target = document.querySelector(selector);
  if (!target) {
    return null;
  }
  const panel = target.closest(".tab-panel");
  if (panel && !panel.classList.contains("active")) {
    handleTabSwitch(panel.id);
  } else if (!target.closest("#welcome") && workspace?.classList.contains("hidden")) {
    handleTabSwitch("dispatch");
  } else if (target.closest("#welcome") && welcome?.classList.contains("hidden")) {
    showWelcome();
  }
  return target;
}

function validateTourDefinition(rawTour, filePath) {
  if (!rawTour || typeof rawTour !== "object") {
    throw new Error(`Invalid tour in ${filePath}: root must be an object.`);
  }
  const welcomeText = String(rawTour.welcome || "").trim();
  const completionText = String(rawTour.completion || "").trim();
  if (!welcomeText) {
    throw new Error(`Invalid tour in ${filePath}: missing 'welcome' text.`);
  }
  if (!completionText) {
    throw new Error(`Invalid tour in ${filePath}: missing 'completion' text.`);
  }
  const exampleFileRaw = rawTour.example_file;
  const exampleFile =
    exampleFileRaw == null ? null : sanitizeTourPath(String(exampleFileRaw), ".json");
  if (exampleFileRaw != null && !exampleFile) {
    throw new Error(
      `Invalid tour in ${filePath}: 'example_file' must be null or a safe .json relative path.`
    );
  }
  if (!Array.isArray(rawTour.stops) || rawTour.stops.length === 0) {
    throw new Error(`Invalid tour in ${filePath}: 'stops' must be a non-empty list.`);
  }
  const stops = rawTour.stops.map((stop, index) => {
    if (!stop || typeof stop !== "object") {
      throw new Error(`Invalid stop #${index + 1} in ${filePath}: stop must be an object.`);
    }
    const selector = getTourClassSelector(stop.class);
    if (!selector) {
      throw new Error(`Invalid stop #${index + 1} in ${filePath}: missing/invalid 'class'.`);
    }
    const heading = String(stop.heading || "").trim();
    const detail = String(stop.detail || "").trim();
    const tryThis = String(stop.try_this || "").trim();
    if (!heading || !detail) {
      throw new Error(
        `Invalid stop #${index + 1} in ${filePath}: each stop needs 'heading' and 'detail'.`
      );
    }
    return {
      selector,
      heading,
      detail,
      tryThis: tryThis || null,
      keepOpen: Boolean(tryThis),
    };
  });
  return {
    filePath,
    label: formatTourLabel(filePath),
    welcome: welcomeText,
    completion: completionText,
    exampleFile,
    stops,
  };
}

async function loadTourDefinition(filePath) {
  const response = await fetch(filePath, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load tutorial file: ${filePath}`);
  }
  const rawText = await response.text();
  const parser = window.jsyaml;
  if (!parser || typeof parser.load !== "function") {
    throw new Error("YAML parser is unavailable.");
  }
  const parsed = parser.load(rawText);
  return validateTourDefinition(parsed, filePath);
}

async function loadTutorialCatalog({ force = false } = {}) {
  if (!force && tutorialCatalog.length) {
    return tutorialCatalog;
  }
  const response = await fetch(TOUR_MANIFEST_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load tours/index.json");
  }
  const manifest = await response.json();
  if (!Array.isArray(manifest)) {
    throw new Error("tours/index.json must be an array.");
  }
  tutorialCatalog = manifest
    .map((entry) => {
      if (typeof entry === "string") {
        const file = normalizeTourFilename(entry);
        if (!file) {
          return null;
        }
        return { file, label: formatTourLabel(file), order: getTourOrder(file) };
      }
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const file = normalizeTourFilename(entry.file);
      if (!file) {
        return null;
      }
      const label = String(entry.label || formatTourLabel(file)).trim();
      return {
        file,
        label: label || formatTourLabel(file),
        order: getTourOrder(file),
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.label.localeCompare(b.label);
    });
  return tutorialCatalog;
}

function renderTutorialList() {
  if (!tutorialList) {
    return;
  }
  tutorialList.innerHTML = "";
  if (!tutorialCatalog.length) {
    tutorialList.innerHTML = "<div class=\"search-empty\">No tutorials found.</div>";
    return;
  }
  tutorialCatalog.forEach((entry) => {
    const completed = isTourCompleted(entry.file);
    const progress = getTourProgress(entry.file);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tutorial-item";
    if (completed) {
      button.classList.add("completed");
    }
    button.dataset.tourFile = entry.file;
    const titleRow = document.createElement("div");
    titleRow.className = "tutorial-item-title-row";
    const title = document.createElement("div");
    title.className = "tutorial-item-title";
    title.textContent = entry.label;
    titleRow.appendChild(title);
    if (progress) {
      const status = document.createElement("span");
      const stepNumber = Math.min(progress.stepCount, progress.stepIndex + 1);
      status.className = "tutorial-item-status";
      status.textContent = `In progress ${stepNumber}/${progress.stepCount}`;
      titleRow.appendChild(status);
    } else if (completed) {
      const status = document.createElement("span");
      status.className = "tutorial-item-status";
      status.textContent = "✓ Completed";
      titleRow.appendChild(status);
    }
    const meta = document.createElement("div");
    meta.className = "tutorial-item-meta";
    meta.textContent = progress
      ? `${entry.file} • Resume step ${Math.min(progress.stepCount, progress.stepIndex + 1)}`
      : entry.file;
    button.appendChild(titleRow);
    button.appendChild(meta);
    button.addEventListener("click", () => {
      openTutorialFromEntry(entry).catch((error) => {
        window.alert(error.message || "Unable to load tutorial.");
      });
    });
    tutorialList.appendChild(button);
  });
}

function openTutorialWelcomeModal(tour, { startIndex = 0, stepCount = 0, resume = false } = {}) {
  if (!tutorialWelcomeModal || !tutorialWelcomeTitle || !tutorialWelcomeText) {
    return;
  }
  pendingTourStartIndex = Number.isFinite(startIndex) ? Math.max(0, Math.floor(startIndex)) : 0;
  pendingTourStartCount = Number.isFinite(stepCount) ? Math.max(0, Math.floor(stepCount)) : 0;
  pendingTourIsResume = Boolean(resume);
  const fileName = (tour.filePath.split("/").pop() || tour.filePath).replace(/\.ya?ml$/i, "");
  const titleBase = toTitleCase(stripTourOrderPrefix(fileName).replace(/[_-]+/g, " "));
  tutorialWelcomeTitle.textContent = `${titleBase} Tour`;
  tutorialWelcomeText.textContent =
    pendingTourIsResume && pendingTourStartCount > 0
      ? `${tour.welcome}\n\nResume at step ${Math.min(pendingTourStartCount, pendingTourStartIndex + 1)} of ${pendingTourStartCount}.`
      : tour.welcome;
  if (tutorialStart) {
    tutorialStart.textContent = pendingTourIsResume ? "RESUME" : "START";
  }
  tutorialWelcomeModal.classList.remove("hidden");
  tutorialWelcomeModal.setAttribute("aria-hidden", "false");
  tutorialStart?.focus();
}

function openTutorialCompleteModal(text) {
  if (!tutorialCompleteModal || !tutorialCompleteText) {
    return;
  }
  tutorialCompleteText.textContent = text;
  tutorialCompleteModal.classList.remove("hidden");
  tutorialCompleteModal.setAttribute("aria-hidden", "false");
  tutorialCompleteClose?.focus();
}

async function maybeLoadTourExample(tour, { confirmOverwrite = true } = {}) {
  if (!tour.exampleFile) {
    return true;
  }
  const response = await fetch(tour.exampleFile, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load tutorial example file: ${tour.exampleFile}`);
  }
  const payload = await response.text();
  return applyImportPayload(payload, { confirmOverwrite });
}

function getDriverFactory() {
  if (window.driver?.js && typeof window.driver.js.driver === "function") {
    return window.driver.js.driver;
  }
  if (typeof window.driver === "function") {
    return window.driver;
  }
  return null;
}

function stopActiveTour() {
  tutorialCompletedPending = false;
  activeTourStepIndex = -1;
  activeTourStepCount = 0;
  if (activeDriver && typeof activeDriver.destroy === "function") {
    activeDriver.destroy();
  } else {
    activeDriver = null;
  }
}

function isEditableTarget(target) {
  if (!target) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function handleTourArrowNavigation(event) {
  if (!activeDriver) {
    return;
  }
  if (isEditableTarget(event.target)) {
    return;
  }
  const isPrevKey = event.key === "ArrowLeft" || event.key === "ArrowDown";
  const isNextKey = event.key === "ArrowRight" || event.key === "ArrowUp";
  if (!isPrevKey && !isNextKey) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  if (isPrevKey) {
    if (typeof activeDriver.movePrevious === "function") {
      activeDriver.movePrevious();
      return;
    }
    if (typeof activeDriver.movePrev === "function") {
      activeDriver.movePrev();
    }
    return;
  }
  if (activeTourStepCount > 0 && activeTourStepIndex >= activeTourStepCount - 1) {
    tutorialCompletedPending = true;
    activeDriver.destroy();
    return;
  }
  if (typeof activeDriver.moveNext === "function") {
    activeDriver.moveNext();
  }
}

function startActiveTour({ startIndex = 0 } = {}) {
  if (!activeTour) {
    return;
  }
  const driverFactory = getDriverFactory();
  if (!driverFactory) {
    window.alert("Tutorial engine failed to load.");
    return;
  }
  stopActiveTour();
  tutorialCompletedPending = false;
  const validStops = activeTour.stops.filter((stop) => {
    const visible = ensureTourTargetVisible(stop.selector);
    return Boolean(visible);
  });
  if (!validStops.length) {
    window.alert("This tutorial has no valid targets in the current app state.");
    return;
  }
  const resumeIndex = Number.isFinite(startIndex) ? Math.floor(startIndex) : 0;
  const clampedStartIndex = Math.min(Math.max(resumeIndex, 0), validStops.length - 1);
  activeTourStepCount = validStops.length;
  activeTourStepIndex = clampedStartIndex;
  saveTourProgress(activeTour.filePath, {
    stepIndex: clampedStartIndex,
    stepCount: validStops.length,
  });
  const steps = validStops.map((stop, index) => ({
    element: stop.selector,
    onHighlightStarted: () => {
      activeTourStepIndex = index;
      saveTourProgress(activeTour.filePath, {
        stepIndex: index,
        stepCount: validStops.length,
      });
      ensureTourTargetVisible(stop.selector);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          refreshIcons();
        });
      });
    },
    popover: {
      title: stop.heading,
      description: stop.tryThis
        ? `<div class="tour-step-detail">${escapeHtml(stop.detail)}</div>` +
          `<div class="tour-try-this"><span class="icon" aria-hidden="true">` +
          `<i data-lucide="square-mouse-pointer"></i></span>` +
          `<span><strong>Try this now:</strong> ${escapeHtml(stop.tryThis)}</span></div>`
        : `<div class="tour-step-detail">${escapeHtml(stop.detail)}</div>`,
      showButtons: ["previous", "next", "close"],
      prevBtnText: "Prev",
      nextBtnText: index === validStops.length - 1 ? "Finish" : "Next",
      onNextClick: () => {
        if (!activeDriver) {
          return;
        }
        if (index === validStops.length - 1) {
          tutorialCompletedPending = true;
          activeDriver.destroy();
          return;
        }
        if (typeof activeDriver.moveNext === "function") {
          activeDriver.moveNext();
        }
      },
    },
  }));
  activeDriver = driverFactory({
    animate: true,
    smoothScroll: true,
    showProgress: true,
    allowClose: true,
    overlayClickBehavior: () => {},
    stagePadding: 10,
    stageRadius: 12,
    overlayOpacity: 0.34,
    steps,
    onDestroyed: () => {
      const shouldShowComplete = tutorialCompletedPending;
      tutorialCompletedPending = false;
      activeDriver = null;
      if (shouldShowComplete && activeTour) {
        markTourCompleted(activeTour.filePath);
        clearTourProgress(activeTour.filePath);
        openTutorialCompleteModal(activeTour.completion);
        return;
      }
      if (activeTour && activeTourStepIndex >= 0 && activeTourStepCount > 0) {
        saveTourProgress(activeTour.filePath, {
          stepIndex: Math.min(activeTourStepIndex, activeTourStepCount - 1),
          stepCount: activeTourStepCount,
        });
      }
    },
  });
  activeDriver.drive(clampedStartIndex);
}

async function openTutorialFromEntry(entry) {
  const tour = await loadTourDefinition(entry.file);
  const progress = getTourProgress(tour.filePath);
  const hasProgress = Boolean(progress);
  let shouldResume = false;
  if (hasProgress) {
    const stepNumber = Math.min(progress.stepCount, progress.stepIndex + 1);
    const restartWarning = tour.exampleFile
      ? "Choose Cancel to restart from the beginning. Restarting can overwrite your current session with tutorial example data."
      : "Choose Cancel to restart from the beginning.";
    shouldResume = window.confirm(
      `Resume this tour at step ${stepNumber} of ${progress.stepCount}?\n\n` +
        restartWarning
    );
  }
  if (!shouldResume) {
    let shouldConfirmRestartOverwrite = false;
    if (hasProgress && tour.exampleFile) {
      shouldConfirmRestartOverwrite = !window.confirm(
        "Restarting this tutorial will load example data and can overwrite your current session. Continue?"
      );
    }
    if (shouldConfirmRestartOverwrite) {
      return;
    }
    const imported = await maybeLoadTourExample(tour, {
      confirmOverwrite: !(hasProgress && tour.exampleFile),
    });
    if (!imported) {
      return;
    }
  }
  activeTour = tour;
  closeTutorialPickerModal();
  closeTutorialCompleteModal();
  openTutorialWelcomeModal(tour, {
    startIndex: shouldResume && progress ? progress.stepIndex : 0,
    stepCount: shouldResume && progress ? progress.stepCount : tour.stops.length,
    resume: shouldResume,
  });
}

async function maybeResumeTourAfterReload() {
  const progress = getMostRecentTourProgressEntry();
  if (!progress) {
    return;
  }
  try {
    const tour = await loadTourDefinition(progress.filePath);
    activeTour = tour;
    closeTutorialPickerModal();
    closeTutorialCompleteModal();
    closeTutorialWelcomeModal();
    startActiveTour({ startIndex: progress.stepIndex });
  } catch (error) {
    clearTourProgress(progress.filePath);
    window.alert(error.message || "Unable to resume the saved tour.");
  }
}

function buildDispatchCsv() {
  const rows = [["Observer", "Timestamp", "Notes", "Reportable"]];
  state.columns.forEach((column) => {
    const label = getCardDisplay(column.type || DEFAULT_CARD_TYPE, column.label);
    column.observations.forEach((obs) => {
      rows.push([
        label,
        obs.timestampText,
        obs.text.replaceAll("\n", " "),
        obs.reportable ? "T" : "F",
      ]);
    });
  });
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
            return `"${value.replaceAll("\"", "\"\"")}"`;
          }
          return value;
        })
        .join(",")
    )
    .join("\n");
}

function exportNotes(format) {
  const stamp = getExportStamp();
  if (format === "clipboard") {
    const csv = buildDispatchCsv();
    navigator.clipboard.writeText(csv).catch(() => {
      window.alert("Unable to copy to clipboard.");
    });
    return;
  }
  if (format === "json") {
    const payload = serializeState();
    downloadFile(payload, `dispatch-session-backup-${stamp}.json`, "application/json");
    return;
  }
  const csv = buildDispatchCsv();
  downloadFile(csv, `dispatch-session-${stamp}.csv`, "text/csv");
}

function exportSummary(format) {
  if (!summaryOutput) {
    return;
  }
  const text = summaryOutput.value;
  if (format === "summary-clipboard") {
    navigator.clipboard.writeText(text).catch(() => {
      window.alert("Unable to copy to clipboard.");
    });
    return;
  }
  if (format === "summary-txt") {
    const stamp = getExportStamp();
    downloadFile(text, `dispatch-summary-${stamp}.txt`, "text/plain");
  }
}

function setExportMenu() {
  if (!exportMenu || !exportButton) {
    return;
  }
  exportButton.innerHTML =
    '<span class="icon" aria-hidden="true"><i data-lucide="download"></i></span>Export';
  exportMenu.innerHTML = "";
  const items = [
    { value: "summary-clipboard", label: "Copy Summary to Clipboard" },
    { value: "summary-txt", label: "Export Summary (TXT)" },
    { value: "csv", label: "Export Note Data (CSV)" },
    { value: "clipboard", label: "Copy Note Data to Clipboard" },
    { value: "json", label: "Save Session Backup (JSON)" },
  ];
  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dropdown-item";
    button.setAttribute("role", "menuitem");
    button.dataset.export = item.value;
    button.textContent = item.label;
    exportMenu.appendChild(button);
  });
  refreshIcons();
  ensureLucideIcon(exportButton);
}

function resetState() {
  state.startTime = null;
  state.endTime = null;
  state.endAdjustedNote = "";
  state.area = "";
  state.summaryInclude = null;
  state.summarySort = DEFAULT_SUMMARY_SORT;
  state.summaryMostRecentFirst = DEFAULT_SUMMARY_MOST_RECENT_FIRST;
  state.summaryKnownTypes = null;
  state.summaryReportableOnly = DEFAULT_SUMMARY_REPORTABLE_ONLY;
  state.summaryIncludeLocation = DEFAULT_SUMMARY_INCLUDE_LOCATION;
  state.summaryLocationIncludeAddress = DEFAULT_SUMMARY_INCLUDE_LOCATION_ADDRESS;
  state.summaryLocationIncludeLatLon = DEFAULT_SUMMARY_INCLUDE_LOCATION_LAT_LON;
  state.summaryIncludeEmojis = DEFAULT_SUMMARY_INCLUDE_EMOJIS;
  state.summarySanitizeNames = DEFAULT_SUMMARY_SANITIZE_NAMES;
  state.summaryBulletsForNotes = DEFAULT_SUMMARY_BULLETS_FOR_NOTES;
  state.summarySpaceBetweenNotes = DEFAULT_SUMMARY_SPACE_BETWEEN_NOTES;
  state.summaryTime24 = DEFAULT_SUMMARY_TIME_24;
  state.summaryGroupFields = DEFAULT_SUMMARY_GROUP_FIELDS;
  state.summaryDefaultExclude = Array.from(DEFAULT_SUMMARY_EXCLUDE);
  state.availableCardTypes = normalizeAvailableCardTypes(null);
  state.defaultNewCardType = DEFAULT_NEW_CARD_TYPE;
  state.cardColorDefaults = normalizeCardColorDefaults(null);
  state.viewMode = DEFAULT_VIEW_MODE;
  state.notesNewestFirst = DEFAULT_NOTES_NEWEST_FIRST;
  state.mapSettings = {
    city: null,
    radiusMiles: DEFAULT_MAP_RADIUS_MILES,
    style: DEFAULT_MAP_STYLE,
  };
  state.mapFilters = {
    hideMinimized: DEFAULT_MAP_FILTER_HIDE_MINIMIZED,
    labelTimes: DEFAULT_MAP_FILTER_LABEL_TIMES,
    types: getDefaultMapTypeFilters(),
  };
  state.isDirty = false;
  if (summarySort) {
    summarySort.value = DEFAULT_SUMMARY_SORT;
  }
  if (summaryMostRecentToggle) {
    summaryMostRecentToggle.checked = DEFAULT_SUMMARY_MOST_RECENT_FIRST;
  }
  if (dispatchNewestFirstToggle) {
    dispatchNewestFirstToggle.checked = DEFAULT_NOTES_NEWEST_FIRST;
  }
  if (shiftAreaInput) {
    shiftAreaInput.value = "";
  }
  if (summaryReportableToggle) {
    summaryReportableToggle.checked = DEFAULT_SUMMARY_REPORTABLE_ONLY;
  }
  if (summaryEmojiToggle) {
    summaryEmojiToggle.checked = DEFAULT_SUMMARY_INCLUDE_EMOJIS;
  }
  if (summaryLocationToggle) {
    summaryLocationToggle.checked = DEFAULT_SUMMARY_INCLUDE_LOCATION;
  }
  if (summaryLocationAddressToggle) {
    summaryLocationAddressToggle.checked = DEFAULT_SUMMARY_INCLUDE_LOCATION_ADDRESS;
  }
  if (summaryLocationLatLonToggle) {
    summaryLocationLatLonToggle.checked = DEFAULT_SUMMARY_INCLUDE_LOCATION_LAT_LON;
  }
  if (summaryBulletsToggle) {
    summaryBulletsToggle.checked = DEFAULT_SUMMARY_BULLETS_FOR_NOTES;
  }
  if (summarySpaceBetweenToggle) {
    summarySpaceBetweenToggle.checked = DEFAULT_SUMMARY_SPACE_BETWEEN_NOTES;
  }
  if (summarySanitizeToggle) {
    summarySanitizeToggle.checked = DEFAULT_SUMMARY_SANITIZE_NAMES;
  }
  syncSummaryLocationSuboptions();
  syncSummaryTimeFormatToggle();
  createDefaultColumns();
  syncShiftUI();
  renderColumns();
  updateSummary();
  renderSummaryDefaultExclude();
  renderCardTypeAvailability();
  renderDefaultCardTypeSelect();
  renderDefaultCardColorSettings();
  applyViewMode();
  updateCityUI();
  syncMapFilterControls();
  persistState();
}

function syncSummaryTimeFormatToggle() {
  const use24 = state.summaryTime24 !== false;
  if (summaryTimeFormat24) {
    summaryTimeFormat24.classList.toggle("active", use24);
    summaryTimeFormat24.setAttribute("aria-pressed", String(use24));
  }
  if (summaryTimeFormat12) {
    summaryTimeFormat12.classList.toggle("active", !use24);
    summaryTimeFormat12.setAttribute("aria-pressed", String(!use24));
  }
}

function syncSummaryLocationSuboptions() {
  const enabled = state.summaryIncludeLocation !== false;
  if (summaryLocationSuboptions) {
    summaryLocationSuboptions.classList.toggle("hidden", !enabled);
  }
  if (summaryLocationAddressToggle) {
    summaryLocationAddressToggle.disabled = !enabled;
  }
  if (summaryLocationLatLonToggle) {
    summaryLocationLatLonToggle.disabled = !enabled;
  }
}

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

function init() {
  const storedMapSettings = loadMapSettingsFromStorage();
  const liveServerSession = isLiveServerSession();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const shouldLoad = liveServerSession
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
      hideMinimized: DEFAULT_MAP_FILTER_HIDE_MINIMIZED,
      labelTimes: DEFAULT_MAP_FILTER_LABEL_TIMES,
      types: getDefaultMapTypeFilters(),
    };
  } else if (!state.mapFilters.types) {
    state.mapFilters.types = getDefaultMapTypeFilters();
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
      allowPrefixMatch: true,
      minPrefixChars: 2,
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
      allowPrefixMatch: true,
      minPrefixChars: 2,
    });
    addCommitOnEnter(vehicleModel);
  }

  if (vehicleBody) {
    if (bodyOptions) {
      addTabCycleDatalist(vehicleBody, bodyOptions, {
        allowPrefixMatch: true,
        minPrefixChars: 2,
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
    addTabCycleDatalist(vehicleColor, colorOptions);
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
      openShortcutsModal();
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
    versionButton.addEventListener("click", () => {
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
  }

  const openTutorialPicker = async () => {
    try {
      await loadTutorialCatalog({ force: true });
      renderTutorialList();
      openTutorialPickerModal();
    } catch (error) {
      window.alert(error.message || "Unable to load tutorial catalog.");
    }
  };

  if (tutorialButton) {
    tutorialButton.addEventListener("click", openTutorialPicker);
  }
  if (welcomeAboutButton) {
    welcomeAboutButton.addEventListener("click", () => {
      handleTabSwitch("about");
    });
  }
  if (aboutTutorialButton) {
    aboutTutorialButton.addEventListener("click", openTutorialPicker);
  }

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

  if (mapFilterMinimized) {
    mapFilterMinimized.addEventListener("click", () => {
      state.mapFilters.hideMinimized = !state.mapFilters.hideMinimized;
      mapFilterMinimized.classList.toggle("active", state.mapFilters.hideMinimized);
      mapFilterMinimized.setAttribute(
        "aria-pressed",
        String(state.mapFilters.hideMinimized)
      );
      mapNeedsFit = true;
      renderMapPins();
      persistState();
      hideMapFilterNotice();
    });
  }

  if (mapFilterLabelTimes) {
    mapFilterLabelTimes.addEventListener("click", () => {
      state.mapFilters.labelTimes = !state.mapFilters.labelTimes;
      mapFilterLabelTimes.classList.toggle("active", state.mapFilters.labelTimes);
      mapFilterLabelTimes.setAttribute(
        "aria-pressed",
        String(state.mapFilters.labelTimes)
      );
      renderMapPins();
      persistState();
      hideMapFilterNotice();
    });
  }

  if (mapTypeButton && mapTypeMenu) {
    mapTypeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = mapTypeMenu.classList.contains("show");
      if (isOpen) {
        closeMapTypeMenu(true);
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
      closeMapTypeMenu(true);
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

  function isLiveServerSession() {
    if (document.querySelector('script[src*="livereload.js"]')) {
      return true;
    }
    const host = window.location.hostname;
    const port = window.location.port;
    return (host === "127.0.0.1" || host === "localhost") && port === "8080";
  }

  function shouldWarnOnUnload() {
    if (liveServerSession) {
      return false;
    }
    return state.dispatchVisited || state.isDirty || hasDispatchData();
  }

  let allowReload = false;

  function requestReload(event) {
    if (liveServerSession) {
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

  if (!liveServerSession) {
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
      openShortcutsModal();
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
  if (exportButton) {
    ensureLucideIcon(exportButton);
  }

  maybeResumeTourAfterReload().catch((error) => {
    console.warn("[tutorial] Unable to auto-resume tour after reload.", error);
  });
}

window.addEventListener("load", () => {
  refreshIcons();
  if (exportButton) {
    ensureLucideIcon(exportButton);
  }
});

init();
