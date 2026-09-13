# VOLD — No Rules. Just VOLD.

A complete local redesign built with Vite, React, TypeScript, Three.js / R3F / Drei, GSAP, Lenis, and Tailwind CSS.

## Run

```powershell
npm install
npm run dev
```

Open http://127.0.0.1:5173/. The dev server uses polling for reliable file updates on this Windows workspace.

## Check

```powershell
npm run build
npm run lint
npm run preview
```

## Experience

One shared WebGL canvas supports the opening, range, and product-story chapters. Four flavour controls update the can label, lighting, and product copy. Desktop visitors can rotate the procedural can. Phones use a shorter hero animation and product cutouts in later chapters. Product dialogs, a native FAQ accordion, region enquiries, and a trade enquiry form are included.

The stockist form validates the fields and opens an encoded email draft addressed to info@voldenergy.in. It does not submit to a backend. Regional enquiries open WhatsApp. No checkout or live inventory is implied.

DPR is capped at 1.5. Antialiasing and shadows are disabled. Liquid motion runs on a single shader plane. The environment is captured once at 128 px. WebGL rendering stops when the experience is offscreen or the tab is hidden. GSAP drives Lenis in one ticker; listeners and triggers are cleaned up. Reduced-motion preferences disable ambient animation and scroll smoothing. Product imagery remains available if WebGL fails.

## Content and assets

Product cutouts, lifestyle photography, and the Shark Tank still in public/images were extracted from the publicly served image library on https://www.voldenergy.in/ on 13 September 2026. The live site is the source for the product names, contact details, pack sizes, and brand milestones.

The 3D can uses a locally drawn concept label. It is a visual reconstruction for this redesign, not print-ready packaging artwork. Final brand label artwork can replace the texture generator without rebuilding the scene. Existing photographs show different packaging treatments, retained as source-brand imagery.

Conflicting region totals, illustrative testimonials, unverified performance benefits, and duplicate traction claims were omitted. Confirm product specifications and current artwork before public launch.

Design inspiration: https://www.ciaoenergy.com/ (continuous product storytelling and coordinated lighting). No source code or assets from Ciao were copied.

## Main files

- src/App.tsx — page sections and interactions
- src/components/EnergyScene.tsx — procedural can, lighting, liquid shader, WebGL fallback
- src/useExperience.ts — scroll coordination and reduced-motion handling
- src/data.ts — product, region, and FAQ content
- src/index.css — visual system and responsive layouts

Production builds split the WebGL scene from the main interface. The Three.js scene still produces a bundle-size advisory. Target-device profiling is needed before asserting a sustained 60 FPS.
