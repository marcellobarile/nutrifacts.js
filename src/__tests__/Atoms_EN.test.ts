import NutrifactsJs, { LOGIC_OPERATOR } from '..';
import { IFood } from '../models/sql/models';

process.env.LANG = 'EN';
const lib = new NutrifactsJs();

test('Get food by ID', async () => {
  const food: IFood | undefined = await lib.getFoodById('3');
  expect(food).not.toBeUndefined();
  expect(food).toHaveProperty('name');
  expect(food).toHaveProperty('nutrients');
});

test('Get foods by ingredients IDs (AND operator)', async () => {
  // 15 = water
  // 18 = calcium
  const foods: IFood[] | undefined = await lib.getFoodsByIngredients([15, 18], LOGIC_OPERATOR.AND);
  expect(foods).toBeUndefined();
});

test('Get foods by ingredients IDs (OR operator)', async () => {
  // 15 = water
  // 18 = calcium
  const foods: IFood[] | undefined = await lib.getFoodsByIngredients([15, 18], LOGIC_OPERATOR.OR);
  expect(foods).not.toBeUndefined();
});

test('Get food by query w/o nutrients (NLP)', async () => {
  const food: IFood | undefined = await lib.getFoodByQuery('mango pulp', false);
  expect(food).not.toBeUndefined();
  expect(food).toHaveProperty('name', 'mango');
  expect(food).not.toHaveProperty('nutrients');
});

test('Get food by query w/ nutrients (NLP)', async () => {
  const food: IFood | undefined = await lib.getFoodByQuery('tomato sauce', true);
  expect(food).not.toBeUndefined();
  expect(food).toHaveProperty('name', 'tomato, preserve (dry substance 30%)');
  expect(food).toHaveProperty('nutrients');
});

test('Get foods by properties (NLP)', async () => {
  const foods: IFood[] | undefined = await lib.getFoodsByProperties('it is good for the skin');
  expect(foods).not.toBeUndefined();
  if (foods && foods[0]) {
    expect(foods[0]).toHaveProperty('id', '19');
    expect(foods[0]).toHaveProperty('nutrient_id', '82');
  } else {
    throw new Error('fail');
  }
});
