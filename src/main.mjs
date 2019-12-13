import { isDevMode, log } from './util.mjs';
import { getNorthisms } from './northisms.mjs';
import { track } from './analytics.mjs';
import * as badge from './badge.mjs';
import * as eh from './error-handler.mjs';

const { Subject } = rxjs;

const
  _tabNorthismsCount = new Subject(),
  _extensionToggle = new Subject();

let
  _counters = {},
  _tabState = {},
  _total, _autoErasing, _disabled;

eh.init();
eh.capture(init.bind(
  this,
  new Promise(resolve => browser.runtime.onStartup.addListener(resolve)),
  new Promise(resolve => browser.runtime.onInstalled.addListener(resolve))
));

function init(runtimeStartup, runtimeInstalled) {
  badge.init(eh.capture, _tabNorthismsCount, _extensionToggle);

  runtimeStartup.then(
    eh.capture.bind(this, onRuntimeStartup)
  );
  runtimeInstalled.then(
    eh.capture.bind(this, onRuntimeInstalled)
  );
  browser.runtime.onMessage.addListener(
    eh.capture.bind(this, onRuntimeMessage)
  );

  browser.tabs.onActivated.addListener(
    eh.capture.bind(this, onTabActivated)
  );
  browser.tabs.onRemoved.addListener(
    eh.capture.bind(this, onTabRemoved)
  );

  browser.storage.sync.get([
    'total', 'autoErasing', 'disabled'
  ]).then(result => {
    _total = result.total || 0;
    _autoErasing = !!result.autoErasing;
    _disabled = !!result.disabled;
    _extensionToggle.next(!_disabled);
  });
}

function onRuntimeStartup() {
  track('event', {
    eventCategory: 'Extension',
    eventAction: 'activated',
    nonInteraction: true
  });
}

async function onRuntimeInstalled(details) {
  if (details.reason === 'install') {
    return track('event', {
      eventCategory: 'Extension',
      eventAction: 'installed',
      nonInteraction: true
    });
  }

  if (details.reason === 'update' && !isDevMode()) {
    const shownId = await browser.notifications.create({
      type: 'basic',
      iconUrl: 'assets/toolbar_icon128.png',
      title: 'Само Македонија ' + browser.runtime.getManifest().version,
      message: 'За повеќе информации за надградената верзија притиснете тука.'
    });
    browser.notifications.onClicked.addListener(eh.capture.bind(this, id => {
      if (id !== shownId) return;
      browser.notifications.clear(id);
      browser.tabs.create({url: 'src/update/update.html'});
    }));
    track('event', {
      eventCategory: 'Extension',
      eventAction: 'updated',
      nonInteraction: true
    });
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
      _extensionToggle.next(!_disabled);
      const tabId = (await browser.tabs.query({active: true, currentWindow: true}))[0].id;
      _tabNorthismsCount.next({
        tabId: tabId, count: _counters[tabId]
      });
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

  if (request.action === 'report error') {
    eh.report(request.data.err, request.data.context);
    return;
  }
}

async function onTabActivated(activeInfo) {
  const tabId = activeInfo.tabId;
  _tabNorthismsCount.next({
    tabId: tabId, count: _counters[tabId]
  });
  await updateContentState(tabId);
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
    await updateCounters(tabId, _counters[tabId], _total);
    return;
  }

  if (!data.takeIntoAccount || isSameTabState(tabId, data.initialCount, data.location.href)) {
    _counters[tabId] = data.initialCount;
    await updateCounters(tabId, _counters[tabId], _total);
    return;
  }

  _counters[tabId] = data.initialCount;
  _total = setNewTotal(_total, data.initialCount, tab.incognito, data.location);
  setTabState(tabId, _counters[tabId], data.location.href);
  await updateCounters(tabId, _counters[tabId], _total);
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

async function updateCounters(tabId, current, total) {
  _tabNorthismsCount.next({
    tabId: tabId, count: current
  });
  if (!browser.extension.getViews({type: 'popup'}).length) {
    return;
  }

  await browser.runtime.sendMessage({action: 'update popup counters', data: {
    current: current,
    total: total
  }});
}
