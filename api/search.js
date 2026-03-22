// api/search.js — proxies to Invidious (no YouTube API key needed)
// Falls back through multiple instances if one fails

const ERA_START = 631152000   // 2005-01-01 unix
const ERA_END   = 1262303999  // 2009-12-31 unix

// Official instances from docs.invidious.io/instances — ordered by reliability
const INSTANCES = [
  'https://inv.nadeko.net',
  'https://yewtu.be',
  'https://invidious.nerdvpn.de',
]

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { q, order, page } = req.query
  if (!q) return res.status(400).json({ error: 'Missing parameter: q' })

  const params = new URLSearchParams({
    q,
    type:  'video',
    sort:  order === 'date' ? 'upload_date' : 'relevance',
    page:  page || '1',
  })

  // Try each instance in order until one works
  for (const instance of INSTANCES) {
    try {
      const upstream = await fetch(`${instance}/api/v1/search?${params}`, {
        signal: AbortSignal.timeout(8000),
      })
      if (!upstream.ok) continue

      const raw = await upstream.json()

      // Filter to era and normalize to a consistent shape
      const items = raw
        .filter(v => v.type === 'video' && v.published >= ERA_START && v.published <= ERA_END)
        .map(v => ({
          id:      { videoId: v.videoId },
          snippet: {
            title:        v.title,
            channelTitle: v.author,
            publishedAt:  new Date(v.published * 1000).toISOString(),
            description:  v.description ?? '',
            thumbnails: {
              medium:   { url: v.videoThumbnails?.find(t => t.quality === 'medium')?.url
                              ?? v.videoThumbnails?.[0]?.url ?? '' },
              default:  { url: v.videoThumbnails?.[v.videoThumbnails.length - 1]?.url ?? '' },
            },
          },
          statistics: {
            viewCount: String(v.viewCount ?? ''),
          },
        }))

      return res.status(200).json({ items, pageInfo: { totalResults: items.length } })
    } catch { /* try next instance */ }
  }

  res.status(502).json({ error: 'All Invidious instances failed' })
}
