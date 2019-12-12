let _enabled = true;

export function init(capture, tabNorthismsCount, extensionToggle) {
  tabNorthismsCount.subscribe(capture.bind(this, onTabNorthismsCount));
  extensionToggle.subscribe(capture.bind(this, onExtensionToggle));
  browser.browserAction.setBadgeBackgroundColor({color: '#696969'});
}

export function clear() {
  setBadgeText();
}

async function onTabNorthismsCount(state) {
  if (state.tabId !== (await browser.tabs.query({currentWindow: true, active: true}))[0].id) {
    return;
  }

  setBadgeText(state.count);
}

function onExtensionToggle(enabled) {
  _enabled = enabled;
  setIcon(_enabled ? '' : '_disabled');
}

function setBadgeText(count) {
  browser.browserAction.setBadgeText({
    text: !count || !_enabled ? '' : count.toString()
  });
}

function setIcon(suffix) {
  browser.browserAction.setIcon({path: {
    16: `assets/toolbar_icon16${suffix}.png`,
    32: `assets/toolbar_icon32${suffix}.png`,
    48: `assets/toolbar_icon48${suffix}.png`,
    128: `assets/toolbar_icon128${suffix}.png`
  }});
}
