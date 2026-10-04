import React from 'react';
import { FLAVORS } from '../data/flavors';
import { useLocale } from '../locale';
import { ButtonLabel } from './ButtonLabel';

interface FullGammeSectionProps {
  isActive: boolean;
  onShop: () => void;
}

/**
 * The finale: all six cans on a mountain-shaped lineup (WebGL), each lit in its own colour, with one
 * clear button to shop. The list names the range for assistive tech and crawlers.
 */
export const FullGammeSection: React.FC<FullGammeSectionProps> = ({ isActive, onShop }) => {
  const { t } = useLocale();
  return (
  <section id="full-gamme" className={`home-section lineup ${isActive ? 'is-active' : ''}`} aria-labelledby="lineup-title">
    <h2 id="lineup-title" className="sr-only">The range</h2>
    <ul className="sr-only">
      {FLAVORS.map((flavor) => (
        <li key={flavor.id}>{flavor.name}</li>
      ))}
    </ul>
    <div className="lineup__cta">
      <p className="lineup__claims">{t('claims')}</p>
      <a
        className="button-primary"
        href="/shop"
        onClick={(event) => {
          event.preventDefault();
          onShop();
        }}
      >
        <ButtonLabel>{t('shopTheRange')}</ButtonLabel>
      </a>
    </div>
  </section>
  );
};
