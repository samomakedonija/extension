import { isDevMode, log } from './util.mjs';

const sentryEnabled = true;

let _context;

function init(context) {
  if (context) {
    _context = context;
  }

  window.onunhandledrejection = event => {
    report(event.reason || event.type);
  };

  !_context && sentryEnabled && Sentry.init({dsn: isDevMode()
    ? 'https://4b02098c76054a12a5361e56293b1ea0@sentry.io/1839613'
    : 'https://b45cfd5d890c405fb20bcca3c5c7af46@sentry.io/1834233'
  });

  return report;
}

async function capture(fn, ...args) {
  try {
    return await fn(...args);
  } catch (e) {
    report(e);
  }
}

async function report(err, context) {
  if (_context) {
    browser.runtime.sendMessage({action: 'report error', data: {
      context: _context,
      err: JSON.stringify(err, Object.getOwnPropertyNames(err))
    }});
    return;
  }

  const url = ((
    await browser.tabs.query({active: true, currentWindow: true})
  )[0] || {}).url;
  if (!context) {
    log('error-handler', url, err) && sentryEnabled && Sentry.withScope(scope => {
      url && scope.setExtra('url', url);
      Sentry.captureException(err);
    });
    return;
  }

  const parsedErr = parseErr(err);
  log('error-handler', context, url, parsedErr) && sentryEnabled && Sentry.withScope(scope => {
    scope.setTag('context', context);
    url && scope.setExtra('url', url);
    Sentry.captureException(parsedErr);
  });
}

function parseErr(err) {
  try {
    return JSON.parse(err);
  } catch (e) {
    log('parseErr', e);
    return e;
  }
}

export { init, capture, report };
