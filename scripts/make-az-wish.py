#!/usr/bin/env python3
"""
make-az-wish.py — the Kalah's Wish List pages, built from az-wish.js.

  az-wish.js → az-wish-list.html    → /az/wish-list
             → az-es-wish-list.html → /az/es/wish-list

Lewis, 10/21: the three hottest things women are buying on Amazon, always on the store, and
"Amazon, bestsellers list ... that wording will pull in people". So the page is static
(every brand + model name is in the source, not only in JavaScript), its title carries the
month, and it has JSON-LD ItemList (no prices or ratings, same rule as make-az-seo.py),
hreflang, OG/Twitter cards and a lastmod in sitemap-az.xml that moves with every refresh.

"Amazon" is used only to say where the ranking comes from; the page says it is not
affiliated with or endorsed by Amazon. The /az section reads the same az-wish.js.

Refresh: rewrite az-wish.js, then run `python3 scripts/make-az-es.py` (it runs this too).
"""
import datetime, html as H, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
HOST = "https://www.lewisbroome.com"
TAG = "broomepicks-20"
EN_PATH, ES_PATH = "/az/wish-list", "/az/es/wish-list"

MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
             "septiembre", "octubre", "noviembre", "diciembre"]

T = {
    "en": dict(
        title="Top 3 Amazon Best Sellers for Women Right Now ({month}) | Kalah's Wish List",
        desc="The three hottest things women are buying on Amazon right now, straight from Amazon's best seller lists: {names}. Updated {date}.",
        og="Top 3 Amazon Best Sellers for Women Right Now",
        eyebrow="Trending for her · Updated {date}",
        h1="Top 3 Amazon Best Sellers for Women Right Now",
        sub="The three hottest things women are buying on Amazon right now, straight from Amazon's best seller lists and refreshed every morning.",
        list_name="Kalah's Wish List: top 3 Amazon best sellers for women",
        crumb="Kalah's Wish List", store="Gidgets & Gadgets",
        buy="🛒 Buy on Amazon →", buy_title="Buy on Amazon",
        clip="✂️ Look for a clip coupon on the Amazon page",
        back="← All my gadgets", deals="🔥 Today's Deals", coupons="✂️ Amazon Coupons",
        fine="Rankings from Amazon.com Best Sellers (Women's Fashion and Beauty & Personal Care) as of {date}. "
             "This page is not affiliated with or endorsed by Amazon.",
        disclose="As an Amazon Associate I earn from qualifying purchases. It costs you nothing extra.",
        toggle=("/az/es/wish-list", "Español", "es"), q="",
        locale="en_US", date_fmt=lambda d: d.strftime("%B %-d, %Y"), month_fmt=lambda d: d.strftime("%B %Y"),
    ),
    "es": dict(
        title="Los 3 más vendidos de Amazon para mujeres ahora mismo ({month}) | La lista de deseos de Kalah",
        desc="Las tres cosas que más están comprando las mujeres en Amazon ahora mismo, directo de las listas de más vendidos de Amazon: {names}. Actualizado el {date}.",
        og="Los 3 más vendidos de Amazon para mujeres ahora mismo",
        eyebrow="Tendencia para ella · Actualizado el {date}",
        h1="Los 3 más vendidos de Amazon para mujeres ahora mismo",
        sub="Las tres cosas que más están comprando las mujeres en Amazon ahora mismo, directo de las listas de más vendidos de Amazon y actualizadas cada mañana.",
        list_name="La lista de deseos de Kalah: los 3 más vendidos de Amazon para mujeres",
        crumb="La lista de deseos de Kalah", store="Gidgets & Gadgets",
        buy="🛒 Comprar en Amazon →", buy_title="Comprar en Amazon",
        clip="✂️ Busca un cupón en la página de Amazon",
        back="← Todos mis gadgets", deals="🔥 Ofertas del día", coupons="✂️ Cupones de Amazon",
        fine="Clasificación de Amazon.com Best Sellers (moda de mujer y belleza) al {date}. "
             "Esta página no está afiliada ni respaldada por Amazon.",
        disclose="Como Asociado de Amazon gano con las compras que califican. A ti no te cuesta nada extra.",
        toggle=("/az/wish-list", "English", "en"), q="&amp;language=es_US",
        locale="es_US", date_fmt=lambda d: f"{d.day} de {MONTHS_ES[d.month-1]} de {d.year}",
        month_fmt=lambda d: f"{MONTHS_ES[d.month-1]} de {d.year}",
    ),
}


