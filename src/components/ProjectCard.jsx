import { forwardRef, useRef } from 'react';

function toRect(el) {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

const ProjectCard = forwardRef(function ProjectCard(
  { project, onExpand, hidden, returning },
  ref
) {
  const titleRef = useRef(null);

  function trigger(cardEl) {
    if (!onExpand || !cardEl) return;
    const cardRect = toRect(cardEl);
    const titleRect = titleRef.current ? toRect(titleRef.current) : null;
    onExpand(project, cardRect, titleRect);
  }

  function handleClick(e) {
    trigger(e.currentTarget);
  }

  function handleKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      trigger(e.currentTarget);
    }
  }

  return (
    <article
      ref={ref}
      className={`project-card${returning ? ' project-card--returning' : ''}`}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKey}
      aria-label={`Open ${project.title}`}
      style={hidden && !returning ? { visibility: 'hidden' } : undefined}
    >
      <div className="project-card__row">
        <div className="project-card__body">
          <h3 className="project-card__title" ref={titleRef}>{project.title}</h3>
          <p className="project-card__desc">{project.description}</p>
          <ul className="project-card__tags">
            {project.tags.map((t) => (
              <li key={t} className="project-card__tag">
                {t}
              </li>
            ))}
          </ul>
        </div>
        {project.image && (
          <div className="project-card__media">
            <img src={project.image} alt={project.imageAlt || project.title} />
          </div>
        )}
      </div>
    </article>
  );
});

export default ProjectCard;
