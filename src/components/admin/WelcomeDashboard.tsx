import type { ServerProps } from 'payload'

type QuickAction = {
  collection?: string
  description: string
  href: string
  label: string
  primary?: boolean
}

const quickActions: QuickAction[] = [
  {
    label: '+ Add program',
    description: 'Create a program with its seasons and episodes in one page.',
    href: '/admin/add-program-season-ep',
    collection: 'programs',
    primary: true,
  },
  {
    label: 'Programs Manager',
    description: 'Find and edit programs, seasons and episodes together.',
    href: '/admin/programs-manager',
    collection: 'programs',
  },
  {
    label: '+ Write new article',
    description: 'Start a new article for a program, season or episode.',
    href: '/admin/collections/articles/create',
    collection: 'articles',
  },
  {
    label: 'Videos',
    description: 'Upload and manage program videos.',
    href: '/admin/collections/videos',
    collection: 'videos',
  },
  {
    label: 'Media library',
    description: 'Upload and manage images and files.',
    href: '/admin/collections/media',
    collection: 'media',
  },
  {
    label: 'Categories',
    description: 'Organize categories, genres and sub genres.',
    href: '/admin/collections/categories',
    collection: 'categories',
  },
  {
    label: 'Landing page',
    description: 'Choose what appears on the landing page.',
    href: '/admin/collections/landing',
    collection: 'landing',
  },
  {
    label: 'Users',
    description: 'Manage admin accounts, roles and groups.',
    href: '/admin/collections/users',
    collection: 'users',
  },
]

const formatDate = (value: unknown) => {
  if (!value) return ''
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

type RecentArticle = {
  id: number | string
  status?: string | null
  titleEn?: string | null
  titleTh?: string | null
  updatedAt?: string
}

const getRecentArticles = async (payload: ServerProps['payload'], user: ServerProps['user']) => {
  try {
    const result = await payload.find({
      collection: 'articles',
      depth: 0,
      draft: true,
      limit: 6,
      overrideAccess: false,
      sort: '-updatedAt',
      user,
      select: { titleTh: true, titleEn: true, status: true, updatedAt: true },
    })
    return result.docs as RecentArticle[]
  } catch {
    return []
  }
}

const countArticles = async (
  payload: ServerProps['payload'],
  user: ServerProps['user'],
  status: 'draft' | 'published',
) => {
  try {
    const result = await payload.count({
      collection: 'articles',
      overrideAccess: false,
      user,
      where: { status: { equals: status } },
    })
    return result.totalDocs
  } catch {
    return 0
  }
}

export const WelcomeDashboard = async ({ payload, permissions, user }: ServerProps) => {
  const canRead = (collection?: string) =>
    !collection || Boolean((permissions?.collections as Record<string, { read?: unknown }> | undefined)?.[collection]?.read)
  const canReadArticles = canRead('articles')
  const actions = quickActions.filter((action) => canRead(action.collection))

  const [recentArticles, publishedCount, draftCount] = canReadArticles
    ? await Promise.all([
        getRecentArticles(payload, user),
        countArticles(payload, user, 'published'),
        countArticles(payload, user, 'draft'),
      ])
    : [[], 0, 0]

  return (
    <div className="ip-dashboard">
      <div className="ip-dashboard__welcome">
        <div>
          <h2 className="ip-dashboard__title">Welcome{user?.email ? `, ${user.email}` : ''}</h2>
          <p className="ip-dashboard__lead">
            {canReadArticles
              ? `${publishedCount} published · ${draftCount} draft${draftCount === 1 ? '' : 's'}. `
              : ''}
            What would you like to do?
          </p>
        </div>
        <a className="ip-dashboard__site-link" href="/" rel="noreferrer" target="_blank">
          View website ↗
        </a>
      </div>

      {actions.length > 0 && (
        <div className="ip-dashboard__actions">
          {actions.map((action) => (
            <a
              className={`ip-dashboard__action${action.primary ? ' ip-dashboard__action--primary' : ''}`}
              href={action.href}
              key={action.href}
            >
              <span className="ip-dashboard__action-label">{action.label}</span>
              <span className="ip-dashboard__action-description">{action.description}</span>
            </a>
          ))}
        </div>
      )}

      {canReadArticles && (
        <div className="ip-dashboard__recent">
          <div className="ip-dashboard__recent-header">
            <h3>Recently edited articles</h3>
            <a href="/admin/collections/articles">See all</a>
          </div>
          {recentArticles.length ? (
            <ul className="ip-dashboard__recent-list">
              {recentArticles.map((article) => (
                <li key={article.id}>
                  <a href={`/admin/collections/articles/${article.id}`}>
                    {article.titleTh || article.titleEn || 'Untitled'}
                  </a>
                  <span className={`ip-dashboard__status ip-dashboard__status--${article.status || 'draft'}`}>
                    {article.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  <span className="ip-dashboard__date">{formatDate(article.updatedAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ip-dashboard__empty">
              No articles yet. <a href="/admin/collections/articles/create">Write your first article</a>.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
