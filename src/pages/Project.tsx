/* ============================================================
   pages/Project.tsx — project case study page (/projects/:slug).
   First-class technical case study: problem → role → architecture
   → implementation → results → gallery → links.
   ============================================================ */

import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { projectBySlug } from '../data/projects'
import { profile, caseGreet, caseChat } from '../data/profile'
import { useReveal } from '../lib/useReveal'

export default function Project({ booted }: { booted: boolean }) {
  useReveal()
  const { slug } = useParams<{ slug: string }>()
  const project = slug ? projectBySlug(slug) : undefined

  /* avatar guide: greet on load, then narrate each section as it scrolls in */
  useEffect(() => {
    if (!booted || !project) return
    const t = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('avatar-say', { detail: caseGreet(project.title) }))
    }, 700)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.18) {
            const head = e.target.querySelector('.case-subhead')
            const key = head?.textContent?.trim() ?? ''
            const line = caseChat[key]
            if (line) window.dispatchEvent(new CustomEvent('avatar-say', { detail: line }))
          }
        }
      },
      { threshold: [0.18] },
    )
    document.querySelectorAll('.case-section').forEach((el) => io.observe(el))
    return () => {
      window.clearTimeout(t)
      io.disconnect()
    }
  }, [booted, project])

  if (!project) {
    return (
      <section className="block not-found">
        <div className="shell">
          <h1 className="display">Project not found</h1>
          <a href="/" className="btn btn-outline">
            ← BACK TO PORTFOLIO
          </a>
        </div>
      </section>
    )
  }

  return (
  <>
    {/* hero strip */}
    <section className="block case-hero">
      <div className="shell">
        <div className="case-head reveal">
          <Link to="/projects" className="mono small">← PROJECTS</Link>
          <span className="case-idx mono">{project.idx}</span>
          <span className="case-track mono dim">{project.track === 'ai-ml' ? 'AI/ML' : 'HARDWARE'}</span>
          <h1 className="case-title">{project.title}</h1>
          <span className="case-year mono">{project.year}</span>
          <p className="case-line">{project.line}</p>
          <div className="case-actions">
            {project.github && (
              <a href={project.github} className="btn btn-outline">GITHUB</a>
            )}
            {project.external && (
              <a href={project.external} className="btn btn-outline">EXTERNAL LINK</a>
            )}
          </div>
        </div>
        {/* hero image / placeholder */}
        <div className="case-hero-image reveal">
          {project.gallery[0]?.src ? (
            <img
              src={project.gallery[0].src}
              alt={project.gallery[0].caption}
              className={project.gallery[0].kind === 'diagram' ? 'img-contain' : ''}
            />
          ) : (
            <div className="case-image-placeholder">
              <span className="placeholder-kind">{project.gallery[0]?.kind ?? 'image'}</span>
              <span className="placeholder-caption">{project.gallery[0]?.caption ?? 'Hero image'}</span>
            </div>
          )}
        </div>
      </div>
    </section>

    <main className="case-body">
      <div className="shell">
        {/* overview */}
        <section className="case-section reveal">
          <span className="case-subhead mono">OVERVIEW</span>
          <p className="case-text">{project.blurb}</p>
        </section>

        {/* problem */}
        <section className="case-section reveal">
          <span className="case-subhead mono">THE PROBLEM</span>
          <p className="case-text">{project.problem}</p>
        </section>

        {/* contribution */}
        <section className="case-section reveal">
          <span className="case-subhead mono">MY CONTRIBUTION</span>
          <p className="case-text">{project.contribution}</p>
        </section>

        {/* architecture */}
        <section className="case-section reveal">
          <span className="case-subhead mono">SYSTEM / ARCHITECTURE</span>
          <p className="case-text">{project.architecture}</p>
        </section>

        {/* implementation */}
        <section className="case-section reveal">
          <span className="case-subhead mono">TECHNICAL IMPLEMENTATION</span>
          <p className="case-text">{project.implementation}</p>
        </section>

        {/* gallery */}
        {project.gallery.length > 0 && (
          <section className="case-section reveal">
            <span className="case-subhead mono">GALLERY / DIAGRAMS</span>
            <div className="case-gallery">
              {project.gallery.map((item, i) => (
                <figure key={i} className="case-figure">
                  {item.src ? (
                    <img
                      src={item.src}
                      alt={item.caption}
                      loading="lazy"
                      className={item.kind === 'diagram' ? 'img-contain' : ''}
                    />
                  ) : (
                    <div className="case-image-placeholder">
                      <span className="placeholder-kind">{item.kind}</span>
                      <span className="placeholder-caption">{item.caption}</span>
                    </div>
                  )}
                  <figcaption className="figcap">{item.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* results */}
        {project.results.length > 0 && (
          <section className="case-section reveal">
            <span className="case-subhead mono">RESULTS</span>
            <ul className="case-results">
              {project.results.map((r, i) => (
                <li key={i} className="case-result">{r}</li>
              ))}
            </ul>
          </section>
        )}

        {/* technologies */}
        <section className="case-section reveal">
          <span className="case-subhead mono">TECHNOLOGIES</span>
          <div className="case-tech">
            {project.tech.map((t, i) => (
              <span key={i} className="tech-chip">{t}</span>
            ))}
          </div>
          <span className="tech-note mono">
            Supporting information, not the project itself.
          </span>
        </section>

        {/* lessons */}
        <section className="case-section reveal">
          <span className="case-subhead mono">LESSONS LEARNED</span>
          <p className="case-text">
            {'Coming soon: Hazem is adding the postmortem for this project.'}
          </p>
        </section>
      </div>
    </main>

    <footer className="case-footer">
      <div className="shell">
        <span className="footer-line mono">
          HAZEMMOHASHIM.GITHUB.IO · REV {profile.rev} · DESIGNED &amp; ROUTED BY HAZEM HASHIM
        </span>
      </div>
    </footer>
  </>
)
}