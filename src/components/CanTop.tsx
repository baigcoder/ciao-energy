import React from 'react';
import { getProductBySlug } from '../data/products';

interface CanTopProps {
  slug: string;
  size?: 'small' | 'regular';
}

/**
 * A can seen from above (lid, rim and pull tab) ringed in the flavor accent.
 * Drawn in SVG so it stays crisp at any size; used for pack slots and mixed lines.
 */
export const CanTop: React.FC<CanTopProps> = ({ slug, size = 'regular' }) => {
  const product = getProductBySlug(slug);
  return (
    <svg className={`can-top can-top--${size}`} viewBox="0 0 100 100" data-accent={product?.accentToken} aria-hidden="true">
      <circle cx="50" cy="50" r="48" className="can-top__ring" />
      <circle cx="50" cy="50" r="41" className="can-top__rim" />
      <circle cx="50" cy="50" r="35" className="can-top__lid" />
      <ellipse cx="50" cy="40" rx="11" ry="7" className="can-top__tab" />
      <rect x="45" y="44" width="10" height="16" rx="5" className="can-top__tab" />
      <circle cx="50" cy="66" r="7" className="can-top__opening" />
    </svg>
  );
};
