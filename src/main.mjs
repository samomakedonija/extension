import { fnv1a, isDevMode, log } from './util.mjs';
import { getNorthisms } from './northisms.mjs';
import { track } from './analytics.mjs';

let
  counters = {},
  hrefCounters = {},
  total,
  autoErasing,
  _disabled;

chrome.runtime.onInstalled.addListener(onInstalled);

track('event', {
  eventCategory: 'Extension',
  eventAction: 'activated',
  nonInteraction: true
});

chrome.storage.sync.get([
  'total', 'autoErasing', 'disabled'
], result => {
  total = result.total || 0;
  autoErasing = !!result.autoErasing;
  _disabled = !!result.disabled;
  updateIcon(_disabled);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'count') {
    onCount(_disabled, sender.tab, request.data);
    return;
  }

  if (request.action === 'set state') {
    if (request.data.autoErasing !== undefined) {
      chrome.storage.sync.set({autoErasing: request.data.autoErasing}, () => {
        autoErasing = request.data.autoErasing;
        chrome.tabs.query({active: true, currentWindow: true}, tabs => chrome.tabs.sendMessage(
          tabs[0].id, {action: 'toggle erasing', data: {
            autoErasing: autoErasing
          }}
        ));
      });
      sendResponse();
      return;
    }

    if (request.data.disabled !== undefined) {
      chrome.storage.sync.set({disabled: request.data.disabled}, () => {
        _disabled = request.data.disabled;
        updateIcon(_disabled);
        //updateBadge(0, _disabled);
        updateCounters(0, total);
        // Probably need to update the popup current counter here.
        chrome.tabs.query({active: true, currentWindow: true}, tabs => chrome.tabs.sendMessage(
          tabs[0].id, {action: 'toggle northisms', data: {
            disabled: _disabled
          }}
        ));
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
      autoErasing: autoErasing,
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
  updateBadge(counters[activeInfo.tabId] || 0, _disabled);
  chrome.tabs.sendMessage(activeInfo.tabId, {action: 'toggle erasing', data: {
    autoErasing: autoErasing
  }});
});

chrome.tabs.onRemoved.addListener(tabId => delete counters[tabId]);

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

function updateCounters(current, total) {
  updateBadge(current, _disabled);
  chrome.runtime.sendMessage({action: 'update popup counters', data: {
    current: current,
    total: total
  }});
}

function updateBadge(count, disabled) {
  if (count === 0 || disabled) {
    chrome.browserAction.setBadgeText({text: ''});
    return;
  }

  chrome.browserAction.setBadgeText({text: count.toString()});
  chrome.browserAction.setBadgeBackgroundColor({color: '#696969'});

  /*
    Needs "permissions": ["notifications"] in the manifest.
  */
  false && chrome.notifications.create(count.toString(), {
    type: 'basic',
    iconUrl: 'toolbar_icon128.png',
    title: 'Никогаш Северна! 👌',
    message: 'Достигнато ново дно'
  }, function(notificationId) {});
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
