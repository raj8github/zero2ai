// ═══════════════ PIPELINE ANIMATION ═══════════════
(function initPipeline() {
  const c = document.getElementById('pipelineCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');

  const TEAL = '#0f766e', INDIGO = '#4338ca', ROSE = '#be123c', AMBER = '#b45309', SKY = '#0369a1';
  const CANVAS_H = 240;

  const stages = [
    { label: 'Your prompt', sub: '"What is gravity?"', color: '#57534e' },
    { label: 'Tokenize', sub: 'Split into pieces', color: TEAL },
    { label: 'Embed', sub: 'Tokens → vectors', color: INDIGO },
    { label: 'Attention', sub: '×96 layers', color: AMBER },
    { label: 'Feed-Forward', sub: 'Process info', color: ROSE },
    { label: 'Softmax', sub: 'Score all words', color: SKY },
    { label: 'Sample', sub: 'Pick next token', color: TEAL },
    { label: 'Response', sub: '"Gravity is..."', color: '#57534e' },
  ];

  let W = 0, dpr = 1, time = 0;
  // Track which stage is currently active (0-7), cycles slowly
  let activeStage = 0;
  let stageTimer = 0;
  const STAGE_DURATION = 90; // frames per stage (~1.5 sec at 60fps)

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = c.parentElement.offsetWidth - 32;
    c.width = W * dpr;
    c.height = CANVAS_H * dpr;
    c.style.width = W + 'px';
    c.style.height = CANVAS_H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function draw() {
    time++;
    stageTimer++;
    if (stageTimer >= STAGE_DURATION) {
      stageTimer = 0;
      activeStage = (activeStage + 1) % stages.length;
    }

    ctx.clearRect(0, 0, W, CANVAS_H);

    const n = stages.length;
    const totalGap = W * 0.06; // small gaps
    const boxW = Math.max(70, (W - totalGap * (n + 1)) / n);
    const gap = (W - n * boxW) / (n + 1);
    const cy = CANVAS_H / 2 - 10; // shift up slightly for annotation
    const boxH = 80;

    // Connection lines
    for (let i = 0; i < n - 1; i++) {
      const x1 = gap + i * (boxW + gap) + boxW;
      const x2 = gap + (i + 1) * (boxW + gap);
      const lineY = cy;

      // Line
      ctx.beginPath();
      ctx.moveTo(x1 + 2, lineY);
      ctx.lineTo(x2 - 6, lineY);
      ctx.strokeStyle = 'rgba(0,0,0,0.07)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Arrow
      ctx.beginPath();
      ctx.moveTo(x2 - 2, lineY);
      ctx.lineTo(x2 - 8, lineY - 4);
      ctx.lineTo(x2 - 8, lineY + 4);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fill();

      // Animated signal — only between previous active and current active
      if (i === activeStage - 1 || (activeStage === 0 && i === n - 2)) {
        const progress = stageTimer / STAGE_DURATION;
        const sx = x1 + 2 + (x2 - x1 - 8) * Math.min(progress * 2, 1);
        ctx.beginPath();
        ctx.arc(sx, lineY, 5, 0, Math.PI * 2);
        ctx.fillStyle = stages[i + 1].color;
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Stage boxes
    for (let i = 0; i < n; i++) {
      const x = gap + i * (boxW + gap);
      const s = stages[i];
      const isActive = i === activeStage;
      const isPast = (activeStage > 0 && i < activeStage) || (activeStage === 0 && i === 0);

      // Box background
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, cy - boxH / 2, boxW, boxH, 10);
      else ctx.rect(x, cy - boxH / 2, boxW, boxH);

      if (isActive) {
        ctx.fillStyle = s.color + '10';
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
      } else if (isPast) {
        ctx.fillStyle = 'rgba(15,118,110,0.03)';
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.01)';
        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;
      }
      ctx.fill();
      ctx.stroke();

      // Label (inside box, top)
      ctx.fillStyle = isActive ? s.color : '#57534e';
      ctx.font = `${isActive ? '700' : '600'} ${boxW > 90 ? 12 : 10}px "JetBrains Mono",monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(s.label, x + boxW / 2, cy - 4);

      // Sub-label (inside box, bottom)
      ctx.fillStyle = isActive ? s.color : '#a8a29e';
      ctx.font = `${isActive ? '500' : '400'} ${boxW > 90 ? 10 : 8}px "Inter",system-ui,sans-serif`;
      ctx.fillText(s.sub, x + boxW / 2, cy + 14);

      // Step number (top-left corner inside box)
      ctx.fillStyle = isActive ? s.color : '#d4d0c8';
      ctx.font = '600 9px "JetBrains Mono",monospace';
      ctx.textAlign = 'left';
      ctx.fillText(i + 1, x + 8, cy - boxH / 2 + 14);
      ctx.textAlign = 'left';
    }

    // Bottom annotation
    ctx.fillStyle = '#a8a29e';
    ctx.font = '500 11px "Inter",system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('↻ This entire pipeline repeats ~270 times for a typical response (one pass per token)', W / 2, CANVAS_H - 10);
    ctx.textAlign = 'left';

    requestAnimationFrame(draw);
  }
  draw();
})();
