import { site } from '../data/site.js';

const GITHUB_USER = site.socials.find((s) => s.label === 'GitHub').href.split('github.com/')[1];

export default function GithubCard() {
  const profileHref = `https://github.com/${GITHUB_USER}`;
  const avatarSrc = `https://github.com/${GITHUB_USER}.png?size=144`;
  const chartSrc = `https://ghchart.rshah.org/4d7c0f/${GITHUB_USER}`;

  return (
    <section className="section github-card">
      <a
        className="github-card__avatar"
        href={profileHref}
        target="_blank"
        rel="noreferrer"
        aria-label={`${site.name} on GitHub`}
      >
        <img
          src={avatarSrc}
          alt={`${site.name} GitHub avatar`}
          fetchpriority="high"
        />
      </a>
      <div className="github-card__chart">
        <img
          src={chartSrc}
          alt={`${GITHUB_USER}'s GitHub contribution graph`}
          loading="lazy"
        />
      </div>
    </section>
  );
}
