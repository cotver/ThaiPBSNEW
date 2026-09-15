import process from 'node:process'

const DEFAULT_D1_URL = 'https://d1-read-proxy.thaipbs.workers.dev/'
const d1Url = process.env.D1_URL || DEFAULT_D1_URL
const apiKey = process.env.D1_API_KEY || process.env.API_KEY
const timeoutMs = Number.parseInt(process.env.D1_API_TIMEOUT_MS || '30000', 10)
const showResult = process.env.D1_SHOW_RESULT === '1' || process.argv.includes('--show-result')

const endpoints = [
  {
    name: 'health',
    path: '/health',
    expectJson: false,
  },
  {
    name: 'onboarding deals',
    path: '/api/onboarding-deals',
    query: {
      limit: '500',
      include_payload_json: '0',
    },
    expectJson: true,
  },
  {
    name: 'BMS acquisition rows',
    path: '/api/bms-acquisition-rows',
    query: {
      limit: '200',
      include_data_json: '0',
    },
    expectJson: true,
  },
]

function buildUrl(path, query = {}) {
  const url = new URL(path, d1Url.endsWith('/') ? d1Url : `${d1Url}/`)

  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value)
  }

  return url
}

function truncate(value, maxLength = 180) {
  const text = String(value).replace(/\s+/g, ' ').trim()
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
}

function describeBody(body) {
  if (Array.isArray(body)) {
    return `JSON array with ${body.length} item${body.length === 1 ? '' : 's'}`
  }

  if (body && typeof body === 'object') {
    const keys = Object.keys(body)
    const recordKey = ['data', 'rows', 'items', 'results'].find((key) => Array.isArray(body[key]))
    const recordCount = recordKey ? `; ${recordKey}=${body[recordKey].length}` : ''

    return `JSON object with keys: ${keys.slice(0, 10).join(', ') || '(none)'}${recordCount}`
  }

  return truncate(body || '(empty response)')
}

function printBody(body) {
  console.log(typeof body === 'string' ? body : JSON.stringify(body, null, 2))
}

async function requestEndpoint(endpoint) {
  const url = buildUrl(endpoint.path, endpoint.query)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
    })
    const responseText = await response.text()
    const contentType = response.headers.get('content-type') || ''
    let body = responseText

    if (contentType.includes('json') && responseText.trim()) {
      try {
        body = JSON.parse(responseText)
      } catch {
        throw new Error(`returned invalid JSON (${truncate(responseText)})`)
      }
    }

    if (!response.ok) {
      throw new Error(`returned HTTP ${response.status} ${response.statusText}: ${truncate(responseText)}`)
    }

    if (endpoint.expectJson && (!body || typeof body !== 'object')) {
      throw new Error(`returned HTTP 200 but not a JSON object/array`)
    }

    return {
      status: response.status,
      body,
      contentType,
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function main() {
  if (!apiKey) {
    throw new Error('Missing API key. Set D1_API_KEY (or API_KEY) before running this test.')
  }

  try {
    new URL(d1Url)
  } catch {
    throw new Error(`D1_URL is not a valid URL: ${d1Url}`)
  }

  const failures = []

  for (const endpoint of endpoints) {
    const url = buildUrl(endpoint.path, endpoint.query)

    try {
      const result = await requestEndpoint(endpoint)
      console.log(`[PASS] ${endpoint.name}: ${result.status} - ${describeBody(result.body)}`)
      console.log(`       ${url}`)

      if (showResult) {
        console.log(`       Result for ${endpoint.name}:`)
        printBody(result.body)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const safeMessage = apiKey ? message.replaceAll(apiKey, '[REDACTED]') : message
      console.error(`[FAIL] ${endpoint.name}: ${safeMessage}`)
      console.error(`       ${url}`)
      failures.push(endpoint.name)
    }
  }

  if (failures.length > 0) {
    throw new Error(`${failures.length} endpoint test${failures.length === 1 ? '' : 's'} failed.`)
  }

  console.log(`\nAll ${endpoints.length} D1 API endpoint tests passed.`)
}

try {
  await main()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`\nD1 API test failed: ${message}`)
  process.exitCode = 1
}
