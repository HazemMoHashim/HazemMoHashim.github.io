import Section from './Section'
import { revisions } from '../data/profile'

const TAG_LABEL: Record<string, string> = {
  edu: 'EDU',
  training: 'TRAINING',
  team: 'TEAM',
  ml: 'AI/ML',
}

export default function Revisions() {
  return (
    <Section id="revisions" idx="02" title="Revision History" note="EDUCATION — TRAINING — ROLES">
      <div className="revisions">
        {revisions.map((r, i) => (
          <div
            className="rev-row reveal"
            key={i}
            style={{ '--reveal-delay': `${Math.min(i * 0.05, 0.35)}s` } as React.CSSProperties}
          >
            <span className="years">{r.years}</span>
            <span className="what">
              {r.what}
              {r.note && <span className="who" style={{ display: 'block', marginTop: 3 }}>{r.note}</span>}
            </span>
            <span className="who">{r.who}</span>
            <span className={`tag t-${r.tag}`}>{TAG_LABEL[r.tag]}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}
