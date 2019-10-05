import FuseDb from 'fuse.js';
import { QueryTypes, Sequelize } from 'sequelize';

import { LANGUAGES, LOGIC_OPERATOR } from '../';
import FuseDbDataEn from '../../db/data_EN.fuzzy.json';
import FuseDbDataIt from '../../db/data_IT.fuzzy.json';
import LanguageUtils from '../helpers/language';
import Db from '../models/sql';
import { IFood, IFoodSimplified, INutrient } from '../models/sql/models';

export default class DbApi {
  private fuzzyFoods: any;
  private fuzzyProperties: any;
  private fuzzyNutrients: any;

  private fuseOptions = {
    shouldSort: true,
    tokenize: true,
    includeScore: false,
    includeMatches: false,
    threshold: 0.2,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 3,
    keys: ['name'],
  };

  private db: Db;
  private sequelize: Sequelize;

  constructor() {
    this.db = new Db();
    this.sequelize = this.db.sequelize;
    this.initFuzzyDb();
  }

  /**
   * Enriches the given food object with nutrients and properties. Note that this method mutates the object.
   * @param food The food entity to be enriched.
   * @param injectProperties When TRUE it enabled the properties injection in nutrients.
   * @param cb The callback for resolution.
   * TODO: Use a promise instead of a callback
   */
  public injectNutrientsInFood(food: IFood, injectProperties: boolean, cb: (err?: Error | string) => void): void {
    this.sequelize
      .query(
        `SELECT  nutrients.id,
                  nutrients.name,
                  nutrients.unit,
                  food_nutrient.quantity
          FROM    nutrients,
                  food_nutrient
          WHERE   food_nutrient.food_id = '${food.id}'
              AND food_nutrient.quantity > '0'
              AND food_nutrient.nutrient_id = nutrients.id`,
        { type: QueryTypes.SELECT },
      )
      .then((nutrients: any[]) => {
        food.nutrients = nutrients;

        if (injectProperties) {
          let done = 0;
          for (const nutrient of food.nutrients) {
            this.injectPropertiesInNutrient(nutrient, (err: Error | string | undefined) => {
              done++;
              if (err) {
                cb(err);
              } else if (done === nutrients.length) {
                cb();
              }
            });
          }
        } else {
          cb();
        }
      })
      .catch(cb);
  }

  /**
   * Enriches the given nutrìent object with properties. Note that this method mutates the object.
   * @param nutrient The nutrient entity to be enriched.
   * @param cb The callback for resolution.
   * TODO: Use a promise instead of a callback
   */
  public injectPropertiesInNutrient(nutrient: INutrient, cb: (err?: Error | string) => void): any {
    this.sequelize
      .query(
        `SELECT  properties.name,
              properties.descr
          FROM    properties,
              nutrient_property
          WHERE   nutrient_property.property_id = properties.id
          AND nutrient_property.nutrient_id = '${nutrient.id}'
          LIMIT 0,10`,
        { type: QueryTypes.SELECT },
      )
      .then((properties: any[]) => {
        nutrient.properties = properties;
        cb();
      })
      .catch(cb);
  }

  /**
   * Returns a food entity from a given ID.
   * @param id The id to be searched.
   * @param injectNutrientsInFood When TRUE it enables the nutrients injection in food. Note that this arbitrarily injects also properties in nutrients.
   */
  public getFoodById(id: string, injectNutrientsInFood: boolean): Promise<IFood | undefined> {
    return new Promise((resolve, reject) => {
      this.sequelize
        .query(`SELECT foods.id, foods.name FROM foods WHERE foods.id = '${id}'`, { type: QueryTypes.SELECT })
        .then((foods: any[]) => {
          if (foods.length === 0) {
            resolve(undefined);
            return;
          }

          if (injectNutrientsInFood) {
            let done = 0;
            for (const food of foods) {
              this.injectNutrientsInFood(food, true, (err: Error | string | undefined) => {
                done++;
                if (err) {
                  reject(err);
                  return;
                } else if (done === foods.length) {
                  resolve(foods[0]);
                  return;
                }
              });
            }
          } else {
            resolve(foods[0]);
            return;
          }
        })
        .catch(reject);
    });
  }

