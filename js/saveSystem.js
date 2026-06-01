// ============================================================
//  Rise and Shine — Save System
//  Persists game progress in localStorage under key rns_save_v1
// ============================================================

window.SaveSystem = (() => {

  const SAVE_KEY = 'rns_save_v1';

  // ── Default state ─────────────────────────────────────────
  function _defaultSave() {
    return {
      characterId:        null,
      byteId:             'poturtle',
      unlockedBytes:      ['poturtle', 'firewisp', 'lagoon'],
      introducedBytes:    [],   // byte IDs whose intro popup has been shown
      playerHp:           null,
      playerMaxHp:        null,
      byteCharge:         0,
      prelimProgress:     0,    // highest level cleared (0 = none)
      revealsLeft:        2,    // limit of 2 reveals for the entire Prelim Arc!
      tutorialCompleted:  false, // Level 1 walkthrough tutorial completion flag
      bytesTutorialCompleted: false, // Bytes panel tutorial completion flag
      levelLocks: {
        1: false,
        2: true,
        3: true,
        4: true,
        5: true,
      },
    };
  }

  // ── Read / Write ──────────────────────────────────────────
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return _defaultSave();
      const parsed = JSON.parse(raw);
      const defaults = _defaultSave();
      const defaultLocks = defaults.levelLocks;
      const defaultUnlockedBytes = defaults.unlockedBytes;
      const data = Object.assign({}, defaults, parsed);

      // Deep-merge nested save sections so older saves cannot drop new levels.
      data.levelLocks = Object.assign({}, defaultLocks, parsed.levelLocks ?? {});

      // Keep starter bytes available even if an older/corrupt save omits them.
      const unlocked = Array.isArray(parsed.unlockedBytes) ? parsed.unlockedBytes : defaultUnlockedBytes;
      data.unlockedBytes = Array.from(new Set([...defaultUnlockedBytes, ...unlocked]));

      // Merge introducedBytes (array of byte IDs whose intro has been shown)
      data.introducedBytes = Array.isArray(parsed.introducedBytes) ? parsed.introducedBytes : [];

      if (!data.unlockedBytes.includes(data.byteId)) {
        data.byteId = data.unlockedBytes[0] ?? 'poturtle';
      }

      return data;
    } catch (e) {
      console.warn('[SaveSystem] Failed to parse save data, using defaults:', e);
      return _defaultSave();
    }
  }

  function save(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[SaveSystem] Failed to write save data:', e);
    }
  }

  function reset() {
    localStorage.removeItem(SAVE_KEY);
  }

  // ── Helpers that patch the current save ──────────────────

  /** Unlock a level node by id (1–5). */
  function unlockLevel(levelId) {
    const data = load();
    data.levelLocks[levelId] = false;
    // Update progress counter
    if (levelId - 1 > data.prelimProgress) {
      data.prelimProgress = levelId - 1;
    }
    save(data);
  }

  /** Mark a level as cleared (progress tracking). */
  function markLevelCleared(levelId) {
    const data = load();
    if (levelId > data.prelimProgress) {
      data.prelimProgress = levelId;
    }
    save(data);
  }

  /** Unlock a byte companion by id string. */
  function unlockByte(byteId) {
    const data = load();
    if (!data.unlockedBytes.includes(byteId)) {
      data.unlockedBytes.push(byteId);
      save(data);
    }
  }

  /** Switch the active byte (must already be unlocked). */
  function equipByte(byteId) {
    const data = load();
    if (data.unlockedBytes.includes(byteId)) {
      data.byteId = byteId;
      save(data);
    }
  }

  /** Called after Prelim Boss clear: resets HP to max, increases maxHP by 20. */
  function clearPrelimBoss(currentMaxHp) {
    const data = load();
    const alreadyCleared = data.prelimProgress >= 5;
    const baseMax = currentMaxHp ?? data.playerMaxHp ?? 110;
    const newMax = alreadyCleared ? baseMax : baseMax + 20;
    data.playerHp    = newMax;  // Full heal
    data.playerMaxHp = newMax;
    data.prelimProgress = 5;
    data.levelLocks[5] = false;
    save(data);
    return newMax;
  }

  /** Persist the current player HP (carry-over between levels). */
  function savePlayerHp(hp, maxHp) {
    const data = load();
    data.playerHp    = hp;
    data.playerMaxHp = maxHp;
    save(data);
  }

  /** Persist companion skill charge between battles. */
  function saveByteCharge(charge) {
    const data = load();
    data.byteCharge = Math.max(0, charge ?? 0);
    save(data);
  }

  /** Persist character choice. */
  function saveCharacter(charId, baseHp) {
    const data = load();
    data.characterId = charId;
    data.playerMaxHp = null;
    data.playerHp    = null;
    data.revealsLeft = 2; // Reset reveals for a fresh run
    save(data);
  }

  /** Persist the remaining reveals. */
  function saveReveals(count) {
    const data = load();
    data.revealsLeft = Math.max(0, count ?? 0);
    save(data);
  }

  /** Mark a byte companion as introduced (so its intro popup never shows again). */
  function markByteIntroduced(byteId) {
    const data = load();
    if (!Array.isArray(data.introducedBytes)) data.introducedBytes = [];
    if (!data.introducedBytes.includes(byteId)) {
      data.introducedBytes.push(byteId);
      save(data);
    }
  }

  /** Check if a byte companion has already been introduced. */
  function isByteIntroduced(byteId) {
    const data = load();
    return Array.isArray(data.introducedBytes) && data.introducedBytes.includes(byteId);
  }

  /** Mark the Level 1 tutorial as completed. */
  function markTutorialCompleted() {
    const data = load();
    data.tutorialCompleted = true;
    save(data);
  }

  /** Check if the Level 1 tutorial has been completed. */
  function isTutorialCompleted() {
    const data = load();
    return data.tutorialCompleted === true;
  }

  /** Mark the Bytes panel tutorial as completed. */
  function markBytesTutorialCompleted() {
    const data = load();
    data.bytesTutorialCompleted = true;
    save(data);
  }

  /** Check if the Bytes panel tutorial has been completed. */
  function isBytesTutorialCompleted() {
    const data = load();
    return data.bytesTutorialCompleted === true;
  }

  /**
   * Apply saved state to window.GameState and GAME_DATA level locks.
   * Call this on entering the prelim map so locks reflect saved progress.
   */
  function applyToGameState() {
    const data = load();
    const GS   = window.GameState;
    const GD   = window.GAME_DATA;

    // Character (only if not yet set by charSelect flow)
    if (!GS.character && data.characterId) {
      GS.character = GD.characters.find(c => c.id === data.characterId) ?? null;
    }

    // Byte — find from allBytes registry
    if (data.byteId && data.unlockedBytes.includes(data.byteId)) {
      const found = GD.allBytes?.find(b => b.id === data.byteId);
      if (found) GS.byte = found;
    }

    // HP carryover
    GS.playerHp    = data.playerHp;
    GS.playerMaxHp = data.playerMaxHp;
    GS.byteCharge = Math.max(0, data.byteCharge ?? 0);

    // Reveals carryover
    GS.revealsLeft = (data.revealsLeft !== undefined) ? data.revealsLeft : 2;

    // Level locks — apply to the live data
    GD.prelimLevels.forEach(lvl => {
      lvl.locked = data.levelLocks[lvl.id] ?? lvl.locked;
    });
  }

  return {
    load,
    save,
    reset,
    unlockLevel,
    markLevelCleared,
    unlockByte,
    equipByte,
    clearPrelimBoss,
    savePlayerHp,
    saveByteCharge,
    saveCharacter,
    saveReveals,
    markByteIntroduced,
    isByteIntroduced,
    markTutorialCompleted,
    isTutorialCompleted,
    markBytesTutorialCompleted,
    isBytesTutorialCompleted,
    applyToGameState,
  };

})();
