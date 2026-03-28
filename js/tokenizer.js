// ═══════════════ TOKENIZER ═══════════════
// Fix: NO height animation — that was causing the page to jump up/down
// Instead: fixed-height bars with CSS opacity pulse via classes
(function initTokenizer() {
  const tokContainer = document.getElementById('tokTokens');
  const embedContainer = document.getElementById('tokEmbeddings');
  if (!tokContainer || !embedContainer) return;

  const tokens = [
    { text: 'The', color: '#0f766e', id: 1000 },
    { text: '_cur', color: '#4338ca', id: 1137 },
    { text: 'ious', color: '#4338ca', id: 1274 },
    { text: '_cat', color: '#be123c', id: 1411 },
    { text: '_jumped', color: '#b45309', id: 1548 },
    { text: '_over', color: '#0369a1', id: 1685 },
    { text: '_the', color: '#0f766e', id: 1822 },
    { text: '_lazy', color: '#4338ca', id: 1959 },
    { text: '_dog', color: '#be123c', id: 2096 },
  ];

  // Render tokens
  tokContainer.innerHTML = tokens.map(t => `
    <div class="tok-token" style="border-color:${t.color};color:${t.color};background:${t.color}08">
      ${t.text}
      <span class="tok-id">${t.id}</span>
    </div>
  `).join('');

  // Render STATIC embedding bars (fixed heights, no animation = no page jumping)
  embedContainer.innerHTML = tokens.map((t, ti) => {
    const bars = Array.from({ length: 6 }, (_, bi) => {
      // Deterministic height based on token/dimension index
      const height = Math.floor(Math.abs(Math.sin(ti * 2.1 + bi * 1.7)) * 30 + 10);
      const opacity = (Math.abs(Math.sin(ti * 2.1 + bi * 1.7)) * 0.5 + 0.3).toFixed(2);
      return `<div class="bar" style="height:${height}px;background:${t.color};opacity:${opacity};width:7px;border-radius:2px"></div>`;
    }).join('');
    return `<div class="tok-embed-bar" title="${t.text} embedding vector">${bars}</div>`;
  }).join('');

  // NO requestAnimationFrame — static bars don't cause layout reflow
})();
