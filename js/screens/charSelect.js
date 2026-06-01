// ============================================================
//  Character Select Screen
// ============================================================

window.CharSelectScreen = (() => {

  const chars = window.GAME_DATA.characters;
  const MAX_HP  = window.GAME_DATA.CHARACTER_MAX_HP;
  const MAX_DMG = window.GAME_DATA.CHARACTER_MAX_DMG;

  let currentIndex = 0;
  let confirmed    = false;

  const CHAR_THEMES = {
    mj: { color: '#f9c159', glow: 'rgba(249,193,89,0.4)', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    harold: { color: '#38bdf8', glow: 'rgba(56,189,248,0.4)', badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
    bai: { color: '#fb923c', glow: 'rgba(251,146,60,0.4)', badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    dale: { color: '#2dd4bf', glow: 'rgba(45,212,191,0.4)', badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
    paps: { color: '#a78bfa', glow: 'rgba(167,139,250,0.4)', badgeClass: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
    bebz: { color: '#34d399', glow: 'rgba(52,211,153,0.4)', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    matt: { color: '#f43f5e', glow: 'rgba(244,63,94,0.4)', badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    jb: { color: '#fbbf24', glow: 'rgba(251,191,36,0.4)', badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' }
  };

  // ── Render Carousel ───────────────────────────────────────
  function updateCarousel(animate = true) {
    const track = document.getElementById('char-carousel-track');
    if (!track) return;
    
    const container = track.parentElement;
    const cards = track.children;
    if (cards.length === 0) return;

    // Apply active/inactive classes and effects
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const img = card.querySelector('.char-card-img');
      
      if (i === currentIndex) {
        card.classList.remove('char-card-inactive');
        card.classList.add('char-card-active');
        
        if (img) {
          gsap.to(img, { y: -6, scale: 1.06, duration: 0.4, ease: 'power2.out' });
        }
        
        card.querySelectorAll('.corner-indicator').forEach(c => {
          c.classList.remove('border-white/20');
          c.classList.add('border-gold/60');
        });
      } else {
        card.classList.remove('char-card-active');
        card.classList.add('char-card-inactive');
        
        if (img) {
          gsap.to(img, { y: 0, scale: 0.94, duration: 0.4, ease: 'power2.out' });
        }

        card.querySelectorAll('.corner-indicator').forEach(c => {
          c.classList.remove('border-gold/60');
          c.classList.add('border-white/20');
        });
      }
    }

    // Centering calculation
    const activeCard = cards[currentIndex];
    const containerWidth = container.offsetWidth;
    const activeCenter = activeCard.offsetLeft + activeCard.offsetWidth / 2;
    const targetX = containerWidth / 2 - activeCenter;

    if (animate) {
      gsap.to(track, {
        x: targetX,
        duration: 0.5,
        ease: 'power3.out'
      });
    } else {
      gsap.set(track, { x: targetX });
    }

    // Refresh UI accessories
    updateIndicatorDots();
    updateStats(chars[currentIndex]);
  }

  // ── Build DOM ──────────────────────────────────────────────
  function buildCarouselDOM() {
    const track = document.getElementById('char-carousel-track');
    if (!track) return;
    
    track.innerHTML = '';

    chars.forEach((char, index) => {
      const wrap = document.createElement('div');
      wrap.className = 'char-card char-card-inactive w-[170px] short:w-[130px] xshort:w-[110px]';
      wrap.dataset.index = index;

      // Premium corner pixel details
      ['top-1 left-1 border-t border-l', 'top-1 right-1 border-t border-r', 
       'bottom-1 left-1 border-b border-l', 'bottom-1 right-1 border-b border-r'].forEach(pos => {
        const corner = document.createElement('div');
        corner.className = `corner-indicator absolute w-1.5 h-1.5 border-white/20 pointer-events-none transition-colors duration-300 ${pos.split(' ')[0]} ${pos.split(' ')[1]} ${pos.split(' ').slice(2).join(' ')}`;
        wrap.appendChild(corner);
      });

      const imgWrap = document.createElement('div');
      imgWrap.className = 'char-card-img-wrap';

      // Scanline overlay
      const scanlines = document.createElement('div');
      scanlines.className = 'absolute inset-0 bg-scanlines pointer-events-none opacity-[0.03]';
      imgWrap.appendChild(scanlines);

      const img = document.createElement('img');
      img.className = 'char-card-img relative z-10';
      img.src = char.image;
      img.alt = char.name;

      const name = document.createElement('div');
      name.className = 'char-card-name';
      name.textContent = char.name;

      imgWrap.appendChild(img);
      wrap.appendChild(imgWrap);
      wrap.appendChild(name);
      track.appendChild(wrap);

      // Click for navigation
      wrap.addEventListener('click', () => {
        if (index === currentIndex) return;
        AudioManager.playSelectSFX();
        navigateTo(index);
      });
    });
  }

  function navigateTo(newIndex) {
    currentIndex = newIndex;
    updateCarousel(true);
  }

  function prevChar() {
    AudioManager.playSelectSFX();
    const n = chars.length;
    navigateTo((currentIndex - 1 + n) % n);
  }

  function nextChar() {
    AudioManager.playSelectSFX();
    const n = chars.length;
    navigateTo((currentIndex + 1) % n);
  }

  // ── Page accessories ───────────────────────────────────────
  function updateIndicatorDots() {
    const dotsContainer = document.getElementById('char-indicator-dots');
    const indexCounter = document.getElementById('char-index-counter');
    
    if (indexCounter) {
      indexCounter.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(chars.length).padStart(2, '0')}`;
    }

    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      chars.forEach((_, idx) => {
        const dot = document.createElement('span');
        dot.textContent = idx === currentIndex ? '◆' : '◇';
        dot.className = idx === currentIndex 
          ? 'text-gold drop-shadow-[0_0_4px_var(--gold-glow)] transition-all scale-125 font-bold cursor-pointer' 
          : 'text-white/30 transition-all hover:text-white/60 cursor-pointer';
        
        dot.addEventListener('click', () => {
          if (idx === currentIndex) return;
          AudioManager.playSelectSFX();
          navigateTo(idx);
        });
        dotsContainer.appendChild(dot);
      });
    }
  }

  // ── Update stats panel ────────────────────────────────────
  function updateStats(char) {
    const theme = CHAR_THEMES[char.id] || { color: '#f9c159', glow: 'rgba(249,193,89,0.4)', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };

    const nameEl = document.getElementById('char-name-display');
    nameEl.textContent = char.name;
    nameEl.style.color = theme.color;
    nameEl.style.textShadow = `0 0 10px ${theme.glow}`;

    const roleEl = document.getElementById('char-role-display');
    roleEl.textContent = char.role;
    roleEl.className = `font-pixel text-[8px] uppercase tracking-wider px-3 py-1 rounded-sm border inline-block mt-1.5 transition-all duration-300 ${theme.badgeClass}`;

    document.getElementById('char-desc-display').textContent = char.roleDesc;

    // Update passive block details
    const passiveBlock = document.getElementById('char-passive-block');
    const passiveName = document.getElementById('char-passive-name');
    const passiveDesc = document.getElementById('char-passive-desc');
    if (passiveBlock && passiveName && passiveDesc) {
      if (char.passiveName && char.passiveDesc) {
        passiveBlock.classList.remove('hidden');
        passiveName.textContent = char.passiveName;
        passiveDesc.textContent = char.passiveDesc;
        passiveName.style.color = theme.color;
      } else {
        passiveBlock.classList.add('hidden');
      }
    }

    const hpPct  = (char.hp  / MAX_HP)  * 100;
    const dmgPct = (char.dmg / MAX_DMG) * 100;

    gsap.to('#char-hp-fill',  { width: `${hpPct}%`,  duration: 0.55, ease: 'power2.out' });
    gsap.to('#char-dmg-fill', { width: `${dmgPct}%`, duration: 0.55, ease: 'power2.out' });

    const hpEl  = document.getElementById('char-hp-val');
    const dmgEl = document.getElementById('char-dmg-val');

    // Dynamic stats text colors
    hpEl.style.color = theme.color;
    dmgEl.style.color = theme.color;

    // Animate numbers
    const startHp  = parseInt(hpEl.dataset.val  || char.hp);
    const startDmg = parseInt(dmgEl.dataset.val || char.dmg);

    gsap.fromTo({ v: startHp },  { v: startHp  }, { v: char.hp,  duration: 0.5, onUpdate: function() { hpEl.textContent  = Math.round(this.targets()[0].v); }, ease: 'power2.out' });
    gsap.fromTo({ v: startDmg }, { v: startDmg }, { v: char.dmg, duration: 0.5, onUpdate: function() { dmgEl.textContent = Math.round(this.targets()[0].v); }, ease: 'power2.out' });

    hpEl.dataset.val  = char.hp;
    dmgEl.dataset.val = char.dmg;

    // Dynamic stats panel border/glow highlight
    gsap.fromTo('#char-stats-panel',
      { borderColor: 'rgba(255,255,255,0.08)' },
      { borderColor: theme.color + '30', boxShadow: `0 0 16px ${theme.color}15, 0 8px 32px rgba(0,0,0,0.5)`, duration: 0.4 }
    );

    // Enable confirm
    document.getElementById('btn-char-confirm').disabled = false;
    document.getElementById('btn-char-confirm').classList.remove('opacity-40');
  }

  // ── Enter animation ───────────────────────────────────────
  function enter() {
    confirmed = false;
    document.getElementById('btn-char-confirm').disabled = false;

    gsap.fromTo('#screen-char-select .relative.z-10',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.1 }
    );

    AudioManager.playBGM('menu', { volume: 0.35 });

    // Initial centering delay to let DOM measure offsets cleanly
    setTimeout(() => {
      updateCarousel(false);
    }, 50);
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    buildCarouselDOM();
    updateCarousel(false);

    document.getElementById('char-prev').addEventListener('click', prevChar);
    document.getElementById('char-next').addEventListener('click', nextChar);

    document.getElementById('btn-char-confirm').addEventListener('click', () => {
      if (confirmed) return;
      confirmed = true;
      AudioManager.playConfirmSFX();
      window.GameState.character = chars[currentIndex];
      window.ScreenManager.goTo('byte-select', { onEnter: () => ByteSelectScreen.enter() });
    });

    document.getElementById('btn-char-back').addEventListener('click', () => {
      AudioManager.playBackSFX();
      window.ScreenManager.goTo('main-menu', { onEnter: () => AudioManager.playBGM('menu') });
    });

    // Arrow keyboard support
    document.addEventListener('keydown', (e) => {
      if (window.ScreenManager.currentScreen !== 'char-select') return;
      if (e.key === 'ArrowLeft')  prevChar();
      if (e.key === 'ArrowRight') nextChar();
      if (e.key === 'Enter') document.getElementById('btn-char-confirm').click();
    });

    // Window resize layout centering alignment
    window.addEventListener('resize', () => {
      if (window.ScreenManager.currentScreen === 'char-select') {
        updateCarousel(false);
      }
    });
  }

  return { init, enter };
})();
