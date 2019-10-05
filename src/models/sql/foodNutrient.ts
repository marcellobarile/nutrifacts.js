import { BuildOptions, DataTypes, Model, Sequelize } from 'sequelize';

const modelName = 'foodNutrient';
const tableName = 'food_nutrient';
const schema = {
  id: {
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  food_id: DataTypes.INTEGER,
  nutrient_id: DataTypes.INTEGER,
  quantity: DataTypes.INTEGER,
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
