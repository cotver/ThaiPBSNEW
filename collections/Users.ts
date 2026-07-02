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
      },
      admin: {
        useAsTitle: 'email',
        defaultColumns: ['email', 'role', 'updatedAt'],
      },
      access: collectionAccess('users'),
      hooks: {
        beforeChange: [enforceUserSelfPasswordPolicy],
        afterChange: [syncUserRoleAndGroupMemberships],
      },
      fields: userPermissionFields,
    }
