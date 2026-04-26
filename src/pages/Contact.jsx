import ContactForm from '../components/ContactForm.jsx';
import GithubCard from '../components/GithubCard.jsx';
import LinkedinCard from '../components/LinkedinCard.jsx';
import { site } from '../data/site.js';

export default function Contact() {
  return (
    <div className="page">
      <h2 className="section__label">Contact</h2>
      <h1>Reach Out.</h1>
      <p className="hero__tagline" style={{ marginBottom: '2rem' }}>
        Reach me directly at{' '}
        <a href={`mailto:${site.email}`} style={{ color: 'var(--color-accent-ink)' }}>
          {site.email}
        </a>{' '}
        or send a message below.<br />I try to respond to messages within 48 hours.
      </p>
      <ContactForm />
      <LinkedinCard compact />
      <GithubCard />
    </div>
  );
}
