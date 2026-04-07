const fs = require('fs');

function renderDonut(A, B, cols, rows) {
  const chars = '.,-~:;=!*#$@';
  const zbuf = new Float32Array(cols * rows).fill(0);
  const output = new Array(cols * rows).fill(' ');
  const sinA = Math.sin(A), cosA = Math.cos(A);
  const sinB = Math.sin(B), cosB = Math.cos(B);
  const R1 = 1, R2 = 2, K2 = 5;
  const K1 = cols * K2 * 3 / (8 * (R1 + R2));

  for (let theta = 0; theta < Math.PI * 2; theta += 0.07) {
    const sinT = Math.sin(theta), cosT = Math.cos(theta);
    for (let phi = 0; phi < Math.PI * 2; phi += 0.02) {
      const sinP = Math.sin(phi), cosP = Math.cos(phi);
      const cx = R2 + R1 * cosT, cy = R1 * sinT;
      const x = cx * (cosB * cosP + sinA * sinB * sinP) - cy * cosA * sinB;
      const y = cx * (sinB * cosP - sinA * cosB * sinP) + cy * cosA * cosB;
      const z = K2 + cosA * cx * sinP + cy * sinA;
      const ooz = 1 / z;
      const px = Math.floor(cols / 2 + K1 * ooz * x);
      const py = Math.floor(rows / 2 - K1 * ooz * y * 0.5);
      if (px >= 0 && px < cols && py >= 0 && py < rows) {
        const L = cosP * cosT * sinB - cosA * cosT * sinP - sinA * sinT
                + cosB * (cosA * sinT - cosT * sinA * sinP);
        if (L > 0 && ooz > zbuf[py * cols + px]) {
          zbuf[py * cols + px] = ooz;
          output[py * cols + px] = chars[Math.min(Math.floor(L * 8), chars.length - 1)];
        }
      }
    }
  }

  let result = '';
  for (let j = 0; j < rows; j++) {
    result += output.slice(j * cols, j * cols + cols).join('') + '\n';
  }
  return result.trimEnd();
}

function generateSVG() {
  const cols = 44, rows = 22;
  const frameCount = 60;
  const duration = 6; // seconds per full rotation — feels smooth and snappy
  const W = 620, H = 340;

  const frames = [];
  for (let f = 0; f < frameCount; f++) {
    const A = (f / frameCount) * Math.PI * 4; // 2 full spins of A per loop
    const B = (f / frameCount) * Math.PI * 2;
    frames.push(renderDonut(A, B, cols, rows));
  }

  const n = frames.length;

  // One @keyframes block per frame: opacity 1 only during its slice
  const keyframeBlocks = frames.map((_, i) => {
    const p0 = ((i / n) * 100).toFixed(4);
    const p1 = (((i + 1) / n) * 100).toFixed(4);
    const before = (parseFloat(p0) === 0 ? '0' : (parseFloat(p0) - 0.0001).toFixed(4));
    const after  = (parseFloat(p1) - 0.0001).toFixed(4);
    return `@keyframes kf${i}{0%{opacity:0}${before}%{opacity:0}${p0}%{opacity:1}${after}%{opacity:1}${p1}%{opacity:0}100%{opacity:0}}`;
  }).join('');

  const animRules = frames.map((_, i) => {
    const delay = -((i / n) * duration).toFixed(4);
    return `.f${i}{animation:kf${i} ${duration}s steps(1,end) infinite;animation-delay:${delay}s}`;
  }).join('');

  const frameEls = frames.map((frame, i) => {
    const tspans = frame.split('\n').map((line, j) => {
      const escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<tspan x="0" dy="${j === 0 ? '0' : '1.2em'}">${escaped}</tspan>`;
    }).join('');
    return `<text class="frame f${i}">${tspans}</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#0d1117" rx="12"/>
<style>
.frame{font-family:monospace;font-size:10px;fill:#e6a030;opacity:0;white-space:pre}
.label{font-family:monospace;font-size:15px;font-weight:bold;fill:#e6edf3}
${keyframeBlocks}
${animRules}
</style>
<text class="label" x="30" y="50">Hi, I'm Thomas</text>
<text class="label" x="340" y="310">I like to make things</text>
<text class="label" x="30" y="310">I like lego too</text>
<g transform="translate(75, 65)" font-family="monospace" font-size="10" fill="#e6a030">
${frameEls}
</g>
</svg>`;
}

fs.writeFileSync('donut.svg', generateSVG());
console.log('donut.svg generated successfully');