import * as migration_20260702_025148 from './20260702_025148';
import * as migration_20260702_044418 from './20260702_044418';
import * as migration_20260702_044638 from './20260702_044638';
import * as migration_20260702_052617 from './20260702_052617';
import * as migration_20260702_053645 from './20260702_053645';

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
    name: '20260702_053645'
  },
];
