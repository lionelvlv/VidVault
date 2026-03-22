// api/search.js — Vercel serverless proxy to Piped API
// Piped is designed for programmatic API use, unlike Invidious public instances
 
const ERA_START_UNIX = 631152000   // 2005-01-01
const ERA_END_UNIX   = 1262303999  // 2009-12-31
 
// Official Piped instances with CDN — ordered by reliability
const INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi-libre.kavin.rocks',
  'https://piped-api.privacy.com.de',
  'https://api.piped.yt',
]
 
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
 
  const { q, order, page } = req.query
  if (!q) return res.status(400).json({ error: 'Missing parameter: q' })
 
  const params = new URLSearchParams({
    q,
    filter: 'videos',
    // Piped sort: date, views, relevance
    sort_order: order === 'date' ? 'upload_date' : order === 'viewCount' ? 'views' : 'relevance',
  })
  if (page && page !== '1') params.set('nextpage', page)
 
  for (const instance of INSTANCES) {
    try {
      const upstream = await fetch(`${instance}/search?${params}`, {
        headers: { 'User-Agent': 'VidVault/1.0' },
        signal: AbortSignal.timeout(8000),
      })
      if (!upstream.ok) continue
 
      const json = await upstream.json()
      const raw  = json.items ?? []
 
      // Filter to era, normalize to same shape the frontend expects
      const items = raw
        .filter(v => v.type === 'stream' && v.uploaded >= ERA_START_UNIX * 1000 && v.uploaded <= ERA_END_UNIX * 1000)
        .map(v => ({
          id:      { videoId: v.url?.replace('/watch?v=', '') ?? '' },
          snippet: {
            title:        v.title ?? '',
            channelTitle: v.uploaderName ?? '',
            publishedAt:  new Date(v.uploaded).toISOString(),
            description:  v.shortDescription ?? '',
            thumbnails: {
              medium:  { url: v.thumbnail ?? '' },
              default: { url: v.thumbnail ?? '' },
            },
          },
          statistics: {
            viewCount: String(v.views ?? ''),
          },
        }))
        .filter(v => v.id.videoId)
 
      return res.status(200).json({ items, pageInfo: { totalResults: items.length } })
    } catch { /* try next */ }
  }
 
  res.status(502).json({ error: 'All Piped instances failed — try again later' })
}
 
