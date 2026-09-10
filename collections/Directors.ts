import { createCreditCollection } from './creditCollection.ts'

export const Directors = createCreditCollection({
  singular: 'Director',
  plural: 'Directors',
  programField: 'directors',
  slug: 'directors',
})
