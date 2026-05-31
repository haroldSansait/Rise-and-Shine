// ============================================================
//  Title Card Screen — "Prelim Arc — The First Awakening"
// ============================================================

window.TitleCardScreen = (() => {

  let autoTimer = null;

  function enter() {
    // Kill any pending timer
    if (autoTimer) clearTimeout(autoTimer);

    // Reset elements
    gsap.set(['#title-arc', '#title-divider', '#title-sub', '#title-tagline'], {
      opacity: 0, y: 20
    });
    gsap.set('#title-divider', { scaleX: 0, y: 0 });

    // Stagger-in cinematic sequence
    const tl = gsap.timeline();

    tl.to('#title-arc', {
      opacity: 1, y: 0,
      duration: 1.0,
      ease: 'power3.out',
      delay: 0.6,
    })
    .to('#title-divider', {
      opacity: 1, scaleX: 1,
      duration: 0.8,
      ease: 'power2.inOut',
    }, '-=0.2')
    .to('#title-sub', {
      opacity: 1, y: 0,
      duration: 0.9,
      ease: 'power3.out',
    }, '-=0.3')
    .to('#title-tagline', {
      opacity: 1, y: 0,
      duration: 0.7,
      ease: 'power2.out',
    }, '-=0.2');

    // Auto-advance after 4.5s total
    autoTimer = setTimeout(() => {
      advance();
    }, 5000);

    // Allow click to skip
    const el = document.getElementById('screen-title-card');
    const skipFn = () => {
      el.removeEventListener('click', skipFn);
      if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
      advance();
    };
    // Attach after a brief delay so the click that confirmed byte doesn't fire this
    setTimeout(() => el.addEventListener('click', skipFn), 800);
  }

  function advance() {
    window.ScreenManager.goTo('prelim-map', { onEnter: () => PrelimMapScreen.enter() });
  }

  function init() {
    // Nothing to do on init — enter() drives everything
  }

  return { init, enter };
})();
