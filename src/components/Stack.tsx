import Section from './Section'
import { stack } from '../data/profile'

export default function Stack() {
  return (
    <Section id="stack" idx="04" title="Component Bins" note="STACK — NO FANCY BARS, JUST TOOLS">
      <div className="stack-grid">
        {stack.map((g, i) => (
          <div
            className="stack-group reveal"
            key={g.ref}
            style={{ '--reveal-delay': `${i * 0.07}s` } as React.CSSProperties}
          >
            <div className="g-head">
              <span>{g.title}</span>
              <span className="g-ref">{g.ref}</span>
            </div>
            <ul>
              {g.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  )
}
