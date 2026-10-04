import React from 'react';
import { BRAND } from '../data/brand';

interface BrandMarkProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

/**
 * Grizzly Energy wordmark set in the display face (no logo file exists yet):
 * "GRIZZLY" in silver over "ENERGY" in the current flavor accent.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({ orientation = 'horizontal', className = '' }) => (
  <span className={`brand-mark brand-mark--${orientation} ${className}`} aria-hidden="true">
    <span className="brand-mark__top">{BRAND.wordmark[0]}</span>
    <span className="brand-mark__bottom">{BRAND.wordmark[1]}</span>
  </span>
);
