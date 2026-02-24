import React from 'react';

export const GrainOverlay = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03]">
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.65" 
            numOctaves="3" 
            stitchTiles="stitch" 
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
};
