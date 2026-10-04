import React from 'react';
import { FLAVORS } from '../data/flavors';
import { getProductThumbUrl } from '../data/products';

interface FallbackStageProps {
  activeIndex: number;
}

/** Static packshot shown when WebGL is unavailable; the page stays fully usable. */
export const FallbackStage: React.FC<FallbackStageProps> = ({ activeIndex }) => {
  const flavor = FLAVORS[activeIndex % FLAVORS.length];
  return (
    <div className="fallback-stage" aria-hidden="true">
      <span className="fallback-stage__night" />
      <img src={getProductThumbUrl({ slug: flavor.id })} alt="" />
    </div>
  );
};
