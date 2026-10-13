#!/usr/bin/env python3
"""
make-az-seo.py — the search-engine layer on the six store pages.

Lewis, 10/13: "I need to do a Google index. SEO index each item meta tag". For each of
az.html, az-hurricane-kit.html, az-dji-power-1000.html and their az-es-* twins it writes,
between marker comments (so reruns replace, never stack):

  <!-- seo:head -->   x-default hreflang, og:site_name, og:image when missing, Twitter card,
                      and JSON-LD: the site, Lewis, the page, its breadcrumb and an ItemList
                      of every gadget on it (name, photo, link to that gadget's card).
  <!-- seo:index -->  (store and hurricane kit only) a plain-HTML list of every gadget by
                      category, so the full brand + model names are in the page source and
                      not only in what the JavaScript draws. Each name jumps to its card
                      (#p-ASIN); each Buy goes to Amazon with tag=broomepicks-20.

No prices, ratings or reviews go in the structured data: the store shows none, and Google
flags Product markup without offers/ratings, so the gadgets are ListItems, not Products.

make-az-es.py runs this at its end, so the usual "edit the English page, rerun make-az-es"
keeps both languages current. Run it alone after editing az-data.js or a KIT/VIDEO list.
"""
import html as H, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
HOST = "https://www.lewisbroome.com"
TAG = "broomepicks-20"

CATS = [  # chip order on the store page
    ("power", "Phone & Power", "Teléfono y energía"),
    ("car", "Car Tech", "Para el auto"),
    ("audio", "Audio", "Audio"),
    ("desk", "Desk & Gaming", "Escritorio y gaming"),
    ("home", "Smart Home & Security", "Casa inteligente y seguridad"),
    ("outdoor", "Outdoor, Beach & Ride", "Aire libre, playa y paseo"),
    ("camera", "Drones & Cameras", "Drones y cámaras"),
    ("tv", "TV & Streaming", "TV y streaming"),
    ("kitchen", "Kitchen", "Cocina"),
    ("wellness", "Home & Wellness", "Hogar y bienestar"),
    ("tools", "Tools", "Herramientas"),
]

T = {
    "en": dict(site="Gidgets & Gadgets by Lewis Broome", home="Gidgets & Gadgets",
               idx_h="Every gadget, A to Z", idx_n="{n} gadgets",
               idx_p="The full list with brand and model names. Tap a name to jump to its card, or Buy to open it on Amazon.",
               buy="Buy", buy_lbl="Buy {name} on Amazon", list="Gadgets on this page"),
    "es": dict(site="Gidgets & Gadgets por Lewis Broome", home="Gidgets & Gadgets",
               idx_h="Todos los gadgets, de la A a la Z", idx_n="{n} gadgets",
               idx_p="La lista completa con marca y modelo. Toca un nombre para ir a su tarjeta, o Comprar para abrirlo en Amazon.",
               buy="Comprar", buy_lbl="Comprar {name} en Amazon", list="Gadgets en esta página"),
}

IDX_CSS = """<style>
  .azidx{background:var(--card,rgba(20,26,38,.72));border:1px solid var(--line,rgba(120,140,180,.22));border-radius:16px;padding:1rem 1.1rem}
  .azidx summary{cursor:pointer;font-weight:800;font-size:1.1rem;list-style:none;display:flex;justify-content:space-between;gap:.6rem;align-items:center}
  .azidx summary::-webkit-details-marker{display:none}
  .azidx summary::after{content:"▾";color:var(--accent,#22d3ee)}
  .azidx[open] summary::after{content:"▴"}
  .azidx summary small{margin-left:auto;color:var(--ink-2,#9aa8bf);font-weight:600;font-size:.85rem}
  .azidx>p{color:var(--ink-2,#9aa8bf);font-size:.9rem;margin:.6rem 0 0}
  .azidx h3{font-size:1rem;margin:1.1rem 0 .4rem;color:var(--accent,#22d3ee)}
  .azidx ul{list-style:none;margin:0;padding:0}
  .azidx li{display:flex;gap:.6rem;align-items:baseline;justify-content:space-between;padding:.45rem 0;border-top:1px solid var(--line,rgba(120,140,180,.22));font-size:.95rem}
  .azidx li a:first-child{flex:1;min-width:0}
  .azidx li a.b{flex:none;color:#111;background:var(--amz,#ff9900);border-radius:8px;padding:.2rem .6rem;font-weight:800;font-size:.8rem}
  .tile.hit,.tile:target{outline:3px solid var(--amz,#ff9900);outline-offset:3px}
</style>"""


