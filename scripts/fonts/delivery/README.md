# Font delivery

Run `python3 scripts/prepare-font-delivery.py` to publish fingerprinted WOFF2 files and small locale stylesheets and update `lib/site-font-delivery.ts`. No Python dependencies are needed. Fonts use `swap`, without hiding page content while they download. Critical Latin font files are preloaded. Arabic uses size-adjusted local Tahoma fallbacks before Playpen Arabic and Almarai arrive; availability and layout vary across devices.

The Arabic heading face is an exact weight-500 instance of the installed Playpen Sans Arabic variable font, generated with FontTools `instantiateVariableFont(font, {'wght': 500})`. Its complete character map is preserved. It is 41,588 bytes versus 97,808 bytes for the variable source, which remains available for other weights. Licenses are retained under `public/fonts/`.
