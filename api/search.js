const YT_SEARCH = 'https://www.googleapis.com/youtube/v3/search'
const ERA_START = '2005-04-23T00:00:00Z'
const ERA_END   = '2009-12-31T23:59:59Z'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const API_KEY = process.env.YOUTUBE_API_KEY
  if (!API_KEY) return res.status(500).json({ error: 'YOUTUBE_API_KEY not set' })

  const { q, order, page } = req.query
  if (!q) return res.status(400).json({ error: 'Missing parameter: q' })

  const params = new URLSearchParams({
    part:            'snippet',
    q,
    type:            'video',
    maxResults:      12,
    publishedAfter:  ERA_START,
    publishedBefore: ERA_END,
    order:           order || 'relevance',
    key:             API_KEY,
  })
  if (page && page !== '1') params.set('pageToken', page)

  try {
    const upstream = await fetch(YT_SEARCH + '?' + params)
    const data = await upstream.json()
    res.status(upstream.ok ? 200 : upstream.status).json(data)
  } catch (err) {
    res.status(502).json({ error: 'YouTube API error', detail: err.message })
  }
}
