// ============================================================
//  Rise and Shine — Cutscene Engine
//  Typewriter: boolean toggle inside char-insertion loop (no interval)
//  Portraits: GSAP active/inactive via CSS class swap + gsap override
// ============================================================

window.CutsceneScreen = (() => {

  // ── State ─────────────────────────────────────────────────
  let _lines          = [];
  let _currentLine    = 0;
  let _isTyping       = false;
  let _typingTimer    = null;   // single recursive setTimeout handle
  let _onComplete     = null;

  // Portrait src tracked so we don't reload same image
  let _rightPortraitSrc = '';

  // ── Speaker config factory ─────────────────────────────────
  function _getSpeaker(id) {
    const char = window.GameState.character;
    const byte = window.GameState.byte;

    const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

    // Build player profile path
    const charId   = char?.id ?? 'unknown';
    const charName = char?.name ?? 'Player';
    const charPortrait = `playableCharacters/${cap(charId)}/profile_sprite/${cap(charId)}_profile.png`;

    // Byte profile path comes from byte.image (already defined in data.js)
    const byteName    = byte?.name ?? 'Byte';
    const bytePortrait = byte?.image ?? '';

    // Boss speaker uses current level enemy data
    const lvl = window.GameState.currentLevel;
    const bossLabel   = lvl?.cutsceneEnemyLabel ?? 'BOSS';

    const map = {
      player: { label: charName.toUpperCase(), portrait: charPortrait, color: 'var(--gold)' },
      byte:   { label: byteName.toUpperCase(),  portrait: bytePortrait, color: '#c4b5fd' },
      system: { label: 'SYSTEM',  portrait: null, color: '#67e8f9' },
      boss:   { label: bossLabel, portrait: null, isLeftSpeaker: true, color: '#f87171' },
    };

    return map[id] ?? map.system;
  }

  // ── Portrait helpers ──────────────────────────────────────
  function _setPortraitActive(imgEl, nameEl, src, name, color) {
    if (src && imgEl.src !== src) imgEl.src = src;
    nameEl.textContent = name;
    nameEl.style.color = color ?? 'var(--gold)';

    imgEl.classList.remove('cs-dim');
    imgEl.classList.add('cs-active');
    // Remove inline transform override on right portrait (left has its own)
    if (imgEl.id === 'cutscene-right-portrait') {
      imgEl.style.transform = '';
    }
  }

  function _setPortraitDim(imgEl) {
    imgEl.classList.remove('cs-active');
    imgEl.classList.add('cs-dim');
    // Restore Bit Mite flip for left portrait
    if (imgEl.id === 'cutscene-left-portrait') {
      imgEl.style.transform = 'scaleX(-1) scale(0.86) translateY(8px)';
    }
  }

  // ── Typewriter — boolean toggle in char loop ──────────────
  //  Every character insertion drives the sound decision.
  //  soundOn flips each call; AudioManager is called only when true.
  //  No independent interval — the recursive setTimeout IS the loop.
  function _typeText(targetEl, fullText, onDone) {
    clearTimeout(_typingTimer);
    targetEl.textContent = '';
    _isTyping = true;

    let i       = 0;
    let soundOn = true;   // boolean toggle bound to insertion

    function _insertChar() {
      if (i >= fullText.length) {
        _isTyping = false;
        onDone?.();
        return;
      }

      // Insert character
      targetEl.textContent += fullText[i];

      // Sound bound directly to insertion — no separate timer
      if (soundOn) AudioManager.playClickSFX();
      soundOn = !soundOn;   // strict toggle

      i++;
      _typingTimer = setTimeout(_insertChar, 28);
    }

    _insertChar();
  }

  function _skipTyping() {
    clearTimeout(_typingTimer);
    _isTyping = false;
    const line = _lines[_currentLine];
    if (line) document.getElementById('cutscene-text').textContent = line.text;
  }

  // ── Show a single line ────────────────────────────────────
  function _showLine(index) {
    const line = _lines[index];
    if (!line) return;

    const sp  = _getSpeaker(line.speaker);
    const leftPortrait  = document.getElementById('cutscene-left-portrait');
    const rightPortrait = document.getElementById('cutscene-right-portrait');
    const rightName     = document.getElementById('cutscene-right-name');
    const labelEl       = document.getElementById('cutscene-speaker-label');
    const textEl        = document.getElementById('cutscene-text');

    // Update speaker label
    labelEl.textContent  = sp.label;
    labelEl.style.color  = sp.color;

    // Portrait transitions
    if (sp.isLeftSpeaker) {
      // Boss speaking → left portrait active, right dimmed
      _setPortraitActive(leftPortrait,
        document.getElementById('cutscene-left-name'),
        null,   // src already set in playScene
        sp.label, sp.color);
      _setPortraitDim(rightPortrait);
    } else if (sp.portrait) {
      // Player or Byte speaking → right portrait active, enemy dimmed
      _setPortraitActive(rightPortrait, rightName, sp.portrait, sp.label, sp.color);
      _setPortraitDim(leftPortrait);
    } else {
      // System voice → both dim, no portrait change
      _setPortraitDim(leftPortrait);
      _setPortraitDim(rightPortrait);
    }

    // Typewriter — boolean toggle, no interval
    _typeText(textEl, line.text, () => {
      // typing done — user can press next
    });
  }

  // ── Advance ───────────────────────────────────────────────
  function _advance() {
    if (_isTyping) {
      _skipTyping();
      return;
    }

    _currentLine++;
    if (_currentLine >= _lines.length) {
      if (typeof _onComplete === 'function') _onComplete();
    } else {
      _showLine(_currentLine);
    }
  }

  // ── Public API ────────────────────────────────────────────

  /**
   * Start a scene.
   * Call AFTER ScreenManager.goTo('cutscene') has resolved so the DOM is visible.
   */
  function playScene(lines, onComplete) {
    _lines        = lines;
    _currentLine  = 0;
    _isTyping     = false;
    _onComplete   = onComplete;

    // Start playing the Intro theme!
    AudioManager.playBGM('intro', { volume: 0.5 });

    // Seed right portrait with player profile immediately
    const char = window.GameState.character;
    if (char) {
      const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
      const rightPortrait = document.getElementById('cutscene-right-portrait');
      if (rightPortrait) {
        rightPortrait.src = `playableCharacters/${cap(char.id)}/profile_sprite/${cap(char.id)}_profile.png`;
      }
    }

    // Seed left portrait with current level enemy sprite (dynamic)
    const lvl = window.GameState.currentLevel;
    const leftPortrait  = document.getElementById('cutscene-left-portrait');
    const leftNameEl    = document.getElementById('cutscene-left-name');
    if (leftPortrait) {
      const portraitSrc = lvl?.enemyProfileSrc ?? lvl?.enemyIdleSrc;
      if (portraitSrc) leftPortrait.src = portraitSrc;
      leftPortrait.style.setProperty('object-fit', lvl?.enemyProfileSrc ? 'contain' : 'cover', 'important');
      leftPortrait.style.setProperty('object-position', lvl?.enemyProfileSrc ? 'center' : 'left', 'important');
      leftPortrait.classList.remove('cs-active');
      leftPortrait.classList.add('cs-dim');
      leftPortrait.style.transform = 'scaleX(-1) scale(0.86) translateY(8px)';
    }
    // Update left name badge dynamically
    if (leftNameEl && lvl?.cutsceneEnemyLabel) {
      leftNameEl.textContent = lvl.cutsceneEnemyLabel;
    }

    _showLine(0);
  }

  function init() {
    document.getElementById('btn-cutscene-next')
      .addEventListener('click', _advance);

    document.addEventListener('keydown', (e) => {
      if (window.ScreenManager.currentScreen !== 'cutscene') return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        _advance();
      }
    });
  }

  return { init, playScene };

})();
