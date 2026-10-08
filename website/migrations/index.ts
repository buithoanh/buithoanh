import * as migration_20261008_092120_khoi_tao from './20261008_092120_khoi_tao';
import * as migration_20261008_092859_khoa_api from './20261008_092859_khoa_api';
import * as migration_20261008_100259_tu_lieu from './20261008_100259_tu_lieu';

export const migrations = [
  {
    up: migration_20261008_092120_khoi_tao.up,
    down: migration_20261008_092120_khoi_tao.down,
    name: '20261008_092120_khoi_tao',
  },
  {
    up: migration_20261008_092859_khoa_api.up,
    down: migration_20261008_092859_khoa_api.down,
    name: '20261008_092859_khoa_api',
  },
  {
    up: migration_20261008_100259_tu_lieu.up,
    down: migration_20261008_100259_tu_lieu.down,
    name: '20261008_100259_tu_lieu'
  },
];
