import { createCreditCollection } from './creditCollection.ts'

export const Artists = createCreditCollection({
  singular: 'Artist',
  plural: 'Artists',
  programField: 'artists',
  slug: 'artists',
})
