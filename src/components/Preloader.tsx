/* ============================================================
   Preloader.tsx — firmware boot log, then a hard wipe.
   Sets the tone in ~2 seconds. Click to skip.
   ============================================================ */

import { useEffect, useRef, useState } from 'react'
import { lockScroll } from '../lib/lenis'

const LINES: { at: number; cls: string; txt: string }[] = [
  { at: 0.0, cls: 'b-dim', txt: '[PWR ] 3V3 rail ..................... OK' },
  { at: 0.26, cls: 'b-dim', txt: '[XTAL] 40 MHz ........................ LOCKED' },
  { at: 0.52, cls: 'b-dim', txt: '[FLSH] personality.rom ............... 100%' },
  { at: 0.78, cls: 'b-dim', txt: '[NET ] routing ....................... 52/52' },
  { at: 1.02, cls: 'b-dim', txt: '[DRC ] violations .................... 0' },
  { at: 1.28, cls: 'b-final', txt: 'SYS READY · HANDS ON DECK' },
]

const WIPE_AT = 1.75 // s
const WIPE_MS = 850
const GONE_AT = WIPE_AT * 1000 + WIPE_MS + 120

export default function Preloader({ onBoot }: { onBoot: () => void }) {
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)
  const [gone, setGone] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => {
    lockScroll(true)

    const schedule = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))

    LINES.forEach((l, i) => schedule(l.at * 1000, () => setCount(i + 1)))
    schedule(WIPE_AT * 1000, () => {
      setDone(true)
      onBoot()
    })
    schedule(GONE_AT, () => {
      setGone(true)
      lockScroll(false)
    })

    return () => {
      timers.current.forEach(clearTimeout)
      lockScroll(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const skip = () => {
    timers.current.forEach(clearTimeout)
    setCount(LINES.length)
    setDone(true)
    onBoot()
    setGone(true)
    lockScroll(false)
  }

  if (gone) return null

  return (
    <div className={`preloader ${done ? 'done' : ''}`} onClick={skip} role="presentation">
      <div className="bootlog">
        {LINES.slice(0, count).map((l, i) => (
          <div key={i} className={l.cls}>
            {l.txt}
          </div>
        ))}
        {count < LINES.length && <span className="caret" />}
      </div>
    </div>
  )
}
