import React from 'react'

const icons = [
  { label: 'Home', path: <path d="M4 10.5 12 4l8 6.5V20H6v-7h12" /> },
  { label: 'Search', path: <path d="m20 20-4.6-4.6M10.8 17a6.2 6.2 0 1 1 0-12.4 6.2 6.2 0 0 1 0 12.4Z" /> },
  { label: 'Plus', path: <path d="M12 5v14M5 12h14" /> },
  { label: 'Spark', path: <path d="M12 3l1.9 5.4L20 10l-6.1 1.6L12 17l-1.9-5.4L4 10l6.1-1.6L12 3ZM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8L18 16Z" /> },
  { label: 'Film', path: <path d="M5 4h14v16H5V4ZM8 4v16M16 4v16M5 8h3M5 16h3M16 8h3M16 16h3" /> },
  { label: 'Screen', path: <path d="M4 6h16v10H4V6ZM9 20h6M12 16v4" /> },
  { label: 'News', path: <path d="M5 5h14v14H5V5ZM8 9h8M8 13h8M8 17h5" /> },
  { label: 'Music', path: <path d="M9 18V6l10-2v12M9 18a3 3 0 1 1-2-2.83M19 16a3 3 0 1 1-2-2.83" /> },
  { label: 'Food', path: <path d="M7 3v8M11 3v8M7 7h4M9 11v10M17 3v18M14 7c0-2.2 1.3-4 3-4" /> },
  { label: 'Travel', path: <path d="M4 16 20 8M4 16l5 2 2 4 3-7 6-7-9 5-7 3Z" /> },
  { label: 'Kids', path: <path d="M8 10a4 4 0 1 1 8 0M5 21a7 7 0 0 1 14 0M9 14h6" /> },
  { label: 'Education', path: <path d="M3 8l9-5 9 5-9 5-9-5ZM6 11v5c2 2 10 2 12 0v-5" /> },
]

export function CategoryIconExamples() {
  return (
    <div style={{ marginTop: '-0.75rem', marginBottom: '1.25rem' }}>
      <p style={{ color: 'var(--theme-elevation-600)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
        Icon examples. This field is optional.
      </p>
      <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))' }}>
        {icons.map((icon) => (
          <div
            key={icon.label}
            style={{
              alignItems: 'center',
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: '6px',
              display: 'flex',
              gap: '0.5rem',
              padding: '0.5rem 0.625rem',
            }}
          >
            <svg
              aria-hidden="true"
              fill="none"
              height="20"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="20"
            >
              {icon.path}
            </svg>
            <span style={{ fontSize: '0.875rem' }}>{icon.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
