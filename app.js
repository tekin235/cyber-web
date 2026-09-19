/**
 * EMBERKEEP & PORTAL SANCTUM APPLICATION CONTROLLER
 * Orchestrates sign-in validation, video warp transitions, dungeon interactions, and canvas FX.
 */

// =============================================================================
// 1. STATE & DUNGEON DATA
// =============================================================================
const APP_STATE = {
  currentScreen: 'signin', // 'signin' | 'hero'
  isTransitioning: false,
  soundEnabled: true,
  flagsFound: 0,
  dungeonsCleared: 0,
  activeDungeonId: null,
  solvedDungeons: new Set()
};

const DUNGEONS = {
  1: {
    id: 1,
    badge: 'DUNGEON I',
    name: 'Chamber of Whispering Runes',
    lore: 'Beneath the ancient archway lies the Chamber of Whispering Runes. Ancient symbols pulse with arcane light, holding secrets of the forgotten portal.',
    tag: 'CIPHER / CODE',
    points: '+250 EXP',
    prompt: 'Submit the cipher flag or decipher the runic password to claim the seal.',
    flag: 'EMBER{RUNES_WHISPER_PORTAL}'
  },
  2: {
    id: 2,
    badge: 'DUNGEON II',
    name: 'The Cryptic Vaults',
    lore: 'Reinforced iron gates bar access to the ancient vault. Only those who carry the golden flame may unlock its archives.',
    tag: 'SYSTEMS / KEY',
    points: '+300 EXP',
    prompt: 'Input the master credential flag for the vault doors to swing open.',
    flag: 'EMBER{VAULT_KEY_UNSEALED}'
  },
  3: {
    id: 3,
    badge: 'DUNGEON III',
    name: 'Labyrinth of Glacial Echoes',
    lore: '“The ice remembers each crack.” Cold mist swirls across winding paths where one misstep fractures the frosty floor.',
    tag: 'LOGIC / PATH',
    points: '+400 EXP',
    prompt: 'Tread the correct sequence flag without cracking the mystic ice.',
    flag: 'EMBER{GLACIAL_ICE_CRACKS}'
  },
  4: {
    id: 4,
    badge: 'DUNGEON IV',
    name: 'The Forgotten Hearth',
    lore: 'A long-extinguished bonfire rests at the cave center. Spark the eternal embers to awaken the guardian spirits.',
    tag: 'FIRE / RITUAL',
    points: '+450 EXP',
    prompt: 'Provide the invocation flag to rekindle the Hearth of Prime Flames.',
    flag: 'EMBER{FLAME_BURNS_ETERNAL}'
  },
  5: {
    id: 5,
    badge: 'DUNGEON V',
    name: 'Sanctum of Prime Flames',
    lore: 'The apex sanctuary where the supreme portal energy converges. Master of the five gates shall claim ultimate dominion.',
    tag: 'CHAMPION / CORE',
    points: '+600 EXP',
    prompt: 'Offer the master sovereign flag to clear the final sanctuary.',
    flag: 'EMBER{ARCH_GATE_ASCENDED}'
  }
};

// =============================================================================
// 2. WEB AUDIO SYNTHESIZER (Portal Whooshes, Clicks, Chimes)
// =============================================================================
class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    if (!APP_STATE.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playWarpWhoosh() {
    if (!APP_STATE.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 2.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(150, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3200, this.ctx.currentTime + 2.0);
    filter.Q.setValueAtTime(4, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.4, this.ctx.currentTime + 1.6);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + 2.5);

    // Deep sub bass surge
    const bass = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bass.type = 'triangle';
    bass.frequency.setValueAtTime(60, this.ctx.currentTime);
    bass.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 1.8);
    bassGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.2);

    bass.connect(bassGain);
    bassGain.connect(this.ctx.destination);
    bass.start();
    bass.stop(this.ctx.currentTime + 2.2);
  }

  playVictoryChime() {
    if (!APP_STATE.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  }
}

const sfx = new SoundFX();

