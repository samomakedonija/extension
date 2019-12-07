(async () => {
  const runtimeInstalled = new Promise(
    resolve => browser.runtime.onInstalled.addListener(resolve)
  );

  const eh = await import('./error-handler.mjs');
  eh.init();

  try {
    await (await import('./main.mjs')).init(eh, runtimeInstalled);
  } catch (e) {
    eh.capture(e);
  }
})();
