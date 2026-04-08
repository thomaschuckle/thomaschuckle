#!/usr/bin/env python3
"""
Generates an animated GIF of a spinning ASCII donut.
Run this locally or in a GitHub Action to produce donut.gif.
"""

import math
import struct
import os
from PIL import Image, ImageDraw, ImageFont

# ── Donut renderer ────────────────────────────────────────────────────────────

CHARS = '.,-~:;=!*#$@'

def render_frame(A, B, cols=44, rows=22):
    R1, R2, K2 = 1.0, 2.0, 5.0
    K1 = cols * K2 * 3 / (8 * (R1 + R2))
    zbuf = [0.0] * (cols * rows)
    out  = [' '] * (cols * rows)
    sinA, cosA = math.sin(A), math.cos(A)
    sinB, cosB = math.sin(B), math.cos(B)

    theta = 0.0
    while theta < math.pi * 2:
        sinT, cosT = math.sin(theta), math.cos(theta)
        phi = 0.0
        while phi < math.pi * 2:
            sinP, cosP = math.sin(phi), math.cos(phi)
            cx = R2 + R1 * cosT
            cy = R1 * sinT
            x = cx * (cosB * cosP + sinA * sinB * sinP) - cy * cosA * sinB
            y = cx * (sinB * cosP - sinA * cosB * sinP) + cy * cosA * cosB
            z = K2 + cosA * cx * sinP + cy * sinA
            ooz = 1.0 / z
            px = int(cols / 2 + K1 * ooz * x)
            py = int(rows / 2 - K1 * ooz * y * 0.5)
            if 0 <= px < cols and 0 <= py < rows:
                L = (cosP * cosT * sinB - cosA * cosT * sinP - sinA * sinT
                     + cosB * (cosA * sinT - cosT * sinA * sinP))
                if L > 0 and ooz > zbuf[py * cols + px]:
                    zbuf[py * cols + px] = ooz
                    idx = min(int(L * 8), len(CHARS) - 1)
                    out[py * cols + px] = CHARS[idx]
            phi += 0.02
        theta += 0.07

    lines = []
    for j in range(rows):
        lines.append(''.join(out[j * cols:(j + 1) * cols]))
    return lines

# ── Image rendering ───────────────────────────────────────────────────────────

BG      = (13, 17, 23)       # #0d1117  GitHub dark background
AMBER   = (255, 105, 180)    # donut colour (pink)
WHITE   = (230, 237, 243)    # label colour

# Canvas size
W, H    = 620, 340

# Donut text block position
DOT_X   = 75
DOT_Y   = 70
CH_W    = 6   # pixels per character (monospace 10 px)
CH_H    = 12  # pixels per line

# Try to load a real monospace font; fall back to default
def load_font(size):
    candidates = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf',
        '/System/Library/Fonts/Menlo.ttc',
        'C:/Windows/Fonts/consola.ttf',
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

MONO_FONT  = load_font(10)
LABEL_FONT = load_font(14)

LABELS = [
    (30,  32,  "Hi, I'm Thomas"),
    (30,  310, "I like to make things"),
]

def render_image(lines):
    img  = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Draw rounded rectangle background (PIL >= 8.2)
    try:
        draw.rounded_rectangle([0, 0, W-1, H-1], radius=12, fill=BG)
    except AttributeError:
        draw.rectangle([0, 0, W-1, H-1], fill=BG)

    # Labels
    for x, y, text in LABELS:
        draw.text((x, y), text, font=LABEL_FONT, fill=WHITE)

    # Donut ASCII art
    for row_i, line in enumerate(lines):
        y = DOT_Y + row_i * CH_H
        draw.text((DOT_X, y), line, font=MONO_FONT, fill=AMBER)

    return img

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    frame_count = 60
    frames = []

    print(f"Rendering {frame_count} frames...")
    for f in range(frame_count):
        A = (f / frame_count) * math.pi * 4
        B = (f / frame_count) * math.pi * 2
        lines = render_frame(A, B)
        img   = render_image(lines)
        frames.append(img)
        if (f + 1) % 10 == 0:
            print(f"  {f + 1}/{frame_count}")

    # duration per frame in centiseconds (100cs = 1s)
    # 60 frames over 6 seconds = 100ms each
    frame_ms = 100  # ms
    frame_cs = frame_ms // 10

    print("Saving donut.gif ...")
    frames[0].save(
        'donut.gif',
        save_all=True,
        append_images=frames[1:],
        duration=frame_ms,
        loop=0,          # 0 = loop forever
        optimize=False,
    )

    size_kb = os.path.getsize('donut.gif') // 1024
    print(f"Done! donut.gif is {size_kb} KB")

if __name__ == '__main__':
    main()