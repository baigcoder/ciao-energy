import React, { useId, useState } from 'react';
import { BRAND, NEWSLETTER_OFFER, isTodo } from '../data/brand';
import { ButtonLabel } from './ButtonLabel';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter sign-up. There is no mailing backend in this repo, so
 * submission is simulated; the form still exposes real validation and states.
 */
export const NewsletterFooter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const inputId = useId();
  const messageId = useId();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setStatus('error');
      setError('Enter an email address like name@example.com.');
      return;
    }
    setStatus('submitting');
    window.setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 800);
  };

  return (
    <section id="newsletter" className="home-section newsletter" aria-labelledby="newsletter-title">
      <div className="newsletter__card">
        <h2 id="newsletter-title" className="newsletter__title display">Join us</h2>
        <p className="newsletter__intro">
          Join the pack and be the first to hear about Grizzly Energy news and new flavors.
        </p>
        <p className="newsletter__offer">
          <span className="newsletter__offer-badge">Subscriber offer</span>
          {isTodo(NEWSLETTER_OFFER) ? 'Details coming soon.' : NEWSLETTER_OFFER}
        </p>

        <form className="newsletter__form" onSubmit={handleSubmit} noValidate>
          <div className={`field ${status === 'error' ? 'is-invalid' : ''}`}>
            <input
              id={inputId}
              className="field__input"
              type="email"
              autoComplete="email"
              placeholder=" "
              value={email}
              disabled={status === 'submitting'}
              aria-invalid={status === 'error'}
              aria-describedby={messageId}
              onChange={(event) => {
                setEmail(event.target.value);
                if (status === 'error' || status === 'success') setStatus('idle');
              }}
            />
            <label htmlFor={inputId} className="field__label">Your email address</label>
          </div>

          <button type="submit" className="button-primary button-primary--block" disabled={status === 'submitting'} aria-busy={status === 'submitting'}>
            <ButtonLabel>{status === 'submitting' ? 'Subscribing…' : 'Subscribe'}</ButtonLabel>
          </button>

          <p id={messageId} className={`newsletter__message ${status === 'error' ? 'is-error' : ''}`} role={status === 'error' ? 'alert' : 'status'}>
            {status === 'error' && error}
            {status === 'success' && 'You’re subscribed. Watch your inbox for the next drop.'}
          </p>

          <p className="newsletter__legal">
            By subscribing you accept our <a href="#privacy">privacy policy</a>.
          </p>
        </form>
      </div>
    </section>
  );
};

/** Page footer (contentinfo): copyright and legal / social links. */
export const SiteFooter: React.FC = () => (
  <footer id="site-footer" className="site-footer">
    <p className="site-footer__copyright">© 2026 {BRAND.name}. {BRAND.company.name}, {BRAND.origin.replace('Made in ', '')}.</p>
    <nav className="site-footer__bar" aria-label="Footer">
      {!isTodo(BRAND.social.tiktok) && <a className="button-outline" href={BRAND.social.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a>}
      <a className="site-footer__link" href={`https://${BRAND.company.website}`} target="_blank" rel="noopener noreferrer">{BRAND.company.website}</a>
      <a className="site-footer__link" href="#legal">Legal notice</a>
      <a className="site-footer__link" href="#terms">Terms</a>
      <a className="site-footer__link" href="#privacy">Privacy policy</a>
      {!isTodo(BRAND.social.instagram) && <a className="button-outline" href={BRAND.social.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
    </nav>
  </footer>
);
