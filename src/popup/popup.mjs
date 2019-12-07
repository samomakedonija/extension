const
  elCurrent = document.getElementById('own-current-count'),
  elTotal = document.getElementById('own-total-count'),
  elToggleErasing = document.getElementById('toggle-erasing'),
  elToggleExtension = document.getElementById('toggle-extension');

export async function init(eh) {
  elToggleErasing.addEventListener('click', eh.wrap.bind(this, toggleErasing));
  elToggleExtension.addEventListener('click', eh.wrap.bind(this, toggleExtension));
  browser.runtime.onMessage.addListener(
    eh.wrap.bind(this, onRuntimeMessage)
  );

  handleState(
    await browser.runtime.sendMessage({action: 'get state', data: {
      tabId: (await browser.tabs.query({active: true, currentWindow: true}))[0].id
    }})
  );

  browser.runtime.sendMessage({action: 'track', data: {page: 'popup'}});
}

function onRuntimeMessage(message) {
  if (message.action === 'update popup counters') {
    updateCounters(message.data);
  }
}

function handleState(state) {
  elToggleErasing.classList.add(state.autoErasing ? 'on': 'off');
  elToggleExtension.classList.add(state.disabled ? 'on': 'off');
  state.disabled && toggleAffectedByDisable();
  updateCounters(state);
}

async function toggleErasing() {
  elToggleErasing.classList.toggle('off');
  await browser.runtime.sendMessage({action: 'set state', data: {
    autoErasing: elToggleErasing.classList.toggle('on')
  }});
  setTimeout(() => window.close(), 300);
}

async function toggleExtension() {
  elToggleExtension.classList.toggle('off');
  await browser.runtime.sendMessage({action: 'set state', data: {
    disabled: elToggleExtension.classList.toggle('on')
  }});
  setTimeout(() => window.close(), 300);
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
