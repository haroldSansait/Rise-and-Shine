// ============================================================
//  Rise and Shine — VS Banner Screen
//  Arcade-style opponent reveal before Level 1 battle.
//  GSAP animates #vs-player-side and #vs-enemy-side positions.
//  Enemy sprite is inside a scaleX(-1) inner wrapper — GSAP
//  never touches that wrapper, so the flip is preserved cleanly.
// ============================================================

window.VSBannerScreen = (() => {

  function init() {
    // No static DOM listeners needed
  }

  /**
   * @param {Function} onComplete  Called after the reveal animation finishes.
   */
  function enter(onComplete) {
    // Start the level theme on the VS screen for seamless battle transition.
    const currentLevel = window.GameState.currentLevel;
    AudioManager.playBGM(currentLevel?.bgm ?? 'prelimStage', { volume: 0.55 });

    const char = window.GameState.character;
    const byte = window.GameState.byte;

    // ── Load player idle sprite ───────────────────────────
    if (char) {
      const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
      const id  = char.id;
      // MJ has "Mj_idle.png" (lowercase j) — special-case
      const idleFile = id === 'mj' ? 'Mj_idle' : `${cap(id)}_idle`;
      document.getElementById('vs-player-sprite-img').src =
        `playableCharacters/${cap(id)}/idle_sprites/${idleFile}.png`;
      document.getElementById('vs-player-name').textContent = char.name.toUpperCase();
      document.getElementById('vs-player-sub').textContent  =
        byte ? `+ ${byte.name}` : 'Solo';
    }

    // ── Load enemy idle sprite (dynamic from level data) ──────
    const enemyIdleSrc = currentLevel?.enemyIdleSrc ?? 'glitchbornBytes/Bitmite/bitmite_idle.png';
    document.getElementById('vs-enemy-sprite-img').src = enemyIdleSrc;
    const enemyName = currentLevel?.enemy?.toUpperCase() ?? 'BIT MITE';
    const enemyNameEl = document.getElementById('vs-enemy-name');
    if (enemyNameEl) enemyNameEl.textContent = enemyName;

    // ── Reset positions via GSAP so re-entries work ────────
    gsap.set('#vs-player-side',  { x: '-120vw', opacity: 1 });
    gsap.set('#vs-enemy-side',   { x:  '120vw', opacity: 1 });
    gsap.set('#vs-center-block', { opacity: 0, scale: 3 });
    gsap.set('#vs-flash',        { opacity: 0 });
    gsap.set('#screen-vs-banner',{ opacity: 1 });
    gsap.set('.vs-pokemon-bg',   { opacity: 1 });
    gsap.set('.vs-speed-lines',  { opacity: 0.38 });

    // ── GSAP timeline ─────────────────────────────────────
    const tl = gsap.timeline({
      onComplete: () => {
        // 1. Hide the VS screen container completely
        document.getElementById('screen-vs-banner').classList.add('hidden');
        // 2. Reset opacity of screen-vs-banner container for future transitions
        gsap.set('#screen-vs-banner', { opacity: 1 });
        // 3. Set window state
        window.ScreenManager.setCurrent('battle');

        if (typeof onComplete === 'function') onComplete();
      }
    });

    // 1. Slide both sides in simultaneously
    tl.to('#vs-player-side', { x: 0, duration: 0.5, ease: 'power3.out', onStart: () => AudioManager.playSwooshSFX() })
      .to('#vs-enemy-side',  { x: 0, duration: 0.5, ease: 'power3.out' }, '<')

    // 2. VS text slams in with overshoot
      .to('#vs-center-block', {
          opacity: 1, scale: 1,
          duration: 0.28, ease: 'back.out(2.2)',
          onStart: () => AudioManager.playImpactSFX()
        }, '+=0.1')

    // 3. Quick white flash impact
      .to('#vs-flash', {
          opacity: 0.75, duration: 0.05, ease: 'none',
          onStart: () => AudioManager.playConfirmSFX()
        }, '+=0.08')
      .to('#vs-flash', { opacity: 0,    duration: 0.25, ease: 'power2.out' })

    // 4. Hold for dramatic effect
      .to({}, { duration: 0.85 })

    // 5. Seamless arcade-style split-reveal transition
      .add(() => {
        // Initialize and display the battle screen underneath in the background
        const battleScreen = document.getElementById('screen-battle');
        if (battleScreen) {
          battleScreen.classList.remove('hidden');
        }
        BattleScreen.enter(window.GameState.currentLevel);
      })
      .to('#vs-player-side', { x: '-120vw', duration: 0.7, ease: 'power2.inOut' })
      .to('#vs-enemy-side',  { x: '120vw', duration: 0.7, ease: 'power2.inOut' }, '<')
      .to('#vs-center-block', { scale: 0, opacity: 0, duration: 0.5, ease: 'power2.inOut' }, '<')
      .to('.vs-pokemon-bg',  { opacity: 0, duration: 0.7, ease: 'power2.inOut' }, '<')
      .to('.vs-speed-lines',  { opacity: 0, duration: 0.7, ease: 'power2.inOut' }, '<')
      .to('#screen-vs-banner', { opacity: 0, duration: 0.7, ease: 'power2.inOut' }, '<');
  }

  return { init, enter };

})();
