const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const rootDir = path.resolve(__dirname, '..');
const legacyRootDir = 'D:\\Work\\ThaiPBS\\ThaiPBSAdmin';
const legacyGenreValue = 'Drama&Sitcom';
const targetGenreName = 'Drama&Sitcom';
const targetGenreSlug = 'drama-sitcom';
const mediaReferenceColumnsByTable = {
  programs: ['image_id', 'cover_image_id'],
  seasons: ['cover_image_id'],
  episodes: ['cover_image_id'],
};
const videoReferenceColumnsByTable = {
  programs: ['trailer_id', 'video_id'],
  seasons: ['trailer_id', 'video_id'],
  episodes: ['trailer_id', 'video_id'],
};

function readDotEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  return Object.fromEntries(
    fs
      .readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        const key = line.slice(0, index).trim();
        let value = line.slice(index + 1).trim();

        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        return [key, value];
      }),
  );
}

function getArg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

function assertSchemaName(value, label) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`${label} must be a simple PostgreSQL schema name. Received: ${value}`);
  }
}

function quoteIdent(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function normalizeDatabaseUrl(value) {
  if (!value) {
    return value;
  }

  const parsed = new URL(value);
  parsed.searchParams.delete('schema');
  return parsed.toString();
}

function resolveProjectPath(projectDir, value, fallback) {
  const rawPath = value || fallback;
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(projectDir, rawPath);
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function schemaExists(client, schema) {
  const result = await client.query(
    `select exists (
      select 1 from information_schema.schemata where schema_name = $1
    ) as exists`,
    [schema],
  );

  return result.rows[0].exists;
}

async function tableExists(client, schema, table) {
  const result = await client.query(
    `select exists (
      select 1
      from information_schema.tables
      where table_schema = $1 and table_name = $2 and table_type = 'BASE TABLE'
    ) as exists`,
    [schema, table],
  );

  return result.rows[0].exists;
}

async function getColumns(client, schema, table) {
  const result = await client.query(
    `select column_name, data_type, udt_schema, udt_name, identity_generation, is_nullable, column_default
     from information_schema.columns
     where table_schema = $1 and table_name = $2
     order by ordinal_position`,
    [schema, table],
  );

  return result.rows;
}

function isCompatibleColumn(sourceColumn, targetColumn) {
  if (sourceColumn.column_name === 'genre' || sourceColumn.column_name === 'genre_sub') {
    return false;
  }

  if (sourceColumn.data_type === targetColumn.data_type) {
    return true;
  }

  if (sourceColumn.data_type === 'USER-DEFINED' && targetColumn.data_type === 'USER-DEFINED') {
    return true;
  }

  return false;
}

async function getCopyColumns(client, sourceSchema, targetSchema) {
  return getCopyColumnsForTable(client, sourceSchema, targetSchema, 'programs');
}

async function getExistingColumns(client, schema, table, columnNames) {
  const columns = await getColumns(client, schema, table);
  const existingColumnNames = new Set(columns.map((column) => column.column_name));

  return columnNames.filter((columnName) => existingColumnNames.has(columnName));
}

async function getReferencedUploadIds(client, sourceSchema, table, uploadColumns, whereSql, params) {
  if (!uploadColumns.length) {
    return [];
  }

  const unionSelect = uploadColumns
    .map((column) => `select ${quoteIdent(column)} as upload_id from ${quoteIdent(sourceSchema)}.${quoteIdent(table)} p where ${whereSql}`)
    .join(' union ');
  const result = await client.query(
    `select distinct upload_id
     from (${unionSelect}) referenced_uploads
     where upload_id is not null
     order by upload_id`,
    params,
  );

  return result.rows.map((row) => row.upload_id);
}

async function copyReferencedUploadRows(client, sourceSchema, targetSchema, table, uploadIds) {
  if (!uploadIds.length) {
    return 0;
  }

  const copyColumns = await getCopyColumnsForTable(client, sourceSchema, targetSchema, table);

  if (!copyColumns.length) {
    throw new Error(`No compatible columns found for ${table} copy.`);
  }

  const columnList = copyColumns.map(({ target }) => quoteIdent(target.column_name)).join(', ');
  const selectList = copyColumns
    .map(({ source, target }) => buildSelectExpression(source, target))
    .join(', ');
  const hasIdentityColumn = copyColumns.some(({ target }) => target.identity_generation);
  const overrideIdentity = hasIdentityColumn ? ' overriding system value' : '';
  const inserted = await client.query(
    `insert into ${quoteIdent(targetSchema)}.${quoteIdent(table)} (${columnList})${overrideIdentity}
     select ${selectList}
     from ${quoteIdent(sourceSchema)}.${quoteIdent(table)} p
     where p.id = any($1)
     on conflict (id) do nothing`,
    [uploadIds],
  );

  return inserted.rowCount;
}

async function getCopyColumnsForTable(client, sourceSchema, targetSchema, table) {
  const sourceColumns = await getColumns(client, sourceSchema, table);
  const targetColumns = await getColumns(client, targetSchema, table);
  const targetColumnsByName = new Map(targetColumns.map((column) => [column.column_name, column]));

  return sourceColumns
    .filter((sourceColumn) => targetColumnsByName.has(sourceColumn.column_name))
    .filter((sourceColumn) => isCompatibleColumn(sourceColumn, targetColumnsByName.get(sourceColumn.column_name)))
    .map((sourceColumn) => ({
      source: sourceColumn,
      target: targetColumnsByName.get(sourceColumn.column_name),
    }));
}

async function getReferencedUploadFiles(client, sourceSchema, table, uploadIds) {
  if (!uploadIds.length) {
    return [];
  }

  const result = await client.query(
    `select id, filename
     from ${quoteIdent(sourceSchema)}.${quoteIdent(table)}
     where id = any($1)
       and filename is not null
     order by id`,
    [uploadIds],
  );

  return result.rows;
}

function copyReferencedUploadFiles(uploadFiles, sourceUploadDir, targetUploadDir) {
  let copied = 0;
  let skippedExisting = 0;
  const missing = [];

  fs.mkdirSync(targetUploadDir, { recursive: true });

  for (const uploadFile of uploadFiles) {
    const filename = path.basename(uploadFile.filename);
    const sourcePath = path.join(sourceUploadDir, filename);
    const targetPath = path.join(targetUploadDir, filename);

    if (!fs.existsSync(sourcePath)) {
      missing.push(filename);
      continue;
    }

    if (fs.existsSync(targetPath)) {
      skippedExisting += 1;
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
    copied += 1;
  }

  return { copied, skippedExisting, missing };
}

function buildSelectExpression(sourceColumn, targetColumn) {
  const columnRef = `p.${quoteIdent(sourceColumn.column_name)}`;

  if (
    sourceColumn.data_type === 'USER-DEFINED' &&
    targetColumn.data_type === 'USER-DEFINED' &&
    sourceColumn.udt_name === targetColumn.udt_name &&
    sourceColumn.udt_schema !== targetColumn.udt_schema
  ) {
    return `(${columnRef}::text)::${quoteIdent(targetColumn.udt_schema)}.${quoteIdent(targetColumn.udt_name)}`;
  }

  return columnRef;
}

function buildInsertMissingRowsStatement(sourceSchema, targetSchema, table, copyColumns, whereSql) {
  const columnList = copyColumns.map(({ target }) => quoteIdent(target.column_name)).join(', ');
  const selectList = copyColumns
    .map(({ source, target }) => buildSelectExpression(source, target))
    .join(', ');
  const hasIdentityColumn = copyColumns.some(({ target }) => target.identity_generation);
  const overrideIdentity = hasIdentityColumn ? ' overriding system value' : '';

  return `
    insert into ${quoteIdent(targetSchema)}.${quoteIdent(table)} (${columnList})${overrideIdentity}
    select ${selectList}
    from ${quoteIdent(sourceSchema)}.${quoteIdent(table)} p
    where ${whereSql}
    on conflict (id) do nothing
  `;
}

async function findOrCreateTargetGenreId(client, targetSchema) {
  const result = await client.query(
    `select id
     from ${quoteIdent(targetSchema)}.genres
     where name = $1 and slug = $2
     limit 1`,
    [targetGenreName, targetGenreSlug],
  );

  if (result.rowCount > 0) {
    return result.rows[0].id;
  }

  const insertResult = await client.query(
    `insert into ${quoteIdent(targetSchema)}.genres (name, slug, updated_at, created_at)
     values ($1, $2, now(), now())
     on conflict do nothing
     returning id`,
    [targetGenreName, targetGenreSlug],
  );

  if (insertResult.rowCount > 0) {
    return insertResult.rows[0].id;
  }

  throw new Error(
    `Could not create target genre "${targetGenreName}" (${targetGenreSlug}) because another genre already uses that name or slug.`,
  );
}

async function copyGenreRelationships(client, sourceSchema, targetSchema, genreId) {
  const relsTable = 'programs_rels';

  if (!(await tableExists(client, targetSchema, relsTable))) {
    throw new Error(`Target relationship table "${relsTable}" does not exist.`);
  }

  const relColumns = await getColumns(client, targetSchema, relsTable);
  const relColumnNames = new Set(relColumns.map((column) => column.column_name));
  const requiredColumns = ['parent_id', 'path', 'genres_id'];

  for (const column of requiredColumns) {
    if (!relColumnNames.has(column)) {
      throw new Error(`Target relationship table "${relsTable}" is missing required column "${column}".`);
    }
  }

  const insertColumns = ['parent_id', 'path', 'genres_id'];
  const selectExpressions = ['p.id', sqlLiteral('genre'), '$2'];

  if (relColumnNames.has('order')) {
    insertColumns.push('order');
    selectExpressions.push(
      `(select coalesce(max(existing.${quoteIdent('order')}) + 1, 1)
        from ${quoteIdent(targetSchema)}.${quoteIdent(relsTable)} existing
        where existing.parent_id = p.id and existing.path = 'genre')`,
    );
  }

  const inserted = await client.query(
    `insert into ${quoteIdent(targetSchema)}.${quoteIdent(relsTable)}
       (${insertColumns.map(quoteIdent).join(', ')})
     select ${selectExpressions.join(', ')}
     from ${quoteIdent(sourceSchema)}.programs p
     where p.genre::text = $1
       and exists (
         select 1 from ${quoteIdent(targetSchema)}.programs target_program
         where target_program.id = p.id
       )
       and not exists (
         select 1
         from ${quoteIdent(targetSchema)}.${quoteIdent(relsTable)} existing
         where existing.parent_id = p.id
           and existing.path = 'genre'
           and existing.genres_id = $2
       )`,
    [legacyGenreValue, genreId],
  );

  return inserted.rowCount;
}

async function copyProgramSeasonRelationships(client, sourceSchema, targetSchema) {
  const relsTable = 'programs_rels';

  if (!(await tableExists(client, targetSchema, relsTable))) {
    return 0;
  }

  const relColumns = await getColumns(client, targetSchema, relsTable);
  const relColumnNames = new Set(relColumns.map((column) => column.column_name));

  if (!relColumnNames.has('parent_id') || !relColumnNames.has('path') || !relColumnNames.has('seasons_id')) {
    return 0;
  }

  const insertColumns = ['parent_id', 'path', 'seasons_id'];
  const selectExpressions = ['p.id', sqlLiteral('seasons'), 's.id'];

  if (relColumnNames.has('order')) {
    insertColumns.push('order');
    selectExpressions.push(
      `(select count(*) + 1
        from ${quoteIdent(sourceSchema)}.seasons previous
        where previous.program_id = p.id and previous.id < s.id)`,
    );
  }

  const inserted = await client.query(
    `insert into ${quoteIdent(targetSchema)}.${quoteIdent(relsTable)}
       (${insertColumns.map(quoteIdent).join(', ')})
     select ${selectExpressions.join(', ')}
     from ${quoteIdent(sourceSchema)}.programs p
     join ${quoteIdent(sourceSchema)}.seasons s on s.program_id = p.id
     where p.genre::text = $1
       and exists (
         select 1 from ${quoteIdent(targetSchema)}.programs target_program
         where target_program.id = p.id
       )
       and exists (
         select 1 from ${quoteIdent(targetSchema)}.seasons target_season
         where target_season.id = s.id
       )
       and not exists (
         select 1
         from ${quoteIdent(targetSchema)}.${quoteIdent(relsTable)} existing
         where existing.parent_id = p.id
           and existing.path = 'seasons'
           and existing.seasons_id = s.id
       )`,
    [legacyGenreValue],
  );

  return inserted.rowCount;
}

async function copySeasonEpisodeRelationships(client, sourceSchema, targetSchema) {
  const relsTable = 'seasons_rels';

  if (!(await tableExists(client, targetSchema, relsTable))) {
    return 0;
  }

  const relColumns = await getColumns(client, targetSchema, relsTable);
  const relColumnNames = new Set(relColumns.map((column) => column.column_name));

  if (!relColumnNames.has('parent_id') || !relColumnNames.has('path') || !relColumnNames.has('episodes_id')) {
    return 0;
  }

  const insertColumns = ['parent_id', 'path', 'episodes_id'];
  const selectExpressions = ['s.id', sqlLiteral('episodes'), 'e.id'];

  if (relColumnNames.has('order')) {
    insertColumns.push('order');
    selectExpressions.push(
      `(select count(*) + 1
        from ${quoteIdent(sourceSchema)}.episodes previous
        where previous.season_id = s.id and previous.id < e.id)`,
    );
  }

  const inserted = await client.query(
    `insert into ${quoteIdent(targetSchema)}.${quoteIdent(relsTable)}
       (${insertColumns.map(quoteIdent).join(', ')})
     select ${selectExpressions.join(', ')}
     from ${quoteIdent(sourceSchema)}.programs p
     join ${quoteIdent(sourceSchema)}.seasons s on s.program_id = p.id
     join ${quoteIdent(sourceSchema)}.episodes e on e.season_id = s.id
     where p.genre::text = $1
       and exists (
         select 1 from ${quoteIdent(targetSchema)}.seasons target_season
         where target_season.id = s.id
       )
       and exists (
         select 1 from ${quoteIdent(targetSchema)}.episodes target_episode
         where target_episode.id = e.id
       )
       and not exists (
         select 1
         from ${quoteIdent(targetSchema)}.${quoteIdent(relsTable)} existing
         where existing.parent_id = s.id
           and existing.path = 'episodes'
           and existing.episodes_id = e.id
       )`,
    [legacyGenreValue],
  );

  return inserted.rowCount;
}

async function main() {
  const currentEnv = readDotEnv(path.join(rootDir, '.env'));
  const legacyEnvPath = getArg('--source-env', path.join(legacyRootDir, '.env'));
  const legacyEnv = readDotEnv(legacyEnvPath);
  const sourceSchema = getArg('--from', process.env.SOURCE_SCHEMA || legacyEnv.PAYLOAD_DB_SCHEMA || 'payload');
  const targetSchema = getArg('--to', process.env.TARGET_SCHEMA || currentEnv.PAYLOAD_DB_SCHEMA || 'pavillions');
  const shouldWrite = process.argv.includes('--yes');
  const sourceMediaDir = resolveProjectPath(
    legacyRootDir,
    process.env.SOURCE_PAYLOAD_MEDIA_DIR || legacyEnv.PAYLOAD_MEDIA_DIR,
    '../payload-uploads/media',
  );
  const targetMediaDir = resolveProjectPath(
    rootDir,
    process.env.PAYLOAD_MEDIA_DIR || currentEnv.PAYLOAD_MEDIA_DIR,
    './payload-uploads/media',
  );
  const sourceVideosDir = resolveProjectPath(
    legacyRootDir,
    process.env.SOURCE_PAYLOAD_VIDEOS_DIR || legacyEnv.PAYLOAD_VIDEOS_DIR,
    '../payload-uploads/videos',
  );
  const targetVideosDir = resolveProjectPath(
    rootDir,
    process.env.PAYLOAD_VIDEOS_DIR || currentEnv.PAYLOAD_VIDEOS_DIR,
    './payload-uploads/videos',
  );
  const sourceDatabaseUrl = normalizeDatabaseUrl(
    process.env.SOURCE_PAYLOAD_DATABASE_URL ||
      legacyEnv.PAYLOAD_DATABASE_URL ||
      legacyEnv.DATABASE_URL ||
      currentEnv.PAYLOAD_DATABASE_URL ||
      currentEnv.DATABASE_URL,
  );
  const targetDatabaseUrl = normalizeDatabaseUrl(
    process.env.PAYLOAD_DATABASE_URL || currentEnv.PAYLOAD_DATABASE_URL || process.env.DATABASE_URL || currentEnv.DATABASE_URL,
  );

  assertSchemaName(sourceSchema, '--from');
  assertSchemaName(targetSchema, '--to');

  if (!sourceDatabaseUrl) {
    throw new Error('Missing source database URL. Set SOURCE_PAYLOAD_DATABASE_URL or provide the legacy .env file.');
  }

  if (!targetDatabaseUrl) {
    throw new Error('Missing target PAYLOAD_DATABASE_URL or DATABASE_URL.');
  }

  if (sourceDatabaseUrl !== targetDatabaseUrl) {
    throw new Error('This script expects source and target schemas to be in the same PostgreSQL database.');
  }

  const client = new Client({ connectionString: targetDatabaseUrl });
  await client.connect();

  try {
    if (!(await schemaExists(client, sourceSchema))) {
      throw new Error(`Source schema "${sourceSchema}" does not exist.`);
    }

    if (!(await schemaExists(client, targetSchema))) {
      throw new Error(`Target schema "${targetSchema}" does not exist.`);
    }

    const countResult = await client.query(
      `select count(*)::bigint as count
       from ${quoteIdent(sourceSchema)}.programs
       where genre::text = $1`,
      [legacyGenreValue],
    );
    const seasonsCountResult = await client.query(
      `select count(*)::bigint as count
       from ${quoteIdent(sourceSchema)}.seasons s
       where exists (
         select 1 from ${quoteIdent(sourceSchema)}.programs p
         where p.id = s.program_id and p.genre::text = $1
       )`,
      [legacyGenreValue],
    );
    const episodesCountResult = await client.query(
      `select count(*)::bigint as count
       from ${quoteIdent(sourceSchema)}.episodes e
       where exists (
         select 1
         from ${quoteIdent(sourceSchema)}.seasons s
         join ${quoteIdent(sourceSchema)}.programs p on p.id = s.program_id
         where s.id = e.season_id and p.genre::text = $1
       )`,
      [legacyGenreValue],
    );
    const sourceCount = Number(countResult.rows[0].count);
    const seasonsCount = Number(seasonsCountResult.rows[0].count);
    const episodesCount = Number(episodesCountResult.rows[0].count);
    const programCopyColumns = await getCopyColumns(client, sourceSchema, targetSchema);
    const seasonCopyColumns = await getCopyColumnsForTable(client, sourceSchema, targetSchema, 'seasons');
    const episodeCopyColumns = await getCopyColumnsForTable(client, sourceSchema, targetSchema, 'episodes');
    const getUsableReferenceColumns = async (table, columns) => {
      const sourceColumns = await getExistingColumns(client, sourceSchema, table, columns);
      const targetColumns = await getExistingColumns(client, targetSchema, table, columns);

      return sourceColumns.filter((column) => targetColumns.includes(column));
    };
    const programMediaColumns = await getUsableReferenceColumns('programs', mediaReferenceColumnsByTable.programs);
    const seasonMediaColumns = await getUsableReferenceColumns('seasons', mediaReferenceColumnsByTable.seasons);
    const episodeMediaColumns = await getUsableReferenceColumns('episodes', mediaReferenceColumnsByTable.episodes);
    const programVideoColumns = await getUsableReferenceColumns('programs', videoReferenceColumnsByTable.programs);
    const seasonVideoColumns = await getUsableReferenceColumns('seasons', videoReferenceColumnsByTable.seasons);
    const episodeVideoColumns = await getUsableReferenceColumns('episodes', videoReferenceColumnsByTable.episodes);
    const programWhereSql = 'p.genre::text = $1';
    const seasonWhereSql = `exists (
      select 1 from ${quoteIdent(sourceSchema)}.programs source_program
      where source_program.id = p.program_id and source_program.genre::text = $1
    )`;
    const episodeWhereSql = `exists (
      select 1
      from ${quoteIdent(sourceSchema)}.seasons source_season
      join ${quoteIdent(sourceSchema)}.programs source_program on source_program.id = source_season.program_id
      where source_season.id = p.season_id and source_program.genre::text = $1
    )`;
    const mediaIds = [
      ...(await getReferencedUploadIds(client, sourceSchema, 'programs', programMediaColumns, programWhereSql, [legacyGenreValue])),
      ...(await getReferencedUploadIds(client, sourceSchema, 'seasons', seasonMediaColumns, seasonWhereSql, [legacyGenreValue])),
      ...(await getReferencedUploadIds(client, sourceSchema, 'episodes', episodeMediaColumns, episodeWhereSql, [legacyGenreValue])),
    ].filter((value, index, values) => values.indexOf(value) === index);
    const videoIds = [
      ...(await getReferencedUploadIds(client, sourceSchema, 'programs', programVideoColumns, programWhereSql, [legacyGenreValue])),
      ...(await getReferencedUploadIds(client, sourceSchema, 'seasons', seasonVideoColumns, seasonWhereSql, [legacyGenreValue])),
      ...(await getReferencedUploadIds(client, sourceSchema, 'episodes', episodeVideoColumns, episodeWhereSql, [legacyGenreValue])),
    ].filter((value, index, values) => values.indexOf(value) === index);
    const mediaFiles = await getReferencedUploadFiles(client, sourceSchema, 'media', mediaIds);
    const videoFiles = await getReferencedUploadFiles(client, sourceSchema, 'videos', videoIds);
    const skippedColumns = ['genre', 'genre_sub'];

    console.log(`Copying programs where legacy genre = "${legacyGenreValue}"`);
    console.log(`Source schema: ${sourceSchema}`);
    console.log(`Target schema: ${targetSchema}`);
    console.log(`Source media dir: ${sourceMediaDir}`);
    console.log(`Target media dir: ${targetMediaDir}`);
    console.log(`Source videos dir: ${sourceVideosDir}`);
    console.log(`Target videos dir: ${targetVideosDir}`);
    console.log(`Matched source programs: ${sourceCount}`);
    console.log(`Matched source seasons: ${seasonsCount}`);
    console.log(`Matched source episodes: ${episodesCount}`);
    console.log(`Target genre: ${targetGenreName} (${targetGenreSlug})`);
    console.log(`Referenced media rows: ${mediaIds.length}`);
    console.log(`Referenced media files: ${mediaFiles.length}`);
    console.log(`Referenced video rows: ${videoIds.length}`);
    console.log(`Referenced video files: ${videoFiles.length}`);
    console.log(`Compatible program columns to copy: ${programCopyColumns.map(({ target }) => target.column_name).join(', ')}`);
    console.log(`Compatible season columns to copy: ${seasonCopyColumns.map(({ target }) => target.column_name).join(', ')}`);
    console.log(`Compatible episode columns to copy: ${episodeCopyColumns.map(({ target }) => target.column_name).join(', ')}`);
    console.log(`Relationship columns handled separately: ${skippedColumns.join(', ')}`);

    if (!shouldWrite) {
      console.log('');
      console.log('Dry run only. Run with --yes to copy matching programs.');
      console.log('Writes are additive: existing programs and relationships are left unchanged.');
      return;
    }

    await client.query('begin');

    try {
      const genreId = await findOrCreateTargetGenreId(client, targetSchema);
      const mediaRowsCopied = await copyReferencedUploadRows(client, sourceSchema, targetSchema, 'media', mediaIds);
      const videoRowsCopied = await copyReferencedUploadRows(client, sourceSchema, targetSchema, 'videos', videoIds);
      const mediaFilesCopied = copyReferencedUploadFiles(mediaFiles, sourceMediaDir, targetMediaDir);
      const videoFilesCopied = copyReferencedUploadFiles(videoFiles, sourceVideosDir, targetVideosDir);
      const copyProgramsStatement = buildInsertMissingRowsStatement(
        sourceSchema,
        targetSchema,
        'programs',
        programCopyColumns,
        programWhereSql,
      );
      const copySeasonsStatement = buildInsertMissingRowsStatement(
        sourceSchema,
        targetSchema,
        'seasons',
        seasonCopyColumns,
        seasonWhereSql,
      );
      const copyEpisodesStatement = buildInsertMissingRowsStatement(
        sourceSchema,
        targetSchema,
        'episodes',
        episodeCopyColumns,
        episodeWhereSql,
      );
      const copiedPrograms = await client.query(copyProgramsStatement, [legacyGenreValue]);
      const copiedSeasons = await client.query(copySeasonsStatement, [legacyGenreValue]);
      const copiedEpisodes = await client.query(copyEpisodesStatement, [legacyGenreValue]);
      const relsCopied = await copyGenreRelationships(client, sourceSchema, targetSchema, genreId);
      const programSeasonRelsCopied = await copyProgramSeasonRelationships(client, sourceSchema, targetSchema);
      const seasonEpisodeRelsCopied = await copySeasonEpisodeRelationships(client, sourceSchema, targetSchema);

      await client.query('commit');

      console.log(`Inserted media rows: ${mediaRowsCopied}`);
      console.log(`Inserted video rows: ${videoRowsCopied}`);
      console.log(`Copied media files: ${mediaFilesCopied.copied}`);
      console.log(`Copied video files: ${videoFilesCopied.copied}`);
      console.log(`Skipped existing media files: ${mediaFilesCopied.skippedExisting}`);
      console.log(`Skipped existing video files: ${videoFilesCopied.skippedExisting}`);
      if (mediaFilesCopied.missing.length) {
        console.log(`Missing source media files: ${mediaFilesCopied.missing.join(', ')}`);
      }
      if (videoFilesCopied.missing.length) {
        console.log(`Missing source video files: ${videoFilesCopied.missing.join(', ')}`);
      }
      console.log(`Inserted new programs: ${copiedPrograms.rowCount}`);
      console.log(`Inserted new seasons: ${copiedSeasons.rowCount}`);
      console.log(`Inserted new episodes: ${copiedEpisodes.rowCount}`);
      console.log(`Added genre relationships: ${relsCopied}`);
      console.log(`Added program season relationships: ${programSeasonRelsCopied}`);
      console.log(`Added season episode relationships: ${seasonEpisodeRelsCopied}`);
      console.log('Done.');
    } catch (error) {
      await client.query('rollback');
      throw error;
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
