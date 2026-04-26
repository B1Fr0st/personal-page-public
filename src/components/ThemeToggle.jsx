import { useEffect, useRef, useState } from 'react';

const CTA_KEY = 'themeCtaSeen';
const CTA_SHOW_DELAY = 500;
const CTA_HOLD_MS = 3000;

function getInitialTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [ctaState, setCtaState] = useState('hidden'); // 'hidden' | 'entering' | 'open' | 'closing'
  const [iconReady, setIconReady] = useState(false);
  const timersRef = useRef([]);

  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) {
      setIconReady(true);
      return;
    }
    if (document.fonts.check('1em "Material Symbols Outlined"')) {
      setIconReady(true);
      return;
    }
    let cancelled = false;
    document.fonts.load('1em "Material Symbols Outlined"').then(() => {
      if (!cancelled) setIconReady(true);
    }).catch(() => {
      if (!cancelled) setIconReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(CTA_KEY) === '1';
    } catch {}
    if (seen) return;

    const open = setTimeout(() => {
      setCtaState('entering');
      try {
        localStorage.setItem(CTA_KEY, '1');
      } catch {}
      // Double rAF: mount at opacity 0, then next frame flip to 'open' so the
      // browser sees a real 0 → 1 transition instead of popping in.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setCtaState('open'));
      });
      const close = setTimeout(() => setCtaState('closing'), CTA_HOLD_MS);
      const done = setTimeout(() => setCtaState('hidden'), CTA_HOLD_MS + 400);
      timersRef.current.push(close, done);
    }, CTA_SHOW_DELAY);
    timersRef.current.push(open);

    return () => {
      for (const t of timersRef.current) clearTimeout(t);
      timersRef.current = [];
    };
  }, []);

  const next = theme === 'dark' ? 'light' : 'dark';
  const icon = theme === 'dark' ? 'light_mode' : 'dark_mode';

  const handleClick = () => {
    if (ctaState !== 'hidden') {
      for (const t of timersRef.current) clearTimeout(t);
      timersRef.current = [];
      setCtaState('closing');
      setTimeout(() => setCtaState('hidden'), 400);
    }
    setTheme(next);
  };

  const expanded =
    ctaState === 'entering' || ctaState === 'open' || ctaState === 'closing';
  const textVisible = ctaState === 'open';

  return (
    <div className="theme-toggle-wrap">
      {expanded && (
        <span
          className={`theme-toggle-hint${textVisible ? ' is-visible' : ''}`}
          aria-hidden="true"
        >
          <span className="theme-toggle-hint__text">prefer {next} mode?</span>
          <svg
            className="theme-toggle-hint__arrow"
            width="64"
            height="40"
            viewBox="0 0 80 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 10 C 40 10, 60 32, 68 30" />
            <path d="M62 24 L 68 30 L 62 36" />
          </svg>
        </span>
      )}
      <button
        type="button"
        className={`theme-toggle${expanded ? ' theme-toggle--expanded' : ''}`}
        onClick={handleClick}
        aria-label={`Switch to ${next} mode`}
        title={`Switch to ${next} mode`}
      >
        <span aria-hidden="true" className="material-symbols-outlined">
          {iconReady ? icon : ''}
        </span>
      </button>
    </div>
  );
}
