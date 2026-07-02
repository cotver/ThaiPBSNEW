function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`
}

export async function ensurePostgresSchema({
  connectionString,
  schemaName,
}: {
  connectionString: string
  schemaName: string
}): Promise<void> {
  if (!connectionString || !schemaName || schemaName === 'public') return

  const { Pool } = await import('pg')
  const pool = new Pool({ connectionString })

  try {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdentifier(schemaName)}`)
  } finally {
    await pool.end()
  }
}
