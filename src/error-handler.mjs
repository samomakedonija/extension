import { isDevMode, log } from './util.mjs';

const sentryEnabled = true;

function init() {
  window.onunhandledrejection = event => {
    capture(event.reason || event.type);
  };

  sentryEnabled && Sentry.init({dsn: isDevMode()
    ? 'https://4b02098c76054a12a5361e56293b1ea0@sentry.io/1839613'
    : 'https://b45cfd5d890c405fb20bcca3c5c7af46@sentry.io/1834233'
  });
}

function capture(err, context) {
  if (!context) {
    log('error-handler', err) && sentryEnabled && Sentry.captureException(err);
    return;
  }

  const parsedErr = parseErr(err);
  log('error-handler', context, parsedErr) && sentryEnabled && Sentry.withScope(scope => {
    scope.setTag("context", context);
    Sentry.captureException(parsedErr);
  });
}

async function wrap(fn, ...args) {
  try {
    return await fn(...args);
  } catch (e) {
    capture(e);
  }
}

function parseErr(err) {
  try {
    return JSON.parse(err);
  } catch (e) {
    log('parseErr', e);
    return e;
  }
}

export { init, capture, wrap };
