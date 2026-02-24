import React from 'react';

export function ScholarOrb() {
  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="relative bio-glow animate-float">
        <div className="gooey-container w-48 h-48 md:w-64 md:h-64 relative">
          <div className="absolute inset-0 bg-emerald-500/60 rounded-full blur-2xl animate-pulse" />
          <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-emerald-400/50 rounded-full" />
          <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-teal-500/40 rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-emerald-600/60 rounded-full" />
          <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-emerald-300/30 rounded-full" />
        </div>

        <div className="absolute inset-0 -m-6 border border-emerald-500/20 rounded-full animate-[spin_12s_linear_infinite]" />
        <div className="absolute inset-0 -m-10 border border-emerald-500/10 rounded-full animate-[spin_18s_linear_infinite_reverse]" />
      </div>
    </div>
  );
}