// =============================================================================
// 3. CANVAS PARTICLE EFFECTS
// =============================================================================
class ParticleCanvas {
  constructor(canvasId, mode = 'portal') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.mode = mode; // 'portal' or 'cavern'
    this.particles = [];
    this.animationFrame = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initParticles();
    this.loop = this.loop.bind(this);
    this.loop();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initParticles() {
    const count = this.mode === 'portal' ? 65 : 45;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (this.mode === 'portal') {
      const angle = Math.random() * Math.PI * 2;
      const radius = 50 + Math.random() * 220;
      return {
        centerX: w / 2,
        centerY: h * 0.46,
        angle: angle,
        radius: radius,
        speed: 0.008 + Math.random() * 0.015,
        radialSpeed: (Math.random() - 0.5) * 0.4,
        size: 1.2 + Math.random() * 2.5,
        alpha: 0.3 + Math.random() * 0.7,
        hue: 35 + Math.random() * 25 // Golden/orange hues
      };
    } else {
      // Golden embers and warm candle sparks floating upwards
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.35 - Math.random() * 0.65,
        size: 1.2 + Math.random() * 2.4,
        alpha: 0.25 + Math.random() * 0.65,
        hue: 35 + Math.random() * 20,
        flickerSpeed: 0.02 + Math.random() * 0.04
      };
    }
  }

  loop() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.mode === 'portal') {
      this.particles.forEach(p => {
        p.angle += p.speed;
        p.radius += p.radialSpeed;
        if (p.radius < 30 || p.radius > 320) p.radialSpeed *= -1;

        const x = p.centerX + Math.cos(p.angle) * p.radius;
        const y = p.centerY + Math.sin(p.angle) * p.radius * 0.85;

        this.ctx.beginPath();
        this.ctx.arc(x, y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.alpha})`;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = `hsl(${p.hue}, 100%, 55%)`;
        this.ctx.fill();
      });
    } else {
      // Golden cathedral ember simulation
      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += Math.sin(Date.now() * p.flickerSpeed) * 0.02;
        const currentAlpha = Math.max(0.1, Math.min(0.9, p.alpha));

        if (p.y < -10) {
          p.y = this.canvas.height + 10;
          p.x = Math.random() * this.canvas.width;
        }
        if (p.x < 0) p.x = this.canvas.width;
        if (p.x > this.canvas.width) p.x = 0;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${currentAlpha})`;
        this.ctx.shadowBlur = 6;
        this.ctx.shadowColor = `hsla(${p.hue}, 100%, 50%, 0.8)`;
        this.ctx.fill();
      });
    }

    this.animationFrame = requestAnimationFrame(this.loop);
  }
}

