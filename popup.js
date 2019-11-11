'use strict';

const
  elCurrent = document.getElementById('own-current-count'),
  elTotal = document.getElementById('own-total-count'),
  elToggleErasing = document.getElementById('toggle-erasing'),
  elToggleExtension = document.getElementById('toggle-extension');

chrome.tabs.query({active: true, currentWindow: true}, tabs => chrome.runtime.sendMessage({
  action: 'get state',
  data: {tabId: tabs[0].id}
}, state => {
  updateCounters(state);
  elToggleErasing.classList.add(state.autoErasing ? 'on': 'off');
  chrome.runtime.onMessage.addListener(
    message => message.action === 'update popup counters' && updateCounters(message.data)
  );
}));

elToggleErasing.addEventListener('click', toggle.bind(this, 'toggle-erasing'));
elToggleExtension.addEventListener('click', toggle.bind(this, 'toggle-extension'));

function toggle(action) {
  if (action === 'toggle-erasing') {
    elToggleErasing.classList.toggle('off');
    chrome.runtime.sendMessage({action: 'set state', data: {
      autoErasing: elToggleErasing.classList.toggle('on')
    }}, () => setTimeout(() => window.close(), 300));
  }
}

function updateCounters(state) {
  elCurrent.textContent = state.current || 0;
  elTotal.textContent = state.total || 0;
}
