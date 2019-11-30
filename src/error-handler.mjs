import { log } from './util.mjs';

function init() {
  window.onunhandledrejection = event => {
    capture(event.reason || event.type);
  };
}

function capture(err, context) {
  if (context) {
    log('error-handler', context, parseErr(err));
    return;
  }

  log('error-handler', err);
}

function wrap(fn, ...args) {
  try {
    return fn(...args);
  } catch (e) {
    capture(e);
  }
}

function parseErr(err) {
  try {
    return JSON.parse(err);
  } catch (e) {
    log('parseErr', e);
  }
}

export { init, capture, wrap };
