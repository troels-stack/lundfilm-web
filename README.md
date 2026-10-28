# lundfilm.com

Website for Lundfilm ApS. Static site with no dependencies.

## Build

```
node build.js
```

Generates `dist/` from:

- `data/news.json`: news. The newest 4 (`site.json` → `latestCount`) appear under **Latest from the road**; older ones move automatically into **From the road**.
- `data/work.json`: **Selected work**. A `vimeo` field gives a play button; Vimeo supplies the thumbnail.
- `data/road.json`: photos in **From the road**. `file` is the filename in the Google Drive folder "Lundfilm web".
- `data/site.json`: hero images, the About image, and Drive files already used elsewhere on the site.
- `public/images/`: web versions of the photos (JPG, max 1800 px).

## Cloudflare Pages

- Build command: `node build.js`
- Build output directory: `dist`

## Photo credits

The filename in Drive determines the credit: text after the last `" - "` is the photographer. With no hyphen, the credit is Troels Lund.

## 360° photos (Insta360)

360° photos go in the same Drive folder ("Lundfilm web") and appear under **Tours** in **From the road**, looking like the other tiles but with a **360** badge in the corner. Clicking opens an interactive viewer (Pannellum 2.5.6, self-hosted in `public/vendor/pannellum/`, loaded only when someone opens a 360 photo).

- **Detection:** a photo counts as 360° if its filename contains "360", or it carries Insta360/GPano metadata, or it is a 2:1 frame at least 4000 px wide.
- **No credit:** 360° photos are all taken by Troels, so `credit` is left empty.
- **Prepare:** `python3 tools/pano.py "<downloaded file>" <slug>` writes `public/pano/<slug>.jpg` (max 6000×3000, for the viewer) and `public/images/<slug>.jpg` (a flat 3:2 view for the tile).
- **road.json:** same fields as a normal photo plus `"pano": "<slug>.jpg"`, with `"group": "tours"` and `"credit": ""`.
- Export from Insta360 Studio as a 360° photo (equirectangular), not a reframed one.
