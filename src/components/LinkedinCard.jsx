import { site } from '../data/site.js';

const LINKEDIN_HREF = site.socials.find((s) => s.label === 'LinkedIn').href;

export default function LinkedinCard({ compact = false }) {
  return (
    <a
      className={`section linkedin-card${compact ? ' linkedin-card--compact' : ''}`}
      href={LINKEDIN_HREF}
      target="_blank"
      rel="noreferrer"
      aria-label={`${site.name} on LinkedIn`}
    >
      <span aria-hidden="true" className="linkedin-card__icon">
        <svg viewBox="0 0 24 24" role="img" focusable="false">
          <path
            fill="currentColor"
            d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.37 4.28 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z"
          />
        </svg>
      </span>
      <div className="linkedin-card__body">
        <span className="linkedin-card__label">LinkedIn</span>
        <span className="linkedin-card__name">{site.name}</span>
      </div>
      <span className="linkedin-card__cta">
        View profile
        <span aria-hidden="true" className="material-symbols-outlined">
          arrow_outward
        </span>
      </span>
    </a>
  );
}
