import React from 'react'
import '../styles/ThemeSwitch.css'

export default function ThemeSwitch({ dark, toggle }){
  return (
    <button className={"theme-switch " + (dark ? 'dark' : 'light')} onClick={toggle} aria-label="Toggle theme">
      <span className="icon">
        {dark ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.8 1.8-1.8zM1 13h3v-2H1v2zm10 8h2v-3h-2v3zm7.04-3.04l1.79 1.79 1.8-1.79-1.79-1.8-1.8 1.8zM20 11v2h3v-2h-3zM4.22 19.78l1.79-1.79-1.8-1.8-1.79 1.8 1.8 1.79zM12 5a7 7 0 100 14 7 7 0 000-14z" fill="currentColor"/></svg>
        )}
      </span>
    </button>
  )
}
