import { isDevMode, loadScriptAsync, log } from './util.mjs';

const KEY = 'northisms';

let remoteConfig;

async function fetchRemoteNorthisms(defaultNorthisms) {
  remoteConfig = remoteConfig || (await initRemoteConfig(defaultNorthisms));
  await remoteConfig.fetchAndActivate();
}

function getRemoteNorthisms() {
  try {
    return JSON.parse(remoteConfig.getString(KEY));
  } catch (e) {
    log('getRemoteNorthisms', e);
  }
}

async function initRemoteConfig(defaultNorthisms) {
  const devMode = isDevMode();
  await loadScriptAsync('/vendor/firebase-app.js');
  await loadScriptAsync('/vendor/firebase-remote-config.js');
  const config = firebase.initializeApp(devMode ? {
    apiKey: 'AIzaSyAd64FhgafWl5lZl457MQIEiYWxWvvCpj8',
    projectId: 'samo-makedonija-dev',
    appId: '1:306786047204:web:42c72de833b9dcb3c8c8f1'
  } : {
    apiKey: '',
    projectId: '',
    appId: ''
  }).remoteConfig();
  if (devMode) {
    config.settings = {minimumFetchIntervalMillis: 60 * 60 * 1000};
  }

  config.defaultConfig = {[KEY]: JSON.stringify(defaultNorthisms)};
  return config;
}

export { fetchRemoteNorthisms, getRemoteNorthisms };
