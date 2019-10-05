import * as fs from 'fs';
import * as path from 'path';

// Use your preferred software to convert SQLite to JSON files
// then merge them in the TS export module.
import DataIt from '../../db/data_IT';
import DataEn from '../../db/data_EN';

enum LANG {
  EN = 'EN',
  IT = 'IT',
}

const build = (lang: LANG = LANG.EN) => {
  let data: any;
  switch (lang) {
    case LANG.EN:
      data = DataEn;
      break;
    case LANG.IT:
      data = DataIt;
      break;
  }

  const foods = data.foods;
  const properties = data.properties;
  const nutrients = data.nutrients;

  const output = {
    foods,
    properties,
    nutrients,
  };

  const jsonFileName = `data_${lang}.fuzzy.json`;
  fs.writeFileSync(path.join(__dirname, jsonFileName), JSON.stringify(output), { encoding: 'utf8' });
  console.log('Done to', path.join(__dirname, jsonFileName));
};

build();
