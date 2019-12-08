(async () => {
  const
    eh = await import('../error-handler.mjs'),
    report = eh.init('popup');

  try {
    await (await import('./content.mjs')).init(eh.capture);
  } catch (e) {
    report(e);
  }
})();
