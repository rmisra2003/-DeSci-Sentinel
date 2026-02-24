# DeSci Sentinel DeSci: Frontend Technical Specification

This document provides a comprehensive overview of the **DeSci Sentinel DeSci** landing page frontend for LLM interpretation and future development.

## 1. Project Overview
**DeSci Sentinel DeSci** is a high-end decentralized science (DeSci) platform landing page. It features a "Bioluminescent Cyberpunk" aesthetic, characterized by deep blacks (`#050505`), emerald-green accents (`#10B981`), and organic, fluid animations.

## 2. Tech Stack
- **Framework**: React 19 (TypeScript)
- **Animation Engines**: 
  - **GSAP**: Used for complex timelines, SVG path manipulation, numerical roll-ups, and magnetic mouse effects.
  - **Framer Motion (motion/react)**: Used for layout-aware transitions, spring physics, and shared element transitions (`layoutId`).
- **Styling**: Tailwind CSS (v4)
- **Icons**: Lucide React
- **Typography**: Inter (Sans) & JetBrains Mono (Mono)

## 3. Core Components & Features

### A. Visual Foundation
- **GrainOverlay**: A fixed SVG filter (`fractalNoise`) at 2% opacity that adds a premium analog texture to the background.
- **Bioluminescent Theme**: Uses custom `.bio-glow` classes with `drop-shadow` to create soft, atmospheric lighting.
- **Smooth Scroll**: Integrated GSAP scroll listeners for fluid landing page interaction.

### B. Hero Section (`App.tsx`)
- **BioAgentOrb**: 
  - Uses an SVG `<filter>` with `feGaussianBlur` and `feColorMatrix` to create a "gooey" effect.
  - GSAP animates multiple overlapping blobs to simulate organic cellular movement.
  - **Magnetic Effect**: Implemented using `gsap.quickSetter` for high-performance mouse tracking.
- **KineticHeadline**:
  - Splits text into individual characters.
  - GSAP animates each character with a "glitch-to-stable" flicker effect (random opacity jumps) and a `back.out` entrance.
- **Mouse-Follow Light**:
  - A fixed `radial-gradient` div that follows the cursor with a smoothed GSAP lag effect (`power2.out`).

### C. Live Curation Feed (`src/components/CurationFeed.tsx`)
- **Real-time Simulation**: Uses `useEffect` and `setInterval` to prepend new "research papers" to the state.
- **Scanning Animation**: A horizontal emerald line and gradient mask that "scans" new cards using a CSS keyframe animation.
- **Layout Transitions**: 
  - Wrapped in `AnimatePresence`.
  - Items use `layoutId` for smooth reordering when new items arrive.
  - Spring physics (`stiffness: 300, damping: 25`) provide a high-end feel.
- **Shared Element Expansion**:
  - Clicking a card uses Framer Motion's `layoutId` to morph the small card into a full-screen modal.

### D. Agent Status Sidebar (`src/components/AgentSidebar.tsx`)
- **Numerical Roll-up**:
  - GSAP animates proxy objects to update stats like "Science Funded" ($15M+) and "Grants Distributed" on mount.
- **Scholar Wallet**: A custom UI element showing real-time SOL balance with a pulse animation.
- **BioDAO List**: A categorized list of active DAOs (VitaDAO, HairDAO, etc.) with glowing status indicators.
- **Reactive Waveform**:
  - An SVG `<path>` representing neural activity, animated via GSAP's `attr` plugin for a live pulse effect.

## 4. Layout Architecture
- **Responsive Design**: 
  - Desktop: A fixed right sidebar (`AgentSidebar`) with a central scrollable content area.
  - Mobile: Sidebar is hidden; content is centered with appropriate padding.
- **Spacing**: Uses a `space-y-24` vertical rhythm to separate major sections (Hero, Stats, Feed).
- **Grid Overlay**: A subtle CSS-pattern grid is fixed to the background to reinforce the "scientific instrument" feel.

## 5. Key CSS Utilities (`src/index.css`)
- `.gooey-container`: Applies the SVG filter defined in the Orb component.
- `.glow-text`: Custom text shadow for the bioluminescent effect.
- `.animate-shimmer`: A custom keyframe animation for "scanning" border effects.
- `.glass-card`: Standardized backdrop-blur and border styling.

## 6. Interaction Model
1. **Idle**: Orb floats, waveform pulses, background grid remains static.
2. **Hover**: Cards shimmer, buttons scale, cursor light follows.
3. **Active**: Cards expand into modals via `layoutId`, numbers roll up on mount.
4. **Data Flow**: New cards push existing ones down with spring physics.
