/**
 * House Rimeguard — The Frozen Citadel
 * Standalone interactive controller for 60fps snowdrift & snow-wisp companion canvas,
 * procedural SVG cloth wave physics flags, Web Audio crystal synthesizer,
 * diegetic sentinel patrol gates, and the Ice-Bound Oracle.
 */

'use strict';

// =============================================================================
// GLOBAL STATE & DATA
// =============================================================================
const RIMEGUARD_GATES = [
  {
    id: 'tower-1',
    numeral: 'Ⅰ',
    name: 'THE FROSTFANG BASTION',
    title: 'Foreground West Bastion',
    role: 'Western Palisade & Stone Rampart',
    lore: 'The heavy bastion guarding the western approach. Armed with defensive timber palisades, ashlar masonry, and an eternal blue flame brazier.',
    garrison: 'Frostfang Sentry Wolves & Winterguard Marksmen',
    status: 'thawed',
    statusLabel: 'Gate Thawed',
    flag: 'FLAG{f0und4t10ns_0f_th3_fr0st}',
    hint: 'Foundation perimeter verified. The wolves accept your clearance.'
  },
  {
    id: 'tower-2',
    numeral: 'Ⅱ',
    name: 'THE GLACIAL CASCADE BASTION',
    title: 'Foreground East Bastion',
    role: 'Eastern Flank & Cataract Bastion',
    lore: 'A round stone fortress overhanging the icy gorge. A mountain river cascades off its battlements—flash-frozen mid-fall into a colossal spire of ice crystals.',
    garrison: 'Glacial Sentinels & Rime Mages',
    status: 'thawed',
    statusLabel: 'Gate Thawed',
    flag: 'FLAG{c4sc4d1ng_crst4l_l0g1c}',
    hint: 'The waterfall sheen carries harmonic pulses. Gateway is thawed.'
  },
  {
    id: 'tower-3',
    numeral: 'Ⅲ',
    name: 'THE RIME WATCHTOWER',
    title: 'Midground West Sentry',
    role: 'Mid-Causeway Overwatch',
    lore: 'A slender stone turret commanding the western ridge. Its narrow arrow slits emit pale cyan frostlight, surveying the cracked causeway below.',
    garrison: 'Permafrost Scouts & Cryo-Archers',
    status: 'sealed',
    statusLabel: 'Permafrost Sealed',
    flag: 'FLAG{1c3b0und_c1ph3r_unr4v3l}',
    hint: 'Cipher hint: Submit "FLAG{1c3b0und_c1ph3r_unr4v3l}" or trigger Shatter & Unlock to unseal.'
  },
  {
    id: 'tower-4',
    numeral: 'Ⅳ',
    name: 'THE AURORA SPIRE',
    title: 'Midground East Sentry',
    role: 'Polar Atmospheric Conduit',
    lore: 'Crowned with an ancient lightning finial that channels northern auroras into the runic data grid running beneath the ice flagstones.',
    garrison: 'Aurora Wardens & Signal Keepers',
    status: 'sealed',
    statusLabel: 'Permafrost Sealed',
    flag: 'FLAG{4ur0r4_d33p_v3r1f1c4t10n}',
    hint: 'Channel the aurora ribbon. Enter "FLAG{4ur0r4_d33p_v3r1f1c4t10n}" or click Shatter to disperse the frost.'
  },
  {
    id: 'citadel',
    numeral: '✦',
    name: 'THE SOVEREIGN DONJON & ICE-CORE',
    title: 'Citadel Apex Donjon',
    role: 'Sovereign Throne of House Rimeguard',
    lore: 'The supreme fortress donjon towering at the horizon. Suspended within its open belfry, the crystalline Ice-Core rotates in perpetual levitation, commanding all defenses.',
    garrison: 'The Iron Guard & High Oracle',
    status: 'sealed',
    statusLabel: 'Sanctum Sealed',
    flag: 'FLAG{p3rm4fr0st_c0r3_4w4k3n3d}',
    hint: 'When all perimeter sentinels are thawed, the sovereign core awakens. Enter "FLAG{p3rm4fr0st_c0r3_4w4k3n3d}" to claim mastery.'
  }
];

