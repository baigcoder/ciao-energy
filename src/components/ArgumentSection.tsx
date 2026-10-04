import React from 'react';
import { BRAND } from '../data/brand';

interface ArgumentSectionProps {
  isActive: boolean;
}

/**
 * The tagline moment. The visible giant type and cloud field live in the fixed
 * StageBackdrop (behind the can); this section carries the accessible heading
 * and claim, and holds the scroll position for the scene.
 */
export const ArgumentSection: React.FC<ArgumentSectionProps> = ({ isActive }) => (
  <section id="argument" className={`home-section argument ${isActive ? 'is-active' : ''}`} aria-labelledby="argument-title">
    <h2 id="argument-title" className="sr-only">{BRAND.tagline}</h2>
    <p className="sr-only">
      Natural caffeine, natural electrolytes, B vitamins and added Zamzam water.
    </p>
  </section>
);
