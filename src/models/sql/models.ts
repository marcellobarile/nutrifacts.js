import { Model, Sequelize } from 'sequelize';

import FoodModel, { IModel as IFood, IModelSimplified as IFoodSimplified } from './food';
import FoodNutrientModel, { IModel as IFoodNutrient } from './foodNutrient';
import MessageModel, { IModel as IMessage } from './message';
import NutrientModel, { IModel as INutrient } from './nutrient';
import NutrientPropertyModel, { IModel as INutrientProperty } from './nutrientProperty';
import PropertyModel, { IModel as IProperty } from './property';
import PropertyMessageModel, { IModel as IPropertyMessage } from './propertyMessage';

export type ModelStarter = (sequelize: Sequelize) => typeof Model;

export default [
  FoodModel,
  FoodNutrientModel,
  MessageModel,
  NutrientModel,
  NutrientPropertyModel,
  PropertyModel,
  PropertyMessageModel,
];

export { IFood, IFoodSimplified, IFoodNutrient, IMessage, INutrient, INutrientProperty, IProperty, IPropertyMessage };