def load():
    js = (ROOT / "az-wish.js").read_text()
    data = json.loads(re.search(r"window\.AZ_WISH\s*=\s*(\{.*\})\s*;", js, re.S).group(1))
    return datetime.date.fromisoformat(data["updated"]), data["items"][:3]


def page(lang, day, items):
    t = T[lang]
    e = H.escape
    path, other = (EN_PATH, ES_PATH) if lang == "en" else (ES_PATH, EN_PATH)
    url = HOST + path
    date, month = t["date_fmt"](day), t["month_fmt"](day)
    names = "; ".join(i["name"] for i in items)
    title = t["title"].format(month=month)
    desc = t["desc"].format(names=names, date=date)
    img = items[0]["pic"]
    home = "/az" if lang == "en" else "/az/es"
    buy = lambda a: f"https://www.amazon.com/dp/{a}?tag={TAG}{t['q']}"
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "@id": url + "#page", "url": url, "name": title, "description": desc,
         "inLanguage": lang, "dateModified": day.isoformat(),
         "isPartOf": {"@type": "WebSite", "name": "Gidgets & Gadgets", "url": HOST + "/az"},
         "author": {"@type": "Person", "name": "Lewis Broome"}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": t["store"], "item": HOST + home},
            {"@type": "ListItem", "position": 2, "name": t["crumb"], "item": url}]},
        {"@type": "ItemList", "name": t["list_name"], "numberOfItems": len(items),
         "itemListOrder": "https://schema.org/ItemListOrderAscending",
         "itemListElement": [{"@type": "ListItem", "position": n + 1, "name": i["name"],
                              "image": i["pic"], "url": f"{url}#p-{i['asin']}"}
                             for n, i in enumerate(items)]}]}
    cards = "\n".join(f"""      <article class="tile" id="p-{i['asin']}">
        <a class="ph" href="{buy(i['asin'])}" target="_blank" rel="sponsored noopener" title="{t['buy_title']}"><img src="{e(i['pic'])}" alt="{e(i['name'])}" width="600" height="450"{' loading="lazy"' if n else ''} /></a>
        <div class="body"><div class="tags"><span class="tag rank">#{n+1}</span><span class="tag why">{e(i.get('why_es') if lang == 'es' and i.get('why_es') else i.get('why', ''))}</span></div>
          <h2>{e(i['name'])}</h2>
          <a class="go" href="{buy(i['asin'])}" target="_blank" rel="sponsored noopener">{t['buy']}</a>
          <p class="clip">{t['clip']}</p></div>
      </article>""" for n, i in enumerate(items))
    tg = t["toggle"]
    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<!-- GENERATED by scripts/make-az-wish.py from az-wish.js. Do not hand-edit. -->
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<link rel="canonical" href="{url}" />
<link rel="alternate" hreflang="en" href="{HOST}{EN_PATH}" />
<link rel="alternate" hreflang="es" href="{HOST}{ES_PATH}" />
<link rel="alternate" hreflang="x-default" href="{HOST}{EN_PATH}" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="{t['locale']}" />
<meta property="og:site_name" content="Gidgets &amp; Gadgets by Lewis Broome" />
<meta property="og:title" content="{e(t['og'])}" />
<meta property="og:description" content="{e(desc)}" />
<meta property="og:url" content="{url}" />
<meta property="og:image" content="{e(img)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{e(t['og'])}" />
<meta name="twitter:description" content="{e(desc)}" />
<meta name="twitter:image" content="{e(img)}" />
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Archivo:wght@800&display=swap" rel="stylesheet" />
<style>
  :root{{--bg:#06080f;--card:rgba(20,26,38,.74);--line:rgba(120,140,180,.22);--ink:#eef2f8;--ink-2:#9aa8bf;--pink:#f472b6;--amz:#ff9900;--radius:18px}}
  *{{box-sizing:border-box;margin:0;padding:0}}
  body{{font-family:'Inter',system-ui,sans-serif;background:radial-gradient(900px 500px at 85% -10%,rgba(244,114,182,.18),transparent 60%),var(--bg);color:var(--ink);line-height:1.6;-webkit-font-smoothing:antialiased}}
  h1,h2{{font-family:'Archivo','Inter',sans-serif;letter-spacing:-.02em;line-height:1.1}}
  a{{color:inherit;text-decoration:none}}
  img{{display:block;max-width:100%}}
  .wrap{{max-width:1120px;margin:0 auto;padding:0 16px}}
  .disclose{{background:rgba(17,24,39,.85);border-bottom:1px solid var(--line);color:var(--ink-2);font-size:.82rem;text-align:center;padding:.55rem 16px}}
  .disclose .lang{{display:inline-block;margin-left:.6rem;color:var(--ink);font-weight:700;border:1px solid var(--line);border-radius:999px;padding:.05rem .65rem;white-space:nowrap}}
  header{{padding:2.2rem 0 1.4rem}}
  .back{{color:var(--ink-2);font-size:.9rem;font-weight:600}}
  .eyebrow{{display:block;margin-top:1.2rem;font-size:.75rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--pink)}}
  h1{{font-size:clamp(1.8rem,6vw,2.8rem);margin:.4rem 0 .6rem}}
  h1 small{{display:block;font-size:.55em;color:var(--pink);margin-top:.3rem}}
  .sub{{color:var(--ink-2);max-width:640px}}
  .grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;padding-bottom:1.6rem}}
  .tile{{background:var(--card);border:1px solid rgba(244,114,182,.45);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column}}
  .tile .ph{{aspect-ratio:4/3;background:#fff}}
  .tile .ph img{{width:100%;height:100%;object-fit:contain;padding:6%}}
  .tile .body{{padding:1rem 1.1rem 1.1rem;display:flex;flex-direction:column;gap:.45rem;flex:1}}
  .tile h2{{font-size:1.08rem;flex:1}}
  .tags{{display:flex;gap:.4rem;flex-wrap:wrap}}
  .tag{{font-size:.68rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;border-radius:999px;padding:.15rem .55rem}}
  .tag.rank{{background:var(--pink);color:#1a0710}}
  .tag.why{{background:rgba(244,114,182,.18)}}
  .go{{display:flex;justify-content:center;background:var(--amz);color:#111;font-weight:800;border-radius:12px;padding:.7rem 1rem}}
  .clip{{color:var(--ink-2);font-size:.78rem}}
  .more{{display:flex;flex-wrap:wrap;gap:.5rem;margin:.4rem 0 1.2rem}}
  .more a{{flex:1 1 150px;text-align:center;border:1.5px solid rgba(255,153,0,.55);background:rgba(255,153,0,.12);font-weight:800;border-radius:12px;padding:.65rem .9rem}}
  .fine{{color:var(--ink-2);font-size:.78rem;padding:0 0 2.4rem;max-width:640px}}
</style>
<script src="/az-track.js" defer></script>
</head>
<body>
<div class="disclose">{t['disclose']} <a class="lang" href="{tg[0]}" hreflang="{tg[2]}" lang="{tg[2]}">🌐 {tg[1]}</a></div>
<header><div class="wrap">
  <a class="back" href="{home}">{t['back']}</a>
  <span class="eyebrow">{t['eyebrow'].format(date=date)}</span>
  <h1>{t['h1']}<small>{t['crumb']} 💖</small></h1>
  <p class="sub">{t['sub']}</p>
</div></header>
<main class="wrap">
  <section class="grid" aria-label="{e(t['list_name'])}">
{cards}
  </section>
  <div class="more">
    <a href="https://www.amazon.com/deals?tag={TAG}{t['q']}" target="_blank" rel="sponsored noopener">{t['deals']}</a>
    <a href="https://www.amazon.com/coupons?tag={TAG}{t['q']}" target="_blank" rel="sponsored noopener">{t['coupons']}</a>
  </div>
  <p class="fine">{t['fine'].format(date=date)}</p>
</main>
</body>
</html>
"""


def sitemap(day):
    f = ROOT / "sitemap-az.xml"
    xml = f.read_text()
    xml = re.sub(r"  <!-- wish:start -->.*?<!-- wish:end -->\n", "", xml, flags=re.S)
    block = "  <!-- wish:start -->\n"
    for loc in (EN_PATH, ES_PATH):
        block += f"""  <url>
    <loc>{HOST}{loc}</loc>
    <lastmod>{day.isoformat()}</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="{HOST}{EN_PATH}" />
    <xhtml:link rel="alternate" hreflang="es" href="{HOST}{ES_PATH}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="{HOST}{EN_PATH}" />
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
"""
    block += "  <!-- wish:end -->\n"
    f.write_text(xml.replace("</urlset>", block + "</urlset>", 1))


if __name__ == "__main__":
    day, items = load()
    (ROOT / "az-wish-list.html").write_text(page("en", day, items))
    (ROOT / "az-es-wish-list.html").write_text(page("es", day, items))
    sitemap(day)
    print(f"wish list: {len(items)} items, updated {day}")
