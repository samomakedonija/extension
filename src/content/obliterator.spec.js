const fs = require('fs');
const { init, obliterate } = require('esm')(module)('./obliterator.mjs');

describe('obliterator', () => {
  const test = (pattern, replacement) => {
    const spy = {callback: () => {}};
    spyOn(spy, 'callback');
    obliterate(pattern, 'class', spy.callback);
    replacement
      ? expect(spy.callback).toHaveBeenCalledWith(replacement)
      : expect(spy.callback).not.toHaveBeenCalled();
  };

  beforeAll(() => init(JSON.parse(
    fs.readFileSync('src/northisms.json', 'utf8')
  )));

  it('obliterate', () => {
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

  it('obliterate letter case', () => {
    test(
      'СЕВЕРНА МАКЕДОНИЈА',
      '<span class="class">СЕВЕРНА</span> МАКЕДОНИЈА'
    );
  });

  it('obliterate at end', () => {
    test(
      'La Macédoine du Nord',
      'La Macédoine <span class="class">du Nord</span>'
    );

    test(
      'LA MACÉDOINE DU NORD',
      'LA MACÉDOINE <span class="class">DU NORD</span>'
    );
  });

  it('obliterate joined', () => {
    test(
      'Nordmazedonien',
      '<span class="class">Nord</span>Mazedonien'
    );

    test(
      'NORDMAZEDONIEN',
      '<span class="class">NORD</span>MAZEDONIEN'
    );
  });

  xit('obliterate with spaces', () => {
    test(
      'Северна  Македонија',
      '<span class="class">Северна</span>  Македонија'
    );
  });

  xit('obliterate with spans', () => {
    test(
      'Северна<span> </span>Македонија',
      '<span class="class">Северна</span><span> </span>Македонија'
    );
  });

  it('obliterate not needed', () => {
    test();

    test('');

    test('СХ Македонија');

    test('Северна');
  });
});
