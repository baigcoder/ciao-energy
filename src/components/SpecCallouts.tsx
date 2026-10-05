import React, { useEffect, useRef } from 'react';
import type { SceneManager } from '../webgl/sceneManager';
import { BENEFITS } from '../data/benefits';
import { BRAND, GRIZZLY_BADGES, publicText } from '../data/brand';

interface SpecCalloutsProps {
  visible: boolean;
  sceneRef: React.MutableRefObject<SceneManager | null>;
  onNavigateChapter: (chapterIndex: number) => void;
}

interface Spec {
  title: string;
  detail: string;
  /** Height along the can's axis (local units: +1.94 lid edge, -1.94 base edge). */
  y: number;
  chapter?: number;
}

/** Every spec from the brand data (confirmed facts only), top of the can to the base. */
const SPECS: Spec[] = [
  ...BENEFITS.map((benefit, index) => ({
    title: benefit.title,
    // the Zamzam spec line only repeats its title; the chapter copy says it is in every can
    detail: benefit.iconType === 'zamzam' ? 'In every can' : publicText(benefit.spec),
    y: 1.5 - index * 0.6,
    chapter: index,
  })),
  { title: GRIZZLY_BADGES.slice(1).join(' · '), detail: 'On the label', y: -0.9 },
  { title: `${BRAND.volume} · ${BRAND.origin}`, detail: BRAND.productType, y: -1.5 },
];

/**
 * Spec callouts. In the flavor chapter, where the whole can floats, every spec fans in beside it, one by one, each
 * with a leader line to a point on the can's silhouette. They ride the can as it bobs, leans and turns: positions are
 * projected from the 3D scene each frame and written straight to the DOM (no React render per frame). The benefit
 * specs jump to their chapter.
 *
 * Decorative duplicates of facts that are real text elsewhere on the page, so the layer is aria-hidden and its
 * buttons stay out of the tab order. Desktop only (phones have no room beside the can); skipped without WebGL.
 */
export const SpecCallouts: React.FC<SpecCalloutsProps> = ({ visible, sceneRef, onNavigateChapter }) => {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!visible || !window.matchMedia('(min-width: 1024px)').matches) return;
    const point = { x: 0, y: 0 };
    let frame = 0;
    const tick = () => {
      const scene = sceneRef.current;
      SPECS.forEach((spec, index) => {
        const element = itemRefs.current[index];
        if (!element || !scene) return;
        const onScreen = scene.canEdgeOnScreen(spec.y, point);
        element.style.transform = `translate3d(${point.x.toFixed(1)}px, ${point.y.toFixed(1)}px, 0)`;
        element.style.visibility = onScreen ? 'visible' : 'hidden';
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, sceneRef]);

  return (
    <div className={`spec-callouts ${visible ? 'is-visible' : ''}`} aria-hidden="true">
      {SPECS.map((spec, index) => {
        const body = (
          <>
            <span className="spec-callout__text">
              <span className="spec-callout__title">{spec.title}</span>
              <span className="spec-callout__detail">{spec.detail}</span>
            </span>
            <span className="spec-callout__leader" />
            <span className="spec-callout__dot" />
          </>
        );
        return (
          <div
            key={spec.title}
            className="spec-callout"
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            style={{ '--i': index } as React.CSSProperties}
          >
            {spec.chapter !== undefined ? (
              <button type="button" tabIndex={-1} className="spec-callout__body spec-callout__body--link" onClick={() => onNavigateChapter(spec.chapter as number)}>
                {body}
              </button>
            ) : (
              <span className="spec-callout__body">{body}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
