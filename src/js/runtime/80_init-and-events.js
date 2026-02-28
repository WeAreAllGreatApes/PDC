/*
  Runtime entrypoint.
  Calls section-specific setup phases in deterministic order.
*/

function init() {
  // Render shell icons before any potential blocking dialogs (e.g., saved-session confirm).
  refreshIcons();
  if (exportButton) {
    ensureLucideIcon(exportButton);
  }
  bootstrapRuntimeState();
  bindDispatchAndSummarySection();
  bindAlertSection();
  bindModalAndNavigationSection();
  bindDispatchMapSection();
  bindWindowAndShortcutSection();
  finalizeRuntimeInit();
}

window.addEventListener("load", () => {
  refreshIcons();
  if (exportButton) {
    ensureLucideIcon(exportButton);
  }
});

init();
