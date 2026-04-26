import { useEffect, useRef, useState } from 'react';
import { site } from '../data/site.js';

const WEATHER_DESCRIPTIONS = {
  0: 'clear',
  1: 'mostly clear',
  2: 'partly cloudy',
  3: 'overcast',
  45: 'foggy',
  48: 'rime fog',
  51: 'light drizzle',
  53: 'drizzle',
  55: 'heavy drizzle',
  56: 'freezing drizzle',
  57: 'freezing drizzle',
  61: 'light rain',
  63: 'rain',
  65: 'heavy rain',
  66: 'freezing rain',
  67: 'freezing rain',
  71: 'light snow',
  73: 'snow',
  75: 'heavy snow',
  77: 'snow grains',
  80: 'rain showers',
  81: 'rain showers',
  82: 'violent rain',
  85: 'snow showers',
  86: 'snow showers',
  95: 'thunderstorm',
  96: 'thunderstorm · hail',
  99: 'thunderstorm · hail'
};

function cToF(c) {
  return Math.round((c * 9) / 5 + 32);
}

// If the WMO code isn't in our table, find the nearest known code in the
// same tens-bucket (e.g. 62 → 61/63/65); otherwise fall back to "clear".
function describeWeather(code) {
  if (code == null) return WEATHER_DESCRIPTIONS[0];
  if (WEATHER_DESCRIPTIONS[code]) return WEATHER_DESCRIPTIONS[code];
  const bucket = Math.floor(code / 10) * 10;
  let best = null;
  let bestDist = Infinity;
  for (const key of Object.keys(WEATHER_DESCRIPTIONS)) {
    const k = Number(key);
    if (Math.floor(k / 10) * 10 !== bucket) continue;
    const d = Math.abs(k - code);
    if (d < bestDist) {
      bestDist = d;
      best = k;
    }
  }
  return best != null ? WEATHER_DESCRIPTIONS[best] : WEATHER_DESCRIPTIONS[0];
}

// White at 72°F, shifting toward cool blue below and warm orange above,
// capping at 30°F (cold) and 95°F (hot).
function tempColor(f) {
  if (f == null || Number.isNaN(f)) return null;
  const clamped = Math.max(30, Math.min(95, f));
  if (clamped <= 72) {
    const t = (72 - clamped) / (72 - 30); // 0 at 72, 1 at 30
    const r = Math.round(255 + (140 - 255) * t);
    const g = Math.round(255 + (190 - 255) * t);
    const b = Math.round(255 + (255 - 255) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
  const t = (clamped - 72) / (95 - 72); // 0 at 72, 1 at 95
  const r = Math.round(255 + (255 - 255) * t);
  const g = Math.round(255 + (170 - 255) * t);
  const b = Math.round(255 + (130 - 255) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function formatTime(tz) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(new Date());
  } catch {
    return new Date().toLocaleTimeString();
  }
}

function hourFraction(tz) {
  if (typeof window !== 'undefined' && typeof window.__statusHour === 'number') {
    return window.__statusHour;
  }
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(new Date());
    let h = 0, m = 0;
    for (const p of parts) {
      if (p.type === 'hour') h = parseInt(p.value, 10) % 24;
      else if (p.type === 'minute') m = parseInt(p.value, 10);
    }
    return h + m / 60;
  } catch {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  }
}

const SKY_COLS = 31;
const SKY_ROWS = 5;

// Seeded pseudo-random so stars don't reshuffle every second tick.
function seededRand(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 10000) / 10000;
  };
}

// Categorize a WMO weather code into a visual style.
function weatherStyle(code) {
  if (code == null) return 'clear';
  if (code === 0 || code === 1) return 'clear';
  if (code === 2) return 'partly';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'fog';
  if ([51, 53, 55, 56, 57, 61, 80].includes(code)) return 'light-rain';
  if ([63, 65, 66, 67, 81, 82].includes(code)) return 'rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
  if ([95, 96, 99].includes(code)) return 'storm';
  return 'clear';
}

