import { useState, useRef } from 'react'
import { ytSearch } from '../api'
import { getVideoId } from '../utils'

const YEARS = ['2005', '2006', '2007', '2008', '2009']

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

export function useRandomVideo(onOpen) {
  const [loading, setLoading] = useState(false)
  const seenIds = useRef(new Set())

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

      const pool = items.length > 0 ? items : (data.items ?? []).sort(() => Math.random() - 0.5)
      if (!pool.length) { setLoading(false); return }

      const item = pool[Math.floor(Math.random() * pool.length)]
      const id   = getVideoId(item)
      seenIds.current.add(id)
      onOpen(id, item)
    } catch {}
    setLoading(false)
  }

  return { loading, loadRandom }
}
