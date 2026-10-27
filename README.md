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
