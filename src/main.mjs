import { fnv1a, isDevMode } from './util.mjs';
import { getNorthisms } from './northisms.mjs';
import { track } from './analytics.mjs';

let
  counters = {},
  hrefCounters = {},
  total,
  autoErasing;

chrome.runtime.onInstalled.addListener(onInstalled);

track('event', {
  eventCategory: 'Extension',
  eventAction: 'activated',
  nonInteraction: true
});

chrome.storage.sync.get([
  'total', 'autoErasing'
], result => {
  total = result.total || 0;
  autoErasing = !!result.autoErasing;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'count') {
    onCount(sender.tab, request.data);
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
    }

    return;
  }

  if (request.action === 'get state') {
    getNorthisms().then(northisms => sendResponse({
      northisms: northisms,
      current: request.data ? counters[request.data.tabId] : undefined,
      total: total,
      autoErasing: autoErasing
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
  updateBadge(counters[activeInfo.tabId] || 0);
  chrome.tabs.sendMessage(activeInfo.tabId, {action: 'toggle erasing', data: {
    autoErasing: autoErasing
  }});
});

chrome.tabs.onRemoved.addListener(tabId => delete counters[tabId]);

function onCount(tab, data) {
  const tabId = tab.id;
  if (data.addCount !== undefined) {
    counters[tabId] += data.addCount;
    total += data.addCount;
    updateCounters(counters[tabId], total, tab.incognito);
    return;
  }

  if (!data.takeIntoAccount && hrefCounters[fnv1a(data.location.href)] === data.initialCount) {
    counters[tabId] = data.initialCount;
    updateCounters(counters[tabId], total, tab.incognito);
    return;
  }

  hrefCounters[fnv1a(data.location.href)] = data.initialCount;
  counters[tabId] = data.initialCount;
  total += data.initialCount;
  updateCounters(counters[tabId], total, tab.incognito);
  return;
}

function updateCounters(current, total, incognito) {
  updateBadge(current);
  chrome.runtime.sendMessage({action: 'update popup counters', data: {
    current: current,
    total: total
  }});
  !incognito && chrome.storage.sync.set({total: total});
}

function updateBadge(count) {
  if (count === 0) {
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

function onInstalled(details) {
  details.reason === 'install' && track('event', {
    eventCategory: 'Extension',
    eventAction: 'installed',
    nonInteraction: true
  });
}
