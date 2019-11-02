chrome.browserAction.onClicked.addListener(() => chrome.tabs.query(
  {active: true, currentWindow: true},
  tabs => chrome.tabs.sendMessage(
    tabs[0].id,
    {message: 'show_popup'}
  ))
);

chrome.runtime.onMessage.addListener(request => {
  request.count !== undefined && updateBadge(request.count);
});

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
