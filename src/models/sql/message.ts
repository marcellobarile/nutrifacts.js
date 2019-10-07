import { BuildOptions, Sequelize } from 'sequelize';
import { DataType, Model } from 'sequelize-typescript';

const modelName = 'message';
const tableName = 'messages';
const schema = {
  id: {
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  text: DataType.STRING,
};

export interface IModel extends Model {
  readonly id: number;
  readonly text: string;
}

type ModelStatic = typeof Model & (new (values?: object, options?: BuildOptions) => IModel);

export default (sequelize: Sequelize): ModelStatic =>
  sequelize.define(modelName, schema, {
    tableName,
    timestamps: false,
  }) as ModelStatic;
