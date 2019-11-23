import fs from 'fs';
import _ from 'lodash';
import * as path from 'path';
import peg from 'pegjs';

import ConversionsUtils from './helpers/conversions';
import LanguageUtils from './helpers/language';
import { IFood, INutrient } from './models/sql/models';
import DbApi from './services/db';

export interface IRecipeResult {
  totals: { [label: string]: { value: number; unit: string } };
  unknown: { [label: string]: { ingredient: IInputIngredient; parsed?: string[]; reasons?: UNKNOWN_REASONS[] } };
  matches: { [label: string]: IFood[] };
  sum_health_ratio: number;
}

export enum LOGIC_OPERATOR {
  AND = 'AND',
  OR = 'OR',
}

// TODO: When further languages will be supported we'll need a better solution :-)
export enum LANGUAGES {
  EN = 'EN',
  IT = 'IT',
}

export enum UNKNOWN_REASONS {
  PARSING = 'mismatch during parsing',
  PARSING_AMOUNT = 'unknown amount',
  PARSING_UNIT = 'unknown unit',
  NO_ENTRY = 'unavailable food',
}

export interface IInputIngredient {
  recipeStr?: string;
  label?: string;
  quantity?: number;
}

export default class NutrifactsJs {
  private db: DbApi = new DbApi();
  private nlpParser: peg.Parser = peg.generate(
    fs.readFileSync(path.join(__dirname, `/../db/nlp-rules/rules_${LanguageUtils.getLang()}.pegjs`), {
      encoding: 'utf8',
    }),
  );

  /**
   * Returns the list of nutrients and properties from a given list of ingredients.
   * @param ingredients The list of ingredients. Supports NLP queries (recipeStr) or precise values (label & quantity).
   */
  public getNutrientsInRecipe(ingredients: IInputIngredient[]): Promise<IRecipeResult> {
    const output: IRecipeResult = {
      totals: {},
      unknown: {},
      matches: {},
      sum_health_ratio: 0,
    };

    return new Promise((resolve, reject) => {
      // Resolve the promise as soon as all the ingredients have been processed
      const maybeResolve = () => {
        if (Object.keys(output.matches).length + Object.keys(output.unknown).length === ingredients.length) {
          resolve(output);
        }
      };

      // Parse and normalize the ingredients
      _.each(ingredients, (ingredient: IInputIngredient) => {
        let label: string;
        let foodQuantity: number;

        if (typeof ingredient.recipeStr !== 'undefined') {
          const recipeStr = ingredient.recipeStr
            .replace('½', '1/2')
            .replace('⅓', '1/3')
            .replace('¼', '1/4')
            .replace('¾', '3/4')
            .replace('⅔', '2/3');
          const parts = this.nlpParser.parse(recipeStr);

          if (
            typeof parts.amount === 'undefined' ||
            typeof parts.ingredient === 'undefined' ||
            typeof parts.unit === 'undefined'
          ) {
            /*
              TODO: When the unit is not specified it means that a whole ingredient has been provided (1 banana etc..).
              In this case the algorithm should get the average grams of the given ingredient.
            */
            const unknownReasons = [UNKNOWN_REASONS.PARSING];
            if (!parts.amount) {
              unknownReasons.push(UNKNOWN_REASONS.PARSING_AMOUNT);
            }
            if (!parts.unit) {
              unknownReasons.push(UNKNOWN_REASONS.PARSING_UNIT);
            }

            output.unknown[ingredient.recipeStr] = {
              ingredient,
              parsed: parts,
              reasons: unknownReasons,
            };

            maybeResolve();
            return;
          } else {
            parts.amount = ConversionsUtils.normalizeAmount(parts.amount);

            if (ConversionsUtils.isKiloGrams(parts.unit)) {
              parts.unit = ConversionsUtils.defaultQuantityMeasure;
              parts.amount *= ConversionsUtils.refQuantityKg;
            }

            label = parts.ingredient;
            foodQuantity = parts.amount;

            if (!ConversionsUtils.isGrams(parts.unit)) {
              foodQuantity = ConversionsUtils.convertToGrams(
                parts.unit,
                ConversionsUtils.getNearestUnitType(parts.ingredient),
                parts.amount,
              );
            }
          }
        } else {
          label = ingredient.label ? ingredient.label.toLowerCase() : 'N/A';
          foodQuantity = ingredient.quantity || -1;
        }

        this.db
          .getFoodsByQuery(label, true, true)
          .then((foods: IFood[]) => {
            if (foods.length === 0) {
              // TODO: How to try to match at least the category of food? (i.e. "guanciale" => pork meat fat, "spaghetti" => pasta)
              output.unknown[label] = {
                ingredient,
                reasons: [UNKNOWN_REASONS.NO_ENTRY],
              };

              maybeResolve();
            } else {
              _.each(foods, (food: IFood) => {
                ConversionsUtils.scaleNutrientsQuantities(foodQuantity, food);

                food.quantity = foodQuantity;
                if (typeof output.matches[label] === 'undefined') {
                  output.matches[label] = [];
                }
                output.matches[label].push(food);

                _.each(food.nutrients, (nutrient: INutrient) => {
                  if (nutrient.unit === '%' || nutrient.quantity <= 0) {
                    return;
                  }

                  ConversionsUtils.computeHealtyCoeff(nutrient);
                  output.sum_health_ratio += nutrient.recommendation
                    ? nutrient.recommendation.health_risk_ratio || 0
                    : 0;

                  if (typeof output.totals[nutrient.name] === 'undefined') {
                    output.totals[nutrient.name] = { value: 0, unit: nutrient.unit };
                  }

                  output.totals[nutrient.name].value = _.round(
                    output.totals[nutrient.name].value + nutrient.quantity,
                    2,
                  );
                });
              });

              maybeResolve();
            }
          })
          .catch(reject);
      });
    });
  }

