/**
 * HOUSE RIMEGUARD — FROZEN FORTRESS SCRIPT
 * 100% Shared Architecture, State Engine, and Interaction Model with Introduction Module
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. WEB AUDIO SYNTHESIZER (Matching Intro Module Audio Design)
  // =========================================================================
  let audioCtx = null;
  let isMuted = localStorage.getItem('rimeguardMute') === 'true';

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playKeyClick() {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  }

  function playFrostChime(freq = 880, duration = 0.35) {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function playLockBuzz() {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }

  function playFlagSuccess() {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [587.33, 739.99, 880.0, 1174.66, 1480.0].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.08);
        gain.gain.setValueAtTime(0.09, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.45);
      });
    } catch (e) {}
  }

  // Audio Toggle Button
  const audioBtn = document.getElementById('audioToggleBtn');
  const audioIcon = document.getElementById('audioIcon');
  if (audioBtn) {
    if (isMuted && audioIcon) audioIcon.textContent = '🔇';
    audioBtn.addEventListener('click', () => {
      isMuted = !isMuted;
      localStorage.setItem('rimeguardMute', isMuted);
      if (audioIcon) audioIcon.textContent = isMuted ? '🔇' : '🔊';
      if (!isMuted) playFrostChime(900, 0.1);
    });
  }

  // =========================================================================
  // 2. CANVAS PARTICLES: SNOWDRIFTS & CURSOR SNOW-WISPS
  // =========================================================================
  const canvas = document.getElementById('snowCanvas');
  let ctx = canvas ? canvas.getContext('2d') : null;
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const snowflakes = [];
  const wisps = [];
  const mouse = { x: width / 2, y: height / 3 };

  class Snowflake {
    constructor() { this.reset(true); }
    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : -10;
      this.radius = Math.random() * 1.8 + 0.7;
      this.speedY = Math.random() * 0.8 + 0.35;
      this.speedX = Math.random() * 0.5 - 0.25;
      this.opacity = Math.random() * 0.55 + 0.25;
      this.sway = Math.random() * 0.02;
    }
    update() {
      this.y += this.speedY;
      this.x += Math.sin(this.y * this.sway) * 0.5 + this.speedX;
      if (this.y > height + 10 || this.x < -20 || this.x > width + 20) this.reset();
    }
    draw() {
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(242, 251, 255, ${this.opacity})`;
      ctx.fill();
    }
  }

  class SnowWisp {
    constructor(idx) {
      this.idx = idx;
      this.x = mouse.x + (Math.random() - 0.5) * 50;
      this.y = mouse.y + (Math.random() - 0.5) * 50;
      this.vx = 0;
      this.vy = 0;
      this.radius = Math.random() * 2 + 1.8;
      this.angle = (Math.PI * 2 * idx) / 6;
      this.orbit = 30 + idx * 7;
      this.pulse = Math.random() * Math.PI;
    }
    update() {
      this.angle += 0.025;
      this.pulse += 0.04;
      const tx = mouse.x + Math.cos(this.angle) * this.orbit;
      const ty = mouse.y + Math.sin(this.angle) * (this.orbit * 0.6);
      this.vx += (tx - this.x) * 0.06;
      this.vy += (ty - this.y) * 0.06;
      this.vx *= 0.82;
      this.vy *= 0.82;
      this.x += this.vx;
      this.y += this.vy;
    }
    draw() {
      if (!ctx) return;
      const r = this.radius + Math.sin(this.pulse) * 0.6;
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 4);
      g.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      g.addColorStop(0.3, 'rgba(111, 214, 255, 0.55)');
      g.addColorStop(1, 'rgba(111, 214, 255, 0)');
      ctx.beginPath();
      ctx.arc(this.x, this.y, r * 4, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }
  }

  for (let i = 0; i < 65; i++) snowflakes.push(new Snowflake());
  for (let i = 0; i < 6; i++) wisps.push(new SnowWisp(i));

  window.addEventListener('resize', () => {
    if (!canvas) return;
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function renderScene() {
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      snowflakes.forEach((s) => { s.update(); s.draw(); });
      wisps.forEach((w) => { w.update(); w.draw(); });
    }
    requestAnimationFrame(renderScene);
  }
  requestAnimationFrame(renderScene);

  // =========================================================================
  // 3. SENTINEL PATROL TOGGLE
  // =========================================================================
  const sentinelBtn = document.getElementById('sentinelToggleBtn');
  const sentinelText = document.getElementById('sentinelToggleText');
  let sentinelsPatrolling = true;

  if (sentinelBtn) {
    sentinelBtn.addEventListener('click', () => {
      sentinelsPatrolling = !sentinelsPatrolling;
      if (sentinelsPatrolling) {
        document.body.classList.remove('sentinels-hidden');
        sentinelBtn.classList.add('active');
        if (sentinelText) sentinelText.textContent = 'SENTINELS PATROLLING';
        playFrostChime(750, 0.1);
      } else {
        document.body.classList.add('sentinels-hidden');
        sentinelBtn.classList.remove('active');
        if (sentinelText) sentinelText.textContent = 'SENTINELS HIDDEN';
        playFrostChime(550, 0.1);
      }
    });
  }

  // =========================================================================
  // 4. PROGRESSION & GATE UNLOCK ENGINE (Intro Module Compatibility)
  // =========================================================================
  const RIME_COMPLETED_KEY = 'rimeguard_completed_gates';

  function getCompletedGates() {
    try {
      const data = localStorage.getItem(RIME_COMPLETED_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function markGateCompleted(gateNum) {
    try {
      const completed = getCompletedGates();
      if (!completed.includes(gateNum)) {
        completed.push(gateNum);
        localStorage.setItem(RIME_COMPLETED_KEY, JSON.stringify(completed));
      }
    } catch (e) {}
    updateGatesUI();
  }

  window.resetRimeguardProgress = function () {
    try {
      localStorage.removeItem(RIME_COMPLETED_KEY);
    } catch (e) {}
    // Reset room victory banners
    for (let i = 1; i <= 5; i++) {
      const banner = document.getElementById(`flagSuccessBanner-${i}`);
      if (banner) banner.classList.remove('show');
      const submitCard = document.getElementById(`flagSubmitCard-${i}`);
      if (submitCard) submitCard.style.display = 'flex';
      const feedback = document.getElementById(`flagFeedback-${i}`);
      if (feedback) feedback.textContent = '';
    }
    updateGatesUI();
    playFrostChime(450, 0.12);
  };

  function isGateUnlocked(gateNum, completed) {
    if (!completed) completed = getCompletedGates();
    if (gateNum === 1) return true;
    return completed.includes(gateNum - 1);
  }

  // Handle Clicking on Castle Towers (Primary Buttons)
  window.handleTowerClick = function (gateNum) {
    const completed = getCompletedGates();
    const btn = document.getElementById(`tower-btn-${gateNum}`);

    if (isGateUnlocked(gateNum, completed)) {
      playFrostChime(720 + gateNum * 60, 0.08);
      goScreen('room-gate' + gateNum);
    } else {
      playLockBuzz();
      if (btn) {
        btn.classList.add('shake-locked');
        setTimeout(() => btn.classList.remove('shake-locked'), 520);
      }
    }
  };

  function updateGatesUI() {
    const completed = getCompletedGates();
    const count = completed.length;
    const totalGates = 5;

    // Topbar Counter & Diamond Pips
    const gateProgText = document.getElementById('gateProgressText');
    if (gateProgText) gateProgText.textContent = `${count} / ${totalGates} GATES`;

    for (let i = 1; i <= 5; i++) {
      const dia = document.getElementById(`dia-${i}`);
      if (dia) {
        if (i <= count) {
          dia.textContent = '◆';
          dia.classList.add('active');
        } else {
          dia.textContent = '◇';
          dia.classList.remove('active');
        }
      }
    }

    // Update 5 Castle Tower Buttons
    for (let i = 1; i <= 5; i++) {
      const isDone = completed.includes(i);
      const unlocked = isGateUnlocked(i, completed);
      const btn = document.getElementById(`tower-btn-${i}`);
      const statusBadge = document.getElementById(`hud-status-${i}`);

      if (btn) {
        if (isDone) {
          btn.classList.remove('locked');
          btn.classList.add('completed');
          if (statusBadge) {
            statusBadge.className = 'hud-status-badge cleared';
            statusBadge.textContent = '✔ THAWED (CLEARED)';
          }
        } else if (unlocked) {
          btn.classList.remove('locked', 'completed');
          if (statusBadge) {
            statusBadge.className = 'hud-status-badge unlocked';
            statusBadge.textContent = '● READY TO BREACH';
          }
        } else {
          btn.classList.add('locked');
          btn.classList.remove('completed');
          if (statusBadge) {
            statusBadge.className = 'hud-status-badge frozen';
            statusBadge.textContent = `❄ FROZEN (REQUIRES GATE 0${i - 1})`;
          }
        }
      }
    }

    // If all 5 gates are completed, celebrate!
    if (count === totalGates && !sessionStorage.getItem('rimeMasterCelebrated')) {
      sessionStorage.setItem('rimeMasterCelebrated', 'true');
      setTimeout(showMasterVictoryModal, 600);
    }
  }

  // =========================================================================
  // 5. SCREEN ROUTING (Identical to Introduction Module)
  // =========================================================================
  window.goScreen = function (id) {
    playFrostChime(700, 0.04);
    document.querySelectorAll('.screen-view').forEach((s) => s.classList.remove('active'));
    const target = document.getElementById('screen-' + id);
    if (target) target.classList.add('active');

    const crumbEl = document.getElementById('navCrumbScene');
    if (crumbEl) {
      if (id === 'dashboard') crumbEl.textContent = 'Permafrost Causeway';
      else if (id === 'room-gate1') crumbEl.textContent = 'Gate I: The Glacial Gatekeeper';
      else if (id === 'room-gate2') crumbEl.textContent = 'Gate II: The Frost-Bound Cipher';
      else if (id === 'room-gate3') crumbEl.textContent = 'Gate III: The Sub-Zero Buffer';
      else if (id === 'room-gate4') crumbEl.textContent = 'Gate IV: The Aurora Ledger';
      else if (id === 'room-gate5') crumbEl.textContent = 'Gate V: The Permafrost Sanctum';
    }

    updateGatesUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.advanceNextGate = function (currentGate) {
    playFrostChime(880, 0.06);
    if (currentGate < 5) {
      goScreen('room-gate' + (currentGate + 1));
    } else {
      showMasterVictoryModal();
    }
  };

  // =========================================================================
  // 6. INTERACTIVE GATE CHAMBER TERMINALS & FLAG VALIDATORS
  // =========================================================================
  const GATE_FLAGS = {
    1: 'RIME{fr0st_p0rt_d3ic3d_8443}',
    2: 'RIME{x0r_subz3r0_d3crypt3d}',
    3: 'RIME{st4ck_c4n4ry_unbr0k3n_v5}',
    4: 'RIME{aur0ra_ch41n_c0ns3nsus_v4}',
    5: 'RIME{4p3x_s4nctum_c0r3_m4st3r}',
  };

  // Gate 1 state
  let gate1PortDeiced = false;

  // Append lines to interactive terminal
  function termOutput(gateNum, lineText, type = '') {
    const termBody = document.getElementById(`termOutput-${gateNum}`);
    if (!termBody) return;
    const div = document.createElement('div');
    div.className = 'term-line ' + type;
    div.textContent = lineText;
    termBody.appendChild(div);
    termBody.scrollTop = termBody.scrollHeight;
  }

  window.clearTerm = function (gateNum) {
    const termBody = document.getElementById(`termOutput-${gateNum}`);
    if (termBody) termBody.innerHTML = '';
  };

  window.toggleHint = function (gateNum) {
    const drawer = document.getElementById(`hintDrawer-${gateNum}`);
    if (drawer) {
      drawer.classList.toggle('open');
      playKeyClick();
    }
  };

  // Handle Terminal Execution
  window.handleTermSubmit = function (e, gateNum) {
    e.preventDefault();
    const input = document.getElementById(`termInput-${gateNum}`);
    if (!input) return;
    const cmd = input.value.trim();
    if (!cmd) return;
    input.value = '';
    playKeyClick();

    termOutput(gateNum, `$ ${cmd}`, 'echo');
    processCommand(gateNum, cmd.toLowerCase());
  };

  function processCommand(gateNum, cmd) {
    switch (gateNum) {
      case 1:
        if (cmd === 'help') {
          termOutput(1, 'Available commands: scan, deice <port>, auth, clear', 'system');
        } else if (cmd === 'scan' || cmd.startsWith('nmap')) {
          termOutput(1, 'Starting Nmap 7.94 probe on 10.14.0.2...', 'system');
          setTimeout(() => {
            termOutput(1, 'PORT     STATE      SERVICE', 'system');
            termOutput(1, '22/tcp   OPEN       ssh', 'system');
            termOutput(1, '80/tcp   CLOSED     http', 'system');
            termOutput(1, `8443/tcp ${gate1PortDeiced ? 'OPEN' : 'FROZEN'}     rimeguard-auth-daemon`, gate1PortDeiced ? 'success' : 'error');
            if (!gate1PortDeiced) {
              termOutput(1, '[!] Port 8443 is crystallized in permafrost. Run "deice 8443" to thaw.', 'error');
            }
          }, 300);
        } else if (cmd === 'deice 8443' || cmd === 'deice') {
          gate1PortDeiced = true;
          const statusEl = document.getElementById('stageStatus-1');
          if (statusEl) statusEl.textContent = 'DAEMON THAWED';
          termOutput(1, '[+] Transmitting concentrated thermal probe to 10.14.0.2:8443...', 'system');
          setTimeout(() => {
            termOutput(1, '[+] Frost crystals shattered! Daemon port 8443 state: OPEN.', 'success');
            termOutput(1, '[+] Run "auth" to initiate handshake.', 'system');
            playFrostChime(950, 0.1);
          }, 400);
        } else if (cmd === 'auth') {
          if (gate1PortDeiced) {
            termOutput(1, '[+] Handshake verified with rimeguard-auth-daemon.', 'success');
            termOutput(1, `[+] Gate Key: ${GATE_FLAGS[1]}`, 'success');
            autoFillFlag(1, GATE_FLAGS[1]);
          } else {
            termOutput(1, '[-] Connection refused. Port 8443 is still FROZEN. Run "deice 8443" first.', 'error');
          }
        } else {
          termOutput(1, `bash: command not found: ${cmd}. Type 'help' for guidance.`, 'error');
        }
        break;

      case 2:
        if (cmd === 'help') {
          termOutput(2, 'Available commands: inspect, xor <hex_key>, clear', 'system');
        } else if (cmd === 'inspect') {
          termOutput(2, '[+] Frozen Telemetry Stream (Hex):', 'system');
          termOutput(2, '0x08 0x13 0x17 0x1F 0x21 0x3C 0x68 0x36 0x3A 0x29 0x2F 0x68 0x3E 0x36 0x38 0x28 0x23 0x2A 0x2E 0x3F 0x3E 0x3E 0x3E 0x27', 'system');
          termOutput(2, '[+] Sub-zero mask detected: Single-byte key is 0x5A.', 'system');
        } else if (cmd === 'xor 0x5a' || cmd === 'xor') {
          termOutput(2, '[+] Performing bitwise XOR inversion with key 0x5A...', 'system');
          setTimeout(() => {
            termOutput(2, '[+] Decrypted Plaintext Stream:', 'success');
            termOutput(2, `[+] Gate Key: ${GATE_FLAGS[2]}`, 'success');
            autoFillFlag(2, GATE_FLAGS[2]);
            playFrostChime(950, 0.1);
          }, 350);
        } else {
          termOutput(2, `cipher-engine: unknown command: ${cmd}. Try 'inspect' or 'xor 0x5A'.`, 'error');
        }
        break;

      case 3:
        if (cmd === 'help') {
          termOutput(3, 'Available commands: checksec, canary, overflow <bytes>, clear', 'system');
        } else if (cmd === 'checksec') {
          termOutput(3, '[*] \'/opt/rimeguard/hydraulics_srv\'', 'system');
          termOutput(3, '    Arch:     x86_64-little', 'system');
          termOutput(3, '    Stack:    Canary found (Address: 0x7fffffffe348)', 'success');
          termOutput(3, '    NX:       NX enabled', 'system');
          termOutput(3, '    PIE:      PIE enabled', 'system');
        } else if (cmd === 'canary') {
          termOutput(3, '[+] Reading canary word from fs:[0x28]...', 'system');
          termOutput(3, '[+] Active stack guard value: 0xDEADF00D', 'success');
        } else if (cmd.startsWith('overflow')) {
          termOutput(3, '[+] Sending calibrated payload with intact canary 0xDEADF00D...', 'system');
          setTimeout(() => {
            termOutput(3, '[+] Canary preserved! Memory overflow redirected to privileged handler.', 'success');
            termOutput(3, `[+] Gate Key: ${GATE_FLAGS[3]}`, 'success');
            autoFillFlag(3, GATE_FLAGS[3]);
            playFrostChime(950, 0.1);
          }, 350);
        } else {
          termOutput(3, `gdb: undefined command: "${cmd}". Try 'checksec', 'canary', or 'overflow 64'.`, 'error');
        }
        break;

      case 4:
        if (cmd === 'help') {
          termOutput(4, 'Available commands: blocks, audit <id>, seal, clear', 'system');
        } else if (cmd === 'blocks') {
          termOutput(4, '=== Aurora Ledger Hash Chain ===', 'system');
          termOutput(4, 'Block #0: Hash: 7a8f10 | Prev: 000000 [OK]', 'system');
          termOutput(4, 'Block #1: Hash: 3e2b91 | Prev: 7a8f10 [OK]', 'system');
          termOutput(4, 'Block #2: Hash: 8c1d55 | Prev: 3e2b91 [OK]', 'system');
          termOutput(4, 'Block #3: Hash: BADF00 | Prev: 8c1d55 [CORRUPTED: Altered Transaction]', 'error');
          termOutput(4, 'Block #4: Hash: 000000 | Prev: BADF00 [BROKEN CONSENSUS]', 'error');
        } else if (cmd === 'audit 3' || cmd === 'audit') {
          termOutput(4, '[+] Auditing Block #3 discrepancy...', 'system');
          termOutput(4, '[-] Detected altered state: Gate access ledger signature tampered at offset 0x3C.', 'error');
          termOutput(4, '[+] Run "seal" to re-calculate cryptographic SHA-256 Merkle root.', 'system');
        } else if (cmd === 'seal') {
          termOutput(4, '[+] Recalculating SHA-256 Merkle root and re-linking chain...', 'system');
          setTimeout(() => {
            termOutput(4, '[+] Consensus restored across all 5 fortress bastions!', 'success');
            termOutput(4, `[+] Gate Key: ${GATE_FLAGS[4]}`, 'success');
            autoFillFlag(4, GATE_FLAGS[4]);
            playFrostChime(950, 0.1);
          }, 400);
        } else {
          termOutput(4, `ledger-node: command not recognized: ${cmd}. Try 'blocks', 'audit 3', or 'seal'.`, 'error');
        }
        break;

      case 5:
        if (cmd === 'help') {
          termOutput(5, 'Available commands: status, affirm, unlock, clear', 'system');
        } else if (cmd === 'status') {
          termOutput(5, '=== Apex Core Status ===', 'system');
          termOutput(5, 'Perimeter Bastions: 4 of 4 Verified', 'success');
          termOutput(5, 'Ice-Core Landmark: Resonant', 'system');
          termOutput(5, 'Core Seal State: AWAITING SENTINEL OATH', 'system');
          termOutput(5, 'Type "affirm" to speak the House Rimeguard oath.', 'system');
        } else if (cmd === 'affirm') {
          termOutput(5, '[+] Speaking Oath: "In the deep frost, only verified logic survives."', 'system');
          setTimeout(() => {
            termOutput(5, '[+] Rotating Ice-Core harmonics confirmed! Core seal primed.', 'success');
            termOutput(5, '[+] Run "unlock" to synchronize with master core.', 'system');
            playFrostChime(900, 0.1);
          }, 350);
        } else if (cmd === 'unlock') {
          termOutput(5, '[+] Synchronizing master ice-core archive with terminal...', 'system');
          setTimeout(() => {
            termOutput(5, '[+] Citadel Vault Unlocked! Grand Sentinel Rank Conferred.', 'success');
            termOutput(5, `[+] Master Apex Key: ${GATE_FLAGS[5]}`, 'success');
            autoFillFlag(5, GATE_FLAGS[5]);
            playFrostChime(1100, 0.2);
          }, 400);
        } else {
          termOutput(5, `apex-core: unknown directive: ${cmd}. Try 'status', 'affirm', or 'unlock'.`, 'error');
        }
        break;
    }
  }

  function autoFillFlag(gateNum, flagValue) {
    const input = document.getElementById(`flagInput-${gateNum}`);
    if (input && !input.value) {
      input.value = flagValue;
      const feedback = document.getElementById(`flagFeedback-${gateNum}`);
      if (feedback) {
        feedback.className = 'flag-validation-feedback success';
        feedback.textContent = 'Flag auto-populated. Click "Submit Gate Key" to clear gate.';
      }
    }
  }

  window.verifyFlag = function (gateNum) {
    const input = document.getElementById(`flagInput-${gateNum}`);
    const feedback = document.getElementById(`flagFeedback-${gateNum}`);
    const banner = document.getElementById(`flagSuccessBanner-${gateNum}`);
    const submitCard = document.getElementById(`flagSubmitCard-${gateNum}`);

    if (!input || !feedback) return;
    const userVal = input.value.trim();

    if (userVal === GATE_FLAGS[gateNum]) {
      feedback.className = 'flag-validation-feedback success';
      feedback.textContent = '✦ Gate Key Verified! Defense perimeter updated.';
      playFlagSuccess();
      markGateCompleted(gateNum);
      if (submitCard) submitCard.style.display = 'none';
      if (banner) banner.classList.add('show');
    } else {
      playLockBuzz();
      feedback.className = 'flag-validation-feedback error';
      feedback.textContent = '❄ Invalid Gate Key. Re-check the diagnostic terminal output.';
    }
  };

  // =========================================================================
  // 7. ORACLE MODAL DIALOGUE
  // =========================================================================
  const oracleModal = document.getElementById('oracleModal');
  const oracleToggle = document.getElementById('oracleToggleBtn');
  const oracleQuote = document.getElementById('oracleQuoteText');

  if (oracleToggle && oracleModal) {
    oracleToggle.addEventListener('click', () => {
      oracleModal.classList.add('show');
      playFrostChime(800, 0.1);
    });
  }

  window.closeOracleModal = function () {
    if (oracleModal) oracleModal.classList.remove('show');
    playKeyClick();
  };

  window.askOracle = function (id) {
    playKeyClick();
    if (!oracleQuote) return;
    if (id === 1) {
      oracleQuote.textContent = '"The bastions are frozen in sub-zero states so that no warm packet may enter undetected. Only by probing them methodically will you locate the open ports."';
    } else if (id === 2) {
      oracleQuote.textContent = '"The crystal hovering above the keep rotates with the heartbeat of the glacier. It records every intrusion attempt and preserves the cryptographic memory of the realm."';
    } else if (id === 3) {
      oracleQuote.textContent = '"The frozen waterfall conceals the ancient cryptographic ledger. Its waters ceased falling centuries ago when the first block was sealed into the stone."';
    }
  };

  // =========================================================================
  // 8. MASTER CITADEL VICTORY CELEBRATION MODAL
  // =========================================================================
  const masterModal = document.getElementById('citadelMasterModal');

  window.showMasterVictoryModal = function () {
    if (masterModal) masterModal.classList.add('show');
    playFlagSuccess();
  };

  window.closeMasterVictoryModal = function () {
    if (masterModal) masterModal.classList.remove('show');
    goScreen('dashboard');
  };

  // =========================================================================
  // 9. INITIALIZATION
  // =========================================================================
  updateGatesUI();

})();
