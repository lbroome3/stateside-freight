#!/usr/bin/env python3
"""
make-az-hot3.py — the 3 Hot Picks for Women pages, built from az-hot3.js.

  az-hot3.js → az-hot-picks.html    → /az/hot-picks
             → az-es-hot-picks.html → /az/es/hot-picks

Lewis, 10/21: the three hottest things women are buying on Amazon, always on the store, and
"Amazon, bestsellers list ... that wording will pull in people". Then: "three hot picks
for women. Check daily" and "a running list". Each day's three go on top; earlier days stay
below. No personal endorsement on the page: the source is Amazon's best seller lists.
The display name lives in NAME below (one place), so a rename is one edit and a rerun.
The page is static
(every brand + model name is in the source, not only in JavaScript), its title carries the
month, and it has JSON-LD ItemList (no prices or ratings, same rule as make-az-seo.py),
hreflang, OG/Twitter cards and a lastmod in sitemap-az.xml that moves with every refresh.

"Amazon" is used only to say where the ranking comes from; the page says it is not
affiliated with or endorsed by Amazon. The /az section reads the same az-hot3.js.

Refresh: add the day on top of az-hot3.js, then run `python3 scripts/make-az-es.py` (it runs this too).
"""
import datetime, html as H, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
HOST = "https://www.lewisbroome.com"
TAG = "broomepicks-20"
EN_PATH, ES_PATH = "/az/hot-picks", "/az/es/hot-picks"
NAME = {"en": "Kaylah's 3 Hot Picks for Women", "es": "Los 3 favoritos de Kaylah para mujeres"}

MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
             "septiembre", "octubre", "noviembre", "diciembre"]

T = {
    "en": dict(
        title="{name}: Trending on Amazon Right Now ({month})",
        desc="{name}, trending on Amazon right now and checked daily from Amazon's best seller lists: {names}. Updated {date}.",
        og="{name}: Trending on Amazon Right Now",
        eyebrow="🔥 Hot picks · Updated {date}",
        h1="{name}",
        sub="Trending on Amazon right now. Checked daily from Amazon's best seller lists.",
        list_name="{name}: trending on Amazon right now",
        crumb="{name}", earlier="Earlier hot picks", earlier_sub="Every day's top three, newest first.",
        buy_short="Buy", today="Today", all="All Hot Picks", still="🔥 Still hot", last="last {d}",
        ndays=lambda n: f"{n} day in the top 3" if n == 1 else f"{n} days in the top 3",
        short_fmt=lambda d: d.strftime("%b %-d"), store="Gidgets & Gadgets",
        buy="🛒 Buy on Amazon →", buy_title="Buy on Amazon",
        clip="✂️ Look for a clip coupon on the Amazon page",
        back="← All my gadgets", deals="🔥 Today's Deals", coupons="✂️ Amazon Coupons",
        fine="Rankings from Amazon.com Best Sellers (Women's Fashion and Beauty & Personal Care) as of {date}. "
             "This page is not affiliated with or endorsed by Amazon.",
        disclose="As an Amazon Associate I earn from qualifying purchases. It costs you nothing extra.",
        toggle=("/az/es/hot-picks", "Español", "es"), q="",
        locale="en_US", date_fmt=lambda d: d.strftime("%B %-d, %Y"), month_fmt=lambda d: d.strftime("%B %Y"),
    ),
    "es": dict(
        title="{name}: tendencia en Amazon ahora mismo ({month})",
        desc="{name}, en tendencia en Amazon ahora mismo y revisados cada día en las listas de más vendidos de Amazon: {names}. Actualizado el {date}.",
        og="{name}: tendencia en Amazon ahora mismo",
        eyebrow="🔥 Favoritos · Actualizado el {date}",
        h1="{name}",
        sub="En tendencia en Amazon ahora mismo. Revisados cada día en las listas de más vendidos de Amazon.",
        list_name="{name}: tendencia en Amazon ahora mismo",
        crumb="{name}", earlier="Selecciones anteriores", earlier_sub="Las tres de cada día, la más reciente primero.",
        buy_short="Comprar", today="Hoy", all="Todos los favoritos", still="🔥 Sigue en tendencia", last="último: {d}",
        ndays=lambda n: f"{n} día en el top 3" if n == 1 else f"{n} días en el top 3",
        short_fmt=lambda d: f"{d.day} {MONTHS_ES[d.month-1][:3]}", store="Gidgets & Gadgets",
        buy="🛒 Comprar en Amazon →", buy_title="Comprar en Amazon",
        clip="✂️ Busca un cupón en la página de Amazon",
        back="← Todos mis gadgets", deals="🔥 Ofertas del día", coupons="✂️ Cupones de Amazon",
        fine="Clasificación de Amazon.com Best Sellers (moda de mujer y belleza) al {date}. "
             "Esta página no está afiliada ni respaldada por Amazon.",
        disclose="Como Asociado de Amazon gano con las compras que califican. A ti no te cuesta nada extra.",
        toggle=("/az/hot-picks", "English", "en"), q="&amp;language=es_US",
        locale="es_US", date_fmt=lambda d: f"{d.day} de {MONTHS_ES[d.month-1]} de {d.year}",
        month_fmt=lambda d: f"{MONTHS_ES[d.month-1]} de {d.year}",
    ),
}


