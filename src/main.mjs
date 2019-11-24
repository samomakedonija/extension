import { fnv1a, isDevMode, log } from './util.mjs';
import { getNorthisms } from './northisms.mjs';
import { track } from './analytics.mjs';

let
  counters = {},
  hrefCounters = {},
  total,
  _autoErasing,
  _disabled;

chrome.runtime.onInstalled.addListener(onInstalled);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
          updateBadge(counters[tabId], _disabled);
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
      current: _disabled ? 0 : (request.data ? counters[request.data.tabId] : undefined),
      total: total,
      autoErasing: _autoErasing,
      disabled: _disabled
    }));
    // We wish to send a response asynchronously, so the message channel
    // will be kept open to the other end (caller) until sendResponse is executed.
    return true;
  }

  if (request.action === 'track') {
    return track('pageview', '/' + request.data.page);
  }

  if (request.action === 'is dev mode') {
    return sendResponse(isDevMode());
  }
});

chrome.tabs.onActivated.addListener(activeInfo => {
  updateBadge(counters[activeInfo.tabId], _disabled);
  updateContentState(activeInfo.tabId);
});

chrome.tabs.onRemoved.addListener(tabId => delete counters[tabId]);

chrome.browserAction.setBadgeBackgroundColor({color: '#696969'});

track('event', {
  eventCategory: 'Extension',
  eventAction: 'activated',
  nonInteraction: true
});

chrome.storage.sync.get([
  'total', 'autoErasing', 'disabled'
], result => {
  total = result.total || 0;
  _autoErasing = !!result.autoErasing;
  _disabled = !!result.disabled;
  updateIcon(_disabled);
});

function onCount(disabled, tab, data) {
  const tabId = tab.id;
  if (disabled) {
    return;
  }

  if (data.addCount !== undefined) {
    counters[tabId] += data.addCount;
    addToTotal(data.addCount, data.location, tab.incognito);
    updateCounters(counters[tabId], total);
    return;
  }

  if (!data.takeIntoAccount || hrefCounters[fnv1a(data.location.href)] === data.initialCount) {
    counters[tabId] = data.initialCount;
    updateCounters(counters[tabId], total);
    return;
  }

  hrefCounters[fnv1a(data.location.href)] = data.initialCount;
  counters[tabId] = data.initialCount;
  addToTotal(data.initialCount, data.location, tab.incognito);
  updateCounters(counters[tabId], total);
  return;
}

function addToTotal(count, location, incognito) {
  total += count;
  !incognito && chrome.storage.sync.set({total: total});
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

function onInstalled(details) {
  details.reason === 'install' && track('event', {
    eventCategory: 'Extension',
    eventAction: 'installed',
    nonInteraction: true
  });
}
