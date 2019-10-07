import { BuildOptions, Sequelize } from 'sequelize';
import { DataType, Model } from 'sequelize-typescript';

const modelName = 'foodNutrient';
const tableName = 'food_nutrient';
const schema = {
  id: {
    autoIncrement: true,
    primaryKey: true,
    type: DataType.INTEGER,
  },
  food_id: DataType.INTEGER,
  nutrient_id: DataType.INTEGER,
  quantity: DataType.INTEGER,
};

export interface IModel extends Model {
  readonly id: number;
  readonly food_id: number;
  readonly nutrient_id: number;
  readonly quantity: number;
}

type ModelStatic = typeof Model & (new (values?: object, options?: BuildOptions) => IModel);

export default (sequelize: Sequelize): ModelStatic =>
  sequelize.define(modelName, schema, {
    tableName,
    timestamps: false,
  }) as ModelStatic;
