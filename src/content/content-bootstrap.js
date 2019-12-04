(async () => {
  const eh = await import('./error-handler.mjs');
  eh.init('content');

  try {
    await (await import('./content.mjs')).init(eh);
  } catch (e) {
    eh.capture(e);
  }
})();
