// ============================================================
//  Rise and Shine — Battle System (Level 1: Bit Mite)
//
//  Sprite animation: CSS steps(4) via .sprite-sheet class.
//    - Idle:   spriteIdle 0.9s steps(4) infinite
//    - Attack: spriteAttackOnce 0.5s steps(4) forwards
//  Attack swap:  src swap → force reflow → class toggle
//
//  Tutorial questions: hardcoded first 2 (guaranteed correct topics)
//  Remaining 8:       randomized from PRELIM_BANK
//
//  Typewriter (cutscene) is handled in cutscene.js.
//  Damage numbers, particles, and HP bars are handled here.
// ============================================================

window.BattleScreen = (() => {

  // ── State ────────────────────────────────────────────────
  let _levelData    = null;
  let _questions    = [];
  let _currentQ     = 0;
  let _playerMaxHp  = 0;
  let _playerHp     = 0;
  let _enemyMaxHp   = 45;
  let _enemyHp      = 45;
  let _selectedAns  = null;
  let _isAnimating  = false;
  let _idleInterval = null;
  let _tutorialSeen = {};   // { 1: bool, 2: bool }
  let _correctStreak = 0;   // Consecutive correct answer streak
  let _timerInterval = null;
  let _timeLeft      = 0;
  let _maxTime       = 45;
  let _isPaused      = false;
  let _tutorialIndex = 0;
  let _pauseStartTime = null; // For pause duration limit

  // Byte Ability States
  let _byteCharge       = 0;
  let _byteMaxCharge    = 3;
  let _portShieldActive = false;
  let _burnTurns        = 0;
  let _weakenNextAttack = 1;
  const BURN_DAMAGE     = 8; // 8 burn damage per turn
  const MIN_DAMAGE      = 1; // Minimum damage to prevent softlock
  const MAX_DAMAGE      = 50; // Maximum damage for balance
  const MAX_PAUSE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Passive Ability Cooldown Tracking (one heal per 2 turns)
  let _passiveCooldowns = {
    bebz: 0,   // Clean Data Flow - heal on correct answer
    paps: 0,   // Auto-Repair Daemon - heal at turn end
    jb: 0,     // Recycle Protocol - heal on byte skill use
    lagoon: 0  // Lagoon byte skill healing
  };

  // Sprite path cache
  let _charSprites  = null; // { idle, battle }
  let _byteSprites  = null; // { idle, attack }
  let _enemySprites = null; // { idle, attack }

  // Enemy sprite paths are now dynamic — sourced from _levelData each enter()

  // ── Helpers ───────────────────────────────────────────────
  const _cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

  function _getCharSprites(char) {
    const name     = _cap(char.id);
    const idleFile = char.id === 'mj' ? 'Mj_idle' : `${name}_idle`;
    return {
      idle:   `playableCharacters/${name}/idle_sprites/${idleFile}.png`,
      battle: `playableCharacters/${name}/battle_sprites/${name}_battle.png`,
    };
  }

  function _getByteSprites(byte) {
    const name = _cap(byte.id);
    return {
      idle:   `bytes/${name}/${name}_idle.png`,
      attack: `bytes/${name}/${name}_attack.png`,
    };
  }

  // ── Sprite swap (steps(4) trick: remove class → reflow → re-add) ──
  function _swapToAttack(imgEl) {
    imgEl.classList.remove('sprite-attacking');
    void imgEl.offsetWidth;               // force browser reflow
    imgEl.classList.add('sprite-attacking');
  }

  function _revertToIdle(imgEl, idleSrc) {
    imgEl.classList.remove('sprite-attacking');
    const enemyWrapper = document.getElementById('battle-enemy-sprite-wrapper');
    if (enemyWrapper) {
      enemyWrapper.classList.remove('flip-attack');
    }
    void imgEl.offsetWidth;
    imgEl.src = idleSrc;
    // spriteIdle animation auto-restarts because class was never removed
  }

  // ── Byte intro icon map (emoji per byte id) ───────────────────
  // (Byte icons and colors come directly from each byte's data object — see data.js)

  // ── Byte intro overlay ─────────────────────────────────

  // Called after intro is dismissed — chains to tutorial or starts timer
  function _startBattleFlow() {
    if (_levelData?.id === 1 && !_tutorialSeen[1]) {
      _startTutorialFlow();
    } else {
      _startQuestionTimer();
    }
  }

  function _showByteIntro(byte, onDismiss) {
    const overlay = document.getElementById('byte-intro-overlay');
    if (!overlay) { onDismiss(); return; }

    // Read icon and color from the byte data object directly
    const icon         = byte.icon ?? '⚡';
    const byteColor    = byte.color ?? '#22d3ee';
    const chargesNeeded = byte.id === 'poturtle' ? 3 : 4;

    // Show profile image if available, otherwise fall back to emoji icon
    const introIconEl = document.getElementById('byte-intro-icon');
    const introImgEl  = document.getElementById('byte-intro-img');
    if (byte.image && introImgEl) {
      introImgEl.src = byte.image;
      introImgEl.style.borderColor = byteColor;
      introImgEl.classList.remove('hidden');
      if (introIconEl) introIconEl.classList.add('hidden');
    } else {
      if (introImgEl) introImgEl.classList.add('hidden');
      if (introIconEl) {
        introIconEl.textContent = icon;
        introIconEl.classList.remove('hidden');
      }
    }
    document.getElementById('byte-intro-name').textContent        = byte.name.toUpperCase();
    document.getElementById('byte-intro-role').textContent        = byte.roleDesc ?? 'Byte Companion';
    document.getElementById('byte-intro-skill-name').textContent  = byte.skill ?? 'Special Skill';
    document.getElementById('byte-intro-skill-effect').textContent = byte.skillEffect ?? '';
    document.getElementById('byte-intro-charge-line').textContent =
      `⚡ CHARGES NEEDED: ${chargesNeeded} correct answers`;
    document.getElementById('byte-intro-role-desc').textContent   =
      `Answer correctly to charge ${byte.name}'s skill. Once ready, tap the SKILL button next to your companion to unleash it!`;

    // Show with animation
    _isPaused = true;
    overlay.classList.remove('hidden');
    const card = overlay.querySelector('.glass-panel');
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    if (card) gsap.fromTo(card, { scale: 0.88, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.2)', delay: 0.05 });

    // Wire dismiss button (one-time)
    const btn = document.getElementById('btn-byte-intro-dismiss');
    if (btn) {
      const handler = () => {
        btn.removeEventListener('click', handler);
        AudioManager.playConfirmSFX();
        // Mark introduced in save
        SaveSystem.markByteIntroduced(byte.id);
        // Hide overlay
        gsap.to(overlay, {
          opacity: 0, duration: 0.25, ease: 'power2.in',
          onComplete: () => {
            overlay.classList.add('hidden');
            _isPaused = false;
            onDismiss();
          }
        });
      };
      btn.addEventListener('click', handler);
    }
  }

  // ── Question bank ─────────────────────────────────────────

  // Difficulty tier labels per level (easy → extreme)
  const LEVEL_DIFFICULTY = {
    1: { label: 'EASY',    color: '#4ade80' },
    2: { label: 'MEDIUM',  color: '#facc15' },
    3: { label: 'HARD',    color: '#fb923c' },
    4: { label: 'VERY HARD', color: '#f87171' },
    5: { label: 'EXTREME', color: '#e879f9' },
  };

  // Tracks which questions have been shown this battle to avoid repeats within a cycle
  let _usedQuestionIndices = new Set();
  let _questionPool        = [];   // full shuffled copy of the bank

  // Cryptographic randomness helper — returns float [0, 1) using crypto.getRandomValues()
  function _getSecureRandom() {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    // Normalize to [0, 1) — divide by max uint32 + 1
    return (array[0] >>> 0) / 0x100000000;
  }

  function _shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(_getSecureRandom() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function _buildQuestions() {
    const bank = _levelData?.questionsBank;
    if (bank && bank.length > 0) {
      // Shuffle the full bank — no cap, no slice
      _questionPool = _shuffleArray(bank);
    } else {
      // Fallback single question
      _questionPool = [
        {
          q: 'What does IT stand for?',
          choices: { A: 'Information Technology', B: 'Internet Technology',
                     C: 'Internal Tools',         D: 'Integrated Teaching' },
          answer: 'A',
        }
      ];
    }
    _usedQuestionIndices = new Set();
    _questions = _questionPool;
  }

  // ── Combat Tutorial System ─────────────────────────────────

  // Build slides dynamically so byte skill + hero passive reflect the actual player choices
  function _buildTutorialSlides() {
    const char = window.GameState.character;
    const byte = window.GameState.byte;

    return [
      {
        title: '✦ WELCOME TO LUMEN COMBAT ✦',
        text: 'Welcome to the LUMEN Network Core battle system! Your IT and coding knowledge is your greatest weapon here. Answer questions correctly to deal damage and defeat the corrupted Glitchborn enemies.',
        highlight: null,
        badge: null
      },
      {
        title: '❤ YOUR HP FUSION SYSTEM ❤',
        text: `Your life force is shown as Heart Containers at the top of the screen. Each heart = 10 HP. Your Max HP is a FUSION of your hero\'s HP and your Byte companion\'s HP combined. HP carries over between zones — protect it carefully!`,
        highlight: 'player-hearts-container',
        badge: null
      },
      {
        title: '⚔️ HERO PASSIVE ABILITY ⚔️',
        text: `Every hero has a unique passive ability that activates automatically during battle. Your hero ${char?.name ?? 'hero'} has the passive "${char?.passiveName ?? 'Hero Passive'}". Check the ALLY INFO PANEL on the left to read your passive description!`,
        highlight: 'battle-player-passive-box',
        badge: 'passive',
        passiveName: char?.passiveName ?? '—',
        passiveEffect: char?.passiveDesc ?? 'Your hero passive activates automatically in battle.'
      },
      {
        title: '⚡ COOPERATIVE ATTACKS ⚡',
        text: 'Select an answer and hit SUBMIT. A CORRECT answer triggers a synchronized attack — your hero and your Byte companion both strike the enemy dealing their combined Sync damage. WRONG answers or running out of time lets the enemy attack you!',
        highlight: 'battle-question',
        badge: null
      },
      {
        title: '🌟 YOUR BYTE COMPANION SKILL 🌟',
        text: `Your companion Byte ${byte?.name ?? 'Byte'} has a special skill that charges as you answer correctly. Every correct answer adds 1 charge. Once fully charged, the SKILL button next to your Byte lights up purple — tap it to unleash their power!`,
        highlight: 'btn-byte-skill',
        badge: 'skill',
        skillName: `${byte?.name?.toUpperCase() ?? 'BYTE'}: ${byte?.skill?.toUpperCase() ?? 'SPECIAL SKILL'}`,
        skillEffect: byte?.skillEffect ?? 'A powerful ability that turns the tide of battle.'
      },
      {
        title: '📡 SKILL CHARGE MECHANIC 📡',
        text: `Watch the SKILL button next to your Byte. Each correct answer fills 1 charge. Your Byte needs ${byte?.id === 'poturtle' ? 3 : 4} correct answers to fully charge. Use the skill at the right moment for maximum impact — it resets after use!`,
        highlight: 'wrapper-byte-skill',
        badge: null
      },
      {
        title: '💡 INTELLIGENCE REVEAL 💡',
        text: 'Stuck on a tough IT question? Click the cyan REVEAL button to automatically highlight and select the correct answer. You only have 2 Reveals for the entire Prelim Arc, so use them wisely on questions you truly cannot answer!',
        highlight: 'btn-battle-reveal',
        badge: null
      },
      {
        title: '✦ TIME TO DEBUG! ✦',
        text: 'The classroom has been corrupted by a Bit Mite Glitchborn! Use your knowledge, your hero passive, and your Byte\'s skill to drive it out. Answer every question with confidence and restore balance to the LUMEN Network. Let\'s go!',
        highlight: null,
        badge: null
      }
    ];
  }

  let _tutorialSlides = [];

  function _startTutorialFlow() {
    _isPaused = true;
    _tutorialIndex = 0;
    _tutorialSlides = _buildTutorialSlides();
    _stopQuestionTimer(); // Temporarily hide and clear the timer during tutorial slides
    const overlay = document.getElementById('battle-tutorial-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
      _showTutorialSlide();
    }
  }

  function _showTutorialSlide() {
    const slide = _tutorialSlides[_tutorialIndex];
    if (!slide) return;

    // Update slide counter
    const counterEl = document.getElementById('battle-tutorial-counter');
    if (counterEl) counterEl.textContent = `${_tutorialIndex + 1} / ${_tutorialSlides.length}`;

    // Clear previous highlights (from all possible slides)
    _tutorialSlides.forEach(s => {
      if (s.highlight) {
        const el = document.getElementById(s.highlight);
        if (el) {
          el.classList.remove('ring-4', 'ring-yellow-400', 'ring-offset-2', 'ring-offset-[#090d1f]', 'shadow-[0_0_30px_#F9C159]', 'scale-[1.03]');
        }
      }
    });

    const titleEl = document.getElementById('battle-tutorial-title');
    const textEl  = document.getElementById('battle-tutorial-text');
    const btnEl   = document.getElementById('btn-tutorial-dismiss');
    const skillBadge   = document.getElementById('battle-tutorial-skill-badge');
    const passiveBadge = document.getElementById('battle-tutorial-passive-badge');

    if (titleEl) titleEl.textContent = slide.title;
    if (textEl)  textEl.textContent  = slide.text;

    // Show/hide the byte skill badge
    if (skillBadge) {
      if (slide.badge === 'skill') {
        skillBadge.classList.remove('hidden');
        const nameEl   = document.getElementById('battle-tutorial-skill-name');
        const effectEl = document.getElementById('battle-tutorial-skill-effect');
        if (nameEl)   nameEl.textContent   = `⚡ ${slide.skillName}`;
        if (effectEl) effectEl.textContent = slide.skillEffect;
      } else {
        skillBadge.classList.add('hidden');
      }
    }

    // Show/hide the hero passive badge
    if (passiveBadge) {
      if (slide.badge === 'passive') {
        passiveBadge.classList.remove('hidden');
        const pNameEl   = document.getElementById('battle-tutorial-passive-name');
        const pEffectEl = document.getElementById('battle-tutorial-passive-effect');
        if (pNameEl)   pNameEl.textContent   = `✦ ${slide.passiveName}`;
        if (pEffectEl) pEffectEl.textContent = slide.passiveEffect;
      } else {
        passiveBadge.classList.add('hidden');
      }
    }

    if (btnEl) {
      if (_tutorialIndex === _tutorialSlides.length - 1) {
        btnEl.innerHTML = `START BATTLE <svg class="w-3.5 h-3.5 fill-current inline-block align-middle ml-1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M10 6h-2v12h2v-2h2v-2h2v-2h-2V8h-2V6z"/></svg>`;
      } else {
        btnEl.innerHTML = `NEXT <svg class="w-3.5 h-3.5 fill-current inline-block align-middle ml-1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M10 6h-2v12h2v-2h2v-2h2v-2h-2V8h-2V6z"/></svg>`;
      }
    }

    // Apply highlight
    if (slide.highlight) {
      const el = document.getElementById(slide.highlight);
      if (el) {
        el.classList.add('ring-4', 'ring-yellow-400', 'ring-offset-2', 'ring-offset-[#090d1f]', 'shadow-[0_0_30px_#F9C159]', 'scale-[1.03]');
      }
    }
  }

  function _advanceTutorial() {
    _tutorialIndex++;
    if (_tutorialIndex >= _tutorialSlides.length) {
      // End tutorial
      _tutorialSeen[1] = true;
      SaveSystem.markTutorialCompleted(); // Persist tutorial completion
      _isPaused = false;

      // Clean highlights
      _tutorialSlides.forEach(s => {
        if (s.highlight) {
          const el = document.getElementById(s.highlight);
          if (el) {
            el.classList.remove('ring-4', 'ring-yellow-400', 'ring-offset-2', 'ring-offset-[#090d1f]', 'shadow-[0_0_30px_#F9C159]', 'scale-[1.03]');
          }
        }
      });

      const overlay = document.getElementById('battle-tutorial-overlay');
      if (overlay) {
        gsap.to(overlay, {
          opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: () => {
            overlay.classList.add('hidden');
          }
        });
      }
      
      // Start question timer
      _startQuestionTimer();
    } else {
      AudioManager.playClickSFX();
      _showTutorialSlide();
    }
  }

  function _skipTutorial() {
    AudioManager.playClickSFX();
    
    // Mark tutorial as seen and persist
    _tutorialSeen[1] = true;
    SaveSystem.markTutorialCompleted();
    _isPaused = false;

    // Clean highlights
    _tutorialSlides.forEach(s => {
      if (s.highlight) {
        const el = document.getElementById(s.highlight);
        if (el) {
          el.classList.remove('ring-4', 'ring-yellow-400', 'ring-offset-2', 'ring-offset-[#090d1f]', 'shadow-[0_0_30px_#F9C159]', 'scale-[1.03]');
        }
      }
    });

    const overlay = document.getElementById('battle-tutorial-overlay');
    if (overlay) {
      gsap.to(overlay, {
        opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: () => {
          overlay.classList.add('hidden');
        }
      });
    }
    
    // Start question timer
    _startQuestionTimer();
  }

  // ── Hearts-based HP HUD (Bookworm Adventures style) ───────
  function _renderHearts(containerId, currentHp, maxHp, isEnemy) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const hpPerHeart = 10;
    const totalHearts = Math.ceil(maxHp / hpPerHeart);
    const activeHearts = Math.ceil(currentHp / hpPerHeart);

    const shouldStack = totalHearts > 20;

    const wrap = document.createElement('div');
    wrap.className = 'flex flex-col gap-1 w-full ' + (isEnemy ? 'items-end' : 'items-start');

    const createHeartSVG = (index) => {
      const heart = document.createElement('span');
      heart.className = 'inline-flex w-4 h-4 select-none transition-all duration-300';
      if (index < activeHearts) {
        // Red Heart SVG from Pixelarticons
        heart.innerHTML = `<svg class="w-4 h-4 inline-block align-middle fill-current text-red-500" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2 5v5h2v2h2v2h2v2h2v2h4v-2h2v-2h2v-2h2v-2h2V5h-4v2h-2V5h-8v2H8V5H2zm2 2h2v2H4V7zm4 0h2v2H8V7zm6 2h-2V7h2v2zm4-2h2v2h-2V7z"/></svg>`;
        heart.style.filter = 'drop-shadow(0 0 5px rgba(239, 68, 68, 0.75))';
      } else {
        // Muted Heart SVG from Pixelarticons
        heart.innerHTML = `<svg class="w-4 h-4 inline-block align-middle fill-current text-zinc-800" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2 5v5h2v2h2v2h2v2h2v2h4v-2h2v-2h2v-2h2v-2h2V5h-4v2h-2V5h-8v2H8V5H2zm2 2h2v2H4V7zm4 0h2v2H8V7zm6 2h-2V7h2v2zm4-2h2v2h-2V7z"/></svg>`;
        heart.style.opacity = '0.3';
      }
      return heart;
    };

    if (shouldStack) {
      const half = Math.ceil(totalHearts / 2);
      
      const row1 = document.createElement('div');
      row1.className = 'flex gap-1 ' + (isEnemy ? 'justify-end' : 'justify-start');
      for (let i = 0; i < half; i++) {
        row1.appendChild(createHeartSVG(i));
      }
      
      const row2 = document.createElement('div');
      row2.className = 'flex gap-1 ' + (isEnemy ? 'justify-end' : 'justify-start');
      for (let i = half; i < totalHearts; i++) {
        row2.appendChild(createHeartSVG(i));
      }
      
      wrap.appendChild(row1);
      wrap.appendChild(row2);
    } else {
      const row = document.createElement('div');
      row.className = 'flex flex-wrap gap-1 ' + (isEnemy ? 'justify-end' : 'justify-start');
      for (let i = 0; i < totalHearts; i++) {
        row.appendChild(createHeartSVG(i));
      }
      wrap.appendChild(row);
    }

    container.appendChild(wrap);
  }

  function _updatePlayerHpUI() {
    _renderHearts('player-hearts-container', _playerHp, _playerMaxHp, false);
    const hpText = document.getElementById('player-hp-text');
    if (hpText) hpText.textContent = `${Math.max(0, _playerHp)} / ${_playerMaxHp} HP`;
  }

  function _updateEnemyHpUI() {
    _renderHearts('enemy-hearts-container', _enemyHp, _enemyMaxHp, true);
    const hpText = document.getElementById('enemy-hp-text');
    if (hpText) hpText.textContent = `${Math.max(0, _enemyHp)} / ${_enemyMaxHp} HP`;
  }

  // ── Question rendering ────────────────────────────────────
  function _renderQuestion(index) {
    const q = _questions[index];
    if (!q) return;

    _selectedAns = null;

    document.getElementById('battle-q-num').textContent = 'BATTLE QUESTION';

    // Update difficulty tier label
    const lvlId = _levelData?.id ?? 1;
    const tier  = LEVEL_DIFFICULTY[lvlId] ?? LEVEL_DIFFICULTY[1];
    const qNumEl = document.getElementById('battle-q-num');
    if (qNumEl) {
      qNumEl.textContent  = `BATTLE QUESTION — ${tier.label}`;
      qNumEl.style.color  = tier.color;
    }
    document.getElementById('battle-question').textContent = q.q;

    const resultEl = document.getElementById('battle-result-line');
    resultEl.textContent = '';
    resultEl.className   = 'font-ui text-sm font-bold';

    const answersEl = document.getElementById('battle-answers');
    answersEl.innerHTML = '';

    ['A', 'B', 'C', 'D'].forEach(letter => {
      const btn = document.createElement('button');
      btn.id        = `ans-btn-${letter}`;
      btn.className = 'battle-answer-btn';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      
      const letterSpan = document.createElement('span');
      letterSpan.className = 'battle-answer-letter';
      letterSpan.textContent = `${letter}.`;
      
      const textSpan = document.createElement('span');
      textSpan.textContent = q.choices[letter];
      
      btn.appendChild(letterSpan);
      btn.appendChild(textSpan);
      
      btn.addEventListener('click', () => _selectAnswer(letter));
      answersEl.appendChild(btn);
    });

    const submitBtn = document.getElementById('btn-battle-submit');
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-40');

    _updateRevealButtonUI();
    _startQuestionTimer();
  }

  function _selectAnswer(letter) {
    if (_isAnimating) return;

    _selectedAns = letter;

    ['A', 'B', 'C', 'D'].forEach(l => {
      const btn = document.getElementById(`ans-btn-${l}`);
      if (!btn) return;
      btn.classList.toggle('selected', l === letter);
      btn.classList.remove('revealed'); // remove reveal glow if they change selection
      btn.setAttribute('aria-checked', l === letter ? 'true' : 'false');
    });

    const submitBtn = document.getElementById('btn-battle-submit');
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-40');
  }

  // ── Idle bounce loop (GSAP, every 2s) ────────────────────
  function _startIdleLoop() {
    _stopIdleLoop();
    _idleInterval = setInterval(() => {
      gsap.to('#battle-player-sprite-window', {
        y: -9, duration: 0.25, ease: 'power2.out',
        onComplete: () => gsap.to('#battle-player-sprite-window',
          { y: 0, duration: 0.22, ease: 'bounce.out' })
      });
      gsap.to('#battle-byte-sprite-window', {
        y: -6, delay: 0.12, duration: 0.22, ease: 'power2.out',
        onComplete: () => gsap.to('#battle-byte-sprite-window',
          { y: 0, duration: 0.2, ease: 'bounce.out' })
      });
      gsap.to('#battle-enemy-sprite-window', {
        rotation: 3, duration: 0.2, ease: 'power2.inOut',
        yoyo: true, repeat: 1
      });
    }, 2000);
  }

  function _stopIdleLoop() {
    if (_idleInterval) { clearInterval(_idleInterval); _idleInterval = null; }
  }

  // ── Particles ─────────────────────────────────────────────
  function _spawnParticles() {
    const layer = document.getElementById('battle-particle-layer');
    if (!layer) return;

    const byte = window.GameState.byte;
    const palettes = {
      poturtle: ['#4ade80','#86efac','#22c55e'],
      firewisp: ['#fb923c','#fbbf24','#f97316'],
      lagoon:   ['#38bdf8','#7dd3fc','#0ea5e9'],
    };
    const pal = palettes[byte?.id] ?? ['#f9c159','#fbbf24','#fde68a'];

    const enemyWin = document.getElementById('battle-enemy-sprite-window');
    if (!enemyWin) return;

    // Get visual centre of the enemy (account for scaleX(-1) parent)
    const rect = enemyWin.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;

    for (let i = 0; i < 18; i++) {
      const p  = document.createElement('div');
      p.className = 'battle-particle';
      p.style.background = pal[i % pal.length];
      p.style.left = (cx - 3.5) + 'px';
      p.style.top  = (cy - 3.5) + 'px';
      document.body.appendChild(p);   // body-level so z-index is clean

      const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.4;
      const dist  = 45 + Math.random() * 55;
      gsap.to(p, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        opacity: 0,
        scale: Math.random() + 0.4,
        duration: 0.5 + Math.random() * 0.25,
        ease: 'power2.out',
        onComplete: () => p.remove(),
      });
    }
  }

  // ── Floating damage number ────────────────────────────────
  function _showDamageNumber(amount, targetWinId, isPlayer) {
    const win = document.getElementById(targetWinId);
    if (!win) return;
    const rect = win.getBoundingClientRect();
    const el   = document.createElement('div');
    el.textContent = `-${amount}`;
    el.style.cssText = [
      'position:fixed',
      `left:${rect.left + rect.width / 2}px`,
      `top:${rect.top + 10}px`,
      "font-family:'Press Start 2P',monospace",
      'font-size:14px',
      `color:${isPlayer ? '#f87171' : '#fbbf24'}`,
      'pointer-events:none',
      'z-index:60',
      'text-shadow:0 2px 8px rgba(0,0,0,0.9)',
      'transform:translateX(-50%)',
    ].join(';');
    document.body.appendChild(el);
    gsap.fromTo(el,
      { y: 0, opacity: 1 },
      { y: -55, opacity: 0, duration: 1.1, ease: 'power2.out', onComplete: () => el.remove() }
    );
  }

  // ── Question Timer System ──────────────────────────────────
  function _updateTimerUI() {
    const timerBar = document.getElementById('battle-timer-bar');
    if (!timerBar) return;
    const pct = Math.max(0, Math.min(100, (_timeLeft / _maxTime) * 100));
    timerBar.style.width = `${pct}%`;

    // Visual feedback color shifts based on urgency
    if (pct < 20) {
      timerBar.className = 'h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
    } else if (pct < 50) {
      timerBar.className = 'h-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]';
    } else {
      timerBar.className = 'h-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.4)]';
    }
  }

  function _startQuestionTimer() {
    _stopQuestionTimer();

    const container = document.getElementById('battle-timer-container');
    if (container) container.classList.remove('hidden');

    const lvlId = _levelData?.id ?? 1;
    // Scale timer: Level 1 = 45s, L2 = 40s, L3 = 35s, L4 = 30s, L5 = 25s
    _maxTime = Math.max(25, 45 - (lvlId - 1) * 5);
    _timeLeft = _maxTime;

    _updateTimerUI();

    _timerInterval = setInterval(() => {
      // Pause countdown during combat animations or pause screen
      if (_isAnimating || _isPaused) return;

      _timeLeft -= 0.1;
      if (_timeLeft <= 0) {
        _timeLeft = 0;
        _updateTimerUI();
        _stopQuestionTimer();
        _handleTimeout();
      } else {
        _updateTimerUI();
      }
    }, 100);
  }

  function _stopQuestionTimer() {
    if (_timerInterval) {
      clearInterval(_timerInterval);
      _timerInterval = null;
    }
    const container = document.getElementById('battle-timer-container');
    if (container) container.classList.add('hidden');
  }

  function _handleTimeout() {
    _handleWrong(true);
  }

  // ── Submit logic ──────────────────────────────────────────
  function _submit() {
    if (!_selectedAns || _isAnimating) return;
    _isAnimating = true;

    _stopQuestionTimer();

    const q         = _questions[_currentQ];
    const isCorrect = (_selectedAns === q.answer);

    // Lock inputs
    document.getElementById('btn-battle-submit').disabled = true;
    document.getElementById('btn-battle-submit').classList.add('opacity-40');

    const revealBtn = document.getElementById('btn-battle-reveal');
    if (revealBtn) {
      revealBtn.disabled = true;
      revealBtn.classList.add('opacity-40', 'cursor-not-allowed');
    }

    ['A','B','C','D'].forEach(l => {
      const b = document.getElementById(`ans-btn-${l}`);
      if (b) b.style.pointerEvents = 'none';
    });

    if (isCorrect) _handleCorrect();
    else           _handleWrong();
  }

  function _handleCorrect() {
    _correctStreak++; // Increment consecutive correct answers

    // Feedback label
    const res = document.getElementById('battle-result-line');
    res.textContent = '✓ CORRECT!';
    res.className   = 'font-ui text-sm font-bold text-emerald-400';

    AudioManager.playCorrectAnswerSFX();

    const char = window.GameState.character;
    const byte = window.GameState.byte;

    // Bebz's "Clean Data Flow" Passive (Heal 5 HP on correct answer - max 1 heal per 2 turns)
    if (char?.id === 'bebz' && _passiveCooldowns.bebz <= 0) {
      const healAmt = Math.min(5, _playerMaxHp - _playerHp);
      if (healAmt > 0) {
        _playerHp += healAmt;
        _updatePlayerHpUI();
        _showDamageTextOverlay(`+${healAmt} FLOW HEAL`, 'battle-player-sprite-window', '#34d399');
        AudioManager.playHealSFX();
        _passiveCooldowns.bebz = 2; // 2-turn cooldown
      }
    }
    // Decrement all passive cooldowns
    Object.keys(_passiveCooldowns).forEach(key => {
      if (_passiveCooldowns[key] > 0) _passiveCooldowns[key]--;
    });

    // Increment skill charge
    _setByteCharge(_byteCharge + 1);

    // ── Player shifts to battle sprite ──
    const playerImg = document.getElementById('battle-player-sprite-img');
    playerImg.src   = _charSprites.battle;
    _swapToAttack(playerImg);

    gsap.fromTo('#battle-player-sprite-window',
      { scale: 1 },
      { scale: 1.12, duration: 0.14, ease: 'power2.out', yoyo: true, repeat: 1 });

    // ── After short delay, Byte lunges ──
    setTimeout(() => {
      const byteImg = document.getElementById('battle-byte-sprite-img');
      byteImg.src   = _byteSprites.attack;
      _swapToAttack(byteImg);

      gsap.to('#battle-byte-sprite-window', {
        x: 70, duration: 0.22, ease: 'power3.out',
        onComplete: () => {
          // Particles + enemy recoil
          _spawnParticles();
          gsap.fromTo('#battle-enemy-sprite-window',
            { x: 0 },
            { x: 18, duration: 0.08, ease: 'power2.out', yoyo: true, repeat: 3 });

          // Damage calculation
          let charDmg = char?.dmg ?? 0;

          // Dale's "Adrenaline Core" Passive (+5 Sync Power when HP is below 50%)
          if (char?.id === 'dale' && _playerHp < (_playerMaxHp / 2)) {
            charDmg += 5;
            _showDamageTextOverlay('ADRENALINE BOOST!', 'battle-player-sprite-window', '#2dd4bf');
          }

          let dmg  = charDmg + (byte?.dmg ?? 0);

          // Bai's "Overclock Streak" Passive (+3 damage per correct answer streak, max +9)
          if (char?.id === 'bai') {
            const streakBonus = Math.min(9, (_correctStreak - 1) * 3);
            if (streakBonus > 0) {
              dmg += streakBonus;
              _showDamageTextOverlay(`STREAK BONUS +${streakBonus}!`, 'battle-enemy-sprite-window', '#fb923c');
            }
          }

          // Matt's "Critical Overload" Passive (25% chance to deal 1.5x damage)
          if (char?.id === 'matt') {
            if (_getSecureRandom() < 0.25) {
              dmg = Math.round(dmg * 1.5);
              _showDamageTextOverlay('CRITICAL HIT!', 'battle-enemy-sprite-window', '#f43f5e');
            }
          }

          // CLAMP DAMAGE to prevent softlock and maintain balance
          dmg = Math.max(MIN_DAMAGE, Math.min(MAX_DAMAGE, dmg));

          _enemyHp   = Math.max(0, _enemyHp - dmg);
          _updateEnemyHpUI();
          _showDamageNumber(dmg, 'battle-enemy-sprite-window', false);

          // Return byte
          gsap.to('#battle-byte-sprite-window', { x: 0, duration: 0.3, delay: 0.12 });
        }
      });
    }, 180);

    // ── After full animation settles ──
    setTimeout(() => {
      // Revert player to idle
      _revertToIdle(
        document.getElementById('battle-player-sprite-img'),
        _charSprites.idle
      );
      // Revert byte to idle
      _revertToIdle(
        document.getElementById('battle-byte-sprite-img'),
        _byteSprites.idle
      );

      _isAnimating = false;
      _afterAnimationCheck();
    }, 1450);
  }

  function _handleWrong() {
    _correctStreak = 0; // Reset consecutive correct answers streak

    // Feedback label
    const res = document.getElementById('battle-result-line');
    res.textContent = '✗ WRONG!';
    res.className   = 'font-ui text-sm font-bold text-red-400';

    AudioManager.playWrongAnswerSFX();

    const char = window.GameState.character;

    // ── Enemy shifts to attack sprite and lunges ──
    const enemyImg = document.getElementById('battle-enemy-sprite-img');
    const enemyWrapper = document.getElementById('battle-enemy-sprite-wrapper');
    enemyImg.src   = _enemySprites?.attack ?? enemyImg.dataset.attackSrc ?? 'glitchbornBytes/Bitmite/Bitmite_attack.png';
    if (_levelData?.id === 5 && enemyWrapper) {
      enemyWrapper.classList.add('flip-attack');
    }
    _swapToAttack(enemyImg);

    // Enemy lunge toward player (x: -60 visually = left due to natural facing wrapper)
    gsap.to('#battle-enemy-sprite-window', {
      x: -60, duration: 0.2, ease: 'power3.out',
      onComplete: () => {
        // Screen shake
        const screen = document.getElementById('screen-battle');
        if (screen && (!window.GameSettings || window.GameSettings.screenShake !== false)) {
          screen.classList.remove('battle-shaking');
          void screen.offsetWidth;
          screen.classList.add('battle-shaking');
        }

        // Red flash
        gsap.fromTo('#battle-damage-flash',
          { opacity: 0 },
          { opacity: 1, duration: 0.05, yoyo: true, repeat: 1 });

        // Damage calculation & Port Shield Check
        let dmg = _levelData?.enemyDmg ?? 8;

        // Harold's "Guard Firewall" Passive (15% damage reduction)
        if (char?.id === 'harold') {
          dmg = Math.round(dmg * 0.85);
        }

        // Matt's "Critical Overload" Passive (+2 penalty on wrong answers)
        if (char?.id === 'matt') {
          dmg += 2;
          _showDamageTextOverlay('OVERLOAD STRESS +2!', 'battle-player-sprite-window', '#f43f5e');
        }

        if (_weakenNextAttack < 1) {
          dmg = Math.max(1, Math.round(dmg * _weakenNextAttack));
          _weakenNextAttack = 1;
          _showDamageTextOverlay('WEAKENED HIT!', 'battle-player-sprite-window', '#a78bfa');
        }
        if (_portShieldActive) {
          dmg = Math.round(dmg * 0.6); // 40% damage reduction
          _portShieldActive = false;
          _showDamageTextOverlay('PORT SHIELD BLOCK!', 'battle-player-sprite-window', '#4ade80');
        }
        // CLAMP DAMAGE to prevent softlock
        dmg = Math.max(MIN_DAMAGE, Math.min(MAX_DAMAGE, dmg));
        
        _playerHp  = Math.max(0, _playerHp - dmg);
        _updatePlayerHpUI();
        _showDamageNumber(dmg, 'battle-player-sprite-window', true);

        // Return enemy
        gsap.to('#battle-enemy-sprite-window', { x: 0, duration: 0.35, delay: 0.1, ease: 'bounce.out' });
      }
    });

    setTimeout(() => {
      // Revert enemy idle
      _revertToIdle(
        document.getElementById('battle-enemy-sprite-img'),
        _enemySprites?.idle ?? 'glitchbornBytes/Bitmite/bitmite_idle.png'
      );

      _isAnimating = false;

      if (_playerHp <= 0) _defeat();
      else _afterAnimationCheck();
    }, 1450);
  }

  // Decides next action: victory, or advance to next question
  function _afterAnimationCheck() {
    if (_enemyHp <= 0) { _victory(); return; }

    // Paps' "Auto-Repair Daemon" Passive (passively restores 3 HP at the end of every turn - max 1 heal per 2 turns)
    const char = window.GameState.character;
    if (char?.id === 'paps' && _playerHp > 0 && _playerHp < _playerMaxHp && _passiveCooldowns.paps <= 0) {
      const heal = Math.min(3, _playerMaxHp - _playerHp);
      _playerHp += heal;
      _updatePlayerHpUI();
      _showDamageTextOverlay(`+${heal} REPAIR`, 'battle-player-sprite-window', '#a78bfa');
      AudioManager.playHealSFX();
      _passiveCooldowns.paps = 2; // 2-turn cooldown
    }

    // Stacking Burn Damage Tick
    if (_burnTurns > 0) {
      _burnTurns--;

      _spawnCustomParticles('fire');
      AudioManager.playFireCastSFX();

      _enemyHp = Math.max(0, _enemyHp - BURN_DAMAGE);
      _updateEnemyHpUI();
      _showDamageNumber(BURN_DAMAGE, 'battle-enemy-sprite-window', false);
      _showDamageTextOverlay(`BURN TICK -${BURN_DAMAGE}`, 'battle-enemy-sprite-window', '#f97316');

      gsap.fromTo('#battle-enemy-sprite-window',
        { x: 0 },
        { x: 10, duration: 0.08, ease: 'power2.out', yoyo: true, repeat: 1 }
      );

      setTimeout(() => {
        if (_enemyHp <= 0) {
          _victory();
        } else {
          _advanceQuestionFlow();
        }
      }, 800);

    } else {
      _advanceQuestionFlow();
    }
  }

  function _advanceQuestionFlow() {
    _currentQ++;

    // When the full bank is exhausted, reshuffle and loop — no repeat within one cycle
    if (_currentQ >= _questions.length) {
      _questionPool = _shuffleArray(_levelData?.questionsBank ?? _questions);
      _questions    = _questionPool;
      _currentQ     = 0;
    }

    // Victory is ONLY triggered by enemy HP reaching 0 — never by running out of questions
    _renderQuestion(_currentQ);
  }

  // ── Victory ────────────────────────────────────────────────
  function _victory() {
    _stopQuestionTimer();
    _stopIdleLoop();
    AudioManager.playVictorySFX();

    // Persist HP carry-over
    window.GameState.playerHp = _playerHp;
    SaveSystem.savePlayerHp(_playerHp, _playerMaxHp);
    SaveSystem.saveByteCharge(_byteCharge);

    const isAlreadyCleared = SaveSystem.load().prelimProgress >= _levelData.id;

    if (isAlreadyCleared) {
      // Victory overlay for retry
      const enemyName = _levelData?.enemy ?? 'Enemy';
      const ov = document.createElement('div');
      ov.style.cssText =
        'position:absolute;inset:0;background:rgba(0,0,0,0.72);' +
        'display:flex;flex-direction:column;align-items:center;' +
        'justify-content:center;z-index:40;';
      ov.innerHTML = `
        <div class="font-pixel text-gold mb-4"
             style="font-size:28px;text-shadow:0 0 30px rgba(249,193,89,0.8);">VICTORY!</div>
        <div class="font-ui text-white/65 text-lg mb-2">${enemyName} has been defeated!</div>
        <div class="font-pixel text-emerald-400"
             style="font-size:9px;margin-top:8px;">
          HP: ${_playerHp} / ${_playerMaxHp} carried forward
        </div>
        <div class="font-pixel text-zinc-400" style="font-size:7px;margin-top:6px;">
          (Completed Zone Retry — No new rewards granted)
        </div>
      `;
      document.getElementById('screen-battle').appendChild(ov);
      gsap.fromTo(ov,
        { opacity: 0, scale: 0.88 },
        { opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.4)' });

      setTimeout(() => {
        ov.remove();
        // Skip post-battle cutscene and return to prelim map
        window.ScreenManager.goTo('prelim-map', {
          onEnter: () => PrelimMapScreen.enter()
        });
      }, 2000);
      return;
    }

    // ── Process rewards ──────────────────────────
    const unlock = _levelData?.unlockOnClear;
    let rewardLines = [];

    if (unlock) {
      // Unlock the next level
      if (unlock.nextLevel) {
        SaveSystem.unlockLevel(unlock.nextLevel);
        // Update live GAME_DATA immediately
        const next = window.GAME_DATA.prelimLevels.find(l => l.id === unlock.nextLevel);
        if (next) next.locked = false;
      }
      // Unlock a byte companion
      if (unlock.byteId) {
        SaveSystem.unlockByte(unlock.byteId);
        window.GameState.justUnlockedByte = unlock.byteId; // Intercept for map popup
        const byteData = window.GAME_DATA.allBytes?.find(b => b.id === unlock.byteId);
        if (byteData) rewardLines.push(`✨ ${byteData.name} Byte Unlocked!`);
      }
      // Boss clear: reset HP, increase max HP
      if (unlock.bossClear) {
        const wasAlreadyCleared = SaveSystem.load().prelimProgress >= 5;
        const newMax = SaveSystem.clearPrelimBoss(_playerMaxHp);
        window.GameState.playerHp    = newMax;
        window.GameState.playerMaxHp = newMax;
        _playerHp = newMax;
        _playerMaxHp = newMax;
        rewardLines.push(wasAlreadyCleared ? 'HP fully restored!' : 'HP Reset & +20 Max HP!');
      } else {
        SaveSystem.markLevelCleared(_levelData.id);
      }
    }

    // ── Build reward line HTML ───────────────────
    const enemyName = _levelData?.enemy ?? 'Enemy';
    const rewardHTML = rewardLines.length
      ? rewardLines.map(r =>
          `<div class="font-pixel text-emerald-400" style="font-size:8px;margin-top:6px;">${r}</div>`
        ).join('')
      : '';

    // Victory overlay
    const ov = document.createElement('div');
    ov.style.cssText =
      'position:absolute;inset:0;background:rgba(0,0,0,0.72);' +
      'display:flex;flex-direction:column;align-items:center;' +
      'justify-content:center;z-index:40;';
    ov.innerHTML = `
      <div class="font-pixel text-gold mb-4"
           style="font-size:28px;text-shadow:0 0 30px rgba(249,193,89,0.8);">VICTORY!</div>
      <div class="font-ui text-white/65 text-lg mb-2">${enemyName} has been defeated!</div>
      <div class="font-pixel text-emerald-400"
           style="font-size:9px;margin-top:8px;">
        HP: ${_playerHp} / ${_playerMaxHp} carried forward
      </div>
      ${rewardHTML}
    `;
    document.getElementById('screen-battle').appendChild(ov);
    gsap.fromTo(ov,
      { opacity: 0, scale: 0.88 },
      { opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.4)' });

    const delay = unlock?.bossClear ? 3800 : 2600;
    setTimeout(() => {
      ov.remove();
      _playPostBattleCutscene();
    }, delay);
  }

  // ── Defeat ────────────────────────────────────────────────
  function _defeat() {
    _stopQuestionTimer();
    _stopIdleLoop();

    const ov = document.createElement('div');
    ov.style.cssText =
      'position:absolute;inset:0;background:rgba(0,0,0,0.82);' +
      'display:flex;flex-direction:column;align-items:center;' +
      'justify-content:center;z-index:40;';
    ov.innerHTML = `
      <div class="font-pixel text-red-400 mb-4" style="font-size:26px;">DEFEATED</div>
      <div class="font-ui text-white/55 text-base mb-6">Your HP dropped to zero.</div>
      <button id="btn-battle-retry"
              class="pixel-btn px-10 py-3 font-pixel text-gold tracking-widest"
              style="font-size:8px;"
              aria-label="Retry this level">
        ↺ RETRY
      </button>
    `;
    document.getElementById('screen-battle').appendChild(ov);
    gsap.fromTo(ov, { opacity: 0 }, { opacity: 1, duration: 0.45 });

    document.getElementById('btn-battle-retry').addEventListener('click', () => {
      ov.remove();
      // Reset carry-over HP on defeat — start fresh
      window.GameState.playerHp = null;
      // Reset byte charge on defeat — losing forfeits all accumulated charge
      window.GameState.byteCharge = 0;
      SaveSystem.saveByteCharge(0);
      enter(_levelData);
    });
  }

  // ── Post-battle cutscene (dynamic per level) ─────────────
  function _playPostBattleCutscene() {
    // Use level-specific post-cutscene lines from data.js
    const lines = _levelData?.postCutsceneLines ?? [
      { speaker: 'player', text: 'The enemy has been defeated.' },
      { speaker: 'byte',   text: 'Byte!' },
    ];

    window.ScreenManager.goTo('cutscene', {
      onEnter: () => CutsceneScreen.playScene(lines, () => {
        // Return to prelim map and refresh node locks
        window.ScreenManager.goTo('prelim-map', {
          onEnter: () => PrelimMapScreen.enter()
        });
      })
    });
  }

  // ── Intelligence Reveal System ────────────────────────────
  function _updateRevealButtonUI() {
    const revealBtn = document.getElementById('btn-battle-reveal');
    if (!revealBtn) return;

    const count = window.GameState.revealsLeft ?? 2;
    revealBtn.innerHTML = `
      <svg class="w-3.5 h-3.5 fill-current text-cyan-300 inline-block align-middle" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
      REVEAL (${count}/2)
    `;

    // Disable if no reveals left, if already answered/revealed, or if animating
    const hasRevealedThisQuestion = _selectedAns && _selectedAns === _questions[_currentQ]?.answer && document.querySelector('.battle-answer-btn.revealed');
    if (count <= 0 || hasRevealedThisQuestion || _isAnimating) {
      revealBtn.disabled = true;
      revealBtn.classList.add('opacity-40', 'cursor-not-allowed');
    } else {
      revealBtn.disabled = false;
      revealBtn.classList.remove('opacity-40', 'cursor-not-allowed');
    }
  }

  function _handleReveal() {
    if (_isAnimating) return;
    const count = window.GameState.revealsLeft ?? 2;
    if (count <= 0) {
      AudioManager.playErrorSFX();
      return;
    }

    const q = _questions[_currentQ];
    if (!q) return;

    // Deduct and save
    window.GameState.revealsLeft = count - 1;
    SaveSystem.saveReveals(window.GameState.revealsLeft);

    AudioManager.playConfirmSFX();

    // Select the correct answer automatically
    _selectAnswer(q.answer);

    // Add glowing revealed class to the correct answer button
    const btn = document.getElementById(`ans-btn-${q.answer}`);
    if (btn) {
      btn.classList.add('revealed');
    }

    _updateRevealButtonUI();
  }

  // ── Byte Special Ability Mechanics ───────────────────────
  function _updateByteSkillUI() {
    const btn = document.getElementById('btn-byte-skill');
    if (!btn) return;
    const byte = window.GameState.byte;
    if (!byte) {
      btn.style.display = 'none';
      return;
    }
    btn.style.display = '';

    if (_byteCharge >= _byteMaxCharge) {
      btn.textContent = 'READY!';
      btn.classList.add('ready');
      btn.disabled = false;
    } else {
      btn.textContent = `SKILL (${_byteCharge}/${_byteMaxCharge})`;
      btn.classList.remove('ready');
      btn.disabled = true;
    }
  }

  function _setByteCharge(value) {
    _byteCharge = Math.max(0, Math.min(_byteMaxCharge, value ?? 0));
    window.GameState.byteCharge = _byteCharge;
    SaveSystem.saveByteCharge(_byteCharge);
    _updateByteSkillUI();
  }

  function _useByteSkill() {
    if (_isAnimating || _byteCharge < _byteMaxCharge) return;
    _isAnimating = true;

    const byte = window.GameState.byte;
    if (!byte) {
      _isAnimating = false;
      return;
    }

    // Reset skill charge
    _setByteCharge(0);

    // JB's "Recycle Protocol" Passive (+8 HP when Byte special skill is activated - max 1 heal per 2 turns)
    const char = window.GameState.character;
    if (char?.id === 'jb' && _playerHp > 0 && _passiveCooldowns.jb <= 0) {
      const healAmt = Math.min(8, _playerMaxHp - _playerHp);
      if (healAmt > 0) {
        _playerHp += healAmt;
        _updatePlayerHpUI();
        _showDamageTextOverlay(`+${healAmt} RECYCLE`, 'battle-player-sprite-window', '#fbbf24');
        AudioManager.playHealSFX();
        _passiveCooldowns.jb = 2; // 2-turn cooldown
      }
    }

    // Trigger companion cry + cast visuals
    AudioManager.playByteCry(byte.id);

    const byteImg = document.getElementById('battle-byte-sprite-img');
    byteImg.src   = _byteSprites.attack;
    _swapToAttack(byteImg);

    gsap.fromTo('#battle-byte-sprite-window',
      { scale: 1 },
      { scale: 1.25, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 }
    );

    setTimeout(() => {
      if (byte.id === 'poturtle') {
        _portShieldActive = true;
        AudioManager.playBarrierSFX();
        gsap.fromTo('#battle-byte-sprite-window',
          { boxShadow: '0 0 0 rgba(74, 222, 128, 0)' },
          { boxShadow: '0 0 35px rgba(74, 222, 128, 0.9)', duration: 0.35, yoyo: true, repeat: 3 }
        );
        _showDamageTextOverlay('PORT SHIELD!', 'battle-byte-sprite-window', '#4ade80');

      } else if (byte.id === 'firewisp') {
        _burnTurns = 2;
        AudioManager.playFireCastSFX();

        const fireDmg = byte.dmg ?? 18;
        _enemyHp = Math.max(0, _enemyHp - fireDmg);
        _updateEnemyHpUI();

        _spawnCustomParticles('fire');
        gsap.fromTo('#battle-enemy-sprite-window',
          { x: 0 },
          { x: 15, duration: 0.08, ease: 'power2.out', yoyo: true, repeat: 3 }
        );
        _showDamageNumber(fireDmg, 'battle-enemy-sprite-window', false);
        _showDamageTextOverlay('BURNED!', 'battle-enemy-sprite-window', '#f97316');

      } else if (byte.id === 'lagoon') {
        const healAmt = 25;
        _playerHp = Math.min(_playerMaxHp, _playerHp + healAmt);
        _updatePlayerHpUI();

        AudioManager.playHealSFX();
        _spawnCustomParticles('aqua');

        gsap.fromTo('#battle-player-sprite-window',
          { scale: 1 },
          { scale: 1.15, duration: 0.2, yoyo: true, repeat: 1 }
        );
        _showDamageTextOverlay('+25 HEAL', 'battle-player-sprite-window', '#34d399');
      } else if (byte.id === 'pinglet') {
        const pingDmg = byte.dmg ?? 15;
        _enemyHp = Math.max(0, _enemyHp - pingDmg);
        _updateEnemyHpUI();

        _spawnCustomParticles('spark');
        gsap.fromTo('#battle-enemy-sprite-window',
          { x: 0 },
          { x: 12, duration: 0.08, ease: 'power2.out', yoyo: true, repeat: 3 }
        );
        _showDamageNumber(pingDmg, 'battle-enemy-sprite-window', false);
        _showDamageTextOverlay('PING SHOT!', 'battle-enemy-sprite-window', '#a78bfa');
      } else if (byte.id === 'bitbug') {
        const stingDmg = byte.dmg ?? 16;
        _enemyHp = Math.max(0, _enemyHp - stingDmg);
        _weakenNextAttack = 0.8;
        _updateEnemyHpUI();

        _spawnCustomParticles('bug');
        gsap.fromTo('#battle-enemy-sprite-window',
          { x: 0, rotation: 0 },
          { x: 10, rotation: 2, duration: 0.08, ease: 'power2.out', yoyo: true, repeat: 3 }
        );
        _showDamageNumber(stingDmg, 'battle-enemy-sprite-window', false);
        _showDamageTextOverlay('CODE STING!', 'battle-enemy-sprite-window', '#34d399');
      } else {
        const genericDmg = byte.dmg ?? 12;
        _enemyHp = Math.max(0, _enemyHp - genericDmg);
        _updateEnemyHpUI();

        _spawnCustomParticles('spark');
        gsap.fromTo('#battle-enemy-sprite-window',
          { x: 0 },
          { x: 12, duration: 0.08, ease: 'power2.out', yoyo: true, repeat: 3 }
        );
        _showDamageNumber(genericDmg, 'battle-enemy-sprite-window', false);
        _showDamageTextOverlay(`${byte.skill?.toUpperCase() ?? 'BYTE SKILL'}!`, 'battle-enemy-sprite-window', byte.color ?? '#fbbf24');
      }

      setTimeout(() => {
        _revertToIdle(byteImg, _byteSprites.idle);
        _isAnimating = false;

        if (_enemyHp <= 0) {
          _victory();
        }
      }, 600);

    }, 200);
  }

  function _showDamageTextOverlay(text, targetWinId, color) {
    const win = document.getElementById(targetWinId);
    if (!win) return;
    const rect = win.getBoundingClientRect();
    const el   = document.createElement('div');
    el.textContent = text;
    el.style.cssText = [
      'position:fixed',
      `left:${rect.left + rect.width / 2}px`,
      `top:${rect.top - 15}px`,
      "font-family:'Press Start 2P',monospace",
      'font-size:9px',
      `color:${color}`,
      'pointer-events:none',
      'z-index:60',
      'text-shadow:0 2px 8px rgba(0,0,0,0.95)',
      'transform:translateX(-50%)',
    ].join(';');
    document.body.appendChild(el);
    gsap.fromTo(el,
      { y: 0, scale: 0.5, opacity: 1 },
      { y: -65, scale: 1.1, opacity: 0, duration: 1.3, ease: 'power2.out', onComplete: () => el.remove() }
    );
  }

  function _spawnCustomParticles(type) {
    const layer = document.getElementById('battle-particle-layer');
    if (!layer) return;

    const colorMap = {
      fire: ['#fb923c', '#f97316', '#ef4444', '#f87171'],
      aqua: ['#38bdf8', '#0ea5e9', '#60a5fa', '#3b82f6'],
      spark: ['#a78bfa', '#c4b5fd', '#fbbf24', '#fde68a'],
      bug: ['#34d399', '#86efac', '#22c55e', '#a7f3d0'],
    };
    const pal = colorMap[type] ?? ['#fbbf24', '#fde68a'];

    const targetWinId = type === 'fire' ? 'battle-enemy-sprite-window' : 'battle-player-sprite-window';
    const win = document.getElementById(targetWinId);
    if (!win) return;

    const rect = win.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;

    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.className = 'battle-particle';
      p.style.background = pal[i % pal.length];
      p.style.left = (cx - 3.5) + 'px';
      p.style.top  = (cy - 3.5) + 'px';
      document.body.appendChild(p);

      const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.45;
      const dist  = 50 + Math.random() * 65;
      gsap.to(p, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        opacity: 0,
        scale: Math.random() * 1.1 + 0.35,
        duration: 0.6 + Math.random() * 0.3,
        ease: 'power3.out',
        onComplete: () => p.remove(),
      });
    }
  }
  // ── Public enter ──────────────────────────────────────────
  function enter(level) {
    _levelData   = level ?? window.GameState.currentLevel;
    _isAnimating = false;
    _isPaused    = false;
    _tutorialSeen = {};
    
    // Load tutorial completion state from SaveSystem
    if (_levelData?.id === 1 && SaveSystem.isTutorialCompleted()) {
      _tutorialSeen[1] = true;
    }
    
    _selectedAns  = null;

    const quitOverlay = document.getElementById('battle-quit-confirm-overlay');
    if (quitOverlay) quitOverlay.classList.add('hidden');

    const pauseOverlay = document.getElementById('battle-pause-overlay');
    if (pauseOverlay) {
      pauseOverlay.classList.add('hidden');
      pauseOverlay.style.opacity = '0';
    }

    const char = window.GameState.character;
    const byte = window.GameState.byte;

    // Reset temporary companion effects, but keep skill charge between battles.
    _portShieldActive = false;
    _burnTurns        = 0;
    _weakenNextAttack = 1;
    _correctStreak    = 0;
    _byteMaxCharge    = byte?.id === 'poturtle' ? 3 : 4;
    _byteCharge       = Math.min(_byteMaxCharge, window.GameState.byteCharge ?? SaveSystem.load().byteCharge ?? 0);

    // MJ's "Fast Boot" Passive (+1 initial Byte charge)
    if (char?.id === 'mj') {
      _byteCharge = Math.min(_byteMaxCharge, _byteCharge + 1);
    }

    window.GameState.byteCharge = _byteCharge;

    // Build sprite paths
    _charSprites = _getCharSprites(char);
    _byteSprites = _getByteSprites(byte);

    // HP — Player Max HP is fused: Hero HP + equipped Byte HP + Boss Clear Bonuses
    const baseHp = char?.hp ?? 110;
    const byteHp = byte?.hp ?? 40;
    const bossClearBonus = (window.GameState.playerMaxHp ? Math.max(0, window.GameState.playerMaxHp - baseHp - byteHp) : 0);

    _playerMaxHp = baseHp + byteHp + bossClearBonus;

    _playerHp = (window.GameState.playerHp !== null &&
                 window.GameState.playerHp !== undefined)
                 ? Math.min(_playerMaxHp, window.GameState.playerHp)
                 : _playerMaxHp;
    _enemyMaxHp  = _levelData?.enemyHp  ?? 45;
    _enemyHp     = _enemyMaxHp;

    // Questions
    _buildQuestions();
    _currentQ = 0;

    // ── Populate sprite elements ──
    const enemyIdleSrc   = _levelData?.enemyIdleSrc   ?? 'glitchbornBytes/Bitmite/bitmite_idle.png';
    const enemyAttackSrc = _levelData?.enemyAttackSrc ?? 'glitchbornBytes/Bitmite/Bitmite_attack.png';
    _enemySprites = { idle: enemyIdleSrc, attack: enemyAttackSrc };
    // Store enemy attack src on enemy img element for use in animations
    const enemyImg = document.getElementById('battle-enemy-sprite-img');
    if (enemyImg) enemyImg.dataset.attackSrc = enemyAttackSrc;

    document.getElementById('battle-player-sprite-img').src = _charSprites.idle;
    document.getElementById('battle-byte-sprite-img').src   = _byteSprites.idle;
    if (enemyImg) enemyImg.src = enemyIdleSrc;

    // Ensure animation restarts cleanly on all sheets
    ['battle-player-sprite-img','battle-byte-sprite-img','battle-enemy-sprite-img']
      .forEach(id => {
        const img = document.getElementById(id);
        img.classList.remove('sprite-attacking','sprite-static');
        void img.offsetWidth;
      });
    const enemyWrapper = document.getElementById('battle-enemy-sprite-wrapper');
    if (enemyWrapper) {
      enemyWrapper.classList.remove('flip-attack');
    }

    // ── HUD labels ──
    const charName = char?.name?.toUpperCase() ?? '';
    document.getElementById('player-hud-name').textContent  = charName;
    document.getElementById('battle-player-name').textContent = charName;
    document.getElementById('battle-byte-name').textContent  = byte?.name?.toUpperCase() ?? '';

    // Center Badge dynamic level update
    const roundLvl = document.getElementById('battle-round-lvl');
    if (roundLvl && _levelData) {
      roundLvl.textContent = `LVL ${_levelData.id}`;
    }

    const playerCardName = document.getElementById('battle-player-card-name');
    const playerRole     = document.getElementById('battle-player-role');
    const playerStatHp   = document.getElementById('battle-player-stat-hp');
    const playerStatSync = document.getElementById('battle-player-stat-sync');
    const playerPassiveName = document.getElementById('battle-player-passive-name');
    const playerPassiveDesc = document.getElementById('battle-player-passive-desc');
    const byteCardName   = document.getElementById('battle-byte-card-name');
    const byteAbility    = document.getElementById('battle-byte-ability');
    const byteDesc       = document.getElementById('battle-byte-desc');
    const skillSlot      = document.querySelector('.battle-skill-slot');
    const skillBtn       = document.getElementById('btn-byte-skill');

    if (playerCardName) playerCardName.textContent = charName;
    if (playerRole) playerRole.textContent = char?.role ?? 'Hero';
    if (playerStatHp) playerStatHp.textContent = `❤ Max HP: ${_playerMaxHp}`;
    if (playerStatSync) playerStatSync.textContent = `⚡ Sync: ${char?.dmg ?? 0}`;
    if (playerPassiveName) {
      playerPassiveName.textContent = char?.passiveName ?? 'None';
      const charThemes = {
        mj: '#f9c159', harold: '#38bdf8', bai: '#fb923c', dale: '#2dd4bf',
        paps: '#a78bfa', bebz: '#34d399', matt: '#f43f5e', jb: '#fbbf24'
      };
      playerPassiveName.style.color = charThemes[char?.id] ?? '#f9c159';
    }
    if (playerPassiveDesc) playerPassiveDesc.textContent = char?.passiveDesc ?? '';
    if (byteCardName) byteCardName.textContent = byte?.name?.toUpperCase() ?? '';
    if (byteAbility) byteAbility.textContent = byte?.skill ?? 'Byte Ability';
    if (byteDesc) byteDesc.textContent = byte?.skillEffect ?? byte?.roleDesc ?? '';
    if (skillSlot && skillBtn) skillSlot.appendChild(skillBtn);

    // Dynamic enemy HUD name and platform name
    const enemyName = _levelData?.enemy?.toUpperCase() ?? 'BIT MITE';
    document.getElementById('enemy-hud-name').textContent = enemyName;
    const enemyCardName = document.getElementById('battle-enemy-card-name');
    const enemyDesc = document.getElementById('battle-enemy-desc');
    if (enemyCardName) enemyCardName.textContent = enemyName;
    if (enemyDesc) enemyDesc.textContent = _levelData?.enemyDesc ?? 'A corrupted Byte shaped by broken learning data.';
    const enemyStageName = document.getElementById('battle-enemy-name');
    if (enemyStageName) enemyStageName.textContent = enemyName;

    // Dynamically update enemy role label
    const enemyRole = document.getElementById('battle-enemy-role');
    if (enemyRole) {
      if (_levelData?.id === 5) {
        enemyRole.textContent = 'Prelim Stage Boss';
      } else {
        enemyRole.textContent = 'Glitchborn Byte';
      }
    }

    // Configure dynamic tooltips
    const quitWrapper = document.getElementById('wrapper-battle-quit');
    const submitWrapper = document.getElementById('wrapper-battle-submit');
    const skillWrapper = document.getElementById('wrapper-byte-skill');
    const revealWrapper = document.getElementById('wrapper-battle-reveal');

    if (revealWrapper) {
      revealWrapper.setAttribute('data-tooltip', 'Reveal the correct answer instantly. Limit of 2 per academic arc.');
    }

    if (_levelData?.id === 1) {
      if (quitWrapper) quitWrapper.setAttribute('data-tooltip', 'Click this to run away from this tutorial battle.');
      if (submitWrapper) submitWrapper.setAttribute('data-tooltip', 'Confirm your selected answer and submit it.');
      if (skillWrapper) skillWrapper.setAttribute('data-tooltip', "Activate your companion Byte's special ability when charged!");
    } else {
      if (quitWrapper) quitWrapper.setAttribute('data-tooltip', 'Abandon the current zone battle and return to the map screen.');
      if (submitWrapper) submitWrapper.setAttribute('data-tooltip', 'Commit your choice and execute your turn.');
      if (skillWrapper) skillWrapper.setAttribute('data-tooltip', "Unleash your Byte's active technique using accumulated energy.");
    }

    // Dynamic enemy sprite window height based on whether it is a stage boss
    const enemyWin = document.getElementById('battle-enemy-sprite-window');
    if (enemyWin) {
      enemyWin.style.height = _levelData?.isBoss ? '224px' : '128px';
    }

    _updatePlayerHpUI();
    _updateEnemyHpUI();
    _updateByteSkillUI();
    _updateRevealButtonUI();

    // ── Reset GSAP transforms on sprites ──
    gsap.set('#battle-player-sprite-window', { x: 0, y: 0, scale: 1, rotation: 0 });
    gsap.set('#battle-byte-sprite-window',   { x: 0, y: 0, scale: 1 });
    gsap.set('#battle-enemy-sprite-window',  { x: 0, y: 0, rotation: 0 });

    // ── First question ──
    _renderQuestion(0);

    // ── Byte intro check (first time using this byte) → then tutorial or timer ──
    const byteForIntro = window.GameState.byte;
    const isLevelOne = _levelData?.id === 1;
    if (byteForIntro && !SaveSystem.isByteIntroduced(byteForIntro.id)) {
      if (isLevelOne) {
        // Level 1: Mark introduced (tutorial covers bytes) but don't show popup
        SaveSystem.markByteIntroduced(byteForIntro.id);
        _startBattleFlow();
      } else {
        // Level 2+: Show byte intro popup
        _showByteIntro(byteForIntro, _startBattleFlow);
      }
    } else {
      // Byte already introduced — normal flow
      _startBattleFlow();
    }

    // ── Start idle loop with small delay ──
    setTimeout(_startIdleLoop, 600);

    // ── BGM: use level-specific track ──
    const bgmKey = _levelData?.bgm ?? 'prelimStage';
    AudioManager.playBGM(bgmKey, { volume: 0.55 });
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    document.getElementById('btn-battle-submit')
      .addEventListener('click', _submit);

    document.getElementById('btn-byte-skill')
      .addEventListener('click', _useByteSkill);

    const revealBtn = document.getElementById('btn-battle-reveal');
    if (revealBtn) {
      revealBtn.addEventListener('click', _handleReveal);
    }

    document.addEventListener('keydown', e => {
      if (window.ScreenManager.currentScreen !== 'battle') return;
      if (e.code === 'Enter') _submit();
    });

    // Flee / Quit Battle Logic
    const quitBtn = document.getElementById('btn-battle-quit');
    const quitOverlay = document.getElementById('battle-quit-confirm-overlay');
    const quitYes = document.getElementById('battle-quit-confirm-yes');
    const quitNo = document.getElementById('battle-quit-confirm-no');

    if (quitBtn && quitOverlay) {
      quitBtn.addEventListener('click', () => {
        AudioManager.playClickSFX();
        quitOverlay.classList.remove('hidden');
        
        // Fade in the dimmed background overlay
        gsap.fromTo(quitOverlay, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
        
        // Scale in the inner card modal with a clean retro bounce
        const innerCard = quitOverlay.querySelector('.glass-panel');
        if (innerCard) {
          gsap.fromTo(innerCard, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.15)' });
        }
      });
    }

    if (quitNo && quitOverlay) {
      quitNo.addEventListener('click', () => {
        AudioManager.playBackSFX();
        
        // Fade out background overlay
        gsap.to(quitOverlay, {
          opacity: 0, duration: 0.2, ease: 'power2.out', onComplete: () => {
            quitOverlay.classList.add('hidden');
          }
        });
        
        // Scale out the inner card modal
        const innerCard = quitOverlay.querySelector('.glass-panel');
        if (innerCard) {
          gsap.to(innerCard, { scale: 0.85, opacity: 0, duration: 0.2, ease: 'power2.in' });
        }
      });
    }

    if (quitYes && quitOverlay) {
      quitYes.addEventListener('click', () => {
        AudioManager.playConfirmSFX();
        // Hide confirmation
        quitOverlay.classList.add('hidden');
        
        _stopQuestionTimer();

        // Reset byte charge on flee — running away forfeits all accumulated charge
        _setByteCharge(0);
        window.GameState.byteCharge = 0;
        SaveSystem.saveByteCharge(0);

        // Return to map screen cleanly
        window.ScreenManager.goTo('prelim-map', {
          onEnter: () => {
            // Restore map BGM
            AudioManager.playBGM('prelimMap', { volume: 0.55 });
            // Re-render map HUD
            if (window.PrelimMapScreen && typeof window.PrelimMapScreen.enter === 'function') {
              window.PrelimMapScreen.enter();
            }
          }
        });
      });
    }

    // Pause / Resume Battle Logic
    const pauseBtn = document.getElementById('btn-battle-pause');
    const resumeBtn = document.getElementById('btn-battle-resume');
    const pauseOverlay = document.getElementById('battle-pause-overlay');

    if (pauseBtn && pauseOverlay) {
      pauseBtn.addEventListener('click', () => {
        if (_isAnimating || _isPaused) return;
        AudioManager.playClickSFX();
        _isPaused = true;
        _pauseStartTime = Date.now(); // Track pause start time for duration limit
        pauseOverlay.classList.remove('hidden');
        gsap.fromTo(pauseOverlay, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
        
        const resumeBtnEl = document.getElementById('btn-battle-resume');
        if (resumeBtnEl) {
          gsap.fromTo(resumeBtnEl, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.15)', delay: 0.05 });
        }
      });
    }

    if (resumeBtn && pauseOverlay) {
      resumeBtn.addEventListener('click', () => {
        if (!_isPaused) return;
        
        // Check pause duration limit (5 min max)
        const pauseDuration = _pauseStartTime ? Date.now() - _pauseStartTime : 0;
        if (pauseDuration > MAX_PAUSE_DURATION) {
          // Pause exceeded maximum duration — force exit to prevent abuse
          alert('Pause time exceeded! Returning to main menu.');
          window.ScreenManager.goTo('main-menu');
          return;
        }
        
        AudioManager.playConfirmSFX();
        gsap.to(pauseOverlay, {
          opacity: 0, duration: 0.2, ease: 'power2.out', onComplete: () => {
            pauseOverlay.classList.add('hidden');
            _isPaused = false;
            _pauseStartTime = null; // Reset pause start time
          }
        });
      });
    }

    // Tutorial flow button listener
    const tutorialDismissBtn = document.getElementById('btn-tutorial-dismiss');
    if (tutorialDismissBtn) {
      tutorialDismissBtn.addEventListener('click', _advanceTutorial);
    }

    // Tutorial skip button listener
    const tutorialSkipBtn = document.getElementById('btn-tutorial-skip');
    if (tutorialSkipBtn) {
      tutorialSkipBtn.addEventListener('click', _skipTutorial);
    }
  }

  return { init, enter };

})();
