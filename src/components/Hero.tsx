/* Hero — full-viewport 3D board + identity type.
   M2: type and canvas fade on their own timings as you scroll.
   M3: BoardScene is lazy — the three.js chunk streams in during
   the preloader instead of blocking first paint. */
import { lazy, Suspense, useEffect, useRef } from 'react'
import { profile } from '../data/profile'
import { scrollToId } from '../lib/lenis'
import { heroScrollEase } from '../lib/mouse'

const BoardScene = lazy(() => import('../three/BoardScene'))

export default function Hero({ booted }: { booted: boolean }) {
  const contentRef = useRef<HTMLDivElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const loop = () => {
      const e = heroScrollEase()
      if (contentRef.current) {
        contentRef.current.style.opacity = String(Math.max(0, 1 - e * 1.7))
        contentRef.current.style.transform = `translateY(${-e * 70}px)`
      }
      if (canvasWrapRef.current) {
        const fade = Math.max(0, (e - 0.3) / 0.7)
        canvasWrapRef.current.style.opacity = String(Math.max(0, 1 - fade))
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section className={`hero ${booted ? 'booted' : ''}`} id="boot">
      <div className="hero-canvas" ref={canvasWrapRef}>
        <Suspense fallback={null}>
          <BoardScene />
        </Suspense>
      </div>
      <div className="shell hero-content" ref={contentRef}>
        <span className="kicker mono">
          {profile.location.toUpperCase()} — {profile.coords} // PORTFOLIO REV {profile.rev}
        </span>
        <h1 className="display">
          <span className="line">
            <span>HAZEM</span>
          </span>
          <span className="line">
            <span className="accent">HASHIM</span>
          </span>
        </h1>
        <div className="role-row">
          <div className="role">{profile.title}</div>
          <div className="dual-line">
            I design <b>the copper</b> — and <b>the intelligence</b> that runs on it.
          </div>
        </div>
        <div className="status-row mono">
          <span>
            <i className="sig" />
            SYS NOMINAL · OPEN TO WORK
          </span>
          <button
            className="scroll-hint"
            onClick={() => scrollToId('profile')}
            aria-label="Scroll to profile"
          >
            SCROLL TO INSPECT <i className="arr">↓</i>
          </button>
        </div>
      </div>
    </section>
  )
}
