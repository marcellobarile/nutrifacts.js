import NutrifactsJs, { IInputIngredient, IRecipeResult } from '..';
import { INutrient } from '../models/sql/models';

process.env.LANG = 'EN';
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
  const recipe: IInputIngredient[] = [{ label: 'sugar', quantity: 20 }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
  expect(result).toHaveProperty('totals');
  expect(result).toHaveProperty('matches');
  if (result && result.matches && result.matches['sugar'] && result.matches['sugar'][0]) {
    expect(result.matches['sugar'][0]).toHaveProperty('id', '974');
  } else {
    throw new Error('fail');
  }
});

test('Checks sum health ratio with unhealthy nutrient (strict)', async () => {
  const recipe: IInputIngredient[] = [{ label: 'sugar', quantity: 1000 }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
  expect(result).toHaveProperty('totals');
  expect(result).toHaveProperty('matches');
  if (result && result.matches) {
    expect(result.sum_health_ratio).toBeGreaterThanOrEqual(1);
  } else {
    throw new Error('fail');
  }
});

test('Checks sum health ratio with (extreme) unhealthy recipe (strict)', async () => {
  const recipe: IInputIngredient[] = [
    { label: 'meat', quantity: 500 },
    { label: 'mozzarella', quantity: 600 },
    { label: 'pasta', quantity: 320 },
  ];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
  expect(result).toHaveProperty('totals');
  expect(result).toHaveProperty('matches');
  if (result && result.matches) {
    expect(result.sum_health_ratio).toBeGreaterThanOrEqual(50);
  } else {
    throw new Error('fail');
  }
});

test('Get nutrients in recipe - simple string (NLP)', async () => {
  const recipe: IInputIngredient[] = [{ recipeStr: '20gr of sugar' }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
  expect(result).toHaveProperty('totals');
  expect(result).toHaveProperty('matches');
  if (result && result.matches && result.matches['sugar'] && result.matches['sugar'][0]) {
    expect(result.matches['sugar'][0]).toHaveProperty('id', '974');
  } else {
    throw new Error('fail');
  }
});

test('Get nutrients in recipe - simple string w/ liter units (NLP)', async () => {
  const recipe: IInputIngredient[] = [{ recipeStr: '2 l of soya milk' }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
  expect(result).toHaveProperty('totals');
  expect(result).toHaveProperty('matches');
  if (result && result.matches && result.matches['soya milk'] && result.matches['soya milk'][0]) {
    expect(result.matches['soya milk'][0]).toHaveProperty('id', '425');
  } else {
    console.log(JSON.stringify(result, null, 2));
    throw new Error('fail');
  }
});

test('Get nutrients in recipe - simple string w/ approximated units (NLP)', async () => {
  const recipe: IInputIngredient[] = [{ recipeStr: '1 spoon of cooking salt' }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
  expect(result).toHaveProperty('totals');
  expect(result).toHaveProperty('matches');
  if (result && result.matches && result.matches['cooking salt'] && result.matches['cooking salt'][0]) {
    expect(result.matches['cooking salt'][0]).toHaveProperty('id', '770');
  } else {
    throw new Error('fail');
  }
});

test('Get nutrients in recipe - simple string w/ human readable units (NLP)', async () => {
  const recipe: IInputIngredient[] = [{ recipeStr: 'a cup of cooking salt' }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
  expect(result).toHaveProperty('totals');
  expect(result).toHaveProperty('matches');
  if (result && result.matches && result.matches['cooking salt'] && result.matches['cooking salt'][0]) {
    expect(result.matches['cooking salt'][0]).toHaveProperty('id', '770');
  } else {
    throw new Error('fail');
  }
});

test('Get nutrients in recipe - simple string w/ mixed fraction (NLP)', async () => {
  const recipe: IInputIngredient[] = [{ recipeStr: '2 and 1/2 l of olive oil' }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
  if (result && result.matches && result.matches['olive oil'] && result.matches['olive oil'][0]) {
    expect(result.matches['olive oil'][0]).toHaveProperty('id', '548');
    expect(result.matches['olive oil'][0]).toHaveProperty('quantity', 2500);
  } else {
    throw new Error('fail');
  }
});

test('Get nutrients in recipe - simple string w/ mixed fraction (NLP)', async () => {
  const recipe: IInputIngredient[] = [{ recipeStr: '2 and 1/2 l of oil' }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
  if (result && result.matches && result.matches['oil'] && result.matches['oil'][0]) {
    expect(result.matches['oil'][0]).toHaveProperty('id', '562');
    expect(result.matches['oil'][0]).toHaveProperty('quantity', 2500);
  } else {
    throw new Error('fail');
  }
});

test('Get nutrients in recipe - simple string w/ fraction (NLP)', async () => {
  const recipe: IInputIngredient[] = [{ recipeStr: '1/2 kg of rice flour' }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
});

test('Get nutrients in recipe - simple string w/ fraction symbol (NLP)', async () => {
  const recipe: IInputIngredient[] = [{ recipeStr: '½ kg of rice flour' }];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  expect(result).not.toBeUndefined();
});
