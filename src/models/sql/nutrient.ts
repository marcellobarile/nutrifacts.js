import { BuildOptions, DataTypes, Model, Sequelize } from 'sequelize';
import { IProperty } from './models';

const modelName = 'nutrient';
const tableName = 'nutrients';
const schema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: DataTypes.STRING,
  unit: DataTypes.STRING,
};

export interface IModel extends Model {
  readonly id: number;
  readonly name: string;
  readonly unit: string;
  properties: IProperty[];
  quantity: number;
}

type ModelStatic = typeof Model & (new (values?: object, options?: BuildOptions) => IModel);

export default (sequelize: Sequelize): ModelStatic =>
  sequelize.define(modelName, schema, {
    tableName,
    timestamps: false,
  }) as ModelStatic;
