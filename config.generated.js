// Generated from config.yml by deployment pipeline.
window.__PDC_CONFIG__ = {
  version: 1,
  storage: {
    stateKey: "pdc_dispatch_state",
    viewStateKey: "pdc_view_state",
    mapSettingsKey: "pdc_map_settings",
    completedToursKey: "pdc_completed_tours",
  },
  timezone: {
    default: "America/Chicago",
  },
  features: {
    map: true,
    splitView: true,
    locationTagging: true,
  },
  apis: {
    geocoding: {
      enabled: true,
      baseUrl: "http://localhost:8000",
    },
  },
  map: {
    metersPerMile: 1609.34,
    defaultCenter: {
      lat: 44.9778,
      lon: -93.265,
    },
    defaultRadiusMiles: 50,
    defaultStyle: "clean",
    defaultFilters: {
      showMinimized: false,
      labelTimes: true,
      recencyMode: "all",
      noteReportableOnly: false,
      inactiveLabelOpacity: 0.6,
    },
    styles: [
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
    ],
  },
  summary: {
    sort: "time",
    mostRecentFirst: false,
    reportableOnly: false,
    includeLocation: true,
    locationIncludeAddress: true,
    locationIncludeLatLon: false,
    includeEmojis: false,
    sanitizeNames: true,
    bulletsForNotes: false,
    time24: true,
    groupFields: true,
    defaultExclude: ["For Lookup"],
  },
  cards: {
    defaultCardType: "Observer",
    defaultNewCardType: "last",
    defaultColorMode: "cycle",
    defaultColorPalette: "classic",
    types: [
      { value: "Incident", label: "Incident", icon: "alert-triangle" },
      { value: "Vehicle", label: "Vehicle", icon: "car" },
      { value: "Observer", label: "Observer", icon: "user" },
      { value: "Observer Bike", label: "Observer", icon: "bike" },
      { value: "Observer Car", label: "Observer", icon: "car" },
      { value: "Place", label: "Location", icon: "map-pin" },
      { value: "For Lookup", label: "For Lookup", icon: "search" },
      { value: "Notes", label: "Notes", icon: "file-text" },
      { value: "Custom", label: "Custom", icon: "pencil" },
    ],
    typeEmoji: {
      Observer: "🧍",
      "Observer Bike": "🚲",
      "Observer Car": "🚗",
      Incident: "🚨",
      Place: "📍",
      Vehicle: "🚙",
      "For Lookup": "🔎",
      Notes: "📝",
      Custom: "✍️",
    },
  },
  dispatch: {
    defaultViewMode: "notes",
  },
  tours: {
    manifestPath: "tours/index.json",
  },
};
