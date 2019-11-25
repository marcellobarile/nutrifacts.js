import NutrifactsJs, { IInputIngredient, IRecipeResult } from '..';
import fs from 'fs';

process.env.LANG = 'EN';
const lib = new NutrifactsJs();

test('Extract info', async () => {
  // All the quantities are in grams
  const recipe: IInputIngredient[] = [
    { label: 'lean beef', quantity: 420 },
    { label: 'hen\'s egg, whole', quantity: 50 },
    { label: 'onion', quantity: 2 },
    { label: 'garlic', quantity: 2 },
    { label: 'cooking salt', quantity: 2 },
    { label: 'pepper', quantity: 1 },
    { label: 'whole grain bread', quantity: 80 },
    { label: 'mayonnaise', quantity: 5 },
    { label: 'tomato sauce', quantity: 5 }, // ketchup was not matching
    { label: 'lettuce', quantity: 20 },
    { label: 'tomato', quantity: 5 },
  ];
  const result: IRecipeResult = await lib.getNutrientsInRecipe(recipe);
  
  expect(result).not.toBeUndefined();
  expect(result).toHaveProperty('totals');
  expect(result).toHaveProperty('matches');
  
  if (result && result.matches) {
    expect(result.sum_health_ratio).toBeGreaterThanOrEqual(25);
  } else {
    throw new Error('fail');
  }
});