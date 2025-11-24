import React, { useEffect, useState, useRef } from 'react'
import '../styles/ImageSlider.css'

// ImageSlider
// Uses images stored directly in /public as `/1.jpg`, `/2.jpg`, ...
// Props:
// - imageCount: number of images to include (defaults to 5)
// - interval: milliseconds between automatic transitions (defaults to 2000)
export default function ImageSlider({ imageCount = 5, interval = 2000 }){
  const [index, setIndex] = useState(0)
  const timerRef = useRef(null)

  // create the images array as requested
  const images = Array.from({ length: imageCount }, (_, i) => `/${i + 1}.jpg`)
  const [resolved, setResolved] = useState(() => Array.from({ length: imageCount }, () => ''))

  useEffect(() => {
    // start autoplay
    if (images.length === 0) return
    timerRef.current = setInterval(() => {
      setIndex(i => (i + 1) % images.length)
    }, interval)
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
    // restart if imageCount or interval or images.length changes
  }, [imageCount, interval, images.length])

  // note: we avoid forcing setState on imageCount change; displayed index will be
  // computed via modulo to stay in-range when imageCount changes

  // attempt to resolve each slide to an existing file: try .jpg then .png
  useEffect(() => {
    let mounted = true
    // try each index using imageCount to avoid depending on `images` array identity
    for (let i = 0; i < imageCount; i++) {
      const jpg = `/${i + 1}.jpg`
      const png = `/${i + 1}.png`
      const tester = new Image()
      tester.onload = () => {
        if (!mounted) return
        setResolved(prev => { const arr = prev.slice(); arr[i] = jpg; return arr })
      }
      tester.onerror = () => {
        const tester2 = new Image()
        tester2.onload = () => {
          if (!mounted) return
          setResolved(prev => { const arr = prev.slice(); arr[i] = png; return arr })
        }
        tester2.onerror = () => {
          // leave as empty string
        }
        tester2.src = png
      }
      tester.src = jpg
    }
    return () => { mounted = false }
  }, [imageCount])

  function stop() { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  function start() { if (!timerRef.current) { timerRef.current = setInterval(() => setIndex(i => (i + 1) % images.length), interval) } }
  function prev() { if (images.length>0) setIndex(i => (i - 1 + images.length) % images.length) }
  function next() { if (images.length>0) setIndex(i => (i + 1) % images.length) }

  const displayIndex = images.length ? index % images.length : 0

  return (
    <div className="image-slider" onMouseEnter={stop} onMouseLeave={start}>
      <div className="slider-card">
        {images.map((src, i) => {
          const srcResolved = resolved[i] || src
          return (
            <img key={src + i} src={srcResolved} alt={`Photo ${i + 1}`} className={`slide slider-img ${i === displayIndex ? 'active' : ''}`} />
          )
        })}
        <button className="slider-nav prev" onClick={prev} aria-label="Previous">‹</button>
        <button className="slider-nav next" onClick={next} aria-label="Next">›</button>
      </div>
      <div className="slider-caption">{`Photo ${displayIndex + 1} / ${images.length}`}</div>
    </div>
  )
}
