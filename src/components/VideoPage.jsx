import { useState, useEffect } from 'react'
import { ytVideoDetails } from '../api'
import { fmtCount, fmtDate } from '../utils'
import { VideoGrid } from './VideoGrid'

export function VideoPage({ videoId, title, searchQuery, onBack, onOpen }) {
  const [info, setInfo] = useState(null)

  useEffect(() => {
    if (!videoId) return
    ytVideoDetails([videoId]).then(data => setInfo(data.items?.[0] ?? null)).catch(() => {})
  }, [videoId])

  const sn = info?.snippet    ?? {}
  const st = info?.statistics ?? {}

  return (
    <div>
      <button className="back-btn" onClick={onBack}>◀ Back to results</button>

      <div id="player-wrap">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          allowFullScreen
          title={title}
        />
      </div>

      <div id="player-info">
        <div id="player-title">{sn.title ?? title ?? 'Loading…'}</div>
        {info && (
          <>
            <div id="player-meta">
              <span>Uploaded: <strong>{fmtDate(sn.publishedAt)}</strong></span>
              <span>Views: <strong>{fmtCount(st.viewCount)}</strong></span>
              <span>Likes: <strong>{fmtCount(st.likeCount)}</strong></span>
              <span>Comments: <strong>{fmtCount(st.commentCount)}</strong></span>
              <span>Channel: <strong>{sn.channelTitle ?? 'Unknown'}</strong></span>
            </div>
            <div id="player-desc">{sn.description ?? ''}</div>
          </>
        )}
      </div>

      <div className="section-header">
        <span className="section-title">Related Videos from the Era</span>
      </div>
      <VideoGrid query={searchQuery || title} order="relevance" count={4} onOpen={onOpen} />
    </div>
  )
}
