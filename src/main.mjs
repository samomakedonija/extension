import { isDevMode, log } from './util.mjs';
import { getNorthisms } from './northisms.mjs';
import { track } from './analytics.mjs';

let
  _counters = {},
  _tabState = {},
  _eh, _total, _autoErasing, _disabled;

export function init(eh, runtimeInstalled) {
  _eh = eh;

  runtimeInstalled.then(
    eh.wrap.bind(this, onRuntimeInstalled)
  );
  browser.runtime.onMessage.addListener(
    eh.wrap.bind(this, onRuntimeMessage)
  );

  browser.tabs.onActivated.addListener(
    eh.wrap.bind(this, onTabActivated)
  );
  browser.tabs.onRemoved.addListener(
    eh.wrap.bind(this, onTabRemoved)
  );

  browser.browserAction.setBadgeBackgroundColor({color: '#696969'});

  browser.storage.sync.get([
    'total', 'autoErasing', 'disabled'
  ]).then(result => {
    _total = result.total || 0;
    _autoErasing = !!result.autoErasing;
    _disabled = !!result.disabled;
    updateIcon(_disabled);
  });

  track('event', {
    eventCategory: 'Extension',
    eventAction: 'activated',
    nonInteraction: true
  });
}

function onRuntimeInstalled(details) {
  if (details.reason === 'install') {
    return track('event', {
      eventCategory: 'Extension',
      eventAction: 'installed',
      nonInteraction: true
    });
  }

  if (details.reason === 'update' && !isDevMode()) {
    track('event', {
      eventCategory: 'Extension',
      eventAction: 'updated',
      nonInteraction: true
    });
    return browser.tabs.create({url: 'src/update/update.html'});
  }
}

async function onRuntimeMessage(request, sender) {
  if (request.action === 'count') {
    await onCount(_disabled, sender.tab, request.data);
    return;
  }

  if (request.action === 'set state') {
    if (request.data.autoErasing !== undefined) {
      await browser.storage.sync.set({autoErasing: request.data.autoErasing});
      _autoErasing = request.data.autoErasing;
      await updateContentState((
        await browser.tabs.query({active: true, currentWindow: true})
      )[0].id);
      return;
    }

    if (request.data.disabled !== undefined) {
      await browser.storage.sync.set({disabled: request.data.disabled});
      _disabled = request.data.disabled;
      updateIcon(_disabled);
      const tabId = (await browser.tabs.query({active: true, currentWindow: true}))[0].id;
      updateBadge(_counters[tabId], _disabled);
      await updateContentState(tabId);
      return;
    }

    return;
  }

  if (request.action === 'get state') {
    return {
      northisms: await getNorthisms(),
      current: _disabled ? 0 : (request.data ? _counters[request.data.tabId] : undefined),
      total: _total,
      autoErasing: _autoErasing,
      disabled: _disabled
    };
  }

  if (request.action === 'track') {
    track('pageview', '/' + request.data.page);
    return;
  }

  if (request.action === 'is dev mode') {
    return isDevMode();
  }

  if (request.action === 'capture error') {
    _eh.capture(request.data.err, request.data.context);
    return;
  }
}

async function onTabActivated(activeInfo) {
  updateBadge(_counters[activeInfo.tabId], _disabled);
  await updateContentState(activeInfo.tabId);
}

function onTabRemoved(tabId) {
  delete _counters[tabId];
  delete _tabState[tabId];
}

async function onCount(disabled, tab, data) {
  const tabId = tab.id;
  if (disabled) {
    delete _tabState[tabId];
    return;
  }

  if (data.addCount !== undefined) {
    _counters[tabId] += data.addCount;
    _total = setNewTotal(_total, data.addCount, tab.incognito, data.location);
    setTabState(tabId, _counters[tabId], data.location.href);
    await updateCounters(_counters[tabId], _total);
    return;
  }

  if (!data.takeIntoAccount || isSameTabState(tabId, data.initialCount, data.location.href)) {
    _counters[tabId] = data.initialCount;
    await updateCounters(_counters[tabId], _total);
    return;
  }

  _counters[tabId] = data.initialCount;
  _total = setNewTotal(_total, data.initialCount, tab.incognito, data.location);
  setTabState(tabId, _counters[tabId], data.location.href);
  await updateCounters(_counters[tabId], _total);
}

function setTabState(tabId, count, href) {
  _tabState[tabId] = {href: href, count: count};
}

function isSameTabState(tabId, count, href) {
  const state = _tabState[tabId];
  if (!state) {
    return false;
  }

  return state.count === count && state.href === href;
}

function setNewTotal(total, count, incognito, location) {
  const newTotal = total + count;
  !incognito && browser.storage.sync.set({total: newTotal});
  return newTotal;
}

async function updateContentState(tabId) {
  try {
    await browser.tabs.sendMessage(tabId, {action: 'update content state', data: {
      disabled: _disabled,
      autoErasing: _autoErasing
    }});
  } catch(_) {
    // Ignore, new/empty tab.
  }
}

async function updateCounters(current, total) {
  updateBadge(current, _disabled);
  if (!browser.extension.getViews({type: 'popup'}).length) {
    return;
  }

  await browser.runtime.sendMessage({action: 'update popup counters', data: {
    current: current,
    total: total
  }});
}

function updateBadge(count, disabled) {
  browser.browserAction.setBadgeText({
    text: !count || disabled ? '' : count.toString()
  });
}

function updateIcon(disabled) {
  const suffix = disabled ? '_disabled' : '';
  browser.browserAction.setIcon({path: {
    16: `assets/toolbar_icon16${suffix}.png`,
    32: `assets/toolbar_icon32${suffix}.png`,
    48: `assets/toolbar_icon48${suffix}.png`,
    128: `assets/toolbar_icon128${suffix}.png`
  }});
}
