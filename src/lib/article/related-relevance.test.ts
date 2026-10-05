import assert from 'node:assert/strict'
import test from 'node:test'
import { relatedTextTerms, richTextPlainText, scoreRelatedText } from './related-relevance.ts'

test('extracts visible text from nested Lexical content', () => {
  const content = { root: { children: [
    { children: [{ text: 'River' }, { text: ' restoration' }] },
    { children: [{ text: 'Wildlife returns' }] },
  ] } }
  assert.equal(richTextPlainText(content), 'River  restoration Wildlife returns')
})

test('shared title and content terms increase relatedness', () => {
  const source = relatedTextTerms('River restoration', 'Wildlife returns to the river')
  const sameTitle = relatedTextTerms('River restoration project', '')
  const contentMatch = relatedTextTerms('Conservation project', 'Restoration helps river wildlife')
  const unrelated = relatedTextTerms('Cinema releases', 'New films arrive')
  const frequency = new Map([['river', 2], ['restoration', 2], ['wildlife', 1]])

  assert.ok(scoreRelatedText(source, sameTitle, frequency, 6) > scoreRelatedText(source, contentMatch, frequency, 6))
  assert.ok(scoreRelatedText(source, contentMatch, frequency, 6) > 0)
  assert.equal(scoreRelatedText(source, unrelated, frequency, 6), 0)
})

test('common terms do not create matches across most articles', () => {
  const source = relatedTextTerms('River restoration', '')
  const candidate = relatedTextTerms('River festival', '')
  assert.equal(scoreRelatedText(source, candidate, new Map([['river', 5]]), 6), 0)
})

test('Thai title words can match article content', () => {
  const source = relatedTextTerms('แม่น้ำโขง', '')
  const candidate = relatedTextTerms('', 'ชุมชนริมแม่น้ำโขงกำลังฟื้นฟูพื้นที่')
  assert.ok(scoreRelatedText(source, candidate, new Map(), 2) > 0)
})
