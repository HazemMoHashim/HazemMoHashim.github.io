/* Section shell — silkscreen index + display title */
import type { ReactNode } from 'react'

interface Props {
  id: string
  idx: string
  title: string
  note?: string
  children: ReactNode
}

export default function Section({ id, idx, title, note, children }: Props) {
  return (
    <section className="block" id={id}>
      <div className="shell">
        <div className="block-head reveal">
          <span className="idx mono">{idx}</span>
          <h2 className="display">{title}</h2>
          {note && <span className="head-note mono">{note}</span>}
        </div>
        {children}
      </div>
    </section>
  )
}
