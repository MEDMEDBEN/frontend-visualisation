import React, { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import FloatingNote from './components/FloatingNote'
import HomePage from './pages/HomePage'
import VisualizationPage from './pages/VisualizationPage'
import InterpretationPage from './pages/InterpretationPage'
import ChatsPage from './pages/ChatsPage'
import SolutionPage from './pages/SolutionPage'
import './App.css'

export default function App(){
  const [dark, setDark] = useState(false)
  const toggle = () => setDark(d => !d)

  // No inline styles or JS-driven CSS variables here.
  // Theme switch is expressed by applying a class on the root wrapper below.

  return (
    <BrowserRouter>
      <div className={`app-root ${dark ? 'theme-dark' : 'theme-light'}`}>
        <Navbar dark={dark} toggleTheme={toggle} />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/visualisation" element={<VisualizationPage />} />
            <Route path="/interpretation" element={<InterpretationPage />} />
            <Route path="/chats" element={<ChatsPage />} />
            <Route path="/solution" element={<SolutionPage />} />
          </Routes>
        </main>
        <FloatingNote />
      </div>
    </BrowserRouter>
  )
}
