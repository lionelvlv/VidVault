import { useState, useEffect } from 'react'
import { ytSearch, ytVideoDetails } from '../api'
import { getVideoId } from '../utils'
import { VideoCard } from './VideoCard'

export function VideoGrid({ query, order, count = 4, cols = 4, onOpen }) {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading') // loading | ok | error | empty

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setItems([])
    ;(async () => {
      try {
        const data = await ytSearch(query, order)
        if (cancelled) return
        if (!data.items?.length) { setStatus('empty'); return }
        const slice = data.items.slice(0, count)
        const ids   = slice.map(getVideoId).filter(Boolean)
        const detail = await ytVideoDetails(ids)
        if (cancelled) return
        const map = Object.fromEntries((detail.items ?? []).map(d => [d.id, d]))
        setItems(slice.map(it => {
          const d = map[getVideoId(it)]
          return d ? { ...it, statistics: d.statistics } : it
        }))
        setStatus('ok')
      } catch (err) {
        if (!cancelled) setStatus('error:' + err.message)
      }
    })()
    return () => { cancelled = true }
  }, [query, order, count])

  if (status === 'loading') return <div className="loading-inline">Loading…</div>
  if (status === 'empty')   return <div className="empty-box">No videos found for this era.</div>
  if (status.startsWith('error:')) return (
    <div className="error-box">
      Could not load. Check your API key or quota.<br /><small>{status.slice(6)}</small>
    </div>
  )

  return (
    <div className={`video-grid${cols === 3 ? ' video-grid-3' : ''}`}>
      {items.map((item, i) => (
        <VideoCard key={getVideoId(item) ?? i} item={item} onOpen={onOpen} />
      ))}
    </div>
  )
}
