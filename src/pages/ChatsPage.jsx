import React, { useState, useRef, useEffect } from 'react'
import '../styles/ChatsPage.css'

// Chats page: left = user comments, right = chatbot UI
export default function ChatsPage(){
  // sample comments (fake users)
  const sampleComments = [
    { id:1, name: 'Anjali R.', date: '2025-10-12', text: "Les décharges près de chez moi ont empiré ces 2 dernières années — l'odeur est insupportable." },
    { id:2, name: 'Akram S.', date: '2025-09-05', text: "On a besoin de plus de points de collecte et de campagnes de sensibilisation locales." },
    { id:3, name: 'Priya M.', date: '2025-08-20', text: "Le recyclage existe mais le tri à la source est quasi inexistant dans mon quartier." }
  ]

  // comments state (allows adding new comments)
  const [comments, setComments] = useState(sampleComments)
  const [newName, setNewName] = useState('')
  const [newText, setNewText] = useState('')

  // chat state (no backend) — simple message list
  const [messages, setMessages] = useState([
    { id:1, who:'bot', text:'Bonjour ! Je peux répondre aux questions sur les impacts et solutions.' }
  ])
  const [input, setInput] = useState('')
  const messagesRef = useRef(null)

  // auto-scroll on new messages
  useEffect(()=>{
    if(messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages])

  function sendMessage(text){
    if(!text || !text.trim()) return
    const ts = new Date().getTime()
    const userMsg = { id: ts, who: 'user', text }
    setMessages(m => [...m, userMsg])
    setInput('')

    // mock bot response after delay
    setTimeout(()=>{
      const botReply = { id: ts + 1, who: 'bot', text: `Réponse simulée pour: "${text}"` }
      setMessages(m => [...m, botReply])
    }, 700)
  }

  const presets = [
    'Quel est l\'impact de la pollution ici ?',
    'Quelles solutions locales existent ?',
    'Comment réduire les déchets plastiques ?'
  ]

  return (
    <section className="page page-chats">
      <h2>Chats</h2>
      <p className="chats-lead">Zone de discussion et collaboration.</p>

      <div className="chats-grid">
        {/* Comments card */}
        <aside className="chat-card comments-card">
          <h3>Commentaires des utilisateurs</h3>
          <div className="comments-list">
            {comments.map(c => (
              <div key={c.id} className="comment-bubble">
                <div className="comment-meta"><strong>{c.name}</strong> · <span className="c-date">{c.date}</span></div>
                <div className="comment-text">{c.text}</div>
              </div>
            ))}
          </div>

          {/* Add comment form */}
          <form className="comment-form" onSubmit={e => { e.preventDefault();
              const name = newName.trim() || 'Anonyme'
              const text = newText.trim()
              if(!text) return
              const entry = { id: Date.now(), name, date: new Date().toISOString().slice(0,10), text }
              setComments(prev => [entry, ...prev])
              setNewName('')
              setNewText('')
            }}>
            <input className="comment-name" placeholder="Votre nom (optionnel)" value={newName} onChange={e=>setNewName(e.target.value)} />
            <textarea className="comment-input" placeholder="Écrire un commentaire..." value={newText} onChange={e=>setNewText(e.target.value)} rows={3} />
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button type="submit" className="comment-submit">Ajouter</button>
            </div>
          </form>
        </aside>

        {/* Chatbot card */}
        <main className="chat-card bot-card">
          <h3>Assistant (Chatbot)</h3>

          {/* preset question buttons */}
          <div className="preset-row">
            {presets.map((p, i) => (
              <button key={i} className="preset-btn" onClick={() => sendMessage(p)}>{i+1}. {p}</button>
            ))}
          </div>

          {/* messages area */}
          <div className="chat-window">
            <div className="chat-messages" ref={messagesRef}>
              {messages.map(m => (
                <div key={m.id} className={`msg ${m.who}`}>
                  <div className="msg-text">{m.text}</div>
                </div>
              ))}
            </div>

            {/* input area */}
            <div className="chat-input-row">
              <input className="chat-input" value={input} onChange={e=>setInput(e.target.value)} placeholder="Tapez votre message..." onKeyDown={e=>{ if(e.key==='Enter'){ sendMessage(input) } }} />
              <button className="send-btn" onClick={()=>sendMessage(input)}>Envoyer</button>
            </div>
          </div>
        </main>
      </div>
    </section>
  )
}
