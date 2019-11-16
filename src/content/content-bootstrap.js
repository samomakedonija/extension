(async () => (await import(chrome.extension.getURL('src/content/content.mjs'))).run())();
