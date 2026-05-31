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

  // Byte Ability States
  let _byteCharge       = 0;
  let _byteMaxCharge    = 3;
  let _portShieldActive = false;
  let _burnTurns        = 0;
  let _weakenNextAttack = 1;
  const BURN_DAMAGE     = 8; // 8 burn damage per turn

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

  // ── Question bank ─────────────────────────────────────────

  // Hardcoded tutorial questions — always first 2, guaranteed easy wins
  const TUTORIAL_QUESTIONS = [
    {
      q:       'What does IT stand for?',
      choices: { A: 'Information Technology', B: 'Internet Technology',
                 C: 'Internal Tools',         D: 'Integrated Teaching' },
      answer: 'A',
    },
    {
      q:       'What is a bit?',
      choices: { A: 'The smallest unit of data', B: 'A computer screen',
                 C: 'A group of files',           D: 'A software update' },
      answer: 'A',
    },
  ];

  // Randomized pool (20 prelim questions, excluding the 2 above)
  const PRELIM_BANK = [
    { q: 'Which device is commonly used to input text into a computer?',
      choices: { A: 'Speaker', B: 'Monitor', C: 'Keyboard', D: 'Printer' }, answer: 'C' },
    { q: 'Which computer part displays visual output?',
      choices: { A: 'Scanner', B: 'Mouse', C: 'Keyboard', D: 'Monitor' }, answer: 'D' },
    { q: 'Which component is often called the brain of the computer?',
      choices: { A: 'CPU', B: 'Hard drive', C: 'Power supply', D: 'RAM' }, answer: 'A' },
    { q: 'Which type of memory is temporary and clears when the computer turns off?',
      choices: { A: 'HDD', B: 'SSD', C: 'RAM', D: 'ROM' }, answer: 'C' },
    { q: 'Which storage device is usually faster than a traditional hard disk drive?',
      choices: { A: 'DVD', B: 'Floppy disk', C: 'SSD', D: 'Printer' }, answer: 'C' },
    { q: 'What does OS stand for?',
      choices: { A: 'Online System', B: 'Output Service', C: 'Operating System', D: 'Open Software' }, answer: 'C' },
    { q: 'Which of the following is an operating system?',
      choices: { A: 'Windows', B: 'Adobe Photoshop', C: 'Google Chrome', D: 'Microsoft Word' }, answer: 'A' },
    { q: 'Which software is used to browse websites?',
      choices: { A: 'Database', B: 'Compiler', C: 'Web browser', D: 'Spreadsheet' }, answer: 'C' },
    { q: 'Which of these is an input device?',
      choices: { A: 'Printer', B: 'Mouse', C: 'Monitor', D: 'Speaker' }, answer: 'B' },
    { q: 'Which of these is an output device?',
      choices: { A: 'Scanner', B: 'Mouse', C: 'Keyboard', D: 'Printer' }, answer: 'D' },
    { q: 'Which number system uses only 0 and 1?',
      choices: { A: 'Binary', B: 'Decimal', C: 'Octal', D: 'Hexadecimal' }, answer: 'A' },
    { q: 'How many bits are in one byte?',
      choices: { A: '2', B: '16', C: '8', D: '4' }, answer: 'C' },
    { q: 'What does GUI stand for?',
      choices: { A: 'General User Internet', B: 'Graphical User Interface',
                 C: 'Graphic Unit Instruction', D: 'Global Utility Input' }, answer: 'B' },
    { q: 'What is hardware?',
      choices: { A: 'Computer instructions', B: 'Network password',
                 C: 'Website content',       D: 'Physical computer components' }, answer: 'D' },
    { q: 'What is software?',
      choices: { A: 'Physical computer parts', B: 'Internet cable',
                 C: 'Programs and applications', D: 'Computer chair' }, answer: 'C' },
    { q: 'What does URL stand for?',
      choices: { A: 'Unified Routing Line', B: 'Universal Record Link',
                 C: 'Uniform Resource Locator', D: 'User Reference Login' }, answer: 'C' },
    { q: 'What is malware?',
      choices: { A: 'A storage device', B: 'A keyboard type',
                 C: 'Malicious software', D: 'Helpful software' }, answer: 'C' },
    { q: 'What does Wi-Fi allow devices to do?',
      choices: { A: 'Connect wirelessly to a network', B: 'Clean storage automatically',
                 C: 'Print without ink', D: 'Increase battery capacity' }, answer: 'A' },
    { q: 'What is programming?',
      choices: { A: 'Writing instructions for computers', B: 'Cleaning hardware',
                 C: 'Designing posters', D: 'Browsing websites' }, answer: 'A' },
    { q: 'What is an algorithm?',
      choices: { A: 'A computer brand', B: 'A step-by-step solution to a problem',
                 C: 'A keyboard shortcut', D: 'A broken file' }, answer: 'B' },
  ];

  // Tutorial callout text shown AFTER Q1 and Q2 are answered correctly
  const TUTORIAL_CALLOUTS = {
    1: 'Your companion Byte just attacked Bit Mite! Correct answers deal combined damage — yours plus your Byte\'s. Watch the enemy HP bar drop.',
    2: 'Those HP bars at the top track both fighters. Your Health Points carry over into the next level. Reach zero and you retry.',
  };

  function _buildQuestions() {
    // If level data has its own questions bank, use it (10 random from the bank)
    if (_levelData?.questionsBank && _levelData.questionsBank.length > 0) {
      const shuffled = [..._levelData.questionsBank].sort(() => Math.random() - 0.5);
      _questions = shuffled.slice(0, Math.min(10, shuffled.length));
      return;
    }
    // Level 1 (tutorial flow): fixed tutorial questions + random prelim bank
    const shuffled = [...PRELIM_BANK].sort(() => Math.random() - 0.5);
    _questions = [...TUTORIAL_QUESTIONS, ...shuffled.slice(0, 8)];
  }

  // ── Hearts-based HP HUD (Bookworm Adventures style) ───────
  function _renderHearts(containerId, currentHp, maxHp, isEnemy) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const hpPerHeart = 10;
    const totalHearts = Math.ceil(maxHp / hpPerHeart);
    const activeHearts = Math.ceil(currentHp / hpPerHeart);

    const wrap = document.createElement('div');
    wrap.className = 'flex flex-wrap gap-1 ' + (isEnemy ? 'justify-end' : 'justify-start');

    for (let i = 0; i < totalHearts; i++) {
      const heart = document.createElement('span');
      heart.className = 'text-base select-none transition-all duration-300';
      if (i < activeHearts) {
        heart.textContent = '❤️';
        heart.style.filter = 'drop-shadow(0 0 5px rgba(239, 68, 68, 0.75))';
      } else {
        heart.textContent = '🖤';
        heart.style.opacity = '0.35';
      }
      wrap.appendChild(heart);
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

    document.getElementById('battle-q-num').textContent =
      `Q ${index + 1} / ${_questions.length}`;
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
      btn.innerHTML =
        `<span class="battle-answer-letter">${letter}.</span>` +
        `<span>${q.choices[letter]}</span>`;
      btn.addEventListener('click', () => _selectAnswer(letter));
      answersEl.appendChild(btn);
    });

    const submitBtn = document.getElementById('btn-battle-submit');
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-40');
  }

  function _selectAnswer(letter) {
    if (_isAnimating) return;

    _selectedAns = letter;

    ['A', 'B', 'C', 'D'].forEach(l => {
      const btn = document.getElementById(`ans-btn-${l}`);
      if (!btn) return;
      btn.classList.toggle('selected', l === letter);
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

  // ── Tutorial callout ──────────────────────────────────────
  function _showTutorial(index, onDismiss) {
    _stopIdleLoop();
    const overlay = document.getElementById('battle-tutorial-overlay');
    const textEl  = document.getElementById('battle-tutorial-text');
    const btn     = document.getElementById('btn-tutorial-dismiss');
    if (!overlay || !TUTORIAL_CALLOUTS[index]) { onDismiss?.(); return; }

    textEl.textContent = TUTORIAL_CALLOUTS[index];
    overlay.classList.remove('hidden');
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3 });

    const handler = () => {
      btn.removeEventListener('click', handler);
      gsap.to(overlay, { opacity: 0, duration: 0.2, onComplete: () => {
        overlay.classList.add('hidden');
        _startIdleLoop();
        onDismiss?.();
      }});
    };
    btn.addEventListener('click', handler);
  }

  // ── Submit logic ──────────────────────────────────────────
  function _submit() {
    if (!_selectedAns || _isAnimating) return;
    _isAnimating = true;

    const q         = _questions[_currentQ];
    const isCorrect = (_selectedAns === q.answer);

    // Lock inputs
    document.getElementById('btn-battle-submit').disabled = true;
    document.getElementById('btn-battle-submit').classList.add('opacity-40');
    ['A','B','C','D'].forEach(l => {
      const b = document.getElementById(`ans-btn-${l}`);
      if (b) b.style.pointerEvents = 'none';
    });

    if (isCorrect) _handleCorrect();
    else           _handleWrong();
  }

  function _handleCorrect() {
    // Feedback label
    const res = document.getElementById('battle-result-line');
    res.textContent = '✓ CORRECT!';
    res.className   = 'font-ui text-sm font-bold text-emerald-400';

    AudioManager.playCorrectAnswerSFX();

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
          const char = window.GameState.character;
          const byte = window.GameState.byte;
          const dmg  = (char?.dmg ?? 0) + (byte?.dmg ?? 0);
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

      // Tutorial callout on Q1 and Q2 (1-indexed after answer)
      const tutIdx = _currentQ + 1;
      if (_levelData?.id === 1 && TUTORIAL_CALLOUTS[tutIdx] && !_tutorialSeen[tutIdx]) {
        _tutorialSeen[tutIdx] = true;
        _showTutorial(tutIdx, _afterAnimationCheck);
      } else {
        _afterAnimationCheck();
      }
    }, 1450);
  }

  function _handleWrong() {
    // Feedback label
    const res = document.getElementById('battle-result-line');
    res.textContent = '✗ WRONG!';
    res.className   = 'font-ui text-sm font-bold text-red-400';

    AudioManager.playWrongAnswerSFX();

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
        screen.classList.remove('battle-shaking');
        void screen.offsetWidth;
        screen.classList.add('battle-shaking');

        // Red flash
        gsap.fromTo('#battle-damage-flash',
          { opacity: 0 },
          { opacity: 1, duration: 0.05, yoyo: true, repeat: 1 });

        // Damage calculation & Port Shield Check
        let dmg = _levelData?.enemyDmg ?? 8;
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
    if (_currentQ >= _questions.length) { _victory(); return; }
    _renderQuestion(_currentQ);
  }

  // ── Victory ────────────────────────────────────────────────
  function _victory() {
    _stopIdleLoop();
    AudioManager.playVictorySFX();

    // Persist HP carry-over
    window.GameState.playerHp = _playerHp;
    SaveSystem.savePlayerHp(_playerHp, _playerMaxHp);
    SaveSystem.saveByteCharge(_byteCharge);

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
    _tutorialSeen = {};
    _selectedAns  = null;

    const char = window.GameState.character;
    const byte = window.GameState.byte;

    // Reset temporary companion effects, but keep skill charge between battles.
    _portShieldActive = false;
    _burnTurns        = 0;
    _weakenNextAttack = 1;
    _byteMaxCharge    = byte?.id === 'poturtle' ? 3 : 4;
    _byteCharge       = Math.min(_byteMaxCharge, window.GameState.byteCharge ?? SaveSystem.load().byteCharge ?? 0);
    window.GameState.byteCharge = _byteCharge;

    // Build sprite paths
    _charSprites = _getCharSprites(char);
    _byteSprites = _getByteSprites(byte);

    // HP — carry over from previous level if set
    _playerMaxHp = window.GameState.playerMaxHp ?? char?.hp ?? 110;
    _playerHp = (window.GameState.playerHp !== null &&
                 window.GameState.playerHp !== undefined)
                 ? window.GameState.playerHp
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
    const byteCardName   = document.getElementById('battle-byte-card-name');
    const byteAbility    = document.getElementById('battle-byte-ability');
    const byteDesc       = document.getElementById('battle-byte-desc');
    const skillSlot      = document.querySelector('.battle-skill-slot');
    const skillBtn       = document.getElementById('btn-byte-skill');

    if (playerCardName) playerCardName.textContent = charName;
    if (playerRole) playerRole.textContent = char?.role ?? 'Hero';
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

    // Dynamic enemy sprite window height based on whether it is a stage boss
    const enemyWin = document.getElementById('battle-enemy-sprite-window');
    if (enemyWin) {
      enemyWin.style.height = _levelData?.isBoss ? '224px' : '128px';
    }

    _updatePlayerHpUI();
    _updateEnemyHpUI();
    _updateByteSkillUI();

    // ── Reset GSAP transforms on sprites ──
    gsap.set('#battle-player-sprite-window', { x: 0, y: 0, scale: 1, rotation: 0 });
    gsap.set('#battle-byte-sprite-window',   { x: 0, y: 0, scale: 1 });
    gsap.set('#battle-enemy-sprite-window',  { x: 0, y: 0, rotation: 0 });

    // ── First question ──
    _renderQuestion(0);

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

    document.addEventListener('keydown', e => {
      if (window.ScreenManager.currentScreen !== 'battle') return;
      if (e.code === 'Enter') _submit();
    });
  }

  return { init, enter };

})();
