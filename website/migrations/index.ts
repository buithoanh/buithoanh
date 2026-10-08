import * as migration_20261008_092120_khoi_tao from './20261008_092120_khoi_tao';
import * as migration_20261008_092859_khoa_api from './20261008_092859_khoa_api';
import * as migration_20261008_100259_tu_lieu from './20261008_100259_tu_lieu';
import * as migration_20261008_102632_p0_danh_muc_gia_vung_don_hang from './20261008_102632_p0_danh_muc_gia_vung_don_hang';
import * as migration_20261008_111844_p1_phuc_vu_quan_tri from './20261008_111844_p1_phuc_vu_quan_tri';

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
    name: '20261008_100259_tu_lieu',
  },
  {
    up: migration_20261008_102632_p0_danh_muc_gia_vung_don_hang.up,
    down: migration_20261008_102632_p0_danh_muc_gia_vung_don_hang.down,
    name: '20261008_102632_p0_danh_muc_gia_vung_don_hang',
  },
  {
    up: migration_20261008_111844_p1_phuc_vu_quan_tri.up,
    down: migration_20261008_111844_p1_phuc_vu_quan_tri.down,
    name: '20261008_111844_p1_phuc_vu_quan_tri'
  },
];
