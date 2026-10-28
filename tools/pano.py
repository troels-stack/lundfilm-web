#!/usr/bin/env python3
"""Prepare an Insta360 (equirectangular) photo for the site.

    python3 tools/pano.py <source image> <slug>

Writes:
  public/pano/<slug>.jpg    web version of the panorama (max 6000x3000, q82) for the 360 viewer
  public/images/<slug>.jpg  flat 3:2 thumbnail for the tile (a normal-looking view, not the stretched 2:1 image)

Prints JSON with the detected size so the caller can fill in data/road.json.
Needs Pillow and numpy.
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
PANO_MAX_W = 6000
THUMB_W, THUMB_H = 1800, 1200
THUMB_HFOV = 100  # degrees


def is_equirectangular(path):
    """True if the file looks like a 360 photo: GPano XMP metadata or a 2:1 frame of at least 4000 px."""
    raw = Path(path).read_bytes()[:512 * 1024]
    if b'GPano:ProjectionType' in raw and b'equirectangular' in raw:
        return True
    with Image.open(path) as im:
        w, h = im.size
    return w >= 4000 and abs(w / h - 2.0) < 0.02


def rectilinear(src, out_w, out_h, hfov_deg, yaw_deg=0.0, pitch_deg=0.0):
    """Render a normal perspective view from an equirectangular image (nearest-neighbour on a 2x grid, then downscaled)."""
    eq = np.asarray(src)
    H, W = eq.shape[:2]
    ss = 2
    w, h = out_w * ss, out_h * ss
    f = (w / 2) / math.tan(math.radians(hfov_deg) / 2)
    xs = np.arange(w) - w / 2 + 0.5
    ys = np.arange(h) - h / 2 + 0.5
    x, y = np.meshgrid(xs, ys)
    z = np.full_like(x, f)
    # pitch (around x axis), then yaw (around y axis)
    p, yw = math.radians(pitch_deg), math.radians(yaw_deg)
    y2 = y * math.cos(p) - z * math.sin(p)
    z2 = y * math.sin(p) + z * math.cos(p)
    x3 = x * math.cos(yw) + z2 * math.sin(yw)
    z3 = -x * math.sin(yw) + z2 * math.cos(yw)
    lon = np.arctan2(x3, z3)
    lat = np.arctan2(-y2, np.sqrt(x3 ** 2 + z3 ** 2))
    u = ((lon / (2 * math.pi) + 0.5) * W).astype(np.int64) % W
    v = np.clip(((0.5 - lat / math.pi) * H).astype(np.int64), 0, H - 1)
    out = Image.fromarray(eq[v, u])
    return out.resize((out_w, out_h), Image.LANCZOS)


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src_path, slug = sys.argv[1], sys.argv[2]
    with Image.open(src_path) as im:
        im = ImageOps.exif_transpose(im).convert('RGB')
        w, h = im.size
        if w > PANO_MAX_W:
            im = im.resize((PANO_MAX_W, round(h * PANO_MAX_W / w)), Image.LANCZOS)
        pano_out = ROOT / 'public' / 'pano' / f'{slug}.jpg'
        thumb_out = ROOT / 'public' / 'images' / f'{slug}.jpg'
        pano_out.parent.mkdir(parents=True, exist_ok=True)
        im.save(pano_out, 'JPEG', quality=82, progressive=True, optimize=True)
        thumb = rectilinear(im, THUMB_W, THUMB_H, THUMB_HFOV)
        thumb.save(thumb_out, 'JPEG', quality=82, progressive=True, optimize=True)
    print(json.dumps({
        'equirectangular': is_equirectangular(src_path),
        'source_size': [w, h],
        'pano': f'{slug}.jpg',
        'pano_bytes': pano_out.stat().st_size,
        'image': f'{slug}.jpg',
    }))


if __name__ == '__main__':
    main()