  /**
   * Returns a list of foods from a given list of IDs.
   * @param ids The list of IDs to be searched.
   * @param injectNutrientsInFood When TRUE it enables the nutrients injection in foods.
   * @param injectPropertiesInNutrient When TRUE it enables the properties injection in nutrients.
   */
  public getFoodsByIds(
    ids: string[],
    injectNutrientsInFood: boolean,
    injectPropertiesInNutrient: boolean,
  ): Promise<IFood[]> {
    return new Promise((resolve, reject) => {
      this.sequelize
        .query(`SELECT foods.id, foods.name FROM foods WHERE foods.id IN ("${ids.join('","')}")`, {
          type: QueryTypes.SELECT,
        })
        .then((foods: any[]) => {
          if (foods.length === 0) {
            resolve([]);
            return;
          }

          if (injectNutrientsInFood) {
            let done = 0;
            for (const food of foods) {
              this.injectNutrientsInFood(food, injectPropertiesInNutrient, (err: Error | string | undefined) => {
                done++;
                if (err) {
                  reject(err);
                  return;
                } else if (done === foods.length) {
                  resolve(foods);
                  return;
                }
              });
            }
          } else {
            resolve(foods);
            return;
          }
        })
        .catch(reject);
    });
  }

  /**
   * Returns the best matching food from a given textual query.
   * @param query The query to match.
   * @param injectNutrientsInFood When TRUE it enables the nutrients injection in foods.
   */
  public getFoodByQuery(query: string, injectNutrientsInFood: boolean): Promise<IFood | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.fuzzyFoods) {
        reject(new Error('Invalid fuzzy DB'));
        return;
      }

      const matches: IFoodSimplified[] = this.fuzzyFoods.search(query);
      const bestMatches: string[] = LanguageUtils.getBestMatchingFood(matches, query, true) as string[];

      if (!bestMatches || bestMatches.length === 0) {
        resolve(undefined);
        return;
      }

      this.getFoodById(bestMatches[0], injectNutrientsInFood)
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * Returns a list of foods that match the given query.
   * @param query The query to match.
   * @param injectNutrientsInFood When TRUE it enables the nutrients injection in foods.
   * @param injectPropertiesInNutrient When TRUE it enables the properties injection in nutrients.
   */
  public getFoodsByQuery(
    query: string,
    injectNutrientsInFood: boolean,
    injectPropertiesInNutrient: boolean,
  ): Promise<IFood[]> {
    return new Promise((resolve, reject) => {
      if (!this.fuzzyFoods) {
        reject(new Error('Invalid fuzzy DB'));
        return;
      }

      const matches: IFoodSimplified[] = this.fuzzyFoods.search(query);
      const bestMatches: string[] = LanguageUtils.getBestMatchingFood(matches, query, true) as string[];

      if (!bestMatches || bestMatches.length === 0) {
        resolve([]);
        return;
      }

      this.getFoodsByIds(bestMatches, injectNutrientsInFood, injectPropertiesInNutrient)
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * Returns a list of foods that matches the given query.
   * @param query The query to match.
   * @param injectNutrientsInFood When TRUE it enables the nutrients injection in foods.
   * @param start The start count.
   * @param offset The offset count.
   */
  public getFoodsByProperty(
    query: string,
    injectNutrientsInFood: boolean,
    start: number = 0,
    offset: number = 20,
  ): Promise<IFood[]> {
    return new Promise((resolve, reject) => {
      if (!this.fuzzyProperties) {
        reject(new Error('Invalid fuzzy DB'));
        return;
      }

      const matches: IFoodSimplified[] = this.fuzzyProperties.search(query);

      if (!matches || matches.length === 0) {
        resolve([]);
        return;
      }

      // arbitrarily taking the first 5s; they are already sorted by score.
      const ids: string[] = matches.slice(0, 5).map(match => match.id);

      this.sequelize
        .query(
          `SELECT DISTINCT
              foods.id,
              foods.name,
              nutrients.id AS nutrient_id,
              nutrients.name AS nutrient_name,
              food_nutrient.quantity,
              nutrients.unit
          FROM  foods,
                food_nutrient,
                nutrients,
                properties,
                nutrient_property
          WHERE properties.id IN ("${ids.join('","')}")
            AND (nutrient_property.nutrient_id = nutrients.id AND nutrient_property.property_id = properties.id)
            AND (food_nutrient.food_id = foods.id AND food_nutrient.quantity > '0')
            AND food_nutrient.nutrient_id = nutrients.id
          ORDER BY food_nutrient.quantity DESC
          LIMIT ${start}, ${start + offset}`,
          { type: QueryTypes.SELECT },
        )
        .then((foods: any[]) => {
          if (foods.length === 0) {
            resolve([]);
            return;
          }

          if (injectNutrientsInFood) {
            let done = 0;
            for (const food of foods) {
              this.injectNutrientsInFood(food, true, (err: Error | string | undefined) => {
                done++;
                if (err) {
                  reject(err);
                  return;
                } else if (done === foods.length) {
                  resolve(foods);
                  return;
                }
              });
            }
          } else {
            resolve(foods);
            return;
          }
        })
        .catch(reject);
    });
  }

  /**
   * Returns a list of foods from a given list of ingredients IDs.
   * NOTE: The result of this query is very simple because its heavy computational cost
   * @param ids The list of IDs to be searched.
   * @param operator The logic operator to be applied.
   */
  public getFoodsByIngredientsIds(ids: number[], operator: LOGIC_OPERATOR): Promise<IFood[]> {
    return new Promise((resolve, reject) => {
      let condition = '';
      const operatorStr = ' AND ';
      if (operator === LOGIC_OPERATOR.OR) {
        condition = `food_nutrient.nutrient_id IN ("${ids.join('","')}")`;
      } else if (operator === LOGIC_OPERATOR.AND) {
        for (const id of ids) {
          condition += `food_nutrient.nutrient_id = '${id}'${operatorStr}`;
        }
        condition = condition.substr(0, condition.length - operatorStr.length);
      }

      this.sequelize
        .query(
          `SELECT DISTINCT foods.id,  foods.name
            FROM    foods,
                    food_nutrient
            WHERE   ${condition}
            AND     food_nutrient.food_id = foods.id
            AND     food_nutrient.quantity > '0'`,
          { type: QueryTypes.SELECT },
        )
        .then((foods: any[]) => resolve(foods))
        .catch(reject);
    });
  }

  /**
   * Returns a list of ingredients that match the given query.
   * @param query The query to be matched.
   * @param injectPropertiesInNutrient When TRUE it enables the properties injection in nutrients.
   */
  public getIngredientsByQuery(query: string, injectPropertiesInNutrient: boolean): Promise<INutrient[]> {
    return new Promise((resolve, reject) => {
      if (!this.fuzzyNutrients) {
        reject(new Error('Invalid fuzzy DB'));
        return;
      }

      const matches: IFoodSimplified[] = this.fuzzyNutrients.search(query);

      if (!matches || matches.length === 0) {
        resolve([]);
        return;
      }

      // arbitrarily taking the first 5s
      const ids: string[] = matches.slice(0, 5).map(match => match.id);

      this.sequelize
        .query(
          `SELECT  nutrients.id,
                    nutrients.name,
                    nutrients.unit
          FROM    nutrients
          WHERE   nutrients.id IN ("${ids.join('","')}")`,
          { type: QueryTypes.SELECT },
        )
        .then((nutrients: any[]) => {
          if (nutrients.length === 0) {
            resolve([]);
            return;
          }

          if (injectPropertiesInNutrient) {
            let done = 0;
            for (const nutrient of nutrients) {
              this.injectPropertiesInNutrient(nutrient, (err: Error | string | undefined) => {
                done++;
                if (err) {
                  reject(err);
                  return;
                } else if (done === nutrients.length) {
                  resolve(nutrients);
                  return;
                }
              });
            }
          } else {
            resolve(nutrients);
            return;
          }
        })
        .catch(reject);
    });
  }

  /**
   * Initializes the Fuzzy DB.
   */
  private initFuzzyDb(): void {
    let fuseDb: any;
    switch (LanguageUtils.getLang()) {
      case LANGUAGES.EN:
        fuseDb = FuseDbDataEn;
        break;
      case LANGUAGES.IT:
        fuseDb = FuseDbDataIt;
        break;
    }
    this.fuzzyFoods = new FuseDb(fuseDb.foods, this.fuseOptions);
    this.fuzzyNutrients = new FuseDb(fuseDb.nutrients, this.fuseOptions);
    this.fuzzyProperties = new FuseDb(fuseDb.properties, this.fuseOptions);
  }
}
