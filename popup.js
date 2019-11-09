'use strict';

const
  elCurrent = document.getElementById('own-current-count'),
  elTotal = document.getElementById('own-total-count');

chrome.tabs.query({active: true, currentWindow: true}, tabs => chrome.runtime.sendMessage({
  action: 'get counters for tab',
  data: {tabId: tabs[0].id}
}, counters => {
  updateCounters(counters);
  chrome.runtime.onMessage.addListener(
    message => message.action === 'update popup counters' && updateCounters(message.data)
  );
}));

document.getElementById(
  'toggle-erasing'
).addEventListener('click', sendMessage.bind(this, 'toggle-erasing'));

document.getElementById(
  'toggle-extension'
).addEventListener('click', sendMessage.bind(this, 'toggle-extension'));

function sendMessage(action) {
  chrome.tabs.query(
    {active: true, currentWindow: true},
    tabs => chrome.tabs.sendMessage(tabs[0].id, {action: action})
  );
}

function updateCounters(counters) {
  elCurrent.textContent = counters.current || 0;
  elTotal.textContent = counters.total || 0;
}
