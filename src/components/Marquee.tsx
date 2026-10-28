/* Skill-domain ticker strip */
import { marqueeItems } from '../data/profile'

export default function Marquee() {
  const half = (k: string) =>
    marqueeItems.map((item, i) => (
      <span key={`${k}-${i}`}>
        {item} <i>·</i>
      </span>
    ))
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        <div style={{ display: 'flex' }}>{half('a')}</div>
        <div style={{ display: 'flex' }}>{half('b')}</div>
      </div>
    </div>
  )
}
