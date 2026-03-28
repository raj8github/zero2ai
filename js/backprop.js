// ═══════════════ BACKPROPAGATION — 5 PASSES ═══════════════
(function initBP() {
  const c = document.getElementById('bpCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');

  const BG = '#f5f2ed', TEAL = '#0f766e', ROSE = '#be123c', AMBER = '#b45309';
  const layers = [3, 4, 4, 3, 2];
  const names = ['Input', 'H1', 'H2', 'H3', 'Output'];
  const CANVAS_H = 500;
  const TOP = 55, BOT = 20;
  const NEURON_R = 20; // bigger neurons

  let phase = 'idle', currentLayer = 0, progress = 0, passNumber = 0;
  const TOTAL_PASSES = 5;
  const lossPerPass = [2.45, 1.82, 1.14, 0.63, 0.21];
  let weightStrength = 0.3;

  const activations = [
    [[0.2,0.8,0.5],[0.3,0.6,0.4,0.7],[0.5,0.3,0.8,0.2],[0.6,0.4,0.3],[0.9,0.1]],
    [[0.2,0.8,0.5],[0.4,0.5,0.5,0.6],[0.6,0.4,0.7,0.3],[0.5,0.5,0.4],[0.8,0.2]],
    [[0.2,0.8,0.5],[0.5,0.4,0.6,0.5],[0.7,0.5,0.6,0.4],[0.4,0.6,0.5],[0.7,0.3]],
    [[0.2,0.8,0.5],[0.6,0.3,0.7,0.4],[0.8,0.6,0.5,0.5],[0.3,0.7,0.6],[0.85,0.15]],
    [[0.2,0.8,0.5],[0.7,0.3,0.8,0.3],[0.9,0.7,0.4,0.6],[0.2,0.8,0.7],[0.92,0.08]],
  ];

  let W = 0, dpr = 1;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = c.parentElement.offsetWidth;
    c.width = W * dpr;
    c.height = CANVAS_H * dpr;
    c.style.height = CANVAS_H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function nPos(li, ni) {
    const usable = CANVAS_H - TOP - BOT;
    const x = 70 + (li / (layers.length - 1)) * (W - 140);
    const sp = Math.min(58, usable / (layers[li] + 1));
    const th = sp * (layers[li] - 1);
    return { x, y: TOP + (usable - th) / 2 + ni * sp };
  }

  // Clip line to stop at neuron edge
  function clipLine(x1, y1, x2, y2, r) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < r * 2) return null; // too close
    const nx = dx / len, ny = dy / len;
    return {
      x1: x1 + nx * r, y1: y1 + ny * r,
      x2: x2 - nx * r, y2: y2 - ny * r
    };
  }

  document.getElementById('bpRun')?.addEventListener('click', () => {
    if (phase !== 'idle') return;
    passNumber = 0; weightStrength = 0.3; startNextPass();
  });
  document.getElementById('bpReset')?.addEventListener('click', () => {
    phase = 'idle'; currentLayer = 0; progress = 0; passNumber = 0; weightStrength = 0.3;
    updateReadout('Click Run to watch 5 training passes');
  });

  function startNextPass() {
    if (passNumber >= TOTAL_PASSES) {
      phase = 'idle';
      updateReadout('✓ 5 passes complete! Loss: 2.45 → 0.21. Weights are now well-tuned.');
      return;
    }
    phase = 'forward'; currentLayer = 0; progress = 0;
    weightStrength = 0.3 + passNumber * 0.14;
  }

  function updateReadout(msg) {
    const el = document.getElementById('bpReadout');
    if (el) el.innerHTML = msg;
  }

  function draw() {
    ctx.clearRect(0, 0, W, CANVAS_H);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, CANVAS_H);

    // ─── Progress bar at top ───
    const barY = 16;
    for (let i = 0; i < TOTAL_PASSES; i++) {
      const bx = 12 + i * ((W - 24) / TOTAL_PASSES);
      const bw = (W - 24) / TOTAL_PASSES - 5;
      const done = i < passNumber;
      const active = i === passNumber && phase !== 'idle';

      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, barY - 10, bw, 24, 6);
      else ctx.rect(bx, barY - 10, bw, 24);
      ctx.fillStyle = done ? 'rgba(15,118,110,0.1)' : active ? 'rgba(180,83,9,0.06)' : 'rgba(0,0,0,0.02)';
      ctx.fill();
      ctx.strokeStyle = done ? TEAL : active ? AMBER : 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1.5; ctx.stroke();

      ctx.fillStyle = done ? TEAL : active ? AMBER : '#a8a29e';
      ctx.font = `${done || active ? '700' : '500'} 11px "JetBrains Mono",monospace`;
      ctx.textAlign = 'center';
      if (done) ctx.fillText(`Pass ${i+1}  L=${lossPerPass[i].toFixed(2)}`, bx + bw / 2, barY + 5);
      else if (active) ctx.fillText(`▶ Pass ${i+1}  L=${lossPerPass[i].toFixed(2)}`, bx + bw / 2, barY + 5);
      else ctx.fillText(`Pass ${i+1}`, bx + bw / 2, barY + 5);
    }
    ctx.textAlign = 'left';

    // ─── Layer labels ───
    for (let li = 0; li < layers.length; li++) {
      const p = nPos(li, 0);
      ctx.fillStyle = '#78716c';
      ctx.font = '600 10px "JetBrains Mono",monospace';
      ctx.textAlign = 'center';
      ctx.fillText(names[li], p.x, TOP - 6);
    }
    ctx.textAlign = 'left';

    // ─── Connections (clipped to neuron edge) ───
    for (let li = 0; li < layers.length - 1; li++) {
      for (let ni = 0; ni < layers[li]; ni++) {
        for (let nj = 0; nj < layers[li + 1]; nj++) {
          const p1 = nPos(li, ni), p2 = nPos(li + 1, nj);
          const cl = clipLine(p1.x, p1.y, p2.x, p2.y, NEURON_R);
          if (!cl) continue;
          const active = phase !== 'idle' && li === currentLayer;
          ctx.beginPath();
          ctx.moveTo(cl.x1, cl.y1);
          ctx.lineTo(cl.x2, cl.y2);
          if (active) {
            ctx.strokeStyle = phase === 'forward' ? 'rgba(15,118,110,0.18)' : 'rgba(190,18,60,0.18)';
            ctx.lineWidth = 1.5;
          } else {
            ctx.strokeStyle = `rgba(0,0,0,${0.02 + weightStrength * 0.04})`;
            ctx.lineWidth = 0.5 + weightStrength;
          }
          ctx.stroke();
        }
      }
    }

    // ─── Animated signals ───
    if (phase === 'forward' || phase === 'backward') {
      progress += 0.008;
      const fromL = phase === 'forward' ? currentLayer : currentLayer + 1;
      const toL = phase === 'forward' ? currentLayer + 1 : currentLayer;
      if (fromL >= 0 && fromL < layers.length && toL >= 0 && toL < layers.length) {
        for (let ni = 0; ni < layers[fromL]; ni++) {
          for (let nj = 0; nj < layers[toL]; nj++) {
            const p1 = nPos(fromL, ni), p2 = nPos(toL, nj);
            const cl = clipLine(p1.x, p1.y, p2.x, p2.y, NEURON_R);
            if (!cl) continue;
            const px = cl.x1 + (cl.x2 - cl.x1) * progress;
            const py = cl.y1 + (cl.y2 - cl.y1) * progress;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = phase === 'forward' ? TEAL : ROSE;
            ctx.globalAlpha = 0.6; ctx.fill(); ctx.globalAlpha = 1;
          }
        }
      }
      const lbl = `Pass ${passNumber + 1}/${TOTAL_PASSES}`;
      const ll = `Loss: ${lossPerPass[passNumber]?.toFixed(2)}`;
      if (phase === 'forward') updateReadout(`<span style="color:${TEAL}">▶ Forward</span> — ${lbl} | ${ll}`);
      else updateReadout(`<span style="color:${ROSE}">◀ Backward</span> — ${lbl} | ${ll}`);
      if (progress >= 1) {
        progress = 0;
        if (phase === 'forward') { currentLayer++; if (currentLayer >= layers.length - 1) { phase = 'backward'; currentLayer = layers.length - 2; } }
        else { currentLayer--; if (currentLayer < 0) { passNumber++; startNextPass(); } }
      }
    }

    // ─── Neurons (drawn LAST so they're on top) ───
    const passIdx = Math.min(passNumber, TOTAL_PASSES - 1);
    const acts = activations[passIdx];
    for (let li = 0; li < layers.length; li++) {
      for (let ni = 0; ni < layers[li]; ni++) {
        const p = nPos(li, ni);
        const isFwd = phase === 'forward' && li <= currentLayer;
        const isBwd = phase === 'backward' && li >= currentLayer + 1;
        const act = acts[li]?.[ni] ?? 0.5;

        // White background to cover connection lines
        ctx.beginPath();
        ctx.arc(p.x, p.y, NEURON_R + 1, 0, Math.PI * 2);
        ctx.fillStyle = BG;
        ctx.fill();

        // Neuron circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, NEURON_R, 0, Math.PI * 2);
        if (isFwd) { ctx.fillStyle = `rgba(15,118,110,${0.06 + act * 0.12})`; ctx.strokeStyle = TEAL; }
        else if (isBwd) { ctx.fillStyle = `rgba(190,18,60,${0.06 + act * 0.1})`; ctx.strokeStyle = ROSE; }
        else {
          const sh = Math.floor(235 - act * 30);
          ctx.fillStyle = `rgb(${sh},${sh},${sh - 3})`;
          ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        }
        ctx.fill();
        ctx.lineWidth = (isFwd || isBwd) ? 2.5 : 1;
        ctx.stroke();

        // Activation text
        if (phase !== 'idle' || passNumber > 0) {
          ctx.fillStyle = isFwd ? TEAL : isBwd ? ROSE : '#57534e';
          ctx.font = '700 11px "JetBrains Mono",monospace';
          ctx.textAlign = 'center';
          ctx.fillText(act.toFixed(2), p.x, p.y + 4);
          ctx.textAlign = 'left';
        }
      }
    }

    // ─── Legend ───
    const ly = CANVAS_H - 14;
    ctx.fillStyle = TEAL; ctx.beginPath(); ctx.arc(W - 160, ly, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1c1917'; ctx.font = '500 10px "JetBrains Mono",monospace'; ctx.fillText('Forward', W - 152, ly + 4);
    ctx.fillStyle = ROSE; ctx.beginPath(); ctx.arc(W - 80, ly, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1c1917'; ctx.fillText('Backward', W - 72, ly + 4);

    requestAnimationFrame(draw);
  }
  draw();
})();
