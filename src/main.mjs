import { isDevMode } from './util.mjs';
import { track } from './analytics.mjs';

const northisms = [{
  group: 'mk',
  pattern: 'Северна.*Македонија',
  obliterate: 'Северна'
}, {
  group: 'mk',
  pattern: 'С\\. Македонија',
  obliterate: 'С\\.'
}, {
  group: 'mk',
  pattern: 'РСМ',
  obliterate: 'С'
}, {
  group: 'en',
  pattern: 'North Macedonia',
  obliterate: 'North'
}, {
  group: 'fr',
  pattern: 'Macédoine du Nord',
  obliterate: 'du Nord'
}, {
  group: 'de',
  pattern: 'Nordmazedonien',
  obliterate: 'Nord'
}];

let
  counters = {},
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
    const
      tabId = sender.tab.id,
      data = request.data;
    if (data.initialCount !== undefined) {
      counters[tabId] = data.initialCount;
      total += data.initialCount;
    } else {
      counters[tabId] += data.addCount;
      total += data.addCount;
    }

    updateBadge(counters[tabId]);
    chrome.runtime.sendMessage({action: 'update popup counters', data: {
      current: counters[tabId],
      total: total
    }});
    !sender.tab.incognito && chrome.storage.sync.set({total: total});
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
    return sendResponse({
      northisms: northisms,
      current: request.data ? counters[request.data.tabId] : undefined,
      total: total,
      autoErasing: autoErasing
    });
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
