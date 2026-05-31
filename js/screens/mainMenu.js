// ============================================================
//  Main Menu Screen
// ============================================================

window.MainMenuScreen = (() => {

  let _initialized = false;

  // Called once on DOMContentLoaded — registers event listeners
  function init() {
    if (_initialized) return;
    _initialized = true;

    const btnStart = document.getElementById('btn-start');

    // ── Button hover ─────────────────────────────────────
    btnStart.addEventListener('mouseenter', () => {
      gsap.to(btnStart, { scale: 1.07, duration: 0.18, ease: 'power2.out' });
    });
    btnStart.addEventListener('mouseleave', () => {
      gsap.to(btnStart, { scale: 1, duration: 0.18, ease: 'power2.in' });
    });

    // ── Click: go to intro video ─────────────────────────
    btnStart.addEventListener('click', () => {
      AudioManager.playClickSFX();
      gsap.to(btnStart, {
        scale: 0.94, duration: 0.08, yoyo: true, repeat: 1,
        onComplete: () => {
          window.ScreenManager.goTo('intro', {
            onEnter: () => IntroVideoScreen.play()
          });
        }
      });
    });
  }

  // Called by main.js after the boot fade-in completes
  function animateEntrance() {
    const btnStart = document.getElementById('btn-start');

    // Kill any lingering float tween
    gsap.killTweensOf('#menu-logo');

    // Entrance
    const tl = gsap.timeline();
    tl.fromTo('#menu-logo',
      { opacity: 0, scale: 0.88, y: 0 },
      { opacity: 1, scale: 1, duration: 1.1, ease: 'power3.out' }
    )
    .fromTo(btnStart,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
      '-=0.5'
    )
    .fromTo('#menu-press-hint',
      { opacity: 0 },
      { opacity: 1, duration: 0.7 },
      '-=0.2'
    )
    .call(() => {
      // Start idle float after entrance
      gsap.to('#menu-logo', {
        y: -14, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1
      });
    });
  }

  function enter() {
    AudioManager.playBGM('menu', { volume: 0.5 });
    animateEntrance();
  }

  return { init, animateEntrance, enter };
})();
