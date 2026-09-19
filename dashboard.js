/**
 * Cybersecurity Classes — Sanctum Chamber Dashboard (Standalone Page 3)
 * Modern, accessible, standalone controller for the Medieval Dungeon Gate,
 * ambient cavern starfield canvas, SFX audio synthesizer, and cross-module navigation.
 */

'use strict';

// =============================================================================
// GLOBAL APP STATE & PERSISTENCE
// =============================================================================
const DASHBOARD_STATE = {
  isGateUnlocked: false,
  soundEnabled: true
};

// Restore SFX preference if available
try {
  const savedSfx = localStorage.getItem('sanctumSfxEnabled');
  if (savedSfx !== null) {
    DASHBOARD_STATE.soundEnabled = savedSfx === 'true';
  }
} catch (e) {}

// =============================================================================
// PROCEDURAL AUDIO SYNTHESIZER (No external audio file dependencies)
// =============================================================================
class DashboardSFX {
  constructor() {
    this.ctx = null;
  }

  initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    if (!DASHBOARD_STATE.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(820, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playRattle() {
    if (!DASHBOARD_STATE.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      // Clunky iron lock rattle resonance
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const delay = i * 0.045;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120 + i * 28, this.ctx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + delay + 0.07);

        gain.gain.setValueAtTime(0.18, this.ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + 0.08);
      }
    } catch (e) {}
  }

  playGateOpen() {
    if (!DASHBOARD_STATE.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // 1. Heavy stone arch grind / sub-rumble
      const rumbleOsc = this.ctx.createOscillator();
      const rumbleGain = this.ctx.createGain();
      rumbleOsc.type = 'triangle';
      rumbleOsc.frequency.setValueAtTime(65, now);
      rumbleOsc.frequency.linearRampToValueAtTime(85, now + 0.4);
      rumbleOsc.frequency.exponentialRampToValueAtTime(40, now + 0.9);

      rumbleGain.gain.setValueAtTime(0.01, now);
      rumbleGain.gain.linearRampToValueAtTime(0.28, now + 0.15);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

      rumbleOsc.connect(rumbleGain);
      rumbleGain.connect(this.ctx.destination);
      rumbleOsc.start(now);
      rumbleOsc.stop(now + 0.95);

      // 2. Mystic Celestial Chime / Unseal Harmonics
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + 0.08 + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.85);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.85);
      });
    } catch (e) {}
  }

  playDashboardReveal() {
    if (!DASHBOARD_STATE.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [220, 277.18, 329.63, 440, 554.37].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.09;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.06, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 1.2);
      });
    } catch (e) {}
  }

  playWarpWhoosh() {
    if (!DASHBOARD_STATE.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }
}

const sfx = new DashboardSFX();

// =============================================================================
// CAVERN PARTICLES CANVAS SYSTEM
// =============================================================================
class CavernParticleCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.maxParticles = 55;
    this.animId = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initParticles();
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement || document.body;
    this.width = this.canvas.width = parent.clientWidth || window.innerWidth;
    this.height = this.canvas.height = parent.clientHeight || window.innerHeight;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  createParticle(randomY = false) {
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : this.height + 10,
      radius: Math.random() * 2 + 0.7,
      vx: (Math.random() - 0.5) * 0.45,
      vy: -(Math.random() * 0.65 + 0.25),
      alpha: Math.random() * 0.55 + 0.25,
      hue: Math.random() > 0.45 ? 40 : 210
    };
  }

  animate() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.y < -10 || p.x < -10 || p.x > this.width + 10) {
        this.particles[i] = this.createParticle(false);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.hue === 40 
        ? `rgba(255, 184, 51, ${p.alpha})`
        : `rgba(147, 197, 253, ${p.alpha * 0.7})`;
      this.ctx.fill();
    }

    this.animId = requestAnimationFrame(() => this.animate());
  }
}

// =============================================================================
// MAIN DASHBOARD APPLICATION CONTROLLER
// =============================================================================
class DashboardApp {
  constructor() {
    this.dom = {
      pageDashboard: document.getElementById('pageDashboard'),
      dashboardWarpFlash: document.getElementById('dashboardWarpFlash'),
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
      gateTitleBadge: document.getElementById('gateTitleBadge'),
      gateLockSeal: document.getElementById('gateLockSeal'),
      keystoneSigil: document.getElementById('keystoneSigil')
    };

    this.init();
  }

