import React from 'react';
import { HALAL_WORD_PATH, HALAL_WORD_VIEWBOX } from './halalMark';

/** 24 short tick marks around the seal, as one path. */
const SEAL_TICKS = Array.from({ length: 36 }, (_, i) => {
  const angle = (i / 36) * Math.PI * 2;
  const long = i % 3 === 0;
  const r1 = 46.5;
  const r2 = long ? 42.5 : 44.5;
  return `M${(Math.cos(angle) * r1).toFixed(2)} ${(Math.sin(angle) * r1).toFixed(2)}L${(Math.cos(angle) * r2).toFixed(2)} ${(Math.sin(angle) * r2).toFixed(2)}`;
}).join('');

const [WORD_X, WORD_Y, WORD_W, WORD_H] = HALAL_WORD_VIEWBOX.split(' ').map(Number);
const WORD_SCALE = 0.3;

/**
 * The halal seal, drawn line by line while the Zamzam chapter is active: outer ring, inner ring,
 * ticks, then the Arabic word. Decorative (the claim is in the chapter copy and caption). `inline` is the compact
 * badge under the Zamzam chapter copy (the can stands over the water on the right, see webgl/moments/zamzamPool.ts).
 */
export const HalalSeal: React.FC<{ inline?: boolean }> = ({ inline = false }) => (
  <div className={`halal-seal ${inline ? 'halal-seal--inline' : ''}`}>
    <svg className="halal-seal__art" viewBox="-60 -60 120 120" aria-hidden="true" focusable="false">
      <circle className="halal-seal__line" style={{ '--n': 0 } as React.CSSProperties} r="56" pathLength={1} />
      <circle className="halal-seal__line" style={{ '--n': 1 } as React.CSSProperties} r="50" pathLength={1} />
      <path className="halal-seal__line halal-seal__line--fine" style={{ '--n': 2 } as React.CSSProperties} d={SEAL_TICKS} pathLength={1} />
      <path
        className="halal-seal__line halal-seal__word"
        style={{ '--n': 3 } as React.CSSProperties}
        d={HALAL_WORD_PATH}
        pathLength={1}
        transform={`translate(${(-(WORD_X + WORD_W / 2) * WORD_SCALE).toFixed(2)} ${(-(WORD_Y + WORD_H / 2) * WORD_SCALE - 2).toFixed(2)}) scale(${WORD_SCALE})`}
      />
      <text className="halal-seal__latin" style={{ '--n': 4 } as React.CSSProperties} x="0" y="26" textAnchor="middle">HALAL</text>
    </svg>
    <p className="halal-seal__caption">Halal certified</p>
  </div>
);

