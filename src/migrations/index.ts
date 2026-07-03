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
import * as migration_20260703_030120_simplify_home_hero_images from './20260703_030120_simplify_home_hero_images';
import * as migration_20260703_090000_merge_types_into_categories from './20260703_090000_merge_types_into_categories';
import * as migration_20260703_091000_add_programs_is_discontinued from './20260703_091000_add_programs_is_discontinued';
import * as migration_20260703_092000_resync_episodes_id_sequence from './20260703_092000_resync_episodes_id_sequence';
import * as migration_20260703_093000_add_programs_is_continue from './20260703_093000_add_programs_is_continue';
import * as migration_20260703_094000_resync_seasons_and_episodes_id_sequences from './20260703_094000_resync_seasons_and_episodes_id_sequences';

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
    name: '20260703_024740_add_home_hero_images',
  },
  {
    up: migration_20260703_030120_simplify_home_hero_images.up,
    down: migration_20260703_030120_simplify_home_hero_images.down,
    name: '20260703_030120_simplify_home_hero_images'
  },
  {
    up: migration_20260703_090000_merge_types_into_categories.up,
    down: migration_20260703_090000_merge_types_into_categories.down,
    name: '20260703_090000_merge_types_into_categories'
  },
  {
    up: migration_20260703_091000_add_programs_is_discontinued.up,
    down: migration_20260703_091000_add_programs_is_discontinued.down,
    name: '20260703_091000_add_programs_is_discontinued'
  },
  {
    up: migration_20260703_092000_resync_episodes_id_sequence.up,
    down: migration_20260703_092000_resync_episodes_id_sequence.down,
    name: '20260703_092000_resync_episodes_id_sequence'
  },
  {
    up: migration_20260703_093000_add_programs_is_continue.up,
    down: migration_20260703_093000_add_programs_is_continue.down,
    name: '20260703_093000_add_programs_is_continue'
  },
  {
    up: migration_20260703_094000_resync_seasons_and_episodes_id_sequences.up,
    down: migration_20260703_094000_resync_seasons_and_episodes_id_sequences.down,
    name: '20260703_094000_resync_seasons_and_episodes_id_sequences'
  },
];
