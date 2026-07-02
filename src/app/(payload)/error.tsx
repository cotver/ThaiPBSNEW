'use client'

import React from 'react'

export default function PayloadError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px' }}>
        <h1>Payload Admin Error</h1>
        <pre style={{ background: '#f5f5f5', padding: '1rem', overflow: 'auto', fontSize: '13px', border: '1px solid #ddd' }}>
          {error.message || 'Unknown error'}
          {error.stack ? `\n\n${error.stack}` : ''}
        </pre>
        <ul style={{ marginTop: '1rem', lineHeight: 1.8 }}>
          <li>Ensure <strong>PostgreSQL</strong> is running and <code>DATABASE_URL</code> / <code>PAYLOAD_DATABASE_URL</code> in <code>.env</code> is correct.</li>
          <li>Set <code>PAYLOAD_SECRET</code> in <code>.env</code> to a long random string (32+ characters).</li>
        </ul>
        <button type="button" onClick={reset} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Try again
        </button>
      </body>
    </html>
  )
}
