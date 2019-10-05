import path from 'path';
import { Sequelize } from 'sequelize';

import LanguageUtils from '../../helpers/language';
import Models, { ModelStarter } from './models';

export default class DbModels {
  public sequelize: Sequelize;
  public models: ModelStarter[] = Models;

  constructor(sync: boolean = false) {
    this.sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(process.cwd(), `db/data_${LanguageUtils.getLang()}.sqlite`),
      logging: false,
    });

    if (sync) {
      this.sync();
    }
  }

  public sync(): void {
    this.sequelize.sync();
  }
}
