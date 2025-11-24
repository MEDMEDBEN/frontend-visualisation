import React, { useState, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import ThemeSwitch from './ThemeSwitch'
import '../styles/Navbar.css'

export default function Navbar({ dark, toggleTheme }){
  const [query, setQuery] = useState('')
  const inputRef = useRef()
  const navigate = useNavigate()

  // map common search keywords to element ids on the Visualisation page
  const targets = {
    histogram: 'histogram',
    hist: 'histogram',
    line: 'linechart',
    heatmap: 'heatmap',
    pie: 'pie-total',
    recycle: 'pie-recycle',
    scatter: 'scatter',
    radar: 'radar',
    sankey: 'sankey',
    gauge: 'gauge',
    bar: 'barcampaigns',
    campaigns: 'barcampaigns'
  }

  // map page keywords to routes so the search can navigate across pages
  const pages = {
    'visualisation': '/visualisation',
    'visualization': '/visualisation',
    'visualise': '/visualisation',
    'interpretation': '/interpretation',
    'interpret': '/interpretation',
    'interpretationpage': '/interpretation',
    'chats': '/chats',
    'chat': '/chats',
    'discussion': '/chats',
    'solution': '/solution',
    'solutions': '/solution',
    'home': '/',
    'overview': '/'
  }

  function doScrollTo(id){
    if(!id) return
    const el = document.getElementById(id)
    if(el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function handleSearchSubmit(e){
    e && e.preventDefault && e.preventDefault()
    const q = (query || '').toLowerCase().trim()
    if(!q) return
    // 1) If the query matches a known page keyword, navigate there
    for(const p of Object.keys(pages)){
      if(q.includes(p)){
        navigate(pages[p])
        // If the target is the visualisation page, attempt to scroll to a matching id too
        if(pages[p] === '/visualisation'){
          setTimeout(()=>{
            // try direct id match first
            if(document.getElementById(q)) return doScrollTo(q)
            for(const k of Object.keys(targets)){
              if(q.includes(k)){
                doScrollTo(targets[k]); return
              }
            }
          }, 220)
        }
        return
      }
    }

    // 2) Otherwise, try to find visualization targets (navigate there and scroll)
    for(const k of Object.keys(targets)){
      if(q.includes(k)){
        navigate('/visualisation')
        setTimeout(()=> doScrollTo(targets[k]), 220)
        return
      }
    }

    // 3) Try direct id or data-name match on current page
    if(document.getElementById(q)) return doScrollTo(q)
    const el = document.querySelector(`[id*="${q}"], [data-name*="${q}"]`)
    if(el) return el.scrollIntoView({ behavior:'smooth', block:'center' })

    // 4) Not found -> show soft message
    setNotFound(true)
    setTimeout(()=> setNotFound(false), 2200)
  }

  const [notFound, setNotFound] = useState(false)

  return (
    <header className="app-navbar">
      <div className="nav-top">
        <div className="brand-row">
          <div className="brand-logo" aria-hidden>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#7FDBB6"/><path d="M7 13c1.5-2 3-3 5-3s3.5 1 5 3" stroke="#042A20" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div className="brand-title">Med and Jess</div>
        </div>

        <form className="nav-search" onSubmit={handleSearchSubmit} role="search" onReset={()=>{ setQuery(''); inputRef.current && inputRef.current.focus() }}>
          <input ref={inputRef} aria-label="Search dashboard" placeholder="Search (ex: heatmap, radar, sankey...)" value={query} onChange={e=>setQuery(e.target.value)} />
          <button type="submit" className="search-icon" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-4.35-4.35" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="11" r="6" stroke="#fff" strokeWidth="1.6"/></svg>
          </button>
        </form>

        {notFound && <div className="search-notfound" role="status">Section non trouvée</div>}

        <div className="nav-actions">
          <ThemeSwitch dark={dark} toggle={toggleTheme} />
        </div>
      </div>

      <nav className="nav-tabs" role="navigation">
        <NavLink to="/visualisation" className={({isActive}) => 'tab' + (isActive ? ' active' : '')}>Visualisation</NavLink>
        <NavLink to="/interpretation" className={({isActive}) => 'tab' + (isActive ? ' active' : '')}>Interpretation</NavLink>
        <NavLink to="/chats" className={({isActive}) => 'tab' + (isActive ? ' active' : '')}>Chats</NavLink>
        <NavLink to="/solution" className={({isActive}) => 'tab' + (isActive ? ' active' : '')}>Solution</NavLink>
      </nav>
    </header>
  )
}
