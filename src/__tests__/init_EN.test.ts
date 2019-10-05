import NutrifactsJs from '..';

process.env.LANG = 'EN';

const libIt = new NutrifactsJs();

test('Init library [EN]', async () => {
  expect(libIt);
});
