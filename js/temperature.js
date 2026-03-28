// ═══════════════ TEMPERATURE & SAMPLING ═══════════════
(function initTemp() {
  const c = document.getElementById('tempCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');

  const BG = '#f3efe8';
  const TEAL = '#0f766e';

  const vocab = [
    { word: 'mat', logit: 3.2 },
    { word: 'floor', logit: 2.8 },
    { word: 'table', logit: 2.1 },
    { word: 'bed', logit: 1.5 },
    { word: 'chair', logit: 1.2 },
    { word: 'rug', logit: 0.9 },
    { word: 'couch', logit: 0.6 },
    { word: 'roof', logit: 0.3 },
    { word: 'moon', logit: -0.5 },
    { word: 'code', logit: -1.0 },
    { word: 'happy', logit: -1.5 },
    { word: 'fish', logit: -2.0 },
  ];

  let temperature = 0.7, topK = 10, topP = 0.9;

  function resize() { c.width = c.parentElement.offsetWidth; c.height = 480; drawTemp(); }
  window.addEventListener('resize', resize);
  resize();

  document.getElementById('tempSlider')?.addEventListener('input', e => { temperature = +e.target.value / 100; document.getElementById('tempVal').textContent = temperature.toFixed(2); drawTemp(); });
  document.getElementById('topkSlider')?.addEventListener('input', e => { topK = +e.target.value; document.getElementById('topkVal').textContent = topK; drawTemp(); });
  document.getElementById('toppSlider')?.addEventListener('input', e => { topP = +e.target.value / 100; document.getElementById('toppVal').textContent = topP.toFixed(2); drawTemp(); });

  function softmax(logits, temp) {
    const scaled = logits.map(l => l / Math.max(temp, 0.01));
    const mx = Math.max(...scaled);
    const exps = scaled.map(s => Math.exp(s - mx));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
  }

  function drawTemp() {
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);

    const probs = softmax(vocab.map(v => v.logit), temperature);

    // Apply top-k
    const sorted = probs.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
    const topKSet = new Set(sorted.slice(0, topK).map(s => s.i));

    // Apply top-p
    let cumP = 0;
    const topPSet = new Set();
    for (const s of sorted) { if (cumP >= topP) break; topPSet.add(s.i); cumP += s.p; }

    // ─── Layout ───
    const barW = Math.min(50, (w - 80) / vocab.length - 6);
    const gap = 6;
    const totalW = vocab.length * (barW + gap) - gap;
    const startX = (w - totalW) / 2;
    const maxBarH = h - 200;
    const baseY = h - 100;
    const maxProb = Math.max(...probs);

    // ─── Title with prompt ───
    ctx.fillStyle = '#1c1917'; ctx.font = '600 14px "Inter",system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Prompt: "The cat sat on the ___"', w / 2, 28);
    ctx.fillStyle = '#78716c'; ctx.font = '400 12px "Inter",system-ui';
    ctx.fillText('Which word should come next? Here are the probabilities:', w / 2, 50);

    // ─── Temperature effect label ───
    let tempLabel = 'Balanced';
    if (temperature < 0.3) tempLabel = '🎯 Very focused — almost always picks "mat"';
    else if (temperature < 0.6) tempLabel = '🎯 Focused — strongly prefers top words';
    else if (temperature < 1.0) tempLabel = '⚖️ Balanced — mix of likely words';
    else if (temperature < 1.5) tempLabel = '🎲 Creative — more variety in choices';
    else tempLabel = '🌀 Very random — even unlikely words get picked';

    ctx.fillStyle = '#57534e'; ctx.font = '500 11px "Inter",system-ui';
    ctx.fillText(tempLabel, w / 2, 70);

    // ─── Draw bars ───
    for (let i = 0; i < vocab.length; i++) {
      const x = startX + i * (barW + gap);
      const prob = probs[i];
      const barH = (prob / maxProb) * maxBarH * 0.75;
      const inK = topKSet.has(i), inP = topPSet.has(i);
      const included = inK && inP;

      // Bar
      if (included) {
        const intensity = 0.3 + (prob / maxProb) * 0.7;
        ctx.fillStyle = `rgba(15,118,110,${intensity})`;
      } else {
        ctx.fillStyle = 'rgba(168,162,158,0.12)';
      }
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, baseY - barH, barW, barH, [4, 4, 0, 0]);
      else ctx.rect(x, baseY - barH, barW, barH);
      ctx.fill();

      // Border for included
      if (included) {
        ctx.strokeStyle = 'rgba(15,118,110,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Probability label above bar
      if (prob > 0.005) {
        ctx.fillStyle = included ? '#0f766e' : '#c4c0b8';
        ctx.font = `${included ? '600' : '400'} ${barW > 35 ? 11 : 9}px "JetBrains Mono",monospace`;
        ctx.textAlign = 'center';
        ctx.fillText((prob * 100).toFixed(1) + '%', x + barW / 2, baseY - barH - 6);
      }

      // Word label below
      ctx.fillStyle = included ? '#1c1917' : '#c4c0b8';
      ctx.font = `${included ? '600' : '400'} ${barW > 35 ? 12 : 10}px "JetBrains Mono",monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(vocab[i].word, x + barW / 2, baseY + 16);

      // Strikethrough for excluded
      if (!included && prob > 0.003) {
        ctx.strokeStyle = 'rgba(190,18,60,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 2, baseY + 10);
        ctx.lineTo(x + barW - 2, baseY + 10);
        ctx.stroke();
      }

      ctx.textAlign = 'left';
    }

    // ─── Annotation: "sampled" word (highest prob among included) ───
    const bestIncluded = sorted.find(s => topKSet.has(s.i) && topPSet.has(s.i));
    if (bestIncluded) {
      const bx = startX + bestIncluded.i * (barW + gap) + barW / 2;
      const barH = (probs[bestIncluded.i] / maxProb) * maxBarH * 0.75;
      // Arrow pointing down to the bar
      ctx.fillStyle = '#b45309';
      ctx.font = '600 11px "Inter",system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('▼ most likely', bx, baseY - barH - 20);
      ctx.textAlign = 'left';
    }

    // ─── Bottom explanation row ───
    const ey = baseY + 40;
    ctx.fillStyle = '#78716c'; ctx.font = '500 11px "Inter",system-ui'; ctx.textAlign = 'left';

    // Included count
    const incCount = vocab.filter((_, i) => topKSet.has(i) && topPSet.has(i)).length;
    ctx.fillStyle = TEAL; ctx.fillRect(15, ey, 10, 10);
    ctx.fillStyle = '#1c1917'; ctx.fillText(`${incCount} words included in sampling pool`, 30, ey + 9);

    ctx.fillStyle = '#d4d0c8'; ctx.fillRect(15, ey + 18, 10, 10);
    ctx.fillStyle = '#78716c'; ctx.fillText(`${vocab.length - incCount} excluded by Top-K (${topK}) and Top-P (${topP.toFixed(2)})`, 30, ey + 27);

    // Update readout
    const el = document.getElementById('tempReadout');
    if (el) {
      el.innerHTML = `Temp: <strong>${temperature.toFixed(2)}</strong> | Top-K: <strong>${topK}</strong> | Top-P: <strong>${topP.toFixed(2)}</strong> → <strong>${incCount}</strong> candidate words. ${temperature < 0.3 ? '"mat" gets >90% probability.' : temperature > 1.2 ? 'Even unlikely words have a chance!' : 'Top words dominate but variety is possible.'}`;
    }
  }
})();
