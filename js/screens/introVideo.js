// ============================================================
//  Intro Video Screen
// ============================================================

window.IntroVideoScreen = (() => {

  let initialized = false;

  function init() {
    const video    = document.getElementById('intro-video');
    const btnSkip  = document.getElementById('btn-skip-intro');

    // ── Skip button ───────────────────────────────────────
    btnSkip.addEventListener('click', advance);

    // ── Video end ─────────────────────────────────────────
    video.addEventListener('ended', advance);

    // ── Error fallback ────────────────────────────────────
    video.addEventListener('error', () => {
      console.warn('[IntroVideo] Video failed to load — skipping to char select');
      advance();
    });
  }

  function play() {
    const video = document.getElementById('intro-video');

    // Fade in skip button after 2s
    const btnSkip = document.getElementById('btn-skip-intro');
    btnSkip.style.opacity = '0';
    gsap.to(btnSkip, { opacity: 1, duration: 0.6, delay: 2 });

    // Attempt to play
    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('[IntroVideo] Autoplay blocked:', err);
        // Show a "tap to play" overlay fallback
        showPlayPrompt(video);
      });
    }

    // Stop menu BGM during video
    AudioManager.stopBGM(600);
  }

  function showPlayPrompt(video) {
    const prompt = document.createElement('div');
    prompt.id = 'play-prompt';
    prompt.className = 'absolute inset-0 flex flex-col items-center justify-center z-30 cursor-pointer';
    prompt.innerHTML = `
      <div class="text-white font-pixel text-xs mb-4 opacity-70">Click to play intro</div>
      <div class="text-6xl animate-pulse">▶</div>
    `;
    prompt.addEventListener('click', () => {
      video.play();
      prompt.remove();
    });
    document.getElementById('screen-intro').appendChild(prompt);
  }

  function advance() {
    AudioManager.stopBGM(400);
    const video = document.getElementById('intro-video');
    video.pause();
    window.ScreenManager.goTo('char-select', { onEnter: () => CharSelectScreen.enter() });
  }

  if (!initialized) {
    initialized = true;
    // defer init until DOM is ready (called from main.js)
  }

  return { init, play };
})();
