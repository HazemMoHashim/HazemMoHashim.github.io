/* ============================================================
   Rail.tsx — fixed silkscreen nav: section index on the left.
   ============================================================ */

import { useEffect, useState } from 'react'
import { scrollToId } from '../lib/lenis'
import { profile } from '../data/profile'

const LINKS: [string, string][] = [
  ['boot', '00 · BOOT'],
  ['profile', '01 · PROFILE'],
  ['revisions', '02 · REVISIONS'],
  ['builds', '03 · BUILDS'],
  ['stack', '04 · STACK'],
  ['contact', '05 · CONTACT'],
]

export default function Rail() {
  const [active, setActive] = useState('boot')

  useEffect(() => {
    const sections = LINKS.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id)
        }
      },
      { rootMargin: '-42% 0px -42% 0px', threshold: 0 },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  return (
    <nav className="rail" aria-label="Section index">
      <div className="rail-links">
        {LINKS.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className={active === id ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault()
              scrollToId(id)
            }}
          >
            {label}
          </a>
        ))}
      </div>
      <span className="rail-id">HH · REV {profile.rev}</span>
    </nav>
  )
}
