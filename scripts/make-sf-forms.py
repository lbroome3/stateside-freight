#!/usr/bin/env python3
"""Build the Surrogate Funding intake pages as standalone HTML.

Wraps each body fragment in scripts/surrogate/{slug}.html with the head, styles, header and
footer lifted from surrogate-funding.html, plus sf-forms.css/js inline. Output:
surrogate-funding/{slug}.html, served at /surrogate-funding/{slug} by vercel.json.
When the site generator (scripts/make-surrogate.py) lands, these fragments register there
instead and this script retires.
"""
import re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "scripts" / "surrogate"
HOME = (ROOT / "surrogate-funding.html").read_text()

PAGES = {
    "request-help": {
        "title": "Request bail help · Surrogate Funding",
        "desc": "Ask Surrogate Funding Foundation for help with a small bond on a non-violent charge. For the person held, or a family member or friend on their behalf.",
    },
    "reach-out": {
        "title": "Reach out · Surrogate Funding",
        "desc": "For young men in South Carolina who are struggling and want someone in their corner. Not a crisis line: call or text 988 if you need help right now.",
    },
}

style = re.search(r"<style>\n/\* Layout.*?</style>", HOME, re.S).group(0)
header = re.search(r"<header class=\"top\">.*?</header>", HOME, re.S).group(0)
footer = re.search(r"<footer class=\"band\">.*?</footer>", HOME, re.S).group(0)
fonts = "\n".join(l for l in HOME.splitlines() if "fonts.g" in l)

# The sub-page header: mark goes home; the section anchors go home too.
header = header.replace('href="#top"', 'href="/surrogate-funding"').replace('href="#', 'href="/surrogate-funding#')

css = (SRC / "sf-forms.css").read_text()
js = (SRC / "sf-forms.js").read_text()

for slug, meta in PAGES.items():
    body = (SRC / f"{slug}.html").read_text()
    url = f"https://www.lewisbroome.com/surrogate-funding/{slug}"
    html = f"""<!doctype html>
<html lang="en">
<head>
<title>{meta['title']}</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="{meta['desc']}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index,follow">
<meta property="og:type" content="website">
<meta property="og:title" content="{meta['title']}">
<meta property="og:description" content="{meta['desc']}">
<meta property="og:url" content="{url}">
<meta name="twitter:card" content="summary">
<meta name="referrer" content="no-referrer">
<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
{fonts}
{style}
<style>
{css}</style>
</head>
<body>
{header}

<main id="top">
{body}</main>

{footer}

<script>
{js}</script>
<script src="/share.js" defer></script>
</body>
</html>
"""
    out = ROOT / "surrogate-funding" / f"{slug}.html"
    out.write_text(html)
    print("wrote", out.relative_to(ROOT), len(html))
