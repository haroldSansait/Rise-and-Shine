# Rise and Shine — Frontend Implementation Specifications
This document outlines the UI/UX rendering engine, DOM structure, stylesheet guidelines, and asset deployment patterns using HTML5, Tailwind CSS, and vanilla JavaScript.

---

## 1. Core Visual Stack & Layout Framework
The interface is executed using a lightweight, DOM-based presentation layer integrated with Tailwind utility classes. 
* **GPU-Accelerated Layering**: Render interface components as structural elements over high-resolution graphic canvases.
* **Responsive Framing**: Use fixed canvas ratios nested inside responsive flex containers to lock retro grid boundaries across varying display formats.
* **Empty-Space Conventions**: Background generations must explicitly enforce unobstructed padding areas to guarantee accessibility and clear readability for inputs, labels, and interaction overlays.

---

## 2. Sprite Sheet Animation Pipeline
All animations are rendered natively within normal HTML `div` blocks by mapping background coordinates directly to transparent PNG strips via native CSS loops.

### Technical Rules for Sprite Strips
* **Format**: Uniform transparent PNG strips to maintain lossless color integrity and crisp alpha-channel overlays. No pre-packaged old-school external CSS sprite spreadsheets.
* **Grid Format**: Uniform horizontal row alignments (1x4 grid structures for 4-frame cycles).
* **Center Point Alignment**: Root cells must lock character center mass strictly across all boxes to eliminate horizontal jitter during rendering updates.

### Native Tailwind Implementation Pattern
To offload animation rendering entirely to the browser's hardware GPU, implement the timing configuration inside your Tailwind extensions or custom utilities:

```css
/* Custom CSS extension for sprite sheets */
@keyframes playHorizontalSprite {
  from { background-position: 0px; }
  to { background-position: -256px; } /* Derived from: Frame Width * Total Frames */
}

.animate-sprite-idle {
  animation: playHorizontalSprite 0.8s steps(4) infinite; /* Forced jumping transitions */
}

.animate-sprite-attack {
  animation: playHorizontalSprite 0.6s steps(4) forwards; /* Non-looping completion hold */
}
```

```html
<!-- Example DOM Rendering Block -->
<div class="w-[64px] h-[64px] bg-[url('/assets/sprites/character_mj_idle_4f.png')] bg-no-repeat bg-left animate-sprite-idle"></div>
```

---

## 3. Library Integration & System Feedback
Enhance interface reactivity using targeted libraries that coordinate with a vanilla JavaScript workflow without increasing compilation bloat:

### Visual Juice & Screen FX (`canvas-confetti` / `tsParticles`)
* **Usage**: Triggers high-performance visual rewards when clearing major academic stages (e.g., Prelims) or when the Core of Assessment breaks apart.
* **Rule**: Inject bursts instantly above the Tailwind DOM hierarchy to maintain smooth performance.

### Narrative Layout Handling (`TypewriterJS` / `GSAP`)
* **Usage**: Coordinates retro arcade dialogues and kinetic element transitions during intro scripts and stage milestones.

---

## 4. Audio Management Architecture (`Howler.js`)
To prevent network processing lag or browser context errors during intense turn-based battle triggers, all pre-rendered file logic must compile into unified Audio Sprites.

### Audio Manifest Schema
```javascript
const gameAudioEngine = new Howl({
  src: ['assets/audio/master_audio_sprite.mp3'],
  sprite: {
    bgm_prelim_loop: [0, 45000, true],    // Start point (ms), Duration (ms), Loop setting
    boss_k_intro: [46000, 3200],
    sfx_ping_shot: [50000, 450],
    sfx_memory_charge: [51000, 800],
    sfx_incorrect_recoil: [52000, 350]
  },
  globalVolume: 0.8
});
```
