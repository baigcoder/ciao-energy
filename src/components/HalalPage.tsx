import React from 'react';
import { HALAL_PAGE, BRAND, isTodo } from '../data/brand';
import { BenefitIcon } from './BenefitIcons';
import { HalalSeal } from './HalalSeal';

/** Halal and Zamzam story. Unconfirmed facts render as clearly marked placeholders. */
export const HalalPage: React.FC = () => {
  const block = (title: string, value: string, icon?: React.ReactNode) => (
    <section className="story-block">
      <h2 className="story-block__title display">{icon}{title}</h2>
      {isTodo(value) ? (
        <p className="story-block__placeholder">To be confirmed. Verified details appear here once they are supplied.</p>
      ) : (
        <p className="story-block__text">{value}</p>
      )}
    </section>
  );

  return (
    <article className="story is-active" aria-labelledby="story-title">
      <div className="story__seal"><HalalSeal /></div>
      <h1 id="story-title" className="display story__title">{HALAL_PAGE.title}</h1>
      <p className="story__lead">{HALAL_PAGE.intro}</p>
      <div className="story__grid">
        <section className="story-block story-block--certificate">
          <h2 className="story-block__title display"><span className="trust-badge__icon" aria-hidden="true">حلال</span>Halal certificate</h2>
          <div className="certificate-slot">
            <span>Certificate image: to be confirmed</span>
          </div>
          {isTodo(HALAL_PAGE.certificate) && <p className="story-block__placeholder">Certifier name and licence number: to be confirmed.</p>}
        </section>
        {block('Zamzam water', HALAL_PAGE.zamzam, <BenefitIcon type="zamzam" size={28} />)}
        {block('How it’s made', HALAL_PAGE.process)}
      </div>
      <p className="story__origin">{BRAND.company.name}. {BRAND.origin}.</p>
    </article>
  );
};
