import { useState, useEffect, useMemo } from 'react'
import { ytSearch } from '../api'
import { getVideoId } from '../utils'
import { VideoCard } from './VideoCard'

export function VideoGrid({ query, order, count = 4, cols = 4, onOpen }) {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')

  const fetchKey = useMemo(() => `${query}|${order}|${count}`, [query, order, count])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setItems([])
    ;(async () => {
      try {
        const data = await ytSearch(query, order)
        if (cancelled) return
        if (!data.items?.length) { setStatus('empty'); return }
        // Use search result data directly — no second details fetch needed
        setItems(data.items.slice(0, count))
        setStatus('ok')
      } catch (err) {
        if (!cancelled) setStatus('error:' + err.message)
      }
    })()
    return () => { cancelled = true }
  }, [fetchKey]) // eslint-disable-line react-hooks/exhaustive-deps

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
