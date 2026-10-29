/* ============================================================
   pages/Projects.tsx — project archive.
   All projects, organized. Each card links to its case study.
   ============================================================ */

import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { projects } from '../data/projects'
import { archiveGreet, trackChat } from '../data/profile'
import ProjectCard from '../components/ProjectCard'
import { useReveal } from '../lib/useReveal'

export default function Projects({ booted }: { booted: boolean }) {
  useReveal()

  /* avatar guide: greet on load, then a line per track group as it scrolls in */
  useEffect(() => {
    if (!booted) return
    const t = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('avatar-say', { detail: archiveGreet }))
    }, 700)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.15) {
            const title = e.target.querySelector('.track-title')?.textContent ?? ''
            const key = title.toLowerCase() === 'ai/ml' ? 'ai-ml' : title.toLowerCase()
            const line = trackChat[key]
            if (line) window.dispatchEvent(new CustomEvent('avatar-say', { detail: line }))
          }
        }
      },
      { threshold: [0.15] },
    )
    document.querySelectorAll('.track-group').forEach((el) => io.observe(el))
    return () => {
      window.clearTimeout(t)
      io.disconnect()
    }
  }, [booted])

  const grouped = Object.entries(
    projects.reduce<Record<string, typeof projects>>((acc, p) => {
      ;(acc[p.track] ??= []).push(p)
      return acc
    }, {})
  ).map(([track, items]) => ({ track, items }))

  return (
    <>
      <section className="archive-hero">
        <div className="shell">
          <div className="archive-head reveal">
            <span className="idx mono">P</span>
            <h1 className="archive-title">PROJECTS</h1>
            <span className="head-note mono">The full archive: hardware + AI/ML.</span>
            <Link to="/" className="mono archive-back">← BACK TO PORTFOLIO</Link>
          </div>
        </div>
      </section>

      <section className="block archive-list">
        <div className="shell">
          {grouped.map((g) => (
            <div key={g.track} className="track-group reveal">
              <h2 className="track-title">{g.track === 'ai-ml' ? 'AI/ML' : 'HARDWARE'}</h2>
              <div className="archive-grid">
                {g.items.map((p) => (
                  <ProjectCard key={p.id} project={p} tier={p.tier} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
