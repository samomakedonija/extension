import { log } from '../util.mjs';

getChangelog().then(changelog => document.getElementById('changelog').innerHTML = marked(
  changelog
));

async function getChangelog() {
  try {
    return (await fetch('../CHANGELOG_MK.md')).text();
  } catch (e) {
    log('getChangelog', e);
    return '';
  }
}
