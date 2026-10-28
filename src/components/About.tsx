import Section from './Section'
import { profile } from '../data/profile'

export default function About() {
  return (
    <Section id="profile" idx="01" title="Profile" note="SCHEMATIC — SHEET 1/1">
      <div className="about-grid">
        <div>
          <p className="about-statement reveal">
            I build electronics end to end — <em>schematics, layout, firmware,</em> and the
            systems around them. EV powertrains, embedded control and IC design taught me to
            trust measurements over vibes; the machine-learning work taught me the same
            discipline applies to models. One habit: make it real, make it measurable.
          </p>
          <p className="about-more reveal" style={{ '--reveal-delay': '0.12s' } as React.CSSProperties}>
            Recently: a real-time network-attack detection model (my graduation project), a
            custom ESP32 board routed in Altium, a bandgap reference in Cadence, a
            force-feedback sim rig, and a fully local AI race engineer. Open to hardware,
            embedded, IC and ML engineering roles.
          </p>
        </div>
        <dl className="facts reveal" style={{ '--reveal-delay': '0.2s' } as React.CSSProperties}>
          <div className="fact">
            <dt>Location</dt>
            <dd>{profile.location}</dd>
          </div>
          <div className="fact">
            <dt>Degree</dt>
            <dd>B.Sc. E&C Engineering</dd>
          </div>
          <div className="fact">
            <dt>School</dt>
            <dd className="dim">Qena University (SVU)</dd>
          </div>
          <div className="fact">
            <dt>Class of</dt>
            <dd>2026 · Project: Excellent</dd>
          </div>
          <div className="fact">
            <dt>Languages</dt>
            <dd className="dim">AR · EN · FR · DE</dd>
          </div>
          <div className="fact">
            <dt>Status</dt>
            <dd className="copper-hi">Open to work</dd>
          </div>
        </dl>
      </div>
    </Section>
  )
}
