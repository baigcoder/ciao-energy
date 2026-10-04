import React from 'react';
import { PRIVACY } from '../data/privacy';

/** Privacy: what the site keeps (only in this browser) and what it does not collect. */
export const PrivacyPage: React.FC = () => (
  <article className="story is-active" aria-labelledby="privacy-title">
    <h1 id="privacy-title" className="display story__title">{PRIVACY.title}</h1>
    <p className="story__lead">{PRIVACY.intro}</p>
    <div className="story__grid">
      {PRIVACY.sections.map((section) => (
        <section key={section.heading} className="story-block">
          <h2 className="story-block__title display">{section.heading}</h2>
          <ul className="story-block__list">
            {section.items.map((item) => (
              <li key={item} className="story-block__text">{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
    <p className="story__origin">{PRIVACY.note}</p>
  </article>
);