  /**
   * Returns the food entity from a given ID.
   * @param id The food ID.
   */
  public getFoodById(id: string): Promise<IFood | undefined> {
    return new Promise((resolve, reject) => {
      this.db
        .getFoodById(id, true)
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * Returns the best matching food for a given textual query.
   * @param query The query to match.
   */
  public getFoodByQuery(query: string, injectNutrients: boolean): Promise<IFood | undefined> {
    return new Promise((resolve, reject) => {
      this.db
        .getFoodByQuery(query, injectNutrients)
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * Returns a list of foods that contains the given ingredients' IDs.
   * @param ingredientsIds The list of ingredients' IDs to match.
   * @param operator The logic operator to be applied when matching the ingredients.
   */
  public getFoodsByIngredients(ingredientsIds: number[], operator: LOGIC_OPERATOR): Promise<IFood[] | undefined> {
    return new Promise((resolve, reject) => {
      this.db
        .getFoodsByIngredientsIds(ingredientsIds, operator)
        .then((foods: IFood[]) => {
          if (foods.length === 0) {
            resolve(undefined);
          } else {
            resolve(foods);
          }
        })
        .catch((err: Error) => {
          reject(err);
        });
    });
  }

  /**
   * Returns a list of foods that have properties which match the given query string.
   * @param query The properties query to match.
   */
  public getFoodsByProperties(query: string): Promise<IFood[] | undefined> {
    return new Promise((resolve, reject) => {
      this.db
        .getFoodsByProperty(query, true)
        .then((foods: IFood[]) => {
          if (foods.length === 0) {
            resolve(undefined);
          } else {
            resolve(foods);
          }
        })
        .catch(reject);
    });
  }

  /**
   * Returns a list of nutrients that matches the given query.
   * @param query The nutrients query to match.
   */
  public getNutrientsByQuery(query: string): Promise<INutrient[] | undefined> {
    return new Promise((resolve, reject) => {
      this.db
        .getIngredientsByQuery(query, true)
        .then((nutrients: INutrient[]) => {
          if (nutrients.length === 0) {
            resolve(undefined);
          } else {
            resolve(nutrients);
          }
        })
        .catch(reject);
    });
  }
}
