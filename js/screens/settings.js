// ============================================================
//  Rise and Shine — Settings Menu Module
//  Central state management, persistent storage, and GSAP modal
// ============================================================

window.SettingsScreen = (() => {
  const SETTINGS_KEY = 'rns_settings_v1';

  // Default Settings
  const defaults = {
    bgmVolume: 0.55,
    sfxVolume: 1.0,
    typewriterSpeed: 28, // ms delay
    screenShake: true,
    retroOverlay: true
  };

  // Live state loaded from localStorage
  window.GameSettings = { ...defaults };

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        Object.assign(window.GameSettings, parsed);
      }
    } catch (e) {
      console.warn('[Settings] Failed to load settings, using defaults:', e);
    }
    applySettingsToDOM();
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(window.GameSettings));
    } catch (e) {
      console.warn('[Settings] Failed to save settings:', e);
    }
  }

  function applySettingsToDOM() {
    // 1. Retro CRT overlay toggle
    const scanlines = document.getElementById('scanlines');
    if (scanlines) {
      if (window.GameSettings.retroOverlay) {
        scanlines.classList.remove('hidden');
      } else {
        scanlines.classList.add('hidden');
      }
    }

    // 2. Audio volumes sync to Howler and sound systems
    if (window.Howler) {
      Howler.volume(window.GameSettings.bgmVolume);
    }
  }

  function init() {
    loadSettings();

    // Bind setting gear buttons dynamically (even if added later)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-open-settings');
      if (btn) {
        e.stopPropagation();
        AudioManager.playClickSFX();
        openModal();
      }
    });

    // Modal Close Button
    const closeBtn = document.getElementById('settings-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        AudioManager.playBackSFX();
        closeModal();
      });
    }

    // Slider inputs & Toggles
    const bgmSlider = document.getElementById('settings-bgm-slider');
    const sfxSlider = document.getElementById('settings-sfx-slider');
    const typewriterSelect = document.getElementById('settings-typewriter-select');
    const shakeCheckbox = document.getElementById('settings-shake-checkbox');
    const overlayCheckbox = document.getElementById('settings-overlay-checkbox');

    // Seed visual inputs with loaded state
    if (bgmSlider) {
      bgmSlider.value = window.GameSettings.bgmVolume;
      bgmSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        window.GameSettings.bgmVolume = val;
        if (window.Howler) Howler.volume(val);
        saveSettings();
      });
    }

    if (sfxSlider) {
      sfxSlider.value = window.GameSettings.sfxVolume;
      sfxSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        window.GameSettings.sfxVolume = val;
        saveSettings();
      });
      // Play a diagnostic SFX tick on slider release so player can hear volume changes
      sfxSlider.addEventListener('change', () => {
        AudioManager.playClickSFX();
      });
    }

    if (typewriterSelect) {
      typewriterSelect.value = window.GameSettings.typewriterSpeed;
      typewriterSelect.addEventListener('change', (e) => {
        window.GameSettings.typewriterSpeed = parseInt(e.target.value, 10);
        saveSettings();
        AudioManager.playClickSFX();
      });
    }

    if (shakeCheckbox) {
      shakeCheckbox.checked = window.GameSettings.screenShake;
      shakeCheckbox.addEventListener('change', (e) => {
        window.GameSettings.screenShake = e.target.checked;
        saveSettings();
        AudioManager.playClickSFX();
      });
    }

    if (overlayCheckbox) {
      overlayCheckbox.checked = window.GameSettings.retroOverlay;
      overlayCheckbox.addEventListener('change', (e) => {
        window.GameSettings.retroOverlay = e.target.checked;
        applySettingsToDOM();
        saveSettings();
        AudioManager.playClickSFX();
      });
    }

    // Reset Data Confirmation dialog
    const resetBtn = document.getElementById('settings-reset-btn');
    const confirmOverlay = document.getElementById('settings-reset-confirm-overlay');
    const confirmYes = document.getElementById('settings-confirm-yes');
    const confirmNo = document.getElementById('settings-confirm-no');

    if (resetBtn && confirmOverlay) {
      resetBtn.addEventListener('click', () => {
        AudioManager.playClickSFX();
        confirmOverlay.classList.remove('hidden');
        gsap.fromTo(confirmOverlay, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' });
      });
    }

    if (confirmNo && confirmOverlay) {
      confirmNo.addEventListener('click', () => {
        AudioManager.playBackSFX();
        gsap.to(confirmOverlay, {
          opacity: 0, scale: 0.9, duration: 0.15, onComplete: () => {
            confirmOverlay.classList.add('hidden');
          }
        });
      });
    }

    if (confirmYes) {
      confirmYes.addEventListener('click', () => {
        AudioManager.playConfirmSFX();
        // Clear progress matrices
        localStorage.clear();
        window.GameState.character = null;
        window.GameState.byte = null;
        window.GameState.playerHp = null;
        window.GameState.playerMaxHp = null;
        window.GameState.byteCharge = 0;
        window.GameState.currentLevel = null;

        // Gracefully reload the application environment to drop player cleanly back
        setTimeout(() => {
          window.location.reload();
        }, 350);
      });
    }

    // Close on overlay backing click
    const modalBg = document.getElementById('screen-settings');
    if (modalBg) {
      modalBg.addEventListener('click', (e) => {
        if (e.target === modalBg) {
          AudioManager.playBackSFX();
          closeModal();
        }
      });
    }
  }

  function openModal() {
    const modal = document.getElementById('screen-settings');
    if (!modal) return;

    modal.classList.remove('hidden');
    // Block gameplay keys/interactions behind it
    modal.style.pointerEvents = 'all';

    // Seed sliders and values to match live state
    const bgmSlider = document.getElementById('settings-bgm-slider');
    const sfxSlider = document.getElementById('settings-sfx-slider');
    const typewriterSelect = document.getElementById('settings-typewriter-select');
    const shakeCheckbox = document.getElementById('settings-shake-checkbox');
    const overlayCheckbox = document.getElementById('settings-overlay-checkbox');

    if (bgmSlider) bgmSlider.value = window.GameSettings.bgmVolume;
    if (sfxSlider) sfxSlider.value = window.GameSettings.sfxVolume;
    if (typewriterSelect) typewriterSelect.value = window.GameSettings.typewriterSpeed;
    if (shakeCheckbox) shakeCheckbox.checked = window.GameSettings.screenShake;
    if (overlayCheckbox) overlayCheckbox.checked = window.GameSettings.retroOverlay;

    // Hide reset confirm overlay in case it was left open
    const confirmOverlay = document.getElementById('settings-reset-confirm-overlay');
    if (confirmOverlay) confirmOverlay.classList.add('hidden');

    gsap.killTweensOf('#settings-modal-card');
    gsap.fromTo('#settings-modal-card',
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.1)' }
    );
  }

  function closeModal() {
    const modal = document.getElementById('screen-settings');
    if (!modal) return;

    gsap.killTweensOf('#settings-modal-card');
    gsap.to('#settings-modal-card', {
      scale: 0,
      opacity: 0,
      duration: 0.35,
      ease: 'back.in(1.1)',
      onComplete: () => {
        modal.classList.add('hidden');
        modal.style.pointerEvents = 'none';
      }
    });
  }

  return { init, openModal, closeModal, applySettingsToDOM };
})();
