// ============================================================
//  Rise and Shine — Screen Manager + Boot
// ============================================================

// ── Global Game State ────────────────────────────────────────
window.GameState = {
  character:    null,
  byte:         null,
  playerHp:     null,   // null = use character max HP on first entry
  playerMaxHp:  null,   // null = use character base HP; increases after boss clear
  byteCharge:   0,      // companion skill charge carries between battles
  currentLevel: null,   // set by prelimMap before entering battle
};

// ── Screen Manager ────────────────────────────────────────────
window.ScreenManager = (() => {

  let _current = null;
  let _transitioning = false;

  const SCREEN_IDS = [
    'preloader',
    'main-menu',
    'intro',
    'char-select',
    'byte-select',
    'title-card',
    'prelim-map',
    'cutscene',
    'vs-banner',
    'battle',
  ];

  function showOnly(id) {
    SCREEN_IDS.forEach(sid => {
      const el = document.getElementById(`screen-${sid}`);
      if (!el) return;
      if (sid === id) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });
  }

  async function goTo(targetId, opts = {}) {
    if (_transitioning) return;
    _transitioning = true;

    const overlay = document.getElementById('fade-overlay');

    // Fade to black
    await gsap.to(overlay, { opacity: 1, duration: 0.4, ease: 'power2.inOut' });
    overlay.style.pointerEvents = 'all';

    // Swap visible screen
    showOnly(targetId);
    _current = targetId;

    // Run onEnter callback immediately after swap while screen is black!
    if (typeof opts.onEnter === 'function') {
      opts.onEnter();
    }

    // Brief cinematic hold
    await new Promise(r => setTimeout(r, 80));

    // Fade from black
    await gsap.to(overlay, { opacity: 0, duration: 0.55, ease: 'power2.out' });
    overlay.style.pointerEvents = 'none';

    _transitioning = false;
  }

  return {
    goTo,
    setCurrent(id) { _current = id; },
    get currentScreen() { return _current; },
  };

})();

// ── Boot Sequence ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {

  // Init all screens — registers static event listeners
  MainMenuScreen.init();
  IntroVideoScreen.init();
  CharSelectScreen.init();
  ByteSelectScreen.init();
  TitleCardScreen.init();
  PrelimMapScreen.init();
  CutsceneScreen.init();
  VSBannerScreen.init();
  BattleScreen.init();
  PreloaderScreen.init();
  SettingsScreen.init();

  // Boot: start on the preloader screen for centralized asset load tracking
  showFirstScreen();

  function showFirstScreen() {
    const overlay = document.getElementById('fade-overlay');
    const preloaderScreen = document.getElementById('screen-preloader');
    
    preloaderScreen.classList.remove('hidden');
    window.ScreenManager.setCurrent('preloader');

    // Fade in overlay to show the preloader screen
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      onComplete: () => {
        overlay.style.pointerEvents = 'none';
        
        // Start asset preloader progress
        PreloaderScreen.start(() => {
          // Transition: preloader -> main menu
          window.ScreenManager.goTo('main-menu', {
            onEnter: () => {
              AudioManager.playBGM('menu', { volume: 0.5 });
              MainMenuScreen.animateEntrance();
            }
          });
        });
      }
    });
  }
});
