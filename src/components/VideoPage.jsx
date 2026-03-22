import { fmtDate } from '../utils'

export function VideoPage({ videoId, iframeRef, title, snippet, onBack }) {
  const sn = snippet ?? {}

  return (
    <div>
      <button className="back-btn" onClick={onBack}>◀ Back to results</button>

      <div id="player-wrap">
        <iframe
          ref={iframeRef}
          src={videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : ''}
          allowFullScreen
          title={title}
        />
      </div>

      <div id="player-info">
        <div id="player-title">{sn.title ?? title ?? ''}</div>
        <div id="player-meta">
          {sn.publishedAt  && <span>Uploaded: <strong>{fmtDate(sn.publishedAt)}</strong></span>}
          {sn.channelTitle && <span>Channel: <strong>{sn.channelTitle}</strong></span>}
        </div>
        {sn.description && <div id="player-desc">{sn.description}</div>}
      </div>
    </div>
  )
}
