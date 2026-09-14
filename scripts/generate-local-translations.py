import json
import sys
from pathlib import Path

import argostranslate.package
import argostranslate.translate

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "messages" / "content"


def ensure_model(target: str) -> None:
    installed = argostranslate.translate.get_installed_languages()
    source_language = next((language for language in installed if language.code == "en"), None)
    target_language = next((language for language in installed if language.code == target), None)
    if source_language and target_language and source_language.get_translation(target_language):
        return

    argostranslate.package.update_package_index()
    package = next(
        item
        for item in argostranslate.package.get_available_packages()
        if item.from_code == "en" and item.to_code == target
    )
    argostranslate.package.install_from_path(package.download())


def generate(target: str) -> None:
    ensure_model(target)
    english = json.loads((CONTENT / "en.json").read_text())
    target_path = CONTENT / f"{target}.json"
    translated = json.loads(target_path.read_text()) if target_path.exists() else {}
    missing = [source for source in english if source not in translated]

    for index, source in enumerate(missing, start=1):
        translated[source] = argostranslate.translate.translate(source, "en", target).strip()
        if index % 25 == 0 or index == len(missing):
            target_path.write_text(json.dumps(translated, ensure_ascii=False, indent=2) + "\n")
            print(f"{target}: {index}/{len(missing)}", flush=True)

    ordered = {source: translated[source] for source in english}
    target_path.write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + "\n")


locales = sys.argv[1:] or ["ar", "fr"]
for locale in locales:
    generate(locale)