// =============================================================================
// 4. PORTAL WARP TRANSITION & DASHBOARD CONTROLLER
// =============================================================================
class PortalApp {
  constructor() {
    this.dom = {
      signinSection: document.getElementById('signinSection'),
      heroSection: document.getElementById('heroDashboardSection'),
      portalVideo: document.getElementById('portalVideo'),
      portalBackdrop: document.getElementById('portalBackdrop'),
      warpFlash: document.getElementById('warpFlash'),
      signinCardContainer: document.getElementById('signinCardContainer'),
      passcodeInput: document.getElementById('passcodeInput'),
      btnNext: document.getElementById('btnNext'),
      btnGoogle: document.getElementById('btnGoogle'),
      statusMessage: document.getElementById('statusMessage'),
      soundToggleBtn: document.getElementById('soundToggleBtn'),
      soundIconOn: document.getElementById('soundIconOn'),
      soundIconOff: document.getElementById('soundIconOff'),
      soundLabel: document.querySelector('.sound-label'),
      btnReturnPortal: document.getElementById('btnReturnPortal'),
      // Nav buttons
      navLogoBtn: document.getElementById('navLogoBtn'),
      btnNavModules: document.getElementById('btnNavModules'),
      btnNavDungeons: document.getElementById('btnNavDungeons'),
      btnNavProgress: document.getElementById('btnNavProgress'),
      navSoundToggleBtn: document.getElementById('navSoundToggleBtn'),
      navSfxOn: document.querySelector('.nav-sfx-btn .sfx-icon-on'),
      navSfxOff: document.querySelector('.nav-sfx-btn .sfx-icon-off'),
      navSfxLabel: document.querySelector('.nav-sfx-label'),
      avatarBtn: document.getElementById('avatarBtn'),
      dungeonMap: document.getElementById('dungeonMap'),
      // Introduction Button & Modal
      btnIntroduction: document.getElementById('btnIntroduction'),
      introModal: document.getElementById('introModal'),
      introModalCloseBtn: document.getElementById('introModalCloseBtn'),
      btnBeginExpedition: document.getElementById('btnBeginExpedition'),
      // Stats
      flagCount: document.getElementById('flagCount'),
      dungeonCount: document.getElementById('dungeonCount'),
      // Modules Modal
      modulesModal: document.getElementById('modulesModal'),
      modulesModalCloseBtn: document.getElementById('modulesModalCloseBtn'),
      modulesCloseBottomBtn: document.getElementById('modulesCloseBottomBtn'),
      // Progress Modal
      progressModal: document.getElementById('progressModal'),
      progressModalCloseBtn: document.getElementById('progressModalCloseBtn'),
      progressCloseBottomBtn: document.getElementById('progressCloseBottomBtn'),
      progDungeonsCleared: document.getElementById('progDungeonsCleared'),
      progFlagsFound: document.getElementById('progFlagsFound'),
      expBarFill: document.getElementById('expBarFill'),
      expValue: document.getElementById('expValue'),
      // Profile Modal
      profileModal: document.getElementById('profileModal'),
      profileModalCloseBtn: document.getElementById('profileModalCloseBtn'),
      profileSaveBtn: document.getElementById('profileSaveBtn'),
      profileSoundToggle: document.getElementById('profileSoundToggle'),
      titleSelect: document.getElementById('titleSelect'),
      // Dungeon Modal
      dungeonModal: document.getElementById('dungeonModal'),
      modalCloseBtn: document.getElementById('modalCloseBtn'),
      modalCloseBottomBtn: document.getElementById('modalCloseBottomBtn'),
      modalBadge: document.getElementById('modalBadge'),
      modalTitle: document.getElementById('modalTitle'),
      modalLore: document.getElementById('modalLore'),
      modalPrompt: document.getElementById('modalPrompt'),
      flagInput: document.getElementById('flagInput'),
      btnSubmitFlag: document.getElementById('btnSubmitFlag'),
      btnQuickSolve: document.getElementById('btnQuickSolve'),
      flagFeedback: document.getElementById('flagFeedback')
    };

    this.init();
  }

  init() {
    // Initialize particle canvases
    this.portalParticles = new ParticleCanvas('portalSparksCanvas', 'portal');
    this.cavernParticles = new ParticleCanvas('cavernParticlesCanvas', 'cavern');

    this.bindEvents();

    // Direct dashboard navigation via hash or query param
    if (window.location.hash.includes('dashboard') || window.location.hash.includes('hero') || window.location.hash.includes('overview') || window.location.search.includes('dashboard')) {
      this.dom.signinSection.classList.remove('active');
      this.dom.heroSection.classList.add('active');
      APP_STATE.currentScreen = 'hero';
    }
    if (window.location.hash.includes('intro')) {
      this.dom.signinSection.classList.remove('active');
      this.dom.heroSection.classList.add('active');
      APP_STATE.currentScreen = 'hero';
      setTimeout(() => this.openIntroModal(), 150);
    }
    if (window.location.hash.includes('modules')) {
      this.dom.signinSection.classList.remove('active');
      this.dom.heroSection.classList.add('active');
      APP_STATE.currentScreen = 'hero';
      setTimeout(() => this.openModulesModal(), 150);
    }
    if (window.location.hash.includes('progress')) {
      this.dom.signinSection.classList.remove('active');
      this.dom.heroSection.classList.add('active');
      APP_STATE.currentScreen = 'hero';
      setTimeout(() => this.openProgressModal(), 150);
    }
    if (window.location.hash.includes('profile')) {
      this.dom.signinSection.classList.remove('active');
      this.dom.heroSection.classList.add('active');
      APP_STATE.currentScreen = 'hero';
      setTimeout(() => this.openProfileModal(), 150);
    }
    if (window.location.hash.includes('dungeon')) {
      this.dom.signinSection.classList.remove('active');
      this.dom.heroSection.classList.add('active');
      APP_STATE.currentScreen = 'hero';
      setTimeout(() => this.openDungeonModal(1), 150);
    }
    if (window.location.hash.includes('test_solve')) {
      this.dom.signinSection.classList.remove('active');
      this.dom.heroSection.classList.add('active');
      APP_STATE.currentScreen = 'hero';
      APP_STATE.activeDungeonId = 1;
      this.dom.flagInput.value = 'EMBER{RUNES_WHISPER_PORTAL}';
      this.submitCurrentFlag();
    }
  }

