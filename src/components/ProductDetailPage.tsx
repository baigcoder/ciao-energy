import React, { useEffect, useId, useRef, useState } from 'react';
import {
  formatPrice,
  getProductBySlug,
  getProductThumbUrl,
  getRelatedProducts,
  PLACEHOLDER_PRICING,
  type PackOption,
} from '../data/products';
import { BENEFITS } from '../data/benefits';
import { REVIEWS, confirmed, publicText } from '../data/brand';
import { useCart } from '../store/cart';
import { audioManager } from '../audio/audioManager';
import { QuantityStepper } from './QuantityStepper';
import { RevealText } from './RevealText';
import { ButtonLabel } from './ButtonLabel';
import { BenefitIcon } from './BenefitIcons';
import { flyToBag } from './flyToBag';
import { InfoDrawer } from './InfoDrawer';
import { LimitedCountdown } from './LimitedCountdown';
import { sharePoster, type ShareOutcome } from './sharePoster';

interface ProductDetailPageProps {
  slug: string;
  onNavigate: (url: string) => void;
  onRotate: (deltaX: number, deltaY: number) => void;
  onView: (view: 'FRONT' | 'BACK') => void;
  onHighlightBenefit: (index: number) => void;
  isWebglAvailable: boolean;
}

type AddState = 'idle' | 'adding' | 'added' | 'error';

