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
    # Transparent canvas only (no background)
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    # Prepare fonts
    font_candidates = [
        "/System/Library/Fonts/SFNSRounded.ttf",
        "/System/Library/Fonts/SFNSDisplay.ttf",
        "/Library/Fonts/Arial Black.ttf",
        "/Library/Fonts/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica.ttc",
    ]
    font_path = find_font_path(font_candidates)
    if font_path is None:
        # fallback to default bitmap font
        font_s = ImageFont.load_default()
        font_q = ImageFont.load_default()
    else:
        # Start with large sizes and iteratively fit inside the canvas
        scale = 0.8
        margin = int(size * 0.06)
        while True:
            s_size = max(10, int(size * scale))
            q_size = max(10, int(size * scale))
            font_s = ImageFont.truetype(font_path, s_size)
            font_q = ImageFont.truetype(font_path, q_size)
            # Measure with intended offsets (Padres-like)
            s_bbox = font_s.getbbox("S")
            q_bbox = font_q.getbbox("Q")
            s_w, s_h = s_bbox[2] - s_bbox[0], s_bbox[3] - s_bbox[1]
            q_w, q_h = q_bbox[2] - q_bbox[0], q_bbox[3] - q_bbox[1]
            s_x = (size - s_w) // 2 - int(size * 0.08)
            s_y = (size - s_h) // 2 - int(size * 0.06)
            q_x = (size - q_w) // 2 + int(size * 0.08)
            q_y = (size - q_h) // 2 + int(size * 0.06)
            left = min(s_x, q_x)
            top = min(s_y, q_y)
            right = max(s_x + s_w, q_x + q_w)
            bottom = max(s_y + s_h, q_y + q_h)
            if right - left <= size - margin and bottom - top <= size - margin and left >= 0 - margin and top >= 0 - margin:
                break
            scale *= 0.96

    # Positions to mimic interlocked monogram (Padres-like)
    s_bbox = font_s.getbbox("S")
    q_bbox = font_q.getbbox("Q")
    s_w, s_h = s_bbox[2] - s_bbox[0], s_bbox[3] - s_bbox[1]
    q_w, q_h = q_bbox[2] - q_bbox[0], q_bbox[3] - q_bbox[1]

    # Compute centered positions then offset to interlock (Padres-like)
    s_x = (size - s_w) // 2 - int(size * 0.08)
    s_y = (size - s_h) // 2 - int(size * 0.06)
    q_x = (size - q_w) // 2 + int(size * 0.08)
    q_y = (size - q_h) // 2 + int(size * 0.06)

    # No background, minimal or no shadow to keep transparency clean

    # Draw letter strokes (thin outline) + white fill
    draw_fg = ImageDraw.Draw(bg, "RGBA")
    stroke = max(3, int(size * 0.05))
    draw_fg.text((s_x, s_y), "S", font=font_s, fill=(255, 255, 255, 255), stroke_width=stroke, stroke_fill=(0, 0, 0, 255))
    draw_fg.text((q_x, q_y), "Q", font=font_q, fill=(255, 255, 255, 255), stroke_width=stroke, stroke_fill=(0, 0, 0, 255))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    bg.save(output_path)


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    out = root / "src-tauri" / "icons" / "icon-1024.png"
    create_sq_monogram_icon(out, size=1024)
    print(f"Wrote {out}")


