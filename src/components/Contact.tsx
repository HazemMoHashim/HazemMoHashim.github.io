/* ============================================================
   Contact — connector pads. Email click-to-copy, links, footer.
   ============================================================ */

import { useRef, useState } from 'react'
import Section from './Section'
import { profile } from '../data/profile'

export default function Contact() {
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

  return (
    <Section id="contact" idx="06" title="Connect" note="ALL PADS TESTED — CONTINUITY OK">
      <div className="reveal">
        <button className="contact-mail" onClick={copyMail} title="Click to copy">
          {profile.email}
        </button>
        <span className="contact-hint mono mono-dim">CLICK TO COPY — GO ON, SEND IT</span>
      </div>

      <div className="contact-links reveal" style={{ '--reveal-delay': '0.12s' } as React.CSSProperties}>
        <a href={profile.github} target="_blank" rel="noreferrer">
          GITHUB <span className="ext">↗</span>
        </a>
        <a href={profile.linkedin} target="_blank" rel="noreferrer">
          LINKEDIN <span className="ext">↗</span>
        </a>
      </div>

      <footer className="footer mono">
        <span>
          {profile.githubUser.toLowerCase()}.github.io · REV {profile.rev} · DESIGNED & ROUTED BY{' '}
          {profile.fullName.toUpperCase()}
        </span>
        <span className="f-drc">
          DRC: <i>0 VIOLATIONS</i> · NO COMPONENTS WERE HARMED
        </span>
      </footer>

      <div className={`toast ${copied ? 'show' : ''}`} role="status">
        COPIED TO CLIPBOARD
      </div>
    </Section>
  )
}