const ADD_LABEL: Record<AddState, string> = {
  idle: 'Add to bag',
  adding: 'Adding…',
  added: 'Added to bag',
  error: 'Add to bag',
};

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug, onNavigate, onRotate, onView, onHighlightBenefit, isWebglAvailable }) => {
  const product = getProductBySlug(slug);
  const { addItem, persistent } = useCart();
  const [packId, setPackId] = useState<PackOption['id']>('pack-6');
  const [quantity, setQuantity] = useState(1);
  const [addState, setAddState] = useState<AddState>('idle');
  const [message, setMessage] = useState('');
  const [view, setView] = useState<'FRONT' | 'BACK'>('FRONT');
  const [hotspot, setHotspot] = useState(-1);
  const [infoOpen, setInfoOpen] = useState(false);
  const [shareState, setShareState] = useState<ShareOutcome | 'working' | 'idle'>('idle');
  const timers = useRef<number[]>([]);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const packGroupId = useId();

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  // Reset the purchase panel and the can when switching product.
  useEffect(() => {
    setPackId('pack-6');
    setQuantity(1);
    setAddState('idle');
    setMessage('');
    setView('FRONT');
    setHotspot(-1);
    onHighlightBenefit(-1);
  }, [slug, onHighlightBenefit]);

  useEffect(() => () => onHighlightBenefit(-1), [onHighlightBenefit]);

  if (!product) {
    return (
      <section className="pdp-missing" aria-labelledby="missing-title">
        <h1 id="missing-title" className="display pdp-missing__title">Flavor not found</h1>
        <p>We don’t have a flavor at this address. It may have been renamed.</p>
        <a className="button-primary" href="/" onClick={(event) => { event.preventDefault(); onNavigate('/#gamme'); }}>
          <ButtonLabel>See all flavors</ButtonLabel>
        </a>
      </section>
    );
  }

  const pack = product.packOptions.find((option) => option.id === packId) ?? product.packOptions[0];
  const related = getRelatedProducts(product.slug);
  const lineTotal = pack.price * quantity;

  const handleAdd = () => {
    if (addState === 'adding') return;
    setAddState('adding');
    setMessage('');
    timers.current.push(
      window.setTimeout(() => {
        const result = addItem(product, pack.id, quantity);
        if (!result.ok) {
          setAddState('error');
          setMessage(
            result.reason === 'line-full'
              ? 'You already have the maximum of this pack in your bag.'
              : 'This pack size is unavailable right now. Choose another size.'
          );
          return;
        }
        audioManager.play('open');
        setAddState('added');
        setMessage(`${product.name}, ${pack.label} × ${quantity} added to your bag.`);
        if (addButtonRef.current) flyToBag(getProductThumbUrl(product), addButtonRef.current);
        timers.current.push(window.setTimeout(() => setAddState('idle'), 2200));
      }, 320)
    );
  };

  const turn = (next: 'FRONT' | 'BACK') => {
    setView(next);
    onView(next);
    if (next === 'FRONT') {
      setHotspot(-1);
      onHighlightBenefit(-1);
    }
  };

  const openHotspot = (index: number) => {
    const next = hotspot === index ? -1 : index;
    setHotspot(next);
    if (next >= 0) {
      setView('BACK');
      onView('BACK');
    }
    onHighlightBenefit(next);
  };

  return (
    <article className="pdp" data-accent={product.accentToken} aria-labelledby="pdp-title">
      <section className="pdp-hero">
        {isWebglAvailable ? (
          <DragStage onRotate={onRotate} label={`${product.name} can`}>
            <div className="pdp-hotspots" role="group" aria-label="What’s on the label">
              {BENEFITS.map((benefit, index) => (
                <button
                  key={benefit.id}
                  type="button"
                  className={`hotspot ${hotspot === index ? 'is-active' : ''}`}
                  style={{ '--i': index } as React.CSSProperties}
                  aria-expanded={hotspot === index}
                  aria-controls="hotspot-panel"
                  onClick={() => openHotspot(index)}
                >
                  <span className="hotspot__dot" aria-hidden="true"><BenefitIcon type={benefit.iconType} size={16} /></span>
                  <span className="hotspot__label">{benefit.title}</span>
                </button>
              ))}
            </div>
            <div id="hotspot-panel" className="hotspot-panel" role="status">
              {hotspot >= 0 && (
                <>
                  <p className="hotspot-panel__title">{BENEFITS[hotspot].title}</p>
                  <p className="hotspot-panel__text">{publicText(BENEFITS[hotspot].description)}</p>
                </>
              )}
            </div>
            <div className="pdp-stage__controls" role="group" aria-label="Turn the can">
              <button type="button" className={`chip ${view === 'FRONT' ? 'is-selected' : ''}`} aria-pressed={view === 'FRONT'} onClick={() => turn('FRONT')}>Front</button>
              <button type="button" className={`chip ${view === 'BACK' ? 'is-selected' : ''}`} aria-pressed={view === 'BACK'} onClick={() => turn('BACK')}>Back label</button>
            </div>
            <p className="pdp-stage__hint" id="drag-hint">Drag to turn 360°, or use the arrow keys</p>
          </DragStage>
        ) : (
          <div className="pdp-stage pdp-stage--static">
            <img src={getProductThumbUrl(product)} alt={`${product.name} can`} />
          </div>
        )}

        <div className="pdp-panel">
          <a className="back-link" href="/#gamme" onClick={(event) => { event.preventDefault(); onNavigate('/#gamme'); }}>
            <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M8 2 4 6l4 4" /></svg>
            All flavors
          </a>

          <RevealText key={product.slug} id="pdp-title" as="h1" className="pdp-panel__title display" lines={[product.line1, product.line2].filter(Boolean)} />
          {product.edition && <p className="pdp-price__note pdp-panel__edition">{product.edition}</p>}
          <LimitedCountdown slug={product.slug} />
          <p className="pdp-panel__tagline">{product.tagline}</p>

          <ul className="trust-badges" aria-label="Certifications">
            <li className="trust-badge">
              <span className="trust-badge__icon" aria-hidden="true">حلال</span>
              <span>Halal certified</span>
            </li>
            <li className="trust-badge">
              <span className="trust-badge__icon" aria-hidden="true"><BenefitIcon type="zamzam" size={16} /></span>
              <span>Added Zamzam water</span>
            </li>
          </ul>

          <div className="pdp-price">
            <span className="pdp-price__total" aria-live="polite">{formatPrice(lineTotal)}</span>
            <span className="pdp-price__unit">{formatPrice(pack.unitPrice)} per can</span>
            {PLACEHOLDER_PRICING && <span className="pdp-price__note">Placeholder price</span>}
          </div>

          <fieldset className="pack-picker">
            <legend id={packGroupId} className="field-legend">Pack size</legend>
            <div className="pack-picker__options">
              {product.packOptions.map((option) => (
                <label key={option.id} className={`pack-option ${option.id === pack.id ? 'is-selected' : ''} ${option.inStock ? '' : 'is-disabled'}`}>
                  <input
                    type="radio"
                    name={`pack-${product.slug}`}
                    value={option.id}
                    checked={option.id === pack.id}
                    disabled={!option.inStock}
                    onChange={() => {
                      setPackId(option.id);
                      if (addState === 'error') setAddState('idle');
                    }}
                  />
                  <span className="pack-option__label">{option.label}</span>
                  <span className="pack-option__price">{formatPrice(option.price)}</span>
                  {option.badge && <span className="pack-option__badge">{option.badge}</span>}
                  {!option.inStock && <span className="pack-option__badge">Sold out</span>}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="pdp-buy">
            <div>
              <span className="field-legend" aria-hidden="true">Quantity</span>
              <QuantityStepper value={quantity} onChange={setQuantity} label={`${product.name}, ${pack.label}`} />
            </div>
            <button
              ref={addButtonRef}
              type="button"
              className={`button-primary button-primary--block pdp-buy__add ${addState === 'added' ? 'is-success' : ''} ${addState === 'adding' ? 'is-loading' : ''}`}
              onClick={handleAdd}
              aria-busy={addState === 'adding'}
              aria-describedby="pdp-status"
            >
              <ButtonLabel>{ADD_LABEL[addState]}</ButtonLabel>
            </button>
          </div>

          <p id="pdp-status" className={`pdp-status ${addState === 'error' ? 'is-error' : ''}`} role="status">
            {message}
            {!persistent && ' Your bag will be kept for this visit only (browser storage is blocked).'}
          </p>

          <button type="button" className="info-toggle" onClick={() => setInfoOpen(true)} aria-haspopup="dialog">
            <span>Nutrition and ingredients</span>
            <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2l4 4-4 4" /></svg>
          </button>

          <div className="pdp-share">
            <button
              type="button"
              className="button-outline"
              aria-busy={shareState === 'working'}
              disabled={shareState === 'working'}
              onClick={async () => {
                setShareState('working');
                setShareState(await sharePoster(product.slug, product.name));
              }}
            >
              Share poster
            </button>
            <span className="pdp-share__status" role="status">
              {shareState === 'downloaded' && 'Poster saved to your downloads.'}
              {shareState === 'shared' && 'Thanks for sharing.'}
              {shareState === 'failed' && 'The poster couldn’t be created. Try again.'}
            </span>
          </div>

          <ul className="pdp-facts">
            <li>{product.leadTime}</li>
            <li>{product.origin}</li>
            <li>{product.volume}</li>
          </ul>
        </div>
      </section>

      <section className="pdp-section" aria-labelledby="reviews-title">
        <h2 id="reviews-title" className="pdp-section__title display">Reviews</h2>
        {REVIEWS.length === 0 ? (
          <div className="reviews-empty">
            <p className="reviews-empty__title">No reviews yet.</p>
            <p className="reviews-empty__text">Reviews will appear here once customers have tried {product.name}.</p>
          </div>
        ) : (
          <ul className="reviews">
            {REVIEWS.map((review) => (
              <li key={review.author} className="review">
                <p className="review__rating" aria-label={`${review.rating} out of 5`}>{'★'.repeat(review.rating)}</p>
                <p>{review.text}</p>
                <p className="review__author">{review.author}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="pdp-section" aria-labelledby="related-title">
        <h2 id="related-title" className="pdp-section__title display">Try another flavor</h2>
        <ul className="related">
          {related.map((item) => (
            <li key={item.slug} data-accent={item.accentToken}>
              <a
                className="related__card"
                href={`/products/${item.slug}`}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate(`/products/${item.slug}`);
                }}
              >
                <img src={getProductThumbUrl(item)} alt="" loading="lazy" width="120" height="213" />
                <span className="related__name">{item.name}</span>
                <span className="related__price">From {formatPrice(item.packOptions[0].price)}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title={`${product.name}: nutrition and ingredients`}>
        <h3 className="field-legend">Ingredients</h3>
        <p className="pdp-inside__text">{confirmed(product.ingredients, 'The full ingredient list will be added here soon.')}</p>
        <table className="nutrition">
          <caption className="field-legend">Nutrition, {product.nutrition.serving.toLowerCase()}</caption>
          <tbody>
            {product.nutrition.rows.map(([label, value]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{value === 'TODO' ? 'To be confirmed' : value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="pdp-features">
          {product.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </InfoDrawer>
    </article>
  );
};

/** Left half of the product hero: drag (pointer or touch) turns the can a full 360°. */
const DragStage: React.FC<{ onRotate: (dx: number, dy: number) => void; label: string; children: React.ReactNode }> = ({ onRotate, label, children }) => {
  const last = useRef<{ id: number; x: number; y: number } | null>(null);
  return (
    <div
      className="pdp-stage"
      role="group"
      aria-label={label}
      aria-describedby="drag-hint"
      tabIndex={0}
      onKeyDown={(event) => {
        const step = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -30], ArrowDown: [0, 30] }[event.key];
        if (!step) return;
        event.preventDefault();
        onRotate(step[0], step[1]);
      }}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest('button')) return;
        last.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!last.current || last.current.id !== event.pointerId) return;
        onRotate(event.clientX - last.current.x, event.clientY - last.current.y);
        last.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      }}
      onPointerUp={() => {
        last.current = null;
      }}
      onPointerCancel={() => {
        last.current = null;
      }}
    >
      {children}
    </div>
  );
};
