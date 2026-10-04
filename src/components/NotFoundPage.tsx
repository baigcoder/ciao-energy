import React from 'react';
import { useLocale } from '../locale';
import { ButtonLabel } from './ButtonLabel';

interface NotFoundPageProps {
  onNavigate: (url: string) => void;
}

/** Styled 404: the bear from the label, large and faint, behind the message. */
export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  const { t } = useLocale();
  return (
    <section className="not-found" aria-labelledby="nf-title">
      <img className="not-found__bear" src="/textures/grizzly/bear/blue-raspberry.webp" alt="" aria-hidden="true" />
      <p className="not-found__code display" aria-hidden="true">404</p>
      <h1 id="nf-title" className="display not-found__title">{t('notFoundTitle')}</h1>
      <p className="not-found__text">{t('notFoundText')}</p>
      <a className="button-primary" href="/" onClick={(event) => { event.preventDefault(); onNavigate('/'); }}>
        <ButtonLabel>{t('backHome')}</ButtonLabel>
      </a>
    </section>
  );
};
