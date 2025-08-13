#!/usr/bin/env python3
import random
from pathlib import Path
from typing import List, Tuple, Optional
from PIL import Image, ImageDraw, ImageFilter, ImageFont


def find_font_path(candidates: List[str]) -> Optional[str]:
    for path in candidates:
        p = Path(path)
        if p.exists():
            try:
                ImageFont.truetype(str(p), size=12)
                return str(p)
            except Exception:
                continue
    return None


def create_sq_monogram_icon(output_path: Path, size: int = 1024) -> None:
    random.seed(1130)
    # Base transparent canvas
    base = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(base, "RGBA")

    # Blue/Purple palette to match app UI
    colors: List[Tuple[int, int, int]] = [
        (59, 130, 246),   # blue
        (99, 102, 241),   # indigo
        (168, 85, 247),   # purple
        (147, 51, 234),   # violet
        (14, 165, 233),   # sky
    ]

    # Draw overlapping translucent circles for clouds
    for _ in range(260):
        r = random.randint(size // 18, size // 4)
        x = random.randint(-r // 2, size - 1 + r // 2)
        y = random.randint(-r // 2, size - 1 + r // 2)
        color = random.choice(colors)
        alpha = random.randint(42, 82)
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(color[0], color[1], color[2], alpha))

    cloud = base.filter(ImageFilter.GaussianBlur(radius=size * 0.03))

    # Rounded-square mask (Apple-style)
    radius = int(size * 0.18)
    mask = Image.new("L", (size, size), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)

    # Apply mask onto a dark base to ensure edges are clean
    bg = Image.new("RGBA", (size, size), (20, 24, 33, 255))
    bg = Image.composite(cloud, bg, mask)

    # Prepare fonts
    font_candidates = [
        "/System/Library/Fonts/SFNSRounded.ttf",
        "/System/Library/Fonts/SFNSDisplay.ttf",
        "/Library/Fonts/Arial Bold.ttf",
        "/Library/Fonts/Arial Black.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica.ttc",
    ]
    font_path = find_font_path(font_candidates)
    if font_path is None:
        # fallback to default bitmap font
        font_s = ImageFont.load_default()
        font_q = ImageFont.load_default()
    else:
        # Size letters to fill the square with overlap
        s_size = int(size * 0.56)
        q_size = int(size * 0.56)
        font_s = ImageFont.truetype(font_path, s_size)
        font_q = ImageFont.truetype(font_path, q_size)

    # Positions to mimic interlocked monogram (Padres-like)
    s_bbox = font_s.getbbox("S")
    q_bbox = font_q.getbbox("Q")
    s_w, s_h = s_bbox[2] - s_bbox[0], s_bbox[3] - s_bbox[1]
    q_w, q_h = q_bbox[2] - q_bbox[0], q_bbox[3] - q_bbox[1]

    # Offset S slightly left/up, Q slightly right/down to interlock
    s_x = int(size * 0.18)
    s_y = int(size * 0.18)
    q_x = int(size * 0.34)
    q_y = int(size * 0.30)

    # Shadow layer for depth
    text_shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ts = ImageDraw.Draw(text_shadow)
    for dx, dy, a in [(2, 2, 170), (3, 3, 120), (4, 4, 80)]:
        ts.text((s_x + dx, s_y + dy), "S", font=font_s, fill=(0, 0, 0, a))
        ts.text((q_x + dx, q_y + dy), "Q", font=font_q, fill=(0, 0, 0, a))
    text_shadow = text_shadow.filter(ImageFilter.GaussianBlur(radius=size * 0.01))
    bg = Image.alpha_composite(bg, text_shadow)

    # Draw letter strokes (thin outline) + white fill
    stroke = int(max(2, size * 0.01))
    draw_fg = ImageDraw.Draw(bg, "RGBA")
    draw_fg.text((s_x, s_y), "S", font=font_s, fill=(255, 255, 255, 255), stroke_width=stroke, stroke_fill=(0, 0, 0, 110))
    draw_fg.text((q_x, q_y), "Q", font=font_q, fill=(255, 255, 255, 255), stroke_width=stroke, stroke_fill=(0, 0, 0, 110))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    bg.save(output_path)


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    out = root / "src-tauri" / "icons" / "icon-1024.png"
    create_sq_monogram_icon(out, size=1024)
    print(f"Wrote {out}")


