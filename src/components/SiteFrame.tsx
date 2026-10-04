import React from 'react';

interface SiteFrameProps {
  scene: string;
}

const Chevron: React.FC = () => (
  <svg className="frame-chevron" viewBox="0 0 13 7" aria-hidden="true">
    <circle cx="1" cy="1" r="1" />
    <circle cx="4" cy="3" r="1" />
    <circle cx="6.5" cy="5.5" r="1" />
    <circle cx="9" cy="3" r="1" />
    <circle cx="12" cy="1" r="1" />
  </svg>
);

/**
 * Instrument framing that stays on screen across the page: inset corner brackets,
 * side ticks, the vertical "C E –" index on the left and, on the hero, the
 * pulsing scroll chevrons. Purely decorative.
 */
export const SiteFrame: React.FC<SiteFrameProps> = ({ scene }) => (
  <div className="site-frame" aria-hidden="true" data-scene={scene}>
    <span className="frame-corner frame-corner--tl" />
    <span className="frame-corner frame-corner--tr" />
    <span className="frame-corner frame-corner--bl" />
    <span className="frame-corner frame-corner--br" />
    <span className="frame-tick frame-tick--r1" />
    <span className="frame-tick frame-tick--r2" />
    <span className="frame-tick frame-tick--l1" />
    <div className="frame-index">
      <span>G</span>
      <span>E</span>
      <span>–</span>
    </div>
    <div className="frame-hint frame-hint--left">
      <Chevron />
      <Chevron />
      <Chevron />
    </div>
    <div className="frame-hint frame-hint--right">
      <Chevron />
      <Chevron />
      <Chevron />
    </div>
  </div>
);
