const
  elCurrent = document.getElementById('own-current-count'),
  elTotal = document.getElementById('own-total-count'),
  elToggleErasing = document.getElementById('toggle-erasing'),
  elToggleExtension = document.getElementById('toggle-extension');

export function init(eh) {
  elToggleErasing.addEventListener('click', eh.wrap.bind(this, toggleErasing));
  elToggleExtension.addEventListener('click', eh.wrap.bind(this, toggleExtension));
  chrome.runtime.onMessage.addListener(
    eh.wrap.bind(this, onRuntimeMessage)
  );

  chrome.tabs.query({active: true, currentWindow: true}, tabs => chrome.runtime.sendMessage({
    action: 'get state',
    data: {tabId: tabs[0].id}
  }, eh.wrap.bind(this, onGetState)));

  chrome.runtime.sendMessage({action: 'track', data: {page: 'popup'}});
}

function onRuntimeMessage(message) {
  if (message.action === 'update popup counters') {
    updateCounters(message.data);
  }
}

function onGetState(state) {
  elToggleErasing.classList.add(state.autoErasing ? 'on': 'off');
  elToggleExtension.classList.add(state.disabled ? 'on': 'off');
  state.disabled && toggleAffectedByDisable();
  updateCounters(state);
}

function toggleErasing() {
  elToggleErasing.classList.toggle('off');
  chrome.runtime.sendMessage({action: 'set state', data: {
    autoErasing: elToggleErasing.classList.toggle('on')
  }}, () => setTimeout(() => window.close(), 300));
}

function toggleExtension() {
  elToggleExtension.classList.toggle('off');
  chrome.runtime.sendMessage({action: 'set state', data: {
    disabled: elToggleExtension.classList.toggle('on')
  }}, () => setTimeout(() => window.close(), 300));
}

function toggleAffectedByDisable() {
  document.body.querySelectorAll('[data-affected-by-disable]').forEach(
    node => node.classList.toggle('disabled')
  );
}

function updateCounters(state) {
  elCurrent.textContent = state.current || 0;
  elTotal.textContent = state.total || 0;
}
