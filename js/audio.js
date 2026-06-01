// ============================================================
//  Rise and Shine — Audio Manager
//  BGM via Howler.js | Byte Cries via Web Audio API
// ============================================================

window.AudioManager = (() => {

  // ── BGM Tracks ────────────────────────────────────────────
  const TRACKS = {
    menu:         'RnS_Original_Sound_Tracks/RnS Menu.mp3',
    intro:        'RnS_Original_Sound_Tracks/RnS_intro.mp3',
    prelimMap:    'RnS_Original_Sound_Tracks/RnS Main theme OST.mp3',
    prelimBattle: 'RnS_Original_Sound_Tracks/Prelim Battle RnS.mp3',
    prelimBoss:   'RnS_Original_Sound_Tracks/PrelimBoss_OST.mp3',
    prelimStage:  'RnS_Original_Sound_Tracks/RnS Prelim Stage.mp3',
  };

  let currentBGM = null;
  let currentTrackId = null;

  // ── Web Audio Context ──────────────────────────────────────
  let audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      // INTERCEPT createGain to automatically scale all procedural SFX by sfxVolume!
      const originalCreateGain = audioCtx.createGain;
      audioCtx.createGain = function() {
        const g = originalCreateGain.call(audioCtx);
        
        // Wrap scheduled gain envelope methods
        const originalSet = g.gain.setValueAtTime;
        g.gain.setValueAtTime = function(value, time) {
          const sfxVol = (window.GameSettings && typeof window.GameSettings.sfxVolume === 'number') 
            ? window.GameSettings.sfxVolume 
            : 1.0;
          originalSet.call(g.gain, value * sfxVol, time);
        };

        const originalRamp = g.gain.linearRampToValueAtTime;
        g.gain.linearRampToValueAtTime = function(value, time) {
          const sfxVol = (window.GameSettings && typeof window.GameSettings.sfxVolume === 'number') 
            ? window.GameSettings.sfxVolume 
            : 1.0;
          originalRamp.call(g.gain, value * sfxVol, time);
        };

        const originalExp = g.gain.exponentialRampToValueAtTime;
        g.gain.exponentialRampToValueAtTime = function(value, time) {
          const sfxVol = (window.GameSettings && typeof window.GameSettings.sfxVolume === 'number') 
            ? window.GameSettings.sfxVolume 
            : 1.0;
          const scaledVal = value * Math.max(0.0001, sfxVol);
          originalExp.call(g.gain, scaledVal, time);
        };

        return g;
      };
    }
    // Resume context if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // ── BGM Preload Cache & API ────────────────────────────────
  const BGM_CACHE = {};

  function preloadBGM(trackId, onLoad, onError) {
    const src = TRACKS[trackId];
    if (!src) {
      if (typeof onLoad === 'function') onLoad();
      return;
    }
    if (BGM_CACHE[trackId]) {
      if (typeof onLoad === 'function') onLoad();
      return;
    }

    let loaded = false;
    const handleLoad = () => {
      if (loaded) return;
      loaded = true;
      if (typeof onLoad === 'function') onLoad();
    };

    // Safe fallback timeout (150ms) to ensure preloader never gets stuck
    // if browser defers loading in-memory HTML5 Audio elements
    setTimeout(handleLoad, 150);

    const bgm = new Howl({
      src: [src],
      loop: true,
      volume: 1.0,
      html5: true,
      onload: handleLoad,
      onloaderror: (id, err) => {
        console.warn(`[AudioManager] Failed to preload BGM: ${trackId}`, err);
        handleLoad(); // proceed anyway to prevent preloader hang
      }
    });
    BGM_CACHE[trackId] = bgm;
  }

  // ── BGM Methods ────────────────────────────────────────────
  function playBGM(trackId, opts = {}) {
    if (currentTrackId === trackId) return;
    const src = TRACKS[trackId];
    if (!src) return;

    // Stop current
    if (currentBGM) {
      const old = currentBGM;
      old.stop();
    }

    if (BGM_CACHE[trackId]) {
      currentBGM = BGM_CACHE[trackId];
    } else {
      currentBGM = new Howl({
        src: [src],
        loop: true,
        volume: 1.0,
        html5: true,
        onloaderror: (id, err) => console.warn('[AudioManager] BGM load error:', err),
      });
      BGM_CACHE[trackId] = currentBGM;
    }

    const targetVolume = opts.volume ?? 0.55;
    currentBGM.volume(targetVolume);
    currentBGM.play();
    currentTrackId = trackId;

    // Browser Autoplay Policy Autorecovery Insurance:
    // If the browser suspends/blocks HTML5 Audio playback because of lack of user gesture,
    // we attach a one-time click/touchstart event listener on the document to resume/play BGM.
    const autoplayInsurance = () => {
      if (currentBGM && !currentBGM.playing()) {
        currentBGM.play();
      }
      document.removeEventListener('click', autoplayInsurance);
      document.removeEventListener('touchstart', autoplayInsurance);
    };
    document.addEventListener('click', autoplayInsurance, { passive: true });
    document.addEventListener('touchstart', autoplayInsurance, { passive: true });
  }

  function stopBGM(fadeDuration = 800) {
    if (currentBGM) {
      const old = currentBGM;
      old.fade(old.volume(), 0, fadeDuration);
      setTimeout(() => { old.stop(); currentBGM = null; }, fadeDuration + 50);
    }
    currentTrackId = null;
  }

  function setBGMVolume(vol) {
    if (currentBGM) currentBGM.volume(vol);
  }

  // ── UI SFX ────────────────────────────────────────────────
  function playClickSFX() {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = 'square';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.15);
  }

  function playConfirmSFX() {
    const ctx = getAudioCtx();
    [0, 0.08, 0.16].forEach((delay, i) => {
      const freq = [523.25, 659.25, 783.99][i]; // C5 E5 G5
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.18, ctx.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.14);
      o.start(ctx.currentTime + delay);
      o.stop(ctx.currentTime + delay + 0.15);
    });
  }

  function playBackSFX() {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = 'square';
    o.frequency.setValueAtTime(440, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.15);
  }

  function playSelectSFX() {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = 'triangle';
    o.frequency.setValueAtTime(660, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.12);
  }

  // ── Byte Cries (procedural, unique per byte) ──────────────
  function playByteCry(byteId) {
    const ctx = getAudioCtx();

    const cries = {
      // Poturtle: Low defensive rumble + shell thunk
      poturtle: () => {
        const now = ctx.currentTime;
        // Noise burst
        const bufLen = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 200;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.4, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);

        // Low tone
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.4);
        oscGain.gain.setValueAtTime(0.3, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
      },

      // Firewisp: High-pitched crackle + rising shriek
      firewisp: () => {
        const now = ctx.currentTime;
        // Crackle noise
        const bufLen = ctx.sampleRate * 0.25;
        const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.15));
        }
        const crackle = ctx.createBufferSource();
        crackle.buffer = buffer;
        const hpFilter = ctx.createBiquadFilter();
        hpFilter.type = 'highpass';
        hpFilter.frequency.value = 1200;
        const crackleGain = ctx.createGain();
        crackleGain.gain.setValueAtTime(0.5, now);
        crackle.connect(hpFilter);
        hpFilter.connect(crackleGain);
        crackleGain.connect(ctx.destination);
        crackle.start(now);

        // Rising shriek
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.35);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      },

      // Lagoon: Watery ripple + harmonic swell
      lagoon: () => {
        const now = ctx.currentTime;
        [0, 0.06, 0.12].forEach((delay, i) => {
          const freq = [440, 554, 659][i];
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = freq;
          g.gain.setValueAtTime(0, now + delay);
          g.gain.linearRampToValueAtTime(0.18, now + delay + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.45);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + delay);
          o.stop(now + delay + 0.5);
        });

        // Watery tremolo effect
        const carrier = ctx.createOscillator();
        const modulator = ctx.createOscillator();
        const modGain = ctx.createGain();
        const carGain = ctx.createGain();
        modulator.frequency.value = 8;
        modGain.gain.value = 0.12;
        carrier.type = 'sine';
        carrier.frequency.setValueAtTime(330, now);
        carrier.frequency.exponentialRampToValueAtTime(280, now + 0.6);
        carGain.gain.setValueAtTime(0.15, now + 0.1);
        carGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(carGain);
        carGain.connect(ctx.destination);
        modulator.start(now);
        modulator.stop(now + 0.7);
        carrier.start(now);
        carrier.stop(now + 0.7);
      },
    };

    const cryFn = cries[byteId];
    if (cryFn) cryFn();
  }

  // ── Node Select SFX (map) ─────────────────────────────────
  function playNodeSelectSFX() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    [0, 0.1].forEach((delay, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = [523, 783][i];
      g.gain.setValueAtTime(0.15, now + delay);
      g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(now + delay);
      o.stop(now + delay + 0.18);
    });
  }

  // ── Battle SFX ────────────────────────────────────────────

  // Correct answer: bright 4-note ascending arpeggio (C5 E5 G5 C6)
  function playCorrectAnswerSFX() {
    const ctx = getAudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const delay = i * 0.1;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.18, ctx.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.18);
      o.start(ctx.currentTime + delay);
      o.stop(ctx.currentTime  + delay + 0.2);
    });
  }

  // Wrong answer: descending modulated buzz with two-stage pitch drop
  function playWrongAnswerSFX() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    // Low carrier
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.start(now); osc.stop(now + 0.42);

    // Noise burst for bite
    const bufLen = ctx.sampleRate * 0.1;
    const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const noise  = ctx.createBufferSource();
    noise.buffer = buf;
    const nf     = ctx.createBiquadFilter();
    nf.type = 'bandpass'; nf.frequency.value = 500; nf.Q.value = 2;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.3, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    noise.connect(nf); nf.connect(ng); ng.connect(ctx.destination);
    noise.start(now);
  }

  // Barrier: Sci-fi high-resonance filter sweep for shield
  function playBarrierSFX() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    
    o.connect(f);
    f.connect(g);
    g.connect(ctx.destination);
    
    o.type = 'triangle';
    o.frequency.setValueAtTime(150, now);
    o.frequency.exponentialRampToValueAtTime(1200, now + 0.45);
    
    f.type = 'peaking';
    f.frequency.setValueAtTime(300, now);
    f.frequency.exponentialRampToValueAtTime(2500, now + 0.4);
    f.Q.setValueAtTime(8, now);
    
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    o.start(now);
    o.stop(now + 0.5);
  }

  // Fire Cast: Crackle chiptune noise + pitch shift sweep
  function playFireCastSFX() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    // Crackling chiptune noise
    const bufLen = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.25));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.35);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    
    // Triangle wave fire surge
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(100, now);
    o.frequency.exponentialRampToValueAtTime(450, now + 0.3);
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    o.start(now);
    o.stop(now + 0.35);
  }

  // Heal: Rising bubbles / shiny watery healing chiptune arpeggio
  function playHealSFX() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    [0, 0.07, 0.14, 0.21, 0.28].forEach((delay, i) => {
      const freq = [392.00, 523.25, 659.25, 783.99, 1046.50][i]; // G4 C5 E5 G5 C6 arpeggio
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, now + delay);
      o.frequency.exponentialRampToValueAtTime(freq * 1.5, now + delay + 0.2);
      g.gain.setValueAtTime(0.18, now + delay);
      g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);
      o.start(now + delay);
      o.stop(now + delay + 0.28);
    });
  }

  // Victory fanfare: triumphant 5-note motif (C5 G5 E5 G5 C6)
  function playVictorySFX() {
    const ctx  = getAudioCtx();
    const seq  = [
      { freq: 523.25, delay: 0    },
      { freq: 783.99, delay: 0.12 },
      { freq: 659.25, delay: 0.24 },
      { freq: 783.99, delay: 0.36 },
      { freq: 1046.5, delay: 0.5  },
    ];
    seq.forEach(({ freq, delay }) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.2, ctx.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.22);
      o.start(ctx.currentTime + delay);
      o.stop(ctx.currentTime  + delay + 0.25);
    });
  }

  // Swoosh: Rising triangle wave sweep for slides
  function playSwooshSFX() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'triangle';
    o.frequency.setValueAtTime(100, now);
    o.frequency.exponentialRampToValueAtTime(800, now + 0.35);
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    o.start(now); o.stop(now + 0.38);
  }

  // Impact: Heavy chiptune pitch drop sweep for VS slam
  function playImpactSFX() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(350, now);
    o.frequency.exponentialRampToValueAtTime(70, now + 0.28);
    g.gain.setValueAtTime(0.28, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    o.start(now); o.stop(now + 0.32);
  }

  // Player digital blade swing/swoosh
  function playPlayerAttackSFX() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    
    o.connect(f);
    f.connect(g);
    g.connect(ctx.destination);
    
    o.type = 'triangle';
    o.frequency.setValueAtTime(600, now);
    o.frequency.exponentialRampToValueAtTime(150, now + 0.15);
    
    f.type = 'bandpass';
    f.frequency.setValueAtTime(800, now);
    f.frequency.exponentialRampToValueAtTime(300, now + 0.15);
    f.Q.setValueAtTime(3, now);
    
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    o.start(now);
    o.stop(now + 0.16);
  }

  // Procedural attack sound effects matching Byte elemental themes
  function playByteAttackSFX(byteId) {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    const sfxMap = {
      pinglet: () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(880, now);
        o.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
        g.gain.setValueAtTime(0.18, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.13);
      },
      bitbug: () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(180, now);
        o.frequency.linearRampToValueAtTime(350, now + 0.08);
        o.frequency.linearRampToValueAtTime(120, now + 0.15);
        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.16);
      },
      poturtle: () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const f = ctx.createBiquadFilter();
        o.type = 'triangle';
        o.frequency.setValueAtTime(110, now);
        o.frequency.exponentialRampToValueAtTime(45, now + 0.22);
        f.type = 'lowpass';
        f.frequency.value = 180;
        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        o.connect(f); f.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.26);
      },
      voltbyte: () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(1200, now);
        o.frequency.setValueAtTime(400, now + 0.04);
        o.frequency.setValueAtTime(1600, now + 0.08);
        o.frequency.setValueAtTime(600, now + 0.12);
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.17);
      },
      ramhorn: () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(220, now);
        o.frequency.exponentialRampToValueAtTime(55, now + 0.28);
        g.gain.setValueAtTime(0.25, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.32);
      },
      firewisp: () => {
        const bufLen = ctx.sampleRate * 0.25;
        const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(250, now + 0.2);
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.22, now);
        ng.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        noise.connect(filter); filter.connect(ng); ng.connect(ctx.destination);
        noise.start(now);
      },
      keyfox: () => {
        [0, 0.04, 0.08].forEach((d, idx) => {
          const freq = [987.77, 1174.66, 1318.51][idx];
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'square';
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.12, now + d);
          g.gain.exponentialRampToValueAtTime(0.001, now + d + 0.06);
          o.connect(g); g.connect(ctx.destination);
          o.start(now + d); o.stop(now + d + 0.07);
        });
      },
      lagoon: () => {
        const carrier = ctx.createOscillator();
        const modulator = ctx.createOscillator();
        const modGain = ctx.createGain();
        const carGain = ctx.createGain();
        modulator.frequency.value = 18;
        modGain.gain.value = 45;
        carrier.type = 'sine';
        carrier.frequency.setValueAtTime(440, now);
        carrier.frequency.exponentialRampToValueAtTime(180, now + 0.22);
        carGain.gain.setValueAtTime(0.2, now);
        carGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        modulator.connect(modGain); modGain.connect(carrier.frequency);
        carrier.connect(carGain); carGain.connect(ctx.destination);
        modulator.start(now); carrier.start(now);
        modulator.stop(now + 0.24); carrier.stop(now + 0.24);
      },
      datashade: () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const f = ctx.createBiquadFilter();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(160, now);
        o.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        f.type = 'peaking';
        f.frequency.setValueAtTime(200, now);
        f.frequency.exponentialRampToValueAtTime(800, now + 0.22);
        f.Q.value = 5;
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        o.connect(f); f.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.27);
      },
      glitchip: () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(150 + Math.random() * 800, now);
        o.frequency.setValueAtTime(150 + Math.random() * 800, now + 0.03);
        o.frequency.setValueAtTime(150 + Math.random() * 800, now + 0.06);
        o.frequency.setValueAtTime(150 + Math.random() * 800, now + 0.09);
        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.13);
      }
    };

    const sfxFn = sfxMap[byteId] ?? sfxMap.glitchip;
    sfxFn();
  }

  // Procedural attack sound effects for Glitchborn/Stage Bosses
  function playEnemyAttackSFX(levelId, isBoss) {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    if (isBoss || levelId === 5) {
      // Overclocked Ms.K: Alarm burst + metallic crash slam
      const alarm = ctx.createOscillator();
      const alarmGain = ctx.createGain();
      alarm.type = 'square';
      alarm.frequency.setValueAtTime(880, now);
      alarm.frequency.linearRampToValueAtTime(440, now + 0.15);
      alarmGain.gain.setValueAtTime(0.15, now);
      alarmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      alarm.connect(alarmGain); alarmGain.connect(ctx.destination);
      alarm.start(now); alarm.stop(now + 0.15);

      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(300, now + 0.05);
      o.frequency.exponentialRampToValueAtTime(45, now + 0.35);

      const bufLen = ctx.sampleRate * 0.3;
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.28, now + 0.05);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      g.gain.setValueAtTime(0.25, now + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      o.connect(g); g.connect(ctx.destination);
      noise.connect(filter); filter.connect(ng); ng.connect(ctx.destination);
      o.start(now + 0.05); o.stop(now + 0.36);
      noise.start(now + 0.05);
      return;
    }

    switch (levelId) {
      case 1: { // Bit Mite: digital chomp
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(220, now);
        o.frequency.exponentialRampToValueAtTime(60, now + 0.14);
        
        const bufLen = ctx.sampleRate * 0.08;
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 600;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.2, now);
        ng.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        
        g.gain.setValueAtTime(0.18, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        
        o.connect(g); g.connect(ctx.destination);
        noise.connect(filter); filter.connect(ng); ng.connect(ctx.destination);
        o.start(now); o.stop(now + 0.15);
        noise.start(now);
        break;
      }
      case 2: { // Cache Slime: Squishy pop
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(150, now);
        o.frequency.exponentialRampToValueAtTime(400, now + 0.12);
        g.gain.setValueAtTime(0.2, now);
        g.gain.linearRampToValueAtTime(0.001, now + 0.15);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.16);
        break;
      }
      case 3: { // Syntax Sprout: Jagged compile error buzz
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(140, now);
        o.frequency.setValueAtTime(160, now + 0.03);
        o.frequency.setValueAtTime(120, now + 0.06);
        o.frequency.setValueAtTime(90, now + 0.09);
        g.gain.setValueAtTime(0.22, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.17);
        break;
      }
      case 4: { // File Phantom: Spectral ghost sweep
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const f = ctx.createBiquadFilter();
        o.type = 'sine';
        o.frequency.setValueAtTime(330, now);
        o.frequency.exponentialRampToValueAtTime(80, now + 0.26);
        f.type = 'peaking';
        f.frequency.setValueAtTime(400, now);
        f.frequency.linearRampToValueAtTime(100, now + 0.26);
        f.Q.value = 10;
        g.gain.setValueAtTime(0.24, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        o.connect(f); f.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.28);
        break;
      }
      default: {
        // Generic slam
        playImpactSFX();
      }
    }
  }

  // ── Public API ────────────────────────────────────────────
  return {
    playBGM,
    preloadBGM,
    stopBGM,
    setBGMVolume,
    playClickSFX,
    playConfirmSFX,
    playBackSFX,
    playSelectSFX,
    playByteCry,
    playNodeSelectSFX,
    getAudioCtx,
    // Battle SFX
    playCorrectAnswerSFX,
    playWrongAnswerSFX,
    playVictorySFX,
    // Byte Ability SFX
    playBarrierSFX,
    playFireCastSFX,
    playHealSFX,
    // VS Banner SFX
    playSwooshSFX,
    playImpactSFX,
    // New Action/Attack SFX
    playPlayerAttackSFX,
    playByteAttackSFX,
    playEnemyAttackSFX,
  };

})();

