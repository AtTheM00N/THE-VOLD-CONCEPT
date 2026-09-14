# VOLD — BREACH

A scroll-controlled product film built into the existing Vite / React / TypeScript site. One camera travels from the can’s crown through condensation and a sealed chamber. The chamber opens along a lightning-shaped seam, revealing VOLD and four distinct product environments. The film yields to the actual range, availability and trade enquiries.

## Run

```powershell
npm install
npm run dev
```

Open http://127.0.0.1:5173/. Vite uses filesystem polling for this Windows workspace.

```powershell
npm run build
npm run lint
npm test
```

Tests require Node 22.18+ or 24+ for native TypeScript stripping. Thirteen tests cover camera clearance, continuous movement, reversible sampling, product sequence, and the preserved Rulebreaker physics.

## The film

Scroll either way, drag the playhead, use its arrow keys, or choose a scene. Play advances a nominal 74-second cut; wheel, touch or scroll keys take control back. Skip film leads to the product range. The final shot links to the drinks and local availability.

Sound starts off. Enabling it creates a local WebAudio score: low pressure, filtered air, a directional breach impact and a quiet ending. No microphone or external audio service is used. Sound falls away outside the film; hiding the tab pauses playback.

Reduced-motion preferences replace camera travel with held compositions and remove autoplay. The Motion / Stills control also enables this view on demand. Narrow screens use wider framing, fewer droplets and smaller reflection textures. Rendering is on demand: stopping the playhead stops the scene. WebGL initialization or scene-loading failures show the real product photograph and a direct route to the drinks.

The scene uses real-time geometry and materials, not a video. It contains a procedural branded sleeve, rolled rims, pierced pull tab, instanced condensation, studio reflections, two chamber plates, green fins, bronze bands, glass planes and a fragment-shaded liquid ribbon. It is not an exact production packaging model or an offline path-traced commercial. Physical-device GPU profiling is still necessary before claiming sustained 60 FPS across devices.

## Files

- `FILM-TREATMENT.md`: the 12-shot treatment, reference analysis and technical constraints, written before implementation.
- `src/film/ScrollFilm.tsx`: scroll playhead, transport, scene navigation, copy and sound lifecycle.
- `src/film/timeline.ts`: pure, reversible camera interpolation and scene timing.
- `src/film/FilmScene.tsx`: geometry, materials, lighting and camera choreography.
- `src/film/FilmSound.ts`: opt-in synthesized score.
- `src/film/film.css`: cinema frame, controls, typography and responsive layouts.
- `src/useExperience.ts`: one GSAP clock for Lenis, programmatic seeking, anchor navigation and reduced-motion handling.
- `src/App.tsx`, `src/data.ts`, `src/index.css`: the existing commercial site and real brand content.

The WebGL scene loads separately from the page. Canvas DPR is capped at 1.5; antialiasing and real-time shadows are disabled. Studio lighting is captured once and droplets are instanced. No dependencies were added. Vite reports the expected large Three.js scene chunk (approximately 263 KB compressed).

## Preserved Rulebreaker

The typography playground remains at http://127.0.0.1:5173/rulebreaker. Pull RULES out of the page, throw the pieces and rewind their recorded movement. Keyboard controls, opt-in sound, gravity reversal, seeded incident links and poster exports remain available. Incident links reproduce the starting seed, not a recording of every gesture.

That version was pushed to https://github.com/AtTheM00N/THE-VOLD-RULEBREAKER at commit `c217373daffc003d6d82655f5d374f81955f66bb` before the film conversion. The `rulebreaker` remote points to that repository; `origin` remains the original concept repository. The film has not been deployed or pushed over that saved version.

`CREATIVE-DIRECTION.md` documents the earlier three concepts and Rulebreaker selection. Its physics modules and tests are retained. The unused older `EnergyScene.tsx` remains as a reference and is not imported into the application.

## Brand and references

The actual range is Classic and Green Apple energy drinks, plus Ginger Ale and Tonic Water sparkling mixers. Product cutouts and photographs in `public/images` came from the public image library at https://www.voldenergy.in/. Contact details, formats and milestones are preserved.

The stockist form validates inputs and opens an encoded draft to `info@voldenergy.in`. The visitor sends it through their email app. Availability links open a WhatsApp enquiry. There is no backend submission, checkout or live inventory.

The treatment records the primary video study and principles drawn from CIAO and Aether:1. No reference-site code, 3D assets or video frames are shipped. The supplied research is creative and technical context; its conceptual examples are not asserted as independently verified case studies.