function renderSky(hour, code) {
  const style = weatherStyle(code);
  const isDay = hour >= 6 && hour < 20;
  const isTwilight =
    (hour >= 5 && hour < 7) || (hour >= 19 && hour < 21);

  // Heavy-cover weather hides the sun/moon entirely.
  const bodyHidden = ['overcast', 'fog', 'rain', 'snow', 'storm'].includes(style);
  // Dimmed = visible but filtered.
  const bodyDim = style === 'partly' || style === 'light-rain';

  // Map hour to x-position along the arc.
  let arc = 0;
  if (isDay) {
    arc = (hour - 6) / 14;
  } else {
    const h = hour >= 20 ? hour - 20 : hour + 4;
    arc = h / 10;
  }
  arc = Math.max(0, Math.min(1, arc));
  const arcHeight = Math.sin(arc * Math.PI);

  const bodyCol = Math.max(0, Math.min(SKY_COLS - 2, Math.round(arc * (SKY_COLS - 2))));
  const bodyRow = Math.max(0, Math.min(SKY_ROWS - 2, Math.round((SKY_ROWS - 2) - arcHeight * (SKY_ROWS - 2))));

  // Stable seed: rotates every 15 min for ambient noise,
  // plus a per-second seed for anything that should "animate".
  const seed = Math.floor(hour * 4);
  const rand = seededRand(seed);
  const animSeed = Math.floor(Date.now() / 500); // half-second ticks
  const animRand = seededRand(animSeed * 7919 + seed);

  // Lightning flash: random chance each tick during storms.
  const lightning = style === 'storm' && animRand() < 0.08;

  const rows = [];

  // Falling precipitation advances one row every 5 seconds.
  const rainDropRow = new Array(SKY_COLS).fill(-1);
  const snowDropRow = new Array(SKY_COLS).fill(-1);
  const tick = Math.floor(Date.now() / 5000);

  if (style === 'rain' || style === 'light-rain' || style === 'storm') {
    const density = style === 'rain' ? 0.5 : style === 'storm' ? 0.55 : 0.25;
    const colRand = seededRand(seed + 101);
    for (let c = 0; c < SKY_COLS; c++) {
      if (colRand() < density) {
        const phase = Math.floor(colRand() * SKY_ROWS);
        rainDropRow[c] = (phase + tick) % SKY_ROWS;
      }
    }
  }
  if (style === 'snow') {
    const colRand = seededRand(seed + 202);
    for (let c = 0; c < SKY_COLS; c++) {
      if (colRand() < 0.35) {
        const phase = Math.floor(colRand() * SKY_ROWS);
        snowDropRow[c] = (phase + tick) % SKY_ROWS;
      }
    }
  }

  for (let r = 0; r < SKY_ROWS; r++) {
    const cells = [];
    for (let c = 0; c < SKY_COLS; c++) {
      // Sun/moon occupies a 2x2 block.
      const inBody =
        (r === bodyRow || r === bodyRow + 1) &&
        (c === bodyCol || c === bodyCol + 1);
      if (inBody && !bodyHidden) {
        cells.push({
          ch: '#',
          kind: isDay ? (bodyDim ? 'sun-dim' : 'sun') : bodyDim ? 'moon-dim' : 'moon'
        });
        continue;
      }

      // Weather overlays take precedence over ambient clouds/stars.
      if (style === 'rain' || style === 'light-rain' || style === 'storm') {
        if (rainDropRow[c] === r) {
          cells.push({
            ch: style === 'light-rain' ? '/' : '|',
            kind: 'rain'
          });
          continue;
        }
      }
      if (style === 'storm') {
        if (lightning && r === 0 && c % 7 === Math.floor(animRand() * 7)) {
          cells.push({ ch: '⌁', kind: 'lightning' });
          continue;
        }
      }
      if (style === 'snow' && snowDropRow[c] === r) {
        cells.push({ ch: (r + c) % 2 === 0 ? '*' : '.', kind: 'snow' });
        continue;
      }
      if (style === 'fog') {
        // Dense horizontal haze, thicker at bottom.
        const fogChance = r === SKY_ROWS - 1 ? 0.55 : r >= 2 ? 0.3 : 0.12;
        if (rand() < fogChance) {
          cells.push({ ch: r >= 2 ? '░' : '-', kind: 'fog' });
          continue;
        }
      }

      // Ambient (time-of-day) layer.
      if (!isDay) {
        // Night: stars, suppressed under heavy cloud/overcast.
        const dimmedStars = style === 'overcast' || style === 'storm';
        const starChance = dimmedStars ? 0 : r < 2 ? 0.08 : 0.03;
        if (starChance > 0 && rand() < starChance) {
          cells.push({ ch: rand() < 0.5 ? '·' : '*', kind: 'star' });
          continue;
        }
      }

      // Cloud density varies by weather.
      let cloudChance = 0;
      if (style === 'clear') cloudChance = r === 1 || r === 2 ? 0.04 : 0;
      else if (style === 'partly') cloudChance = r === 1 || r === 2 ? 0.16 : 0.04;
      else if (style === 'overcast') cloudChance = r <= 2 ? 0.5 : 0.15;
      else if (style === 'storm') cloudChance = r <= 2 ? 0.35 : 0.1;
      else if (style === 'rain' || style === 'light-rain')
        cloudChance = r <= 1 ? 0.35 : 0;
      else if (style === 'snow') cloudChance = r <= 1 ? 0.25 : 0;

      if (cloudChance > 0 && rand() < cloudChance) {
        cells.push({ ch: '~', kind: 'cloud' });
        continue;
      }

      // Twilight bottom shimmer.
      if (isTwilight && r === SKY_ROWS - 1 && c % 3 === 0 && style === 'clear') {
        cells.push({ ch: '~', kind: 'cloud' });
        continue;
      }

      cells.push({ ch: ' ', kind: 'bg' });
    }
    rows.push(cells);
  }
  return { rows, style, lightning };
}

