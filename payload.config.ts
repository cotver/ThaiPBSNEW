import sharp from 'sharp'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'
import { ArticleEmbedBlock } from './blocks/ArticleEmbedBlock.ts'
import { ArticleImageGroupBlock } from './blocks/ArticleImageGroupBlock.ts'
import { withCollectionPermissions } from './src/lib/payload-permissions.ts'
import { Users } from './collections/Users.ts'
import { RoleProfiles } from './collections/RoleProfiles.ts'
import { UserGroups } from './collections/UserGroups.ts'
import { Media } from './collections/Media.ts'
import { Videos } from './collections/Videos.ts'
import { Landing } from './collections/Landing.ts'
import { Trends } from './collections/Trends.ts'
import { Content } from './collections/Content.ts'
import { Header } from './collections/Header.ts'
import { Footer } from './collections/Footer.ts'
import { Languages } from './collections/Languages.ts'
import { Awards } from './collections/Awards.ts'
import { Categories } from './collections/Categories.ts'
import { Genres } from './collections/Genres.ts'
import { SubGenres } from './collections/SubGenres.ts'
import { Programs } from './collections/Programs.ts'
import { VipaPrograms } from './collections/VipaPrograms.ts'
import { Seasons } from './collections/Seasons.ts'
import { Episodes } from './collections/Episodes.ts'

const payloadDatabaseUrl = process.env.PAYLOAD_DATABASE_URL || process.env.DATABASE_URL || ''
const payloadDbSchema = process.env.PAYLOAD_DB_SCHEMA || 'payload'

export default buildConfig({
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      BlocksFeature({
        blocks: [ArticleEmbedBlock, ArticleImageGroupBlock],
      }),
    ],
  }),
  cookiePrefix: process.env.PAYLOAD_COOKIE_PREFIX || 'thaipbsnew',

  routes: {
    admin: '/admin',
    api: '/api',
    graphQL: '/api/graphql',
  },

  admin: {
    user: 'users',
    suppressHydrationWarning: true,
    components: {
      afterNavLinks: [
        '@/components/admin/ProgramsManagerNavLink#ProgramsManagerNavLink',
      ],
      views: {
        ProgramsManagerAdd: {
          Component: '@/components/admin/ProgramsManagerAdd#ProgramsManagerAddView',
          path: '/add-program-season-ep',
          exact: true,
          meta: {
            title: 'Add Program, Season & Episodes',
            description: 'Create a program with seasons and episodes in one page',
          },
        },
        ProgramsManager: {
          Component: '@/components/admin/ProgramsManagerList#ProgramsManagerListView',
          path: '/programs-manager',
          exact: true,
          meta: {
            title: 'Programs Manager',
            description: 'Manage programs with seasons and episodes',
          },
        },
        ProgramsManagerEdit: {
          Component: '@/components/admin/ProgramsManagerEdit#ProgramsManagerEditView',
          path: '/programs-manager/:id',
          meta: {
            title: 'Edit Program',
            description: 'Edit program, seasons and episodes in one page',
          },
        },
      },
    },
  },

  collections: withCollectionPermissions([
    Users,
    RoleProfiles,
    UserGroups,
    Media,
    Videos,
    Landing,
    Trends,
    Content,
    Header,
    Footer,
    Languages,
    Awards,
    Categories,
    Genres,
    SubGenres,
    Programs,
    VipaPrograms,
    Seasons,
    Episodes,
  ]),

  upload: {
    useTempFiles: false,
    uploadTimeout: 0,
  },

  secret: process.env.PAYLOAD_SECRET || 'dev-secret-min-32-chars-long-change-me',
  db: postgresAdapter({
    pool: {
      connectionString: payloadDatabaseUrl,
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    },
    schemaName: payloadDbSchema,
    push: false,
  }),

  sharp,
})
