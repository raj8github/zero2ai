// ═══════════════ APP.JS — Core + Hero + Function Graph ═══════════════

// ─── Scroll Progress & Nav ───
const progBar = document.getElementById('progressBar');
const nav = document.getElementById('chapterNav');
const navLinks = document.querySelectorAll('.nav-ch');

window.addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  progBar.style.width = `${(scrollY / h * 100)}%`;
  nav.classList.toggle('visible', scrollY > innerHeight * 0.35);

  // Highlight active chapter
  const chapters = document.querySelectorAll('.chapter');
  let active = '';
  chapters.forEach(ch => {
    const rect = ch.getBoundingClientRect();
    if (rect.top < innerHeight * 0.4) active = ch.id;
  });
  navLinks.forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === `#${active}`);
  });
});

// ─── Fade-in Observer ───
const fadeObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.05 });
document.querySelectorAll('.chapter-header, .split-layout, .step-flow, .stat-grid, .learning-types, .hierarchy-container, .phase-grid, .vocab-table, .bridge, .callout').forEach(el => {
  el.classList.add('fade-in');
  fadeObs.observe(el);
});

// ─── Hero Network Animation ───
(function initHero() {
  const c = document.getElementById('heroCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');

  const COLORS = ['rgba(15,118,110,', 'rgba(67,56,202,', 'rgba(190,18,60,', 'rgba(180,83,9,', 'rgba(3,105,161,'];
  let W = 0, H = 0, dpr = 1;
  let nodes = [];
  let mouseX = -999, mouseY = -999;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = c.parentElement.offsetWidth || window.innerWidth;
    H = c.parentElement.offsetHeight || window.innerHeight;
    c.width = W * dpr;
    c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (nodes.length === 0) createNodes();
  }

  function createNodes() {
    nodes = [];
    const cols = Math.ceil(Math.sqrt(80 * W / H));
    const rows = Math.ceil(80 / cols);
    const cellW = W / cols, cellH = H / rows;
    for (let r = 0; r < rows; r++) {
      for (let cl = 0; cl < cols; cl++) {
        if (nodes.length >= 80) break;
        nodes.push({
          x: cellW * (cl + 0.15 + Math.random() * 0.7),
          y: cellH * (r + 0.15 + Math.random() * 0.7),
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          r: Math.random() * 1.5 + 2.5,
          ci: Math.floor(Math.random() * COLORS.length),
          phase: Math.random() * Math.PI * 2
        });
      }
    }
  }

  window.addEventListener('resize', () => { resize(); createNodes(); });
  c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(); mouseX = e.clientX - r.left; mouseY = e.clientY - r.top; });
  c.addEventListener('mouseleave', () => { mouseX = -999; mouseY = -999; });

  resize();

  let t = 0;
  function draw() {
    t += 0.003;
    ctx.clearRect(0, 0, W, H);

    // Update positions — gentle drift
    nodes.forEach(n => {
      // Mouse interaction
      const dx = n.x - mouseX, dy = n.y - mouseY;
      const md = Math.sqrt(dx * dx + dy * dy);
      if (md < 100 && md > 0) {
        n.vx += dx / md * 0.15;
        n.vy += dy / md * 0.15;
      }
      // Gentle sine-wave drift
      n.vx += Math.sin(t + n.phase) * 0.003;
      n.vy += Math.cos(t + n.phase * 1.3) * 0.003;
      n.vx *= 0.97; n.vy *= 0.97;
      n.x += n.vx; n.y += n.vy;
      // Soft boundary
      if (n.x < 10) n.vx += 0.05; if (n.x > W - 10) n.vx -= 0.05;
      if (n.y < 10) n.vy += 0.05; if (n.y > H - 10) n.vy -= 0.05;
    });

    // Draw edges
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const maxD = Math.min(250, Math.max(W, H) * 0.2);
        if (d < maxD) {
          const alpha = (1 - d / maxD) * 0.18;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = COLORS[nodes[i].ci] + alpha + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[n.ci] + '0.45)';
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }
  draw();
})();

