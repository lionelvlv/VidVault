// ── Cache ─────────────────────────────────────────────────────────────────────
const TTL = 7 * 24 * 60 * 60 * 1000  // 7 days — era-locked results never change
const LS_PREFIX = 'vv2_'

function lsGet(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > TTL) { localStorage.removeItem(LS_PREFIX + key); return null }
    return data
  } catch { return null }
}

function lsSet(key, data) {
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify({ data, ts: Date.now() })) }
  catch (e) {
    if (e.name === 'QuotaExceededError') {
      Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX)).forEach(k => localStorage.removeItem(k))
    }
  }
}

// ── In-flight dedup ───────────────────────────────────────────────────────────
const _inflight = new Map()
async function _dedupe(key, fetcher) {
  if (_inflight.has(key)) return _inflight.get(key)
  const p = fetcher().finally(() => _inflight.delete(key))
  _inflight.set(key, p)
  return p
}

// ── Invidious instances — called directly from browser (not through Vercel) ───
const INSTANCES = [
  'https://inv.nadeko.net',
  'https://yewtu.be',
  'https://invidious.nerdvpn.de',
]

// Shuffle instances per session so load is distributed
const _instances = [...INSTANCES].sort(() => Math.random() - 0.5)

const ERA_START = 631152000   // 2005-01-01 unix
const ERA_END   = 1262303999  // 2009-12-31 unix

async function invidiousSearch(q, order, page = 1) {
  const params = new URLSearchParams({
    q,
    type:  'video',
    sort:  order === 'date' ? 'upload_date' : 'relevance',
    page:  String(page),
  })

  for (const instance of _instances) {
    try {
      const res = await fetch(`${instance}/api/v1/search?${params}`, {
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) continue
      const raw = await res.json()
      if (!Array.isArray(raw)) continue

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
              medium:  { url: v.videoThumbnails?.find(t => t.quality === 'medium')?.url ?? v.videoThumbnails?.[0]?.url ?? '' },
              default: { url: v.videoThumbnails?.[v.videoThumbnails.length - 1]?.url ?? '' },
            },
          },
          statistics: {
            viewCount: String(v.viewCount ?? ''),
          },
        }))

      return { items, pageInfo: { totalResults: items.length } }
    } catch { /* try next */ }
  }
  throw new Error('All Invidious instances failed — try again later')
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function ytSearch(query, order, page = 1) {
  const key = `search:${query}:${order || 'relevance'}:${page}`
  const cached = lsGet(key)
  if (cached) {
    console.log(`[VidVault] cache hit — "${query}" p${page}`)
    return cached
  }
  return _dedupe(key, async () => {
    console.log(`[VidVault] fetch — "${query}" p${page}`)
    const data = await invidiousSearch(query, order, page)
    lsSet(key, data)
    return data
  })
}

// No-op — Invidious returns stats inline with search results
export async function ytVideoDetails() { return { items: [] } }
