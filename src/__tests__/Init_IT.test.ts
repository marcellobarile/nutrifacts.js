import NutrifactsJs from '..';

process.env.LANG = 'IT';

const libIt = new NutrifactsJs();

test('Init library [IT]', async () => {
  expect(libIt);
});
