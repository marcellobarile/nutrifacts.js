import { BuildOptions, Sequelize } from 'sequelize';
import { DataType, Model } from 'sequelize-typescript';

const modelName = 'nutrientProperty';
const tableName = 'nutrients_property';
const schema = {
  id: {
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nutrient_id: DataType.INTEGER,
  property_id: DataType.INTEGER,
};

export interface IModel extends Model {
  readonly id: number;
  readonly nutrient_id: number;
  readonly property_id: number;
}

type ModelStatic = typeof Model & (new (values?: object, options?: BuildOptions) => IModel);

export default (sequelize: Sequelize): ModelStatic =>
  sequelize.define(modelName, schema, {
    tableName,
    timestamps: false,
  }) as ModelStatic;
