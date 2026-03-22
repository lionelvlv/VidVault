import { useState, useRef } from 'react'
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

const YEARS = ['2005', '2006', '2007', '2008', '2009']

// Datamuse: free, no key, no quota — fetch once per session
let _wordPool = null
async function getWordPool() {
  if (_wordPool) return _wordPool
  try {
    const seeds = ['fun','life','people','world','time','happy','action','music',
                   'food','school','sport','travel','home','nature','play']
    const seed = seeds[Math.floor(Math.random() * seeds.length)]
    const res  = await fetch(`https://api.datamuse.com/words?ml=${seed}&max=500`)
    const data = await res.json()
    _wordPool = data.map(w => w.word).filter(w => w && !w.includes(' ') && w.length > 2)
    return _wordPool
  } catch {
    _wordPool = ['funny','dog','skateboard','magic','dance','baby','cooking','fail',
                 'cat','prank','sports','wedding','concert','school','science',
                 'travel','birthday','talent','animals','music','gaming','vlog']
    return _wordPool
  }
}

export function Sidebar({ onSearch, onOpen }) {
  const [loading, setLoading] = useState(false)
  const seenIds   = useRef(new Set())

  async function loadRandom() {
    if (loading) return
    setLoading(true)
    try {
      const words = await getWordPool()
      const word  = words[Math.floor(Math.random() * words.length)]
      const year  = YEARS[Math.floor(Math.random() * YEARS.length)]
      const order = Math.random() > 0.5 ? 'relevance' : 'date'

      const data  = await ytSearch(`${word} ${year}`, order)
      const items = (data.items ?? [])
        .filter(item => !seenIds.current.has(getVideoId(item)))
        .sort(() => Math.random() - 0.5)

      // If all results seen, reset history and pick from full set
      const pool = items.length > 0 ? items : (data.items ?? []).sort(() => Math.random() - 0.5)
      if (!pool.length) { setLoading(false); return }

      const item = pool[Math.floor(Math.random() * pool.length)]
      const id   = getVideoId(item)
      seenIds.current.add(id)
      onOpen(id, item)
    } catch {}
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
