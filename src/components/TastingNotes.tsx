import React from 'react';
import type { TastingProfile } from '../data/products';

interface TastingNotesProps {
  profile: TastingProfile;
}

const SCALES = [
  ['sweetness', 'Sweetness'],
  ['tartness', 'Tartness'],
  ['aroma', 'Aroma'],
  ['fizz', 'Fizz'],
  ['energyLift', 'Energy lift'],
] as const;

/** Taste notes from the label; 0–5 scales appear only once scores are supplied. */
export const TastingNotes: React.FC<TastingNotesProps> = ({ profile }) => (
  <div className="tasting">
    {profile.scores && (
      <ul className="tasting__scales">
        {SCALES.map(([key, label]) => (
          <li key={key} className="tasting__scale">
            <span className="tasting__label">{label}</span>
            <span
              className="tasting__meter"
              role="meter"
              aria-label={label}
              aria-valuemin={0}
              aria-valuemax={5}
              aria-valuenow={profile.scores?.[key]}
              style={{ '--meter': (profile.scores?.[key] ?? 0) / 5 } as React.CSSProperties}
            />
            <span className="tasting__value" aria-hidden="true">{profile.scores?.[key].toFixed(1)}</span>
          </li>
        ))}
      </ul>
    )}
    <ul className="tasting__lines">
      {profile.notes.map((note) => (
        <li key={note}>{note}</li>
      ))}
    </ul>
  </div>
);
