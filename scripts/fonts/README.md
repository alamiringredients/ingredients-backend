The source WOFF2 files are the Latin Cormorant Garamond variable faces previously served by next/font/google in this app. Their licence is in public/fonts/cormorant-garamond/OFL.txt.

Run scripts/prepare-serif-fonts.py with Python and fonttools[woff] to instantiate weights 500 and 600. The script preserves the original character map, outlines at the selected weight, kerning and OpenType features. It prints fingerprinted output names; update styles/serif-font.css and the preload links in app/[locale]/layout.tsx if those names change. Non-Latin faces remain the original variable fonts, with their original unicode ranges.

Only the two Latin weight-500 faces are preloaded on English and French public pages. Weight 600 and other character ranges load when needed. This reduces the heading-font preload from 77,080 to 47,176 bytes without substituting a different typeface. Font display stays optional, with the original fallback metrics to avoid late layout shifts.
