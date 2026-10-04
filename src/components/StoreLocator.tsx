import React, { useId, useMemo, useState } from 'react';
import { STORES, COMMERCE } from '../data/brand';
import { ButtonLabel } from './ButtonLabel';

/**
 * Where to buy. The store list lives in grizzly.json (stores.items); while it is
 * empty the page says so and points to online ordering instead of showing
 * invented locations.
 */
export const StoreLocator: React.FC<{ onNavigate: (url: string) => void }> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [province, setProvince] = useState('');
  const searchId = useId();
  const provinceId = useId();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STORES.filter(
      (store) =>
        (!q || `${store.name} ${store.city} ${store.address}`.toLowerCase().includes(q)) &&
        (!province || store.address.includes(province))
    );
  }, [query, province]);

  const empty = STORES.length === 0;

  return (
    <article className="story stores" aria-labelledby="stores-title">
      <h1 id="stores-title" className="display story__title">Find Grizzly</h1>
      <p className="story__lead">Shops and partners stocking Grizzly Energy across Pakistan.</p>

      <form className="stores__filters" role="search" onSubmit={(event) => event.preventDefault()}>
        <div className="field field--stacked">
          <label htmlFor={searchId} className="field-legend">City or shop name</label>
          <input
            id={searchId}
            className="field__input field__input--plain"
            type="search"
            value={query}
            disabled={empty}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="field field--stacked">
          <label htmlFor={provinceId} className="field-legend">Province</label>
          <select id={provinceId} className="field__input field__input--plain" value={province} disabled={empty} onChange={(event) => setProvince(event.target.value)}>
            <option value="">All provinces</option>
            {COMMERCE.provinces.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </form>

      <div className="stores__results" role="status">
        {empty ? (
          <div className="stores__empty">
            <p className="stores__empty-title">Store list coming soon</p>
            <p className="stores__empty-text">We’re lining up our first retail partners. Until then, order online and we’ll deliver to your door.</p>
            <a
              className="button-primary"
              href="/#gamme"
              onClick={(event) => {
                event.preventDefault();
                onNavigate('/#gamme');
              }}
            >
              <ButtonLabel>Shop online</ButtonLabel>
            </a>
          </div>
        ) : results.length === 0 ? (
          <p className="stores__empty-text">No stores match “{query}”. Try another city or clear the filters.</p>
        ) : (
          <ul className="stores__list">
            {results.map((store) => (
              <li key={`${store.name}-${store.address}`} className="store-card">
                <h2 className="store-card__name">{store.name}</h2>
                <p className="store-card__city">{store.city}</p>
                <p className="store-card__address">{store.address}</p>
                {store.mapUrl && (
                  <a className="text-button" href={store.mapUrl} target="_blank" rel="noopener noreferrer">
                    Open in maps<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
};
