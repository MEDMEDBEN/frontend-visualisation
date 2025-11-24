import React, { useEffect, useState } from 'react'
import '../styles/FloatingNote.css'

export default function FloatingNote(){
  const STORAGE_KEY = 'dashboardNote'
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')

  // load from sessionStorage on mount
  useEffect(()=>{
    let initial = ''
    try{
      initial = sessionStorage.getItem(STORAGE_KEY) || ''
    }catch(_){ initial = '' }
    if(initial) setNote(initial)
  }, [])

  // save to sessionStorage on change
  useEffect(()=>{
    try{ sessionStorage.setItem(STORAGE_KEY, note) }catch(_){ /* ignore */ }
  }, [note])

  function toggle(){ setOpen(o => !o) }

  return (
    <div className={`floating-note ${open? 'open' : ''}`}>
      <button className="fn-bubble" onClick={toggle} aria-label={open? 'Fermer la note' : 'Ouvrir la note'}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" fill="currentColor" />
        </svg>
      </button>

      <div className="fn-card" role="dialog" aria-hidden={!open}>
        <div className="fn-header">
          <strong>Note rapide</strong>
          <button className="fn-close" onClick={toggle} aria-label="Fermer">✕</button>
        </div>
        <textarea
          className="fn-textarea"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Écrivez une note..."
          rows={6}
        />
        <div className="fn-footer">
          <small>Enregistré localement (session)</small>
        </div>
      </div>
    </div>
  )
}