  bindEvents() {
    // Sound toggle
    this.dom.soundToggleBtn.addEventListener('click', () => this.toggleSound());

    // Next button click
    this.dom.btnNext.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleSignInTrigger();
    });

    // Form submit on Enter key
    this.dom.passcodeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleSignInTrigger();
      }
    });

    // Google Sign-In button click
    this.dom.btnGoogle.addEventListener('click', () => {
      this.dom.passcodeInput.value = 'GOOGLE_AUTH_SESSION';
      this.handleSignInTrigger(true);
    });

    // Video transition events
    if (this.dom.portalVideo) {
      this.dom.portalVideo.addEventListener('ended', () => {
        this.completeWarpToHero();
      });

      // Time update fallback if video ends or reaches peak
      this.dom.portalVideo.addEventListener('timeupdate', () => {
        const remaining = this.dom.portalVideo.duration - this.dom.portalVideo.currentTime;
        if (remaining <= 0.4 && APP_STATE.isTransitioning) {
          this.dom.warpFlash.classList.add('flash-active');
        }
      });
    }

    // Return to Portal Chamber
    if (this.dom.btnReturnPortal) {
      this.dom.btnReturnPortal.addEventListener('click', () => {
        this.returnToPortal();
      });
    }

    // Introduction Button and Modal Controls
    if (this.dom.btnIntroduction) {
      this.dom.btnIntroduction.addEventListener('click', (e) => {
        this.createRipple(e, this.dom.btnIntroduction);
        sfx.playClick();
        this.openIntroModal();
      });
    }

    if (this.dom.introModalCloseBtn) {
      this.dom.introModalCloseBtn.addEventListener('click', () => {
        sfx.playClick();
        this.closeIntroModal();
      });
    }

    if (this.dom.btnBeginExpedition) {
      this.dom.btnBeginExpedition.addEventListener('click', () => {
        sfx.playClick();
        this.closeIntroModal();
      });
    }

    if (this.dom.introModal) {
      this.dom.introModal.addEventListener('click', (e) => {
        if (e.target === this.dom.introModal) {
          sfx.playClick();
          this.closeIntroModal();
        }
      });
    }

    // Global keyboard listener (Escape to close any open modal)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.dom.introModal && this.dom.introModal.classList.contains('open')) {
          this.closeIntroModal();
        } else if (this.dom.dungeonModal && this.dom.dungeonModal.classList.contains('open')) {
          this.closeDungeonModal();
        } else if (this.dom.modulesModal && this.dom.modulesModal.classList.contains('open')) {
          this.closeModulesModal();
        } else if (this.dom.progressModal && this.dom.progressModal.classList.contains('open')) {
          this.closeProgressModal();
        } else if (this.dom.profileModal && this.dom.profileModal.classList.contains('open')) {
          this.closeProfileModal();
        }
      }
    });

    // Nav Bar Navigation Tabs
    if (this.dom.btnNavModules) {
      this.dom.btnNavModules.addEventListener('click', () => {
        sfx.playClick();
        this.setActiveNavTab('modules');
        this.openModulesModal();
      });
    }

    if (this.dom.btnNavDungeons) {
      this.dom.btnNavDungeons.addEventListener('click', () => {
        sfx.playClick();
        this.setActiveNavTab('dungeons');
        if (this.dom.dungeonMap) {
          this.dom.dungeonMap.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }

    if (this.dom.btnNavProgress) {
      this.dom.btnNavProgress.addEventListener('click', () => {
        sfx.playClick();
        this.setActiveNavTab('progress');
        this.openProgressModal();
      });
    }

    // Nav SFX Toggle Button
    if (this.dom.navSoundToggleBtn) {
      this.dom.navSoundToggleBtn.addEventListener('click', () => {
        this.toggleSound();
      });
    }

    // Avatar Button -> Open Profile Modal
    if (this.dom.avatarBtn) {
      this.dom.avatarBtn.addEventListener('click', () => {
        sfx.playClick();
        this.openProfileModal();
      });
    }

    // Bottom Quest Summary Card -> Open Progress Modal
    const questCard = document.querySelector('.quest-summary-card');
    if (questCard) {
      questCard.style.cursor = 'pointer';
      questCard.addEventListener('click', () => {
        sfx.playClick();
        this.openProgressModal();
      });
    }

    // Modules Modal Controls
    if (this.dom.modulesModalCloseBtn) {
      this.dom.modulesModalCloseBtn.addEventListener('click', () => this.closeModulesModal());
    }
    if (this.dom.modulesCloseBottomBtn) {
      this.dom.modulesCloseBottomBtn.addEventListener('click', () => this.closeModulesModal());
    }
    if (this.dom.modulesModal) {
      this.dom.modulesModal.addEventListener('click', (e) => {
        if (e.target === this.dom.modulesModal) this.closeModulesModal();
      });
    }

    // Progress Modal Controls
    if (this.dom.progressModalCloseBtn) {
      this.dom.progressModalCloseBtn.addEventListener('click', () => this.closeProgressModal());
    }
    if (this.dom.progressCloseBottomBtn) {
      this.dom.progressCloseBottomBtn.addEventListener('click', () => this.closeProgressModal());
    }
    if (this.dom.progressModal) {
      this.dom.progressModal.addEventListener('click', (e) => {
        if (e.target === this.dom.progressModal) this.closeProgressModal();
      });
    }

    // Profile Modal Controls
    if (this.dom.profileModalCloseBtn) {
      this.dom.profileModalCloseBtn.addEventListener('click', () => this.closeProfileModal());
    }
    if (this.dom.profileSaveBtn) {
      this.dom.profileSaveBtn.addEventListener('click', () => {
        sfx.playClick();
        if (this.dom.titleSelect) {
          const newTitle = this.dom.titleSelect.value;
          const heroRank = document.querySelector('.progress-hero-rank');
          if (heroRank) heroRank.textContent = `${newTitle} • Term IV Cohort`;
        }
        this.closeProfileModal();
      });
    }
    if (this.dom.profileSoundToggle) {
      this.dom.profileSoundToggle.addEventListener('click', () => {
        this.toggleSound();
      });
    }
    if (this.dom.profileModal) {
      this.dom.profileModal.addEventListener('click', (e) => {
        if (e.target === this.dom.profileModal) this.closeProfileModal();
      });
    }

    // Cave / Chamber clicks (both card and button)
    document.querySelectorAll('.cave-node').forEach(node => {
      const dungeonId = parseInt(node.dataset.dungeonId, 10);
      node.addEventListener('click', () => {
        sfx.playClick();
        this.openDungeonModal(dungeonId);
      });
    });

    // Modal controls
    this.dom.modalCloseBtn.addEventListener('click', () => this.closeDungeonModal());
    this.dom.modalCloseBottomBtn.addEventListener('click', () => this.closeDungeonModal());
    this.dom.dungeonModal.addEventListener('click', (e) => {
      if (e.target === this.dom.dungeonModal) this.closeDungeonModal();
    });

    // Submit Flag in Modal
    this.dom.btnSubmitFlag.addEventListener('click', () => this.submitCurrentFlag());
    this.dom.flagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.submitCurrentFlag();
      }
    });

    // Quick Solve / Demo button
    this.dom.btnQuickSolve.addEventListener('click', () => {
      const active = DUNGEONS[APP_STATE.activeDungeonId];
      if (active) {
        this.dom.flagInput.value = active.flag;
        this.submitCurrentFlag();
      }
    });
  }

  setActiveNavTab(tab) {
    document.querySelectorAll('.emberkeep-nav .nav-item').forEach(item => {
      const btn = item.querySelector('.nav-link-btn');
      if (btn && btn.dataset.tab === tab) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  toggleSound() {
    APP_STATE.soundEnabled = !APP_STATE.soundEnabled;
    const isEnabled = APP_STATE.soundEnabled;

    // 1. Signin fixed sound toggle
    if (this.dom.soundIconOn && this.dom.soundIconOff) {
      if (isEnabled) {
        this.dom.soundIconOn.classList.remove('hidden');
        this.dom.soundIconOff.classList.add('hidden');
      } else {
        this.dom.soundIconOn.classList.add('hidden');
        this.dom.soundIconOff.classList.remove('hidden');
      }
    }
    if (this.dom.soundLabel) {
      this.dom.soundLabel.textContent = isEnabled ? 'SFX: ON' : 'SFX: OFF';
    }

    // 2. Navbar sound toggle
    if (this.dom.navSfxOn && this.dom.navSfxOff) {
      if (isEnabled) {
        this.dom.navSfxOn.classList.remove('hidden');
        this.dom.navSfxOff.classList.add('hidden');
      } else {
        this.dom.navSfxOn.classList.add('hidden');
        this.dom.navSfxOff.classList.remove('hidden');
      }
    }
    if (this.dom.navSfxLabel) {
      this.dom.navSfxLabel.textContent = isEnabled ? 'SFX: ON' : 'SFX: OFF';
    }

    // 3. Profile modal audio toggle pill
    if (this.dom.profileSoundToggle) {
      this.dom.profileSoundToggle.textContent = isEnabled ? 'SFX: ON' : 'SFX: OFF';
      if (isEnabled) {
        this.dom.profileSoundToggle.classList.remove('muted');
      } else {
        this.dom.profileSoundToggle.classList.add('muted');
      }
    }

    if (isEnabled) {
      sfx.playClick();
    }
  }

  // Trigger Sign-in and execute Video Warp Transition
  handleSignInTrigger(isGoogle = false) {
    if (APP_STATE.isTransitioning) return;
    APP_STATE.isTransitioning = true;

    sfx.playClick();
    sfx.playWarpWhoosh();

    const code = this.dom.passcodeInput.value.trim();
    this.showStatus(isGoogle ? '✦ Authenticating via Google...' : (code ? `✦ Verifying code "${code}"...` : '✦ Activating Ancient Gate...'), 'success');

    // 1. Dissolve the glassmorphism card
    setTimeout(() => {
      this.dom.signinCardContainer.classList.add('dissolve-out');
      this.dom.signinSection.classList.add('video-playing');

      // 2. Play the portal zoom video
      const video = this.dom.portalVideo;
      if (video) {
        video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('Video autoplay fallback:', err);
            // If autoplay policy blocks or fails, fallback to timed warp
            setTimeout(() => this.completeWarpToHero(), 2800);
          });
        }
      } else {
        setTimeout(() => this.completeWarpToHero(), 2000);
      }
    }, 400);
  }

  // Finish warp sequence and reveal Emberkeep Hero Dashboard
  completeWarpToHero() {
    this.dom.warpFlash.classList.add('flash-active');

    setTimeout(() => {
      // Switch active sections
      this.dom.signinSection.classList.remove('active');
      this.dom.heroSection.classList.add('active');
      APP_STATE.currentScreen = 'hero';
      APP_STATE.isTransitioning = false;

      // Reset sign-in card state for potential return
      this.dom.signinCardContainer.classList.remove('dissolve-out');
      this.dom.signinSection.classList.remove('video-playing');
      this.showStatus('', '');

      // Fade out white/gold warp flash
      setTimeout(() => {
        this.dom.warpFlash.classList.remove('flash-active');
      }, 600);
    }, 450);
  }

  // Return back to Portal Sign-In chamber
  returnToPortal() {
    if (APP_STATE.isTransitioning) return;
    sfx.playClick();
    sfx.playWarpWhoosh();

    this.dom.warpFlash.classList.add('flash-active');

    setTimeout(() => {
      this.dom.heroSection.classList.remove('active');
      this.dom.signinSection.classList.add('active');
      APP_STATE.currentScreen = 'signin';

      const video = this.dom.portalVideo;
      if (video) {
        video.pause();
        video.currentTime = 0;
      }

      setTimeout(() => {
        this.dom.warpFlash.classList.remove('flash-active');
      }, 500);
    }, 400);
  }

  showStatus(msg, type = 'info') {
    this.dom.statusMessage.textContent = msg;
    this.dom.statusMessage.className = `card-status-message ${type}`;
  }

  // ===========================================================================
  // INTRODUCTION MODAL & RIPPLE FX
  // ===========================================================================
  openIntroModal() {
    if (!this.dom.introModal) return;
    this.dom.introModal.classList.add('open');
    this.dom.introModal.setAttribute('aria-hidden', 'false');
  }

  closeIntroModal() {
    if (!this.dom.introModal) return;
    sfx.playClick();
    this.dom.introModal.classList.remove('open');
    this.dom.introModal.setAttribute('aria-hidden', 'true');
  }

  createRipple(e, targetBtn) {
    if (!targetBtn || !e) return;
    const circle = document.createElement('span');
    const diameter = Math.max(targetBtn.clientWidth, targetBtn.clientHeight);
    const radius = diameter / 2;
    const rect = targetBtn.getBoundingClientRect();

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - rect.left - radius}px`;
    circle.style.top = `${e.clientY - rect.top - radius}px`;
    circle.style.position = 'absolute';
    circle.style.borderRadius = '50%';
    circle.style.background = 'radial-gradient(circle, rgba(255, 226, 138, 0.6), transparent 70%)';
    circle.style.transform = 'scale(0)';
    circle.style.animation = 'rippleFx 0.6s ease-out';
    circle.style.pointerEvents = 'none';

    targetBtn.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  }

  // ===========================================================================
  // DUNGEON MODAL & SOLVING
  // ===========================================================================
  openDungeonModal(dungeonId) {
    const dungeon = DUNGEONS[dungeonId];
    if (!dungeon) return;

    APP_STATE.activeDungeonId = dungeonId;
    this.dom.modalBadge.textContent = dungeon.badge;
    this.dom.modalTitle.textContent = dungeon.name;
    this.dom.modalLore.textContent = dungeon.lore;
    this.dom.modalPrompt.textContent = dungeon.prompt;
    this.dom.flagInput.value = '';
    this.dom.flagFeedback.textContent = '';
    this.dom.flagFeedback.className = 'flag-feedback';

    if (APP_STATE.solvedDungeons.has(dungeonId)) {
      this.dom.flagFeedback.textContent = '✓ This dungeon has already been cleared!';
      this.dom.flagFeedback.className = 'flag-feedback success';
    }

    this.dom.dungeonModal.classList.add('open');
    this.dom.dungeonModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => this.dom.flagInput.focus(), 150);
  }

  closeDungeonModal() {
    sfx.playClick();
    this.dom.dungeonModal.classList.remove('open');
    this.dom.dungeonModal.setAttribute('aria-hidden', 'true');
    APP_STATE.activeDungeonId = null;
  }

  // ===========================================================================
  // MODULES, PROGRESS & PROFILE MODALS
  // ===========================================================================
  openModulesModal() {
    if (!this.dom.modulesModal) return;
    this.dom.modulesModal.classList.add('open');
    this.dom.modulesModal.setAttribute('aria-hidden', 'false');
  }

  closeModulesModal() {
    if (!this.dom.modulesModal) return;
    sfx.playClick();
    this.dom.modulesModal.classList.remove('open');
    this.dom.modulesModal.setAttribute('aria-hidden', 'true');
    this.setActiveNavTab('dungeons');
  }

  openProgressModal() {
    if (!this.dom.progressModal) return;
    this.dom.progressModal.classList.add('open');
    this.dom.progressModal.setAttribute('aria-hidden', 'false');
  }

  closeProgressModal() {
    if (!this.dom.progressModal) return;
    sfx.playClick();
    this.dom.progressModal.classList.remove('open');
    this.dom.progressModal.setAttribute('aria-hidden', 'true');
    this.setActiveNavTab('dungeons');
  }

  openProfileModal() {
    if (!this.dom.profileModal) return;
    this.dom.profileModal.classList.add('open');
    this.dom.profileModal.setAttribute('aria-hidden', 'false');
  }

  closeProfileModal() {
    if (!this.dom.profileModal) return;
    sfx.playClick();
    this.dom.profileModal.classList.remove('open');
    this.dom.profileModal.setAttribute('aria-hidden', 'true');
  }

  launchModuleDemo(moduleTitle) {
    sfx.playClick();
    alert(`⚡ Launching ${moduleTitle} interactive simulation sandbox...`);
  }

  submitCurrentFlag() {
    const dungeonId = APP_STATE.activeDungeonId;
    const dungeon = DUNGEONS[dungeonId];
    if (!dungeon) return;

    const inputVal = this.dom.flagInput.value.trim();
    if (!inputVal) {
      this.dom.flagFeedback.textContent = 'Please enter a flag or passkey.';
      this.dom.flagFeedback.className = 'flag-feedback error';
      return;
    }

    if (inputVal === dungeon.flag || inputVal.toLowerCase() === 'solved') {
      sfx.playVictoryChime();
      this.dom.flagFeedback.textContent = '✦ Gate Unlocked! Flag validated successfully.';
      this.dom.flagFeedback.className = 'flag-feedback success';

      if (!APP_STATE.solvedDungeons.has(dungeonId)) {
        APP_STATE.solvedDungeons.add(dungeonId);
        APP_STATE.flagsFound += 1;
        APP_STATE.dungeonsCleared = Math.min(APP_STATE.solvedDungeons.size, 4);

        // Update Dashboard Summary Stats
        if (this.dom.flagCount) this.dom.flagCount.textContent = APP_STATE.flagsFound;
        if (this.dom.dungeonCount) this.dom.dungeonCount.textContent = `${APP_STATE.dungeonsCleared}/4`;

        // Update Progress Modal Live Stats
        if (this.dom.progFlagsFound) this.dom.progFlagsFound.textContent = APP_STATE.flagsFound;
        if (this.dom.progDungeonsCleared) this.dom.progDungeonsCleared.textContent = `${APP_STATE.dungeonsCleared}/4`;

        // EXP progression
        const exp = APP_STATE.flagsFound * 400;
        if (this.dom.expValue) this.dom.expValue.textContent = exp;
        if (this.dom.expBarFill) {
          const pct = Math.min(100, Math.round((exp / 2000) * 100));
          this.dom.expBarFill.style.width = `${pct}%`;
        }

        // Unlock Sigil badge card
        const badgeEl = document.getElementById(`badgeChamber${dungeonId}`);
        if (badgeEl) {
          badgeEl.classList.add('unlocked');
          const stateEl = badgeEl.querySelector('.badge-state');
          if (stateEl) stateEl.textContent = 'Unlocked';
        }

        const caveEl = document.getElementById(`cave${dungeonId}`);
        if (caveEl) caveEl.classList.add('cleared');
      }

      setTimeout(() => this.closeDungeonModal(), 1200);
    } else {
      this.dom.flagFeedback.textContent = '✗ Invalid flag cipher. Check the runes and retry!';
      this.dom.flagFeedback.className = 'flag-feedback error';
    }
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new PortalApp();
});
