import Section from './Section'
import { honors } from '../data/profile'

export default function Spine() {
  return (
    <Section id="spine" idx="05" title="Leadership & Honors" note="SHARED BETWEEN BOTH TRACKS">
      <div className="spine-grid">
        <div>
          <div className="lead-card reveal">
            <div className="l-org">SVU RACING TEAM · QENA</div>
            <h3>Powertrain Subsystem Head</h3>
            <div className="l-when">MAY 2022 — JUL 2026</div>
            <p>
              Led and mentored the team building the vehicle's electrical architecture — EV
              powertrain, low-voltage subsystem, and competition compliance across two EVER V
              cycles.
            </p>
          </div>
          <div className="lead-card reveal" style={{ '--reveal-delay': '0.1s' } as React.CSSProperties}>
            <div className="l-org">IEEE SVU STUDENT BRANCH · QENA</div>
            <h3>Electrical Technical Head</h3>
            <div className="l-when">OCT 2021 — JUL 2026</div>
            <p>
              Organized technical workshops and mentored students in electronics, programming
              and robotics.
            </p>
          </div>
        </div>
        <div className="honors reveal" style={{ '--reveal-delay': '0.15s' } as React.CSSProperties}>
          {honors.map((h) => (
            <div className="h-row" key={h.what}>
              <span className="h-year">{h.year}</span>
              <span>{h.what}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
