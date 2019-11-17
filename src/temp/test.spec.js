const { getNumber } = require('esm')(module)('./test.mjs');

describe('Test', () => {
  it('Tests getNumber', () => {
    expect(getNumber()).toBe(42);
  });
});
