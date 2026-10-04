import React from 'react';

/**
 * Rolling label for primary buttons: the visible text slides up on hover and an
 * identical copy slides in from below. The copy is aria-hidden so assistive tech
 * reads the label once (CSS-generated content would be read twice).
 */
export const ButtonLabel: React.FC<{ children: string }> = ({ children }) => (
  <span className="button-primary__label">
    <span className="button-primary__text">{children}</span>
    <span className="button-primary__text button-primary__text--clone" aria-hidden="true">{children}</span>
  </span>
);
