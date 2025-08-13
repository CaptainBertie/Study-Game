#!/usr/bin/env python3
import random
from pathlib import Path
from typing import List, Tuple
from PIL import Image, ImageDraw, ImageFilter, ImageFont


def find_font(candidates: List[str]) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in candidates:
        p = Path(path)
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size=1)
            except Exception:
                continue
    return ImageFont.load_default()


def create_cloud_icon(output_path: Path, size: int = 1024) -> None:
    random.seed(1130)
    img = Image.new("RGBA", (size, size), (20, 24, 33, 255))
    draw = ImageDraw.Draw(img, "RGBA")

    # Pastel palette
    colors: List[Tuple[int, int, int]] = [
        (99, 102, 241),   # indigo
        (168, 85, 247),   # purple
        (236, 72, 153),   # pink
        (234, 179, 8),    # amber
        (34, 197, 94),    # green
        (14, 165, 233),   # sky
        (59, 130, 246),   # blue
        (244, 114, 182),  # fuchsia
    ]

    # Draw overlapping translucent circles for a "color clouds" effect
    for _ in range(220):
        r = random.randint(size // 16, size // 4)
        x = random.randint(-r // 2, size - 1 + r // 2)
        y = random.randint(-r // 2, size - 1 + r // 2)
        color = random.choice(colors)
        alpha = random.randint(28, 70)
        bbox = (x - r, y - r, x + r, y + r)
        draw.ellipse(bbox, fill=(color[0], color[1], color[2], alpha))

    img = img.filter(ImageFilter.GaussianBlur(radius=size * 0.02))

    # Add text "Study Quiz"
    # Try common system fonts, fall back to default
    font_candidates = [
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/SFNSDisplay.ttf",
        "/Library/Fonts/Arial Bold.ttf",
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica.ttc",
    ]
    base_font = find_font(font_candidates)

    # Scale font to fit roughly within 70% width
    text = "Study Quiz"
    target_width = int(size * 0.74)
    font_size = int(size * 0.16)

    # Recreate font with computed size if possible
    if isinstance(base_font, ImageFont.FreeTypeFont):
        font = ImageFont.truetype(base_font.path, font_size)
    else:
        font = base_font

    # Adjust font size iteratively
    for _ in range(20):
        bbox = font.getbbox(text)
        text_w = bbox[2] - bbox[0]
        if text_w > target_width and isinstance(base_font, ImageFont.FreeTypeFont):
            font_size = int(font_size * 0.92)
            font = ImageFont.truetype(base_font.path, font_size)
        else:
            break

    bbox = font.getbbox(text)
    text_w, text_h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - text_w) // 2
    y = int(size * 0.58) - text_h // 2

    # Draw soft shadow
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    for dx, dy, alpha in [
        (0, 0, 220), (1, 1, 180), (2, 2, 120), (3, 3, 80)
    ]:
        sdraw.text((x + dx, y + dy), text, font=font, fill=(0, 0, 0, alpha))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=size * 0.01))
    img = Image.alpha_composite(img, shadow)

    # Draw main text
    draw = ImageDraw.Draw(img, "RGBA")
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 245))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path)


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    out = root / "src-tauri" / "icons" / "icon-1024.png"
    create_cloud_icon(out, size=1024)
    print(f"Wrote {out}")


