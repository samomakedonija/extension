const { init, replace } = require('esm')(module)('./northisms.mjs');

describe('northisms', () => {
  const test = (pattern, replacement) => {
    const spy = {callback: () => {}};
    spyOn(spy, 'callback');
    replace(pattern, 'class', spy.callback);
    replacement
      ? expect(spy.callback).toHaveBeenCalledWith(replacement)
      : expect(spy.callback).not.toHaveBeenCalled();
  };

  beforeAll(() => init([{
    group: 'mk',
    pattern: 'Северна Македонија',
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
  }]));

  it('replace', () => {
    test(
      'Северна Македонија',
      '<span class="class">Северна</span> Македонија'
    );

    test(
      'С. Македонија',
      '<span class="class">С.</span> Македонија'
    );

    test(
      'РСМ',
      'Р<span class="class">С</span>М'
    );

    test(
      'North Macedonia',
      '<span class="class">North</span> Macedonia'
    );

    test(
      'North Macedonians',
      '<span class="class">North</span> Macedonians'
    );
  });

  it('replace letter case', () => {
    test(
      'СЕВЕРНА МАКЕДОНИЈА',
      '<span class="class">СЕВЕРНА</span> МАКЕДОНИЈА'
    );
  });

  it('replace at end', () => {
    test(
      'La Macédoine du Nord',
      'La Macédoine <span class="class">du Nord</span>'
    );

    test(
      'LA MACÉDOINE DU NORD',
      'LA MACÉDOINE <span class="class">DU NORD</span>'
    );
  });

  it('replace joined', () => {
    test(
      'Nordmazedonien',
      '<span class="class">Nord</span>Mazedonien'
    );

    test(
      'NORDMAZEDONIEN',
      '<span class="class">NORD</span>MAZEDONIEN'
    );
  });

  xit('replace with spaces', () => {
    test(
      'Северна  Македонија',
      '<span class="class">Северна</span>  Македонија'
    );
  });

  xit('replace with spans', () => {
    test(
      'Северна<span> </span>Македонија',
      '<span class="class">Северна</span><span> </span>Македонија'
    );
  });

  it('replace not needed', () => {
    test();

    test('');

    test('СХ Македонија');

    test('Северна');
  });
});
