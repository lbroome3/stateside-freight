#!/usr/bin/env python3
"""Build the Surrogate Funding Foundation pages from scripts/surrogate/*.html.

Each page = shared head (SEO tags, JSON-LD) + header nav + its sections + footer.
Writes surrogate-funding.html (home) and surrogate-funding/<slug>.html.
Shared files: surrogate-funding/sf.css, surrogate-funding/sf.js.
Edit the fragments or this script, never the generated pages. Then run:
    python3 scripts/make-surrogate.py
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "scripts", "surrogate")
BASE = "https://www.lewisbroome.com/surrogate-funding"
ORG = "Surrogate Funding Foundation"
# Founding board, as Lewis set it 2026-11-08. No home or mailing address ever goes on the site.
BOARD = [("Lewis Broome III", "Founder, President"), ("Aloysius Anderson", "Founding Director"),
         ("Steven Batts", "Director, Treasurer"), ("Master Tracy Goodwin", "Director"),
         ("Dr. Demarius Gaither", "Director"), ("Kaylah Dodd", "Director, Secretary")]

def frag(name):
    return open(os.path.join(SRC, name + ".html"), encoding="utf-8").read()

# slug, nav label, <title>, meta description, page fragments
PAGES = [
    ("", "Home", "Surrogate Funding Foundation | Mentoring Young Men in South Carolina",
     "Prevention first: Surrogate Funding Foundation mentors boys and young men in Richland County and the Midlands early, before the system reaches them, and posts small cash bonds in its own name, with no fees, so a $70 to $300 bond does not tear a family apart.",
     ["hero", "paths", "watch", "home-numbers", "home-meter", "home-teasers", "home-give"]),
    ("mission", "Mission", "Our Mission and Four Pillars | Surrogate Funding Foundation",
     "We stand at the crossroads for young men in South Carolina: mentoring in faith, family, finances, and order, and bringing people home from jail over small bonds.",
     ["ph-mission", "watch", "mission", "clip-pillars", "serve"]),
    ("our-story", "Our story", "Our Founder's Story and Founding Board | Surrogate Funding Foundation",
     "Lewis Broome III watched a $1,400 shortfall become $4,900 plus fees. In that cell, young men asked him how to live. Meet the founder and the founding board reaching young men before the system does.",
     ["story", "board", "why-surrogate"]),
    ("programs", "Programs", "Crossroads Mentoring Circle and Programs | Surrogate Funding Foundation",
     "The Crossroads mentoring circle, one-on-one mentors for a year, money and work skills, the community bail fund, and the Loud and Right livestream.",
     ["ph-programs", "programs", "clip-crossroads", "evidence"]),
    ("bail-fund", "Bail fund", "Community Bail Fund for $70 to $300 Bonds | Surrogate Funding Foundation",
     "Some people sit in jail for months over a $70 bond. Our community bail fund posts small cash bonds in the Foundation's name, with no fees, for people held only because they cannot pay. Refunded bail brings the next person home.",
     ["bail-meter", "bailfund", "clip-bail-fund", "bonds"]),
    ("serve", "Serve", "Mentor a Young Man in South Carolina | Surrogate Funding Foundation",
     "Retired military and men who have walked the road: mentor a young man, lead a circle session, host a circle, or join our founding board.",
     ["ph-serve", "stand"]),
    ("give", "Give", "Make a Founding Gift | Surrogate Funding Foundation",
     "Give to Surrogate Funding Foundation and see exactly what your gift does. Secure checkout by Square. 501(c)(3) status pending.",
     ["ph-give", "donate"]),
    ("faq", "Questions", "Questions and Answers | Surrogate Funding Foundation",
     "Does bail help cost anything? Who is eligible? How does a young man join the Crossroads circle? Are gifts tax-deductible? Straight answers from Surrogate Funding Foundation.",
     ["ph-faq", "faq"]),
    ("road-to-launch", "Road to launch", "Road to Launch and 501(c)(3) Status | Surrogate Funding Foundation",
     "Every step of building Surrogate Funding Foundation, in order: what is done, what is under way, and our pending 501(c)(3) status.",
     ["ph-road", "road", "status"]),
    ("request-help", "Request help", "Request Bail Help for a Small Bond | Surrogate Funding Foundation",
     "Ask Surrogate Funding Foundation for help with a small bond on a non-violent charge. For the person held, or a family member or friend on their behalf. It is free.",
     ["request-help"]),
    ("reach-out", "Reach out", "Reach Out: Someone in Your Corner | Surrogate Funding Foundation",
     "For young men in South Carolina who are struggling and want someone in their corner. Not a crisis line: call or text 988 if you need help right now.",
     ["reach-out"]),
]
FORMS = {"request-help", "reach-out"}  # carry sf-forms.css/js inline; no engage.js on purpose
NAV = ["mission", "our-story", "programs", "bail-fund", "serve", "faq"]
LABEL = {p[0]: p[1] for p in PAGES}
EXTRA_NAV = [("request-help", "Request help"), ("reach-out", "Reach out")]

def url(slug):
    return BASE + ("/" + slug if slug else "")

def href(slug):
    return "/surrogate-funding" + ("/" + slug if slug else "")

def ld(slug, title, desc):
    org = {
        "@type": "NGO", "@id": BASE + "#org", "name": ORG, "alternateName": "Surrogate Funding",
        "url": BASE, "description": PAGES[0][3], "logo": BASE + "/media/icon-512.png",
        "founder": {"@type": "Person", "name": "Lewis Broome III", "jobTitle": "Founder and President"},
        "member": [{"@type": "OrganizationRole", "roleName": r, "member": {"@type": "Person", "name": n}} for n, r in BOARD],
        "areaServed": [{"@type": "AdministrativeArea", "name": "Richland County, South Carolina"},
                       {"@type": "State", "name": "South Carolina"}],
        "address": {"@type": "PostalAddress", "addressRegion": "SC", "addressCountry": "US"},
        "foundingDate": "2026",
        "sponsor": {"@type": "Organization", "name": "GPT Marketing", "url": "https://gptmarketing.us"},
    }
    crumbs = [{"@type": "ListItem", "position": 1, "name": "Surrogate Funding", "item": BASE}]
    if slug:
        crumbs.append({"@type": "ListItem", "position": 2, "name": LABEL[slug], "item": url(slug)})
    page = {"@type": "WebPage", "@id": url(slug) + "#page", "url": url(slug), "name": title,
            "description": desc, "isPartOf": {"@id": BASE + "#org"}, "about": {"@id": BASE + "#org"}}
    graph = [org, page, {"@type": "BreadcrumbList", "itemListElement": crumbs}]
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, indent=1)

def header(slug):
    links = [(s, LABEL[s]) for s in NAV] + EXTRA_NAV
    nav = "\n".join(
        f'      <a href="{href(s)}"{" aria-current=\"page\"" if s == slug else ""}>{l}</a>' for s, l in links)
    return f'''<header class="top">
  <div class="wrap">
    <a class="mark" href="{href("")}"><img class="mark-emblem" src="/surrogate-funding/media/emblem.png" alt="" width="40" height="40"><b>Surrogate Funding</b><span>South Carolina</span></a>
    <nav class="nav" aria-label="Pages">
{nav}
    </nav>
    <div class="top-r">
      <span class="status">501(c)(3) pending</span>
      <a class="btn btn-solid btn-sm" href="{href("give")}">Donate</a>
    </div>
  </div>
</header>'''

def footer():
    links = [("", "Home")] + [(s, LABEL[s]) for s in NAV] + [("road-to-launch", "Road to launch"), ("give", "Give")] + EXTRA_NAV
    fl = "\n".join(f'        <a href="{href(s)}">{l}</a>' for s, l in links)
    return f'''<footer class="band">
  <div class="wrap">
    <div class="foot-top">
      <p class="foot-name"><img class="foot-lockup" src="/surrogate-funding/media/lockup-gold.png" alt="Surrogate Funding Foundation" width="260" height="246"></p>
      <p class="motto">Faith. Family. Finances. Order. Loud and right.</p>
      <p class="motto">Call or text <a href="tel:+18033611303" style="color:inherit">803-361-1303</a></p>
    </div>
    <nav class="foot-links" aria-label="All pages">
{fl}
    </nav>
    <div class="foot-bottom">
      <span>{ORG} · A South Carolina nonprofit corporation in formation · 501(c)(3) status pending</span>
      <a class="sponsor" href="https://gptmarketing.us" target="_blank" rel="noopener">Sponsored by <b>GPT Marketing</b></a>
      <span>Richland County &amp; the Midlands · © 2026 {ORG}</span>
    </div>
  </div>
</footer>'''

def nextlink(i):
    order = [p[0] for p in PAGES]
    nxt = order[(i + 1) % len(order)]
    if nxt == "":
        nxt = "mission"
    return f'''  <div class="wrap next">
    <a href="{href(nxt)}"><small>Next</small><b>{LABEL[nxt]}</b></a>
    <a class="btn btn-solid" href="{href("give")}" style="color:var(--band)">Make a founding gift</a>
  </div>'''

def fix_links(html):
    # in-page anchors from the one-page version become page links
    m = {"#donate": "give", "#stand": "serve", "#story": "our-story", "#bail-fund": "bail-fund",
         "#mission": "mission", "#programs": "programs", "#serve": "mission", "#road": "road-to-launch"}
    for a, s in m.items():
        html = html.replace(f'href="{a}"', f'href="{href(s)}"')
    return html

def build(i, page):
    slug, label, title, desc, parts = page
    body = "\n".join(frag(p) for p in parts)
    body = fix_links(body)
    if slug == "give":
        body += '\n<script>\n' + open(os.path.join(SRC, "donate-script.js"), encoding="utf-8").read() + '</script>'
    extra_head = ""
    if slug in FORMS:
        extra_head = '<meta name="referrer" content="no-referrer">\n<style>\n' + open(os.path.join(SRC, "sf-forms.css"), encoding="utf-8").read() + '</style>\n'
        body += '\n<script>\n' + open(os.path.join(SRC, "sf-forms.js"), encoding="utf-8").read() + '</script>'
    # each page gets its own share card when surrogate-funding/og/<slug>.jpg exists; home uses og.jpg
    if slug and os.path.exists(os.path.join(ROOT, "surrogate-funding", "og", slug + ".jpg")):
        og_img = BASE + "/og/" + slug + ".jpg"
    else:
        og_img = BASE + "/og.jpg" if os.path.exists(os.path.join(ROOT, "surrogate-funding", "og.jpg")) else ""
    img_tags = (f'<meta property="og:image" content="{og_img}">\n<meta property="og:image:secure_url" content="{og_img}">\n<meta property="og:image:type" content="image/jpeg">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:image:alt" content="{title}">\n<meta name="twitter:image" content="{og_img}">\n<meta name="twitter:title" content="{title}">\n<meta name="twitter:description" content="{desc}">\n' if og_img else "")
    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="{url(slug)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Surrogate Funding Foundation">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url(slug)}">
{img_tags}<meta name="twitter:card" content="summary_large_image">
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="icon" type="image/png" sizes="32x32" href="/surrogate-funding/media/favicon-32.png">
<link rel="apple-touch-icon" href="/surrogate-funding/media/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..800;1,6..96,400..700&family=Instrument+Sans:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/surrogate-funding/sf.css">
<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
{extra_head}<script type="application/ld+json">
{ld(slug, title, desc)}
</script>
</head>
<body>
<!-- GENERATED by scripts/make-surrogate.py from scripts/surrogate/. Do not hand-edit. -->
{header(slug)}

<main id="top">
{body}
{nextlink(i)}
</main>

{footer()}
<!-- Visitor alerts + live chat: the GPT Marketing embed, site key "surrogate" so these visitors and
     chats ring Lewis as Surrogate Funding, never mixed with the freight site (Lewis, 11/5). -->
<script src="https://gptmarketing.us/w/gm.js" data-site="surrogate" defer></script>
<script src="/surrogate-funding/sf.js" defer></script>
<script src="/surrogate-funding/sf-3d.js" defer></script>
<script src="/share.js" defer></script>
</body>
</html>
'''
    out = os.path.join(ROOT, "surrogate-funding.html") if not slug else os.path.join(ROOT, "surrogate-funding", slug + ".html")
    open(out, "w", encoding="utf-8").write(html)
    return out

if __name__ == "__main__":
    os.makedirs(os.path.join(ROOT, "surrogate-funding"), exist_ok=True)
    for i, p in enumerate(PAGES):
        print("wrote", os.path.relpath(build(i, p), ROOT))
