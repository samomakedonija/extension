import { isDevMode, loadScriptAsync } from './util.mjs';

const config = init(isDevMode());

async function getConfig() {
  try {
    await (await config).fetchAndActivate();
    console.log('getValue', (await config).getValue('test').asString());
  } catch (e) {
    console.error('getConfig', e);
  }
}

async function init(devMode) {
  await loadScriptAsync('vendor/firebase-app.7.4.0.js');
  await loadScriptAsync('vendor/firebase-remote-config.7.4.0.js');
  const config = firebase.initializeApp(devMode ? {
    apiKey: 'AIzaSyAd64FhgafWl5lZl457MQIEiYWxWvvCpj8',
    projectId: 'samo-makedonija-dev',
    appId: '1:306786047204:web:42c72de833b9dcb3c8c8f1'
  } : {
    apiKey: '',
    projectId: '',
    appId: ''
  }).remoteConfig();
  config.settings = {minimumFetchIntervalMillis: 60 * 60 * 1000};
  return config;
}

export { getConfig };
