/* ============================================================
   Cursor.tsx — crosshair cursor w/ copper dot.
   Grows on interactive elements. Desktop (fine pointer) only.
   ============================================================ */

import { useEffect, useRef } from 'react'

export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let tx = x
    let ty = y
    let raf = 0

    const move = (e: MouseEvent) => {
      tx = e.clientX
      ty = e.clientY
      el.classList.add('on')
    }
    const over = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest('a, button, [data-hover]')
      el.classList.toggle('hover', !!t)
    }
    const loop = () => {
      x += (tx - x) * 0.4
      y += (ty - y) * 0.4
      el.style.transform = `translate(${x}px, ${y}px)`
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', move, { passive: true })
    window.addEventListener('mouseover', over, { passive: true })
    loop()
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', over)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={ref} className="cursor" aria-hidden="true">
      <i className="cross-h" />
      <i className="cross-v" />
      <i className="dot" />
    </div>
  )
}
