const { replace } = require('esm')(module)('./northisms.mjs');

describe('northisms', () => {
  const test = (pattern, replacement) => expect(
    replace(pattern, 'class')
  ).toBe(replacement);

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

  it('replace with spaces', () => {
    test(
      'Северна  Македонија',
      '<span class="class">Северна</span>  Македонија'
    );
  });

  it('replace with spans', () => {
    test(
      'Северна<span> </span>Македонија',
      '<span class="class">Северна</span><span> </span>Македонија'
    );
  });

  it('replace regex check', () => {
    test(
      'СХ Македонија',
      'СХ Македонија'
    );
  });
});
