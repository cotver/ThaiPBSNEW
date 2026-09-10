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
import * as migration_20260705_124900_resync_media_id_sequence from './20260705_124900_resync_media_id_sequence';
import * as migration_20260705_130500_resync_videos_id_sequence from './20260705_130500_resync_videos_id_sequence';
import * as migration_20260706_090000_add_category_header_and_post_room from './20260706_090000_add_category_header_and_post_room';
import * as migration_20260706_100000_convert_category_post_room_groups from './20260706_100000_convert_category_post_room_groups';
import * as migration_20260901_024119_add_program_articles from './20260901_024119_add_program_articles';
import * as migration_20260901_150335_add_article_featured_hero from './20260901_150335_add_article_featured_hero';
import * as migration_20260908_103100_add_program_director from './20260908_103100_add_program_director';
import * as migration_20260908_112300_add_program_credit_english_fields from './20260908_112300_add_program_credit_english_fields';
import * as migration_20260910_023059_add_credit_collections from './20260910_023059_add_credit_collections';
import * as migration_20260910_023503_add_credit_permissions from './20260910_023503_add_credit_permissions';
import * as migration_20260910_041500_add_editor_role from './20260910_041500_add_editor_role';
import * as migration_20260910_073652_add_bilingual_column_content from './20260910_073652_add_bilingual_column_content';
import * as migration_20260910_152421_add_column_article_feature_fields from './20260910_152421_add_column_article_feature_fields';
import * as migration_20260910_153102_add_column_article_promotion_fields from './20260910_153102_add_column_article_promotion_fields';
import * as migration_20260910_153459_add_column_article_markets_and_events from './20260910_153459_add_column_article_markets_and_events';

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
    name: '20260703_030120_simplify_home_hero_images',
  },
  {
    up: migration_20260703_090000_merge_types_into_categories.up,
    down: migration_20260703_090000_merge_types_into_categories.down,
    name: '20260703_090000_merge_types_into_categories',
  },
  {
    up: migration_20260703_091000_add_programs_is_discontinued.up,
    down: migration_20260703_091000_add_programs_is_discontinued.down,
    name: '20260703_091000_add_programs_is_discontinued',
  },
  {
    up: migration_20260703_092000_resync_episodes_id_sequence.up,
    down: migration_20260703_092000_resync_episodes_id_sequence.down,
    name: '20260703_092000_resync_episodes_id_sequence',
  },
  {
    up: migration_20260703_093000_add_programs_is_continue.up,
    down: migration_20260703_093000_add_programs_is_continue.down,
    name: '20260703_093000_add_programs_is_continue',
  },
  {
    up: migration_20260703_094000_resync_seasons_and_episodes_id_sequences.up,
    down: migration_20260703_094000_resync_seasons_and_episodes_id_sequences.down,
    name: '20260703_094000_resync_seasons_and_episodes_id_sequences',
  },
  {
    up: migration_20260705_124900_resync_media_id_sequence.up,
    down: migration_20260705_124900_resync_media_id_sequence.down,
    name: '20260705_124900_resync_media_id_sequence',
  },
  {
    up: migration_20260705_130500_resync_videos_id_sequence.up,
    down: migration_20260705_130500_resync_videos_id_sequence.down,
    name: '20260705_130500_resync_videos_id_sequence',
  },
  {
    up: migration_20260706_090000_add_category_header_and_post_room.up,
    down: migration_20260706_090000_add_category_header_and_post_room.down,
    name: '20260706_090000_add_category_header_and_post_room',
  },
  {
    up: migration_20260706_100000_convert_category_post_room_groups.up,
    down: migration_20260706_100000_convert_category_post_room_groups.down,
    name: '20260706_100000_convert_category_post_room_groups',
  },
  {
    up: migration_20260901_024119_add_program_articles.up,
    down: migration_20260901_024119_add_program_articles.down,
    name: '20260901_024119_add_program_articles',
  },
  {
    up: migration_20260901_150335_add_article_featured_hero.up,
    down: migration_20260901_150335_add_article_featured_hero.down,
    name: '20260901_150335_add_article_featured_hero',
  },
  {
    up: migration_20260908_103100_add_program_director.up,
    down: migration_20260908_103100_add_program_director.down,
    name: '20260908_103100_add_program_director',
  },
  {
    up: migration_20260908_112300_add_program_credit_english_fields.up,
    down: migration_20260908_112300_add_program_credit_english_fields.down,
    name: '20260908_112300_add_program_credit_english_fields',
  },
  {
    up: migration_20260910_023059_add_credit_collections.up,
    down: migration_20260910_023059_add_credit_collections.down,
    name: '20260910_023059_add_credit_collections',
  },
  {
    up: migration_20260910_023503_add_credit_permissions.up,
    down: migration_20260910_023503_add_credit_permissions.down,
    name: '20260910_023503_add_credit_permissions',
  },
  {
    up: migration_20260910_041500_add_editor_role.up,
    down: migration_20260910_041500_add_editor_role.down,
    name: '20260910_041500_add_editor_role',
  },
  {
    up: migration_20260910_073652_add_bilingual_column_content.up,
    down: migration_20260910_073652_add_bilingual_column_content.down,
    name: '20260910_073652_add_bilingual_column_content'
  },
  {
    up: migration_20260910_152421_add_column_article_feature_fields.up,
    down: migration_20260910_152421_add_column_article_feature_fields.down,
    name: '20260910_152421_add_column_article_feature_fields',
  },
  {
    up: migration_20260910_153102_add_column_article_promotion_fields.up,
    down: migration_20260910_153102_add_column_article_promotion_fields.down,
    name: '20260910_153102_add_column_article_promotion_fields',
  },
  {
    up: migration_20260910_153459_add_column_article_markets_and_events.up,
    down: migration_20260910_153459_add_column_article_markets_and_events.down,
    name: '20260910_153459_add_column_article_markets_and_events',
  },
];
