// ═══════════════ NEURAL NETWORK ═══════════════
(function initNN() {
  const c = document.getElementById('nnCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');

  const layers = [3, 5, 6, 5, 3, 2];
  const names = ['Input', 'Hidden 1', 'Hidden 2', 'Hidden 3', 'Hidden 4', 'Output'];
  const BG = '#f5f2ed';
  const TEAL = '#0f766e', ROSE = '#be123c';
  const CANVAS_H = 460;
  const LABEL_Y = 22; // labels at top
  const TOP_PAD = 40; // space below labels
  const BOT_PAD = 40; // space above bottom edge (for hint box)

  const weights = [];
  for (let l = 0; l < layers.length - 1; l++) {
    weights[l] = [];
    for (let i = 0; i < layers[l]; i++) {
      weights[l][i] = [];
      for (let j = 0; j < layers[l + 1]; j++)
        weights[l][i][j] = (Math.random() - 0.5) * 2;
    }
  }

  let hoveredLayer = -1, hoveredNeuron = -1;
  let mouseX = -1, mouseY = -1, time = 0;
  let W = 0, H = CANVAS_H, dpr = 1;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = c.parentElement.offsetWidth;
    H = CANVAS_H;
    c.width = W * dpr;
    c.height = H * dpr;
    c.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  c.addEventListener('mousemove', e => {
    const r = c.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
  });
  c.addEventListener('mouseleave', () => {
    mouseX = -1; mouseY = -1;
    hoveredLayer = -1; hoveredNeuron = -1;
    const el = document.getElementById('nnReadout');
    if (el) el.textContent = 'Hover over neurons to explore';
  });

  function nPos(li, ni) {
    const usableH = H - TOP_PAD - BOT_PAD;
    const x = 70 + (li / (layers.length - 1)) * (W - 140);
    const sp = Math.min(50, usableH / (layers[li] + 1));
    const totalH = sp * (layers[li] - 1);
    const y = TOP_PAD + (usableH - totalH) / 2 + ni * sp;
    return { x, y };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    time += 0.004;

    // Detect hover
    hoveredLayer = -1; hoveredNeuron = -1;
    for (let li = 0; li < layers.length; li++) {
      for (let ni = 0; ni < layers[li]; ni++) {
        const p = nPos(li, ni);
        if (Math.hypot(mouseX - p.x, mouseY - p.y) < 16) {
          hoveredLayer = li; hoveredNeuron = ni;
        }
      }
    }
    const isHL = (li, ni) => hoveredLayer === li && hoveredNeuron === ni;

    // Layer labels at TOP
    for (let li = 0; li < layers.length; li++) {
      const p = nPos(li, 0);
      ctx.fillStyle = '#78716c';
      ctx.font = '600 11px "JetBrains Mono",monospace';
      ctx.textAlign = 'center';
      ctx.fillText(names[li], p.x, LABEL_Y);
    }
    ctx.textAlign = 'left';

    // Connections
    for (let li = 0; li < layers.length - 1; li++) {
      for (let ni = 0; ni < layers[li]; ni++) {
        for (let nj = 0; nj < layers[li + 1]; nj++) {
          const p1 = nPos(li, ni), p2 = nPos(li + 1, nj);
          const w = weights[li][ni][nj];
          const hl = isHL(li, ni) || isHL(li + 1, nj);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          if (hl) {
            ctx.strokeStyle = w > 0 ? `rgba(15,118,110,${Math.abs(w) * 0.45})` : `rgba(190,18,60,${Math.abs(w) * 0.45})`;
            ctx.lineWidth = Math.abs(w) * 2.5 + 0.5;
          } else {
            ctx.strokeStyle = w > 0 ? `rgba(15,118,110,${Math.abs(w) * 0.06})` : `rgba(190,18,60,${Math.abs(w) * 0.06})`;
            ctx.lineWidth = Math.abs(w) * 0.8 + 0.3;
          }
          ctx.stroke();
        }
      }
    }

    // Neurons
    for (let li = 0; li < layers.length; li++) {
      for (let ni = 0; ni < layers[li]; ni++) {
        const p = nPos(li, ni);
        const hl = isHL(li, ni);
        const act = Math.sin(time + li * 0.7 + ni * 1.3) * 0.5 + 0.5;

        if (hl) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 24, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(15,118,110,0.06)';
          ctx.fill();
        }

        const shade = Math.floor(act * 45 + 195);
        ctx.beginPath();
        ctx.arc(p.x, p.y, hl ? 14 : 11, 0, Math.PI * 2);
        ctx.fillStyle = hl ? 'rgba(15,118,110,0.15)' : `rgb(${shade},${shade - 2},${shade - 6})`;
        ctx.fill();
        ctx.strokeStyle = hl ? TEAL : `rgba(0,0,0,${0.06 + act * 0.04})`;
        ctx.lineWidth = hl ? 2.5 : 1;
        ctx.stroke();

        if (hl) {
          ctx.fillStyle = TEAL;
          ctx.font = '700 11px "JetBrains Mono",monospace';
          ctx.textAlign = 'center';
          ctx.fillText(act.toFixed(2), p.x, p.y + 4);
          ctx.textAlign = 'left';
          const el = document.getElementById('nnReadout');
          if (el) el.innerHTML = `<strong>${names[li]}</strong> neuron #${ni + 1} — activation: <strong style="color:${TEAL}">${act.toFixed(3)}</strong>`;
        }
      }
    }

    // Data flow particle
    const fp = (time * 0.06) % 1;
    for (let li = 0; li < layers.length - 1; li++) {
      const pr = (fp - li / (layers.length - 1)) * (layers.length - 1);
      if (pr > 0 && pr < 1) {
        const ni = Math.floor(((time * 1.5 + li) % 1) * layers[li]) % layers[li];
        const nj = Math.floor(((time * 2.5 + li) % 1) * layers[li + 1]) % layers[li + 1];
        const p1 = nPos(li, ni), p2 = nPos(li + 1, nj);
        ctx.beginPath();
        ctx.arc(p1.x + (p2.x - p1.x) * pr, p1.y + (p2.y - p1.y) * pr, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15,118,110,0.4)';
        ctx.fill();
      }
    }

    requestAnimationFrame(draw);
  }
  draw();
})();
