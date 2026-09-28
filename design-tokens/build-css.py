#!/usr/bin/env python3
"""Generate design-tokens/tokens.css from design-tokens/tokens.json.

tokens.json is the source of truth (synced from Figma via Tokens Studio,
DTCG format). Run this script after re-exporting tokens.json.

    python3 design-tokens/build-css.py

No dependencies beyond the standard library.
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).parent
SRC = HERE / "tokens.json"
OUT = HERE / "tokens.css"

WEIGHT_MAP = {"Regular": 400, "Medium": 500, "Semibold": 600, "Bold": 700}


def slugify(segment: str) -> str:
    s = segment.replace("'", "").replace("_", "-")
    s = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", "-", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.lower().strip("-")


def css_var_name(path: list[str]) -> str:
    # "Number Scale" / "2's" is just the spacing scale's own label; drop it.
    if path[:2] == ["Number Scale", "2's"]:
        path = ["spacing", *path[2:]]
    return "--" + "-".join(slugify(p) for p in path)


def css_class_name(path: list[str]) -> str:
    return "text-" + "-".join(slugify(p) for p in path)


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
    """Replace a single "{a.b.c}" reference with its literal primitive value."""
    if not isinstance(value, str):
        return value
    m = re.fullmatch(r"\{([^}]+)\}", value)
    if not m:
        return value
    dotted = m.group(1)
    if dotted not in primitives:
        raise KeyError(f"Unresolved token reference: {{{dotted}}}")
    return primitives[dotted][1]


def fmt_font_size(v) -> str:
    return f"{v}px" if isinstance(v, (int, float)) else str(v)


def fmt_line_height(v) -> str:
    return "normal" if v == "AUTO" else str(v)


def fmt_letter_spacing(v) -> str:
    return "normal" if v == "0%" else str(v)


def fmt_font_weight(v) -> str:
    return str(WEIGHT_MAP.get(v, v))


def build_typography_rule(class_name: str, value: dict, primitives: dict) -> str:
    font_family = resolve_ref(value["fontFamily"], primitives)
    font_weight = fmt_font_weight(resolve_ref(value["fontWeight"], primitives))
    font_size = fmt_font_size(resolve_ref(value["fontSize"], primitives))
    line_height = fmt_line_height(resolve_ref(value["lineHeight"], primitives))
    letter_spacing = fmt_letter_spacing(resolve_ref(value["letterSpacing"], primitives))
    text_case = resolve_ref(value["textCase"], primitives)
    text_decoration = resolve_ref(value["textDecoration"], primitives)
    # paragraphSpacing / paragraphIndent are always 0 in the current token
    # set (no visible CSS effect) and are intentionally omitted here.
    return (
        f".{class_name} {{\n"
        f'  font-family: "{font_family}";\n'
        f"  font-weight: {font_weight};\n"
        f"  font-size: {font_size};\n"
        f"  line-height: {line_height};\n"
        f"  letter-spacing: {letter_spacing};\n"
        f"  text-transform: {text_case};\n"
        f"  text-decoration: {text_decoration};\n"
        f"}}"
    )


def build_shadow_var(value: list) -> str:
    layers = [f"{l['x']}px {l['y']}px {l['blur']}px {l['spread']}px {l['color']}" for l in value]
    return ", ".join(layers)


def main():
    data = json.loads(SRC.read_text())

    primitives: dict = {}
    composites: dict = {}
    walk(data, [], primitives, composites)

    lines = [
        "/**",
        " * GENERATED FILE — do not edit by hand.",
        " * Source: design-tokens/tokens.json",
        " * Regenerate: python3 design-tokens/build-css.py",
        " */",
        "",
        ":root {",
    ]

    for dotted, (type_, value) in sorted(primitives.items()):
        path = dotted.split(".")
        var = css_var_name(path)
        if type_ == "color":
            css_value = value
        elif type_ == "number":
            css_value = f"{value}px"
        elif type_ == "fontSizes":
            css_value = fmt_font_size(value)
        elif type_ == "lineHeights":
            css_value = fmt_line_height(value)
        elif type_ == "letterSpacing":
            css_value = fmt_letter_spacing(value)
        elif type_ == "fontWeights":
            css_value = fmt_font_weight(value)
        elif type_ == "fontFamilies":
            css_value = f'"{value}"'
        elif type_ in ("textCase", "textDecoration"):
            css_value = value
        elif type_ == "dimension":
            css_value = value
        else:
            css_value = json.dumps(value)
        lines.append(f"  {var}: {css_value};")

    lines.append("")
    for dotted, (path, type_, value) in sorted(composites.items()):
        if type_ == "boxShadow":
            var = css_var_name(path)
            lines.append(f"  {var}: {build_shadow_var(value)};")
    lines.append("}")

    lines.append("")
    lines.append("/* Typography — matches the composite tokens in tokens.json 1:1 */")
    for dotted, (path, type_, value) in sorted(composites.items()):
        if type_ == "typography":
            class_name = css_class_name(path)
            lines.append("")
            lines.append(build_typography_rule(class_name, value, primitives))

    OUT.write_text("\n".join(lines) + "\n")
    print(f"Wrote {OUT} ({len(primitives)} variables, "
          f"{sum(1 for _, (_, t, _) in composites.items() if t == 'typography')} typography classes, "
          f"{sum(1 for _, (_, t, _) in composites.items() if t == 'boxShadow')} shadow variables)")


if __name__ == "__main__":
    main()
