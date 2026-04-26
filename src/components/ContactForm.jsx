import { useState } from 'react';
import { site } from '../data/site.js';

const endpoint = `https://formsubmit.co/ajax/${site.email}`;

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return;

    // Honeypot: real users leave this empty. Bots fill every field.
    const hp = e.target.elements._gotcha?.value;
    if (hp) {
      setStatus('sent');
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          _subject: `Portfolio contact from ${form.name}`,
          _template: 'table',
          _captcha: 'false'
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === 'false') {
        throw new Error(data.message || `Request failed (${res.status})`);
      }

      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong. Try emailing me directly.');
    }
  };

  if (status === 'sent') {
    return <p className="contact-form__success">&gt; transmission received.</p>;
  }

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <label className="contact-form__field">
        <span>Name</span>
        <input name="name" value={form.name} onChange={onChange} required />
      </label>
      <label className="contact-form__field">
        <span>Email</span>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={onChange}
          required
        />
      </label>
      <label className="contact-form__field">
        <span>Message</span>
        <textarea
          name="message"
          rows="4"
          value={form.message}
          onChange={onChange}
          required
        />
      </label>
      <input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
      />
      <button
        type="submit"
        className="contact-form__submit"
        disabled={status === 'sending'}
      >
        {status === 'sending' ? 'Transmitting…' : 'Transmit'}
      </button>
      {status === 'error' && (
        <p className="contact-form__error">&gt; {errorMsg}</p>
      )}
    </form>
  );
}
