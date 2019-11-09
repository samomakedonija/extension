let
  counters = {},
  total = 0;

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
    return;
  }

  if (request.action === 'get counters for tab') {
    return sendResponse({
      current: counters[request.data.tabId],
      total: total
    });
  }
});

chrome.tabs.onActivated.addListener(
  activeInfo => updateBadge(counters[activeInfo.tabId] || 0)
);

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
