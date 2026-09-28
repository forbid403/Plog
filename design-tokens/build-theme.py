#!/usr/bin/env python3
"""Generate src/theme/tokens.ts from design-tokens/tokens.json.

tokens.json is the source of truth (synced from Figma via Tokens Studio,
DTCG format). Run this script after re-exporting tokens.json.

    python3 design-tokens/build-theme.py

No dependencies beyond the standard library. Mirrors build-css.py, but
emits React Native-friendly values (unitless numbers, no CSS keywords)
instead of a CSS file.
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).parent
SRC = HERE / "tokens.json"
OUT = HERE.parent / "src" / "theme" / "tokens.ts"

WEIGHT_MAP = {"Regular": "400", "Medium": "500", "Semibold": "600", "Bold": "700"}


def camel(segment: str) -> str:
    s = segment.replace("'", "")
    s = re.sub(r"[_\s]+", " ", s).strip()
    words = re.split(r"(?<=[a-z0-9])(?=[A-Z])|\s+", s)
    words = [w for w in words if w]
    if not words:
        return ""
    head = words[0][0].lower() + words[0][1:]
    return head + "".join(w[0].upper() + w[1:] for w in words[1:])


def is_leaf(node: dict) -> bool:
    return isinstance(node, dict) and "$value" in node and "$type" in node


def walk(node: dict, path: list[str], primitives: dict, composites: dict):
    for key, child in node.items():
        if key.startswith("$"):
            continue
        child_path = [*path, key]
        if is_leaf(child):
            dotted = ".".join(child_path)
            if child["$type"] in ("typography", "boxShadow"):
                composites[dotted] = (child_path, child["$type"], child["$value"])
            else:
                primitives[dotted] = (child["$type"], child["$value"])
        elif isinstance(child, dict):
            walk(child, child_path, primitives, composites)


def resolve_ref(value, primitives: dict):
    if not isinstance(value, str):
        return value
    m = re.fullmatch(r"\{([^}]+)\}", value)
    if not m:
        return value
    dotted = m.group(1)
    if dotted not in primitives:
        raise KeyError(f"Unresolved token reference: {{{dotted}}}")
    return primitives[dotted][1]


def build_colors(primitives: dict) -> dict:
    colors: dict = {}
    for dotted, (type_, value) in primitives.items():
        path = dotted.split(".")
        if path[0] != "Color":
            continue
        node = colors
        for seg in path[1:-1]:
            node = node.setdefault(camel(seg), {})
        node[camel(path[-1])] = value
    return colors


def build_spacing(primitives: dict) -> dict:
    spacing: dict = {}
    for dotted, (type_, value) in primitives.items():
        path = dotted.split(".")
        if path[:2] != ["Number Scale", "2's"]:
            continue
        key = path[-1].lower()
        spacing[key] = value
    return spacing


def build_shadows(composites: dict) -> dict:
    shadows: dict = {}
    for dotted, (path, type_, value) in composites.items():
        if type_ != "boxShadow":
            continue
        key = camel(path[0].replace("_", " "))  # Shadow_Strong -> shadowStrong -> strip "shadow"
        key = key[len("shadow"):] if key.startswith("shadow") else key
        key = key[0].lower() + key[1:]
        shadows[key] = [
            {"x": l["x"], "y": l["y"], "blur": l["blur"], "spread": l["spread"], "color": l["color"]}
            for l in value
        ]
    return shadows


def build_typography_entry(value: dict, primitives: dict) -> dict:
    font_family = resolve_ref(value["fontFamily"], primitives)
    weight_name = resolve_ref(value["fontWeight"], primitives)
    font_size = resolve_ref(value["fontSize"], primitives)
    raw_line_height = resolve_ref(value["lineHeight"], primitives)
    letter_spacing = resolve_ref(value["letterSpacing"], primitives)
    text_case = resolve_ref(value["textCase"], primitives)
    text_decoration = resolve_ref(value["textDecoration"], primitives)

    entry = {
        "fontFamily": font_family,
        "fontWeight": WEIGHT_MAP.get(weight_name, weight_name),
        "fontSize": font_size,
        "letterSpacing": 0 if letter_spacing == "0%" else letter_spacing,
        "textTransform": text_case,
        "textDecorationLine": text_decoration,
    }
    if raw_line_height != "AUTO":
        pct = float(raw_line_height.rstrip("%")) / 100
        entry["lineHeight"] = round(font_size * pct, 2)
    return entry


def build_typography(composites: dict, primitives: dict) -> dict:
    typography: dict = {}
    for dotted, (path, type_, value) in composites.items():
        if type_ != "typography":
            continue
        node = typography
        for seg in path[:-1]:
            node = node.setdefault(camel(seg), {})
        leaf_key = camel(path[-1]) if len(path) > 1 else camel(path[0])
        target = typography if len(path) == 1 else node
        target[leaf_key] = build_typography_entry(value, primitives)
    return typography


def main():
    data = json.loads(SRC.read_text())
    primitives: dict = {}
    composites: dict = {}
    walk(data, [], primitives, composites)

    colors = build_colors(primitives)
    spacing = build_spacing(primitives)
    shadows = build_shadows(composites)
    typography = build_typography(composites, primitives)

    body = (
        "// GENERATED FILE — do not edit by hand.\n"
        "// Source: design-tokens/tokens.json\n"
        "// Regenerate: python3 design-tokens/build-theme.py\n\n"
        f"export const colors = {json.dumps(colors, indent=2)} as const;\n\n"
        f"export const spacing = {json.dumps(spacing, indent=2)} as const;\n\n"
        f"export const shadows = {json.dumps(shadows, indent=2)} as const;\n\n"
        f"export const typography = {json.dumps(typography, indent=2)} as const;\n"
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(body)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
