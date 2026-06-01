// ============================================================
//  Arc Selection Screen Module
// ============================================================

window.ArcSelectScreen = (() => {

  let _initialized = false;
  let _isAnimating = false;

  // ── Parallax Background ────────────────────────────────────
  function setupParallax() {
    const screenEl = document.getElementById('screen-arc-select');
    const bgEl     = document.getElementById('arc-select-bg');
    
    if (screenEl && bgEl) {
      screenEl.addEventListener('mousemove', (e) => {
        if (window.ScreenManager.currentScreen !== 'arc-select') return;
        
        const { clientX: x, clientY: y } = e;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const moveX = (x / w - 0.5) * -20;
        const moveY = (y / h - 0.5) * -20;
        
        gsap.to(bgEl, {
          x: moveX,
          y: moveY,
          duration: 0.6,
          ease: 'power2.out'
        });
      });
    }
  }

  // ── Show Coming Soon Overlay ───────────────────────────────
  function showComingSoon() {
    if (_isAnimating) return;
    
    const overlay = document.getElementById('arc-coming-soon-overlay');
    if (!overlay) return;

    AudioManager.playConfirmSFX();
    overlay.classList.remove('hidden');
    
    // Scale & fade in
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
    
    const panel = overlay.querySelector('.glass-panel');
    if (panel) {
      gsap.fromTo(panel, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.15)' });
    }
  }

  function closeComingSoon() {
    const overlay = document.getElementById('arc-coming-soon-overlay');
    if (!overlay) return;

    AudioManager.playBackSFX();
    
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        overlay.classList.add('hidden');
      }
    });
  }

  // ── Unlocking Animation Cinematic ─────────────────────────
  function playMidtermUnlock() {
    _isAnimating = true;

    const overlay = document.getElementById('midterm-lock-overlay');
    const badge   = document.getElementById('midterm-unlocked-badge');
    const title   = document.getElementById('midterm-card-title');
    const sub     = document.getElementById('midterm-card-sub');
    const desc    = document.getElementById('midterm-card-desc');
    const action  = document.getElementById('midterm-card-action');
    const card    = document.getElementById('arc-card-midterm');

    // Reset initial locked state
    if (overlay) overlay.style.opacity = '1';
    if (badge) badge.classList.add('hidden');
    if (card) {
      card.classList.remove('arc-card-active', 'arc-card-midterm-active');
      card.style.borderColor = 'rgba(255, 255, 255, 0.08)';
    }
    
    // Play diagnostic power-up SFX
    setTimeout(() => {
      AudioManager.playByteCry('voltbyte'); // voltbyte beep fits perfectly!
    }, 400);

    const tl = gsap.timeline({
      onComplete: () => {
        _isAnimating = false;
        
        // Show Coming Soon popup after unlock completes
        setTimeout(() => {
          showComingSoon();
        }, 300);
      }
    });

    // 1. Target & highlight Midterm Card
    tl.to(card, {
      scale: 1.04,
      borderColor: 'rgba(34, 211, 238, 0.6)',
      boxShadow: '0 0 30px rgba(34, 211, 238, 0.4)',
      duration: 0.6,
      ease: 'power3.out'
    })
    // 2. Flash scan effect / break lock
    .to(overlay, {
      opacity: 0,
      duration: 0.9,
      ease: 'power2.inOut',
      delay: 0.2,
      onStart: () => {
        AudioManager.playConfirmSFX();
      }
    })
    // 3. Reveal unlocked styles
    .call(() => {
      if (badge) badge.classList.remove('hidden');
      if (title) {
        title.style.color = '#e2e8f0';
        title.classList.remove('text-white/25');
        title.classList.add('text-white');
      }
      if (sub) {
        sub.style.color = '#22d3ee';
        sub.classList.remove('text-white/15');
        sub.classList.add('text-cyan-400');
      }
      if (desc) {
        desc.classList.remove('text-white/35');
        desc.classList.add('text-white/70');
      }
      if (action) {
        action.innerHTML = '✦ COMING SOON';
        action.classList.remove('text-white/25');
        action.classList.add('text-cyan-400');
      }
      if (card) {
        card.classList.add('arc-card-active', 'arc-card-midterm-active');
      }
    })
    // 4. Return scale to normal
    .to(card, {
      scale: 1,
      borderColor: 'rgba(34, 211, 238, 0.3)',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
      duration: 0.4,
      ease: 'power2.out'
    });
  }

  // ── Enter Animation ────────────────────────────────────────
  function enter(triggerUnlockAnimation = false) {
    _isAnimating = false;

    // Apply main menu overlay fade-in
    gsap.fromTo('#screen-arc-select .relative.z-10',
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out', delay: 0.1 }
    );

    AudioManager.playBGM('prelimMap', { volume: 0.4 });

    const overlay = document.getElementById('midterm-lock-overlay');
    const badge   = document.getElementById('midterm-unlocked-badge');
    const title   = document.getElementById('midterm-card-title');
    const sub     = document.getElementById('midterm-card-sub');
    const desc    = document.getElementById('midterm-card-desc');
    const action  = document.getElementById('midterm-card-action');
    const card    = document.getElementById('arc-card-midterm');

    if (triggerUnlockAnimation) {
      // Setup initial locked visuals for unlocking animation
      if (overlay) overlay.style.opacity = '1';
      if (badge) badge.classList.add('hidden');
      if (card) {
        card.classList.remove('arc-card-active', 'arc-card-midterm-active');
        card.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      }
      
      // Delay animation sequence slightly to wait for screen transition fade
      setTimeout(() => {
        playMidtermUnlock();
      }, 700);
    } else {
      // Render as unlocked already
      if (overlay) overlay.style.opacity = '0';
      if (badge) badge.classList.remove('hidden');
      if (title) {
        title.style.color = '#e2e8f0';
        title.classList.remove('text-white/25');
        title.classList.add('text-white');
      }
      if (sub) {
        sub.style.color = '#22d3ee';
        sub.classList.remove('text-white/15');
        sub.classList.add('text-cyan-400');
      }
      if (desc) {
        desc.classList.remove('text-white/35');
        desc.classList.add('text-white/70');
      }
      if (action) {
        action.innerHTML = '✦ COMING SOON';
        action.classList.remove('text-white/25');
        action.classList.add('text-cyan-400');
      }
      if (card) {
        card.classList.add('arc-card-active', 'arc-card-midterm-active');
      }
    }
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    if (_initialized) return;
    _initialized = true;

    setupParallax();

    // Prelim card navigation -> routes back to Prelim Map
    const prelimCard = document.getElementById('arc-card-prelim');
    if (prelimCard) {
      prelimCard.addEventListener('click', () => {
        if (_isAnimating) return;
        AudioManager.playConfirmSFX();
        window.ScreenManager.goTo('prelim-map', {
          onEnter: () => PrelimMapScreen.enter()
        });
      });
    }

    // Midterm card click -> triggers coming soon overlay if unlocked
    const midtermCard = document.getElementById('arc-card-midterm');
    if (midtermCard) {
      midtermCard.addEventListener('click', () => {
        if (_isAnimating) return;
        const progress = SaveSystem.load().prelimProgress;
        if (progress >= 5) {
          showComingSoon();
        }
      });
    }

    // Back to map button
    const backBtn = document.getElementById('btn-arc-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (_isAnimating) return;
        AudioManager.playBackSFX();
        window.ScreenManager.goTo('prelim-map', {
          onEnter: () => PrelimMapScreen.enter()
        });
      });
    }

    // Coming soon dismiss button
    const modalClose = document.getElementById('btn-coming-soon-close');
    if (modalClose) {
      modalClose.addEventListener('click', closeComingSoon);
    }

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (window.ScreenManager.currentScreen !== 'arc-select') return;
      if (e.key === 'Escape') {
        const overlay = document.getElementById('arc-coming-soon-overlay');
        if (overlay && !overlay.classList.contains('hidden')) {
          closeComingSoon();
        } else {
          backBtn?.click();
        }
      }
    });
  }

  return { init, enter };
})();
