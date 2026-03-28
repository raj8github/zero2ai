// ═══════════════ ATTENTION ═══════════════
(function initAttn() {
  const c = document.getElementById('attnCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');

  const BG = '#f3efe8';
  const TEAL = '#0f766e';
  const AMBER = '#b45309';

  const words = ['The', 'curious', 'cat', 'quickly', 'jumped', 'over', 'the', 'lazy', 'dog'];
  const attnWeights = [
    [.30,.05,.10,.02,.05,.02,.35,.05,.06],
    [.02,.30,.25,.10,.05,.02,.02,.15,.09],
    [.05,.20,.30,.05,.10,.05,.05,.10,.10],
    [.02,.05,.05,.30,.35,.10,.02,.05,.06],
    [.02,.05,.15,.15,.30,.15,.02,.05,.11],
    [.05,.02,.05,.05,.15,.30,.15,.10,.13],
    [.15,.02,.05,.02,.05,.05,.30,.20,.16],
    [.02,.15,.10,.02,.05,.02,.10,.30,.24],
    [.02,.10,.15,.02,.05,.05,.05,.20,.36],
  ];

  let hoveredWord = -1;
  let time = 0;

  function resize() {
    c.width = c.parentElement.offsetWidth;
    c.height = 340;
  }
  window.addEventListener('resize', resize);
  resize();

  c.addEventListener('mousemove', e => {
    const r = c.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const n = words.length;
    const spacing = (c.width - 80) / (n - 1);

    hoveredWord = -1;
    for (let i = 0; i < n; i++) {
      const x = 40 + i * spacing;
      if (Math.abs(mx - x) < 25 && my > c.height - 90) {
        hoveredWord = i;
      }
    }
  });
  c.addEventListener('mouseleave', () => {
    hoveredWord = -1;
  });

  function draw() {
    const w = c.width, h = c.height;
    const n = words.length;
    const spacing = (w - 80) / (n - 1);
    const wordY = h - 40;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);
    time += 0.003;

    const src = hoveredWord >= 0 ? hoveredWord : Math.floor((time * 0.2) % n);

    // Draw attention arcs
    for (let j = 0; j < n; j++) {
      if (j === src) continue;
      const wt = attnWeights[src][j];
      if (wt < 0.04) continue;

      const x1 = 40 + src * spacing;
      const x2 = 40 + j * spacing;
      const arcH = Math.abs(x2 - x1) * 0.28 + 18;

      ctx.beginPath();
      ctx.moveTo(x1, wordY - 14);
      ctx.quadraticCurveTo((x1 + x2) / 2, wordY - 14 - arcH, x2, wordY - 14);
      ctx.strokeStyle = `rgba(15,118,110,${wt * 2.5})`;
      ctx.lineWidth = wt * 14;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Animated particle on arc
      const pt = (time * 0.8 + j * 0.2) % 1;
      const px = x1 + (x2 - x1) * pt;
      const py = wordY - 14 - arcH * 4 * pt * (1 - pt);
      if (wt > 0.06) {
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(15,118,110,${wt * 3})`;
        ctx.fill();
      }
    }

    // Draw words
    for (let i = 0; i < n; i++) {
      const x = 40 + i * spacing;
      const isSource = i === src;
      const isTarget = hoveredWord >= 0 && attnWeights[hoveredWord][i] > 0.06;

      // Highlight background for source
      if (isSource) {
        ctx.beginPath();
        ctx.roundRect
          ? ctx.roundRect(x - 35, wordY - 12, 70, 30, 6)
          : ctx.rect(x - 35, wordY - 12, 70, 30);
        ctx.fillStyle = 'rgba(180,83,9,0.06)';
        ctx.fill();
      }

      ctx.font = `${isSource ? '700' : '500'} ${isSource ? 14 : 13}px "JetBrains Mono",monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = isSource ? AMBER : isTarget ? TEAL : '#78716c';
      ctx.fillText(words[i], x, wordY + 4);

      // Attention percentage
      if (attnWeights[src][i] > 0.04 && i !== src) {
        ctx.fillStyle = '#a8a29e';
        ctx.font = '500 10px "JetBrains Mono",monospace';
        ctx.fillText(Math.round(attnWeights[src][i] * 100) + '%', x, wordY + 20);
      }
      ctx.textAlign = 'left';
    }

    // Update readout
    if (hoveredWord >= 0) {
      const best = attnWeights[hoveredWord].reduce(
        (acc, v, i) => (i !== hoveredWord && v > acc.v ? { v, i } : acc),
        { v: 0, i: 0 }
      );
      const el = document.getElementById('attnReadout');
      if (el) {
        el.innerHTML = `"<strong style="color:${AMBER}">${words[hoveredWord]}</strong>" attends most to "<strong style="color:${TEAL}">${words[best.i]}</strong>" (${Math.round(best.v * 100)}%)`;
      }
    }

    requestAnimationFrame(draw);
  }
  draw();
})();
