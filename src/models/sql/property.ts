import { BuildOptions, Sequelize } from 'sequelize';
import { DataType, Model } from 'sequelize-typescript';

const modelName = 'property';
const tableName = 'properties';
const schema = {
  id: {
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: DataType.STRING,
  descr: DataType.STRING,
};

export interface IModel extends Model {
  readonly id: number;
  readonly name: string;
  readonly descr: string;
}

type ModelStatic = typeof Model & (new (values?: object, options?: BuildOptions) => IModel);

export default (sequelize: Sequelize): ModelStatic =>
  sequelize.define(modelName, schema, {
    tableName,
    timestamps: false,
  }) as ModelStatic;
