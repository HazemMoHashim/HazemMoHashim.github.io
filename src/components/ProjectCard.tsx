/* ============================================================
   components/ProjectCard.tsx — featured + archive cards.
   Three tiers: primary (large), medium, small.
   Click → case study page /projects/:slug.
   Gallery slots with no src render as intentional placeholder frames.
   ============================================================ */

import { Link } from 'react-router-dom'
import { Project } from '../data/projects'

interface Props {
  project: Project
  tier?: 'primary' | 'medium' | 'small'
  delay?: number
}

export default function ProjectCard({ project, tier = 'small', delay }: Props) {
  const isPrimary = tier === 'primary'
  const isMedium = tier === 'medium'

  return (
    <article
      className={`project-card tier-${tier} reveal`}
      style={{ '--reveal-delay': `${delay ?? 0}s` } as React.CSSProperties}
    >
      <Link to={`/projects/${project.slug}`} className="card-link" aria-label={`Open ${project.title} case study`}>
        {/* image area — real image when we have one, placeholder frame when not */}
        <div className="card-image">
          {project.gallery[0]?.src ? (
            <img
              src={project.gallery[0].src}
              alt={project.gallery[0].caption}
              loading="lazy"
              className={`card-img ${['diagram', 'schematic', 'simulation'].includes(project.gallery[0].kind) ? 'img-contain' : ''}`}
            />
          ) : (
            <div className="card-image-placeholder">
              <span className="placeholder-kind">{project.gallery[0]?.kind ?? 'image'}</span>
              <span className="placeholder-caption">{project.gallery[0]?.caption ?? 'Image'}</span>
            </div>
          )}
        </div>
        <div className="card-body">
          <div className="card-meta">
            <span className="card-idx mono">{project.idx}</span>
            <span className="card-track mono dim">{project.track === 'ai-ml' ? 'AI/ML' : 'HARDWARE'}</span>
          </div>
          <h3 className="card-title">{project.title}</h3>
          <p className="card-line">{project.line}</p>
          {isPrimary && (
            <div className="card-tech">
              {project.tech.slice(0, 4).map((t, i) => (
                <span key={i} className="tech-chip">{t}</span>
              ))}
            </div>
          )}
          {!isPrimary && project.tech.length > 0 && (
            <div className="card-tech">
              {project.tech.slice(0, 3).map((t, i) => (
                <span key={i} className="tech-chip">{t}</span>
              ))}
            </div>
          )}
          <span className="card-enter mono">OPEN CASE STUDY →</span>
        </div>
      </Link>
    </article>
  )
}
