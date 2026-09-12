#!/usr/bin/env python3
"""Generate web assets from the archived originals; requires Pillow with WebP."""

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageOps, features


ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "_scrape" / "media"
PHOTOS = {
    "snow-light-sunset-road-traffic-night-232-pxhere-com.jpg": "carretera.webp",
    "Vehiculos-autoescuela2.jpg": "autoescuela.webp",
    "313b391a-d550-4c4a-91fe-1eec17c3ae69.jpg": "aula.webp",
    "5200277f-bc79-4521-8c44-b226f9bbf6da.jpg": "centro.webp",
    "takcanarias-camion-tacografo-vdo-edited.png": "tacografo.webp",
}
LOGO = "Logo-Takcanarias-nuevo.jpg"
NAVY = "#171e59"
Point = tuple[int, int]


def simplify(points: list[Point], tolerance: float = 0.55) -> list[Point]:
    """Ramer-Douglas-Peucker with distance to the finite line segment."""
    if len(points) <= 2:
        return points
    ax, ay = points[0]
    bx, by = points[-1]
    dx, dy = bx - ax, by - ay
    length_squared = dx * dx + dy * dy
    farthest, distance_squared = 0, 0.0
    for index, (x, y) in enumerate(points[1:-1], 1):
        t = max(0.0, min(1.0, ((x - ax) * dx + (y - ay) * dy) / length_squared)) if length_squared else 0.0
        distance = (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2
        if distance > distance_squared:
            farthest, distance_squared = index, distance
    if distance_squared <= tolerance * tolerance:
        return [points[0], points[-1]]
    return simplify(points[: farthest + 1], tolerance)[:-1] + simplify(points[farthest:], tolerance)


def trace(mask: Image.Image) -> list[list[Point]]:
    """Follow clockwise pixel edges; right turns separate diagonal contacts."""
    pixels = mask.load()
    width, height = mask.size
    edges: dict[Point, set[Point]] = {}
    for y in range(height):
        for x in range(width):
            if not pixels[x, y]:
                continue
            exposed = (
                (y == 0 or not pixels[x, y - 1], (x, y), (x + 1, y)),
                (x == width - 1 or not pixels[x + 1, y], (x + 1, y), (x + 1, y + 1)),
                (y == height - 1 or not pixels[x, y + 1], (x + 1, y + 1), (x, y + 1)),
                (x == 0 or not pixels[x - 1, y], (x, y + 1), (x, y)),
            )
            for visible, start, end in exposed:
                if visible:
                    edges.setdefault(start, set()).add(end)

    contours = []
    directions = {(1, 0): 0, (0, 1): 1, (-1, 0): 2, (0, -1): 3}
    turn_priority = {1: 0, 0: 1, 3: 2, 2: 3}
    while edges:
        start = min(edges)
        current = start
        direction = 0
        ring = [start]
        while True:
            candidates = edges[current]
            next_point = min(
                candidates,
                key=lambda p: turn_priority[
                    (directions[(p[0] - current[0], p[1] - current[1])] - direction) % 4
                ],
            )
            candidates.remove(next_point)
            if not candidates:
                del edges[current]
            direction = directions[(next_point[0] - current[0], next_point[1] - current[1])]
            current = next_point
            ring.append(current)
            if current == start:
                break

        # Split the closed ring before RDP so coincident endpoints do not collapse it.
        split = max(range(1, len(ring) - 1), key=lambda i: (ring[i][0] - start[0]) ** 2 + (ring[i][1] - start[1]) ** 2)
        simplified = simplify(ring[: split + 1])[:-1] + simplify(ring[split:])[:-1]
        contours.append(simplified if len(simplified) >= 3 else ring[:-1])
    return contours


def prepare_logo(destination: Path) -> None:
    with Image.open(MEDIA / LOGO) as source:
        source = source.convert("RGB")
        width, height = source.size
        mask = Image.new("L", source.size)
        # Reject white paper and the neutral grey shadow, keeping navy ink only.
        mask.putdata([
            255 if r < 150 and g < 150 and b - r > 15 and b - g > 10 else 0
            for r, g, b in source.get_flattened_data()
        ])
    contours = trace(mask)
    if not contours:
        raise ValueError("The logo blue-ink mask is empty")
    path = " ".join(
        "M" + " L".join(f"{x},{y}" for x, y in ring) + " Z"
        for ring in contours
    )
    (destination / "takcanarias.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}" role="img" aria-labelledby="title">\n'
        '  <title id="title">Takcanarias</title>\n'
        f'  <path fill="{NAVY}" fill-rule="evenodd" d="{path}"/>\n'
        '</svg>\n',
        encoding="utf-8",
    )

    # XOR implements the SVG even-odd fill, including counters inside letters.
    scale = 4
    alpha = Image.new("1", (width * scale, height * scale))
    for ring in contours:
        layer = Image.new("1", alpha.size)
        ImageDraw.Draw(layer).polygon([(x * scale, y * scale) for x, y in ring], fill=1)
        alpha = ImageChops.logical_xor(alpha, layer)
    logo = Image.new("RGBA", (width, height), NAVY)
    logo.putalpha(alpha.convert("L").resize(logo.size, Image.Resampling.LANCZOS))
    logo.save(destination / "logo.webp", "WEBP", lossless=True, method=6)

    # A simple geometric T, not a font glyph or a replacement master logo.
    favicon = Image.new("RGBA", (256, 256))
    ImageDraw.Draw(favicon).polygon(
        [(40, 40), (216, 40), (216, 84), (150, 84), (150, 216), (106, 216), (106, 84), (40, 84)],
        fill=NAVY,
    )
    favicon.resize((64, 64), Image.Resampling.LANCZOS).save(destination / "favicon.png")


def main() -> None:
    if not features.check("webp"):
        raise RuntimeError("Pillow must have WebP support; no dependencies are installed by this script")
    for name in [*PHOTOS, LOGO]:
        if not (MEDIA / name).is_file():
            raise FileNotFoundError(MEDIA / name)
    public = ROOT / "public"
    if not public.is_dir():
        raise NotADirectoryError(public)
    images, brand = public / "images", public / "brand"
    images.mkdir(exist_ok=True)
    brand.mkdir(exist_ok=True)
    for original, output in PHOTOS.items():
        with Image.open(MEDIA / original) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
            image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
            image.save(images / output, "WEBP", quality=85, method=6)
    prepare_logo(brand)
    for path in [*(images / name for name in PHOTOS.values()), brand / "takcanarias.svg", brand / "logo.webp", brand / "favicon.png"]:
        print(f"{path.relative_to(ROOT)}: {path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
