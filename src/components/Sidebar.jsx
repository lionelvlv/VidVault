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

// Fixed cacheable queries — shuffled per session for variety.
// Each query costs 1 API call but yields ~12 videos served for free after that.
const RANDOM_QUERIES = [
  ['funny home video 2006',   'date'],
  ['viral video 2007',        'relevance'],
  ['music video 2006',        'relevance'],
  ['vlog 2007',               'date'],
  ['prank 2006',              'date'],
  ['skateboard fail 2007',    'relevance'],
  ['flash animation 2006',    'relevance'],
  ['gaming 2007',             'date'],
  ['cute animals 2006',       'relevance'],
  ['dance video 2007',        'date'],
  ['comedy skit 2007',        'relevance'],
  ['school project 2006',     'date'],
  ['sports highlight 2007',   'relevance'],
  ['talent show 2006',        'date'],
  ['magic trick 2007',        'relevance'],
  ['cooking tutorial 2006',   'date'],
  ['news clip 2006',          'relevance'],
  ['anime amv 2007',          'date'],
  ['original video 2005',     'date'],
  ['concert recording 2007',  'relevance'],
].sort(() => Math.random() - 0.5)

let _queryIdx = 0

export function Sidebar({ onSearch, onOpen }) {
  const [loading, setLoading] = useState(false)
  const seenIds   = useRef(new Set())
  const localPool = useRef([])  // leftover videos from last fetch, served for free

  async function loadRandom() {
    if (loading) return
    setLoading(true)
    try {
      // Drain local pool first — zero API cost
      const unseen = localPool.current.filter(
        item => !seenIds.current.has(getVideoId(item))
      )

      if (unseen.length > 0) {
        const item = unseen[Math.floor(Math.random() * unseen.length)]
        const id   = getVideoId(item)
        seenIds.current.add(id)
        localPool.current = localPool.current.filter(i => getVideoId(i) !== id)
        onOpen(id, item)
        setLoading(false)
        return
      }

      // Pool empty — exactly 1 API call, stash the rest for future free clicks
      const [q, order] = RANDOM_QUERIES[_queryIdx % RANDOM_QUERIES.length]
      _queryIdx++

      const data  = await ytSearch(q, order)
      const items = (data.items ?? [])
        .filter(item => !seenIds.current.has(getVideoId(item)))
        .sort(() => Math.random() - 0.5)

      if (!items.length) { setLoading(false); return }

      const [first, ...rest] = items
      const id = getVideoId(first)
      seenIds.current.add(id)
      localPool.current = rest   // up to 11 free future clicks from this 1 call
      onOpen(id, first)
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
