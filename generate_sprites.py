#!/usr/bin/env python3
"""Generate placeholder pixel art NPC sprite sheets (48x64px, 3 frames x 4 dirs)."""

from PIL import Image
import os

T = (0, 0, 0, 0)

def rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4)) + (255,)

# 3 distinct characters
PALETTES = [
    # NPC 1: brown hair, blue shirt, navy pants
    {'H': '#3a2010', 'F': '#e8a87c', 'T': '#3a7bd5', 'P': '#1e3a5f', 'A': '#c8884c'},
    # NPC 2: black hair, red hoodie, dark pants
    {'H': '#1c1c1c', 'F': '#c87850', 'T': '#c0392b', 'P': '#2c3e50', 'A': '#a85030'},
    # NPC 3: blonde hair, teal shirt, brown pants
    {'H': '#d4a017', 'F': '#d4a574', 'T': '#16a085', 'P': '#6d4c41', 'A': '#b48010'},
]

FRAME_W, FRAME_H = 16, 16
SHEET_W, SHEET_H = FRAME_W * 3, FRAME_H * 4  # 48 x 64

def make_sheet(pal, out_path):
    img = Image.new('RGBA', (SHEET_W, SHEET_H), T)

    def p(col, row, x, y, key):
        cx, cy = col * FRAME_W + x, row * FRAME_H + y
        if 0 <= cx < SHEET_W and 0 <= cy < SHEET_H:
            img.putpixel((cx, cy), rgb(pal[key]))

    def fill(col, row, xs, ys, key):
        for y in ys:
            for x in xs:
                p(col, row, x, y, key)

    # ── head shapes per direction ─────────────────────────────────────────────

    def head_down(col, row):
        # Hair dome (rows 1-2)
        fill(col, row, range(5, 11), [1, 2], 'H')
        # Side hair + face (rows 3-5)
        for y in range(3, 6):
            p(col, row, 5,  y, 'H')
            p(col, row, 10, y, 'H')
            fill(col, row, range(6, 10), [y], 'F')
        # Chin / hair bottom (row 6)
        fill(col, row, range(5, 11), [6], 'H')

    def head_up(col, row):
        # Solid hair block (back of head)
        fill(col, row, range(5, 11), range(1, 7), 'H')

    def head_left(col, row):
        # Hair dome
        fill(col, row, range(5, 11), [1, 2], 'H')
        # Left hair side is thick (profile)
        fill(col, row, [5, 6], range(3, 7), 'H')
        # Face only on right portion
        fill(col, row, range(7, 11), range(3, 6), 'F')
        # Bottom hair
        fill(col, row, range(5, 11), [6], 'H')

    def head_right(col, row):
        fill(col, row, range(5, 11), [1, 2], 'H')
        fill(col, row, [9, 10], range(3, 7), 'H')
        fill(col, row, range(5, 9), range(3, 6), 'F')
        fill(col, row, range(5, 11), [6], 'H')

    # ── body (same for all directions) ───────────────────────────────────────

    def body(col, row):
        # Shoulders + torso
        fill(col, row, range(4, 12), range(7, 12), 'T')
        # Arms (slightly darker — reuse 'A' key)
        fill(col, row, [3, 4],   range(8, 11), 'A')
        fill(col, row, [11, 12], range(8, 11), 'A')

    # ── legs with walk cycle ──────────────────────────────────────────────────

    def legs(col, row, step=0):
        """step: 0=neutral, 1=left fwd, 2=right fwd"""
        lx = range(4, 7)
        rx = range(9, 12)
        if step == 0:
            fill(col, row, lx, range(12, 16), 'P')
            fill(col, row, rx, range(12, 16), 'P')
        elif step == 1:   # left leg forward (raised), right back
            fill(col, row, lx, range(11, 15), 'P')
            fill(col, row, rx, range(13, 16), 'P')
        else:             # right leg forward, left back
            fill(col, row, lx, range(13, 16), 'P')
            fill(col, row, rx, range(11, 15), 'P')

    # ── assemble all frames ───────────────────────────────────────────────────

    head_fns = [head_down, head_up, head_left, head_right]
    steps    = [0, 1, 2]          # frame 0=neutral, 1=left, 2=right

    for dir_row, head_fn in enumerate(head_fns):
        for frame_col, step in enumerate(steps):
            head_fn(frame_col, dir_row)
            body(frame_col, dir_row)
            legs(frame_col, dir_row, step)

    img.save(out_path)
    print(f"  {out_path}  ({SHEET_W}×{SHEET_H})")


