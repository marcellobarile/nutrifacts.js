import _ from 'lodash';

import { LANGUAGES } from '../';
import StopWordsEn from '../../db/stop-words_EN.json';
import StopWordsIt from '../../db/stop-words_IT.json';
import { IFood, IFoodSimplified } from '../models/sql/models';

export default class LanguageUtils {
  /**
   * Returns the language to be used.
   */
  public static getLang(): LANGUAGES {
    return (process.env.LANG as LANGUAGES) || LANGUAGES.EN;
  }

  /**
   * Returns the stop words for the configured language.
   */
  public static getStopWords(): any {
    switch (LanguageUtils.getLang()) {
      case LANGUAGES.EN:
        return StopWordsEn;
      case LANGUAGES.IT:
        return StopWordsIt;
    }
  }

  /**
   * Removes the stop words from the given string.
   * @param input The string to be processed
   */
  public static removeStopWords(input: string): string {
    const words = input.split(' ');
    const filtered: string[] = [];
    _.each(words, word => {
      if (this.getStopWords().indexOf(word.toLowerCase()) === -1) {
        filtered.push(word);
      }
    });
    return filtered.join(' ');
  }

  /**
   * Computes the Levenshtein distance between the given strings.
   * TODO: Use a Fast distance algo instead?
   * @param s String A.
   * @param t String B.
   */
  public static strDistance(s: string, t: string): number {
    const d: number[][] = []; // 2d matrix
    const n = s.length;
    const m = t.length;
    if (n === 0) {
      return m;
    }
    if (m === 0) {
      return n;
    }

    // Create an array of arrays in javascript (a descending loop is quicker)
    for (let i = n; i >= 0; i--) {
      d[i] = [];
    }

    // Step 2
    for (let i = n; i >= 0; i--) {
      d[i][0] = i;
    }
    for (let j = m; j >= 0; j--) {
      d[0][j] = j;
    }

    for (let i = 1; i <= n; i++) {
      const sI = s.charAt(i - 1);

      for (let j = 1; j <= m; j++) {
        // Check the jagged ld total so far
        if (i === j && d[i][j] > 4) {
          return n;
        }

        const tJ = t.charAt(j - 1);
        const cost = sI === tJ ? 0 : 1;

        // Calculate the minimum
        let mi = d[i - 1][j] + 1;
        const b = d[i][j - 1] + 1;
        const c = d[i - 1][j - 1] + cost;

        if (b < mi) {
          mi = b;
        }
        if (c < mi) {
          mi = c;
        }

        d[i][j] = mi;

        // Damerau transposition
        if (i > 1 && j > 1 && sI === t.charAt(j - 2) && s.charAt(i - 2) === tJ) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
        }
      }
    }

    return d[n][m];
  }

  /**
   * Counts the occurrence between two lists of words.
   * @param inputWords List A.
   * @param foodWords List B.
   */
  public static countWordsOccurrence(inputWords: string[], foodWords: string[]): {count: number; totLevDist: number} {
    let occurrence = 0;
    let distance = 0;
    _.each(_.uniq(foodWords), (foodWord: string) => {
      _.each(inputWords, (inputWord: string) => {
        const wordsDistance = this.strDistance(inputWord, foodWord);
        distance += wordsDistance;
        if (wordsDistance <= 1) {
          occurrence++;
        }
      });
    });
    return {
      count: occurrence,
      totLevDist: distance,
    };
  }

  /**
   * Finds the best matching food from a list using the given needle string.
   * @param foods The list of foods.
   * @param needle The string to look up.
   * @param returnOnlyId When TRUE the function only returns the ID of the matching food.
   * TODO: Better describe and document the algorithm.
   */
  public static getBestMatchingFood(
    foods: IFood[] | IFoodSimplified[],
    needle: string,
    returnOnlyId: boolean = false,
  ): IFood[] | string[] {
    if (foods.length === 0) {
      return [];
    }

    needle = this.removeStopWords(needle);

    const inputWords = needle.replace(',', '').split(' ');

    let perfectMatch: any;

    for (const food of foods) {
      if (perfectMatch) {
        break;
      }

      const foodWords = food.name.replace(',', '').split(' ');

      if (foodWords.length === 1 && foodWords[0] === needle) {
        perfectMatch = {
          ...food,
          stats: {
            occurrence: 1,
            distance: 0,
            confidence: 1,
          },
        };
        break;
      }

      const occurrence = this.countWordsOccurrence(inputWords, foodWords);

      food.stats = {
        occurrence: occurrence.count,
        distance: occurrence.totLevDist,
        confidence: 
          // the higher the occurrences the higher the coefficient.
          (occurrence.count * 0.25) * inputWords.length
          // the more similar the words the higher the coefficient.
          - (occurrence.totLevDist / foodWords.length)
        ,
      };
    }

    const maxConfidence = _.maxBy(foods, 'stats.confidence')!.stats.confidence || 0;
    const minConfidence = _.minBy(foods, 'stats.confidence')!.stats.confidence || 0;
    
    _.each(foods, (food: IFood | IFoodSimplified) => {
      if (typeof food.stats !== 'undefined' && typeof food.stats.confidence !== 'undefined') {
        food.stats.confidence = (food.stats.confidence - minConfidence) / (maxConfidence - minConfidence)
      }
    })

    if (perfectMatch) {
      return returnOnlyId ? [perfectMatch.id] : [perfectMatch];
    }

    foods = _.orderBy(foods, ['stats.occurrence', 'stats.confidence'], ['desc', 'desc']);

    return returnOnlyId ? [foods[0].id] : [foods[0] as IFood];
  }
}
