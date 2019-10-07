import { BuildOptions, Sequelize } from 'sequelize';
import { DataType, Model } from 'sequelize-typescript';

const modelName = 'propertyMessage';
const tableName = 'property_message';
const schema = {
  id: {
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  property_id: DataType.INTEGER,
  message_id: DataType.INTEGER,
};

export interface IModel extends Model {
  readonly id: number;
  readonly property_id: number;
  readonly message_id: number;
}

type ModelStatic = typeof Model & (new (values?: object, options?: BuildOptions) => IModel);

export default (sequelize: Sequelize): ModelStatic =>
  sequelize.define(modelName, schema, {
    tableName,
    timestamps: false,
  }) as ModelStatic;
