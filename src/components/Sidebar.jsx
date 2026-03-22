import { useState } from 'react'
import { ytSearch } from '../api'
import { getVideoId } from '../utils'

const CATS = [
  ['Viral Clips 2006',         'Viral Clips'],
  ['Music Videos 2007',        'Music Videos'],
  ['Comedy Skit 2007',         'Comedy & Skits'],
  ['Video Blog 2006',          'Video Blogs'],
  ['Gaming Walkthrough 2007',  'Gaming'],
  ['Sports Highlight 2007',    'Sports'],
  ['Flash Animation 2006',     'Flash Animations'],
  ['Tech Review 2007',         'Tech Reviews'],
  ['News Clip 2006',           'News Clips'],
  ['Cute Funny Animals 2007',  'Animals & Pets'],
]

const TAGS = [
  ['funny 2007','funny'], ['music video 2007','music'], ['prank 2006','prank'],
  ['skateboard fail 2007','fail'], ['anime amv 2007','anime'], ['gaming 2008','gaming'],
  ['vlog 2006','vlog'], ['news 2006','news'], ['animals funny 2007','animals'],
  ['dance 2006','dance'], ['machinima 2007','machinima'], ['flash animation 2006','flash'],
]

// Large pool of era-appropriate queries to draw from randomly
const RANDOM_POOL = [
  'funny', 'vlog', 'music video', 'viral', 'prank', 'fail', 'skateboard',
  'flash animation', 'gaming', 'animals', 'dance', 'news', 'anime', 'comedy',
  'sports', 'tutorial', 'review', 'trailer', 'reaction', 'parody',
  'magic trick', 'street performance', 'talent show', 'school project',
  'home video', 'holiday', 'concert', 'cooking', 'science experiment',
  'dog', 'cat', 'baby', 'wedding', 'birthday', 'vacation',
]

const YEARS = ['2005', '2006', '2007', '2008', '2009']

export function Sidebar({ onSearch, onOpen }) {
  const [loading, setLoading] = useState(false)

  async function loadRandom() {
    setLoading(true)
    try {
      // Build a random query from pool + random year
      const word = RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)]
      const year = YEARS[Math.floor(Math.random() * YEARS.length)]
      const query = `${word} ${year}`

      // Random sort order too
      const order = Math.random() > 0.5 ? 'relevance' : 'date'
      const data = await ytSearch(query, order)

      if (!data.items?.length) { setLoading(false); return }

      // Pick a random result from the page (not always the first one)
      const item = data.items[Math.floor(Math.random() * data.items.length)]
      const id   = getVideoId(item)
      if (id) onOpen(id, item)
    } catch { /* silently fail */ }
    setLoading(false)
  }

  return (
    <div id="sidebar">

      <div className="sidebar-box">
        <div className="sidebar-box-title">Browse Archive</div>
        <div className="sidebar-box-content">
          {CATS.map(([q, label]) => (
            <span key={q} className="sidebar-cat" onClick={() => onSearch(q)}>
              <span className="cat-arrow">▶</span> {label}
            </span>
          ))}
        </div>
      </div>

      <div className="sidebar-box">
        <div className="sidebar-box-title">Hot Tags</div>
        <div className="sidebar-box-content tags-wrap">
          {TAGS.map(([q, label]) => (
            <span key={q} className="tag" onClick={() => onSearch(q)}>{label}</span>
          ))}
        </div>
      </div>

      <div className="sidebar-box">
        <div className="sidebar-box-title">Feeling Lucky?</div>
        <div className="sidebar-box-content">
          <div className="lucky-desc">Open a truly random video from the archive.</div>
          <button className="lucky-btn" onClick={loadRandom} disabled={loading}>
            {loading ? '⏳ Finding…' : '▶ Random Video'}
          </button>
        </div>
      </div>

      <div className="sidebar-box">
        <div className="sidebar-box-title">About VidVault</div>
        <div className="sidebar-box-content about-text">
          VidVault is a time-locked archive browser. Every video shown was originally uploaded between{' '}
          <strong>April 2005</strong> and <strong>December 2009</strong>.
        </div>
      </div>

    </div>
  )
}
