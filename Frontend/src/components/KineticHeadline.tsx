import React, { useMemo } from 'react';

interface KineticHeadlineProps {
  text: string;
  className?: string;
}

export function KineticHeadline({ text, className }: KineticHeadlineProps) {
  const chars = useMemo(() => text.split(''), [text]);

  return (
    <h1 className={className}>
      {chars.map((char, i) => (
        <span
          key={`${char}-${i}`}
          className="inline-block opacity-0 animate-kinetic will-change-transform"
          style={{ animationDelay: `${i * 0.03}s` }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </h1>
  );
}
