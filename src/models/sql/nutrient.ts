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
