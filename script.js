/* ============================================
   JDKCraft — script.js
   ============================================ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {

  /* ── 3D Tilt Effect for Tiles ── */
  const tiles = document.querySelectorAll('.tile');
  const MAX_TILT = 4; // degrees

  tiles.forEach((tile) => {
    let rect = null;
    let pending = null;

    tile.addEventListener('mouseenter', () => {
      rect = tile.getBoundingClientRect();
      tile.classList.remove('tile-resetting');
    });

    tile.addEventListener('mousemove', (e) => {
      if (!rect) rect = tile.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = null;
        const px = (x / rect.width) - 0.5;
        const py = (y / rect.height) - 0.5;
        const rotateY = (px * MAX_TILT * 2).toFixed(2);
        const rotateX = (py * -MAX_TILT * 2).toFixed(2);
        tile.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
      });
    });

    tile.addEventListener('mouseleave', () => {
      rect = null;
      tile.classList.add('tile-resetting');
      tile.style.transform = '';
    });
  });

  /* ── Theme Toggle (Dark / Light) ── */
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');

  if (toggle) {
    toggle.addEventListener('click', () => {
      const isLight = root.getAttribute('data-theme') === 'light';
      if (isLight) {
        root.removeAttribute('data-theme');
        localStorage.setItem('jdkcraft-theme', 'dark');
      } else {
        root.setAttribute('data-theme', 'light');
        localStorage.setItem('jdkcraft-theme', 'light');
      }
    });
  }

  /* ── Copy IP Button ── */
  const copyBtn = document.getElementById('copyIpBtn');
  const ipHint = document.getElementById('ipHint');

  if (copyBtn && ipHint) {
    let resetTimer = null;

    copyBtn.addEventListener('click', async () => {
      const serverIP = 'mc.jdkcube.net';

      try {
        await navigator.clipboard.writeText(serverIP);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = serverIP;
        ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      copyBtn.classList.add('copied');
      ipHint.textContent = 'Copied to clipboard!';

      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        copyBtn.classList.remove('copied');
        ipHint.textContent = 'Click to copy IP';
      }, 2000);
    });
  }

  /* ── Minecraft Skin Viewer (Embedded directly in the tile) ── */
  const MC_USERNAME = 'JDKCube';
  const canvas = document.getElementById('mcSkinCanvas');
  const loading = document.getElementById('mcSkinLoading');

  if (canvas && typeof skinview3d !== 'undefined') {
    const wrap = canvas.parentElement;
    const size = wrap ? Math.min(wrap.clientWidth, wrap.clientHeight || wrap.clientWidth) : 240;

    try {
      const viewer = new skinview3d.SkinViewer({
        canvas: canvas,
        width: size,
        height: size,
        skin: `https://mc-heads.net/skin/${MC_USERNAME}`
      });

      viewer.autoRotate = true;
      viewer.autoRotateSpeed = 0.8;
      viewer.controls.enableZoom = true;
      viewer.zoom = 0.85;

      if (skinview3d.WalkingAnimation) {
        viewer.animation = new skinview3d.WalkingAnimation();
        viewer.animation.speed = 0.6;
      }

      viewer.loadSkin(`https://mc-heads.net/skin/${MC_USERNAME}`)
        .then(() => { if (loading) loading.style.display = 'none'; })
        .catch(() => { if (loading) loading.textContent = 'Failed to load skin'; });

      // Resize observer to keep canvas crisp
      window.addEventListener('resize', () => {
        const currentSize = wrap ? Math.min(wrap.clientWidth, wrap.clientHeight || wrap.clientWidth) : 240;
        viewer.setSize(currentSize, currentSize);
      });

    } catch (err) {
      console.error('Skin viewer init failed:', err);
      if (loading) loading.textContent = 'Error loading 3D viewer';
    }
  } else if (loading) {
    loading.textContent = 'Library not loaded';
  }

  /* ── Live Server Status (mcsrvstat.us) ── */
  const SERVER_ADDRESS = '185.206.148.161:25592';

  const statusDot   = document.getElementById('infoStatusDot');
  const statusText  = document.getElementById('infoStatus');
  const versionText = document.getElementById('infoVersion');
  const playersText = document.getElementById('infoPlayers');
  const motdText    = document.getElementById('infoMotd');

  function stripFormatting(str) {
    return (str || '').replace(/§./g, '').trim();
  }

  function showOffline() {
    if (statusDot) {
      statusDot.classList.remove('online');
      statusDot.classList.add('offline');
    }
    if (statusText) statusText.textContent = 'Offline';
    if (versionText) versionText.textContent = '—';
    if (playersText) playersText.textContent = '—';
    if (motdText) motdText.textContent = '';
  }

  async function loadServerStatus() {
    try {
      const res = await fetch(`https://api.mcsrvstat.us/3/${SERVER_ADDRESS}`);
      if (!res.ok) throw new Error('bad response');
      const data = await res.json();

      if (!data.online) {
        showOffline();
        return;
      }

      if (statusDot) {
        statusDot.classList.remove('offline');
        statusDot.classList.add('online');
      }
      if (statusText) statusText.textContent = 'Online';

      if (versionText) {
        versionText.textContent = data.version ? stripFormatting(data.version) : 'Unknown';
      }

      if (playersText) {
        const online = data.players && typeof data.players.online === 'number' ? data.players.online : 0;
        const max = data.players && typeof data.players.max === 'number' ? data.players.max : '?';
        playersText.textContent = `${online} / ${max}`;
      }

      if (motdText) {
        const motdLines = (data.motd && data.motd.clean) ? data.motd.clean : [];
        const motd = motdLines.join(' ').trim();
        motdText.textContent = motd ? `“${motd}”` : '';
      }

    } catch (err) {
      console.error('Failed to fetch server status:', err);
      showOffline();
      if (statusText) statusText.textContent = 'Unavailable';
    }
  }

  loadServerStatus();
  // Refresh periodically so the tile stays live
  setInterval(loadServerStatus, 60000);

});