let _northisms = [];

function init(northisms) {
  _northisms = northisms || [];
}

function obliterate(s, smClass, callback) {
  if (!s) {
    return;
  }

  const replacement = _northisms.reduce((acc, cur) => acc.replace(
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

  s !== replacement && callback(replacement);
}

export { init, obliterate };
