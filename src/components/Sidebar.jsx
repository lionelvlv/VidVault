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

// Seeds for Datamuse — fetched once, cached for 7 days
const DATAMUSE_SEEDS = ['fun','life','people','world','time','happy','action','play',
                        'music','food','school','sport','travel','home','nature']
const DATAMUSE_CACHE_KEY = 'vv2_datamuse_words'
const DATAMUSE_TTL = 7 * 24 * 60 * 60 * 1000

async function getWordPool() {
  // Return cached pool if fresh
  try {
    const raw = localStorage.getItem(DATAMUSE_CACHE_KEY)
    if (raw) {
      const { words, ts } = JSON.parse(raw)
      if (Date.now() - ts < DATAMUSE_TTL && words.length > 50) return words
    }
  } catch {}

  // Fetch from Datamuse — pick 3 random seeds and merge results
  try {
    const seeds = [...DATAMUSE_SEEDS].sort(() => Math.random() - 0.5).slice(0, 3)
    const results = await Promise.all(
      seeds.map(s => fetch(`https://api.datamuse.com/words?ml=${s}&max=500`)
        .then(r => r.json()).catch(() => []))
    )
    const words = [...new Set(results.flat().map(w => w.word).filter(w => w && w.length > 2 && !w.includes(' ')))]
    if (words.length > 20) {
      try { localStorage.setItem(DATAMUSE_CACHE_KEY, JSON.stringify({ words, ts: Date.now() })) } catch {}
      return words
    }
  } catch {}

  // Hardcoded fallback
  return ['funny','dog','skateboard','magic','dance','baby','cooking','trick','fail',
          'cat','music','prank','sports','wedding','concert','school','science','travel',
          'birthday','surprise','talent','workout','nature','food','city','family']
}

// Module-level video pool so it persists across re-renders without a ref
let _videoPool = []
let _poolFilling = false

async function fillPool(seenIds) {
  if (_poolFilling) return
  _poolFilling = true
  try {
    const wordPool = await getWordPool()
    // Pick 3 random words and fetch their search results in parallel — 3 API calls, ~36 videos
    const picks = Array.from({ length: 3 }, () => {
      const word = wordPool[Math.floor(Math.random() * wordPool.length)]
      const year = YEARS[Math.floor(Math.random() * YEARS.length)]
      const order = Math.random() > 0.5 ? 'relevance' : 'date'
      return { word, year, order }
    })
    const results = await Promise.all(
      picks.map(({ word, year, order }) => ytSearch(`${word} ${year}`, order).catch(() => ({ items: [] })))
    )
    const newItems = results.flatMap(d => d.items ?? [])
      .filter(item => {
        const id = getVideoId(item)
        return id && !seenIds.has(id)
      })
    // Shuffle and add to pool
    _videoPool.push(...newItems.sort(() => Math.random() - 0.5))
  } finally {
    _poolFilling = false
  }
}

export function Sidebar({ onSearch, onOpen }) {
  const [loading, setLoading] = useState(false)
  const seenIds = useRef(new Set())

  async function loadRandom() {
    if (loading) return
    setLoading(true)
    try {
      // If pool is running low, refill in background (or wait if empty)
      if (_videoPool.length < 5) {
        await fillPool(seenIds.current)
      } else if (_videoPool.length < 15) {
        // Refill in background while we serve from existing pool
        fillPool(seenIds.current)
      }

      // Pop from pool
      if (_videoPool.length > 0) {
        // Find first item not already seen
        const idx = _videoPool.findIndex(item => !seenIds.current.has(getVideoId(item)))
        const item = idx >= 0 ? _videoPool.splice(idx, 1)[0] : _videoPool.shift()
        const id = getVideoId(item)
        if (id) {
          seenIds.current.add(id)
          onOpen(id, item)
        }
      }
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
