import _ from 'lodash';

import { LANGUAGES } from '../';
import UnitsEn from '../../db/units_EN.json';
import UnitsIt from '../../db/units_IT.json';
import { IFood, INutrient } from '../models/sql/models';
import { IReccomendetion as IRecommendation } from '../models/sql/nutrient';
import LanguageUtils from './language';

export default class ConversionsUtils {
  public static refQuantityGr = 100; // in grams
  public static refQuantityKg = 1000; // in kg

  /**
   * Returns a list of units for the configured language.
   */
  public static getUnits(): any {
    switch (LanguageUtils.getLang()) {
      case LANGUAGES.EN:
        return UnitsEn;
      case LANGUAGES.IT:
        return UnitsIt;
    }
  }

  /**
   * Returns TRUE if the given unit is milligrams.
   * @param unit The unit to be checked.
   */
  public static isMilligrams(unit: string): boolean {
    return this.getUnits().nominalUnits.milligrams.indexOf(unit) > -1;
  }

  /**
   * Returns TRUE if the given unit is grams.
   * @param unit The unit to be checked.
   */
  public static isGrams(unit: string): boolean {
    return this.getUnits().nominalUnits.grams.indexOf(unit) > -1;
  }

  /**
   * Returns TRUE if the given unit is kilograms.
   * @param unit The unit to be checked.
   */
  public static isKiloGrams(unit: string): boolean {
    return this.getUnits().nominalUnits.kilograms.indexOf(unit) > -1;
  }

  /**
   * Returns TRUE if the given unit is milliliters.
   * @param unit The unit to be checked.
   */
  public static isMilliliters(unit: string): boolean {
    return this.getUnits().nominalUnits.milliliters.indexOf(unit) > -1;
  }

  /**
   * Returns TRUE if the given unit is liters.
   * @param unit The unit to be checked.
   */
  public static isLiters(unit: string): boolean {
    return this.getUnits().nominalUnits.liters.indexOf(unit) > -1;
  }

  /**
   * Tries to match the nearest unit type from a given input.
   * @param input The unit to look up.
   */
  public static getNearestUnitType(input: string): string {
    for (const i in this.getUnits().unitTypes) {
      if (!this.getUnits().unitTypes.hasOwnProperty(i)) {
        continue;
      }

      if (input.indexOf(this.getUnits().unitTypes[i]) > -1 || this.getUnits().unitTypes[i].indexOf(input) > -1) {
        return this.getUnits().unitTypes[i];
      }
    }

    return this.getUnits().defaulUnitType;
  }

  /**
   * Normalizes a given amount.
   * @param val The amount to be normalized.
   */
  public static normalizeAmount(val: number | string): number {
    let out;

    // Normalizing numeric word to number
    if (this.getUnits().wordNumbers.hasOwnProperty(val)) {
      out = (this.getUnits().wordNumbers as any)[val];
    }

    // Summing up mixed amounts (integer and fractions)
    const fractionRe = /(\d)?(.*)?(\d)\/(\d)/gim;
    const matches = fractionRe.exec(String(val));
    if (matches) {
      if (matches[1] && matches[3] && matches[4]) {
        out = Number(matches[1]) + Number(matches[3]) / Number(matches[4]);
      } else {
        out = Number(matches[3]) / Number(matches[4]);
      }
    }

    if (!out) {
      out = Number(val);
    }

    return out;
  }

  /**
   * Converts a given amount in a given unit to grams.
   * @param unit The source unit.
   * @param type The ingredient type.
   * @param val The source value.
   */
  public static convertToGrams(unit: string, type: string, val: number | string): number {
    unit = unit.replace(/\W/g, '');

    unit = (this.getUnits().pluralsMap as any)[unit] || unit;

    if (ConversionsUtils.isMilliliters(unit)) {
      return Number(val);
    }

    if (ConversionsUtils.isLiters(unit)) {
      return Number(val) * 1000;
    }

    if (!(this.getUnits().unitMeasuresInGrams as any)[unit]) {
      return -1;
    }

    if (!(this.getUnits().unitMeasuresInGrams as any)[unit][type]) {
      type = this.getUnits().defaulUnitType;
    }

    return +(this.getUnits().unitMeasuresInGrams as any)[unit][type]; // * +val;
  }

  /**
   * Scales the nutrients' quantities to the given food's amount. This function mutates the object.
   * @param foodQuantity The source amount.
   * @param food The food object.
   */
  public static scaleNutrientsQuantities(foodQuantity: number, food: IFood): void {
    _.each(food.nutrients, (nutrient: INutrient) => {
      if (foodQuantity < 0) {
        nutrient.quantity = 0;
        return;
      }

      if (nutrient.unit !== '%' && foodQuantity > 0) {
        const singleUnitValue = this.scaleToGrams(nutrient.quantity, nutrient.unit);
        nutrient.quantity = singleUnitValue * foodQuantity;
        nutrient.unit = 'g';
      }
    });
  }

  /**
   * Returns the default quantity measure.
   */
  public static get defaultQuantityMeasure(): string {
    return this.getUnits().nominalUnits.grams[0];
  }

  /**
   *  Returns a "recommendation" object; it also in charge of computing
   * a risk ratio for the given nutrient, based on its amount.
   */
  public static getRecommendations(nutrient: INutrient, data: any = {}): IRecommendation {
    return {
      daily_amount: {
        male: data.amount_m,
        female: data.amount_f,
      },
      ear: data.ear,
      highest_rda_ai: data.highest_rda_ai,
      ul: data.ul,
      unit: data.unit,
    };
  }

  /**
   * Computes and hydrates a healthy coeff for the given nutrient.
   * @param nutrient The nutrient class to hydrate
   */
  public static computeHealtyCoeff(nutrient: INutrient): void {
    nutrient.recommendation.health_risk_ratio = nutrient.recommendation.daily_amount.male
      ? // TODO: Shall we compute a meaning average for covering also females?
        +nutrient.quantity / +nutrient.recommendation.daily_amount.male
      : // TODO: Shall we add more factors to the ratio?
      !isNaN(nutrient.recommendation.highest_rda_ai)
      ? +nutrient.quantity / this.scaleToGrams(+nutrient.recommendation.highest_rda_ai, nutrient.recommendation.unit)
      : 0;
  }

  /**
   * Converts a given value with a given unit to grams.
   * @param value The value to convert
   * @param unit  The unit of the value to convert
   */
  private static scaleToGrams(value: number, unit: string): number {
    let refQuantity = this.refQuantityGr;
    if (unit === 'µg') {
      refQuantity /= 1000000;
    } else if (unit === 'mg') {
      refQuantity /= 1000;
    }
    return value / refQuantity /* this.refQuantityGr */;
  }
}
