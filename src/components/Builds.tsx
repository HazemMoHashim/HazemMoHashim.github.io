import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import Section from './Section'
import { featuredBuilds, builds, buildChat, type Track } from '../data/profile'

/* the 10 procedural objects live in their own chunk — only fetched
   the first time a stage actually mounts */
const ObjectStage = lazy(() => import('../three/objects').then((m) => ({ default: m.ObjectStage })))

function StageFallback() {
  return <div className="obj-stage" aria-hidden="true" />
}

function TrackChip({ track }: { track: Track }) {
  return <span className={`track-chip ${track === 'ai-ml' ? 'ml' : ''}`}>{track === 'ai-ml' ? 'AI/ML' : 'HARDWARE'}</span>
}

/* is element mostly inside the viewport? (lazy-mount canvases) */
function useInView<T extends HTMLElement>(rootMargin = '120px') {
  const ref = useRef<T | null>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setSeen(true)),
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [seen, rootMargin])
  return [ref, seen] as const
}

function hoverSay(id: string) {
  const line = buildChat[id]
  if (line) window.dispatchEvent(new CustomEvent('avatar-say', { detail: line }))
}

export default function Builds() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [pairRef, pairSeen] = useInView<HTMLDivElement>()

  return (
    <Section id="builds" idx="03" title="Builds" note="GRAD PROJECT + FEATURED BUILD + 8 MORE">
      <div className="grad-pair" ref={pairRef}>
        {featuredBuilds.map((f) => (
          <article
            className={`grad-card ${f.lead ? 'lead' : ''} ${f.withStage ? 'with-stage' : ''} reveal`}
            key={f.id}
            onMouseEnter={() => hoverSay(f.id)}
          >
            <div className="g-copy">
              <div className="g-top">
                <span className="g-num">{f.num}</span>
                <span className="g-year mono mono-dim">{f.specs[f.specs.length - 1]}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.blurb}</p>
              <div className="spec-row">
                {f.specs.map((s) => (
                  <span className={`spec ${f.track === 'ai-ml' ? 'ml' : ''}`} key={s}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
            {f.withStage && pairSeen && (
              <div className="gc-stage">
                <Suspense fallback={<StageFallback />}>
                  <ObjectStage id={f.id} />
                </Suspense>
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="builds-list">
        {builds.map((b, i) => {
          const open = openId === b.id
          return (
            <div className={`build-row ${open ? 'open' : ''}`} key={b.id}>
              <button
                className="build-main reveal"
                style={{ '--reveal-delay': `${Math.min(i * 0.05, 0.35)}s` } as React.CSSProperties}
                aria-expanded={open}
                aria-controls={`detail-${b.id}`}
                onMouseEnter={() => hoverSay(b.id)}
                onClick={() => setOpenId(open ? null : b.id)}
              >
                <span className="b-idx">{b.idx}</span>
                <span className="b-title">{b.title}</span>
                <span className="b-line">{b.line}</span>
                <TrackChip track={b.track} />
                <span className="b-year">{b.year}</span>
                <span className={`chev ${open ? 'up' : ''}`} aria-hidden="true">▾</span>
              </button>
              {open && (
                <div className="build-detail" id={`detail-${b.id}`} role="region">
                  <Suspense fallback={<StageFallback />}>
                    <ObjectStage id={b.id} />
                  </Suspense>
                  <p className="b-detail-text">{b.detail}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Section>
  )
}
