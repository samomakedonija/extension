import { fetchRemoteNorthisms, getRemoteNorthisms } from './firebase.mjs';
import { log } from './util.mjs';

let northisms;

async function getNorthisms() {
  if (northisms) {
    return northisms;
  }

  try {
    await fetchRemoteNorthisms(
      await (await fetch('northisms.json')).json()
    );
  } catch (e) {
    log('getNorthisms', e);
  }

  northisms = getRemoteNorthisms();
  return northisms;
}

export { getNorthisms };
