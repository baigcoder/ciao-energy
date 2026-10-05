import React from 'react';

interface RevealTextProps {
  lines: string[];
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  /** 'chars' staggers every character; 'lines' slides each line as one block. */
  split?: 'chars' | 'lines';
  id?: string;
}

/**
 * Masked text reveal driven by CSS: characters (or lines) rise into place when an
 * ancestor carries .is-active. Use split="lines" for joined scripts (Urdu), where
 * splitting into characters would break letter shaping. The accessible name is the
 * plain text; the split spans are hidden from assistive tech. Re-key to replay.
 */
export const RevealText: React.FC<RevealTextProps> = ({ lines, as = 'h2', className = '', split = 'chars', id }) => {
  const Tag = as;
  let charIndex = 0;
  return (
    <Tag className={`reveal ${className}`} aria-label={lines.join(' ')} id={id}>
      {lines.map((line, lineIndex) => (
        <React.Fragment key={lineIndex}>
          {/* a real space between lines, so the text content reads "BLUE RASPBERRY" for crawlers (the lines are blocks) */}
          {lineIndex > 0 && ' '}
        <span className="reveal__line" aria-hidden="true">
          {split === 'lines' ? (
            <span className="reveal__unit" style={{ '--i': lineIndex * 3 } as React.CSSProperties}>
              {line}
            </span>
          ) : (
            line.split('').map((char) => {
              const index = charIndex++;
              return (
                <span className="reveal__unit" key={index} style={{ '--i': index } as React.CSSProperties}>
                  {char === ' ' ? ' ' : char}
                </span>
              );
            })
          )}
        </span>
        </React.Fragment>
      ))}
    </Tag>
  );
};
