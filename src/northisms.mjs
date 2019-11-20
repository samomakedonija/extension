import { fetchRemoteNorthisms, getRemoteNorthisms } from './firebase.mjs';
import { log } from './util.mjs';

const initialized = init();

let northisms;

async function getNorthisms() {
  if (northisms) {
    return northisms;
  }

  await initialized;
  northisms = getRemoteNorthisms();
  return northisms;
}

async function init() {
  try {
    await fetchRemoteNorthisms(
      await (await fetch('northisms.json')).json()
    );
  } catch (e) {
    log('getNorthisms', e);
  }
}

export { getNorthisms };
