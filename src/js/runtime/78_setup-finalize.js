/* 78 setup finalize */

function finalizeRuntimeInit() {
  if (exportButton) {
    ensureLucideIcon(exportButton);
  }

  maybeResumeTourAfterReload().catch((error) => {
    console.warn("[tutorial] Unable to auto-resume tour after reload.", error);
  });
}