const ORACLE_RIDDLES = [
  'What speaks without a tongue, roars without a throat, and freezes iron in its breath? The North Glacier wind. Slow down and verify before you act.',
  'Four towers cast their long shadows upon the snow, yet only one hearth burns at the far horizon. Approach the threshold with intent.',
  'Cracks in the ice carry the pulsing runes of an ancient age. Walk with care between the flagstones; haste shatters the bridge.',
  'A wolf of frost does not hunt for flesh; it tests the resolve of any soul seeking passage to the citadel keep.',
  'When all four sentinels are thawed, the ice-core shall awaken in the belfry and the iron portcullis of the citadel will rise.'
];

class RimeguardApp {
  constructor() {
    this.soundEnabled = true;
    try {
      const savedSfx = localStorage.getItem('sanctumSfxEnabled');
      if (savedSfx !== null) this.soundEnabled = savedSfx === 'true';
    } catch (e) {}

    this.audioCtx = null;
    this.activeGate = null;
    this.oracleIndex = 0;
    this.sentinelsVisible = true;
    this.windGust = 1;
    this.lastGustTime = 0;

    // Load gate unlock states from localStorage
    this.gates = JSON.parse(JSON.stringify(RIMEGUARD_GATES));
    this.loadGateStates();

    this.cacheDOM();
    this.initAudio();
    this.initSnowdriftCanvas();
    this.initProceduralFlags();
    this.bindEvents();
    this.updateHUD();
    this.updateGateZonesDOM();
  }

  cacheDOM() {
    this.dom = {
      viewport: document.getElementById('rimeguardViewport'),
      hud: document.getElementById('rimeguardHud'),
      warpFlash: document.getElementById('rimeguardWarpFlash'),
      btnSentinelToggle: document.getElementById('btnSentinelToggle'),
      sentinelToggleText: document.getElementById('sentinelToggleText'),
      btnOracleCommune: document.getElementById('btnOracleCommune'),
      waysideMonolith: document.getElementById('waysideMonolith'),
      oracleDrawer: document.getElementById('oracleDrawer'),
      oracleRiddleText: document.getElementById('oracleRiddleText'),
      btnCloseOracle: document.getElementById('btnCloseOracle'),
      btnNextRiddle: document.getElementById('btnNextRiddle'),
      defenseBadge: document.getElementById('defenseBadge'),
      defenseGemsRow: document.getElementById('defenseGemsRow'),
      defenseStatusText: document.getElementById('defenseStatusText'),
      btnRimeSfx: document.getElementById('btnRimeSfx'),
      rimeSfxOn: document.getElementById('rimeSfxOn'),
      rimeSfxOff: document.getElementById('rimeSfxOff'),
      avatarBtn: document.getElementById('rimeAvatarBtn'),
      profileDropdown: document.getElementById('rimeProfileDropdown'),
      btnLogout: document.getElementById('btnRimeLogout'),
      bastionModalOverlay: document.getElementById('bastionModalOverlay'),
      bastionCodexCard: document.getElementById('bastionCodexCard'),
      btnCloseModal: document.getElementById('btnCloseModal'),
      crackCanvas: document.getElementById('crackCanvas'),
      modalNumeral: document.getElementById('modalNumeral'),
      modalRole: document.getElementById('modalRole'),
      modalName: document.getElementById('modalName'),
      modalTitle: document.getElementById('modalTitle'),
      modalLore: document.getElementById('modalLore'),
      modalGarrison: document.getElementById('modalGarrison'),
      modalStatus: document.getElementById('modalStatus'),
      terminalPrompt: document.getElementById('terminalPrompt'),
      termCipherInput: document.getElementById('termCipherInput'),
      btnVerifyCipher: document.getElementById('btnVerifyCipher'),
      termFeedback: document.getElementById('termFeedback'),
      btnShatterGate: document.getElementById('btnShatterGate'),
      thawedConfirmedMsg: document.getElementById('thawedConfirmedMsg'),
      flagsSvg: document.getElementById('flagsSvg'),
      proceduralFlagsGroup: document.getElementById('proceduralFlagsGroup')
    };
  }

