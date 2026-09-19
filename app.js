/**
 * CYBER SANCTUM — APPLICATION CONTROLLER
 * Minimalist 3-Page Flow:
 *  1. Google Sign-In Dialogue
 *  2. Sanctum Access Code Dialogue (with Cinematic Portal Warp)
 *  3. Dashboard with Profile (Logout popup), SFX toggle, Introduction button, and Single Dungeon Gate.
 */

// =============================================================================
// 1. APPLICATION STATE
// =============================================================================
const APP_STATE = {
  currentScreen: 'pageLogin', // 'pageLogin' | 'pageAccessCode' | 'portalTransitionSection' | 'pageDashboard'
  soundEnabled: true,
  isGateUnlocked: false,
  isTransitioning: false,
  accessCode: ''
};

// =============================================================================
// 2. WEB AUDIO SYNTHESIZER (Clicks, Warps, Chimes, Rattles)
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

    const bufferSize = this.ctx.sampleRate * 2.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(160, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2800, this.ctx.currentTime + 1.8);
    filter.Q.setValueAtTime(4, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, this.ctx.currentTime + 1.4);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + 2.2);

    // Deep sub-bass swell
    const bass = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bass.type = 'triangle';
    bass.frequency.setValueAtTime(55, this.ctx.currentTime);
    bass.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 1.6);
    bassGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.0);

    bass.connect(bassGain);
    bassGain.connect(this.ctx.destination);
    bass.start();
    bass.stop(this.ctx.currentTime + 2.0);
  }

  playVictoryChime() {
    if (!APP_STATE.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.55);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.55);
    });
  }

  playRattle() {
    if (!APP_STATE.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    // Metallic locked gate clank
    const times = [0, 0.06, 0.13, 0.2];
    times.forEach((t) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(180 + Math.random() * 80, this.ctx.currentTime + t);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + t + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + t);
      osc.stop(this.ctx.currentTime + t + 0.05);
    });
  }

  playGateOpen() {
    if (!APP_STATE.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    // Low stone grinding sound followed by celestial chime
    const stone = this.ctx.createOscillator();
    const stoneGain = this.ctx.createGain();
    stone.type = 'sawtooth';
    stone.frequency.setValueAtTime(80, this.ctx.currentTime);
    stone.frequency.exponentialRampToValueAtTime(130, this.ctx.currentTime + 0.5);

    stoneGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    stoneGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

    stone.connect(stoneGain);
    stoneGain.connect(this.ctx.destination);
    stone.start();
    stone.stop(this.ctx.currentTime + 0.6);

    setTimeout(() => {
      this.playVictoryChime();
    }, 150);
  }

  playDashboardReveal() {
    if (!APP_STATE.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    // Sub resonant boom
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110, this.ctx.currentTime);
    sub.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 1.2);

    subGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.4);

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start();
    sub.stop(this.ctx.currentTime + 1.4);

    // Ethereal chord shimmer: A3 (220), C#4 (277.18), E4 (329.63), A4 (440)
    const chord = [220, 277.18, 329.63, 440];
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = this.ctx.currentTime + 0.1 + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.09, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 1.2);
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
    this.mode = mode; // 'portal' | 'cavern'
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
    const count = this.mode === 'portal' ? 60 : 45;
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
        hue: 35 + Math.random() * 25 // Warm amber/gold
      };
    } else {
      // Golden embers floating in dashboard cavern
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
      this.particles.forEach((p) => {
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
      this.particles.forEach((p) => {
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
// 4. MAIN CONTROLLER
// =============================================================================
class SanctumApp {
  constructor() {
    this.dom = {
      // Screens
      screens: document.querySelectorAll('.screen-view'),
      pageLogin: document.getElementById('pageLogin'),
      pageAccessCode: document.getElementById('pageAccessCode'),
      portalTransitionSection: document.getElementById('portalTransitionSection'),
      pageDashboard: document.getElementById('pageDashboard'),

      // Page 1 Elements
      btnGoogleLogin: document.getElementById('btnGoogleLogin'),

      // Page 2 Elements
      accessCodeCard: document.getElementById('accessCodeCard'),
      accessCodeForm: document.getElementById('accessCodeForm'),
      accessCodeInput: document.getElementById('accessCodeInput'),
      btnSubmitCode: document.getElementById('btnSubmitCode'),
      codeStatusMsg: document.getElementById('codeStatusMsg'),

      // Transition Elements
      portalVideo: document.getElementById('portalVideo'),
      transitionWarpFlash: document.getElementById('transitionWarpFlash'),
      globalWarpFlash: document.getElementById('globalWarpFlash'),

      // Page 3 Elements
      navSoundToggleBtn: document.getElementById('navSoundToggleBtn'),
      sfxIconOn: document.querySelector('.sfx-icon-on'),
      sfxIconOff: document.querySelector('.sfx-icon-off'),
      navSfxLabel: document.getElementById('navSfxLabel'),
      avatarBtn: document.getElementById('avatarBtn'),
      profileDropdown: document.getElementById('profileDropdown'),
      btnLogout: document.getElementById('btnLogout'),
      btnIntroduction: document.getElementById('btnIntroduction'),
      introNotice: document.getElementById('introNotice'),
      mainGateBtn: document.getElementById('mainGateBtn'),
      gateLockSeal: document.getElementById('gateLockSeal'),
      gateIndicator: document.getElementById('gateIndicator'),
      gateStatusDot: document.getElementById('gateStatusDot'),
      gateTitleBadge: document.getElementById('gateTitleBadge'),
      keystoneSigil: document.getElementById('keystoneSigil')
    };

    this.init();
  }

  init() {
    // Initialize particle canvases
    this.portalParticles = new ParticleCanvas('portalSparksCanvas', 'portal');
    this.cavernParticles = new ParticleCanvas('cavernParticlesCanvas', 'cavern');

    // Bind event listeners
    this.bindEvents();

    // Check hash for direct routing
    this.handleRouteHash();

    // Check if user returned from Introduction Module to trigger the unlock
    this.checkReturnFromIntro();

    // Listen to hashchange in case user navigates within the same session
    window.addEventListener('hashchange', () => {
      this.handleRouteHash();
      this.checkReturnFromIntro();
    });

    // Listen to pageshow in case user navigated back via browser history (bfcache)
    window.addEventListener('pageshow', () => {
      const hash = window.location.hash.toLowerCase();
      if (!hash.includes('dashboard')) {
        this.handleLogout();
      }
    });
  }

  /**
   * Switch active screen smoothly
   * @param {string} screenId
   */
  showScreen(screenId) {
    this.dom.screens.forEach((screen) => {
      screen.classList.remove('active');
    });

    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      APP_STATE.currentScreen = screenId;

      // Ensure canvas is properly sized on screen switch
      if (this.portalParticles) this.portalParticles.resize();
      if (this.cavernParticles) this.cavernParticles.resize();
    }
  }

  bindEvents() {
    // =========================================================================
    // PAGE 1: GOOGLE LOGIN
    // =========================================================================
    if (this.dom.btnGoogleLogin) {
      this.dom.btnGoogleLogin.addEventListener('click', (e) => {
        e.preventDefault();
        sfx.playClick();

        // Smooth transition to Page 2 (Access Code)
        this.showScreen('pageAccessCode');
        if (this.dom.accessCodeInput) {
          setTimeout(() => {
            this.dom.accessCodeInput.focus();
          }, 200);
        }
      });
    }

    // =========================================================================
    // PAGE 2: ACCESS CODE SUBMISSION
    // =========================================================================
    const handleCodeSubmit = (e) => {
      if (e) e.preventDefault();
      if (APP_STATE.isTransitioning) return;

      const codeVal = this.dom.accessCodeInput ? this.dom.accessCodeInput.value.trim() : '';

      if (!codeVal) {
        // Validation failure: shake card and display warning
        sfx.playRattle();
        if (this.dom.accessCodeCard) {
          this.dom.accessCodeCard.classList.remove('shake');
          void this.dom.accessCodeCard.offsetWidth; // Trigger reflow
          this.dom.accessCodeCard.classList.add('shake');
        }
        if (this.dom.codeStatusMsg) {
          this.dom.codeStatusMsg.textContent = '✦ Please enter an access code to proceed.';
          this.dom.codeStatusMsg.className = 'card-status-message error';
        }
        if (this.dom.accessCodeInput) {
          this.dom.accessCodeInput.focus();
        }
        return;
      }

      // Valid access code accepted
      sfx.playClick();
      APP_STATE.accessCode = codeVal;
      try {
        sessionStorage.setItem('sanctumAuth', 'true');
      } catch (e) {}

      if (this.dom.codeStatusMsg) {
        this.dom.codeStatusMsg.textContent = '✦ Clearance accepted. Opening sanctum portal...';
        this.dom.codeStatusMsg.className = 'card-status-message success';
      }

      // Initiate Cinematic Portal Warp Transition
      this.triggerPortalWarp();
    };

    if (this.dom.btnSubmitCode) {
      this.dom.btnSubmitCode.addEventListener('click', handleCodeSubmit);
    }
    if (this.dom.accessCodeInput) {
      this.dom.accessCodeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handleCodeSubmit(e);
        }
      });
    }

    // =========================================================================
    // CINEMATIC TRANSITION VIDEO EVENTS (Let video play out fully)
    // =========================================================================
    if (this.dom.portalVideo) {
      this.dom.portalVideo.addEventListener('ended', () => {
        // Video finished naturally: trigger full-screen radiant flash and complete warp
        if (this.dom.globalWarpFlash) this.dom.globalWarpFlash.classList.add('flash-active');
        if (this.dom.transitionWarpFlash) this.dom.transitionWarpFlash.classList.add('flash-active');
        this.completePortalWarp();
      });

      this.dom.portalVideo.addEventListener('timeupdate', () => {
        const video = this.dom.portalVideo;
        if (!video.duration || isNaN(video.duration)) return;
        const remaining = video.duration - video.currentTime;
        // Build up full-screen radiant flash in final 0.45s of video
        if (remaining <= 0.45 && APP_STATE.isTransitioning) {
          if (this.dom.globalWarpFlash) this.dom.globalWarpFlash.classList.add('flash-active');
          if (this.dom.transitionWarpFlash) this.dom.transitionWarpFlash.classList.add('flash-active');
        }
      });
    }

    // =========================================================================
    // PAGE 3: SFX TOGGLE
    // =========================================================================
    if (this.dom.navSoundToggleBtn) {
      this.dom.navSoundToggleBtn.addEventListener('click', () => {
        APP_STATE.soundEnabled = !APP_STATE.soundEnabled;
        if (APP_STATE.soundEnabled) {
          sfx.playClick();
        }
        this.updateSfxUI();
      });
    }

    // =========================================================================
    // PAGE 3: PROFILE BUTTON & LOGOUT POPUP
    // =========================================================================
    if (this.dom.avatarBtn && this.dom.profileDropdown) {
      this.dom.avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sfx.playClick();
        const isOpen = this.dom.profileDropdown.classList.contains('open');
        if (isOpen) {
          this.closeProfileDropdown();
        } else {
          this.openProfileDropdown();
        }
      });

      // Close dropdown on outside click
      document.addEventListener('click', (e) => {
        if (!this.dom.profileDropdown.contains(e.target) && !this.dom.avatarBtn.contains(e.target)) {
          this.closeProfileDropdown();
        }
      });

      // Close on Escape key
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeProfileDropdown();
        }
      });
    }

    // LOGOUT ACTION
    if (this.dom.btnLogout) {
      this.dom.btnLogout.addEventListener('click', () => {
        sfx.playClick();
        this.closeProfileDropdown();
        this.handleLogout();
      });
    }

    // =========================================================================
    // PAGE 3: INTRODUCTION BUTTON (Unlocks the Single Dungeon Gate)
    // =========================================================================
    if (this.dom.btnIntroduction) {
      this.dom.btnIntroduction.addEventListener('click', () => {
        this.handleIntroductionClick();
      });
    }

    // =========================================================================
    // PAGE 3: SINGLE MEDIEVAL DUNGEON GATE INTERACTION
    // =========================================================================
    if (this.dom.mainGateBtn) {
      this.dom.mainGateBtn.addEventListener('click', () => {
        this.handleGateClick();
      });
    }
  }

  // ===========================================================================
  // CINEMATIC WARP ORCHESTRATION
  // ===========================================================================
  triggerPortalWarp() {
    APP_STATE.isTransitioning = true;
    sfx.playWarpWhoosh();

    // Show video transition screen
    this.showScreen('portalTransitionSection');

    if (this.dom.portalVideo) {
      this.dom.portalVideo.currentTime = 0;

      if (this.dom.globalWarpFlash) {
        this.dom.globalWarpFlash.classList.remove('flash-active');
      }
      if (this.dom.transitionWarpFlash) {
        this.dom.transitionWarpFlash.classList.remove('flash-active');
      }

      const playPromise = this.dom.portalVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Autoplay prevented or playback error:', err);
          // Only fallback if video playback is prevented by browser policy
          setTimeout(() => {
            if (APP_STATE.isTransitioning) {
              this.completePortalWarp();
            }
          }, 3500);
        });
      }

      // Generous safety timer ONLY if video somehow stalls indefinitely (video is ~5.05s)
      clearTimeout(this.warpFallbackTimer);
      const safeDuration = (this.dom.portalVideo.duration && !isNaN(this.dom.portalVideo.duration))
        ? (this.dom.portalVideo.duration + 2.5) * 1000
        : 8500;

      this.warpFallbackTimer = setTimeout(() => {
        if (APP_STATE.isTransitioning) {
          console.warn('Warp fallback triggered after full duration window');
          this.completePortalWarp();
        }
      }, safeDuration);
    } else {
      setTimeout(() => {
        this.completePortalWarp();
      }, 2500);
    }
  }

  completePortalWarp() {
    if (!APP_STATE.isTransitioning) return;
    APP_STATE.isTransitioning = false;
    clearTimeout(this.warpFallbackTimer);

    // Peak full-screen celestial radiance flash
    if (this.dom.globalWarpFlash) {
      this.dom.globalWarpFlash.classList.add('flash-active');
    }
    if (this.dom.transitionWarpFlash) {
      this.dom.transitionWarpFlash.classList.add('flash-active');
    }

    // Set flag so Page 3 knows this is a genuine portal warp arrival
    try {
      sessionStorage.setItem('portalWarpArrival', 'true');
    } catch (e) {}

    // Seamlessly redirect to standalone Page 3 (dashboard.html)
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 380);
  }

  // ===========================================================================
  // SFX UI UPDATE
  // ===========================================================================
  updateSfxUI() {
    if (this.dom.sfxIconOn && this.dom.sfxIconOff) {
      if (APP_STATE.soundEnabled) {
        this.dom.sfxIconOn.classList.remove('hidden');
        this.dom.sfxIconOff.classList.add('hidden');
        if (this.dom.navSfxLabel) this.dom.navSfxLabel.textContent = 'SFX: ON';
      } else {
        this.dom.sfxIconOn.classList.add('hidden');
        this.dom.sfxIconOff.classList.remove('hidden');
        if (this.dom.navSfxLabel) this.dom.navSfxLabel.textContent = 'SFX: OFF';
      }
    }
  }

  // ===========================================================================
  // PROFILE DROPDOWN MANAGEMENT
  // ===========================================================================
  openProfileDropdown() {
    if (this.dom.profileDropdown && this.dom.avatarBtn) {
      this.dom.profileDropdown.classList.add('open');
      this.dom.avatarBtn.setAttribute('aria-expanded', 'true');
    }
  }

  closeProfileDropdown() {
    if (this.dom.profileDropdown && this.dom.avatarBtn) {
      this.dom.profileDropdown.classList.remove('open');
      this.dom.avatarBtn.setAttribute('aria-expanded', 'false');
    }
  }

  // ===========================================================================
  // LOGOUT (Reset & Return to Page 1)
  // ===========================================================================
  handleLogout() {
    // Reset state
    APP_STATE.isGateUnlocked = false;
    APP_STATE.accessCode = '';

    try {
      sessionStorage.removeItem('sanctumAuth');
      sessionStorage.removeItem('justReturnedFromIntro');
      localStorage.removeItem('sanctumGateUnlocked');
    } catch (e) {}

    // Reset access code input and message
    if (this.dom.accessCodeInput) {
      this.dom.accessCodeInput.value = '';
    }
    if (this.dom.codeStatusMsg) {
      this.dom.codeStatusMsg.textContent = '';
      this.dom.codeStatusMsg.className = 'card-status-message';
    }

    // Reset dungeon gate to locked state
    this.lockGateDOM();

    // Smooth transition back to Page 1 (Login)
    this.showScreen('pageLogin');
  }

  // ===========================================================================
  // INTRODUCTION BUTTON HANDLER (Redirects to Introduction; Gate unlocks on return)
  // ===========================================================================
  handleIntroductionClick() {
    sfx.playClick();

    // Mark that user has clicked Introduction so gate unlocks upon return
    try {
      sessionStorage.setItem('justReturnedFromIntro', 'true');
      localStorage.setItem('sanctumGateUnlocked', 'true');
    } catch (e) {}

    // Active radiant animation on the Introduction button
    if (this.dom.btnIntroduction) {
      this.dom.btnIntroduction.classList.add('launching');
    }

    // Extensible hook for future page navigation or backend communication
    if (typeof window.onIntroductionClick === 'function') {
      window.onIntroductionClick();
    }

    // Smooth cinematic redirection to the Introduction Module with warp flash
    setTimeout(() => {
      if (this.dom.transitionWarpFlash) {
        this.dom.transitionWarpFlash.classList.add('flash-active');
      }
      setTimeout(() => {
        window.location.href = 'introduction-module/index.html';
      }, 350);
    }, 450);
  }

  // ===========================================================================
  // DUNGEON GATE INTERACTION HANDLER
  // ===========================================================================
  handleGateClick() {
    if (!APP_STATE.isGateUnlocked) {
      // Gate is locked: rattle door, play rattle sound, and provide visual feedback
      sfx.playRattle();

      if (this.dom.mainGateBtn) {
        this.dom.mainGateBtn.classList.remove('rattle');
        void this.dom.mainGateBtn.offsetWidth; // Reflow to replay animation
        this.dom.mainGateBtn.classList.add('rattle');
        setTimeout(() => {
          if (this.dom.mainGateBtn) this.dom.mainGateBtn.classList.remove('rattle');
        }, 500);
      }

      if (this.dom.introNotice) {
        this.dom.introNotice.textContent = '🔒 The dungeon gate is sealed! Click Introduction above to unlock it.';
        this.dom.introNotice.classList.remove('unlocked');
      }
    } else {
      // Gate is unlocked: ready to enter!
      sfx.playClick();

      // Trigger visual pulse on door
      if (this.dom.mainGateBtn) {
        this.dom.mainGateBtn.classList.add('gate-unlock-burst');
        setTimeout(() => {
          if (this.dom.mainGateBtn) this.dom.mainGateBtn.classList.remove('gate-unlock-burst');
        }, 800);
      }

      // Extensible hook for future backend / expedition page
      if (typeof window.onGateEnter === 'function') {
        window.onGateEnter();
      }
    }
  }

  // ===========================================================================
  // GATE DOM STATE CONTROLS (Locked vs Unlocked)
  // ===========================================================================
  unlockGateDOM() {
    APP_STATE.isGateUnlocked = true;

    if (this.dom.mainGateBtn) {
      this.dom.mainGateBtn.classList.remove('locked');
      this.dom.mainGateBtn.classList.add('unlocked');
      this.dom.mainGateBtn.classList.add('gate-unlock-burst');
      this.dom.mainGateBtn.setAttribute('aria-label', 'Medieval Dungeon Gate (Unlocked)');

      setTimeout(() => {
        if (this.dom.mainGateBtn) this.dom.mainGateBtn.classList.remove('gate-unlock-burst');
      }, 900);
    }

    if (this.dom.gateTitleBadge) {
      this.dom.gateTitleBadge.textContent = 'UNLOCKED';
    }

    if (this.dom.introNotice) {
      this.dom.introNotice.textContent = '✦ Gate seal dispelled! The doorway is open.';
      this.dom.introNotice.classList.add('unlocked');
    }
  }

  lockGateDOM() {
    APP_STATE.isGateUnlocked = false;

    if (this.dom.mainGateBtn) {
      this.dom.mainGateBtn.classList.remove('unlocked');
      this.dom.mainGateBtn.classList.remove('gate-unlock-burst');
      this.dom.mainGateBtn.classList.add('locked');
      this.dom.mainGateBtn.setAttribute('aria-label', 'Medieval Dungeon Gate (Locked)');
    }

    if (this.dom.gateTitleBadge) {
      this.dom.gateTitleBadge.textContent = 'LOCKED';
    }

    if (this.dom.introNotice) {
      this.dom.introNotice.textContent = 'Click Introduction to break the seal and unlock the dungeon gate.';
      this.dom.introNotice.classList.remove('unlocked');
    }
  }

  // ===========================================================================
  // CHECK RETURN FROM INTRODUCTION MODULE (Delayed dramatic unlock on return)
  // ===========================================================================
  checkReturnFromIntro() {
    try {
      const justReturned = sessionStorage.getItem('justReturnedFromIntro') === 'true';
      const isUnlocked = localStorage.getItem('sanctumGateUnlocked') === 'true';

      if (justReturned) {
        // One-time consumption of return flag
        sessionStorage.removeItem('justReturnedFromIntro');

        // Ensure gate starts locked so user witnesses the dramatic unsealing sequence
        this.lockGateDOM();

        // Dramatic delay so user lands on dashboard, settles, and sees the gate unseal
        setTimeout(() => {
          this.unlockGateDOM();
          sfx.playGateOpen();
        }, 550);
      } else if (isUnlocked) {
        // Persisted state from earlier completion
        this.unlockGateDOM();
      } else {
        this.lockGateDOM();
      }
    } catch (e) {
      console.warn('Error checking return from intro:', e);
    }
  }

  // ===========================================================================
  // HASH / QUERY PARAMETER ROUTING (For direct access and debugging)
  // ===========================================================================
  handleRouteHash() {
    const hash = window.location.hash.toLowerCase();
    const query = window.location.search.toLowerCase();

    if (hash.includes('login')) {
      this.showScreen('pageLogin');
    } else if (hash.includes('code') || hash.includes('access')) {
      this.showScreen('pageAccessCode');
    } else if (hash.includes('dashboard') || query.includes('dashboard')) {
      // Forward to standalone Page 3 (dashboard.html)
      window.location.href = 'dashboard.html';
    }
  }
}

// Global initialization on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.sanctumApp = new SanctumApp();
});
