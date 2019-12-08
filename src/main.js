(async () => {
  const
    runtimeStartup = new Promise(
      resolve => browser.runtime.onStartup.addListener(resolve)
    ),
    runtimeInstalled = new Promise(
      resolve => browser.runtime.onInstalled.addListener(resolve)
    ),
    eh = await import('./error-handler.mjs'),
    report = eh.init();

  try {
    await (await import('./main.mjs')).init(
      eh.capture, report, runtimeStartup, runtimeInstalled
    );
  } catch (e) {
    report(e);
  }
})();
