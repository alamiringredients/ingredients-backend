"""Regenerate static Latin faces with fonttools[woff]; retain every glyph and feature."""
from hashlib import sha256
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

root = Path(__file__).resolve().parents[1]
output = root / 'public/fonts/cormorant-garamond'
for style in ('normal', 'italic'):
    source = root / f'scripts/fonts/cormorant-garamond-{style}.woff2'
    for weight in (500, 600):
        font = TTFont(source, recalcTimestamp=False)
        original_characters = set(font.getBestCmap())
        instantiateVariableFont(font, {'wght': weight}, inplace=True)
        assert set(font.getBestCmap()) == original_characters
        path = output / f'latin-{weight}-{style}.woff2'
        font.save(path)
        fingerprint = sha256(path.read_bytes()).hexdigest()[:12]
        target = path.with_name(f'{path.stem}.{fingerprint}.woff2')
        path.replace(target)
        print(target.relative_to(root))
