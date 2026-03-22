const _cache = new Map()
const CACHE_MS = 5 * 60 * 1000

function _getCached(key) {
  const e = _cache.get(key)
  if (!e) return null
  if (Date.now() - e.ts > CACHE_MS) { _cache.delete(key); return null }
  return e.data
}
function _setCache(key, data) { _cache.set(key, { data, ts: Date.now() }) }

export async function ytSearch(query, order, pageToken) {
  const p = new URLSearchParams({ q: query, order: order || 'relevance' })
  if (pageToken) p.set('pageToken', pageToken)
  const key = 'search:' + p.toString()
  const hit = _getCached(key)
  if (hit) return hit
  const res = await fetch(`/api/search?${p}`)
  if (!res.ok) throw new Error(`Search error ${res.status}`)
  const data = await res.json()
  _setCache(key, data)
  return data
}

export async function ytVideoDetails(ids) {
  if (!ids.length) return { items: [] }
  const key = 'videos:' + ids.join(',')
  const hit = _getCached(key)
  if (hit) return hit
  const res = await fetch(`/api/videos?ids=${ids.join(',')}`)
  if (!res.ok) throw new Error(`Details error ${res.status}`)
  const data = await res.json()
  _setCache(key, data)
  return data
}
