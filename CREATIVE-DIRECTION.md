# VOLD — The Rulebreaker

Creative direction and implementation architecture for the existing Vite / React / TypeScript project.

## What the previous concept got right

The previous build established a strong visual vocabulary: oversized condensed typography, a black ground, vivid product colours, an identifiable VOLD wordmark, and real brand photography. Its product information, package formats, Indian origin story, regional enquiries, and trade contact flow gave the experience a useful commercial foundation.

Its ceiling was participation. Visitors watched a can and scrolled through reveals. Those transitions were polished, but the visitor’s actions rarely changed what happened. A screenshot communicated almost the entire premise. There was no specific story to tell a friend beyond “look at this nice drinks website.”

The redesign retains that identity and useful content. It changes the opening proposition from observing VOLD’s energy to causing it.

## Three genuinely different directions

### 1. The Rulebreaker — remove the thing holding the site together

**Experiential idea:** a suspiciously obedient website asks visitors to “PLEASE OBEY THE RULES.” One red word looks physically removable. Pulling it makes the actual composition fall apart.

**Unexpected interaction:** visitors throw the fallen typography, then hold Rewind to reverse their own recent movements. Letting go branches the timeline: the same mess can have a different future.

**VOLD relationship:** “No rules. Just VOLD.” becomes an action with consequences. The brand’s confidence comes through a dare, an irreverent institutional voice, and a layout that refuses to stay contained.

**Share reason:** “Pull that word. Then rewind what you did.” The invitation is short, comprehensible, and incomplete until experienced. An incident number and downloadable poster make the visitor’s involvement tangible.

**Implementation:** semantic HTML pieces driven by a small deterministic TypeScript physics model, DOM transforms, a bounded state history, GSAP timing, and optional synthesized WebAudio. This does not require a 3D asset pipeline.

### 2. Borrowed Time — the site steals your last few seconds

**Experiential idea:** taps and gestures appear to be ordinary exploration. The page then repeats them as a rhythm, turning the visitor into its unwitting co-performer.

**Unexpected interaction:** a visual echo starts anticipating the next beat. The visitor can cooperate with their recorded gestures or interrupt them to create a new loop.

**VOLD relationship:** personal energy becomes a distinctive rhythm rather than a generic visual effect. The brand supplies attitude; the visitor supplies the performance.

**Share reason:** each loop is recognizably someone’s creation. A short recorded loop could become an invitation to answer with another rhythm.

**Implementation:** timestamped pointer events, a quantized scheduler, WebAudio envelopes, and a lightweight 2D renderer. A visual-only mode would be essential. Its weakness is onboarding: collecting enough gestures takes time, and the temporal duet is less immediate with sound off.

### 3. The Anti-Vending Machine — exchange ordinary for unexpected

**Experiential idea:** a machine accepts a mundane word such as “commute” instead of money, then dispenses an absurd VOLD interpretation of it.

**Unexpected interaction:** the machine’s own interface becomes the delivery mechanism: a receipt unrolls across the page, a compartment opens into an impossible scene, or the instructions become the product.

**VOLD relationship:** VOLD interrupts everyday predictability. Its four real products could anchor four authored personalities without inventing flavours or product claims.

**Share reason:** the contrast between the submitted word and its surprising result creates a personal reveal.

**Implementation:** an authored vocabulary classifier, deterministic scene selection, React state machines, and GSAP sequences. No generative service is necessary. Its weakness is content depth: maintaining surprise across many inputs requires substantially more authored material.

## Why The Rulebreaker wins

It has the shortest distance between curiosity, action, and consequence. The object being manipulated is the website itself, so the surprise does not depend on entering a separate game. Rewind supplies a second discovery after the initial collapse. The visitor recognizes their own actions returning backwards, which makes the moment personal and impossible to explain through a still image alone.

This is an originality thesis, not a guarantee of awards or virality. The design succeeds if people understand the first action quickly and want to demonstrate the second one to someone else.

## Experience architecture

### Arrival: approximately 0–5 seconds

The VOLD header remains available above an orderly typographic stage. “Department of Bad Ideas,” numbered rules, a stamped seal, a small real can, and technical incident metadata establish an intentionally overcontrolled composition. Black, warm white, and VOLD red dominate; the product range later introduces green, orange, and cyan.

