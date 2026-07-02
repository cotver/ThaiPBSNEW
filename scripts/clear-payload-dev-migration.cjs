const fs = require('fs')
const { Pool } = require('pg')

for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^"(.*)"$/, '$1')
  }
}

const schema = process.env.PAYLOAD_DB_SCHEMA || 'public'
const connectionString = process.env.PAYLOAD_DATABASE_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('PAYLOAD_DATABASE_URL or DATABASE_URL is required')
}

const quoteIdent = (value) => `"${value.replace(/"/g, '""')}"`
const pool = new Pool({ connectionString })

pool
  .query(`delete from ${quoteIdent(schema)}."payload_migrations" where batch = -1`)
  .then((result) => {
    console.log(`deleted=${result.rowCount}`)
  })
  .finally(() => pool.end())
