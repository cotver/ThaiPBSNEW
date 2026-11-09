import type { CollectionConfig } from 'payload'
import {
  collectionAccess,
  enforceUserSelfPasswordPolicy,
  syncUserRoleAndGroupMemberships,
  userPermissionFields,
} from '../src/lib/payload-permissions.ts'

export const Users: CollectionConfig = {
      slug: 'users',
      auth: {
        useSessions: false,
        // Lock an account for 15 minutes after 5 wrong passwords, to slow down password guessing.
        maxLoginAttempts: 5,
        lockTime: 15 * 60 * 1000,
        // Login tokens stay in the HttpOnly cookie; don't echo them into JSON responses scripts can read.
        removeTokenFromResponses: true,
        cookies: {
          sameSite: 'Lax',
          // Turn on once the admin is only reached over HTTPS; browsers drop Secure cookies on plain HTTP.
          secure: process.env.PAYLOAD_COOKIE_SECURE === 'true',
        },
      },
      admin: {
        useAsTitle: 'email',
        defaultColumns: ['email', 'role', 'updatedAt'],
        hidden: ({ user }) => user?.role !== 'super-admin',
      },
      access: collectionAccess('users'),
      hooks: {
        beforeChange: [enforceUserSelfPasswordPolicy],
        afterChange: [syncUserRoleAndGroupMemberships],
      },
      fields: userPermissionFields,
    }
