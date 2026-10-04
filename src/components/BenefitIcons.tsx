import React from 'react';
import type { BenefitIconType } from '../types';

interface BenefitIconProps {
  type: BenefitIconType;
  size?: number;
  className?: string;
}

/** Glyphs for the four label benefits (same set as the can's right panel). */
export const BenefitIcon: React.FC<BenefitIconProps> = ({ type, size = 24, className = '' }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', className, 'aria-hidden': true } as const;
  switch (type) {
    case 'caffeine':
      return (
        <svg {...common} fill="currentColor">
          <path d="M13.5 2 5 13.5h5.5L9 22l9.5-12.5H13L14.5 2z" />
        </svg>
      );
    case 'electrolytes':
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 2.5S5.5 10.2 5.5 15a6.5 6.5 0 0 0 13 0C18.5 10.2 12 2.5 12 2.5z" />
        </svg>
      );
    case 'vitamins':
      return (
        <svg {...common} fill="currentColor">
          <path d="M7 3.5h6.2c3 0 4.8 1.5 4.8 3.9 0 1.6-.9 2.7-2.3 3.2 1.9.4 3.1 1.8 3.1 3.7 0 2.7-2.1 4.2-5.4 4.2H7zm3.6 3v3.6h2.2c1.2 0 1.9-.7 1.9-1.8s-.7-1.8-1.9-1.8zm0 6.4v4h2.6c1.4 0 2.2-.7 2.2-2s-.8-2-2.2-2z" />
        </svg>
      );
    case 'zamzam':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.5S5.5 10.2 5.5 15a6.5 6.5 0 0 0 13 0C18.5 10.2 12 2.5 12 2.5z" />
          <path d="M8.5 15.5c1.2-1.2 2.3-1.2 3.5 0s2.3 1.2 3.5 0" />
        </svg>
      );
  }
};
