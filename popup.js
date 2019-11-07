'use strict';

function toggle() {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => chrome.tabs.sendMessage(
    tabs[0].id, {action: 'toggleDisplay'}
  ));
}

document.getElementById('toggle').addEventListener('click', toggle);
