import React from 'react';
import { MAX_LINE_QUANTITY } from '../store/cart';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  /** Name used in button labels, e.g. "Double Lychee, 6 cans". */
  label: string;
  min?: number;
  max?: number;
  size?: 'regular' | 'compact';
  disabled?: boolean;
}

/** − value + stepper. Buttons disable at the bounds; the value is announced politely. */
export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  onChange,
  label,
  min = 1,
  max = MAX_LINE_QUANTITY,
  size = 'regular',
  disabled = false,
}) => (
  <div className={`stepper stepper--${size}`} role="group" aria-label={`Quantity, ${label}`}>
    <button
      type="button"
      className="stepper__button"
      onClick={() => onChange(value - 1)}
      disabled={disabled || value <= min}
      aria-label={`Decrease quantity of ${label}`}
    >
      <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6h8" /></svg>
    </button>
    <output className="stepper__value" aria-live="polite">{value}</output>
    <button
      type="button"
      className="stepper__button"
      onClick={() => onChange(value + 1)}
      disabled={disabled || value >= max}
      aria-label={`Increase quantity of ${label}`}
    >
      <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6h8M6 2v8" /></svg>
    </button>
  </div>
);
