const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const rootDir = path.resolve(__dirname, '..');
const legacyRootDir = 'D:\\Work\\ThaiPBS\\ThaiPBSAdmin';
const legacyGenreValue = 'Drama&Sitcom';
const targetGenreName = 'Drama&Sitcom';
const targetGenreSlug = 'drama-sitcom';

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
  const sourceColumns = await getColumns(client, sourceSchema, 'programs');
  const targetColumns = await getColumns(client, targetSchema, 'programs');
  const targetColumnsByName = new Map(targetColumns.map((column) => [column.column_name, column]));

  return sourceColumns
    .filter((sourceColumn) => targetColumnsByName.has(sourceColumn.column_name))
    .filter((sourceColumn) => isCompatibleColumn(sourceColumn, targetColumnsByName.get(sourceColumn.column_name)))
    .map((sourceColumn) => ({
      source: sourceColumn,
      target: targetColumnsByName.get(sourceColumn.column_name),
    }));
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

function buildInsertMissingProgramsStatement(sourceSchema, targetSchema, copyColumns) {
  const columnList = copyColumns.map(({ target }) => quoteIdent(target.column_name)).join(', ');
  const selectList = copyColumns
    .map(({ source, target }) => buildSelectExpression(source, target))
    .join(', ');
  const hasIdentityColumn = copyColumns.some(({ target }) => target.identity_generation);
  const overrideIdentity = hasIdentityColumn ? ' overriding system value' : '';

  return `
    insert into ${quoteIdent(targetSchema)}.programs (${columnList})${overrideIdentity}
    select ${selectList}
    from ${quoteIdent(sourceSchema)}.programs p
    where p.genre::text = $1
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

async function main() {
  const currentEnv = readDotEnv(path.join(rootDir, '.env'));
  const legacyEnvPath = getArg('--source-env', path.join(legacyRootDir, '.env'));
  const legacyEnv = readDotEnv(legacyEnvPath);
  const sourceSchema = getArg('--from', process.env.SOURCE_SCHEMA || legacyEnv.PAYLOAD_DB_SCHEMA || 'payload');
  const targetSchema = getArg('--to', process.env.TARGET_SCHEMA || currentEnv.PAYLOAD_DB_SCHEMA || 'pavillions');
  const shouldWrite = process.argv.includes('--yes');
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
    const sourceCount = Number(countResult.rows[0].count);
    const copyColumns = await getCopyColumns(client, sourceSchema, targetSchema);
    const skippedColumns = ['genre', 'genre_sub'];

    console.log(`Copying programs where legacy genre = "${legacyGenreValue}"`);
    console.log(`Source schema: ${sourceSchema}`);
    console.log(`Target schema: ${targetSchema}`);
    console.log(`Matched source programs: ${sourceCount}`);
    console.log(`Target genre: ${targetGenreName} (${targetGenreSlug})`);
    console.log(`Compatible columns to copy: ${copyColumns.map(({ target }) => target.column_name).join(', ')}`);
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
      const copyStatement = buildInsertMissingProgramsStatement(sourceSchema, targetSchema, copyColumns);
      const copied = await client.query(copyStatement, [legacyGenreValue]);
      const relsCopied = await copyGenreRelationships(client, sourceSchema, targetSchema, genreId);

      await client.query('commit');

      console.log(`Inserted new programs: ${copied.rowCount}`);
      console.log(`Added genre relationships: ${relsCopied}`);
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
