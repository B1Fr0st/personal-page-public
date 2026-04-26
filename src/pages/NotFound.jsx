import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page">
      <h2 className="section__label">0x404 / SEGFAULT</h2>
      <h1>Page not found.</h1>
      <p className="hero__tagline" style={{ marginBottom: '2rem' }}>
        The address you requested is paged out right now.{' '}
        <Link to="/" style={{ color: 'var(--color-accent-ink)' }}>
          Return to home
        </Link>
        .
      </p>
    </div>
  );
}
