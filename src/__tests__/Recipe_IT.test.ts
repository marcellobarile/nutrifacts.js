import NutrifactsJs, { IInputIngredient, IRecipeResult } from '..';
import { INutrient } from '../models/sql/models';

process.env.LANG = 'IT';
const lib = new NutrifactsJs();

test('Get nutrients by query (NLP)', async () => {
  const nutrients: INutrient[] | undefined = await lib.getNutrientsByQuery('beta carotene');
  expect(nutrients).not.toBeUndefined();
  if (nutrients && nutrients[0]) {
    expect(nutrients[0]).toHaveProperty('id', '32');
  } else {
    throw new Error('fail');
  }
});

test('Get nutrients in recipe (strict)', async () => {
  const recipe: IInputIngredient[] = [{ label: 'zucchero', quantity: 20 }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
  expect(result).toHaveProperty('totals');
  expect(result).toHaveProperty('matches');
  if (result && result.matches && result.matches['zucchero'] && result.matches['zucchero'][0]) {
    expect(result.matches['zucchero'][0]).toHaveProperty('id', '974');
  } else {
    throw new Error('fail');
  }
});

test('Get nutrients in recipe - simple string (NLP)', async () => {
  const recipe: IInputIngredient[] = [{ recipeStr: '20gr di zucchero semolato' }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
  expect(result).toHaveProperty('totals');
  expect(result).toHaveProperty('matches');
  if (result && result.matches && result.matches['zucchero semolato'] && result.matches['zucchero semolato'][0]) {
    expect(result.matches['zucchero semolato'][0]).toHaveProperty('id', '974');
  } else {
    throw new Error('fail');
  }
});

test('Get nutrients in recipe - simple string w/ liter units (NLP)', async () => {
  const recipe: IInputIngredient[] = [{ recipeStr: '2 lt di latte scremato uht' }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
  expect(result).toHaveProperty('totals');
  expect(result).toHaveProperty('matches');
  if (result && result.matches && result.matches['latte scremato uht'] && result.matches['latte scremato uht'][0]) {
    expect(result.matches['latte scremato uht'][0]).toHaveProperty('id', '471');
  } else {
    throw new Error('fail');
  }
});

test('Get nutrients in recipe - simple string w/ approximated units (NLP)', async () => {
  const recipe: IInputIngredient[] = [{ recipeStr: '1 cucchiaino di sale' }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
  expect(result).toHaveProperty('totals');
  expect(result).toHaveProperty('matches');
  if (result && result.matches && result.matches['sale'] && result.matches['sale'][0]) {
    expect(result.matches['sale'][0]).toHaveProperty('id', '770');
  } else {
    throw new Error('fail');
  }
});

test('Get nutrients in recipe - simple string w/ human readable units (NLP)', async () => {
  const recipe: IInputIngredient[] = [{ recipeStr: 'un pugno di sale' }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
  expect(result).toHaveProperty('totals');
  expect(result).toHaveProperty('matches');
  if (result && result.matches && result.matches['sale'] && result.matches['sale'][0]) {
    expect(result.matches['sale'][0]).toHaveProperty('id', '770');
  } else {
    throw new Error('fail');
  }
});

test('Get nutrients in recipe - simple string w/ unknown units (NLP)', async () => {
  const recipe: IInputIngredient[] = [{ recipeStr: 'sale q.b.' }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
  expect(result).toHaveProperty('unknown');
});

test('Get nutrients in recipe - simple string w/ mixed fraction (NLP)', async () => {
  const recipe: IInputIngredient[] = [{ recipeStr: '2 e 1/2 lt di olio' }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
  if (result && result.matches && result.matches['olio'] && result.matches['olio'][0]) {
    expect(result.matches['olio'][0]).toHaveProperty('id', '562');
    expect(result.matches['olio'][0]).toHaveProperty('quantity', 2500);
  } else {
    throw new Error('fail');
  }
});

test('Get nutrients in recipe - simple string w/ fraction (NLP)', async () => {
  const recipe: IInputIngredient[] = [{ recipeStr: '1/2 kg di farina di riso' }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
  if (result && result.matches && result.matches['farina di riso'] && result.matches['farina di riso'][0]) {
    expect(result.matches['farina di riso'][0]).toHaveProperty('id', '327');
    expect(result.matches['farina di riso'][0]).toHaveProperty('quantity', 500);
  } else {
    throw new Error('fail');
  }
});

test('Get nutrients in recipe - simple string w/ fraction symbol (NLP)', async () => {
  const recipe: IInputIngredient[] = [{ recipeStr: '½ kg di farina di riso' }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
  if (result && result.matches && result.matches['farina di riso'] && result.matches['farina di riso'][0]) {
    expect(result.matches['farina di riso'][0]).toHaveProperty('id', '327');
    expect(result.matches['farina di riso'][0]).toHaveProperty('quantity', 500);
  } else {
    throw new Error('fail');
  }
});

test('Get nutrients in recipe - list of ingredients (NLP) w/ unknown foods', async() => {
  const ingredients: IInputIngredient[] = [
    {
      recipeStr: '320g spaghetti',
    },
    {
      recipeStr: '6 tuorli d\'uovo',
    },
    {
      recipeStr: 'q.b. sale',
    },
    {
      recipeStr: '150g guanciale',
    },
    {
      recipeStr: '50g pecorino romano',
    },
    {
      recipeStr: 'q.b. pepe nero',
    }
  ];
  const result = await lib.getNutrientsInRecipe(ingredients);
  expect(result).not.toBeUndefined();
  expect(result.unknown).not.toBeUndefined();
});