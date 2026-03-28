// ═══════════════ ACTIVATION FUNCTIONS ═══════════════
(function initAct() {
  const c = document.getElementById('actCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let currentFn = 'relu';

  function actFn(type, x) {
    switch (type) {
      case 'relu': return Math.max(0, x);
      case 'sigmoid': return 1 / (1 + Math.exp(-x));
      case 'tanh': return Math.tanh(x);
      case 'gelu': return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x)));
      default: return x;
    }
  }

  const info = {
    relu: 'ReLU: max(0, x) — most popular. Simple and fast.',
    sigmoid: 'Sigmoid: 1/(1+e⁻ˣ) — squashes to 0–1 for probabilities.',
    tanh: 'Tanh: (eˣ−e⁻ˣ)/(eˣ+e⁻ˣ) — outputs -1 to +1, centered.',
    gelu: 'GELU: x·Φ(x) — smooth ReLU. Used in Claude, GPT-4, Gemini.'
  };

  function resize() { c.width = c.parentElement.offsetWidth - 32; c.height = 300; drawAct(); }
  window.addEventListener('resize', resize);

  const buttons = document.querySelectorAll('.act-btns .btn-ctrl, [data-fn]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('btn-active'));
      btn.classList.add('btn-active');
      currentFn = btn.dataset.fn;
      drawAct();
    });
  });

  function drawAct() {
    const w = c.width, h = c.height;
    const cx = w / 2, cy = h / 2, sx = 48, sy = 85;

    ctx.clearRect(0, 0, w, h);

    // Background halves
    ctx.fillStyle = 'rgba(190,18,60,0.02)';
    ctx.fillRect(0, 0, cx, h);
    ctx.fillStyle = 'rgba(15,118,110,0.02)';
    ctx.fillRect(cx, 0, w - cx, h);

    // Grid
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
    for (let i = -12; i <= 12; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * sx, 0); ctx.lineTo(cx + i * sx, h); ctx.stroke();
    }
    for (let i = -5; i <= 5; i++) {
      ctx.beginPath(); ctx.moveTo(0, cy + i * sy); ctx.lineTo(w, cy + i * sy); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#a8a29e';
    ctx.font = '500 10px "JetBrains Mono",monospace';
    ctx.textAlign = 'center';
    for (let i = -5; i <= 5; i++) if (i !== 0) ctx.fillText(i, cx + i * sx, cy + 15);
    ctx.textAlign = 'left';

    // Labels
    ctx.fillStyle = 'rgba(190,18,60,0.2)';
    ctx.font = '500 11px "Inter",system-ui';
    ctx.fillText('negative input', 12, 18);
    ctx.fillStyle = 'rgba(15,118,110,0.3)';
    ctx.textAlign = 'right';
    ctx.fillText('positive input', w - 12, 18);
    ctx.textAlign = 'left';

    // Function curve
    ctx.beginPath();
    ctx.strokeStyle = '#4338ca';
    ctx.lineWidth = 3;
    for (let px = 0; px < w; px++) {
      const x = (px - cx) / sx;
      const y = actFn(currentFn, x);
      const py = cy - y * sy;
      px === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Function name
    ctx.fillStyle = '#1c1917';
    ctx.font = '600 13px "JetBrains Mono",monospace';
    ctx.textAlign = 'left';
    ctx.fillText(info[currentFn].split(' — ')[0], 12, h - 12);

    // Update readout
    const el = document.getElementById('actReadout');
    if (el) el.textContent = info[currentFn];
  }

  // Initial draw
  resize();
})();
