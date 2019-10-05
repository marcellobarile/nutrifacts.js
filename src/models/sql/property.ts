import { BuildOptions, DataTypes, Model, Sequelize } from 'sequelize';

const modelName = 'property';
const tableName = 'properties';
const schema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: DataTypes.STRING,
  descr: DataTypes.STRING,
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
