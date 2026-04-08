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
  const duration = 6; // seconds for full rotation
  const W = 620, H = 340;

  // How tall one frame is in SVG units (px per row * rows)
  const lineHeight = 12;
  const frameH = rows * lineHeight;

  const frames = [];
  for (let f = 0; f < frameCount; f++) {
    const A = (f / frameCount) * Math.PI * 4;
    const B = (f / frameCount) * Math.PI * 2;
    frames.push(renderDonut(A, B, cols, rows));
  }

  // Stack all frames vertically — film strip
  // We duplicate the first frame at the end so the loop is seamless
  const allFrames = [...frames, frames[0]];
  const totalH = allFrames.length * frameH;

  const frameEls = allFrames.map((frame, i) => {
    const yOffset = i * frameH;
    const tspans = frame.split('\n').map((line, j) => {
      const escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<tspan x="0" dy="${j === 0 ? '0' : `${lineHeight}px`}">${escaped}</tspan>`;
    }).join('');
    return `<text y="${yOffset + lineHeight}">${tspans}</text>`;
  }).join('\n');

  // Animate translateY from 0 to -frameH*frameCount
  // steps(frameCount, end) snaps between frames with no sub-frame interpolation
  // The duplicated last frame means at t=100% we're back at frame 0 visually
  const totalScroll = frameCount * frameH;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <clipPath id="clip">
    <rect x="0" y="0" width="460" height="${frameH}"/>
  </clipPath>
  <style>
    .strip {
      animation: scroll ${duration}s steps(${frameCount}, end) infinite;
    }
    @keyframes scroll {
      from { transform: translateY(0); }
      to   { transform: translateY(-${totalScroll}px); }
    }
    text {
      font-family: monospace;
      font-size: 10px;
      fill: #e6a030;
      white-space: pre;
    }
    .label {
      font-size: 15px;
      font-weight: bold;
      fill: #e6edf3;
      animation: none;
    }
  </style>
</defs>
<rect width="${W}" height="${H}" fill="#0d1117" rx="12"/>
<text class="label" x="30" y="50">Hi, I'm Thomas</text>
<text class="label" x="340" y="310">I like to make things</text>
<text class="label" x="30" y="310">I like lego too</text>
<g transform="translate(75, 65)" clip-path="url(#clip)">
  <g class="strip">
${frameEls}
  </g>
</g>
</svg>`;
}

fs.writeFileSync('donut.svg', generateSVG());
console.log('donut.svg generated — size:', fs.statSync('donut.svg').size, 'bytes');