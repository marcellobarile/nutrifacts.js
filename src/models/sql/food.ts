import { BuildOptions, DataTypes, Model, Sequelize } from 'sequelize';
import { INutrient } from './models';

const modelName = 'food';
const tableName = 'foods';
const schema = {
  id: {
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  name: DataTypes.STRING,
  ref_id: DataTypes.INTEGER,
};

export interface IModel extends Model {
  readonly id: string;
  readonly name: string;
  readonly ref_id: number;
  quantity?: number;
  nutrients?: INutrient[];
  stats?: any;
}

export interface IModelSimplified {
  readonly id: string;
  readonly name: string;
  stats?: any;
}

export type ModelStatic = typeof Model & (new (values?: object, options?: BuildOptions) => IModel);

export default (sequelize: Sequelize): ModelStatic =>
  sequelize.define(modelName, schema, {
    tableName,
    timestamps: false,
  }) as ModelStatic;
