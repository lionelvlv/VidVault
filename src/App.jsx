import { useState, useRef, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { HomePage } from './components/HomePage'
import { SearchPage } from './components/SearchPage'
import { VideoPage } from './components/VideoPage'

// page: 'home' | 'search' | 'video'
export default function App() {
  const [page, setPage]           = useState('home')
  const [searchQuery, setSearch]  = useState('')
  const [videoId, setVideoId]     = useState(null)
  const [videoItem, setVideoItem] = useState(null)
  const [lastSearch, setLast]     = useState('')
  const inputRef = useRef(null)

  const doSearch = useCallback((q) => {
    const term = q ?? inputRef.current?.value.trim()
    if (!term) return
    if (inputRef.current) inputRef.current.value = term
    setSearch(term)
    setLast(term)
    setPage('search')
  }, [])

  const openVideo = useCallback((id, item) => {
    setVideoId(id)
    setVideoItem(item)
    setPage('video')
  }, [])

  function backFromVideo() {
    setPage(lastSearch ? 'search' : 'home')
  }

  return (
    <div id="os-desktop">

      {/* HEADER */}
      <div id="header">
        <div id="header-top">
          <div id="logo-wrap">
            <div id="logo">
              <span className="logo-vid">Vid</span>
              <span className="logo-vault">Vault</span>
              <span className="logo-tm">TM</span>
            </div>
            <div id="logo-tagline">THE EARLY WEB ARCHIVE &nbsp;·&nbsp; 2005–2009</div>
          </div>
          <div id="search-bar">
            <div id="search-inner">
              <input
                id="search-input"
                ref={inputRef}
                type="text"
                placeholder='Search the archive… try "evolution of dance" or "numa numa"'
                onKeyDown={e => e.key === 'Enter' && doSearch()}
              />
            </div>
            <button id="search-btn" onClick={() => doSearch()}>SEARCH</button>
          </div>
        </div>

        <div id="nav-bar">
          <div className={`nav-tab${page === 'home' ? ' active' : ''}`}
               id="nav-home" onClick={() => setPage('home')}>Home</div>
          <div className={`nav-tab${page === 'search' ? ' active' : ''}`}
               id="nav-search" onClick={() => inputRef.current?.focus()}>Search</div>
          {[
            ['Music Videos 2007','Music'],
            ['Viral Clips 2006','Viral'],
            ['Video Blog 2006','Vlogs'],
            ['Gaming Walkthrough 2007','Gaming'],
            ['Comedy Skit 2007','Comedy'],
            ['Flash Animation 2006','Flash'],
          ].map(([q, label]) => (
            <div key={q} className="nav-tab" onClick={() => doSearch(q)}>{label}</div>
          ))}
        </div>
      </div>

      {/* TICKER */}      <div id="ticker">
        <span id="ticker-label">ARCHIVE NEWS</span>
        <div id="ticker-scroll-wrap">
          <span id="ticker-inner">
            Welcome to VidVault — the early web video archive (2005–2009) &nbsp;·&nbsp;
            Top searches: "evolution of dance" · "numa numa" · "charlie bit my finger" ·
            "leave britney alone" · "dramatic chipmunk" · "rick astley" · "keyboard cat" ·
            "potter puppet pals" · "lonelygirl15" &nbsp;·&nbsp;
            All videos originally uploaded between April 2005 and December 2009 &nbsp;·&nbsp;
            Best viewed in Internet Explorer 6.0 at 1024×768
          </span>
        </div>
      </div>

      {/* MAIN */}
      <div id="main">
        <Sidebar onSearch={doSearch} onOpen={openVideo} />
        <div id="content">
          {/* All pages stay mounted — no remount = no refetch */}
          <div style={{ display: page === 'home'   ? 'block' : 'none' }}><HomePage onOpen={openVideo} /></div>
          <div style={{ display: page === 'search' ? 'block' : 'none' }}><SearchPage query={searchQuery} onOpen={openVideo} /></div>
          <div style={{ display: page === 'video'  ? 'block' : 'none' }}>
            <VideoPage
              videoId={videoId}
              title={videoItem?.snippet?.title}
              snippet={videoItem?.snippet}
              statistics={videoItem?.statistics}
              onBack={backFromVideo}
              onOpen={openVideo}
            />
          </div>
        </div>
      </div>

    </div>
  )
}
