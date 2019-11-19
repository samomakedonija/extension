import { log } from './util.mjs';

let northisms;

async function getNorthisms() {
  if (northisms) {
    return northisms;
  }

  try {
    northisms = (await fetch('northisms.json')).json();
  } catch (e) {
    log('getNorthisms', e);
  }

  return northisms;
}

export { getNorthisms };
