/* ============================================================
   pages/Home.tsx — homepage narrative:
   Who is he → What does he build → How does he engineer
   → What has he done → What is he working toward → Contact
   ============================================================ */

import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { profile, stack, honors, timelineEducation, timelineTraining, timelineRoles, type TimelineRow } from '../data/profile'
import { featuredProjects } from '../data/projects'
import ProjectCard from '../components/ProjectCard'
import { useReveal } from '../lib/useReveal'
import { heroScrollEase } from '../lib/mouse'

const BoardScene = lazy(() => import('../three/BoardScene'))

export default function Home({ booted }: { booted: boolean }) {
  useReveal()
  const contentRef = useRef<HTMLDivElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const timer = useRef<number>(0)

  const copyMail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
    } catch {
      // clipboard API denied — fallback
      const ta = document.createElement('textarea')
      ta.value = profile.email
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 2200)
  }

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
  const primaryActions = (
    <>
      <a href={profile.cvUrl} className="btn btn-solid" download>
        Download CV
      </a>
      <Link to="/projects" className="btn btn-outline">
        Explore Work
      </Link>
    </>
  )

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className={`hero ${booted ? 'booted' : ''}`} id="hero">
        <div className="hero-canvas" ref={canvasWrapRef}>
          <Suspense fallback={null}>
            <BoardScene />
          </Suspense>
        </div>
        <div className="shell hero-wrap">
          <div className="hero-body" ref={contentRef}>
            <span className="kicker mono reveal">PORTFOLIO REV {profile.rev}</span>
            <h1 className="display reveal">{profile.fullName}</h1>
            <div className="role reveal">{profile.title}</div>
            <p className="positioning reveal">{profile.positioning}</p>
            <div className="hero-actions reveal">
              {primaryActions}
            </div>
            <div className="hero-secondary reveal">
              <a href={profile.github} target="_blank" rel="noreferrer" className="mono">
                GITHUB <i className="ext">↗</i>
              </a>
              <a href={profile.linkedin} target="_blank" rel="noreferrer" className="mono">
                LINKEDIN <i className="ext">↗</i>
              </a>
              <button className="mail-copy mono" onClick={copyMail} title="Click to copy">
                {profile.email.toUpperCase()} · CLICK TO COPY
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- about (01 — introduce the person first) ---------- */}
      <section id="about" className="block about">
        <div className="shell">
          <div className="block-head reveal">
            <span className="idx mono">01</span>
            <h2 className="display reveal">ABOUT</h2>
          </div>
          <div className="about-grid reveal">
            <div>
              <p className="about-statement">
                I build electronics end to end: schematics, layout, firmware, and the systems around
                them. EV powertrains, embedded control and IC design taught me to trust measurements
                over vibes; the machine-learning work taught me the same discipline applies to models.
                One habit: make it real, make it measurable.
              </p>
              <p className="about-more">
                Recently: a real-time network-attack detection model (my graduation project), a custom
                ESP32 board routed in Altium, a bandgap reference in Cadence, a force-feedback sim rig,
                and a fully local AI race engineer. Open to hardware, embedded, IC and ML engineering roles.
              </p>
            </div>
            <dl className="facts">
              <div className="fact">
                <dt>Degree</dt>
                <dd>{profile.education.degree}</dd>
              </div>
              <div className="fact">
                <dt>School</dt>
                <dd className="dim">{profile.education.school}</dd>
              </div>
              <div className="fact">
                <dt>Period</dt>
                <dd>{profile.education.period}</dd>
              </div>
              <div className="fact">
                <dt>Project</dt>
                <dd className="dim">{profile.education.note}</dd>
              </div>
              <div className="fact">
                <dt>Status</dt>
                <dd className="copper-hi">Open to work</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ---------- featured work centerpiece ---------- */}
      <section id="featured" className="block featured">
        <div className="shell">
          <div className="block-head reveal">
            <span className="idx mono">02</span>
            <h2 className="display reveal">FEATURED WORK</h2>
            <span className="head-note mono reveal">Selected builds: hardware + AI/ML.</span>
          </div>
          <div className="featured-grid reveal">
            {featuredProjects.map((p, i) => (
              <ProjectCard key={p.id} project={p} tier={p.tier} delay={Math.min(i * 0.06, 0.4)} />
            ))}
          </div>
          <Link to="/projects" className="featured-note reveal">
            {featuredProjects.length} FEATURED · FULL ARCHIVE IN PROJECTS →
          </Link>
        </div>
      </section>

      {/* ---------- timeline (stacked: education → training → volunteering) ---------- */}
      <section id="timeline" className="block timeline">
        <div className="shell">
          <div className="block-head reveal">
            <span className="idx mono">03</span>
            <h2 className="display reveal">TIMELINE</h2>
            <span className="head-note mono reveal">Education · Training · Volunteering.</span>
          </div>
          <TimelineBlock title="Education" rows={timelineEducation} />
          <TimelineBlock title="Training" rows={timelineTraining} />
          <TimelineBlock title="Volunteering" rows={timelineRoles} />
        </div>
      </section>

      {/* ---------- stack ---------- */}
      <section id="stack" className="block stack">
        <div className="shell">
          <div className="block-head reveal">
            <span className="idx mono">04</span>
            <h2 className="display reveal">STACK</h2>
            <span className="head-note mono reveal">Toolbox: no skill bars.</span>
          </div>
          <div className="stack-grid reveal">
            {stack.map((g, i) => (
              <div key={g.ref} className="stack-group">
                <span className="stack-ref mono">{g.ref}</span>
                <h3 className="stack-title">{g.title}</h3>
                <ul className="stack-items">
                  {g.items.map((item, j) => (
                    <li key={j} className="stack-item">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- honors ---------- */}
      <section id="honors" className="block honors">
        <div className="shell">
          <div className="block-head reveal">
            <span className="idx mono">05</span>
            <h2 className="display reveal">HONORS</h2>
          </div>
          <div className="honors-list reveal">
            {honors.map((h) => (
              <div key={h.what} className="h-row">
                <span className="h-year">{h.year}</span>
                <span>{h.what}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- contact ---------- */}
      <section id="contact" className="block contact">
        <div className="shell">
          <div className="block-head reveal">
            <span className="idx mono">06</span>
            <h2 className="display reveal">CONNECT</h2>
          </div>
          <div className="contact-body reveal">
            <button className="contact-mail" onClick={copyMail} title="Click to copy">
              {profile.email}
            </button>
            <div className="contact-links">
              <a href={profile.github} target="_blank" rel="noreferrer" className="mono">
                GITHUB <i className="ext">↗</i>
              </a>
              <a href={profile.linkedin} target="_blank" rel="noreferrer" className="mono">
                LINKEDIN <i className="ext">↗</i>
              </a>
            </div>
            <span className="contact-hint mono">CLICK TO COPY · GO ON, SEND IT</span>
          </div>
          <span className="footer-line mono">
            HAZEMMOHASHIM.GITHUB.IO · REV {profile.rev} · DESIGNED &amp; ROUTED BY HAZEM HASHIM
          </span>
        </div>
      </section>

      <div className={`toast ${copied ? 'show' : ''}`} role="status">
        COPIED TO CLIPBOARD
      </div>
    </>
  )
}

/* timeline block — one stacked track */
function TimelineBlock({ title, rows }: { title: string; rows: TimelineRow[] }) {
  return (
    <div className="timeline-block reveal">
      <div className="tl-title">{title}</div>
      <ul className="tl-list">
        {rows.map((r, i) => (
          <li key={i} className="tl-row">
            <span className="tl-years">{r.years}</span>
            <div className="tl-body">
              <div className="tl-what">{r.what}</div>
              <div className="tl-who">{r.who}</div>
              {r.chip && <span className="tl-chip">{r.chip}</span>}
              {r.note && <span className="tl-note">{r.note}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
