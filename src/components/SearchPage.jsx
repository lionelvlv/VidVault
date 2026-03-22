import { useState, useEffect, useRef } from 'react'
import { ytSearch } from '../api'
import { getVideoId, fmtCount } from '../utils'
import { ResultRow } from './VideoCard'

export function SearchPage({ query, onOpen }) {
  const [sort, setSort]           = useState('relevance')
  const [items, setItems]         = useState([])
  const [status, setStatus]       = useState('loading')
  const [totalLabel, setTotal]    = useState('')
  const [nextToken, setNextToken] = useState(null)
  const [prevTokens, setPrev]     = useState([])
  const [page, setPage]           = useState(0)

  // Use a ref so the load function is stable and never causes effect re-fires
  const sortRef = useRef(sort)
  sortRef.current = sort

  function load(pageToken) {
    if (!query) return
    setStatus('loading')
    setItems([])
    ytSearch(query, sortRef.current, pageToken)
      .then(data => {
        if (!data.items?.length) { setStatus('empty'); return }
        setItems(data.items)
        const total = data.pageInfo?.totalResults
        setTotal(total ? `~${fmtCount(total)} results (2005–2009)` : '')
        setNextToken(data.nextPageToken ?? null)
        setStatus('ok')
      })
      .catch(err => setStatus('error:' + err.message))
  }

  // Only re-fire when query or sort actually changes
  useEffect(() => {
    setPrev([]); setPage(0); setNextToken(null)
    load(null)
  }, [query, sort]) // eslint-disable-line react-hooks/exhaustive-deps

  function goNext() {
    if (!nextToken) return
    setPrev(p => [...p, nextToken])
    setPage(p => p + 1)
    load(nextToken)
  }
  function goPrev() {
    if (page === 0) return
    const newPage = page - 1
    setPage(newPage)
    setPrev(p => p.slice(0, -1))
    load(newPage === 0 ? null : prevTokens[newPage - 1])
  }

  return (
    <div>
      <div className="sort-bar">
        <span className="sort-label">Sort results:</span>
        <button className={`sort-btn${sort === 'relevance' ? ' active' : ''}`} onClick={() => setSort('relevance')}>Best Match</button>
        <button className={`sort-btn${sort === 'viewCount' ? ' active' : ''}`} onClick={() => setSort('viewCount')}>Most Viewed</button>
        <span className="result-count">{totalLabel}</span>
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
          {page > 0  && <button className="page-btn" onClick={goPrev}>◀ Prev</button>}
          <button className="page-btn active">Page {page + 1}</button>
          {nextToken && <button className="page-btn" onClick={goNext}>Next ▶</button>}
        </div>
      )}
    </div>
  )
}