def die(msg):
    sys.exit("make-az-seo: " + msg)


def js_list(src, var):
    """The {asin/a:'…', name/n:'…', cat:'…', pic:'…'} objects of a JS array literal."""
    m = re.search(r"var " + var + r"=\[(.*?)\n  \];", src, re.S)
    if not m:
        die(f"can't find var {var}")
    out = []
    for obj in re.findall(r"\{([^\n]*?)\}", m.group(1)):
        def f(k):
            mm = re.search(r"\b" + k + r":'((?:[^'\\]|\\.)*)'", obj)
            return mm.group(1).replace("\\'", "'") if mm else None
        out.append(dict(asin=f("asin") or f("a"), name=f("name") or f("n"), cat=f("cat"), pic=f("pic")))
    return out


def store_items(page_src):
    """Same list the store page draws in "Everything I own": the video 10, then az-data.js."""
    video = js_list(page_src, "VIDEO")
    more = {m["asin"]: m for m in js_list(page_src, "MORE")}
    s = (ROOT / "az-data.js").read_text()
    data = json.loads(s[s.index("["): s.rindex("]") + 1])
    skip = {v["asin"] for v in video} | {"B0G4SCX27Q"}  # the Quest 3S under its other listing
    items = [dict(v) for v in video]
    for r in data:
        if r["asin"] in skip:
            continue
        b = more.get(r["asin"], {})
        items.append(dict(asin=r["asin"], name=b.get("name") or r["name"], cat=r["cat"], pic=r.get("pic")))
    return items


def kit_items(page_src):
    return [dict(i, cat=None) for i in js_list(page_src, "KIT")]


def meta(src, prop):
    m = re.search(r'<meta (?:property|name)="' + re.escape(prop) + r'" content="([^"]*)"', src)
    return H.unescape(m.group(1)) if m else None


