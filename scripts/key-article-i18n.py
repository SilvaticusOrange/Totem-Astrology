#!/usr/bin/env python3
"""
Key untranslated prose in <main> for site i18n.
Writes js/i18n-parts/articles-en.json and patches HTML with data-i18n.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Comment

ROOT = Path(__file__).resolve().parents[1]

PAGES = [
    "index.html",
    "about.html",
    "faq.html",
    "how-it-works.html",
    "totem-astrology.html",
    "four-totem-guides.html",
    "five-elements.html",
    "yin-yang.html",
    "nepal-time.html",
    "sacred-roles.html",
    "services.html",
    "terms.html",
    "contact.html",
    "calculator.html",
    "calculator.template.html",
    "connections.html",
    "connections.template.html",
    "connection-rainbow.html",
    "connection-shadow.html",
    "connection-mirror-opposite.html",
    "connection-values-trine.html",
    "connection-same-as-me.html",
]

# Leaf-ish tags we translate
TARGETS = {"p", "h1", "h2", "h3", "h4", "li", "figcaption", "dt", "dd", "label", "option", "blockquote"}
SPAN_CLASSES = {"section-label", "hero-badge", "form-hint", "form-note", "bazi-about-subhead"}
SKIP_PARENT_IDS = set()
SKIP_CLASS_CONTAINS = ("lang-flag", "lang-bar", "bazi-city-suggestion")

INLINE_TAGS = {"a", "strong", "em", "b", "i", "br", "span", "cite", "code", "abbr", "sup", "sub", "u"}


def slugify(text: str, max_len: int = 40) -> str:
    s = re.sub(r"<[^>]+>", "", text)
    s = re.sub(r"&[a-z]+;", " ", s, flags=re.I)
    s = re.sub(r"[^a-zA-Z0-9]+", " ", s).strip().lower()
    parts = s.split()[:6]
    out = "-".join(parts) if parts else "text"
    return out[:max_len].rstrip("-")


def page_prefix(filename: str) -> str:
    name = filename.replace(".template.html", "").replace(".html", "")
    name = name.replace("connection-", "connType.")
    mapping = {
        "index": "home",
        "totem-astrology": "article.values",
        "four-totem-guides": "article.fourGuides",
        "five-elements": "article.elements",
        "yin-yang": "article.yinYang",
        "nepal-time": "article.nepalTime",
        "sacred-roles": "article.sacredRoles",
        "how-it-works": "page.how",
        "calculator": "page.calc",
        "connections": "page.conn",
    }
    if name in mapping:
        return mapping[name]
    if name.startswith("connType."):
        return f"page.{name}"
    return f"page.{name}"


def has_only_inline(el) -> bool:
    for child in el.children:
        if isinstance(child, NavigableString):
            continue
        if getattr(child, "name", None) in INLINE_TAGS:
            if not has_only_inline(child):
                return False
            continue
        return False
    return True


def normalize_text(s: str) -> str:
    s = s.replace("\u00a0", " ")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n\s*\n+", "\n", s)
    return s.strip()


def content_value(el) -> tuple[str, bool]:
    """Return (value, is_html)."""
    if has_only_inline(el) and el.find(True):
        # Keep meaningful inner HTML (links, emphasis)
        html = "".join(str(c) for c in el.contents).strip()
        # Decode nothing special — BeautifulSoup already parsed
        html = normalize_text(html)
        # Prefer storing with real tags for data-i18n-html
        return html, True
    text = el.get_text(" ", strip=True)
    return normalize_text(text), False


def contains_keyed_child(el) -> bool:
    """If this element wraps other translate targets, only translate the children."""
    for child in el.find_all(True):
        if child is el:
            continue
        if child.has_attr("data-i18n"):
            return True
        if child.name in TARGETS and child.name != "blockquote":
            # Nested p/li/h* — parent should not absorb them
            if child.name in {"p", "h1", "h2", "h3", "h4", "li", "figcaption", "dt", "dd", "label", "option"}:
                return True
        if child.name == "a" and "btn" in (child.get("class") or []):
            return True
        if child.name == "span" and set(child.get("class") or []) & SPAN_CLASSES:
            return True
        if child.name == "button" and "nav-toggle" not in (child.get("class") or []):
            return True
    return False


def should_skip(el) -> bool:
    if el.has_attr("data-i18n"):
        return True
    if contains_keyed_child(el):
        return True
    if el.name == "option" and el.get("value") in ("", None) and not el.get_text(strip=True):
        return True
    text = el.get_text(strip=True)
    if not text:
        return True
    if len(re.sub(r"\W+", "", text)) < 2 and not el.find("a"):
        return True
    classes = " ".join(el.get("class") or [])
    for needle in SKIP_CLASS_CONTAINS:
        if needle in classes:
            return True
    if el.find_parent(["script", "style", "svg", "noscript"]):
        return True
    for p in el.parents:
        if p.get("id") in ("site-nav", "site-lang-bar"):
            return True
        if "site-header" in (p.get("class") or []) or "site-footer" in (p.get("class") or []):
            return True
    if text in {"TotemAstrology.com", "Totem Astrology™", "Totem Astrology™"}:
        return True
    return False


def collect_targets(main):
    targets = []
    for el in main.find_all(True):
        if el.name in TARGETS:
            # For blockquote, translate nested p instead of the wrapper
            if el.name == "blockquote":
                continue
            targets.append(el)
            continue
        if el.name == "span":
            classes = set(el.get("class") or [])
            if classes & SPAN_CLASSES:
                targets.append(el)
                continue
        # CTA / button links that are text-only
        if el.name == "a" and "btn" in (el.get("class") or []):
            if has_only_inline(el) and not el.has_attr("data-i18n"):
                targets.append(el)
            continue
        if el.name == "button" and el.get("type") in (None, "submit", "button"):
            if has_only_inline(el) and not el.find("span") and not el.has_attr("data-i18n"):
                # skip nav-toggle
                if "nav-toggle" in (el.get("class") or []):
                    continue
                targets.append(el)
    return targets


def unique_key(prefix: str, el, used: set[str], counters: dict) -> str:
    # Prefer id from nearest article/section
    section = el.find_parent(id=True)
    sid = ""
    if section and section.get("id") and section.get("id") != "main-content":
        sid = re.sub(r"[^a-zA-Z0-9]+", "-", section.get("id")).strip("-")

    tag = el.name
    if el.name == "span" and el.get("class"):
        tag = el.get("class")[0]
    if el.name == "a" and "btn" in (el.get("class") or []):
        tag = "btn"

    base_slug = slugify(el.get_text(" ", strip=True)[:60])
    parts = [prefix]
    if sid:
        parts.append(sid)
    parts.append(tag)
    parts.append(base_slug)
    key = ".".join(parts)

    # shorten if too long
    if len(key) > 90:
        key = f"{prefix}.{sid+'.' if sid else ''}{tag}.{base_slug[:24]}"

    if key in used:
        counters[key] = counters.get(key, 1) + 1
        key = f"{key}.{counters[key]}"
    used.add(key)
    return key


def process_page(path: Path, articles: dict, used_global: set[str]) -> int:
    raw = path.read_text(encoding="utf-8")
    soup = BeautifulSoup(raw, "html.parser")
    main = soup.find(id="main-content") or soup.find("main")
    if not main:
        print(f"skip (no main): {path.name}")
        return 0

    prefix = page_prefix(path.name)
    counters: dict = {}
    added = 0
    for el in collect_targets(main):
        if should_skip(el):
            continue
        value, is_html = content_value(el)
        if not value:
            continue
        # Skip if already same as an existing page title key content we'll keep
        key = unique_key(prefix, el, used_global, counters)

        # If element already has matching data-i18n from before, skip
        el["data-i18n"] = key
        if is_html:
            el["data-i18n-html"] = "true"
            # Replace contents with a placeholder representation stored in catalog as HTML
            # Keep current HTML in the element; catalog stores the HTML string
            articles[key] = value
        else:
            articles[key] = value
            # Ensure textContent path uses clean text
            el.clear()
            el.append(value)

        added += 1

    # Write back preserving doctype if possible
    out = str(soup)
    if raw.lstrip().startswith("<!DOCTYPE"):
        # BeautifulSoup may drop doctype
        if not out.lstrip().lower().startswith("<!doctype"):
            out = "<!DOCTYPE html>\n" + out
    # Preserve leading comments like page rev
    m = re.match(r"(<!DOCTYPE html>\s*)?(<!--.*?-->\s*)?", raw, flags=re.S | re.I)
    # Don't overthink — write soup output
    path.write_text(out, encoding="utf-8")
    print(f"{path.name}: +{added} keys")
    return added


def main():
    articles: dict[str, str] = {}
    used: set[str] = set()
    total = 0
    for name in PAGES:
        path = ROOT / name
        if not path.exists():
            print(f"missing {name}")
            continue
        total += process_page(path, articles, used)

    out = ROOT / "js/i18n-parts/articles-en.json"
    out.write_text(json.dumps(articles, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(articles)} keys -> {out.relative_to(ROOT)} (page adds counted {total})")


if __name__ == "__main__":
    main()
