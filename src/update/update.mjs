import { log } from '../util.mjs';

export async function init() {
  document.getElementById('changelog').innerHTML = marked(
    await getChangelog()
  );
}

async function getChangelog() {
  try {
    return (await fetch('../CHANGELOG_MK.md')).text();
  } catch (e) {
    log('getChangelog', e);
    return '';
  }
}
