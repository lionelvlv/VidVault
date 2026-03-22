import { useState, useRef } from 'react'
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

// 5 broad queries that together cover the whole era well.
// Fetched once, cached for 7 days → ~60 videos in the pool.
// Randomness: pick a random TOPIC first, then a random video from that topic.
const POOL_QUERIES = [
  { q: 'video 2006',  order: 'date'      },
  { q: 'video 2007',  order: 'date'      },
  { q: 'funny 2006',  order: 'relevance' },
  { q: 'music 2007',  order: 'relevance' },
  { q: 'vlog 2008',   order: 'date'      },
]

const POOL_KEY = 'vv2_random_pool'
const POOL_TTL = 7 * 24 * 60 * 60 * 1000  // 7 days — these results barely change

function loadPoolFromStorage() {
  try {
    const raw = localStorage.getItem(POOL_KEY)
    if (!raw) return null
    const { buckets, ts } = JSON.parse(raw)
    if (Date.now() - ts > POOL_TTL) { localStorage.removeItem(POOL_KEY); return null }
    return buckets  // { [query]: [items] }
  } catch { return null }
}

function savePoolToStorage(buckets) {
  try { localStorage.setItem(POOL_KEY, JSON.stringify({ buckets, ts: Date.now() })) } catch {}
}

async function buildPool() {
  const stored = loadPoolFromStorage()
  if (stored && Object.keys(stored).length > 0) return stored

  console.log('[VidVault] Building random pool (5 fetches, once per 7 days)…')
  const results = await Promise.all(
    POOL_QUERIES.map(({ q, order }) =>
      fetch(`/api/search?q=${encodeURIComponent(q)}&order=${order}`)
        .then(r => r.json())
        .catch(() => ({ items: [] }))
    )
  )

  // Store as buckets keyed by query so we can pick topic-first
  const buckets = {}
  POOL_QUERIES.forEach(({ q }, i) => {
    buckets[q] = results[i].items ?? []
  })
  savePoolToStorage(buckets)
  return buckets
}

// Module-level so pool persists for the whole session without re-fetching
let _poolPromise = null
function getPool() {
  if (!_poolPromise) _poolPromise = buildPool()
  return _poolPromise
}

export function Sidebar({ onSearch, onOpen }) {
  const [loading, setLoading]   = useState(false)
  const seenIds = useRef(new Set())

  async function loadRandom() {
    if (loading) return
    setLoading(true)
    try {
      const buckets = await getPool()
      const topics  = Object.keys(buckets)

      // Pick a random topic, then a random unseen video from it
      // Shuffle topics so we don't always start with the same one
      const shuffled = topics.sort(() => Math.random() - 0.5)

      let picked = null
      for (const topic of shuffled) {
        const unseen = buckets[topic].filter(
          item => !seenIds.current.has(getVideoId(item))
        )
        if (unseen.length > 0) {
          picked = unseen[Math.floor(Math.random() * unseen.length)]
          break
        }
      }

      // All videos seen — reset and pick fresh
      if (!picked) {
        seenIds.current.clear()
        const topic = topics[Math.floor(Math.random() * topics.length)]
        const items = buckets[topic]
        picked = items[Math.floor(Math.random() * items.length)]
      }

      const id = getVideoId(picked)
      if (id) {
        seenIds.current.add(id)
        onOpen(id, picked)
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
