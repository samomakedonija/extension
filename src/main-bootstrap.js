(async () => {
  try {
    (await import('./main.mjs')).init();
  } catch (e) {
    console.log('main-bootstrap', e);
  }
})();
