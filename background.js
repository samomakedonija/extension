const counters = {};

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.count !== undefined) {
    counters[sender.tab.id] = message.count;
    updateBadge(message.count);
  }
});

chrome.tabs.onActivated.addListener(
  activeInfo => updateBadge(counters[activeInfo.tabId] || 0)
);

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
