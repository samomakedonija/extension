(async () => {
  const eh = await import('./error-handler.mjs');
  eh.init();

  try {
    (await import('./main.mjs')).init(eh);
  } catch (e) {
    eh.capture(e);
  }
})();
