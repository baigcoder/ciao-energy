import React from 'react';
import { BENEFITS } from '../data/benefits';
import { publicText } from '../data/brand';
import { audioManager } from '../audio/audioManager';
import { BenefitIcon } from './BenefitIcons';
import { RevealText } from './RevealText';
import { HALAL_WORD_PATH, HALAL_WORD_VIEWBOX } from './halalMark';
import { SEAL_POSITION } from '../webgl/moments/zamzamPool';

interface BenefitsSectionProps {
  activeChapter: number;
  showRail: boolean;
  onNavigateChapter: (chapterIndex: number) => void;
}

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
 * ticks, then the Arabic word. Decorative (the claim is in the chapter copy and caption); it sits
 * on the centre of the ripple drawn in WebGL (see webgl/moments/zamzamPool.ts).
 */
const HalalSeal: React.FC = () => (
  <div
    className="halal-seal"
    style={
      {
        '--seal-x': `${SEAL_POSITION.desktop.x * 100}%`,
        '--seal-y': `${SEAL_POSITION.desktop.y * 100}%`,
        '--seal-x-narrow': `${SEAL_POSITION.mobile.x * 100}%`,
        '--seal-y-narrow': `${SEAL_POSITION.mobile.y * 100}%`,
      } as React.CSSProperties
    }
  >
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

/**
 * Four benefit chapters, in label order. Each shows a spec tag, the benefit title
 * and copy; the WebGL can turns dark and lights only the matching block of its
 * label's right panel. The icon rail on the right navigates between chapters.
 */
export const BenefitsSection: React.FC<BenefitsSectionProps> = ({ activeChapter, showRail, onNavigateChapter }) => (
  <>
    <nav className={`benefit-rail ${showRail ? 'is-visible' : ''}`} aria-label="Benefits" aria-hidden={!showRail}>
      <ol className="benefit-rail__list">
        {BENEFITS.map((benefit, index) => (
          <li key={benefit.id}>
            <button
              type="button"
              className={`benefit-rail__button ${activeChapter === index ? 'is-active' : ''}`}
              tabIndex={showRail ? 0 : -1}
              onClick={() => {
                audioManager.play('benefits');
                onNavigateChapter(index);
              }}
              aria-label={benefit.title}
              aria-current={activeChapter === index ? 'step' : undefined}
            >
              <BenefitIcon type={benefit.iconType} />
            </button>
          </li>
        ))}
      </ol>
    </nav>

    {BENEFITS.map((benefit, index) => (
      <section
        key={benefit.id}
        id={benefit.id}
        className={`home-section benefit ${activeChapter === index ? 'is-active' : ''}`}
        aria-labelledby={`${benefit.id}-title`}
      >
        <div className="section-copy">
          {/* The label's hexagon badge, drawn in when the chapter becomes active. */}
          <span className="hex-emblem" aria-hidden="true">
            <svg className="hex-emblem__frame" viewBox="0 0 100 100">
              <polygon className="hex-emblem__outline" points="50,4 90,27 90,73 50,96 10,73 10,27" pathLength={1} />
              <polygon className="hex-emblem__inner" points="50,14 81,32 81,68 50,86 19,68 19,32" pathLength={1} />
            </svg>
            <BenefitIcon type={benefit.iconType} size={34} className="hex-emblem__icon" />
          </span>
          <p className="replaced-tag">
            <span className="replaced-tag__box" aria-hidden="true">
              <BenefitIcon type={benefit.iconType} size={14} />
            </span>
            <span className="replaced-tag__label">{publicText(benefit.spec, 'Source to be confirmed')}</span>
          </p>
          <RevealText
            id={`${benefit.id}-title`}
            className="section-copy__title display"
            lines={benefit.titleLine2 ? [benefit.titleLine1, benefit.titleLine2] : [benefit.titleLine1]}
          />
          <p className="section-copy__text">{publicText(benefit.description)}</p>
        </div>
        {benefit.iconType === 'zamzam' && <HalalSeal />}
      </section>
    ))}
  </>
);
