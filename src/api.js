// ── Cache TTLs ────────────────────────────────────────────────────────────────
const TTL_SEARCH = 7 * 24 * 60 * 60 * 1000  // 7 days — era-locked results never change
const LS_PREFIX  = 'vv2_'

// ── localStorage helpers ──────────────────────────────────────────────────────
function lsGet(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    if (!raw) return null
    const { data, ts, ttl } = JSON.parse(raw)
    if (Date.now() - ts > ttl) { localStorage.removeItem(LS_PREFIX + key); return null }
    return data
  } catch { return null }
}

function lsSet(key, data, ttl) {
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify({ data, ts: Date.now(), ttl })) }
  catch (e) { if (e.name === 'QuotaExceededError') pruneLS() }
}

function pruneLS() {
  Object.keys(localStorage)
    .filter(k => k.startsWith(LS_PREFIX))
    .forEach(k => localStorage.removeItem(k))
}

// ── In-flight deduplication ───────────────────────────────────────────────────
const _inflight = new Map()

async function _dedupe(key, fetcher) {
  if (_inflight.has(key)) return _inflight.get(key)
  const promise = fetcher().finally(() => _inflight.delete(key))
  _inflight.set(key, promise)
  return promise
}

// ── Public API ────────────────────────────────────────────────────────────────

// page: integer (Invidious uses page numbers, not tokens)
export async function ytSearch(query, order, page = 1) {
  const p = new URLSearchParams({ q: query, order: order || 'relevance', page: String(page) })
  const key = 'search:' + p.toString()

  const cached = lsGet(key)
  if (cached) {
    console.log(`[VidVault API] SEARCH cache hit — q="${query}" order="${order || 'relevance'}" page=${page}`)
    return cached
  }

  return _dedupe(key, async () => {
    console.log(`[VidVault API] SEARCH fetch — q="${query}" order="${order || 'relevance'}" page=${page}`)
    const res = await fetch(`/api/search?${p}`)
    if (!res.ok) throw new Error(`Search error ${res.status}`)
    const data = await res.json()
    lsSet(key, data, TTL_SEARCH)
    return data
  })
}

// Kept for compatibility — Invidious returns stats inline so this is a no-op
export async function ytVideoDetails(ids) {
  return { items: [] }
}
