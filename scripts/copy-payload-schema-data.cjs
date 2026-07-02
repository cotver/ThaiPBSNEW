const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const rootDir = path.resolve(__dirname, '..');

function readDotEnv() {
  const envPath = path.join(rootDir, '.env');

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

async function schemaExists(client, schema) {
  const result = await client.query(
    `select exists (
      select 1 from information_schema.schemata where schema_name = $1
    ) as exists`,
    [schema],
  );

  return result.rows[0].exists;
}

async function getTables(client, schema) {
  const result = await client.query(
    `select table_name
     from information_schema.tables
     where table_schema = $1 and table_type = 'BASE TABLE'
     order by table_name`,
    [schema],
  );

  return result.rows.map((row) => row.table_name);
}

async function getColumns(client, schema, table) {
  const result = await client.query(
    `select column_name, data_type, udt_schema, udt_name, identity_generation, is_generated
     from information_schema.columns
     where table_schema = $1 and table_name = $2
     order by ordinal_position`,
    [schema, table],
  );

  return result.rows.filter((row) => row.is_generated !== 'ALWAYS');
}

async function getRowCount(client, schema, table) {
  const result = await client.query(
    `select count(*)::bigint as count from ${quoteIdent(schema)}.${quoteIdent(table)}`,
  );

  return Number(result.rows[0].count);
}

async function resetSerialSequences(client, schema, tables) {
  for (const table of tables) {
    const result = await client.query(
      `select column_name
       from information_schema.columns
       where table_schema = $1
         and table_name = $2
         and column_default like 'nextval(%'`,
      [schema, table],
    );

    for (const { column_name: column } of result.rows) {
      const sequenceResult = await client.query('select pg_get_serial_sequence($1, $2) as sequence', [
        `${quoteIdent(schema)}.${quoteIdent(table)}`,
        column,
      ]);
      const sequence = sequenceResult.rows[0].sequence;

      if (!sequence) {
        continue;
      }

      const maxResult = await client.query(
        `select max(${quoteIdent(column)}) as max from ${quoteIdent(schema)}.${quoteIdent(table)}`,
      );
      const max = maxResult.rows[0].max;

      await client.query('select setval($1::regclass, $2::bigint, $3::boolean)', [
        sequence,
        max || 1,
        max !== null,
      ]);
    }
  }
}

async function markBootstrapMigration(client, schema) {
  const tables = await getTables(client, schema);

  if (!tables.includes('payload_migrations')) {
    return;
  }

  const migrationName = '20260702_025148';
  const exists = await client.query(
    `select 1 from ${quoteIdent(schema)}.payload_migrations where name = $1 limit 1`,
    [migrationName],
  );

  if (exists.rowCount > 0) {
    return;
  }

  const batch = await client.query(
    `select coalesce(max(batch), 0) + 1 as next_batch from ${quoteIdent(schema)}.payload_migrations`,
  );

  await client.query(
    `insert into ${quoteIdent(schema)}.payload_migrations (name, batch, updated_at, created_at)
     values ($1, $2, now(), now())`,
    [migrationName, batch.rows[0].next_batch],
  );
}

async function main() {
  const dotEnv = readDotEnv();
  const sourceSchema = getArg('--from', process.env.SOURCE_SCHEMA || 'payload');
  const targetSchema = getArg('--to', process.env.TARGET_SCHEMA || 'pavillions');
  const shouldWrite = process.argv.includes('--yes');
  const databaseUrl = normalizeDatabaseUrl(
    process.env.PAYLOAD_DATABASE_URL || dotEnv.PAYLOAD_DATABASE_URL || process.env.DATABASE_URL || dotEnv.DATABASE_URL,
  );

  assertSchemaName(sourceSchema, '--from');
  assertSchemaName(targetSchema, '--to');

  if (!databaseUrl) {
    throw new Error('Missing PAYLOAD_DATABASE_URL or DATABASE_URL.');
  }

  if (sourceSchema === targetSchema) {
    throw new Error('Source and target schema must be different.');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const sourceExists = await schemaExists(client, sourceSchema);
    const targetExists = await schemaExists(client, targetSchema);

    if (!sourceExists) {
      throw new Error(`Source schema "${sourceSchema}" does not exist.`);
    }

    if (!targetExists) {
      throw new Error(`Target schema "${targetSchema}" does not exist.`);
    }

    const sourceTables = await getTables(client, sourceSchema);
    const targetTables = await getTables(client, targetSchema);
    const targetTableSet = new Set(targetTables);
    const copyTables = sourceTables.filter((table) => targetTableSet.has(table));
    const skippedTables = sourceTables.filter((table) => !targetTableSet.has(table));

    console.log(`Copying data from "${sourceSchema}" to "${targetSchema}"`);
    console.log(`Tables to copy: ${copyTables.length}`);

    if (skippedTables.length) {
      console.log(`Skipped source tables missing in target: ${skippedTables.join(', ')}`);
    }

    for (const table of copyTables) {
      const count = await getRowCount(client, sourceSchema, table);
      console.log(`- ${table}: ${count} rows`);
    }

    if (!shouldWrite) {
      console.log('');
      console.log('Dry run only. Run with --yes to truncate target tables and copy the data.');
      return;
    }

    await client.query('begin');

    try {
      await client.query('set local session_replication_role = replica');

      if (copyTables.length) {
        const targetRefs = copyTables.map((table) => `${quoteIdent(targetSchema)}.${quoteIdent(table)}`).join(', ');
        await client.query(`truncate ${targetRefs} restart identity cascade`);
      }

      for (const table of copyTables) {
        const sourceColumns = await getColumns(client, sourceSchema, table);
        const targetColumns = await getColumns(client, targetSchema, table);
        const targetColumnsByName = new Map(targetColumns.map((column) => [column.column_name, column]));
        const columns = sourceColumns.filter((column) => targetColumnsByName.has(column.column_name));

        if (!columns.length) {
          console.log(`- ${table}: skipped, no matching columns`);
          continue;
        }

        const columnList = columns.map((column) => quoteIdent(column.column_name)).join(', ');
        const selectList = columns
          .map((column) => {
            const targetColumn = targetColumnsByName.get(column.column_name);
            const columnRef = quoteIdent(column.column_name);

            if (
              column.data_type === 'USER-DEFINED' &&
              targetColumn.data_type === 'USER-DEFINED' &&
              column.udt_name === targetColumn.udt_name &&
              column.udt_schema !== targetColumn.udt_schema
            ) {
              return `(${columnRef}::text)::${quoteIdent(targetColumn.udt_schema)}.${quoteIdent(targetColumn.udt_name)}`;
            }

            return columnRef;
          })
          .join(', ');
        const hasIdentityColumn = targetColumns.some((column) => column.identity_generation);
        const overrideIdentity = hasIdentityColumn ? ' overriding system value' : '';

        const inserted = await client.query(
          `insert into ${quoteIdent(targetSchema)}.${quoteIdent(table)} (${columnList})${overrideIdentity}
           select ${selectList} from ${quoteIdent(sourceSchema)}.${quoteIdent(table)}`,
        );

        console.log(`- ${table}: copied ${inserted.rowCount} rows`);
      }

      await markBootstrapMigration(client, targetSchema);
      await resetSerialSequences(client, targetSchema, copyTables);
      await client.query('commit');
    } catch (error) {
      await client.query('rollback');
      throw error;
    }

    console.log('');
    console.log('Done. Target schema data was replaced with the source schema data.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
