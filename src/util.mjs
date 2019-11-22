const manifest = chrome.runtime.getManifest();

function fnv1a(string) {
  // https://github.com/sindresorhus/fnv1a
  // Handle Unicode code points > 0x7f
  let hash = Number(2166136261n);
  let isUnicoded = false;

  for (let i = 0; i < string.length; i++) {
    let characterCode = string.charCodeAt(i);

    // Non-ASCII characters trigger the Unicode escape logic
    if (characterCode > 0x7F && !isUnicoded) {
      string = unescape(encodeURIComponent(string));
      characterCode = string.charCodeAt(i);
      isUnicoded = true;
    }

    hash ^= characterCode;
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return hash >>> 0;
}

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

export { fnv1a, isDevMode, loadScriptAsync, log };
