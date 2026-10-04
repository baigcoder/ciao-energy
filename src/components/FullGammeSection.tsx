import React from 'react';
import { FLAVORS } from '../data/flavors';

interface FullGammeSectionProps {
  isActive: boolean;
}

/**
 * The lineup: every can in one rising diagonal row (WebGL). Visually there is no
 * copy; the list below names the range for assistive tech.
 */
export const FullGammeSection: React.FC<FullGammeSectionProps> = ({ isActive }) => (
  <section id="full-gamme" className={`home-section lineup ${isActive ? 'is-active' : ''}`} aria-labelledby="lineup-title">
    <h2 id="lineup-title" className="sr-only">The range</h2>
    <ul className="sr-only">
      {FLAVORS.map((flavor) => (
        <li key={flavor.id}>{flavor.name}</li>
      ))}
    </ul>
  </section>
);
