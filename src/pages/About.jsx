import { useEffect, useMemo, useRef, useState } from 'react';
import { about, site } from '../data/site.js';
import { bookCovers } from '../data/book-covers.js';
import { trackArt } from '../data/track-art.js';
import trackMeta from '../data/track-meta.json';

function appleMusicId(href) {
  if (!href) return null;
  try {
    const u = new URL(href);
    if (!u.hostname.endsWith('music.apple.com')) return null;
    const trackId = u.searchParams.get('i');
    if (trackId && /^\d+$/.test(trackId)) return trackId;
    const parts = u.pathname.split('/').filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(parts[i])) return parts[i];
    }
    return null;
  } catch {
    return null;
  }
}

function isApplePlatform() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  if (/Macintosh|Mac OS X/.test(ua)) return true;
  // iPadOS 13+ reports as Macintosh; disambiguate via touch support.
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
  return false;
}

function appleMusicDeepLink(href) {
  if (!href) return href;
  try {
    const u = new URL(href);
    if (!u.hostname.endsWith('music.apple.com')) return href;
    return `music://${u.host}${u.pathname}${u.search}${u.hash}`;
  } catch {
    return href;
  }
}

function Playlist({ section }) {
  const listRef = useRef(null);
  const audioRef = useRef(null);
  const motionRef = useRef({ x: 0, v: 0, target: 0 });
  const [playingId, setPlayingId] = useState(null);
  const tracks = useMemo(() => {
    const arr = section.tracks.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [section.tracks]);
  const [ctaPhase, setCtaPhase] = useState('armed');
  const ctaPhaseRef = useRef('armed');
  const ctaEngagedRef = useRef(false);
  ctaPhaseRef.current = ctaPhase;
  const [onApple, setOnApple] = useState(false);
  const rootRef = useRef(null);
  useEffect(() => {
    setOnApple(isApplePlatform());
  }, []);

  // On hover-less devices (mostly touch), pointerenter never fires — so the
  // CTA needs a different trigger. When the playlist scrolls into the middle
  // band of the viewport for the first time, run the CTA sequence as a
  // preview, then dismiss it automatically.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasHover = window.matchMedia('(hover: hover)').matches;
    if (hasHover) return;
    const el = rootRef.current;
    if (!el) return;
    let triggered = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !triggered && ctaPhaseRef.current === 'armed') {
            triggered = true;
            ctaPhaseRef.current = 'play';
            setCtaPhase('play');
            // The play→controls transition is handled by the existing
            // ctaPhase effect. Schedule the auto-dismiss after the user has
            // had time to read the controls hint.
            setTimeout(() => {
              if (
                ctaPhaseRef.current === 'play' ||
                ctaPhaseRef.current === 'controls'
              ) {
                ctaPhaseRef.current = 'gone';
                setCtaPhase('gone');
              }
            }, 3600);
          }
        }
      },
      // Fire when the playlist's center crosses the viewport's center band.
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (ctaPhase !== 'play') return;
    const t = setTimeout(() => {
      setCtaPhase((p) => (p === 'play' ? 'controls' : p));
    }, 1200);
    return () => clearTimeout(t);
  }, [ctaPhase]);

  // Called by real interactions (play / wheel / drag). Dismisses the CTA
  // permanently for this session.
  const dismissCta = () => {
    if (ctaPhaseRef.current === 'gone') return;
    ctaEngagedRef.current = true;
    ctaPhaseRef.current = 'gone';
    setCtaPhase('gone');
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setPlayingId(null);
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, []);

  // JS-driven marquee. Owns the transform via a single rAF loop so there is
  // no interaction between React renders and animation state. Velocity
  // smoothly interpolates toward `target` (full speed or 0 on hover).
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const itemRem = 9.5;
    const gapRem = 1.25;
    const copyPx = section.tracks.length * (itemRem + gapRem) * rem;
    const durationSec = 25;
    const fullSpeed = -copyPx / durationSec; // px/sec, negative = leftward
    const tauMs = 450; // velocity-smoothing time constant
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    motionRef.current.target = reducedMotion ? 0 : fullSpeed;

    let raf = 0;
    let last = performance.now();
    let wheelActiveUntil = 0;
    let flingUntil = 0;
    // Fling decay is much slower than baseline target-tracking so a quick
    // swipe coasts for a moment before the marquee resumes its slow drift.
    const flingTauMs = 1100;
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const m = motionRef.current;
      // While the user is actively wheel-scrolling, pin velocity to 0 so
      // the marquee doesn't fight the input.
      if (now < wheelActiveUntil) {
        m.v = 0;
      } else {
        // Use the slow decay constant during a fling so the swipe coasts.
        const tau = now < flingUntil ? flingTauMs : tauMs;
        const alpha = 1 - Math.exp(-(dt * 1000) / tau);
        m.v += (m.target - m.v) * alpha;
      }
      m.x += m.v * dt;
      // wrap into (-copyPx, 0]
      if (copyPx > 0) {
        while (m.x <= -copyPx) m.x += copyPx;
        while (m.x > 0) m.x -= copyPx;
      }
      el.style.transform = `translate3d(${m.x}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const container = el.parentElement;

    // Horizontal trackpad / wheel scroll hijack. Only intercept when the
    // gesture is clearly horizontal so vertical page scrolling still works.
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      motionRef.current.x -= e.deltaX;
      wheelActiveUntil = performance.now() + 150;
      dismissCta();
    };
    container?.addEventListener('wheel', onWheel, { passive: false });

    // Pointer drag. Engages only after a small movement threshold so taps
    // and clicks on buttons/links still work. Releases with momentum.
    const DRAG_THRESHOLD = 5;
    const drag = {
      active: false,
      engaged: false,
      pointerId: null,
      startX: 0,
      lastX: 0,
      lastT: 0,
      velocity: 0
    };

    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      // Let clicks on buttons and links pass through normally.
      if (e.target.closest('button, a')) {
        drag.active = false;
        return;
      }
      drag.active = true;
      drag.engaged = false;
      drag.pointerId = e.pointerId;
      drag.startX = e.clientX;
      drag.lastX = e.clientX;
      drag.lastT = performance.now();
      drag.velocity = 0;
    };

    const onPointerMove = (e) => {
      if (!drag.active || e.pointerId !== drag.pointerId) return;
      const dx = e.clientX - drag.lastX;
      if (!drag.engaged) {
        if (Math.abs(e.clientX - drag.startX) < DRAG_THRESHOLD) return;
        drag.engaged = true;
        container.setPointerCapture?.(e.pointerId);
        container.classList.add('is-dragging');
        dismissCta();
      }
      e.preventDefault();
      const now = performance.now();
      const dt = (now - drag.lastT) / 1000;
      if (dt > 0) drag.velocity = dx / dt;
      drag.lastX = e.clientX;
      drag.lastT = now;
      motionRef.current.x += dx;
      wheelActiveUntil = now + 50; // suppress marquee smoothing during drag
    };

    const endDrag = (e) => {
      if (!drag.active || e.pointerId !== drag.pointerId) return;
      const wasEngaged = drag.engaged;
      drag.active = false;
      drag.engaged = false;
      container.classList.remove('is-dragging');
      if (wasEngaged) {
        // Hand off momentum: clamp to a sensible range and seed velocity.
        // Discard stale velocity if the finger paused before release (idle
        // pointers shouldn't fling).
        const idleMs = performance.now() - drag.lastT;
        const captured = idleMs > 80 ? 0 : drag.velocity;
        const flung = Math.max(-4000, Math.min(4000, captured));
        motionRef.current.v = flung;
        // Clear the input-suppression window set during drag so the loop
        // can actually apply the fling velocity instead of pinning v to 0.
        wheelActiveUntil = 0;
        // Engage the slow-decay fling window proportional to how hard the
        // swipe was, so light flicks settle quickly and hard flings coast.
        const flingMs = Math.min(900, Math.abs(flung) * 0.4);
        flingUntil = performance.now() + flingMs;
        // Suppress the click that would otherwise follow a drag.
        const swallow = (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          container.removeEventListener('click', swallow, true);
        };
        container.addEventListener('click', swallow, true);
        setTimeout(() => container.removeEventListener('click', swallow, true), 0);
      }
    };

    container?.addEventListener('pointerdown', onPointerDown);
    container?.addEventListener('pointermove', onPointerMove);
    container?.addEventListener('pointerup', endDrag);
    container?.addEventListener('pointercancel', endDrag);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      container?.removeEventListener('wheel', onWheel);
      container?.removeEventListener('pointerdown', onPointerDown);
      container?.removeEventListener('pointermove', onPointerMove);
      container?.removeEventListener('pointerup', endDrag);
      container?.removeEventListener('pointercancel', endDrag);
    };
  }, [section.tracks.length]);

  const togglePreview = (id, previewUrl) => {
    dismissCta();
    const audio = audioRef.current;
    if (!audio || !previewUrl) return;
    if (playingId === id) {
      audio.pause();
      setPlayingId(null);
      return;
    }
    audio.src = previewUrl;
    audio.currentTime = 0;
    audio.play().then(
      () => setPlayingId(id),
      () => setPlayingId(null)
    );
  };

  const pauseMotion = (e) => {
    // Touch pointerenter fires on tap and would freeze the marquee until the
    // next interaction — only react to hover-capable pointers (mouse/pen).
    if (e?.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') {
      return;
    }
    motionRef.current.target = 0;
    if (ctaPhaseRef.current === 'armed') {
      ctaPhaseRef.current = 'play';
      setCtaPhase('play');
    }
  };

  const resumeMotion = (e) => {
    if (e?.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') {
      return;
    }
    const el = listRef.current;
    if (!el) return;
    // If the user left without engaging with the CTA, re-arm so it shows
    // again on next hover.
    if (ctaPhaseRef.current === 'play' || ctaPhaseRef.current === 'controls') {
      if (ctaEngagedRef.current) {
        ctaPhaseRef.current = 'gone';
        setCtaPhase('gone');
      } else {
        ctaPhaseRef.current = 'armed';
        setCtaPhase('armed');
      }
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const copyPx = section.tracks.length * (9.5 + 1.25) * rem;
    motionRef.current.target = -copyPx / 25;
  };

  const renderTrack = (raw, i, extraProps = {}) => {
    const track = typeof raw === 'string' ? { href: raw } : raw;
    const id = appleMusicId(track.href);
    const fetched = (id && trackMeta[id]) || {};
    const title = track.title || fetched.title || '';
    const artist = track.artist || fetched.artist || '';
    const album = track.album || fetched.album || '';
    const explicit = track.explicit ?? fetched.explicit ?? false;
    const preview = fetched.preview || null;
    const isPlaying = id && playingId === id;
    const hidden = Boolean(extraProps['aria-hidden']);
    const initials = title
      ? title
          .split(' ')
          .slice(0, 2)
          .map((w) => w[0])
          .join('')
          .toUpperCase()
      : '?';
    const artSrc = id ? trackArt[id] : null;
    const artInner = artSrc ? (
      <img src={artSrc} alt={track.artAlt || `${title} artwork`} />
    ) : (
      <span className="playlist__art-fallback">{initials}</span>
    );
    return (
      <li key={i} className="playlist__item" {...extraProps}>
        <div
          className={`playlist__art${isPlaying ? ' is-playing' : ''}`}
          aria-hidden={!track.href}
        >
          {track.href ? (
            <a
              className="playlist__link"
              href={onApple ? appleMusicDeepLink(track.href) : track.href}
              target={onApple ? undefined : '_blank'}
              rel="noreferrer noopener"
              aria-label={`Open ${title}${artist ? ` by ${artist}` : ''} on Apple Music${explicit ? ' (explicit)' : ''}`}
              tabIndex={hidden ? -1 : 0}
            >
              {artInner}
            </a>
          ) : (
            artInner
          )}
          {preview && (
            <button
              type="button"
              className="playlist__play"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                togglePreview(id, preview);
              }}
              aria-label={
                isPlaying
                  ? `Pause ${title} preview`
                  : `Play ${title} preview`
              }
              tabIndex={hidden ? -1 : 0}
            >
              <span aria-hidden="true" className="material-symbols-outlined">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
          )}
        </div>
        <div className="playlist__meta">
          {title && (
            <h4 className="playlist__title">
              {title}
              {explicit && (
                <span className="playlist__explicit" aria-label="Explicit">
                  E
                </span>
              )}
            </h4>
          )}
          {artist && <p className="playlist__artist">{artist}</p>}
          {album && <p className="playlist__album">{album}</p>}
        </div>
      </li>
    );
  };

  const ctaVisible = ctaPhase === 'play' || ctaPhase === 'controls';

  return (
    <div
      ref={rootRef}
      className={`playlist${ctaVisible ? ' is-cta' : ''}`}
      role="region"
      aria-label="Playlist"
      tabIndex={0}
      onPointerEnter={pauseMotion}
      onPointerLeave={resumeMotion}
      onFocus={pauseMotion}
      onBlur={resumeMotion}
    >
      <ul
        ref={listRef}
        className={`playlist__list${ctaVisible ? ' is-blurred' : ''}`}
      >
        {tracks.map((t, i) => renderTrack(t, `a-${i}`))}
        {tracks.map((t, i) =>
          renderTrack(t, `b-${i}`, { 'aria-hidden': true })
        )}
        {tracks.map((t, i) =>
          renderTrack(t, `c-${i}`, { 'aria-hidden': true })
        )}
      </ul>
      {ctaVisible && (
        <div
          key={ctaPhase}
          className={`playlist__cta playlist__cta--${ctaPhase}`}
          aria-hidden="true"
        >
          {ctaPhase === 'play' ? (
            <>
              <span className="playlist__cta-icon material-symbols-outlined">
                play_arrow
              </span>
              <span className="playlist__cta-text">press play to preview</span>
            </>
          ) : (
            <>
              <span className="playlist__cta-arrow material-symbols-outlined">
                arrow_back
              </span>
              <span className="playlist__cta-text">scroll or drag to move</span>
              <span className="playlist__cta-arrow material-symbols-outlined">
                arrow_forward
              </span>
            </>
          )}
        </div>
      )}
      <audio ref={audioRef} preload="none" />
    </div>
  );
}

/**
 * Renders a single About section. Dispatches on `section.type`.
 * Add a new type by adding a new case. Unknown types fall through to prose.
 */
function renderSection(section) {
  switch (section.type) {
    case 'list':
      return (
        <ul className="about-list">
          {section.items.map((item, i) => (
            <li key={i} className="about-list__item">
              <span className="about-list__marker" aria-hidden="true">
                //
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case 'stack':
      return (
        <div className="about-stack">
          {section.groups.map((g) => (
            <div key={g.title} className="about-stack__group">
              <h4 className="about-stack__title">{g.title}</h4>
              <ul className="skill-list">
                {g.items.map((s) => (
                  <li key={s} className="skill-list__item">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );

    case 'nowlist':
      return (
        <dl className="about-now">
          {section.items.map((row, i) => (
            <div key={i} className="about-now__row">
              <dt className="about-now__label">{row.label}</dt>
              <dd className="about-now__value">{row.value}</dd>
            </div>
          ))}
        </dl>
      );

    case 'quote':
      return (
        <blockquote className="about-quote">
          <p className="about-quote__body">{section.body}</p>
          {section.attribution && (
            <footer className="about-quote__attr">— {section.attribution}</footer>
          )}
        </blockquote>
      );

    case 'bookshelf': {
      const statusLabel = {
        reading: 'Reading',
        read: 'Read',
        want: 'Want to read'
      };
      return (
        <div
          className="bookshelf"
          role="region"
          aria-label="Bookshelf"
          tabIndex={0}
        >
          <ul className="bookshelf__list">
            {section.books.map((book, i) => {
              const coverSrc = book.slug ? bookCovers[book.slug] : null;
              return (
              <li key={i} className="bookshelf__item">
                <div className={`bookshelf__cover bookshelf__cover--${book.status}`}>
                  {coverSrc ? (
                    <img src={coverSrc} alt={book.coverAlt || book.title} />
                  ) : (
                    <span className="bookshelf__cover-fallback" aria-hidden="true">
                      {book.title
                        .split(' ')
                        .slice(0, 3)
                        .map((w) => w[0])
                        .join('')}
                    </span>
                  )}
                </div>
                <div className="bookshelf__meta">
                  <h4 className="bookshelf__title">{book.title}</h4>
                  <p className="bookshelf__author">{book.author}</p>
                  <span
                    className={`bookshelf__status bookshelf__status--${book.status}`}
                  >
                    {statusLabel[book.status] || book.status}
                  </span>
                </div>
              </li>
              );
            })}
          </ul>
        </div>
      );
    }

    case 'playlist':
      return <Playlist section={section} />;

    case 'prose':
    default: {
      const paragraphs = Array.isArray(section.body)
        ? section.body
        : [section.body];
      return (
        <div className="about-prose">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      );
    }
  }
}

export default function About() {
  const intro = Array.isArray(about.intro) ? about.intro : [about.intro];

  return (
    <div className="page about-page">
      <h2 className="section__label">Kernel / About</h2>
      <h1>{site.headline}</h1>
      <div className="about-intro">
        {intro.map((p, i) => (
          <p key={i} className="hero__tagline">
            {p}
          </p>
        ))}
      </div>

      {about.sections.map((section) => (
        <section key={section.id} className="section about-section">
          <h2 className="section__label">{section.label}</h2>
          {section.title && (
            <h3 className="about-section__title">{section.title}</h3>
          )}
          {renderSection(section)}
        </section>
      ))}
    </div>
  );
}
