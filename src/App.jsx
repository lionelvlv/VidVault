import { useState, useRef } from 'react'
import { useClock } from './hooks/useClock'
import { Sidebar } from './components/Sidebar'
import { HomePage } from './components/HomePage'
import { SearchPage } from './components/SearchPage'
import { VideoPage } from './components/VideoPage'

// page: 'home' | 'search' | 'video'
export default function App() {
  const clock = useClock()
  const [page, setPage]           = useState('home')
  const [searchQuery, setSearch]  = useState('')
  const [videoId, setVideoId]     = useState(null)
  const [videoTitle, setVTitle]   = useState('')
  const [lastSearch, setLast]     = useState('')
  const inputRef = useRef(null)

  function doSearch(q) {
    const term = q ?? inputRef.current?.value.trim()
    if (!term) return
    if (inputRef.current) inputRef.current.value = term
    setSearch(term)
    setLast(term)
    setPage('search')
  }

  function openVideo(id, title) {
    setVideoId(id)
    setVTitle(title)
    setPage('video')
  }

  function backFromVideo() {
    setPage(lastSearch ? 'search' : 'home')
  }

  return (
    <div id="os-desktop">

      {/* TITLEBAR */}
      <div id="os-titlebar">
        <div id="os-titlebar-left">
          <span id="os-appname">📺 VidVault — The Early Web Archive</span>
        </div>
        <div id="os-titlebar-right">
          <div className="os-btn">_</div>
          <div className="os-btn">□</div>
          <div className="os-btn os-close">✕</div>
        </div>
      </div>

      {/* MENUBAR */}
      <div id="os-menubar">
        {['File','Edit','View','Favorites','Tools','Help'].map(m => (
          <span key={m} className="menu-item">{m}</span>
        ))}
        <span className="menu-clock">{clock}</span>
      </div>

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

      {/* TICKER */}
      <div id="ticker">
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
        <Sidebar onSearch={doSearch} />
        <div id="content">
          {page === 'home'   && <HomePage onOpen={openVideo} />}
          {page === 'search' && <SearchPage query={searchQuery} onOpen={openVideo} />}
          {page === 'video'  && (
            <VideoPage
              videoId={videoId}
              title={videoTitle}
              searchQuery={lastSearch}
              onBack={backFromVideo}
              onOpen={openVideo}
            />
          )}
        </div>
      </div>

      {/* TASKBAR */}
      <div id="os-taskbar">
        <div id="taskbar-start">▶ Start</div>
        <div id="taskbar-items">
          <div className="taskbar-item">📺 VidVault Archive</div>
        </div>
        <div id="taskbar-tray">{clock}</div>
      </div>

    </div>
  )
}
