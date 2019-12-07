(async () => {
  const
    runtimeStartup = new Promise(
      resolve => browser.runtime.onStartup.addListener(resolve)
    ),
    runtimeInstalled = new Promise(
      resolve => browser.runtime.onInstalled.addListener(resolve)
    );

  const eh = await import('./error-handler.mjs');
  eh.init();

  try {
    await (await import('./main.mjs')).init(
      eh, runtimeStartup, runtimeInstalled
    );
  } catch (e) {
    eh.capture(e);
  }
})();