# ── furniture sprites ─────────────────────────────────────────────────────────

def make_bookshelf(out_path):
    """16×32px wall bookshelf."""
    img = Image.new('RGBA', (16, 32), T)

    def p(x, y, c): img.putpixel((x, y), rgb(c))
    def fill(xs, ys, c):
        for y in ys:
            for x in xs:
                p(x, y, c)

    # Frame / wood
    fill(range(0, 16), range(0, 32), '#5c3d1e')
    # Back panel
    fill(range(1, 15), range(1, 31), '#3a2510')
    # Shelves (horizontal dividers)
    for sy in [9, 19]:
        fill(range(1, 15), [sy], '#6b4a28')
    # Books row 1 (y 2-8)
    book_colors = ['#c0392b','#2980b9','#27ae60','#f39c12','#8e44ad','#e74c3c','#16a085']
    bw = 2
    for i, bc in enumerate(book_colors):
        bx = 1 + i * bw
        if bx + bw <= 15:
            fill(range(bx, bx+bw), range(2, 9), bc)
    # Books row 2 (y 11-18)
    for i, bc in enumerate(book_colors[2:] + book_colors[:2]):
        bx = 1 + i * bw
        if bx + bw <= 15:
            fill(range(bx, bx+bw), range(11, 18), bc)
    # Books row 3 (y 21-30)
    for i, bc in enumerate(book_colors[1:] + [book_colors[0]]):
        bx = 1 + i * bw
        if bx + bw <= 15:
            fill(range(bx, bx+bw), range(21, 30), bc)

    img.save(out_path)
    print(f"  {out_path}  (16×32)")


def make_plant(out_path):
    """16×24px potted plant."""
    img = Image.new('RGBA', (16, 24), T)

    def p(x, y, c): img.putpixel((x, y), rgb(c))
    def fill(xs, ys, c):
        for y in ys:
            for x in xs:
                p(x, y, c)

    # Pot (y 16-23)
    fill(range(4, 12), range(16, 24), '#c0784a')
    fill(range(3, 13), [16, 17], '#d4885a')  # rim
    fill(range(5, 11), range(18, 23), '#a85a30')  # pot body shadow

    # Soil top
    fill(range(4, 12), [15], '#3d2b1a')

    # Leaves — 3 clusters
    leaf = '#27ae60'
    dark = '#1e8449'
    # Center cluster
    fill(range(5, 11), range(8, 15), leaf)
    # Left cluster
    fill(range(2, 7),  range(10, 15), leaf)
    fill(range(2, 5),  range(10, 13), dark)
    # Right cluster
    fill(range(9, 14), range(10, 15), leaf)
    fill(range(11,14), range(10, 13), dark)
    # Top highlight
    fill(range(6, 10), range(6, 10), '#2ecc71')

    img.save(out_path)
    print(f"  {out_path}  (16×24)")


def make_wall_art(out_path):
    """32×24px framed wall art."""
    img = Image.new('RGBA', (32, 24), T)

    def p(x, y, c): img.putpixel((x, y), rgb(c))
    def fill(xs, ys, c):
        for y in ys:
            for x in xs:
                p(x, y, c)

    # Frame border
    fill(range(0, 32), range(0, 24), '#5c3d1e')
    # Canvas interior
    fill(range(2, 30), range(2, 22), '#dce8f0')
    # Simple landscape painting
    # Sky
    fill(range(2, 30), range(2, 13), '#7eb8f7')
    # Sun
    fill(range(24, 28), range(3, 7), '#f7e157')
    # Hills
    hill = '#3a7a30'
    for x in range(2, 30):
        h = int(3 + 3 * abs(((x - 16) / 14) ** 2))
        fill([x], range(13 - h, 22), hill)
    # Darker foreground grass
    fill(range(2, 30), range(18, 22), '#2d6124')

    img.save(out_path)
    print(f"  {out_path}  (32×24)")


# ── run ───────────────────────────────────────────────────────────────────────

os.makedirs('sprites', exist_ok=True)

print("Generating NPC sprite sheets...")
for i, pal in enumerate(PALETTES):
    make_sheet(pal, f'sprites/npc-{i+1}.png')

print("\nGenerating furniture sprites...")
make_bookshelf('sprites/bookshelf.png')
make_plant('sprites/plant.png')
make_wall_art('sprites/wall-art.png')

print("\nAll done!")
