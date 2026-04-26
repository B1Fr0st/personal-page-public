import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { site } from '../data/site.js';
import StatusPanel from './StatusPanel.jsx';

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/projects', label: 'Projects' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' }
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [termOpen, setTermOpen] = useState(false);
  const termRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    setTermOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open && !termOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setTermOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, termOpen]);

  useEffect(() => {
    if (!termOpen) return;
    const onClick = (e) => {
      if (!termRef.current) return;
      if (!termRef.current.contains(e.target)) setTermOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [termOpen]);

  return (
    <nav className={`navbar${open ? ' navbar--open' : ''}`}>
      <div className="navbar__inner">
        <span className="navbar__brand">{site.name}</span>
        <div className="navbar__links">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `navbar__link${isActive ? ' navbar__link--active' : ''}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="navbar__actions">
          <div className="navbar__term" ref={termRef}>
            <button
              type="button"
              className="navbar__icon-btn"
              aria-label={termOpen ? 'Close terminal' : 'Open terminal'}
              aria-expanded={termOpen}
              onClick={() => setTermOpen((v) => !v)}
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined navbar__icon"
              >
                terminal
              </span>
            </button>
            <div
              className={`navbar__term-panel${termOpen ? ' is-open' : ''}`}
              aria-hidden={!termOpen}
            >
              <StatusPanel open={termOpen} />
            </div>
          </div>
          <a href={site.resumeHref} className="btn btn--primary navbar__resume">
            Get Resume
          </a>
          <button
            type="button"
            className="navbar__toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="navbar-mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              {open ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>
      <div
        id="navbar-mobile-menu"
        className={`navbar__mobile${open ? ' navbar__mobile--open' : ''}`}
        aria-hidden={!open}
      >
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `navbar__mobile-link${isActive ? ' navbar__mobile-link--active' : ''}`
            }
          >
            {l.label}
          </NavLink>
        ))}
        <a
          href={site.resumeHref}
          className="btn btn--primary navbar__mobile-resume"
        >
          Get Resume
        </a>
      </div>
    </nav>
  );
}
