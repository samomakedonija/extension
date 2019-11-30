import { isDevMode, loadScriptAsync, log } from './util.mjs';

const analytics = init(isDevMode());

async function track(hitType, ...args) {
  (await analytics)('send', hitType, ...args);
  log('analytics.track', hitType, ...args);
  return true;
}

async function init(devMode) {
  await loadScriptAsync('/vendor/analytics.js');
  window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
  ga('create', `UA-152073013-${devMode ? 2 : 1}`, 'auto');
  ga('set', 'checkProtocolTask', null); // Disable file protocol checking.
  return ga;
}

export { track };
