/*
  Setup shared state for section-oriented initialization.
*/

let runtimeLiveServerSession = false;

function isLiveServerSession() {
  if (document.querySelector('script[src*="livereload.js"]')) {
    return true;
  }
  const host = window.location.hostname;
  const port = window.location.port;
  return (host === "127.0.0.1" || host === "localhost") && port === "8080";
}
