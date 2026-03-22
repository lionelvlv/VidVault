import { VideoGrid } from './VideoGrid'

export function HomePage({ onOpen }) {
  return (
    <div>
      <div className="section-header">
        <span className="section-title">Featured Videos</span>
        <span className="section-sub">Editor's Picks · Classic Era</span>
        <span className="new-badge">NEW</span>
      </div>
      <VideoGrid query="viral funny 2006"         order="relevance" count={4} onOpen={onOpen} />

      <div className="section-header">
        <span className="section-title">Most Viewed of the Era</span>
        <span className="section-sub">The videos everyone watched · 2005–2009</span>
      </div>
      <VideoGrid query="classic youtube 2007"     order="viewCount" count={4} onOpen={onOpen} />

      <div className="section-header">
        <span className="section-title">Recently Rediscovered</span>
        <span className="section-sub">Recovered from backup tapes · 2005–2006</span>
      </div>
      <VideoGrid query="original video 2005 2006" order="date"      count={3} cols={3} onOpen={onOpen} />
    </div>
  )
}
