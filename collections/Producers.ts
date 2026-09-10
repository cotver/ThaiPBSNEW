import { createCreditCollection } from './creditCollection.ts'

export const Producers = createCreditCollection({
  singular: 'Producer',
  plural: 'Producers',
  programField: 'producers',
  slug: 'producers',
})
