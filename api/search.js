// api/search.js — Rotates through multiple YouTube API keys when quota is exhausted
// Add keys to Vercel env vars as YOUTUBE_API_KEY_1, YOUTUBE_API_KEY_2, etc.

const YT_SEARCH = 'https://www.googleapis.com/youtube/v3/search'
const ERA_START = '2005-04-23T00:00:00Z'
const ERA_END   = '2009-12-31T23:59:59Z'

function getKeys() {
  const keys = []
  // Collect YOUTUBE_API_KEY_1, _2, _3... plus legacy YOUTUBE_API_KEY
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`YOUTUBE_API_KEY_${i}`]
    if (k) keys.push(k)
  }
  if (process.env.YOUTUBE_API_KEY) keys.push(process.env.YOUTUBE_API_KEY)
  return keys
}

async function searchWithKey(key, q, order, page) {
  const params = new URLSearchParams({
    part:            'snippet',
    q,
    type:            'video',
    maxResults:      12,
    publishedAfter:  ERA_START,
    publishedBefore: ERA_END,
    order:           order || 'relevance',
    key,
  })
  if (page && page !== '1') params.set('pageToken', page)

  const res  = await fetch(YT_SEARCH + '?' + params)
  const data = await res.json()
  return { status: res.status, data }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { q, order, page } = req.query
  if (!q) return res.status(400).json({ error: 'Missing parameter: q' })

  const keys = getKeys()
  if (!keys.length) return res.status(500).json({ error: 'No API keys configured' })

  for (let i = 0; i < keys.length; i++) {
    try {
      const { status, data } = await searchWithKey(keys[i], q, order, page)

      // Quota exceeded — try next key
      if (status === 403 && data?.error?.errors?.[0]?.reason === 'quotaExceeded') {
        console.log(`Key ${i + 1} quota exceeded, trying next key…`)
        continue
      }

      if (!status.toString().startsWith('2')) {
        return res.status(status).json(data)
      }

      return res.status(200).json(data)
    } catch (err) {
      console.error(`Key ${i + 1} error:`, err.message)
      // Network error — try next key
      continue
    }
  }

  // All keys exhausted
  return res.status(429).json({
    error: 'All API keys have exceeded their daily quota. Resets at midnight Pacific Time.',
  })
}
