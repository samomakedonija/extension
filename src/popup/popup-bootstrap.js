(async () => {
  const eh = await import('./error-handler.mjs');
  eh.init('popup');

  try {
    (await import('./popup.mjs')).init(eh);
  } catch (e) {
    eh.capture(e);
  }
})();
