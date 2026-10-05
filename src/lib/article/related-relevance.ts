/** Text-only relevance helpers for Column article recommendations. */
const stopWords = new Set([
  'about', 'after', 'also', 'and', 'are', 'been', 'but', 'can', 'for', 'from', 'have',
  'into', 'its', 'more', 'our', 'that', 'the', 'their', 'them', 'there', 'these', 'this',
  'those', 'through', 'was', 'were', 'what', 'when', 'where', 'which', 'while', 'with',
  'your', 'story', 'stories', 'article', 'news',
  'การ', 'กับ', 'จาก', 'ของ', 'ข่าว', 'คือ', 'จะ', 'ที่', 'นี้', 'นั้น', 'และ', 'หรือ',
  'เป็น', 'เพื่อ', 'โดย', 'ใน', 'ได้', 'ให้', 'ไม่', 'ว่า', 'แล้ว', 'มี', 'คน',
])

const segmenter = new Intl.Segmenter('th', { granularity: 'word' })

export type RelatedTextTerms = { title: Set<string>; body: Set<string> }

export function richTextPlainText(content: unknown, limit = 12000): string {
  if (!content || typeof content !== 'object') return ''
  const result: string[] = []
  const stack: unknown[] = [content]
  let length = 0
  while (stack.length && length < limit) {
    const node = stack.pop()
    if (!node || typeof node !== 'object') continue
    const value = node as { text?: unknown; root?: unknown; children?: unknown }
    if (typeof value.text === 'string') {
      const text = value.text.slice(0, limit - length)
      result.push(text)
      length += text.length
    }
    if (Array.isArray(value.children)) stack.push(...value.children.toReversed())
    if (value.root) stack.push(value.root)
  }
  return result.join(' ')
}

function terms(text: string, limit: number): Set<string> {
  const found = new Set<string>()
  for (const item of segmenter.segment(text.slice(0, 12000).normalize('NFKC').toLowerCase())) {
    if (!item.isWordLike) continue
    const word = item.segment.trim()
    if (word.length < 2 || !/[\p{L}]/u.test(word) || stopWords.has(word)) continue
    found.add(word)
    if (found.size >= limit) break
  }
  return found
}

export function relatedTextTerms(title: string, body: string): RelatedTextTerms {
  return { title: terms(title, 80), body: terms(body, 600) }
}

export function scoreRelatedText(
  source: RelatedTextTerms,
  candidate: RelatedTextTerms,
  documentFrequency: ReadonlyMap<string, number>,
  documentCount: number,
): number {
  let score = 0
  const sourceTerms = new Set([...source.title, ...source.body])
  for (const word of sourceTerms) {
    if (documentCount >= 5 && (documentFrequency.get(word) || 0) / documentCount > 0.65) continue
    const inCandidateTitle = candidate.title.has(word)
    const inCandidateBody = candidate.body.has(word)
    if (!inCandidateTitle && !inCandidateBody) continue
    if (source.title.has(word) && inCandidateTitle) score += 6
    else if (source.title.has(word) || inCandidateTitle) score += 2
    else score += 1
  }
  return Math.min(score, 24)
}