“Pull this out. We dare you.” points directly to the red RULES handle. A visible button provides the same outcome without dragging. There is no loader, registration, sound permission gate, or instruction modal. Visitors looking for products can go directly to the range.

### Disobedience: approximately 5–10 seconds

The word follows the pointer with resistance. Releasing early returns it elastically. Crossing the pull threshold releases the composition into gravity: the same words, rule labels, seal, bolt, and can become movable bodies. “NO RULES. JUST VOLD.” appears behind the debris, with the VOLD wordmark anchoring the reveal.

The viewpoint remains fixed. Recognition of the original layout matters more than camera spectacle, so there is no camera flight, lens effect, or particle explosion masking the transformation.

### Ownership: approximately 10–20 seconds

Visitors grab and throw pieces. A recording readout and history bar expose the growing timeline. Hold to Rewind restores saved positions, velocities, rotations, and gravity in reverse, at twice normal playback speed, for up to eight seconds. Release resumes from that earlier state.

After 5.5 seconds without interaction, the simulation pauses automatically, preserving meaningful history instead of filling it with settled debris. Grabbing a piece, throwing, or pressing Resume wakes it. Throw provides a drag-free impulse; Pause and Reset make the sandbox controllable. Reset remains visible at every width, using an icon on narrow screens. There are no points, losses, countdown pressure, or fake rewards. The mechanic rewards exploration through understandable consequences.

### Pass it on: approximately 20–30 seconds

An incident dialog offers a poster and a seeded link. “Make my incident poster” first previews the result inside the dialog; a direct “Save poster as PNG” link then downloads it. The poster translates the current arrangement into a branded graphic receipt; it is not a screenshot or video replay. The link reproduces the starting impulse seed, not the recipient’s later gestures or an identical cross-device trajectory.

Native sharing is attempted where supported, with clipboard and selectable-link fallbacks. Local preview links are explicitly identified as local; friends can access them only after deployment. The dialog’s gravity hint, or typing VOLD while the stage is visible, reverses gravity as a small second visit discovery.

### Product and business continuation

“The mess was virtual. The drinks are real.” connects play to the four-product range. Real cutouts and product dialogs preserve clarity. Formats, lifestyle photography, the Pune story, availability enquiries, FAQ, and trade contact remain accessible through ordinary scrolling and navigation. The contact form honestly composes an email draft; it does not pretend a backend received a message.

## Sound, mobile, and technical discipline

Sound starts muted. An explicit toggle enables short synthesized break, impact, throw, and rewind tones. There is no music download, microphone input, or sound-dependent instruction.

Pointer capture supports mouse and touch. The pull threshold scales with stage width. Keyboard users can break, throw, pause, reset, and toggle rewind through buttons; textual status explains the state. Reduced-motion mode starts the released scene paused, uses smaller impulses, and leaves subsequent motion under explicit control. Changing the system motion preference remounts and resets the experiment so its simulation and controls stay consistent. Product content remains reachable without completing the experiment.

`Rulebreaker.tsx` owns interaction and DOM rendering; `physics.ts` owns the fixed 1/60-second simulation and 480-frame bounded history; `sound.ts` owns audio. GSAP supplies the timing clock, and Lenis remains synchronized with its ticker. Simulation work stops when the stage is offscreen or the document is hidden. Resizing recalculates boundaries and discards trajectories recorded for obsolete dimensions. The opening ships no WebGL scene; the previous can renderer is unnecessary for this concept.

Verification should cover pull and cancellation, throws staying reachable, exact rewind restoration, history limits, pause/reset, pointer and keyboard controls, reduced motion, narrow screens, dialog focus, share fallbacks, and production build output. A 60 FPS target is not a claim of measured performance on every device.

## Research use

`deep-research-report.md` informed implementation questions around performance, sound consent, accessible controls, and sharing. Its specific awards, budgets, and technology claims are not independently established here; it also explicitly includes a fictional campaign. None of those examples is treated as proof that reproducing its shot list would produce an original or award-winning VOLD experience.
