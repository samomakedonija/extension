const manifest = chrome.runtime.getManifest();

function isDevMode() {
  return !('update_url' in manifest);
}

function loadScriptAsync(scriptSrc, callback) {
  if (typeof(callback) !== 'function') {
    throw new Error('loadScriptAsync: callback argument is not a function');
  }

  const script = document.createElement('script');
  script.onload = callback;
  script.src = scriptSrc;
  document.head.appendChild(script);
}

export { isDevMode, loadScriptAsync };
