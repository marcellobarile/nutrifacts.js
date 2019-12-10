import { BuildOptions, Sequelize } from 'sequelize';
import { DataType, Model } from 'sequelize-typescript';

import { IProperty } from './models';

const modelName = 'nutrient';
const tableName = 'nutrients';
const schema = {
  id: {
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: DataType.STRING,
  unit: DataType.STRING,
};

/*
  - Estimated Average Requirement (EAR): a nutrient intake value that is estimated to meet the requirement of half the healthy individuals in a group.

  - Recommended Dietary Allowance (RDA): the average daily dietary intake level that is sufficient to meet the nutrient requirement of nearly all (97 to 98 percent) healthy individuals in a group.

  - Adequate Intake (AI): a value based on observed or experimentally determined approximations of nutrient intake by a group (or groups) of healthy people—used when an RDA cannot be determined.

  - Tolerable Upper Intake Level (UL): the highest level of daily nutrient intake that is likely to pose no risk of adverse health effects to almost all individuals in the general population. As intake increases above the UL, the risk of adverse effects increases.
 */
export interface IReccomendetion {
  daily_amount: {
    male: number;
    female: number;
  };
  ear: number;
  highest_rda_ai: number;
  ul: number;
  unit: string;
  health_risk_ratio?: number;
}

export interface IModel extends Model {
  readonly id: number;
  readonly name: string;
  unit: string;
  properties: IProperty[];
  recommendation: IReccomendetion;
  quantity: number;
}

type ModelStatic = typeof Model & (new (values?: object, options?: BuildOptions) => IModel);

export default (sequelize: Sequelize): ModelStatic =>
  sequelize.define(modelName, schema, {
    tableName,
    timestamps: false,
  }) as ModelStatic;
