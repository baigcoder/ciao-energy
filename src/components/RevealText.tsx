import React from 'react';

interface RevealTextProps {
  lines: string[];
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  /** 'chars' staggers every character; 'lines' slides each line as one block. */
  split?: 'chars' | 'lines';
  id?: string;
  /** The heading's real text (accessible name). Defaults to the lines joined with spaces. */
  label?: string;
  /** What separates the lines in the text content: ' ' between words, '' when a line break falls inside one word. */
  joiner?: string;
}

/**
 * Masked text reveal driven by CSS: characters (or lines) rise into place when an
 * ancestor carries .is-active. Use split="lines" for joined scripts (Urdu), where
 * splitting into characters would break letter shaping. The accessible name is the
 * plain text; the split spans are hidden from assistive tech. Re-key to replay.
 */
export const RevealText: React.FC<RevealTextProps> = ({ lines, as = 'h2', className = '', split = 'chars', id, label, joiner = ' ' }) => {
  const Tag = as;
  let charIndex = 0;
  return (
    <Tag className={`reveal ${className}`} aria-label={label ?? lines.join(joiner)} id={id}>
      {lines.map((line, lineIndex) => (
        <span className="reveal__line" key={lineIndex} aria-hidden="true">
          {split === 'lines' ? (
            <span className="reveal__unit" style={{ '--i': lineIndex * 3 } as React.CSSProperties}>
              {line}
            </span>
          ) : (
            line.split('').map((char) => {
              const index = charIndex++;
              return (
                <span className={`reveal__unit${char === ' ' ? ' reveal__unit--space' : ''}`} key={index} style={{ '--i': index } as React.CSSProperties}>
                  {char === ' ' ? ' ' : char}
                </span>
              );
            })
          )}
          {/* A trailing space inside each line but the last: the text content reads "BLUE RASPBERRY" for crawlers.
              It collapses at the end of the line box, so it adds no gap, and the .reveal__line + .reveal__line margins
              (which a node between the lines would break) are untouched. */}
          {lineIndex < lines.length - 1 && joiner ? joiner : null}
        </span>
      ))}
    </Tag>
  );
};
