# VOLD — The Rulebreaker

An interactive redesign of the existing VOLD project. Pull “RULES” out of the opening page. The typography becomes a physical playground. Rewind reverses the actual recorded movement, including your throws.

## Run locally

```powershell
npm install
npm run dev
```

Open [the local preview](http://127.0.0.1:5173/). Vite uses polling for reliable updates in this Windows workspace.

```powershell
npm run build
npm run lint
npm test
```

Tests use Node's built-in TypeScript stripping (Node 22.18+ or 24+). They verify exact rewind, bounded history, deterministic starting impulses, timeline branching, rotated hit testing, reduced impulses, and boundaries under repeated throws and collisions.

## Experience

Pull the red word in any direction, or use the “break the rules” button. Grab the fallen pieces and throw them. Hold Rewind with a pointer; keyboard users activate it to toggle reversal. Throw, Pause / Resume, and Reset also work without dragging. After 5.5 idle seconds, the world pauses to preserve meaningful motion in its eight-second history. Grabbing a piece starts it again.

Sound is off by default. Enabling it creates local WebAudio tones for release, impacts, throws, and reversal. No microphone, media files, tracking, or external audio service is involved.

“Pass the trouble on” opens an incident receipt. Save a 1080 × 1350 PNG of the current composition, use native sharing where available, or copy the seed link. The link recreates the incident seed, **not a recording of every gesture**; viewport size and subsequent input affect the outcome. A localhost link only works on this computer. Public sharing requires deploying to a reachable host. No deployment has been performed.

Type `VOLD` while playing, or discover the receipt's postscript, to reverse gravity. Reduced-motion users start with the broken scene paused and can opt into a gentler throw. Changing that preference resets the experiment. Mobile retains the same core interaction; ordinary scrolling works outside draggable pieces. Resizing preserves the composition and gravity but clears history whose old coordinates are no longer valid.

## Implementation

- `src/components/Rulebreaker.tsx`: pointer interaction, playback controls, sound, seeded sharing, and poster export.
- `src/physics.ts`: ten lightweight bodies, fixed 60 Hz steps, soft collision cores, rotation-aware limits, reusable 480-frame history.
- `src/sound.ts`: gesture-enabled synthesized audio with capped impact frequency and teardown.
- `src/rulebreaker.css`: new experiment and drink lineup.
- `src/App.tsx`, `src/data.ts`, `src/index.css`: actual products, photography, story, formats, availability, FAQs, and trade enquiry.
- `src/useExperience.ts`: GSAP ticker drives Lenis; reduced-motion handling and section reveals.
- `CREATIVE-DIRECTION.md`: three concepts, selection rationale, and complete experience architecture.

The opening animates actual DOM typography through transforms. It has no WebGL rendering or per-frame React state updates. Physics stops offscreen, in a hidden tab, or when paused. History storage is bounded; GSAP, observers, listeners, and audio are cleaned up. The previous `EnergyScene.tsx` remains as a reference but is not imported or shipped in the application bundle. No new dependencies were needed. Target-device profiling is still needed before claiming a sustained 60 FPS on all devices.

## Brand content

The real four-product range is Classic and Green Apple energy drinks, plus Ginger Ale and Tonic Water mixers. Product cutouts, lifestyle photography, and the Shark Tank still in `public/images` came from the public image library at [VOLD](https://www.voldenergy.in/). Existing product content, packaging, contact details, and milestones are preserved.

The stockist form validates inputs and opens an encoded email draft to `info@voldenergy.in`. The visitor sends it using their email app. Availability links open a VOLD team enquiry in WhatsApp. There is no backend submission, checkout, or live stock inventory.

The supplied research informed interaction and performance questions. Its conceptual examples are not treated as independently verified case studies. [Ciao Energy](https://www.ciaoenergy.com/) informed pacing and typographic confidence; no Ciao code or assets are used.