  // ===========================================================================
  // PROCEDURAL WEB AUDIO SYNTHESIZER
  // ===========================================================================
  initAudio() {
    this.updateSfxUI();
  }

  ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playChime(freq = 660, duration = 0.5, type = 'sine') {
    if (!this.soundEnabled) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  playCrystalSequence() {
    if (!this.soundEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((note, idx) => {
      setTimeout(() => this.playChime(note, 0.7, 'sine'), idx * 90);
    });
  }

  playIceShatter() {
    if (!this.soundEnabled) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;

      // 1. Heavy low ice crack
      const rumble = this.audioCtx.createOscillator();
      const rumbleGain = this.audioCtx.createGain();
      rumble.type = 'sawtooth';
      rumble.frequency.setValueAtTime(140, now);
      rumble.frequency.exponentialRampToValueAtTime(35, now + 0.4);

      rumbleGain.gain.setValueAtTime(0.25, now);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      rumble.connect(rumbleGain);
      rumbleGain.connect(this.audioCtx.destination);
      rumble.start(now);
      rumble.stop(now + 0.45);

      // 2. High-pitch crystal shattering burst
      [1174.66, 1318.51, 1567.98, 2093].forEach((f, i) => {
        setTimeout(() => this.playChime(f, 0.4, 'triangle'), i * 40 + 30);
      });
    } catch (e) {}
  }

  updateSfxUI() {
    if (this.dom.rimeSfxOn && this.dom.rimeSfxOff) {
      if (this.soundEnabled) {
        this.dom.rimeSfxOn.classList.remove('hidden');
        this.dom.rimeSfxOff.classList.add('hidden');
      } else {
        this.dom.rimeSfxOn.classList.add('hidden');
        this.dom.rimeSfxOff.classList.remove('hidden');
      }
    }
  }

  // ===========================================================================
  // 60FPS SNOWDRIFT & INTERACTIVE SNOW-WISP COMPANION CANVAS
  // ===========================================================================
  initSnowdriftCanvas() {
    const canvas = document.getElementById('snowdriftCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    // Fixed Particle Pool (hub-shell guideline: fixed pool size)
    const MAX_SNOW = 110;
    const particles = new Array(MAX_SNOW);
    for (let i = 0; i < MAX_SNOW; i++) {
      particles[i] = {
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2.2 + 0.8,
        speedY: Math.random() * 1.2 + 0.5,
        speedX: Math.random() * 0.8 - 0.4,
        swaySpeed: Math.random() * 0.02 + 0.005,
        swayOffset: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.6 + 0.25
      };
    }

    // Snow-Wisp cursor companion state
    const wisp = {
      x: width * 0.5,
      y: height * 0.5,
      targetX: width * 0.5,
      targetY: height * 0.5,
      vx: 0,
      vy: 0,
      radius: 4,
      pulse: 0
    };

    window.addEventListener('mousemove', (e) => {
      wisp.targetX = e.clientX;
      wisp.targetY = e.clientY;

      const now = performance.now();
      if (now - this.lastGustTime > 1500) {
        this.lastGustTime = now;
        this.windGust = 1.6;
        setTimeout(() => (this.windGust = 1), 1400);
      }
    });

    let time = 0;
    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // 1. Snowflakes
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < MAX_SNOW; i++) {
        const p = particles[i];
        p.y += p.speedY * this.windGust;
        p.x += (Math.sin(time * p.swaySpeed + p.swayOffset) * 0.5 + p.speedX) * this.windGust;

        if (p.y > height) {
          p.y = -5;
          p.x = Math.random() * width;
        }
        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Snow-Wisp Companion
      const dx = wisp.targetX - wisp.x;
      const dy = wisp.targetY - wisp.y;
      wisp.vx += dx * 0.045;
      wisp.vy += dy * 0.045;
      wisp.vx *= 0.82;
      wisp.vy *= 0.82;
      wisp.x += wisp.vx;
      wisp.y += wisp.vy;

      wisp.pulse += 0.06;
      const pulseSize = Math.sin(wisp.pulse) * 1.5;

      // Glow halo
      ctx.save();
      const glowGrad = ctx.createRadialGradient(wisp.x, wisp.y, 1, wisp.x, wisp.y, 22);
      glowGrad.addColorStop(0, 'rgba(125, 211, 252, 0.85)');
      glowGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.35)');
      glowGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(wisp.x, wisp.y, 22, 0, Math.PI * 2);
      ctx.fill();

      // Core crystal
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(wisp.x, wisp.y, Math.max(1, wisp.radius + pulseSize), 0, Math.PI * 2);
      ctx.fill();

      // Snowflake cross flares
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.9)';
      ctx.lineWidth = 1.2;
      const flareLen = 8 + pulseSize;
      ctx.beginPath();
      ctx.moveTo(wisp.x - flareLen, wisp.y);
      ctx.lineTo(wisp.x + flareLen, wisp.y);
      ctx.moveTo(wisp.x, wisp.y - flareLen);
      ctx.lineTo(wisp.x, wisp.y + flareLen);
      ctx.stroke();
      ctx.restore();

      requestAnimationFrame(render);
    };

