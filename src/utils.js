export function fmtCount(n) {
  if (!n) return '?'
  n = parseInt(n, 10)
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K'
  return n.toString()
}
 
export function fmtDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  const m  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return m[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear()
}
 
 
export function getVideoId(item) {
  if (!item?.id) return null
  return typeof item.id === 'string' ? item.id : (item.id.videoId ?? null)
}
 
export function getThumbnailUrl(item) {
  const t = item?.snippet?.thumbnails
  if (!t) return null
  return t.medium?.url ?? t.default?.url ?? null
}
 
export function computeStars(st) {
  const likes = parseInt(st?.likeCount ?? '0', 10)
  const views = parseInt(st?.viewCount ?? '0', 10)
  if (!views || views < 1000) return null
  const ratio = likes / views
  if (ratio < 0.003) return 1
  if (ratio < 0.010) return 2
  if (ratio < 0.025) return 3
  if (ratio < 0.050) return 4
  return 5
}
