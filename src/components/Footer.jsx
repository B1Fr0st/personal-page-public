import { site } from '../data/site.js';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <span className="footer__meta">
          © {new Date().getFullYear()} Built with React &amp; &hearts; 
        </span>
        <span className="footer__meta">
          <a href="https://github.com/B1Fr0st/personal-page-public" target="_blank" rel="noreferrer">
            Source
          </a>
        </span>
        <div className="footer__socials">
          {site.socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
