// ═══════════════ GRADIENT DESCENT ═══════════════
(function initGD() {
  const c = document.getElementById('gdCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');

  const START_X = 4.3, START_Y = -4.0;
  let posX = START_X, posY = START_Y;
  let velX = 0, velY = 0;
  let trail = [{ x: START_X, y: START_Y }];
  let running = false;
  let lr = 0.05, mom = 0.10, stepsPerTick = 1;
  let intervalId = null;

  // Loss: bowl with minimum near (-0.3, -0.3), gentle ripples for texture
  function loss(a, b) {
    const dx = a - 0.5, dy = b + 0.5;
    return dx * dx * 0.3 + dy * dy * 0.25 + Math.sin(a * 1.5) * Math.cos(b * 1.2) * 0.4;
  }

  function grad(a, b) {
    const h = 0.0001;
    return [
      (loss(a + h, b) - loss(a - h, b)) / (2 * h),
      (loss(a, b + h) - loss(a, b - h)) / (2 * h)
    ];
  }

  // Heatmap — built once
  let heatmapCanvas = null;
  let canvasW = 0, canvasH = 450;

  function buildHeatmap(w, h) {
    heatmapCanvas = document.createElement('canvas');
    heatmapCanvas.width = w;
    heatmapCanvas.height = h;
    const hctx = heatmapCanvas.getContext('2d');
    const imgData = hctx.createImageData(w, h);
    const d = imgData.data;
    let mn = Infinity, mx = -Infinity;
    for (let px = 0; px < w; px += 3) for (let py = 0; py < h; py += 3) {
      const l = loss((px / w) * 10 - 5, (py / h) * 10 - 5);
      if (l < mn) mn = l; if (l > mx) mx = l;
    }
    const rng = mx - mn || 1;
    for (let px = 0; px < w; px++) for (let py = 0; py < h; py++) {
      const n = (loss((px / w) * 10 - 5, (py / h) * 10 - 5) - mn) / rng;
      const idx = (py * w + px) * 4;
      let r, g, bl;
      if (n < .12) { const s = n / .12; r = ~~(5 + s * 15); g = ~~(20 + s * 50); bl = ~~(60 + s * 90); }
      else if (n < .3) { const s = (n - .12) / .18; r = ~~(20 - s * 5); g = ~~(70 + s * 120); bl = ~~(150 + s * 20); }
      else if (n < .5) { const s = (n - .3) / .2; r = ~~(15 + s * 80); g = ~~(190 + s * 40); bl = ~~(170 - s * 80); }
      else if (n < .7) { const s = (n - .5) / .2; r = ~~(95 + s * 150); g = ~~(230 + s * 15); bl = ~~(90 - s * 60); }
      else if (n < .85) { const s = (n - .7) / .15; r = ~~(245 + s * 10); g = ~~(245 - s * 100); bl = ~~(30 - s * 10); }
      else { const s = (n - .85) / .15; r = 255; g = ~~(145 - s * 90); bl = ~~(20 + s * 10); }
      d[idx] = r; d[idx + 1] = g; d[idx + 2] = bl; d[idx + 3] = 255;
    }
    hctx.putImageData(imgData, 0, 0);
  }

  function resize() {
    canvasW = c.parentElement.offsetWidth;
    c.width = canvasW;
    c.height = canvasH;
    buildHeatmap(canvasW, canvasH);
  }
  window.addEventListener('resize', resize);
  resize();

  // Step
  function doStep() {
    const [gx, gy] = grad(posX, posY);
    velX = mom * velX - lr * gx;
    velY = mom * velY - lr * gy;
    posX = Math.max(-5, Math.min(5, posX + velX));
    posY = Math.max(-5, Math.min(5, posY + velY));
    trail.push({ x: posX, y: posY });
    if (trail.length > 800) trail.shift();
  }
  function doMultiStep() { for (let i = 0; i < stepsPerTick; i++) doStep(); }

  function startPlay() { if (running) return; running = true; updateBtn(); intervalId = setInterval(doMultiStep, 150); }
  function stopPlay() { running = false; updateBtn(); clearInterval(intervalId); intervalId = null; }
  function reset() { stopPlay(); posX = START_X; posY = START_Y; velX = 0; velY = 0; trail = [{ x: START_X, y: START_Y }]; }
  function updateBtn() { const b = document.getElementById('gdPlay'); if (b) { b.textContent = running ? '⏸ Pause' : '▶ Play'; } }

  document.getElementById('gdPlay')?.addEventListener('click', () => running ? stopPlay() : startPlay());
  document.getElementById('gdStep')?.addEventListener('click', () => { stopPlay(); doMultiStep(); });
  document.getElementById('gdReset')?.addEventListener('click', reset);
  document.getElementById('gdLR')?.addEventListener('input', e => { lr = +e.target.value / 100; document.getElementById('gdLRVal').textContent = lr.toFixed(2); });
  document.getElementById('gdMom')?.addEventListener('input', e => { mom = +e.target.value / 100; document.getElementById('gdMomVal').textContent = mom.toFixed(2); });
  document.getElementById('gdSteps')?.addEventListener('input', e => { stepsPerTick = +e.target.value; document.getElementById('gdStepsVal').textContent = stepsPerTick; });

  function toC(x, y) { return { cx: ((x + 5) / 10) * c.width, cy: ((y + 5) / 10) * c.height }; }

  function draw() {
    const w = c.width, h = c.height;
    if (!w) { requestAnimationFrame(draw); return; }
    ctx.clearRect(0, 0, w, h);
    if (heatmapCanvas) ctx.drawImage(heatmapCanvas, 0, 0);

    // Trail
    if (trail.length > 1) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 4;
      ctx.beginPath();
      const p0 = toC(trail[0].x, trail[0].y);
      ctx.moveTo(p0.cx, p0.cy);
      for (let i = 1; i < trail.length; i++) { const p = toC(trail[i].x, trail[i].y); ctx.lineTo(p.cx, p.cy); }
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.restore();
      const dn = Math.max(1, ~~(trail.length / 30));
      for (let i = 0; i < trail.length; i += dn) { const p = toC(trail[i].x, trail[i].y); ctx.beginPath(); ctx.arc(p.cx, p.cy, 3, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill(); }
    }

    const pos = toC(posX, posY);
    // Arrow (points uphill)
    const [gx, gy] = grad(posX, posY);
    const gm = Math.sqrt(gx * gx + gy * gy);
    if (gm > 0.005) {
      const nx = gx / gm, ny = gy / gm, al = Math.min(50, gm * 25);
      const tx = pos.cx + nx * al, ty = pos.cy + ny * al;
      ctx.beginPath(); ctx.moveTo(pos.cx, pos.cy); ctx.lineTo(tx, ty);
      ctx.strokeStyle = '#be123c'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
      const ang = Math.atan2(ty - pos.cy, tx - pos.cx);
      ctx.beginPath(); ctx.moveTo(tx, ty);
      ctx.lineTo(tx - 10 * Math.cos(ang - .35), ty - 10 * Math.sin(ang - .35));
      ctx.lineTo(tx - 10 * Math.cos(ang + .35), ty - 10 * Math.sin(ang + .35));
      ctx.closePath(); ctx.fillStyle = '#be123c'; ctx.fill();
    }

    // Ball
    ctx.beginPath(); ctx.arc(pos.cx, pos.cy, 16, 0, Math.PI * 2); ctx.fillStyle = 'rgba(180,83,9,0.2)'; ctx.fill();
    ctx.beginPath(); ctx.arc(pos.cx, pos.cy, 9, 0, Math.PI * 2); ctx.fillStyle = '#b45309'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();

    // Readout
    const el = document.getElementById('gdReadout');
    if (el) el.innerHTML = `Loss: <strong style="color:#0f766e">${loss(posX, posY).toFixed(3)}</strong> | Steps: ${trail.length - 1} | Pos: (${posX.toFixed(1)}, ${posY.toFixed(1)})`;
    requestAnimationFrame(draw);
  }
  draw();
})();