// ─── CH1: Function Graph ───
(function initFuncGraph() {
  const c = document.getElementById('funcCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let mouseX = -1;

  function resize() { c.width = c.parentElement.offsetWidth; c.height = 400; }
  window.addEventListener('resize', resize);
  resize();

  c.addEventListener('mousemove', e => {
    mouseX = e.clientX - c.getBoundingClientRect().left;
  });
  c.addEventListener('mouseleave', () => {
    mouseX = -1;
    const el = document.getElementById('funcReadout');
    if (el) el.textContent = 'Move your mouse over the graph';
  });

  const BG = '#f3efe8';

  function draw() {
    const w = c.width, h = c.height;
    const cx = w / 2, cy = h / 2, sx = 42, sy = 42;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(0,0,0,.04)';
    ctx.lineWidth = 1;
    for (let i = -20; i <= 20; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * sx, 0); ctx.lineTo(cx + i * sx, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, cy + i * sy); ctx.lineTo(w, cy + i * sy); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(0,0,0,.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#78716c';
    ctx.font = '500 11px "Inter",system-ui,sans-serif';
    ctx.textAlign = 'center';
    for (let i = -4; i <= 4; i++) if (i !== 0) ctx.fillText(i, cx + i * sx, cy + 16);

    // Function curve
    ctx.beginPath();
    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 2.5;
    for (let px = 0; px < w; px++) {
      const v = (px - cx) / sx;
      const y = Math.sin(v) * 2 + 0.3 * v;
      const py = cy - y * sy;
      px === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Hover interaction
    if (mouseX >= 0 && mouseX < w) {
      const v = (mouseX - cx) / sx;
      const y = Math.sin(v) * 2 + 0.3 * v;
      const py = cy - y * sy;

      // Crosshair
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(0,0,0,.08)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mouseX, 0); ctx.lineTo(mouseX, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
      ctx.setLineDash([]);

      // Point
      ctx.beginPath();
      ctx.arc(mouseX, py, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#0f766e';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Label on canvas
      ctx.fillStyle = '#1c1917';
      ctx.font = '600 13px "Inter",system-ui,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`x = ${v.toFixed(1)}`, mouseX + 14, py - 6);
      ctx.fillStyle = '#0f766e';
      ctx.fillText(`f(x) = ${y.toFixed(2)}`, mouseX + 14, py + 12);

      // Update readout
      const el = document.getElementById('funcReadout');
      if (el) el.innerHTML = `x = <strong>${v.toFixed(2)}</strong> → f(x) = <strong style="color:#0f766e">${y.toFixed(2)}</strong>`;
    }

    requestAnimationFrame(draw);
  }
  draw();
})();

// ─── CH2: Slope/Derivative ───
(function initSlope() {
  const c = document.getElementById('slopeCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let dragX = 1.5;
  let dragging = false;

  function resize() { c.width = c.parentElement.offsetWidth; c.height = 400; }
  window.addEventListener('resize', resize);
  resize();

  c.addEventListener('mousedown', () => dragging = true);
  window.addEventListener('mouseup', () => dragging = false);
  c.addEventListener('mousemove', e => {
    if (!dragging) return;
    const r = c.getBoundingClientRect();
    dragX = Math.max(-3.5, Math.min(3.5, (e.clientX - r.left - c.width / 2) / 52));
  });
  c.addEventListener('touchmove', e => {
    e.preventDefault();
    const r = c.getBoundingClientRect();
    dragX = Math.max(-3.5, Math.min(3.5, (e.touches[0].clientX - r.left - c.width / 2) / 52));
  }, { passive: false });

  function f(x) { return x * x * 0.5; }
  function fp(x) { return x; }

  function draw() {
    const w = c.width, h = c.height;
    const cx = w / 2, cy = h * 0.7, sx = 52, sy = 52;

    ctx.fillStyle = '#f3efe8';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(0,0,0,.04)';
    ctx.lineWidth = 1;
    for (let i = -15; i <= 15; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * sx, 0); ctx.lineTo(cx + i * sx, h); ctx.stroke();
    }

    // Axis
    ctx.strokeStyle = 'rgba(0,0,0,.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();

    // Curve
    ctx.beginPath();
    ctx.strokeStyle = '#4338ca';
    ctx.lineWidth = 2.5;
    for (let px = 0; px < w; px++) {
      const v = (px - cx) / sx;
      const py = cy - f(v) * sy;
      px === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Tangent line
    const slope = fp(dragX);
    const ptX = cx + dragX * sx;
    const ptY = cy - f(dragX) * sy;
    const len = 95;
    const dd = len / Math.sqrt(1 + slope * slope);

    ctx.beginPath();
    ctx.strokeStyle = '#be123c';
    ctx.lineWidth = 2;
    ctx.moveTo(ptX - dd, ptY + slope * dd);
    ctx.lineTo(ptX + dd, ptY - slope * dd);
    ctx.stroke();

    // Point
    ctx.beginPath();
    ctx.arc(ptX, ptY, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#b45309';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#1c1917';
    ctx.font = '600 14px "Inter",system-ui,sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`slope = ${slope.toFixed(2)}`, ptX + 18, ptY - 6);

    // Update readout
    const el = document.getElementById('slopeReadout');
    if (el) el.innerHTML = `Slope = <strong style="color:#be123c">${slope.toFixed(2)}</strong> at x = ${dragX.toFixed(2)}`;

    requestAnimationFrame(draw);
  }
  draw();
})();
