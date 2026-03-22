// ── Cache TTLs ────────────────────────────────────────────────────────────────
const TTL_SEARCH = 24 * 60 * 60 * 1000   // 24 h  — search results
const TTL_VIDEO  = 7  * 24 * 60 * 60 * 1000 // 7 days — video details (static data)
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
  catch (e) {
    // Storage quota exceeded — prune oldest entries and retry once
    if (e.name === 'QuotaExceededError') pruneLS()
  }
}

function pruneLS() {
  // Remove all our keys — simple but effective safety valve
  Object.keys(localStorage)
    .filter(k => k.startsWith(LS_PREFIX))
    .forEach(k => localStorage.removeItem(k))
}

// ── In-flight deduplication ───────────────────────────────────────────────────
// Prevents multiple simultaneous identical fetches (e.g. home page grid mount)
const _inflight = new Map()

async function _dedupe(key, fetcher) {
  if (_inflight.has(key)) return _inflight.get(key)
  const promise = fetcher().finally(() => _inflight.delete(key))
  _inflight.set(key, promise)
  return promise
}

// ── Per-video detail cache ────────────────────────────────────────────────────
// Caches individual video objects so a batch that overlaps a previous batch
// only fetches the truly new IDs.
function getCachedVideo(id) { return lsGet('v:' + id) }
function setCachedVideo(id, item) { lsSet('v:' + id, item, TTL_VIDEO) }

// ── Public API ────────────────────────────────────────────────────────────────

export async function ytSearch(query, order, pageToken) {
  const p = new URLSearchParams({ q: query, order: order || 'relevance' })
  if (pageToken) p.set('pageToken', pageToken)
  const key = 'search:' + p.toString()

  const cached = lsGet(key)
  if (cached) {
    console.log(`[VidVault API] SEARCH cache hit — q="${query}" order="${order || 'relevance'}"`)
    return cached
  }

  return _dedupe(key, async () => {
    console.log(`[VidVault API] SEARCH fetch — q="${query}" order="${order || 'relevance'}"${pageToken ? ` pageToken=${pageToken}` : ''}`)
    const res = await fetch(`/api/search?${p}`)
    if (!res.ok) throw new Error(`Search error ${res.status}`)
    const data = await res.json()
    lsSet(key, data, TTL_SEARCH)
    return data
  })
}

export async function ytVideoDetails(ids) {
  if (!ids.length) return { items: [] }

  // Split into cached vs uncached
  const cached  = []
  const missing = []
  for (const id of ids) {
    const hit = getCachedVideo(id)
    if (hit) cached.push(hit)
    else     missing.push(id)
  }

  if (!missing.length) {
    console.log(`[VidVault API] VIDEOS all cached — ids=[${ids.join(', ')}]`)
    return { items: cached }
  }

  const key = 'videos:' + missing.sort().join(',')

  const fresh = await _dedupe(key, async () => {
    console.log(`[VidVault API] VIDEOS fetch — ids=[${missing.join(', ')}] (${missing.length} uncached, ${cached.length} from cache)`)
    const res = await fetch(`/api/videos?ids=${missing.join(',')}`)
    if (!res.ok) throw new Error(`Details error ${res.status}`)
    return res.json()
  })

  // Store each video individually for future reuse
  for (const item of fresh.items ?? []) setCachedVideo(item.id, item)

  return { items: [...cached, ...(fresh.items ?? [])] }
}