def load():
    js = (ROOT / "az-hot3.js").read_text()
    days = json.loads(re.search(r"window\.AZ_HOT3\s*=\s*(\{.*\})\s*;", js, re.S).group(1))["days"]
    return [(datetime.date.fromisoformat(d["date"]), d["items"][:3]) for d in days]


def page(lang, days):
    day, items = days[0]
    t = {k: (v.replace("{name}", NAME[lang]) if isinstance(v, str) else v) for k, v in T[lang].items()}
    e = H.escape
    path, other = (EN_PATH, ES_PATH) if lang == "en" else (ES_PATH, EN_PATH)
    url = HOST + path
    date, month = t["date_fmt"](day), t["month_fmt"](day)
    names = "; ".join(i["name"] for i in items)
    title = t["title"].format(month=month)
    desc = t["desc"].format(names=names, date=date)
    img = HOST + "/az-media/hot-picks-og.png"  # option B, Lewis 10/21: the link preview for texts and emails
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
    def card(i, n, first):
        anchor = f' id="p-{i["asin"]}"' if first else ""
        why = i.get("why_es") if lang == "es" and i.get("why_es") else i.get("why", "")
        return f"""      <article class="tile"{anchor}>
        <a class="ph" href="{buy(i['asin'])}" target="_blank" rel="sponsored noopener" title="{t['buy_title']}"><img src="{e(i['pic'])}" alt="{e(i['name'])}" width="600" height="450"{' loading="lazy"' if n or not first else ''} /></a>
        <div class="body"><div class="tags"><span class="tag rank">#{n+1}</span><span class="tag why">{e(why)}</span></div>
          <h2>{e(i['name'])}</h2>
          <a class="go" href="{buy(i['asin'])}" target="_blank" rel="sponsored noopener">{t['buy']}</a>
          <p class="clip">{t['clip']}</p></div>
      </article>"""
    # One panel per day (today first, the rest hidden until its date is tapped), plus "All":
    # every item ever picked, newest first, never removed (Lewis 10/21: "I don't want to
    # remove an item off of the list"). Everything is in the HTML, so search engines see it all.
    panels = []
    for k, (d, its) in enumerate(days):
        cards = "\n".join(card(i, n, k == 0) for n, i in enumerate(its))
        panels.append(f'  <section class="grid panel" data-p="d{k}" aria-label="{e(t["date_fmt"](d))}"{" hidden" if k else ""}>\n{cards}\n  </section>')
    seen = {}
    for d, its in days:
        for i in its:
            seen.setdefault(i["asin"], {"item": i, "dates": []})["dates"].append(d)
    today = {i["asin"] for i in items}
    rows = "".join(
        f'<li><img src="{e(v["item"]["pic"])}" alt="" width="64" height="64" loading="lazy" />'
        f'<div><b>{e(v["item"]["name"])}</b><small>{t["ndays"](len(v["dates"]))} · '
        f'{("<em>" + t["still"] + "</em>") if a in today else t["last"].format(d=t["short_fmt"](v["dates"][0]))}</small></div>'
        f'<a class="b" href="{buy(a)}" target="_blank" rel="sponsored noopener" aria-label="{e(t["buy_title"])}: {e(v["item"]["name"])}">{t["buy_short"]}</a></li>'
        for a, v in seen.items())
    panels.append(f'  <section class="panel allp" data-p="all" hidden><ul>{rows}</ul></section>')
    chips = "".join(
        f'<button type="button" data-p="d{k}"{" class=on" if not k else ""}>{t["today"] if not k else t["short_fmt"](d)}</button>'
        for k, (d, _) in enumerate(days)) + f'<button type="button" data-p="all">{t["all"]} ({len(seen)})</button>'
    panels = "\n".join(panels)
    tg = t["toggle"]
    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<!-- GENERATED by scripts/make-az-hot3.py from az-hot3.js. Do not hand-edit. -->
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
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="{e(NAME[lang])}" />
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
  .chips{{display:flex;gap:.5rem;overflow-x:auto;padding:.2rem 0 1rem;scrollbar-width:none}}
  .chips::-webkit-scrollbar{{display:none}}
  .chips button{{flex:0 0 auto;border:1.5px solid var(--line);background:rgba(10,14,24,.5);color:var(--ink-2);border-radius:999px;padding:.5rem .95rem;font:700 .9rem Inter,sans-serif;cursor:pointer}}
  .chips button.on{{background:var(--pink);border-color:var(--pink);color:#1a0710}}
  .allp ul{{list-style:none;padding-bottom:1.6rem}}
  .allp li{{display:flex;gap:.8rem;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:.6rem .8rem;margin-bottom:.6rem}}
  .allp li img{{width:64px;height:64px;object-fit:contain;background:#fff;border-radius:10px;padding:4px;flex:0 0 auto}}
  .allp li div{{flex:1;min-width:0}}
  .allp li b{{display:block;font-size:.92rem;line-height:1.3}}
  .allp li small{{color:var(--ink-2);font-size:.78rem}}
  .allp li em{{font-style:normal;color:var(--pink);font-weight:800}}
  .allp li a.b{{flex:0 0 auto;background:var(--amz);color:#111;font-weight:800;font-size:.8rem;border-radius:9px;padding:.4rem .75rem}}
  [hidden]{{display:none!important}}
  .earlier h2{{font-size:1.4rem;margin-top:.6rem}}
  .earlier .esub{{color:var(--ink-2);margin-bottom:.8rem}}
  .day{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:.8rem 1rem;margin-bottom:.7rem}}
  .day h3{{font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;color:var(--pink);margin-bottom:.4rem}}
  .day li{{list-style:none;display:flex;gap:.6rem;align-items:center;justify-content:space-between;padding:.35rem 0;border-top:1px solid var(--line)}}
  .day li:first-of-type{{border-top:0}}
  .day li a.b{{flex:0 0 auto;background:var(--amz);color:#111;font-weight:800;font-size:.8rem;border-radius:9px;padding:.35rem .7rem}}
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
  <h1>{t['h1']} 🔥</h1>
  <p class="sub">{t['sub']}</p>
</div></header>
<main class="wrap">
  <nav class="chips" aria-label="{e(t['list_name'])}">{chips}</nav>
{panels}
  <div class="more">
    <a href="https://www.amazon.com/deals?tag={TAG}{t['q']}" target="_blank" rel="sponsored noopener">{t['deals']}</a>
    <a href="https://www.amazon.com/coupons?tag={TAG}{t['q']}" target="_blank" rel="sponsored noopener">{t['coupons']}</a>
  </div>
  <p class="fine">{t['fine'].format(date=date)}</p>
</main>
<script>
document.querySelector('.chips').addEventListener('click',function(ev){{
  var b=ev.target.closest('button'); if(!b) return;
  document.querySelectorAll('.chips button').forEach(function(x){{x.classList.toggle('on',x===b)}});
  document.querySelectorAll('.panel').forEach(function(p){{p.hidden=p.dataset.p!==b.dataset.p}});
}});
</script>
</body>
</html>
"""


def sitemap(day):
    f = ROOT / "sitemap-az.xml"
    xml = f.read_text()
    xml = re.sub(r"  <!-- (wish|hot3):start -->.*?<!-- \1:end -->\n", "", xml, flags=re.S)
    block = "  <!-- hot3:start -->\n"
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
    block += "  <!-- hot3:end -->\n"
    f.write_text(xml.replace("</urlset>", block + "</urlset>", 1))


if __name__ == "__main__":
    days = load()
    (ROOT / "az-hot-picks.html").write_text(page("en", days))
    (ROOT / "az-es-hot-picks.html").write_text(page("es", days))
    sitemap(days[0][0])
    print(f"hot picks: {len(days)} day(s), latest {days[0][0]}")
