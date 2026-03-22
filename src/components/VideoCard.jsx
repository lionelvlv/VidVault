import { getVideoId, getThumbnailUrl, fmtDate, fmtCount, fakeTimestamp, computeStars } from '../utils'

function Stars({ st }) {
  const score = computeStars(st)
  if (score === null) return null
  return (
    <span className="stars">
      <span className="stars-filled">{'★'.repeat(score)}</span>
      <span className="stars-empty">{'☆'.repeat(5 - score)}</span>
    </span>
  )
}

function Thumb({ item, unavailable }) {
  const url = getThumbnailUrl(item)
  const ts  = fakeTimestamp()
  return (
    <div className="thumb-wrap">
      {url
        ? <img src={url} alt={item.snippet?.title ?? ''} loading="lazy" onError={e => e.target.style.display='none'} />
        : <div className="thumb-placeholder"><div className="play-icon">▶</div>{(item.snippet?.title ?? '').slice(0,28)}</div>
      }
      <div className="thumb-timestamp">{ts}</div>
      {unavailable && <div className="unavail-overlay">VIDEO UNAVAILABLE</div>}
    </div>
  )
}

export function VideoCard({ item, onOpen }) {
  const id      = getVideoId(item)
  const sn      = item.snippet    ?? {}
  const st      = item.statistics ?? {}
  const unavail = !!item._unavailable
  return (
    <div className={`video-card${unavail ? ' unavailable' : ''}`}
         onClick={() => !unavail && id && onOpen(id, sn.title ?? '')}>
      <Thumb item={item} unavailable={unavail} />
      <div className="video-info">
        <div className="video-title">{sn.title ?? 'Untitled'}</div>
        <div className="video-date">{fmtDate(sn.publishedAt)}</div>
        {st.viewCount && <div className="video-views">{fmtCount(st.viewCount)} views</div>}
      </div>
    </div>
  )
}

export function ResultRow({ item, onOpen }) {
  const id      = getVideoId(item)
  const sn      = item.snippet    ?? {}
  const st      = item.statistics ?? {}
  const unavail = !!item._unavailable
  const desc    = (sn.description ?? '').slice(0, 130)
  return (
    <div className={`result-row${unavail ? ' unavailable' : ''}`}
         onClick={() => !unavail && id && onOpen(id, sn.title ?? '')}>
      <div className="result-thumb">
        <Thumb item={item} unavailable={unavail} />
      </div>
      <div className="result-info">
        <div className="result-title">{sn.title ?? 'Untitled'}</div>
        <div className="result-channel">by {sn.channelTitle ?? 'Unknown'}</div>
        <div className="result-desc">{desc}{(sn.description ?? '').length > 130 ? '…' : ''}</div>
        <div className="result-meta">
          <span className="video-date">{fmtDate(sn.publishedAt)}</span>
          {st.viewCount && <span className="video-views">{fmtCount(st.viewCount)} views</span>}
          <Stars st={st} />
          {unavail && <span style={{color:'#cc2200',fontWeight:'bold'}}>Unavailable</span>}
        </div>
      </div>
    </div>
  )
}
