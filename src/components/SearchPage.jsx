import { useState, useEffect, useRef } from 'react'
import { ytSearch } from '../api'
import { getVideoId, fmtCount } from '../utils'
import { ResultRow } from './VideoCard'

export function SearchPage({ query, onOpen }) {
  const [sort, setSort]   = useState('relevance')
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [page, setPage]   = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const sortRef = useRef(sort)
  sortRef.current = sort

  function load(pageNum) {
    if (!query) return
    setStatus('loading')
    setItems([])
    ytSearch(query, sortRef.current, pageNum)
      .then(data => {
        if (!data.items?.length) { setStatus('empty'); return }
        setItems(data.items)
        setHasMore(data.items.length >= 10) // Invidious returns ~20, assume more if full page
        setStatus('ok')
      })
      .catch(err => setStatus('error:' + err.message))
  }

  useEffect(() => {
    setPage(1)
    load(1)
  }, [query, sort]) // eslint-disable-line react-hooks/exhaustive-deps

  function goNext() {
    const next = page + 1
    setPage(next)
    load(next)
  }
  function goPrev() {
    const prev = page - 1
    setPage(prev)
    load(prev)
  }

  return (
    <div>
      <div className="sort-bar">
        <span className="sort-label">Sort results:</span>
        <button className={`sort-btn${sort === 'relevance' ? ' active' : ''}`} onClick={() => setSort('relevance')}>Best Match</button>
        <button className={`sort-btn${sort === 'date' ? ' active' : ''}`} onClick={() => setSort('date')}>Most Recent</button>
      </div>

      {status === 'loading' && (
        <div className="loading-wrap">
          <div className="loading-label">Fetching from the archive…</div>
          <div className="loading-bar"><div className="loading-fill" /></div>
          <div className="loading-sub">Please wait · Connecting to VidVault servers</div>
        </div>
      )}
      {status === 'empty' && <div className="empty-box">No videos found in the archive for this search.</div>}
      {status.startsWith('error:') && <div className="error-box">Error loading results.<br /><small>{status.slice(6)}</small></div>}
      {status === 'ok' && items.map((item, i) => (
        <ResultRow key={getVideoId(item) ?? i} item={item} onOpen={onOpen} />
      ))}

      {status === 'ok' && (
        <div className="pagination">
          {page > 1   && <button className="page-btn" onClick={goPrev}>◀ Prev</button>}
          <button className="page-btn active">Page {page}</button>
          {hasMore    && <button className="page-btn" onClick={goNext}>Next ▶</button>}
        </div>
      )}
    </div>
  )
}