export default function StatusPanel({ open }) {
  const loc = site.location;
  const [now, setNow] = useState(() => formatTime(loc?.timezone));
  const [weather, setWeather] = useState(null); // { tempC, code } | 'loading' | 'error'
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(formatTime(loc?.timezone)), 1000);
    return () => clearInterval(id);
  }, [open, loc?.timezone]);

  useEffect(() => {
    if (!loc) return;
    let cancelled = false;
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}` +
      `&longitude=${loc.longitude}&current=temperature_2m,weather_code` +
      `&timezone=${encodeURIComponent(loc.timezone || 'auto')}`;

    const poll = () => {
      fetch(url)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
        .then((data) => {
          if (cancelled) return;
          const cur = data?.current;
          if (!cur) {
            setWeather((prev) =>
              typeof prev === 'object' && prev ? prev : 'error'
            );
            return;
          }
          setWeather({
            tempC: cur.temperature_2m,
            code: cur.weather_code
          });
        })
        .catch(() => {
          if (cancelled) return;
          // Keep last good reading on transient errors; only surface error
          // if we never had one.
          setWeather((prev) =>
            typeof prev === 'object' && prev ? prev : 'error'
          );
        });
    };

    if (!fetchedRef.current) {
      fetchedRef.current = true;
      setWeather('loading');
    }
    poll();
    const id = setInterval(poll, 60_000);
    // Refresh immediately when the tab becomes visible again — browsers
    // throttle setInterval in background tabs, so the cached reading can be
    // arbitrarily stale by the time the user comes back.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') poll();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loc]);

  if (!loc) return null;

  const effectiveWeather =
    typeof window !== 'undefined' && window.__statusWeather
      ? window.__statusWeather
      : weather;

  const tempF =
    typeof effectiveWeather === 'object' && effectiveWeather
      ? cToF(effectiveWeather.tempC)
      : null;
  const weatherColor = tempColor(tempF);

  const rows = [
    ['location', loc.label, null],
    ['local', now, null],
    [
      'weather',
      effectiveWeather === 'loading' || effectiveWeather == null
        ? '...'
        : effectiveWeather === 'error'
          ? 'unavailable'
          : `${tempF}°F · ${describeWeather(effectiveWeather.code)}`,
      weatherColor
    ]
  ];

  const hour = hourFraction(loc.timezone);
  const activeCode =
    typeof effectiveWeather === 'object' && effectiveWeather
      ? effectiveWeather.code
      : null;
  const sky = renderSky(hour, activeCode);
  const isDay = hour >= 6 && hour < 20;

  return (
    <div className="status-panel">
      <div className="status-panel__prompt">
        <span className="status-panel__path">~</span>
        <span className="status-panel__sep">$</span>
        <span className="status-panel__cmd">status</span>
      </div>
      <dl className="status-panel__rows">
        {rows.map(([label, value, color]) => (
          <div key={label} className="status-panel__row">
            <dt className="status-panel__label">{label}</dt>
            <dd
              className="status-panel__value"
              style={color ? { color } : undefined}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <pre
        className={
          `status-panel__sky` +
          ` status-panel__sky--${isDay ? 'day' : 'night'}` +
          ` status-panel__sky--w-${sky.style}` +
          (sky.lightning ? ' is-flashing' : '')
        }
        aria-hidden="true"
      >
        {sky.rows.map((row, r) => (
          <div key={r} className="status-panel__sky-row">
            {row.map((cell, c) => (
              <span
                key={c}
                className={`status-panel__sky-cell status-panel__sky-cell--${cell.kind}`}
              >
                {cell.ch}
              </span>
            ))}
          </div>
        ))}
      </pre>
    </div>
  );
}
