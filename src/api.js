// ── Cache ─────────────────────────────────────────────────────────────────────
const TTL = 7 * 24 * 60 * 60 * 1000
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

const _inflight = new Map()
async function _dedupe(key, fetcher) {
  if (_inflight.has(key)) return _inflight.get(key)
  const p = fetcher().finally(() => _inflight.delete(key))
  _inflight.set(key, p)
  return p
}

// ── Public API ────────────────────────────────────────────────────────────────
// page: '1' for first page, or a continuation token string for subsequent pages

export async function ytSearch(query, order, page = 1) {
  const key = `search:${query}:${order || 'relevance'}:${page}`
  const cached = lsGet(key)
  if (cached) {
    console.log(`[VidVault] cache hit — "${query}" p${page}`)
    return cached
  }
  return _dedupe(key, async () => {
    console.log(`[VidVault] fetch — "${query}" p${page}`)
    const p = new URLSearchParams({ q: query, order: order || 'relevance', page: String(page) })
    const res = await fetch(`/api/search?${p}`)
    if (!res.ok) throw new Error(`Search error ${res.status}`)
    const data = await res.json()
    lsSet(key, data)
    return data
  })
}

export async function ytVideoDetails() { return { items: [] } }
