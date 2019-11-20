import { isDevMode, log } from './util.mjs';

const KEY = 'northisms';

let remoteConfig;

async function fetchRemoteNorthisms(defaultNorthisms) {
  remoteConfig = remoteConfig || initRemoteConfig(defaultNorthisms);
  await remoteConfig.fetchAndActivate();
}

function getRemoteNorthisms() {
  try {
    return JSON.parse(remoteConfig.getString(KEY));
  } catch (e) {
    log('getRemoteNorthisms', e);
  }
}

function initRemoteConfig(defaultNorthisms) {
  const
    devMode = isDevMode(),
    config = firebase.initializeApp(devMode ? {
      apiKey: 'AIzaSyAd64FhgafWl5lZl457MQIEiYWxWvvCpj8',
      projectId: 'samo-makedonija-dev',
      appId: '1:306786047204:web:42c72de833b9dcb3c8c8f1'
    } : {
      apiKey: 'AIzaSyCOj5kRi5dwjs6gVh-dGEgdoMp12qdyy6M',
      projectId: 'samo-makedonija',
      appId: '1:916566706161:web:9d24e6d3e6a55f7a046650'
    }).remoteConfig();
  if (devMode) {
    config.settings = {minimumFetchIntervalMillis: 60 * 60 * 1000};
  }

  config.defaultConfig = {[KEY]: JSON.stringify(defaultNorthisms)};
  return config;
}

export { fetchRemoteNorthisms, getRemoteNorthisms };
