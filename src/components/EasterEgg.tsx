/* ============================================================
   EasterEgg.tsx — type "jarvis" anywhere on the page.
   A quiet CRT power-on homage: scanline sweep + one dry line.
   Copy lives in profile.ts (Hazem reviews every line).
   ============================================================ */

import { useEffect, useRef, useState } from 'react'
import { easterEgg, avatarScript } from '../data/profile'

const CODE = 'jarvis'

export default function EasterEgg() {
  const [active, setActive] = useState(false)
  const [shown, setShown] = useState('')
  const buf = useRef('')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return
      buf.current = (buf.current + e.key.toLowerCase()).slice(-CODE.length)
      if (buf.current === CODE && !active) {
        buf.current = ''
        setActive(true)
        window.dispatchEvent(
          new CustomEvent('avatar-say', { detail: avatarScript.jarvisPoke }),
        )
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  // typewriter for the egg line
  useEffect(() => {
    if (!active) return
    setShown('')
    let i = 0
    timer.current = window.setInterval(() => {
      i += 1
      setShown(easterEgg.line.slice(0, i))
      if (i >= easterEgg.line.length) window.clearInterval(timer.current)
    }, 24)
    const kill = window.setTimeout(() => setActive(false), 6000)
    return () => {
      window.clearInterval(timer.current)
      window.clearTimeout(kill)
    }
  }, [active])

  if (!active) return null

  return (
    <div className="ee" onClick={() => setActive(false)} role="status">
      <span className="ee-sweep" aria-hidden="true" />
      <span className="ee-title mono">{easterEgg.title}</span>
      <span className="ee-line">
        {shown}
        <i className="caret" aria-hidden="true" />
      </span>
      <span className="ee-hint mono">CLICK ANYWHERE TO DISMISS</span>
    </div>
  )
}
