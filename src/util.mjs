function isDevMode() {
  return !('update_url' in chrome.runtime.getManifest());
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
  console.log('s-m:', ...args);
  return true;
}

export { isDevMode, loadScriptAsync, log };
