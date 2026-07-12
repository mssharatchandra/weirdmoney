#!/usr/bin/env python3
"""Generate the canonical, scannable WYRD launch QR poster."""

from __future__ import annotations

from pathlib import Path

import qrcode
from PIL import Image, ImageDraw, ImageFont

URL = "https://wyrd-money.vercel.app"
ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = [
    ROOT / "landing" / "public" / "wyrd-qr.png",
    ROOT / "assets" / "wyrd-qr.png",
]

INK = "#090909"
PAPER = "#F2EFDF"
ACID = "#D7FF3F"
HOT = "#FF4F24"


def font(size: int, heavy: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = (
        ["/System/Library/Fonts/Supplemental/Arial Black.ttf"] if heavy else []
    ) + [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def fit_text(draw: ImageDraw.ImageDraw, text: str, max_width: int, start: int) -> ImageFont.ImageFont:
    size = start
    while size > 20:
        candidate = font(size, heavy=True)
        if draw.textbbox((0, 0), text, font=candidate)[2] <= max_width:
            return candidate
        size -= 2
    return font(20, heavy=True)


def generate() -> None:
    width, height = 1400, 1800
    poster = Image.new("RGB", (width, height), ACID)
    draw = ImageDraw.Draw(poster)

    # Editorial chaos, carefully kept outside the QR quiet zone.
    draw.polygon([(0, 0), (1400, 0), (1400, 470), (0, 560)], fill=INK)
    draw.rectangle((0, 1570, 1400, 1800), fill=INK)
    draw.rectangle((0, 525, 92, 1570), fill=HOT)
    for radius in (80, 125, 170):
        draw.ellipse((1170 - radius, 420 - radius, 1170 + radius, 420 + radius), outline=HOT, width=8)
    draw.line((1060, 420, 1280, 420), fill=HOT, width=8)
    draw.line((1170, 310, 1170, 530), fill=HOT, width=8)

    title_one = "SCAN THE INTERNET'S"
    title_two = "WEIRD MONEY."
    draw.text((95, 74), title_one, font=fit_text(draw, title_one, 1160, 98), fill=PAPER)
    draw.text((90, 184), title_two, font=fit_text(draw, title_two, 1160, 154), fill=ACID)
    draw.text((98, 375), "REAL MONEY. DEEPLY UNREAL BETS.", font=font(35, heavy=True), fill=HOT)
    draw.text((98, 432), "COMMENTARY, NOT FINANCIAL ADVICE.", font=font(23), fill="#929187")

    # The actual QR uses maximum error correction and an untouched quiet zone.
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=18,
        border=5,
    )
    qr.add_data(URL)
    qr.make(fit=True)
    qr_image = qr.make_image(fill_color=INK, back_color=PAPER).convert("RGB")
    qr_image = qr_image.resize((980, 980), Image.Resampling.NEAREST)

    qr_x, qr_y = 230, 570
    draw.rectangle((qr_x + 24, qr_y + 24, qr_x + 1004, qr_y + 1004), fill=HOT)
    draw.rectangle((qr_x - 22, qr_y - 22, qr_x + 1002, qr_y + 1002), fill=PAPER)
    poster.paste(qr_image, (qr_x, qr_y))

    vertical = "ODDS / MEMES / REGRETS"
    vertical_layer = Image.new("RGBA", (900, 80), (0, 0, 0, 0))
    vertical_draw = ImageDraw.Draw(vertical_layer)
    vertical_draw.text((0, 10), vertical, font=font(28, heavy=True), fill=INK)
    vertical_layer = vertical_layer.rotate(90, expand=True)
    poster.paste(vertical_layer, (4, 665), vertical_layer)

    draw.text((90, 1615), "THE WEIRD INDEX IS LIVE", font=font(58, heavy=True), fill=PAPER)
    draw.text((92, 1692), "TEN MARKETS  ·  ZERO BETTING TIPS  ·  CURATED BY HERMES", font=font(23, heavy=True), fill=ACID)
    draw.text((92, 1740), URL, font=font(24), fill="#AAA89E")
    draw.text((1215, 1685), "◉", font=font(72, heavy=True), fill=HOT)

    for output in OUTPUTS:
        output.parent.mkdir(parents=True, exist_ok=True)
        poster.save(output, format="PNG", optimize=True)
        print(output)


if __name__ == "__main__":
    generate()
