const manifest = browser.runtime.getManifest();

function isDevMode() {
  return !('update_url' in manifest);
}

function loadScriptAsync(src) {
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.onload = resolve;
    script.src = src;
    document.head.appendChild(script);
  });
}

function log(...args) {
  isDevMode() && console.log('om:', ...args);
  return true;
}

export { isDevMode, loadScriptAsync, log };