def ld(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def amz(asin, lang):
    return f"https://www.amazon.com/dp/{asin}?tag={TAG}" + ("&amp;language=es_US" if lang == "es" else "")


def head_block(src, lang, url, en_url, kind, items, crumb):
    t = T[lang]
    out = [f'<link rel="alternate" hreflang="x-default" href="{en_url}" />',
           f'<meta property="og:site_name" content="{H.escape(t["site"])}" />']
    img = meta(src, "og:image")
    if not img:
        img = HOST + "/az-media/own/dji_wagon_01.jpg"
        out.append(f'<meta property="og:image" content="{img}" />')
    title = meta(src, "og:title") or re.search(r"<title>(.*?)</title>", src).group(1)
    desc = meta(src, "og:description") or meta(src, "description")
    out += ['<meta name="twitter:card" content="summary_large_image" />',
            f'<meta name="twitter:title" content="{H.escape(title)}" />',
            f'<meta name="twitter:description" content="{H.escape(desc)}" />',
            f'<meta name="twitter:image" content="{img}" />']

    home_url = HOST + ("/az/es" if lang == "es" else "/az")
    page_title = H.unescape(re.search(r"<title>(.*?)</title>", src).group(1))
    lewis = {"@type": "Person", "@id": HOST + "/az#lewis", "name": "Lewis Broome",
             "url": HOST + "/az", "homeLocation": {"@type": "Place", "name": "Myrtle Beach, SC"}}
    site = {"@type": "WebSite", "@id": HOST + "/az#site", "name": "Gidgets & Gadgets", "url": HOST + "/az",
            "inLanguage": ["en-US", "es-US"], "publisher": {"@id": HOST + "/az#lewis"}}
    page = {"@type": kind, "@id": url + "#page", "url": url, "name": page_title,
            "description": meta(src, "description"), "inLanguage": "es-US" if lang == "es" else "en-US",
            "isPartOf": {"@id": HOST + "/az#site"}, "author": {"@id": HOST + "/az#lewis"},
            "primaryImageOfPage": {"@type": "ImageObject", "url": img},
            "breadcrumb": {"@id": url + "#crumbs"}}
    crumbs = [{"@type": "ListItem", "position": 1, "name": t["home"], "item": home_url}]
    if crumb:
        crumbs.append({"@type": "ListItem", "position": 2, "name": crumb, "item": url})
    graph = [site, lewis, page, {"@type": "BreadcrumbList", "@id": url + "#crumbs", "itemListElement": crumbs}]
    if items:
        lst = {"@type": "ItemList", "@id": url + "#gadgets", "name": t["list"], "numberOfItems": len(items),
               "itemListElement": []}
        for n, it in enumerate(items, 1):
            li = {"@type": "ListItem", "position": n, "name": it["name"], "url": f'{url}#p-{it["asin"]}'}
            if it.get("pic"):
                li["image"] = HOST + it["pic"]
            lst["itemListElement"].append(li)
        page["mainEntity"] = {"@id": url + "#gadgets"}
        graph.append(lst)
    else:
        page["about"] = {"@type": "Thing", "name": "DJI Power 1000 Portable Power Station"}
    out.append('<script type="application/ld+json">\n' + ld({"@context": "https://schema.org", "@graph": graph}) + "\n</script>")
    if items:
        out.append(IDX_CSS)
    return "<!-- seo:head (generated by scripts/make-az-seo.py) -->\n" + "\n".join(out) + "\n<!-- /seo:head -->\n"


def index_block(lang, items, grouped):
    t = T[lang]

    def li(it):
        name = H.escape(it["name"])
        return (f'<li><a href="#p-{it["asin"]}">{name}</a>'
                f'<a class="b" href="{amz(it["asin"], lang)}" target="_blank" rel="sponsored noopener" '
                f'aria-label="{H.escape(t["buy_lbl"].format(name=it["name"]))}">{t["buy"]}</a></li>')

    body = []
    if grouped:
        for key, en, es in CATS:
            group = sorted((i for i in items if i["cat"] == key), key=lambda i: i["name"].lower())
            if group:
                body.append(f'<h3>{H.escape(es if lang == "es" else en)}</h3>\n<ul>\n' + "\n".join(map(li, group)) + "\n</ul>")
        if any(i["cat"] not in {c[0] for c in CATS} for i in items):
            die("an item has a category the index doesn't know")
    else:
        body.append("<ul>\n" + "\n".join(li(i) for i in sorted(items, key=lambda i: i["name"].lower())) + "\n</ul>")
    return ("<!-- seo:index (generated by scripts/make-az-seo.py) -->\n"
            '<section id="az-index"><div class="wrap">\n<details class="azidx">'
            f'<summary>{t["idx_h"]} <small>{t["idx_n"].format(n=len(items))}</small></summary>\n'
            f'<p>{t["idx_p"]}</p>\n' + "\n".join(body) + "\n</details>\n</div></section>\n<!-- /seo:index -->\n")


def put(src, name, block, anchor):
    pat = re.compile(r"<!-- " + name + r" .*?<!-- /" + name + r" -->\n", re.S)
    if pat.search(src):
        return pat.sub(lambda _: block, src, 1)
    if anchor not in src:
        die(f"anchor {anchor!r} missing")
    return src.replace(anchor, block + anchor, 1)


PAGES = [  # file, lang, path, English path, page type, items, grouped index, breadcrumb name
    ("az.html", "en", "/az", "/az", "CollectionPage", "store", True, None),
    ("az-es.html", "es", "/az/es", "/az", "CollectionPage", "store", True, None),
    ("az-hurricane-kit.html", "en", "/az/hurricane-kit", "/az/hurricane-kit", "CollectionPage", "kit", False, "My Hurricane Kit"),
    ("az-es-hurricane-kit.html", "es", "/az/es/hurricane-kit", "/az/hurricane-kit", "CollectionPage", "kit", False, "Mi kit para huracanes"),
    ("az-dji-power-1000.html", "en", "/az/dji-power-1000", "/az/dji-power-1000", "WebPage", None, False, "DJI Power 1000"),
    ("az-es-dji-power-1000.html", "es", "/az/es/dji-power-1000", "/az/dji-power-1000", "WebPage", None, False, "DJI Power 1000"),
]


def main():
    for fname, lang, path, en_path, kind, which, grouped, crumb in PAGES:
        f = ROOT / fname
        src = f.read_text()
        items = store_items(src) if which == "store" else kit_items(src) if which == "kit" else []
        if items and any(not i["asin"] or not i["name"] for i in items):
            die(f"{fname}: an item has no ASIN or name")
        if len({i["asin"] for i in items}) != len(items):
            die(f"{fname}: duplicate ASIN in the list")
        src = put(src, "seo:head", head_block(src, lang, HOST + path, HOST + en_path, kind, items, crumb), "</head>")
        if items:
            src = put(src, "seo:index", index_block(lang, items, grouped), "</main>")
        f.write_text(src)
        print(f"{fname}: {len(items)} gadgets")


if __name__ == "__main__":
    main()
