import { createCreditCollection } from './creditCollection.ts'

export const Writers = createCreditCollection({
  singular: 'Writer',
  plural: 'Writers',
  programField: 'writers',
  slug: 'writers',
})
