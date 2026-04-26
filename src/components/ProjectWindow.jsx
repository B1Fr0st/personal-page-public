import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { posts } from '../data/posts.js';
import BlogCard from './BlogCard.jsx';

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function computeTargetRect() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(vw * 0.8, 1100);
  const height = vh * 0.8;
  return {
    left: (vw - width) / 2,
    top: (vh - height) / 2,
    width,
    height
  };
}

function applyRect(el, rect) {
  el.style.left = `${rect.left}px`;
  el.style.top = `${rect.top}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
}

export default function ProjectWindow({
  project,
  originRect,
  titleRect,
  onClose,
  onClosingChange
}) {
  const [phase, setPhase] = useState('entering');
  const windowRef = useRef(null);
  const closeBtnRef = useRef(null);
  const chromeTitleRef = useRef(null);
  const ghostRef = useRef(null);

  useLayoutEffect(() => {
    if (!windowRef.current || !originRect) return;
    const target = computeTargetRect();
    const win = windowRef.current;
    applyRect(win, originRect);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        applyRect(win, target);
        setPhase('open');
      });
    });
  }, [originRect, titleRect]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (phase === 'open') closeBtnRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') handleClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function handleClose() {
    if (phase === 'closing') return;
    const win = windowRef.current;
    if (!win || !originRect) {
      onClose();
      return;
    }

    const ghost = ghostRef.current;
    if (ghost && titleRect && chromeTitleRef.current) {
      const chromeRect = chromeTitleRef.current.getBoundingClientRect();
      ghost.style.left = `${chromeRect.left}px`;
      ghost.style.top = `${chromeRect.top}px`;
      ghost.style.fontFamily = 'var(--font-mono)';
      ghost.style.fontSize = '0.8125rem';
      ghost.style.color = 'var(--color-text-muted)';
    }

    setPhase('closing');
    onClosingChange?.(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        applyRect(win, originRect);
        if (ghost && titleRect) {
          ghost.style.left = `${titleRect.left}px`;
          ghost.style.top = `${titleRect.top}px`;
          ghost.style.fontFamily = 'var(--font-serif)';
          ghost.style.fontSize = '1.75rem';
          ghost.style.color = 'var(--color-text)';
        }
      });
    });

    if (REDUCED_MOTION) {
      onClose();
      return;
    }
    const done = (e) => {
      if (e.target !== win || e.propertyName !== 'width') return;
      win.removeEventListener('transitionend', done);
      onClose();
    };
    win.addEventListener('transitionend', done);
  }

  const related = (project.relatedPosts || [])
    .map((slug) => posts.find((p) => p.slug === slug))
    .filter(Boolean);

  return createPortal(
    <div
      className={`project-window-backdrop project-window-backdrop--${phase}`}
      onClick={handleClose}
      role="presentation"
    >
      <div
        ref={windowRef}
        className={`project-window project-window--${phase}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`project-window-title-${project.id}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="project-window__chrome">
          <div
            className="project-window__title"
            id={`project-window-title-${project.id}`}
          >
            <span ref={chromeTitleRef} className="project-window__title-inner">
              {project.title}
            </span>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="project-window__close"
            onClick={handleClose}
            aria-label="Close project"
          >
            ×
          </button>
        </div>

        <div className="project-window__scroll">
          {project.image && project.image !== 'todo' ? (
            <div className="project-window__hero">
              <img src={project.image} alt={project.imageAlt || project.title} />
            </div>
          ) : (
            <div className="project-window__hero project-window__hero--placeholder" />
          )}

          <div className="project-window__body">
            <ul className="project-card__tags project-window__tags">
              {project.tags.map((t) => (
                <li key={t} className="project-card__tag">
                  {t}
                </li>
              ))}
            </ul>

            {Array.isArray(project.longDescription)
              ? project.longDescription.map((p, i) => (
                  <p key={i} className="project-window__para">
                    {p}
                  </p>
                ))
              : (
                  <p className="project-window__para">
                    {project.longDescription || project.description}
                  </p>
                )}

            {project.links?.length > 0 && (
              <div className="project-window__links">
                {project.links.map((l) => (
                  <a
                    key={l.href + l.label}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="project-window__link"
                  >
                    {l.label} →
                  </a>
                ))}
              </div>
            )}

            {related.length > 0 && (
              <section className="project-window__related">
                <h4 className="project-window__related-label">Related posts</h4>
                <div className="project-window__related-list">
                  {related.map((post) => (
                    <BlogCard key={post.slug} post={post} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {titleRect && (
        <div
          ref={ghostRef}
          className={`project-window__ghost-title project-window__ghost-title--${phase}`}
          aria-hidden="true"
        >
          {project.title}
        </div>
      )}
    </div>,
    document.body
  );
}
