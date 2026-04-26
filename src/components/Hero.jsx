import { Link } from 'react-router-dom';
import { site } from '../data/site.js';

export default function Hero() {
  return (
    <section className="hero">
      <h1 className="hero__title">{site.headline}</h1>
      <p className="hero__tagline">{site.tagline}</p>
      {/* <div className="hero__ctas">
        <Link to="/projects" className="btn btn--ghost btn--sm">
          View Projects
        </Link>
        <a href={site.resumeHref} className="btn btn--ghost btn--sm">
          View CV
        </a>
      </div> */}
      <div className="hero__rule">
        <div className="hero__rule-line" />
        <span className="hero__rule-tag">0x00_INIT</span>
      </div>
    </section>
  );
}
