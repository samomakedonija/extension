const context = 'popup';

(async () => {
  const
    eh = await import('../error-handler.mjs'),
    report = eh.init(context);

  try {
    await (await import(`./${context}.mjs`)).init(eh.capture);
  } catch (e) {
    report(e);
  }
})();
