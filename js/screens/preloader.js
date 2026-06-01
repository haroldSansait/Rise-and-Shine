// ============================================================
//  Preloader Screen & Central Asset Preloader
// ============================================================

window.PreloaderScreen = (() => {

  const imagesToLoad = [
    // Core Scenes
    'scenes/RnS_Academy.png',
    'scenes/PrelimMap/Prelim_map.png',
    'scenes/PrelimMap/CorruptedClassroom_Prelim.png',
    'scenes/Loading_Screen.png',
    'scenes/Hallway.png',
    'scenes/LUMEN.png',
    'scenes/classroom.png',
    'scenes/fields.png',
    'scenes/roomHallway.png',
    'scenes/glitchbell_incident/classGlitch_1.png',
    'scenes/PrelimMap/comlab.png',
    'scenes/glitchbell_incident/rooftopGlitch_3.png',
    
    // UI Graphic elements
    'scenes/Extra/RnS Logo [F9C159D].png',

    // Playable Character Portraits
    'playableCharacters/MJ/MJ_default.png',
    'playableCharacters/Harold/Harold_default.png',
    'playableCharacters/Bai/Bai_default.png',
    'playableCharacters/Dale/Dale_default.png',
    'playableCharacters/Paps/Paps_default.png',
    'playableCharacters/Bebz/Bebz_default.png',
    'playableCharacters/Matt/Matt_default.png',
    'playableCharacters/JB/JB_default.png',

    // Companion Byte Profile Icons
    'bytes/Pinglet/Pinglet_profile.png',
    'bytes/Bitbug/Bitbug_profile.png',
    'bytes/Poturtle/Porturtle_profile.png',
    'bytes/RAMHorn/RAMhorn_profile.png',
    'bytes/Firewisp/Firewisp_profile.png',
    'bytes/Lagoon/Lagoon_profile.png',

    // Boss Profile and Sprite Sheets
    'stageBosses/PrelimBoss/Ms.K_profile.png',
    'stageBosses/PrelimBoss/idle_sprites/Ms.K_idle.png',
    'stageBosses/PrelimBoss/attack_sprites/Ms.K_attack.png',

    // Player Sprite Sheets (idle & battle)
    'playableCharacters/MJ/idle_sprites/Mj_idle.png',
    'playableCharacters/MJ/battle_sprites/MJ_battle.png',
    'playableCharacters/Harold/idle_sprites/Harold_idle.png',
    'playableCharacters/Harold/battle_sprites/Harold_battle.png',
    'playableCharacters/Bai/idle_sprites/Bai_idle.png',
    'playableCharacters/Bai/battle_sprites/Bai_battle.png',
    'playableCharacters/Dale/idle_sprites/Dale_idle.png',
    'playableCharacters/Dale/battle_sprites/Dale_battle.png',
    'playableCharacters/Paps/idle_sprites/Paps_idle.png',
    'playableCharacters/Paps/battle_sprites/Paps_battle.png',
    'playableCharacters/Bebz/idle_sprites/Bebz_idle.png',
    'playableCharacters/Bebz/battle_sprites/Bebz_battle.png',
    'playableCharacters/Matt/idle_sprites/Matt_idle.png',
    'playableCharacters/Matt/battle_sprites/Matt_battle.png',
    'playableCharacters/JB/idle_sprites/JB_idle.png',
    'playableCharacters/JB/battle_sprites/JB_battle.png',

    // Byte Sprite Sheets (idle & attack)
    'bytes/Pinglet/Pinglet_idle.png',
    'bytes/Pinglet/Pinglet_attack.png',
    'bytes/Bitbug/Bitbug_idle.png',
    'bytes/Bitbug/Bitbug_attack.png',
    'bytes/Poturtle/Poturtle_idle.png',
    'bytes/Poturtle/Poturtle_attack.png',
    'bytes/RAMHorn/RAMHorn_idle.png',
    'bytes/RAMHorn/RAMHorn_attack.png',
    'bytes/Firewisp/Firewisp_idle.png',
    'bytes/Firewisp/Firewisp_attack.png',
    'bytes/Lagoon/Lagoon_idle.png',
    'bytes/Lagoon/Lagoon_attack.png',

    // Enemy Glitchborn Byte Sprite Sheets (idle & attack)
    'glitchbornBytes/Bitmite/bitmite_idle.png',
    'glitchbornBytes/Bitmite/Bitmite_attack.png',
    'glitchbornBytes/CacheSlime/CacheSlime_idle.png',
    'glitchbornBytes/CacheSlime/CacheSlime_Attack.png',
    'glitchbornBytes/SyntaxSprout/syntaxsprout_idle.png',
    'glitchbornBytes/SyntaxSprout/SyntaxSprout_attack.png',
    'glitchbornBytes/FilePhantom/FilePhantom_Idle.png',
    'glitchbornBytes/FilePhantom/FilePhantom_Attack.png',
  ];

  const audioTracks = [
    'menu',
    'prelimMap',
    'prelimBattle',
    'prelimBoss',
    'prelimStage',
  ];

  let totalAssets = 0;
  let loadedAssets = 0;

  function init() {
    // Nothing static needed
  }

  function start(onComplete) {
    totalAssets = imagesToLoad.length + audioTracks.length + 1; // +1 for the intro video buffering check
    loadedAssets = 0;

    const progressPercent = document.getElementById('loader-progress-percent');
    const progressBarFill = document.getElementById('loader-progress-bar-fill');
    const statusText      = document.getElementById('loader-status-text');

    function updateProgress(assetName) {
      loadedAssets++;
      const percent = Math.min(100, Math.floor((loadedAssets / totalAssets) * 100));

      if (progressPercent) progressPercent.textContent = `${percent}%`;
      if (progressBarFill) {
        gsap.to(progressBarFill, { width: `${percent}%`, duration: 0.15, ease: 'power1.out' });
      }
      if (statusText) {
        statusText.textContent = `LOADING COMPONENT: ${assetName.toUpperCase()}...`;
      }

      if (loadedAssets >= totalAssets) {
        setTimeout(() => {
          if (statusText) statusText.textContent = 'COMPILING CORE CODES...';
          setTimeout(() => {
            if (statusText) statusText.textContent = 'INITIALIZING SYSTEM...';
            setTimeout(() => {
              completePreload(onComplete);
            }, 400);
          }, 450);
        }, 300);
      }
    }

    // 1. Asynchronous Image loading via Image object declarations
    imagesToLoad.forEach(path => {
      const img = new Image();
      img.onload = () => updateProgress(path.split('/').pop());
      img.onerror = () => {
        console.warn(`[Preloader] Graphic failed to load: ${path}`);
        updateProgress(path.split('/').pop()); // prevent block
      };
      img.src = path;
    });

    // 2. Audio preloading with native Howler.js completion
    audioTracks.forEach(trackId => {
      AudioManager.preloadBGM(
        trackId,
        () => updateProgress(`soundtrack_${trackId}`),
        () => updateProgress(`soundtrack_${trackId}`)
      );
    });

    // 3. Lightweight video buffer check (intro video)
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = 'scenes/Extra/RiseandShine_Intro.mp4';
    
    let videoChecked = false;
    let videoTimeout = null;

    const onVideoReady = () => {
      if (videoChecked) return;
      videoChecked = true;
      if (videoTimeout) clearTimeout(videoTimeout);
      video.removeEventListener('loadedmetadata', onVideoReady);
      video.removeEventListener('canplay', onVideoReady);
      updateProgress('intro_cinematic_buffer');
    };
    
    videoTimeout = setTimeout(() => {
      console.warn('[Preloader] Intro video metadata check timed out');
      onVideoReady();
    }, 2500);
    
    video.addEventListener('loadedmetadata', onVideoReady);
    video.addEventListener('canplay', onVideoReady);
    video.addEventListener('error', () => {
      console.warn('[Preloader] Intro video metadata check failed');
      onVideoReady();
    });
  }


  function completePreload(onComplete) {
    const loaderScreen = document.getElementById('screen-preloader');
    
    // Cinematic dark fade out using GSAP
    gsap.to(loaderScreen, {
      opacity: 0,
      duration: 1.0,
      ease: 'power3.inOut',
      onComplete: () => {
        loaderScreen.classList.add('hidden');
        if (typeof onComplete === 'function') {
          onComplete();
        }
      }
    });
  }

  return { init, start };

})();
