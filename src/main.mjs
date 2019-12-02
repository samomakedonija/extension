import { isDevMode, log } from './util.mjs';
import { getNorthisms } from './northisms.mjs';
import { track } from './analytics.mjs';

let
  _counters = {},
  _tabState = {},
  _eh, _total, _autoErasing, _disabled;

export function init(eh) {
  _eh = eh;

  chrome.runtime.onInstalled.addListener(
    eh.wrap.bind(this, onRuntimeInstalled)
  );
  chrome.runtime.onMessage.addListener(
    eh.wrap.bind(this, onRuntimeMessage)
  );

  chrome.tabs.onActivated.addListener(
    eh.wrap.bind(this, onTabActivated)
  );
  chrome.tabs.onRemoved.addListener(
    eh.wrap.bind(this, onTabRemoved)
  );

  chrome.browserAction.setBadgeBackgroundColor({color: '#696969'});

  chrome.storage.sync.get([
    'total', 'autoErasing', 'disabled'
  ], result => {
    _total = result.total || 0;
    _autoErasing = !!result.autoErasing;
    _disabled = !!result.disabled;
    updateIcon(_disabled);
  });

  track('event', {
    eventCategory: 'Extension',
    eventAction: 'activated',
    nonInteraction: true
  });
}

function onRuntimeInstalled(details) {
  if (details.reason === 'install') {
    return track('event', {
      eventCategory: 'Extension',
      eventAction: 'installed',
      nonInteraction: true
    });
  }

  if (details.reason === 'update' && !isDevMode()) {
    track('event', {
      eventCategory: 'Extension',
      eventAction: 'updated',
      nonInteraction: true
    });
    return chrome.tabs.create({url: 'src/update/update.html'});
  }
}

function onRuntimeMessage(request, sender, sendResponse) {
  if (request.action === 'count') {
    onCount(_disabled, sender.tab, request.data);
    return;
  }

  if (request.action === 'set state') {
    if (request.data.autoErasing !== undefined) {
      chrome.storage.sync.set({autoErasing: request.data.autoErasing}, () => {
        _autoErasing = request.data.autoErasing;
        chrome.tabs.query(
          {active: true, currentWindow: true}, tabs => updateContentState(tabs[0].id)
        );
      });
      sendResponse();
      return;
    }

    if (request.data.disabled !== undefined) {
      chrome.storage.sync.set({disabled: request.data.disabled}, () => {
        _disabled = request.data.disabled;
        updateIcon(_disabled);
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
          const tabId = tabs[0].id;
          updateBadge(_counters[tabId], _disabled);
          updateContentState(tabId);
        });
      });
      sendResponse();
      return;
    }

    return;
  }

  if (request.action === 'get state') {
    getNorthisms().then(northisms => sendResponse({
      northisms: northisms,
      current: _disabled ? 0 : (request.data ? _counters[request.data.tabId] : undefined),
      total: _total,
      autoErasing: _autoErasing,
      disabled: _disabled
    }));
    // We wish to send a response asynchronously, so the message channel
    // will be kept open to the other end (caller) until sendResponse is executed.
    return true;
  }

  if (request.action === 'track') {
    track('pageview', '/' + request.data.page);
    return;
  }

  if (request.action === 'is dev mode') {
    sendResponse(isDevMode());
    return;
  }

  if (request.action === 'capture error') {
    _eh.capture(request.data.err, request.data.context);
    return;
  }
}

function onTabActivated(activeInfo) {
  updateBadge(_counters[activeInfo.tabId], _disabled);
  updateContentState(activeInfo.tabId);
}

function onTabRemoved(tabId) {
  delete _counters[tabId];
  delete _tabState[tabId];
}

function onCount(disabled, tab, data) {
  const tabId = tab.id;
  if (disabled) {
    delete _tabState[tabId];
    return;
  }

  if (data.addCount !== undefined) {
    _counters[tabId] += data.addCount;
    _total = setNewTotal(_total, data.addCount, tab.incognito, data.location);
    setTabState(tabId, _counters[tabId], data.location.href);
    updateCounters(_counters[tabId], _total);
    return;
  }

  if (!data.takeIntoAccount || isSameTabState(tabId, data.initialCount, data.location.href)) {
    _counters[tabId] = data.initialCount;
    updateCounters(_counters[tabId], _total);
    return;
  }

  _counters[tabId] = data.initialCount;
  _total = setNewTotal(_total, data.initialCount, tab.incognito, data.location);
  setTabState(tabId, _counters[tabId], data.location.href);
  updateCounters(_counters[tabId], _total);
  return;
}

function setTabState(tabId, count, href) {
  _tabState[tabId] = {href: href, count: count};
}

function isSameTabState(tabId, count, href) {
  const state = _tabState[tabId];
  if (!state) {
    return false;
  }

  return state.count === count && state.href === href;
}

function setNewTotal(total, count, incognito, location) {
  const newTotal = total + count;
  !incognito && chrome.storage.sync.set({total: newTotal});
  return newTotal;
}

function updateContentState(tabId) {
  chrome.tabs.sendMessage(tabId, {action: 'update content state', data: {
    disabled: _disabled,
    autoErasing: _autoErasing
  }});
}

function updateCounters(current, total) {
  updateBadge(current, _disabled);
  if (!chrome.extension.getViews({type: 'popup'}).length) {
    return;
  }

  chrome.runtime.sendMessage({action: 'update popup counters', data: {
    current: current,
    total: total
  }});
}

function updateBadge(count, disabled) {
  chrome.browserAction.setBadgeText({
    text: !count || disabled ? '' : count.toString()
  });
}

function updateIcon(disabled) {
  const suffix = disabled ? '_disabled' : '';
  chrome.browserAction.setIcon({path: {
    16: `assets/toolbar_icon16${suffix}.png`,
    32: `assets/toolbar_icon32${suffix}.png`,
    48: `assets/toolbar_icon48${suffix}.png`,
    128: `assets/toolbar_icon128${suffix}.png`
  }});
}
