import React from 'react';
import { FLAVORS } from '../data/flavors';
import { getProductThumbUrl } from '../data/products';

interface FallbackStageProps {
  activeIndex: number;
  /** False on plain pages that skip the 3D scene on phones: the night backdrop only, no packshot. */
  showCan?: boolean;
}

/** Static packshot shown when WebGL is unavailable; the page stays fully usable. */
export const FallbackStage: React.FC<FallbackStageProps> = ({ activeIndex, showCan = true }) => {
  const flavor = FLAVORS[activeIndex % FLAVORS.length];
  return (
    <div className="fallback-stage" aria-hidden="true">
      <span className="fallback-stage__night" />
      {showCan && <img src={getProductThumbUrl({ slug: flavor.id })} alt="" />}
    </div>
  );
};