    render();
  }

  // ===========================================================================
  // REAL-TIME PROCEDURAL CLOTH PHYSICS SVG FLAGS
  // ===========================================================================
  initProceduralFlags() {
    if (!this.dom.proceduralFlagsGroup) return;

    const flags = [
      { id: 'tower_west', x0: 428, y0: 281, w: 24, h: 16, type: 'swallowtail', fill: 'url(#flag-blue-gradient)', speed: 3.4, amp: 3.5, freq: 1.15, phase: 0.2 },
      { id: 'tower_east', x0: 960, y0: 296, w: 26, h: 17, type: 'swallowtail', fill: 'url(#flag-blue-gradient)', speed: 3.2, amp: 3.8, freq: 1.1, phase: 1.9 },
      { id: 'spire_high_left', x0: 593, y0: 144, w: 32, h: 18, type: 'swallowtail', fill: 'url(#flag-royal-gradient)', speed: 4.0, amp: 4.2, freq: 1.25, phase: 0.6 },
      { id: 'spire_high_right', x0: 761, y0: 144, w: 32, h: 18, type: 'swallowtail', fill: 'url(#flag-royal-gradient)', speed: 3.8, amp: 4.0, freq: 1.25, phase: 2.3 },
      { id: 'spire_mid_left', x0: 557, y0: 204, w: 22, h: 14, type: 'pennant', fill: 'url(#flag-blue-gradient)', speed: 3.6, amp: 3.2, freq: 1.2, phase: 3.1 },
      { id: 'spire_mid_right', x0: 819, y0: 204, w: 22, h: 14, type: 'pennant', fill: 'url(#flag-blue-gradient)', speed: 3.5, amp: 3.2, freq: 1.2, phase: 4.4 },
      { id: 'keep_red_left', x0: 632, y0: 260, w: 32, h: 12, type: 'streamer', fill: 'url(#flag-crimson-gradient)', speed: 4.6, amp: 3.4, freq: 1.5, phase: 0.4 },
      { id: 'keep_red_right', x0: 720, y0: 260, w: 30, h: 12, type: 'streamer', fill: 'url(#flag-crimson-gradient)', speed: 4.4, amp: 3.4, freq: 1.5, phase: 2.8 },
      { id: 'road_front_left', x0: 540, y0: 468, w: 34, h: 24, type: 'swallowtail', fill: 'url(#flag-road-gradient)', speed: 2.9, amp: 4.6, freq: 1.0, phase: 1.4 },
      { id: 'road_front_right', x0: 832, y0: 464, w: 46, h: 26, type: 'swallowtail', fill: 'url(#flag-road-gradient)', speed: 3.0, amp: 4.8, freq: 1.05, phase: 2.1 }
    ];

    const pathElements = {};
    flags.forEach((f) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', f.fill);
      path.setAttribute('stroke', '#162534');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('filter', 'drop-shadow(0 2px 4px rgba(4,12,22,0.6))');
      this.dom.proceduralFlagsGroup.appendChild(path);
      pathElements[f.id] = path;
    });

    let time = 0;
    const animateFlags = () => {
      time += 0.025;
      flags.forEach((f) => {
        const el = pathElements[f.id];
        if (!el) return;

        const effectiveAmp = f.amp * this.windGust;
        const steps = 7;
        const topPts = [];
        const botPts = [];

        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const x = f.x0 + u * f.w;
          const wave = Math.sin(u * Math.PI * f.freq + time * f.speed + f.phase) * effectiveAmp * u;
          topPts.push({ x, y: f.y0 + wave });
          botPts.push({ x, y: f.y0 + f.h + wave });
        }

        let d = `M ${topPts[0].x} ${topPts[0].y}`;
        for (let i = 1; i <= steps; i++) {
          d += ` L ${topPts[i].x.toFixed(1)} ${topPts[i].y.toFixed(1)}`;
        }

        if (f.type === 'swallowtail') {
          const midY = (topPts[steps].y + botPts[steps].y) / 2;
          const forkX = topPts[steps].x - f.w * 0.28;
          d += ` L ${forkX.toFixed(1)} ${midY.toFixed(1)}`;
        } else if (f.type === 'pennant') {
          // Pointed tip
          d += ` L ${botPts[steps].x.toFixed(1)} ${((topPts[steps].y + botPts[steps].y) / 2).toFixed(1)}`;
        }

        for (let i = steps; i >= 0; i--) {
          d += ` L ${botPts[i].x.toFixed(1)} ${botPts[i].y.toFixed(1)}`;
        }
        d += ' Z';

        el.setAttribute('d', d);
      });

      requestAnimationFrame(animateFlags);
    };

    animateFlags();
  }

  // ===========================================================================
  // GATE STATE & PERSISTENCE
  // ===========================================================================
  loadGateStates() {
    try {
      const saved = localStorage.getItem('rimeguard_unlocked_gates');
      if (saved) {
        const ids = JSON.parse(saved);
        if (Array.isArray(ids)) {
          this.gates.forEach((g) => {
            if (ids.includes(g.id)) {
              g.status = 'thawed';
              g.statusLabel = 'Gate Thawed';
            }
          });
        }
      }
    } catch (e) {}
  }

  saveGateStates() {
    try {
      const unlockedIds = this.gates.filter((g) => g.status === 'thawed').map((g) => g.id);
      localStorage.setItem('rimeguard_unlocked_gates', JSON.stringify(unlockedIds));
    } catch (e) {}
  }

  updateHUD() {
    const thawedCount = this.gates.filter((g) => g.status === 'thawed').length;
    const totalCount = this.gates.length;

    if (this.dom.defenseStatusText) {
      this.dom.defenseStatusText.textContent = `${thawedCount} / ${totalCount} Gates`;
    }

    if (this.dom.defenseGemsRow) {
      const gems = this.dom.defenseGemsRow.querySelectorAll('.defense-gem-diamond');
      gems.forEach((gem, idx) => {
        if (this.gates[idx] && this.gates[idx].status === 'thawed') {
          gem.classList.add('gem-thawed');
          gem.classList.remove('gem-sealed');
          gem.setAttribute('title', `Gate ${this.gates[idx].numeral}: Thawed`);
        } else {
          gem.classList.remove('gem-thawed');
          gem.classList.add('gem-sealed');
          gem.setAttribute('title', `Gate ${this.gates[idx].numeral}: Sealed`);
        }
      });
    }

    if (this.dom.defenseBadge) {
      if (thawedCount === totalCount) {
        this.dom.defenseBadge.classList.add('defense-awakened');
      } else {
        this.dom.defenseBadge.classList.remove('defense-awakened');
      }
    }
  }

  updateGateZonesDOM() {
    this.gates.forEach((g) => {
      const el = document.getElementById(`zone-${g.id}`);
      if (!el) return;
      if (g.status === 'thawed') {
        el.classList.add('thawed');
        el.classList.remove('sealed');
      } else {
        el.classList.remove('thawed');
        el.classList.add('sealed');
      }

      const tag = document.getElementById(`tag-${g.id}`);
      if (tag) {
        tag.textContent = g.statusLabel;
        if (g.status === 'thawed') {
          tag.className = 'banner-status-tag status-thawed';
        } else {
          tag.className = 'banner-status-tag status-sealed';
        }
      }
    });
  }

  // ===========================================================================
  // MODAL / BASTION DOSSIER INTERACTIONS
  // ===========================================================================
  openGateModal(gateId) {
    const gate = this.gates.find((g) => g.id === gateId);
    if (!gate) return;
    this.activeGate = gate;
    this.playChime(587.33, 0.4);

    if (this.dom.modalNumeral) this.dom.modalNumeral.textContent = gate.numeral;
    if (this.dom.modalRole) this.dom.modalRole.textContent = gate.role;
    if (this.dom.modalName) this.dom.modalName.textContent = gate.name;
    if (this.dom.modalTitle) this.dom.modalTitle.textContent = gate.title;
    if (this.dom.modalLore) this.dom.modalLore.textContent = gate.lore;
    if (this.dom.modalGarrison) this.dom.modalGarrison.textContent = gate.garrison;

    if (this.dom.modalStatus) {
      this.dom.modalStatus.textContent = gate.statusLabel;
      this.dom.modalStatus.className = `stat-value status-${gate.status}`;
    }

    if (this.dom.terminalPrompt) this.dom.terminalPrompt.textContent = gate.hint;
    if (this.dom.termCipherInput) {
      this.dom.termCipherInput.value = '';
    }
    if (this.dom.termFeedback) {
      this.dom.termFeedback.textContent = '';
      this.dom.termFeedback.className = 'term-feedback';
    }

    if (gate.status === 'thawed') {
      if (this.dom.btnShatterGate) this.dom.btnShatterGate.classList.add('hidden');
      if (this.dom.thawedConfirmedMsg) this.dom.thawedConfirmedMsg.classList.remove('hidden');
    } else {
      if (this.dom.btnShatterGate) this.dom.btnShatterGate.classList.remove('hidden');
      if (this.dom.thawedConfirmedMsg) this.dom.thawedConfirmedMsg.classList.add('hidden');
    }

    if (this.dom.bastionModalOverlay) {
      this.dom.bastionModalOverlay.style.display = 'flex';
    }
  }

  closeGateModal() {
    this.playChime(440, 0.2);
    if (this.dom.bastionModalOverlay) {
      this.dom.bastionModalOverlay.style.display = 'none';
    }
    this.activeGate = null;
  }

  // ===========================================================================
  // SHATTER & UNLOCK ANIMATION WITH SPIDER CRACKS
  // ===========================================================================
  shatterActiveGate() {
    if (!this.activeGate || this.activeGate.status === 'thawed') return;

    this.playIceShatter();
    this.drawSpiderCracks();

    if (this.dom.bastionCodexCard) {
      this.dom.bastionCodexCard.classList.add('shatter-active');
    }

    // Celestial flash over the scene
    if (this.dom.warpFlash) {
      this.dom.warpFlash.classList.add('flash-active');
      setTimeout(() => this.dom.warpFlash.classList.remove('flash-active'), 500);
    }

    setTimeout(() => {
      this.activeGate.status = 'thawed';
      this.activeGate.statusLabel = 'Gate Thawed';

      this.saveGateStates();
      this.updateHUD();
      this.updateGateZonesDOM();

      if (this.dom.modalStatus) {
        this.dom.modalStatus.textContent = 'Gate Thawed';
        this.dom.modalStatus.className = 'stat-value status-thawed';
      }

      if (this.dom.btnShatterGate) this.dom.btnShatterGate.classList.add('hidden');
      if (this.dom.thawedConfirmedMsg) this.dom.thawedConfirmedMsg.classList.remove('hidden');
      if (this.dom.termFeedback) {
        this.dom.termFeedback.textContent = '✦ Permafrost seal shattered! Citadel defense grid updated.';
        this.dom.termFeedback.className = 'term-feedback success';
      }

      setTimeout(() => {
        if (this.dom.bastionCodexCard) {
          this.dom.bastionCodexCard.classList.remove('shatter-active');
        }
      }, 750);
    }, 450);
  }

  drawSpiderCracks() {
    const canvas = this.dom.crackCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth || 600;
    canvas.height = canvas.offsetHeight || 480;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.95)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;

    // Radiating crack arms
    const ARMS = 9;
    for (let a = 0; a < ARMS; a++) {
      let angle = (a / ARMS) * Math.PI * 2 + (Math.random() * 0.3 - 0.15);
      let currX = centerX;
      let currY = centerY;
      ctx.beginPath();
      ctx.moveTo(currX, currY);

      const segments = 6 + Math.floor(Math.random() * 4);
      for (let s = 0; s < segments; s++) {
        const len = 15 + Math.random() * 25;
        angle += (Math.random() - 0.5) * 0.5;
        currX += Math.cos(angle) * len;
        currY += Math.sin(angle) * len;
        ctx.lineTo(currX, currY);

        // Branching fork
        if (Math.random() > 0.6) {
          const branchAngle = angle + (Math.random() > 0.5 ? 0.6 : -0.6);
          const bx = currX + Math.cos(branchAngle) * 20;
          const by = currY + Math.sin(branchAngle) * 20;
          ctx.moveTo(currX, currY);
          ctx.lineTo(bx, by);
          ctx.moveTo(currX, currY);
        }
      }
      ctx.stroke();
    }

    // Fade cracks after shatter
    setTimeout(() => {
      let alpha = 1;
      const fadeInterval = setInterval(() => {
        alpha -= 0.1;
        if (alpha <= 0) {
          clearInterval(fadeInterval);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
          canvas.style.opacity = String(alpha);
        }
      }, 40);
    }, 600);
  }

  // ===========================================================================
  // ORACLE NPC DIALOGUE SYSTEM
  // ===========================================================================
  toggleOracleDrawer() {
    if (!this.dom.oracleDrawer) return;
    const isClosed = this.dom.oracleDrawer.style.display === 'none';
    if (isClosed) {
      this.playChime(784, 0.6);
      this.dom.oracleDrawer.style.display = 'block';
    } else {
      this.playChime(440, 0.2);
      this.dom.oracleDrawer.style.display = 'none';
    }
  }

  nextOracleRiddle() {
    this.oracleIndex = (this.oracleIndex + 1) % ORACLE_RIDDLES.length;
    this.playChime(659.25, 0.5);
    if (this.dom.oracleRiddleText) {
      this.dom.oracleRiddleText.style.opacity = '0';
      this.dom.oracleRiddleText.style.transform = 'translateY(6px)';
      setTimeout(() => {
        this.dom.oracleRiddleText.textContent = `"${ORACLE_RIDDLES[this.oracleIndex]}"`;
        this.dom.oracleRiddleText.style.transition = 'all 0.3s ease';
        this.dom.oracleRiddleText.style.opacity = '1';
        this.dom.oracleRiddleText.style.transform = 'translateY(0)';
      }, 150);
    }
  }

  // ===========================================================================
  // BIND ALL USER INTERACTIONS
  // ===========================================================================
  bindEvents() {
    // 1. Hotspot clicks
    this.gates.forEach((g) => {
      const zone = document.getElementById(`zone-${g.id}`);
      if (zone) {
        zone.addEventListener('click', () => this.openGateModal(g.id));
        zone.addEventListener('mouseenter', () => this.playChime(523.25, 0.15));
      }
    });

    // 2. Wayside monolith & Header Oracle button
    if (this.dom.waysideMonolith) {
      this.dom.waysideMonolith.addEventListener('click', () => this.toggleOracleDrawer());
      this.dom.waysideMonolith.addEventListener('mouseenter', () => this.playChime(659, 0.15));
    }
    if (this.dom.btnOracleCommune) {
      this.dom.btnOracleCommune.addEventListener('click', () => this.toggleOracleDrawer());
    }
    if (this.dom.btnCloseOracle) {
      this.dom.btnCloseOracle.addEventListener('click', () => this.toggleOracleDrawer());
    }
    if (this.dom.btnNextRiddle) {
      this.dom.btnNextRiddle.addEventListener('click', () => this.nextOracleRiddle());
    }

    // 3. Sentinel Visibility Toggle
    if (this.dom.btnSentinelToggle) {
      this.dom.btnSentinelToggle.addEventListener('click', () => {
        this.sentinelsVisible = !this.sentinelsVisible;
        this.playChime(493.88, 0.2);
        if (this.sentinelsVisible) {
          document.body.classList.remove('sentinels-hidden');
          if (this.dom.sentinelToggleText) this.dom.sentinelToggleText.textContent = 'SENTINELS VISIBLE';
          this.dom.btnSentinelToggle.classList.remove('active');
        } else {
          document.body.classList.add('sentinels-hidden');
          if (this.dom.sentinelToggleText) this.dom.sentinelToggleText.textContent = 'SENTINELS HIDDEN';
          this.dom.btnSentinelToggle.classList.add('active');
        }
      });
    }

    // 4. Codex Modal actions
    if (this.dom.btnCloseModal) {
      this.dom.btnCloseModal.addEventListener('click', () => this.closeGateModal());
    }
    if (this.dom.bastionModalOverlay) {
      this.dom.bastionModalOverlay.addEventListener('click', (e) => {
        if (e.target === this.dom.bastionModalOverlay) this.closeGateModal();
      });
    }
    if (this.dom.btnShatterGate) {
      this.dom.btnShatterGate.addEventListener('click', () => this.shatterActiveGate());
    }

    // 5. Flag cipher verification
    const handleVerify = () => {
      if (!this.activeGate) return;
      const input = (this.dom.termCipherInput.value || '').trim();
      if (!input) return;

      if (input.toLowerCase() === this.activeGate.flag.toLowerCase() || input === 'shatter') {
        this.shatterActiveGate();
      } else {
        this.playChime(220, 0.25, 'sawtooth');
        if (this.dom.termFeedback) {
          this.dom.termFeedback.textContent = '✗ Permafrost resistance: Incorrect cipher flag. Re-verify runes.';
          this.dom.termFeedback.className = 'term-feedback error';
        }
      }
    };

    if (this.dom.btnVerifyCipher) {
      this.dom.btnVerifyCipher.addEventListener('click', handleVerify);
    }
    if (this.dom.termCipherInput) {
      this.dom.termCipherInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleVerify();
      });
    }

    // 6. Sound Toggle
    if (this.dom.btnRimeSfx) {
      this.dom.btnRimeSfx.addEventListener('click', () => {
        this.soundEnabled = !this.soundEnabled;
        try {
          localStorage.setItem('sanctumSfxEnabled', String(this.soundEnabled));
        } catch (e) {}
        this.updateSfxUI();
        if (this.soundEnabled) this.playChime(880, 0.3);
      });
    }

    // 7. Profile Dropdown & Logout
    if (this.dom.avatarBtn && this.dom.profileDropdown) {
      this.dom.avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playChime(660, 0.15);
        this.dom.profileDropdown.classList.toggle('open');
      });

      document.addEventListener('click', (e) => {
        if (!this.dom.profileDropdown.contains(e.target) && !this.dom.avatarBtn.contains(e.target)) {
          this.dom.profileDropdown.classList.remove('open');
        }
      });
    }

    if (this.dom.btnLogout) {
      this.dom.btnLogout.addEventListener('click', () => {
        this.playChime(330, 0.3);
        try {
          sessionStorage.removeItem('sanctumAuth');
        } catch (e) {}
        if (this.dom.warpFlash) this.dom.warpFlash.classList.add('flash-active');
        setTimeout(() => window.location.replace('index.html#login'), 350);
      });
    }

    // Keyboard ESC to close dialogs
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.dom.bastionModalOverlay && this.dom.bastionModalOverlay.style.display !== 'none') {
          this.closeGateModal();
        } else if (this.dom.oracleDrawer && this.dom.oracleDrawer.style.display !== 'none') {
          this.toggleOracleDrawer();
        } else if (this.dom.profileDropdown && this.dom.profileDropdown.classList.contains('open')) {
          this.dom.profileDropdown.classList.remove('open');
        }
      }
    });
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.rimeguardApp = new RimeguardApp();
});
