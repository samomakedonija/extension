(async () => {
  const
    eh = await import('../error-handler.mjs'),
    report = eh.init('popup');

  try {
    await (await import('./popup.mjs')).init(eh.capture);
  } catch (e) {
    report(e);
  }
})();