  init() {
    // 0. Instant Auth Guard check
    if (!this.checkAuthGuard()) return;

    // 1. Initialize ambient cavern particles
    this.cavernParticles = new CavernParticleCanvas('cavernParticlesCanvas');

    // 2. Conditional entrance animation
    const justReturned = sessionStorage.getItem('justReturnedFromIntro') === 'true';
    if (!justReturned) {
      if (this.dom.pageDashboard) {
        this.dom.pageDashboard.classList.add('dashboard-enter-anim');
      }
      sfx.playDashboardReveal();
    } else {
      if (this.dom.pageDashboard) {
        this.dom.pageDashboard.classList.remove('dashboard-enter-anim');
      }
    }

    // 3. Smooth, slow celestial dissolve (ONLY when arriving fresh from Page 2 portal warp)
    const arrivingFromPortal = sessionStorage.getItem('portalWarpArrival') === 'true';
    if (arrivingFromPortal) {
      sessionStorage.removeItem('portalWarpArrival');
      if (this.dom.dashboardWarpFlash) {
        // Match Page 2's glow immediately with no transition jump
        this.dom.dashboardWarpFlash.style.transition = 'none';
        this.dom.dashboardWarpFlash.classList.add('flash-active');
        void this.dom.dashboardWarpFlash.offsetWidth; // Force reflow

        // Re-enable smooth transition and slowly dissolve away into the cavern
        this.dom.dashboardWarpFlash.style.transition = '';
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (this.dom.dashboardWarpFlash) {
              this.dom.dashboardWarpFlash.classList.remove('flash-active');
            }
          }, 80);
        });
      }
    } else {
      if (this.dom.dashboardWarpFlash) {
        this.dom.dashboardWarpFlash.classList.remove('flash-active');
      }
    }

    // 4. Update SFX UI state
    this.updateSfxUI();

    // 5. Bind event listeners
    this.bindEvents();

    // 6. Check if user just returned from Introduction Module to trigger the unlock
    this.checkReturnFromIntro();

    // 7. Intercept browser back button to logout
    this.setupBackToLogout();

    // 8. Handle bfcache / browser navigation with auth re-verification
    window.addEventListener('pageshow', () => {
      if (!this.checkAuthGuard()) return;
      this.checkReturnFromIntro();
    });

    // 9. Clean up entrance animation after ~2.2s
    setTimeout(() => {
      if (this.dom.pageDashboard) {
        this.dom.pageDashboard.classList.remove('dashboard-enter-anim');
      }
    }, 2200);
  }

  bindEvents() {
    // SFX TOGGLE BUTTON
    if (this.dom.navSoundToggleBtn) {
      this.dom.navSoundToggleBtn.addEventListener('click', () => {
        DASHBOARD_STATE.soundEnabled = !DASHBOARD_STATE.soundEnabled;
        try {
          localStorage.setItem('sanctumSfxEnabled', String(DASHBOARD_STATE.soundEnabled));
        } catch (e) {}

        if (DASHBOARD_STATE.soundEnabled) {
          sfx.playClick();
        }
        this.updateSfxUI();
      });
    }

    // PROFILE BUTTON & DROPDOWN POPUP
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

    // LOGOUT ACTION (Clears sanctum session and returns to Page 1)
    if (this.dom.btnLogout) {
      this.dom.btnLogout.addEventListener('click', () => {
        sfx.playClick();
        this.closeProfileDropdown();
        this.handleLogout();
      });
    }

    // INTRODUCTION BUTTON CLICK
    if (this.dom.btnIntroduction) {
      this.dom.btnIntroduction.addEventListener('click', () => {
        this.handleIntroductionClick();
      });
    }

    // DUNGEON GATE CLICK
    if (this.dom.mainGateBtn) {
      this.dom.mainGateBtn.addEventListener('click', () => {
        this.handleGateClick();
      });
    }
  }

  // ===========================================================================
  // SFX UI UPDATE
  // ===========================================================================
  updateSfxUI() {
    if (this.dom.sfxIconOn && this.dom.sfxIconOff) {
      if (DASHBOARD_STATE.soundEnabled) {
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
  // BROWSER BACK BUTTON NAVIGATION (Logs out to Login on back navigation)
  // ===========================================================================
  setupBackToLogout() {
    try {
      // Ensure there's a history state to intercept the back action
      if (!window.history.state || window.history.state.sanctum !== 'dashboard') {
        window.history.pushState({ sanctum: 'dashboard' }, document.title, window.location.href);
      }
    } catch (e) {}

    window.addEventListener('popstate', () => {
      // User clicked browser Back button on 3rd page: execute logout and return to login
      this.handleLogout();
    });
  }

  // ===========================================================================
  // AUTH GUARD (Redirects unauthorized visits to Login)
  // ===========================================================================
  checkAuthGuard() {
    try {
      if (sessionStorage.getItem('sanctumAuth') !== 'true') {
        window.location.replace('index.html#login');
        return false;
      }
    } catch (e) {
      window.location.replace('index.html#login');
      return false;
    }
    return true;
  }

  // ===========================================================================
  // LOGOUT (Reset & Return to Page 1: index.html)
  // ===========================================================================
  handleLogout() {
    DASHBOARD_STATE.isGateUnlocked = false;

    try {
      sessionStorage.removeItem('sanctumAuth');
      sessionStorage.removeItem('justReturnedFromIntro');
      localStorage.removeItem('sanctumGateUnlocked');
    } catch (e) {}

    // Lock gate in UI
    this.lockGateDOM();

    // Smooth deep sanctum void fade to Page 1 Login
    if (this.dom.dashboardWarpFlash) {
      this.dom.dashboardWarpFlash.classList.remove('forest-transition');
      this.dom.dashboardWarpFlash.classList.add('void-transition', 'flash-active');
    }

    setTimeout(() => {
      window.location.replace('index.html#login');
    }, 380);
  }

  // ===========================================================================
  // INTRODUCTION BUTTON HANDLER (Redirects to Introduction; Gate unlocks on return)
  // ===========================================================================
  // Helper to verify all 9 challenges are completed
  hasCompletedAllChallenges() {
    const REQUIRED_CHALLENGES = [
      'binexp', 'sqli', 'xss', 'wifi', 'crypto', 'cmdinj', 'idor', 'traversal', 'social'
    ];
    try {
      const raw = localStorage.getItem('sanctum_completed_challenges');
      const completed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(completed)) return false;
      return REQUIRED_CHALLENGES.every(id => completed.includes(id));
    } catch (e) {
      return false;
    }
  }

  getCompletedCount() {
    try {
      const raw = localStorage.getItem('sanctum_completed_challenges');
      const completed = raw ? JSON.parse(raw) : [];
      return Array.isArray(completed) ? completed.length : 0;
    } catch (e) {
      return 0;
    }
  }

  // ===========================================================================
  // INTRODUCTION BUTTON HANDLER (Redirects to Introduction)
  // ===========================================================================
  handleIntroductionClick() {
    sfx.playClick();

    try {
      sessionStorage.setItem('justReturnedFromIntro', 'true');
    } catch (e) {}

    // Active radiant animation on the Introduction button
    if (this.dom.btnIntroduction) {
      this.dom.btnIntroduction.classList.add('launching');
    }

    if (typeof window.onIntroductionClick === 'function') {
      window.onIntroductionClick();
    }

    // Smooth, slow emerald grove transition to the Introduction Module
    setTimeout(() => {
      if (this.dom.dashboardWarpFlash) {
        this.dom.dashboardWarpFlash.classList.remove('void-transition');
        this.dom.dashboardWarpFlash.classList.add('forest-transition', 'flash-active');
      }
      setTimeout(() => {
        window.location.href = 'introduction-module/index.html';
      }, 500);
    }, 180);
  }

  // ===========================================================================
  // DUNGEON GATE INTERACTION HANDLER (Only unlocked iff all 9 completed)
  // ===========================================================================
  handleGateClick() {
    if (!this.hasCompletedAllChallenges()) {
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

      const count = this.getCompletedCount();
      if (this.dom.introNotice) {
        this.dom.introNotice.textContent = count > 0
          ? `🔒 The dungeon gate remains sealed! Complete all 9 challenges in the Introduction module (${count} of 9 completed).`
          : '🔒 The dungeon gate is sealed! Complete all 9 challenges in the Introduction module to unlock it.';
        this.dom.introNotice.classList.remove('unlocked');
      }
    } else {
      // Gate is unlocked: ready to enter!
      sfx.playClick();

      if (this.dom.mainGateBtn) {
        this.dom.mainGateBtn.classList.add('gate-unlock-burst');
        setTimeout(() => {
          if (this.dom.mainGateBtn) this.dom.mainGateBtn.classList.remove('gate-unlock-burst');
        }, 800);
      }

      if (typeof window.onGateEnter === 'function') {
        window.onGateEnter();
      }
    }
  }

  // ===========================================================================
  // GATE DOM STATE CONTROLS (Locked vs Unlocked)
  // ===========================================================================
  unlockGateDOM() {
    DASHBOARD_STATE.isGateUnlocked = true;

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
      this.dom.introNotice.textContent = '✦ All 9 challenges conquered! Gate seal dispelled — doorway is open.';
      this.dom.introNotice.classList.add('unlocked');
    }
  }

  lockGateDOM() {
    DASHBOARD_STATE.isGateUnlocked = false;

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
      const count = this.getCompletedCount();
      this.dom.introNotice.textContent = count > 0
        ? `Complete all 9 challenges in the Introduction module to unlock the dungeon gate (${count} of 9 completed).`
        : 'Complete all 9 challenges in the Introduction module to unlock the dungeon gate.';
      this.dom.introNotice.classList.remove('unlocked');
    }
  }

  // ===========================================================================
  // CHECK RETURN FROM INTRODUCTION MODULE (Only unlocks iff all 9 challenges done)
  // ===========================================================================
  checkReturnFromIntro() {
    try {
      const justReturned = sessionStorage.getItem('justReturnedFromIntro') === 'true';
      sessionStorage.removeItem('justReturnedFromIntro');

      const allDone = this.hasCompletedAllChallenges();

      if (allDone) {
        localStorage.setItem('sanctumGateUnlocked', 'true');
        if (justReturned) {
          // Dramatic delay so user lands on dashboard, settles, and sees the gate unseal
          this.lockGateDOM();
          setTimeout(() => {
            this.unlockGateDOM();
            sfx.playGateOpen();
          }, 550);
        } else {
          this.unlockGateDOM();
        }
      } else {
        localStorage.removeItem('sanctumGateUnlocked');
        this.lockGateDOM();
      }
    } catch (e) {
      console.warn('Error checking return from intro:', e);
    }
  }
}

// Global initialization on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.dashboardApp = new DashboardApp();
});
