import * as migration_20260702_025148 from './20260702_025148';
import * as migration_20260702_044418 from './20260702_044418';
import * as migration_20260702_044638 from './20260702_044638';
import * as migration_20260702_052617 from './20260702_052617';
import * as migration_20260702_053645 from './20260702_053645';
import * as migration_20260702_091033_target_group_age_number from './20260702_091033_target_group_age_number';
import * as migration_20260702_093019_genres_and_subgenres from './20260702_093019_genres_and_subgenres';
import * as migration_20260702_165928_add_types_collection from './20260702_165928_add_types_collection';
import * as migration_20260703_022140_move_type_program_links from './20260703_022140_move_type_program_links';
import * as migration_20260703_024740_add_home_hero_images from './20260703_024740_add_home_hero_images';

export const migrations = [
  {
    up: migration_20260702_025148.up,
    down: migration_20260702_025148.down,
    name: '20260702_025148',
  },
  {
    up: migration_20260702_044418.up,
    down: migration_20260702_044418.down,
    name: '20260702_044418',
  },
  {
    up: migration_20260702_044638.up,
    down: migration_20260702_044638.down,
    name: '20260702_044638',
  },
  {
    up: migration_20260702_052617.up,
    down: migration_20260702_052617.down,
    name: '20260702_052617',
  },
  {
    up: migration_20260702_053645.up,
    down: migration_20260702_053645.down,
    name: '20260702_053645',
  },
  {
    up: migration_20260702_091033_target_group_age_number.up,
    down: migration_20260702_091033_target_group_age_number.down,
    name: '20260702_091033_target_group_age_number',
  },
  {
    up: migration_20260702_093019_genres_and_subgenres.up,
    down: migration_20260702_093019_genres_and_subgenres.down,
    name: '20260702_093019_genres_and_subgenres',
  },
  {
    up: migration_20260702_165928_add_types_collection.up,
    down: migration_20260702_165928_add_types_collection.down,
    name: '20260702_165928_add_types_collection',
  },
  {
    up: migration_20260703_022140_move_type_program_links.up,
    down: migration_20260703_022140_move_type_program_links.down,
    name: '20260703_022140_move_type_program_links',
  },
  {
    up: migration_20260703_024740_add_home_hero_images.up,
    down: migration_20260703_024740_add_home_hero_images.down,
    name: '20260703_024740_add_home_hero_images'
  },
];
