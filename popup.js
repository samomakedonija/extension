'use strict';

function sendMessage(action) {
  chrome.tabs.query(
    {active: true, currentWindow: true},
    tabs => chrome.tabs.sendMessage(tabs[0].id, {action: action})
  );
}

document.getElementById(
  'toggle-erasing'
).addEventListener('click', sendMessage.bind(this, 'toggle-erasing'));

document.getElementById(
  'toggle-extension'
).addEventListener('click', sendMessage.bind(this, 'toggle-extension'));
