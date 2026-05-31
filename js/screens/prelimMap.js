// ============================================================
//  Prelim Map Screen
// ============================================================

window.PrelimMapScreen = (() => {

  const levels = window.GAME_DATA.prelimLevels;
  let sidebarOpen = false;
  let currentLevel = null;

  // ── Build map nodes ───────────────────────────────────────
  function buildNodes() {
    const container = document.getElementById('map-nodes-container');
    container.innerHTML = '';

    levels.forEach(level => {
      const node = document.createElement('div');
      node.id = `map-node-${level.id}`;
      node.className = `map-node ${level.locked ? 'map-node-locked' : 'map-node-active'} ${level.isBoss ? 'map-node-boss' : ''}`;
      node.style.left = level.position.left;
      node.style.top  = level.position.top;

      const inner = `
        <div class="map-node-body">
          <div class="map-node-ring"></div>
          ${level.locked
            ? `<span class="map-node-lock">🔒</span>`
            : `<span class="map-node-num">${level.id}</span>`
          }
        </div>
        <div class="map-node-label">
          <div class="map-node-label-sub">${level.subtitle}</div>
          <div class="map-node-label-name">${level.name}</div>
        </div>
      `;
      node.innerHTML = inner;

      if (!level.locked) {
        node.addEventListener('click', () => openSidebar(level));
        node.style.cursor = 'pointer';
      }

      container.appendChild(node);
    });

    // Draw path lines between nodes using SVG
    drawPath();
  }

  // ── Draw connector path ───────────────────────────────────
  function drawPath() {
    const existing = document.getElementById('map-path-svg');
    if (existing) existing.remove();

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'map-path-svg';
    svg.setAttribute('class', 'absolute inset-0 w-full h-full pointer-events-none z-0');
    svg.style.overflow = 'visible';

    const container = document.getElementById('map-nodes-container');

    // Build path between node centers
    const nodePositions = levels.map(l => {
      const pct_x = parseFloat(l.position.left) / 100;
      const pct_y = parseFloat(l.position.top)  / 100;
      return { x: pct_x, y: pct_y };
    });

    // Dashed dotted path line
    for (let i = 0; i < nodePositions.length - 1; i++) {
      const a = nodePositions[i];
      const b = nodePositions[i + 1];
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', `${a.x * 100}%`);
      line.setAttribute('y1', `${a.y * 100}%`);
      line.setAttribute('x2', `${b.x * 100}%`);
      line.setAttribute('y2', `${b.y * 100}%`);
      line.setAttribute('stroke', levels[i].locked ? '#ffffff20' : '#F9C15960');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-dasharray', '8 6');
      svg.appendChild(line);
    }

    container.insertBefore(svg, container.firstChild);
  }

  // ── Open sidebar ──────────────────────────────────────────
  function openSidebar(level) {
    if (sidebarOpen && currentLevel?.id === level.id) {
      closeSidebar();
      return;
    }

    AudioManager.playNodeSelectSFX();
    currentLevel = level;
    sidebarOpen  = true;

    // Populate sidebar content
    const content = document.getElementById('sidebar-content');
    content.innerHTML = buildSidebarHTML(level);

    // Bind ENTER button
    const enterBtn = document.getElementById('btn-sidebar-enter');
    if (enterBtn) {
      enterBtn.addEventListener('click', () => {
        AudioManager.playConfirmSFX();
        launchLevel(level);
      });
    }

    // Animate in
    gsap.to('#map-sidebar', {
      x: 0,
      duration: 0.4,
      ease: 'power3.out',
    });

    // Shift map slightly
    gsap.to('#map-nodes-container', {
      x: -40,
      duration: 0.4,
      ease: 'power3.out',
    });
  }

  function closeSidebar() {
    sidebarOpen  = false;
    currentLevel = null;

    gsap.to('#map-sidebar', {
      x: '100%',
      duration: 0.35,
      ease: 'power3.in',
    });

    gsap.to('#map-nodes-container', {
      x: 0,
      duration: 0.35,
      ease: 'power3.in',
    });
  }

  function buildSidebarHTML(level) {
    const isBoss = level.isBoss;
    const challengeItems = (level.challenges ?? []).map(c =>
      `<li class="sidebar-challenge-item">
        <span class="text-gold mr-2">▸</span>${c}
      </li>`
    ).join('');

    const rewardItems = (level.rewards ?? []).map(r =>
      `<li class="sidebar-reward-item">
        <span class="text-green-400 mr-2">✦</span>${r}
      </li>`
    ).join('');

    return `
      <!-- Zone header -->
      <div class="mb-5">
        <div class="sidebar-level-badge ${isBoss ? 'sidebar-level-badge-boss' : ''}">
          ${isBoss ? '⚠ BOSS LEVEL' : level.subtitle}
        </div>
        <h2 class="font-pixel text-gold text-base mt-2 leading-relaxed">${level.name}</h2>
      </div>

      <!-- Zone image -->
      <div class="sidebar-zone-img-wrap mb-5">
        <img
          src="${level.mapImage}"
          alt="${level.name}"
          class="w-full h-36 object-cover rounded-lg border border-white/10"
          onerror="this.style.display='none'"
        >
      </div>

      <!-- Enemy info -->
      <div class="glass-panel-sm mb-4 p-4">
        <div class="flex items-start justify-between mb-2">
          <div>
            <div class="font-pixel text-xs text-red-400 mb-1">${isBoss ? '☠ STAGE BOSS' : '👾 ENEMY'}</div>
            <div class="font-ui font-bold text-white text-base">${level.enemy}</div>
          </div>
          <div class="text-right">
            <div class="stat-chip stat-chip-hp">❤ ${level.enemyHp} HP</div>
            <div class="stat-chip stat-chip-dmg mt-1">⚔ ${level.enemyDmg} DMG</div>
          </div>
        </div>
        <p class="font-ui text-white/60 text-sm leading-relaxed">${level.enemyDesc}</p>
      </div>

      ${challengeItems ? `
      <!-- Challenges -->
      <div class="mb-4">
        <div class="font-pixel text-xs text-yellow-400 mb-2">⚡ CHALLENGES</div>
        <ul class="space-y-2 font-ui text-white/80 text-sm">
          ${challengeItems}
        </ul>
      </div>
      ` : ''}

      ${rewardItems ? `
      <!-- Rewards -->
      <div class="mb-6">
        <div class="font-pixel text-xs text-green-400 mb-2">★ CLEARANCE REWARDS</div>
        <ul class="space-y-2 font-ui text-white/80 text-sm">
          ${rewardItems}
        </ul>
      </div>
      ` : ''}

      <!-- Action -->
      <button id="btn-sidebar-enter" class="pixel-btn w-full py-4 font-pixel text-gold text-xs tracking-widest">
        ${isBoss ? '⚠ CHALLENGE BOSS' : '▶ ENTER ZONE'}
      </button>
    `;
  }

  // ── Generic Level Launch (cutscene → VS → battle) ─────────
  function launchLevel(level) {
    // Persist the level data so battle.js and post-battle flows can access it
    window.GameState.currentLevel = level;

    // Build intro cutscene lines
    let cutsceneLines;

    if (level.id === 1) {
      // Level 1: Full Prelim Opening + L1 intro (hardcoded narrative)
      cutsceneLines = [
        { speaker: 'player', text: 'This was our classroom… but now it looks like a game level.' },
        { speaker: 'byte',   text: 'Byte! Byte!' },
        { speaker: 'player', text: "You're saying we need to answer questions to fight?" },
        { speaker: 'system', text: 'Battle rule initialized. Correct answer: Byte attack enabled. Wrong answer: enemy counterattack enabled.' },
        { speaker: 'player', text: "So that's how this works." },
        { speaker: 'system', text: 'Glitchborn Byte detected: Bit Mite.' },
        { speaker: 'player', text: "A tiny enemy made of broken binary? Alright. First lesson: don't panic." },
        { speaker: 'byte',   text: 'Flux Core Bii!' },
      ];
    } else {
      // Levels 2-5: use per-level intro lines from data.js
      cutsceneLines = level.introCutsceneLines ?? [
        { speaker: 'system', text: `Glitchborn Byte detected: ${level.enemy}.` },
        { speaker: 'player', text: 'Stay sharp.' },
      ];
    }

    // Transition: cutscene → VS banner → battle
    window.ScreenManager.goTo('cutscene', {
      onEnter: () => {
        CutsceneScreen.playScene(cutsceneLines, () => {
          window.ScreenManager.goTo('vs-banner', {
            onEnter: () => {
              VSBannerScreen.enter(() => {
                // Seamless split-reveal transition has completed
              });
            }
          });
        });
      }
    });
  }

  // ── Bytes Panel ───────────────────────────────────────────
  function openBytesPanel() {
    const panel = document.getElementById('bytes-panel');
    const grid  = document.getElementById('bytes-panel-grid');
    if (!panel || !grid) return;

    const saveData      = SaveSystem.load();
    const unlockedIds   = saveData.unlockedBytes ?? ['poturtle', 'firewisp', 'lagoon'];
    const savedActiveId = (window.GameState.byte?.id) ?? saveData.byteId ?? 'poturtle';
    const activeByteId  = unlockedIds.includes(savedActiveId) ? savedActiveId : unlockedIds[0];
    const allBytes      = window.GAME_DATA.allBytes ?? [];

    grid.innerHTML = '';

    allBytes.forEach(byte => {
      const isUnlocked = unlockedIds.includes(byte.id);
      const isActive   = isUnlocked && byte.id === activeByteId;

      const card = document.createElement('div');
      card.className = `byte-card ${isUnlocked ? 'byte-card-unlocked' : 'byte-card-locked'} ${isActive ? 'byte-card-active' : ''}`;
      card.setAttribute('aria-label', isUnlocked ? byte.name : 'Locked Byte');

      if (isUnlocked) {
        card.innerHTML = `
          <div class="byte-card-icon" style="color:${byte.color};">${byte.icon}</div>
          <div class="byte-card-img-wrap">
            <img src="${byte.image}" alt="${byte.name}" class="byte-card-img" onerror="this.style.opacity=0.3">
          </div>
          <div class="font-pixel text-[8px] tracking-widest" style="color:${byte.color};">${byte.name}</div>
          <div class="font-ui text-white/50 text-xs mt-0.5">${byte.role}</div>
          <div class="byte-card-stats">
            <span>❤ ${byte.hp}</span>
            <span>⚔ ${byte.dmg}</span>
          </div>
          <div class="byte-card-skill font-pixel text-[7px] text-cyan-400 mt-2 truncate" title="${byte.skill}">
            ✦ ${byte.skill}
          </div>
          ${isActive
            ? `<div class="byte-card-active-badge">ACTIVE</div>`
            : `<button class="byte-card-switch-btn pixel-btn font-pixel text-[7px] mt-3 w-full py-1"
                       data-byte-id="${byte.id}" aria-label="Switch to ${byte.name}">
                 SWITCH
               </button>`
          }
        `;
      } else {
        card.innerHTML = `
          <div class="byte-card-locked-icon">🔒</div>
          <div class="byte-card-locked-name font-pixel text-[8px] text-white/25 tracking-widest">??? BYTE</div>
          <div class="font-ui text-white/25 text-xs mt-1">${byte.unlockHint}</div>
        `;
      }

      // Open detailed backstory/ability modal when clicking the panel (except switch button)
      card.addEventListener('click', (e) => {
        if (e.target.closest('.byte-card-switch-btn')) return;
        openByteDetailsModal(byte, isUnlocked, isActive);
      });

      grid.appendChild(card);
    });

    // Bind switch buttons
    grid.querySelectorAll('.byte-card-switch-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent modal opening
        const byteId = btn.dataset.byteId;
        const byteData = window.GAME_DATA.allBytes.find(b => b.id === byteId);
        if (!byteData || !unlockedIds.includes(byteId)) return;

        // Apply switch
        window.GameState.byte = byteData;
        SaveSystem.equipByte(byteId);
        AudioManager.playConfirmSFX();

        // Refresh panel and map HUD
        openBytesPanel();
        updateHUD();
      });
    });

    // Show panel if not already shown to prevent flashing/fade-in on content refresh
    if (panel.classList.contains('hidden')) {
      panel.classList.remove('hidden');
      gsap.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    }
  }

  function closeBytesPanel() {
    const panel = document.getElementById('bytes-panel');
    if (!panel) return;
    gsap.to(panel, { opacity: 0, duration: 0.2, onComplete: () => panel.classList.add('hidden') });
  }

  // ── Main Menu Confirm Dialog ──────────────────────────────
  function showMainMenuConfirm() {
    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:60;background:rgba(0,0,0,0.75);' +
      'display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
      <div class="glass-panel px-10 py-8 text-center max-w-sm mx-4">
        <div class="font-pixel text-gold text-sm mb-3">RETURN TO MENU?</div>
        <div class="font-ui text-white/60 text-sm mb-6">Your progress is automatically saved.</div>
        <div class="flex gap-4 justify-center">
          <button id="btn-confirm-menu" class="pixel-btn px-8 py-3 font-pixel text-gold text-[8px] tracking-widest">
            ✓ YES
          </button>
          <button id="btn-cancel-menu" class="pixel-btn px-8 py-3 font-pixel text-white/50 text-[8px] tracking-widest"
                  style="border-color:rgba(255,255,255,0.2);">
            ✕ NO
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.25 });

    document.getElementById('btn-confirm-menu').addEventListener('click', () => {
      overlay.remove();
      window.ScreenManager.goTo('main-menu', {
        onEnter: () => {
          if (typeof MainMenuScreen !== 'undefined') MainMenuScreen.enter?.();
        }
      });
    });
    document.getElementById('btn-cancel-menu').addEventListener('click', () => {
      gsap.to(overlay, { opacity: 0, duration: 0.2, onComplete: () => overlay.remove() });
    });
  }

  // ── Enter animation ───────────────────────────────────────
  function enter() {
    sidebarOpen  = false;
    currentLevel = null;

    // Apply save data (level locks, byte from save)
    SaveSystem.applyToGameState();

    // Reset sidebar position
    gsap.set('#map-sidebar', { x: '100%' });
    gsap.set('#map-nodes-container', { x: 0 });

    buildNodes();

    // Intercept to display the spectacular "Unlocked Byte Modal" if a byte was just unlocked in battle
    if (window.GameState.justUnlockedByte) {
      const byteId = window.GameState.justUnlockedByte;
      window.GameState.justUnlockedByte = null; // Reset session variable
      setTimeout(() => {
        showUnlockedByteModal(byteId);
      }, 750);
    }

    // Animate map in
    const tl = gsap.timeline();
    tl.fromTo('#screen-prelim-map .absolute.bg-cover',
      { scale: 1.05, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' }
    )
    .fromTo('#map-header-panel',
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
      '-=0.5'
    )
    .fromTo('.map-node',
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, stagger: 0.12, ease: 'back.out(1.6)' },
      '-=0.3'
    );

    // Start prelim map BGM
    AudioManager.playBGM('prelimMap', { volume: 0.5 });

    // Sidebar close button
    const closeBtn = document.getElementById('btn-close-sidebar');
    if (closeBtn) {
      closeBtn.onclick = closeSidebar;
    }

    // Bytes panel buttons
    const bytesBtn = document.getElementById('btn-map-bytes');
    if (bytesBtn) {
      bytesBtn.onclick = () => {
        AudioManager.playConfirmSFX();
        openBytesPanel();
      };
    }
    const bytesClose = document.getElementById('btn-bytes-close');
    if (bytesClose) {
      bytesClose.onclick = closeBytesPanel;
    }

    // Main Menu button
    const menuBtn = document.getElementById('btn-map-main-menu');
    if (menuBtn) {
      menuBtn.onclick = () => {
        AudioManager.playClickSFX();
        showMainMenuConfirm();
      };
    }

    // Show HUD
    updateHUD();
  }

  function updateHUD() {
    const char = window.GameState.character;
    const byte = window.GameState.byte;
    if (!char || !byte) return;

    const hud = document.getElementById('map-hud');
    if (!hud) return;

    // HP display: use carry-over if available
    const saveData   = SaveSystem.load();
    const currentHp  = window.GameState.playerHp ?? char.hp;
    const maxHp      = window.GameState.playerMaxHp ?? saveData.playerMaxHp ?? char.hp;

    hud.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="${char.image}" class="w-10 h-10 object-contain rounded border border-gold/30" alt="${char.name}">
        <div>
          <div class="font-pixel text-gold text-xs">${char.name}</div>
          <div class="font-ui text-white/60 text-xs">❤ ${currentHp}/${maxHp} &nbsp; ⚔ ${char.dmg}</div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <img src="${byte.image}" class="w-10 h-10 object-contain rounded border border-white/20" alt="${byte.name}">
        <div>
          <div class="font-pixel text-xs" style="color:${byte.color}">${byte.name}</div>
          <div class="font-ui text-white/60 text-xs">✦ ${byte.skill}</div>
        </div>
      </div>
    `;
  }

  // Helper function to convert Hex to RGB for glow effect styling
  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }

  // ── Unlocked Byte Modal Popup ──────────────────────────────
  function showUnlockedByteModal(byteId) {
    const byte = window.GAME_DATA.allBytes.find(b => b.id === byteId);
    if (!byte) return;

    // Play procedural sounds
    AudioManager.playConfirmSFX();
    setTimeout(() => {
      AudioManager.playByteCry(byteId);
    }, 280);

    const modal = document.createElement('div');
    modal.id = 'unlocked-byte-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center';
    modal.style.background = 'rgba(4, 6, 18, 0.9)';
    modal.style.backdropFilter = 'blur(12px)';

    const rgbColor = hexToRgb(byte.color);

    modal.innerHTML = `
      <div class="glass-panel max-w-md w-full mx-4 p-8 relative flex flex-col items-center text-center border-2 transition-all duration-300" 
           style="border-color: ${byte.color}; box-shadow: 0 0 45px rgba(${rgbColor}, 0.25), 0 16px 48px rgba(0,0,0,0.85);">
        
        <!-- Glowing aura behind icon -->
        <div class="absolute -z-10 w-48 h-48 rounded-full blur-3xl opacity-35" 
             style="background: ${byte.color}; top: 15%;"></div>

        <!-- Heading -->
        <div class="font-pixel text-[8px] text-emerald-400 mb-2 tracking-widest animate-bounce">
          ★ NEW BYTE COMPANION UNLOCKED ★
        </div>
        
        <h2 class="font-pixel text-lg mb-4 tracking-wide" style="color: ${byte.color}">
          ${byte.name.toUpperCase()}
        </h2>

        <!-- Byte large graphic or icon -->
        <div class="w-28 h-28 flex items-center justify-center mb-5 rounded-full border border-white/10 relative bg-black/40">
          <div class="absolute inset-0 flex items-center justify-center text-4xl select-none" style="filter: drop-shadow(0 0 10px ${byte.color});">
            ${byte.icon}
          </div>
          <img src="${byte.image}" alt="${byte.name}" class="w-20 h-20 object-contain z-10" onerror="this.style.opacity=0">
        </div>

        <!-- Role -->
        <div class="font-ui font-semibold text-white text-base tracking-wide mb-1">
          ${byte.role}
        </div>
        <p class="font-ui text-white/55 text-xs mb-5 leading-relaxed max-w-xs">
          ${byte.roleDesc}
        </p>

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-4 w-full mb-5 py-3 border-y border-white/5">
          <div class="stat-block text-left">
            <div class="stat-label text-green-400">❤ HEALTH</div>
            <div class="stat-value text-green-400 text-lg mt-1">${byte.hp}</div>
          </div>
          <div class="stat-block text-left">
            <div class="stat-label text-red-400">⚔ DAMAGE</div>
            <div class="stat-value text-red-400 text-lg mt-1">${byte.dmg}</div>
          </div>
        </div>

        <!-- Special Ability -->
        <div class="w-full text-left bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
          <div class="font-pixel text-[7px] text-cyan-400 mb-2 tracking-wide animate-pulse">
            ✦ SPECIAL ABILITY: ${byte.skill.toUpperCase()}
          </div>
          <p class="font-ui text-white/80 text-sm leading-relaxed">
            ${byte.skillEffect}
          </p>
        </div>

        <!-- Claim Button -->
        <button id="btn-claim-byte" class="pixel-btn px-10 py-3.5 font-pixel text-gold text-[9px] tracking-widest w-full">
          CLAIM COMPANION
        </button>

      </div>
    `;

    document.body.appendChild(modal);

    // GSAP Entrance
    gsap.fromTo(modal.querySelector('.glass-panel'), 
      { scale: 0.8, opacity: 0 }, 
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }
    );
    gsap.fromTo(modal, 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.3 }
    );

    document.getElementById('btn-claim-byte').addEventListener('click', () => {
      AudioManager.playConfirmSFX();
      gsap.to(modal, {
        opacity: 0, 
        duration: 0.25, 
        onComplete: () => {
          modal.remove();
          // Open the bytes selection panel so the user can easily see their new byte and choose to switch!
          openBytesPanel();
        }
      });
    });
  }

  // ── Byte Details Modal Popup ──────────────────────────────
  function openByteDetailsModal(byte, isUnlocked, isActive) {
    AudioManager.playSelectSFX();

    const modal = document.createElement('div');
    modal.id = 'byte-details-modal';
    modal.className = 'fixed inset-0 z-[60] flex items-center justify-center';
    modal.style.background = 'rgba(3, 5, 15, 0.95)';
    modal.style.backdropFilter = 'blur(16px)';

    const rgbColor = hexToRgb(byte.color);

    modal.innerHTML = `
      <div class="glass-panel max-w-md w-full mx-4 p-8 relative flex flex-col items-center text-center border-2 transition-all duration-300"
           style="border-color: ${isUnlocked ? byte.color : 'rgba(255,255,255,0.15)'}; 
                  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8), 0 0 40px ${isUnlocked ? 'rgba(' + rgbColor + ', 0.2)' : 'rgba(0,0,0,0)'};">
        
        <!-- Glowing background aura (only if unlocked) -->
        ${isUnlocked ? `<div class="absolute -z-10 w-64 h-64 rounded-full blur-[80px] opacity-20" style="background: ${byte.color}; top: 10%;"></div>` : ''}

        <!-- Close button (top right) -->
        <button id="btn-details-close-x"
                class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                       font-pixel text-white/40 text-xs border border-white/10 rounded
                       hover:text-white hover:border-white/40 transition-all"
                aria-label="Close details">
          ✕
        </button>

        <!-- Byte Header -->
        <div class="flex flex-col items-center text-center mb-6">
          <div class="text-3xl mb-2" style="filter: drop-shadow(0 0 8px ${isUnlocked ? byte.color : 'transparent'});">
            ${isUnlocked ? byte.icon : '🔒'}
          </div>
          <h2 class="font-pixel text-lg mb-1 tracking-wide" style="color: ${isUnlocked ? byte.color : '#94a3b8'}">
            ${isUnlocked ? byte.name.toUpperCase() : '??? BYTE'}
          </h2>
          <div class="font-ui text-white/50 text-xs font-semibold tracking-wide">
            ${isUnlocked ? byte.role : 'Locked Companion'}
          </div>
        </div>

        <!-- Byte Profile Image -->
        <div class="w-24 h-24 flex items-center justify-center mb-6 rounded-lg border border-white/5 relative bg-black/40">
          <img src="${byte.image}" alt="${byte.name}" class="w-16 h-16 object-contain z-10 ${isUnlocked ? '' : 'brightness-0 opacity-20'}" onerror="this.style.opacity=0">
        </div>

        <!-- Stats (only if unlocked) -->
        ${isUnlocked ? `
        <div class="grid grid-cols-2 gap-4 w-full mb-5 py-3 border-y border-white/5">
          <div class="stat-block text-left">
            <div class="stat-label text-green-400">❤ HEALTH</div>
            <div class="stat-value text-green-400 text-base mt-0.5">${byte.hp}</div>
          </div>
          <div class="stat-block text-left">
            <div class="stat-label text-red-400">⚔ DAMAGE</div>
            <div class="stat-value text-red-400 text-base mt-0.5">${byte.dmg}</div>
          </div>
        </div>
        ` : ''}

        <!-- Backstory & Ability Content -->
        <div class="w-full space-y-4 mb-6 overflow-y-auto max-h-48 pr-2 scrollbar-thin">
          
          <!-- Special Ability (if unlocked) -->
          ${isUnlocked ? `
          <div class="bg-white/5 border border-white/10 rounded-lg p-3">
            <div class="font-pixel text-[7px] text-cyan-400 mb-1.5 tracking-wide">✦ SPECIAL ABILITY: ${byte.skill.toUpperCase()}</div>
            <p class="font-ui text-white/80 text-xs leading-relaxed">${byte.skillEffect}</p>
          </div>
          ` : ''}

          <!-- Backstory -->
          <div class="bg-white/5 border border-white/10 rounded-lg p-3">
            <div class="font-pixel text-[7px] text-purple-400 mb-1.5 tracking-wide">📖 NARRATIVE DATABASE</div>
            <p class="font-ui text-white/70 text-xs leading-relaxed italic">
              ${isUnlocked ? byte.backstory : `Encrypted database entry. ${byte.unlockHint}`}
            </p>
          </div>

        </div>

        <!-- Action Button -->
        <div class="w-full flex gap-4">
          <button id="btn-details-close" class="pixel-btn-secondary px-6 py-3 font-pixel text-[8px] tracking-widest flex-1">
            CLOSE
          </button>
          
          ${isUnlocked ? `
            ${isActive ? `
              <button class="pixel-btn px-6 py-3 font-pixel text-emerald-400 text-[8px] tracking-widest flex-1 cursor-default pointer-events-none" style="border-color: #10b981; background: rgba(16, 185, 129, 0.1);">
                ACTIVE
              </button>
            ` : `
              <button id="btn-details-equip" class="pixel-btn px-6 py-3 font-pixel text-gold text-[8px] tracking-widest flex-1">
                EQUIP
              </button>
            `}
          ` : `
            <button class="pixel-btn px-6 py-3 font-pixel text-slate-500 text-[8px] tracking-widest flex-1 opacity-50 cursor-not-allowed" disabled>
              LOCKED
            </button>
          `}
        </div>

      </div>
    `;

    document.body.appendChild(modal);

    // GSAP Entrance
    gsap.fromTo(modal.querySelector('.glass-panel'),
      { scale: 0.85, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.3)' }
    );
    gsap.fromTo(modal,
      { opacity: 0 },
      { opacity: 1, duration: 0.25 }
    );

    // Close function
    const closeModal = () => {
      AudioManager.playBackSFX();
      gsap.to(modal, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => modal.remove()
      });
    };

    document.getElementById('btn-details-close-x').addEventListener('click', closeModal);
    document.getElementById('btn-details-close').addEventListener('click', closeModal);

    // Equip button (if exists)
    const equipBtn = document.getElementById('btn-details-equip');
    if (equipBtn) {
      equipBtn.addEventListener('click', () => {
        // Play confirming sound
        AudioManager.playConfirmSFX();

        // Equipping logic
        window.GameState.byte = byte;
        SaveSystem.equipByte(byte.id);

        // Close modal AND refresh panels behind it
        gsap.to(modal, {
          opacity: 0,
          duration: 0.2,
          onComplete: () => {
            modal.remove();
            openBytesPanel(); // refresh bytes panel list
            updateHUD(); // refresh map HUD
          }
        });
      });
    }
  }

  function init() {
    // Nothing static needed — enter() builds everything
  }

  return { init, enter };
})();
