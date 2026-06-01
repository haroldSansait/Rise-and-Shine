// ============================================================
//  Byte Select Screen
// ============================================================

window.ByteSelectScreen = (() => {

  // Use allBytes but only show ones unlocked at game start
  const bytes   = (window.GAME_DATA.allBytes ?? window.GAME_DATA.starterBytes).filter(b => b.unlockedAtStart);
  const MAX_HP  = window.GAME_DATA.BYTE_MAX_HP;
  const MAX_DMG = window.GAME_DATA.BYTE_MAX_DMG;

  let currentIndex = 0;
  let confirmed    = false;
  let cryTimeout   = null;

  // ── Build carousel ────────────────────────────────────────
  function buildCarouselDOM() {
    const track = document.getElementById('byte-carousel-track');
    track.innerHTML = '';

    bytes.forEach((byte, idx) => {
      const isActive = idx === 0;
      const card = document.createElement('div');
      card.id = `byte-card-${idx}`;
      card.className = `byte-card ${isActive 
        ? 'byte-card-active w-[170px] short:w-[130px] xshort:w-[110px]' 
        : 'byte-card-inactive w-[130px] short:w-[100px] xshort:w-[85px]'}`;
      card.dataset.idx = idx;

      card.innerHTML = `
        <div class="byte-card-glow"></div>
        <div class="byte-icon-badge">${byte.icon}</div>
        <div class="byte-card-img-wrap">
          <img src="${byte.image}" alt="${byte.name}" class="byte-card-img">
        </div>
        <div class="byte-card-name" style="color: ${byte.color}">${byte.name}</div>
        <div class="byte-card-role">${byte.role}</div>
      `;

      // Apply per-byte active glow immediately for the first card
      if (isActive) {
        card.style.borderColor = byte.color;
        card.style.boxShadow   = `0 0 28px ${byte.color}66, 0 12px 36px rgba(0,0,0,0.7)`;
        card.style.background  = `${byte.color}0f`;
        const glowEl = card.querySelector('.byte-card-glow');
        if (glowEl) {
          glowEl.style.background = `radial-gradient(ellipse at 50% 30%, ${byte.color}30, transparent 70%)`;
        }
      }

      card.addEventListener('click', () => {
        if (idx !== currentIndex) {
          AudioManager.playSelectSFX();
          setActiveIndex(idx);
        }
      });

      track.appendChild(card);
    });
  }

  function setActiveIndex(idx) {
    currentIndex = idx;

    // Update card classes and per-byte active styling
    bytes.forEach((byte, i) => {
      const card = document.getElementById(`byte-card-${i}`);
      if (!card) return;
      card.classList.remove(
        'byte-card-active', 'byte-card-inactive',
        'w-[170px]', 'short:w-[130px]', 'xshort:w-[110px]',
        'w-[130px]', 'short:w-[100px]', 'xshort:w-[85px]'
      );

      if (i === idx) {
        card.classList.add('byte-card-active', 'w-[170px]', 'short:w-[130px]', 'xshort:w-[110px]');
        // Apply byte-specific glow dynamically
        card.style.borderColor  = byte.color;
        card.style.boxShadow    = `0 0 28px ${byte.color}66, 0 12px 36px rgba(0,0,0,0.7)`;
        card.style.background   = `${byte.color}0f`;
        // Update glow element
        const glowEl = card.querySelector('.byte-card-glow');
        if (glowEl) {
          glowEl.style.background = `radial-gradient(ellipse at 50% 30%, ${byte.color}30, transparent 70%)`;
        }
      } else {
        card.classList.add('byte-card-inactive', 'w-[130px]', 'short:w-[100px]', 'xshort:w-[85px]');
        card.style.borderColor  = '';
        card.style.boxShadow    = '';
        card.style.background   = '';
      }
    });

    updateStats(bytes[idx]);

    // Play cry after brief debounce
    clearTimeout(cryTimeout);
    cryTimeout = setTimeout(() => {
      AudioManager.playByteCry(bytes[idx].id);
    }, 80);
  }

  // ── Stats panel ───────────────────────────────────────────
  function updateStats(byte) {
    const nameEl   = document.getElementById('byte-name-display');
    const roleEl   = document.getElementById('byte-role-display');
    const descEl   = document.getElementById('byte-role-desc');
    const hpFill   = document.getElementById('byte-hp-fill');
    const dmgFill  = document.getElementById('byte-dmg-fill');
    const hpVal    = document.getElementById('byte-hp-val');
    const dmgVal   = document.getElementById('byte-dmg-val');
    const skillBadge = document.getElementById('byte-skill-badge');
    const skillName  = document.getElementById('byte-skill-name');
    const skillBlock = document.getElementById('byte-skill-desc-block');
    const skillEffect= document.getElementById('byte-skill-effect');
    const skillIcon  = document.getElementById('byte-skill-icon');

    gsap.fromTo('#byte-stats-panel',
      { opacity: 0.5, y: 8 },
      { opacity: 1,   y: 0, duration: 0.35, ease: 'power2.out' }
    );

    nameEl.textContent = byte.name;
    nameEl.style.color = byte.color;
    roleEl.textContent = byte.role;
    if (descEl) descEl.textContent = byte.roleDesc;

    const hpPct  = (byte.hp  / MAX_HP)  * 100;
    const dmgPct = (byte.dmg / MAX_DMG) * 100;

    gsap.to(hpFill,  { width: `${hpPct}%`,  duration: 0.55, ease: 'power2.out' });
    gsap.to(dmgFill, { width: `${dmgPct}%`, duration: 0.55, ease: 'power2.out' });

    gsap.fromTo({ v: 0 }, { v: 0 }, {
      v: byte.hp, duration: 0.5,
      onUpdate: function() { hpVal.textContent = Math.round(this.targets()[0].v); },
      ease: 'power2.out'
    });
    gsap.fromTo({ v: 0 }, { v: 0 }, {
      v: byte.dmg, duration: 0.5,
      onUpdate: function() { dmgVal.textContent = Math.round(this.targets()[0].v); },
      ease: 'power2.out'
    });

    // Skill badge
    skillBadge.classList.remove('hidden');
    skillName.textContent = byte.skill;
    skillBadge.style.borderColor = byte.color + '60';
    if (skillIcon) skillIcon.textContent = byte.icon;

    skillBlock.classList.remove('hidden');
    skillEffect.textContent = byte.skillEffect;

    // Enable confirm
    document.getElementById('btn-byte-confirm').disabled = false;
    document.getElementById('btn-byte-confirm').classList.remove('opacity-40');
  }

  // ── Arrow navigation ──────────────────────────────────────
  function prevByte() {
    AudioManager.playSelectSFX();
    const n = bytes.length;
    setActiveIndex((currentIndex - 1 + n) % n);
  }

  function nextByte() {
    AudioManager.playSelectSFX();
    setActiveIndex((currentIndex + 1) % bytes.length);
  }

  // ── Enter animation ───────────────────────────────────────
  function enter() {
    confirmed    = false;
    currentIndex = 0;

    // Reset cards
    bytes.forEach((_, i) => {
      const card = document.getElementById(`byte-card-${i}`);
      if (!card) return;
      card.classList.remove(
        'byte-card-active', 'byte-card-inactive',
        'w-[170px]', 'short:w-[130px]', 'xshort:w-[110px]',
        'w-[130px]', 'short:w-[100px]', 'xshort:w-[85px]'
      );
      if (i === 0) {
        card.classList.add('byte-card-active', 'w-[170px]', 'short:w-[130px]', 'xshort:w-[110px]');
      } else {
        card.classList.add('byte-card-inactive', 'w-[130px]', 'short:w-[100px]', 'xshort:w-[85px]');
      }
    });

    updateStats(bytes[0]);

    gsap.fromTo('#screen-byte-select .relative.z-10',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.1 }
    );

    // Play first byte's cry on enter
    setTimeout(() => AudioManager.playByteCry(bytes[0].id), 500);
  }

  // ── Init ──────────────────────────────────────────────────
  function init() {
    buildCarouselDOM();
    updateStats(bytes[0]);

    document.getElementById('byte-prev').addEventListener('click', prevByte);
    document.getElementById('byte-next').addEventListener('click', nextByte);

    document.getElementById('btn-byte-confirm').addEventListener('click', () => {
      if (confirmed) return;
      confirmed = true;
      AudioManager.playConfirmSFX();
      const selectedByte = bytes[currentIndex];
      window.GameState.byte = selectedByte;
      // Save character and byte to localStorage
      const char = window.GameState.character;
      if (char) SaveSystem.saveCharacter(char.id, char.hp);
      SaveSystem.equipByte(selectedByte.id);
      window.ScreenManager.goTo('title-card', { onEnter: () => TitleCardScreen.enter() });
    });

    document.getElementById('btn-byte-back').addEventListener('click', () => {
      AudioManager.playBackSFX();
      window.ScreenManager.goTo('char-select', { onEnter: () => CharSelectScreen.enter() });
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (window.ScreenManager.currentScreen !== 'byte-select') return;
      if (e.key === 'ArrowLeft')  prevByte();
      if (e.key === 'ArrowRight') nextByte();
      if (e.key === 'Enter') document.getElementById('btn-byte-confirm').click();
    });
  }

  return { init, enter };
})();
