/* Lenis singleton — smooth scroll with programmatic anchor support */
import Lenis from 'lenis'

let lenis: Lenis | null = null

export function initLenis(): Lenis {
  if (lenis) return lenis
  lenis = new Lenis({ lerp: 0.09 })
  const raf = (t: number) => {
    lenis?.raf(t)
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf)
  return lenis
}

export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { offset: -10, duration: 1.4 })
  else el.scrollIntoView({ behavior: 'smooth' })
}

export function lockScroll(lock: boolean) {
  if (!lenis) return
  if (lock) lenis.stop()
  else lenis.start()
}
