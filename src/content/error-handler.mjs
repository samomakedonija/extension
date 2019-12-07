let _context;

function init(context) {
  _context = context;
  window.onunhandledrejection = event => {
    capture(event.reason || event.type);
  };
}

function capture(err) {
  browser.runtime.sendMessage({action: 'capture error', data: {
    context: _context,
    err: JSON.stringify(err, Object.getOwnPropertyNames(err))
  }});
}

async function wrap(fn, ...args) {
  try {
    return await fn(...args);
  } catch (e) {
    capture(e);
  }
}

export { init, capture, wrap };
