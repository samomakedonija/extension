const northisms = [{
  group: 'mk',
  pattern: 'Северна.*Македонија',
  obliterate: 'Северна'
}, {
  group: 'mk',
  pattern: 'С\\. Македонија',
  obliterate: 'С\\.'
}, {
  group: 'mk',
  pattern: 'РСМ',
  obliterate: 'С'
}, {
  group: 'en',
  pattern: 'North Macedonia',
  obliterate: 'North'
}, {
  group: 'fr',
  pattern: 'Macédoine du Nord',
  obliterate: 'du Nord'
}, {
  group: 'de',
  pattern: 'Nordmazedonien',
  obliterate: 'Nord'
}];

function replace(s, smClass) {
  return northisms.reduce((acc, cur) => acc.replace(
    new RegExp(cur.pattern, 'gi'),
    match => {
      if (cur.group === 'de') {
        return match.replace(
          new RegExp(cur.obliterate + 'm', 'gi'),
          submatch => `<span class="${smClass}">${submatch.slice(0, -1)}</span>M`
        );
      }

      return match.replace(
        new RegExp(cur.obliterate, 'gi'),
        submatch => `<span class="${smClass}">${submatch}</span>`
      );
    }
  ), s);
}

export { replace };
