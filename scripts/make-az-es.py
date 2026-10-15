#!/usr/bin/env python3
"""
make-az-es.py — builds the Spanish store pages from the English ones.

  az.html                → az-es.html                → /az/es
  az-hurricane-kit.html  → az-es-hurricane-kit.html  → /az/es/hurricane-kit
  az-dji-power-1000.html → az-es-dji-power-1000.html → /az/es/dji-power-1000

Lewis, 10/13: "please make a spanish version". Brand and model names stay exactly as on
Amazon (buyers search by make and model); everything around them is Spanish. Every Amazon
link keeps tag=broomepicks-20 (az-track.js still retags it per video) and adds
language=es_US so Amazon itself opens in Spanish.

Edit the English page, then run `python3 scripts/make-az-es.py`. Each English string below
must still be in the page; if one was reworded the script stops and names it, so the
Spanish page never silently keeps old English text.
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
HOST = "https://www.lewisbroome.com"

LANG_CSS = ("  .disclose .lang{display:inline-block;margin-left:.6rem;color:var(--ink);font-weight:700;"
            "border:1px solid var(--line);border-radius:999px;padding:.05rem .65rem;white-space:nowrap}\n")


def lang_link(href, label, hreflang):
    return f' <a class="lang" href="{href}" hreflang="{hreflang}" lang="{hreflang}">🌐 {label}</a>'


def common(html, en_path, es_path):
    """Spanish-wide changes: lang, canonical, hreflang, toggle, internal links, Amazon in Spanish."""
    # make-az-seo.py writes its own Spanish blocks; drop the English ones before translating.
    html = re.sub(r"<!-- (seo:head|seo:index) .*?<!-- /\1 -->\n", "", html, flags=re.S)
    # Undo what toggle_on_english() added to the English page, so reruns start clean.
    html = html.replace(LANG_CSS, "")
    html = re.sub(r'<link rel="alternate" hreflang="(en|es)" href="[^"]*" />\n', "", html)
    html = re.sub(r' <a class="lang" href="[^"]*" hreflang="es" lang="es">🌐 Español</a>', "", html)
    html = html.replace('<html lang="en">', '<html lang="es">', 1)
    html = html.replace(f'href="{HOST}{en_path}"', f'href="{HOST}{es_path}"')
    html = html.replace(f'content="{HOST}{en_path}"', f'content="{HOST}{es_path}"')
    html = html.replace('<meta property="og:type"',
                        f'<link rel="alternate" hreflang="en" href="{HOST}{en_path}" />\n'
                        f'<link rel="alternate" hreflang="es" href="{HOST}{es_path}" />\n'
                        '<meta property="og:locale" content="es_US" />\n<meta property="og:type"', 1)
    html = html.replace("</style>", LANG_CSS + "</style>", 1)
    # Internal links go to the Spanish pages.
    for p in ("/az/hurricane-kit", "/az/dji-power-1000"):
        html = html.replace(f'href="{p}"', f'href="/az/es{p[3:]}"')
    html = html.replace('href="/az"', 'href="/az/es"')
    # Amazon opens in Spanish; the tag stays exactly as it was.
    html = re.sub(r'(href="https://www\.amazon\.com/dp/[A-Z0-9]{10}\?tag=broomepicks-20)"', r'\1&amp;language=es_US"', html)
    html = html.replace("'?tag=broomepicks-20'", "'?tag=broomepicks-20&language=es_US'")
    html = html.replace('<input type="hidden" name="tag" value="broomepicks-20" />',
                        '<input type="hidden" name="tag" value="broomepicks-20" /><input type="hidden" name="language" value="es_US" />')
    # The toggle back to English goes in last, after the internal links were pointed at /az/es.
    html = html.replace(
        '<div class="disclose">As an Amazon Associate I earn from qualifying purchases. It costs you nothing extra.</div>',
        '<div class="disclose">Como Asociado de Amazon gano con las compras que califican. A ti no te cuesta nada extra.'
        + lang_link(en_path, "English", "en") + '</div>', 1)
    return html


def apply(html, pairs, name):
    missing = []
    for en, es in pairs:
        if en not in html:
            missing.append(en)
            continue
        html = html.replace(en, es)
    if missing:
        sys.exit(f"{name}: English text not found (reworded?), Spanish page NOT written:\n  " + "\n  ".join(m[:90] for m in missing))
    return html


def toggle_on_english(path, es_path):
    """The English page gets the Español link next to its disclosure (idempotent)."""
    f = ROOT / path
    html = f.read_text()
    if 'class="lang"' in html:
        return
    html = html.replace("</style>", LANG_CSS + "</style>", 1)
    en_path = es_path.replace("/es", "", 1)
    html = html.replace('<meta property="og:type"',
                        f'<link rel="alternate" hreflang="en" href="{HOST}{en_path}" />\n'
                        f'<link rel="alternate" hreflang="es" href="{HOST}{es_path}" />\n<meta property="og:type"', 1)
    html = html.replace("It costs you nothing extra.</div>",
                        "It costs you nothing extra." + lang_link(es_path, "Español", "es") + "</div>", 1)
    f.write_text(html)


# ---------------------------------------------------------------- /az
AZ = [
    ("<title>Gidgets &amp; Gadgets — Hot Gadgets and Electronics I Actually Use | Lewis Broome</title>",
     "<title>Gidgets &amp; Gadgets — Gadgets y electrónicos que de verdad uso | Lewis Broome</title>"),
    ('content="Gidgets & Gadgets: the 10 Amazon finds from Lewis Broome\'s video, plus every gadget he actually owns — power, car tech, audio, desk, kitchen, tools. Real photos from the beach test. Shop on Amazon."',
     'content="Gidgets & Gadgets: los 10 hallazgos de Amazon del video de Lewis Broome, más cada gadget que de verdad tiene: energía, auto, audio, escritorio, cocina, herramientas. Fotos reales de la prueba en la playa. Compra en Amazon."'),
    ('content="Gidgets &amp; Gadgets — 10 Amazon Finds I Actually Use"', 'content="Gidgets &amp; Gadgets — 10 hallazgos de Amazon que de verdad uso"'),
    ('content="Real photos, real beach test, every pick is something I own. Shop on Amazon."',
     'content="Fotos reales, prueba real en la playa, todo lo que recomiendo es mío. Compra en Amazon."'),
    ("Picked by Lewis Broome · Myrtle Beach, SC", "Elegido por Lewis Broome · Myrtle Beach, SC"),
    ('Gadgets I actually use <span class="rot" id="rot">on the beach</span><br />No hype, just the stuff that works. The ten in my video were shot on the beach, running off one battery.',
     'Gadgets que de verdad uso <span class="rot" id="rot">en la playa</span><br />Sin exagerar, solo lo que funciona. Los diez de mi video se grabaron en la playa, con una sola batería.'),
    ('▶&nbsp; Watch the video <span', '▶&nbsp; Ver el video <span'),
    ('>Shop the 10 finds</a>', '>Compra los 10 hallazgos</a>'),
    ('>Everything I own</a>', '>Todo lo que tengo</a>'),
    ('placeholder="Search all of Amazon…" aria-label="Search Amazon"', 'placeholder="Busca en todo Amazon…" aria-label="Buscar en Amazon"'),
    ('<button type="submit">Search Amazon →</button>', '<button type="submit">Buscar →</button>'),
    ("Not on my list? Search Amazon from here and I still get credit for your order, at no extra cost to you.",
     "¿No está en mi lista? Busca en Amazon desde aquí y tu compra igual me apoya, sin costo extra para ti."),
    ("</b>gadgets I own</div>", "</b>gadgets míos</div>"),
    ("</b>in the video</div>", "</b>en el video</div>"),
    ("</b>battery ran the whole beach day</div>", "</b>batería para todo el día de playa</div>"),
    ("<span>Hurricane season</span>", "<span>Temporada de huracanes</span>"),
    ("<h3>My hurricane kit: 13 things I actually own</h3>", "<h3>Mi kit para huracanes: 13 cosas que de verdad tengo</h3>"),
    ("<p>Battery, solar, generator, fridge, CB radio, distiller. Charge up before it hits →</p>",
     "<p>Batería, solar, generador, refrigerador, radio CB, destilador. Carga todo antes de que llegue →</p>"),
    ("<h2>Shop the photo</h2>", "<h2>Compra la foto</h2>"),
    ("This is my wagon on the beach. Tap a dot to see what it is and check the price.",
     "Este es mi carrito en la playa. Toca un punto para ver qué es y revisar el precio."),
    ('alt="Lewis\'s beach wagon: DJI Power 1000, VEVOR fridge and a fan"', 'alt="El carrito de playa de Lewis: DJI Power 1000, refrigerador VEVOR y un ventilador"'),
    ('aria-label="VEVOR fridge"', 'aria-label="Refrigerador VEVOR"'),
    ('aria-label="Fan">3</button>', 'aria-label="Ventilador">3</button>'),
    ('aria-label="Close">✕</button><h4>', 'aria-label="Cerrar">✕</button><h4>'),
    ("🛒 Buy on Amazon →</a></div>\n      </div>", "🛒 Comprar en Amazon →</a></div>\n      </div>"),
    ("<h2>One battery, one beach day</h2>", "<h2>Una batería, un día de playa</h2>"),
    ("Pick what you'd plug into the DJI Power 1000 and watch the day it gives you.",
     "Elige lo que conectarías al DJI Power 1000 y mira cuánto día te da."),
    ('<small id="gsub">pick a load</small>', '<small id="gsub">elige qué conectar</small>'),
    ('Running <span id="gwatts">0 W</span> off 1,024 Wh', 'Usando <span id="gwatts">0 W</span> de 1,024 Wh'),
    ("🧊 VEVOR fridge · 45 W", "🧊 Refrigerador VEVOR · 45 W"),
    ("🌀 Box fan · 50 W", "🌀 Ventilador · 50 W"),
    ("📱 Phone · 10 W", "📱 Teléfono · 10 W"),
    ("🔊 Rockville speaker · 30 W", "🔊 Bocina Rockville · 30 W"),
    ("💻 Laptop · 60 W", "💻 Laptop · 60 W"),
    ("🥽 Quest charging · 15 W", "🥽 Quest cargando · 15 W"),
    ("🏠 Home fridge · 150 W", "🏠 Refrigerador de casa · 150 W"),
    ('Estimate: 1,024 Wh × 85% usable ÷ watts, the same math as my <a href="/az/es/dji-power-1000" style="color:var(--accent)">hurricane page</a>. Wattages are typical; check your label. Add my solar panel and the fridge-and-fan setup ran all afternoon with charge to spare.',
     'Estimado: 1,024 Wh × 85% utilizable ÷ watts, la misma cuenta de mi <a href="/az/es/dji-power-1000" style="color:var(--accent)">página de huracanes</a>. Los watts son típicos; revisa la etiqueta de tu equipo. Con mi panel solar, el refrigerador y el ventilador funcionaron toda la tarde y sobró carga.'),
    (">DJI Power 1000 on Amazon →</a>", ">DJI Power 1000 en Amazon →</a>"),
    ("<h2>The 10 from the video</h2>", "<h2>Los 10 del video</h2>"),
    ("Tap the photo or the orange button to buy it on Amazon. The ▶ button jumps to it in the video.",
     "Toca la foto o el botón naranja para comprarlo en Amazon. El botón ▶ te lleva a ese momento del video."),
    ("<h2>The beach test</h2>", "<h2>La prueba en la playa</h2>"),
    ("My own shots. Wagon, cooler, fan, solar panel and the app, all off the DJI Power 1000. Tap to enlarge.",
     "Mis propias fotos. Carrito, hielera, ventilador, panel solar y la app, todo con el DJI Power 1000. Toca para agrandar."),
    ("<h2>Everything I own</h2>", "<h2>Todo lo que tengo</h2>"),
    ('<p class="sub">Filter by what you need.</p>', '<p class="sub">Filtra por lo que necesitas.</p>'),
    ('data-cat="all">All</button>', 'data-cat="all">Todo</button>'),
    ('data-cat="video">In the video</button>', 'data-cat="video">En el video</button>'),
    ('data-cat="power">Phone &amp; Power</button>', 'data-cat="power">Teléfono y energía</button>'),
    ('data-cat="car">Car Tech</button>', 'data-cat="car">Para el auto</button>'),
    ('data-cat="desk">Desk &amp; Gaming</button>', 'data-cat="desk">Escritorio y gaming</button>'),
    ('data-cat="home">Smart Home &amp; Security</button>', 'data-cat="home">Casa inteligente y seguridad</button>'),
    ('data-cat="outdoor">Outdoor, Beach &amp; Ride</button>', 'data-cat="outdoor">Aire libre, playa y paseo</button>'),
    ('data-cat="camera">Drones &amp; Cameras</button>', 'data-cat="camera">Drones y cámaras</button>'),
    ('data-cat="tv">TV &amp; Streaming</button>', 'data-cat="tv">TV y streaming</button>'),
    ('data-cat="kitchen">Kitchen</button>', 'data-cat="kitchen">Cocina</button>'),
    ('data-cat="wellness">Home &amp; Wellness</button>', 'data-cat="wellness">Hogar y bienestar</button>'),
    ('data-cat="tools">Tools</button>', 'data-cat="tools">Herramientas</button>'),
    ('placeholder="Type to find a gadget… (ring, tesla, drone)" aria-label="Find a gadget"',
     'placeholder="Escribe para buscar… (ring, tesla, drone)" aria-label="Buscar un gadget"'),
    ("<h2>How I pick</h2>", "<h2>Cómo elijo</h2>"),
    ("<li><strong>I own it.</strong> Every gadget on this page came out of my own orders.</li>",
     "<li><strong>Es mío.</strong> Cada gadget de esta página salió de mis propios pedidos.</li>"),
    ("<li><strong>I say the downside.</strong> If it's not for everybody, I'll tell you who should skip it.</li>",
     "<li><strong>Digo lo malo.</strong> Si no es para todos, te digo quién no debería comprarlo.</li>"),
    ("<li><strong>Prices live on Amazon.</strong> Deals change daily, so every button takes you straight there to buy.</li>",
     "<li><strong>Los precios están en Amazon.</strong> Las ofertas cambian a diario, así que cada botón te lleva directo a comprar.</li>"),
    ('placeholder="Looking for something else? Search Amazon…" aria-label="Search Amazon"',
     'placeholder="¿Buscas otra cosa? Busca en Amazon…" aria-label="Buscar en Amazon"'),
    ('<button type="submit">Search →</button>', '<button type="submit">Buscar →</button>'),
    ("<p>Gidgets &amp; Gadgets is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. As an Amazon Associate I earn from qualifying purchases.</p>",
     "<p>Gidgets &amp; Gadgets participa en el Programa de Asociados de Amazon Services LLC, un programa de publicidad de afiliados diseñado para que los sitios ganen comisiones por publicidad anunciando y enlazando a Amazon.com. Como Asociado de Amazon gano con las compras que califican.</p>"),
    ('aria-label="Video">', 'aria-label="Video">'),
    ('aria-label="Close" data-close>✕</button>\n    <video', 'aria-label="Cerrar" data-close>✕</button>\n    <video'),
    ('<span>🏖️ <b>My beach kit</b> · 4 items</span><button type="button" data-open-kit>Shop it</button>',
     '<span>🏖️ <b>Mi kit de playa</b> · 4 cosas</span><button type="button" data-open-kit>Comprar</button>'),
    ('aria-label="My beach kit">', 'aria-label="Mi kit de playa">'),
    ("<h3>My beach kit</h3>", "<h3>Mi kit de playa</h3>"),
    ("The four things that made the beach day in the video. Each button goes straight to Amazon to buy.",
     "Las cuatro cosas que hicieron el día de playa del video. Cada botón te lleva directo a Amazon para comprar."),
    ("<p>The battery that ran everything.</p>", "<p>La batería que hizo funcionar todo.</p>"),
    ("<p>Cold drinks all day, app control.</p>", "<p>Bebidas frías todo el día, control desde la app.</p>"),
    ("<p>Phone and watch topped up in the chair.</p>", "<p>Teléfono y reloj cargados desde la silla.</p>"),
    ("<p>The music.</p>", "<p>La música.</p>"),
    ("🛒 Buy →</a>", "🛒 Comprar →</a>"),
    ('data-close style="width:100%;margin-top:1rem">Close</button>', 'data-close style="width:100%;margin-top:1rem">Cerrar</button>'),
    ('aria-label="Request a demo">', 'aria-label="Pedir una demostración">'),
    ("<h3>Ask Lewis for a demo</h3>", "<h3>Pídele una demostración a Lewis</h3>"),
    ("I own it, so I'll show you how it actually works. Tell me how to reach you and I'll get back to you directly.",
     "Es mío, así que te muestro cómo funciona de verdad. Dime cómo contactarte y te respondo directamente."),
    ('<label>Product<input', '<label>Producto<input'),
    ("<span><b>Send me a demo video</b><small>Lewis records it with the real gadget and emails it to you.</small></span>",
     "<span><b>Envíame un video de demostración</b><small>Lewis lo graba con el gadget real y te lo manda por email.</small></span>"),
    ("<span><b>Live video demo</b><small>For verified customers. Lewis confirms who you are before scheduling.</small></span>",
     "<span><b>Demostración en vivo por video</b><small>Para clientes verificados. Lewis confirma quién eres antes de agendar.</small></span>"),
    ('<label>Your name<input', '<label>Tu nombre<input'),
    ('<label>Phone<input', '<label>Teléfono<input'),
    ('<label>What do you want to see?<textarea id="d_msg" name="notes" placeholder="e.g. Show me the fan running off it for an hour"></textarea>',
     '<label>¿Qué quieres ver?<textarea id="d_msg" name="notes" placeholder="ej. Muéstrame el ventilador funcionando una hora con la batería"></textarea>'),
    ('<button class="send" type="submit">Request my demo</button>', '<button class="send" type="submit">Pedir mi demostración</button>'),
    ("No charge, no spam. Just me and the gadget.", "Sin costo, sin spam. Solo yo y el gadget."),
    ('data-close style="width:100%;margin-top:.8rem">Close</button>', 'data-close style="width:100%;margin-top:.8rem">Cerrar</button>'),
    ('aria-label="Photo">', 'aria-label="Foto">'),
    ('aria-label="Close" data-close>✕</button>\n    <img', 'aria-label="Cerrar" data-close>✕</button>\n    <img'),
    # The ten from the video: names stay, blurbs go Spanish.
    ("'Smoothies and frozen drinks in single-serve cups. 72 oz pitcher for the whole family.'",
     "'Licuados y bebidas heladas en vasos individuales. Jarra de 72 oz para toda la familia.'"),
    ("'Pocket-size powered screwdriver for small repairs.'", "'Destornillador eléctrico de bolsillo para reparaciones pequeñas.'"),
    ("'10,000mAh with built-in cables. Charges the phone and watch off one brick.'",
     "'10,000mAh con cables integrados. Carga el teléfono y el reloj con una sola batería.'"),
    ("'Plug-in compressor fridge with app control. The cooler full of cold drinks in my beach video.'",
     "'Refrigerador de compresor con control desde la app. La hielera llena de bebidas frías de mi video en la playa.'"),
    ("'1080p second screen that fits in a laptop bag.'", "'Segunda pantalla 1080p que cabe en la mochila de la laptop.'"),
    ("'Big Bluetooth party speaker.'", "'Bocina Bluetooth grande para fiestas.'"),
    ("'Wireless-mic CB with all the controls in the handset.'", "'Radio CB con micrófono inalámbrico y todos los controles en la mano.'"),
    ("'Multi-color 3D printer.'", "'Impresora 3D multicolor.'"),
    ("'Mixed-reality headset. I trade with virtual chart monitors floating around me.'",
     "'Visor de realidad mixta. Hago day trading con monitores virtuales de gráficas flotando a mi alrededor.'"),
    ("'Portable power station for outages, camping and the job site. Ran my whole beach day.'",
     "'Estación de energía portátil para apagones, camping y el trabajo. Aguantó todo mi día de playa.'"),
    ("'Puts an iPhone screen on any TV with an HDMI cable.'", "'Pasa la pantalla del iPhone a cualquier TV con un cable HDMI.'"),
    ("'5,000mAh pocket charger made for the Apple Watch.'", "'Cargador de bolsillo de 5,000mAh hecho para el Apple Watch.'"),
    ("'Small magnetic watch charger for travel.'", "'Cargador magnético pequeño para el reloj, ideal para viajar.'"),
    ("'Battery case that doubles as protection.'", "'Funda con batería que también protege el teléfono.'"),
    ("'Works with Apple Find My for keys, bags and luggage.'", "'Funciona con Encontrar de Apple para llaves, bolsas y maletas.'"),
    ("'Holds the phone and charges it while you drive.'", "'Sostiene el teléfono y lo carga mientras manejas.'"),
    ("'Adds bass without giving up trunk space.'", "'Más bajos sin perder espacio en la cajuela.'"),
    ("'Runs household plugs off the vehicle battery.'", "'Enchufes de casa con la batería del vehículo.'"),
    ("'Earbuds built for job sites and long days.'", "'Audífonos hechos para el trabajo y días largos.'"),
    ("'Noise-canceling single-ear headset for calls on the road.'", "'Diadema de un oído con cancelación de ruido para llamadas en la carretera.'"),
    ("'HDMI, USB and card reader from one USB-C port.'", "'HDMI, USB y lector de tarjetas desde un solo puerto USB-C.'"),
    ("'Backlit wireless keyboard.'", "'Teclado inalámbrico con luz.'"),
    ('"Trackball mouse that\'s easy on the wrist."', "'Mouse trackball que cuida la muñeca.'"),
    ("'Slushies and frozen drinks at home.'", "'Granizados y bebidas heladas en casa.'"),
    ("['dji_wagon_01','DJI Power 1000 in the wagon'],['fan_closeup','Fan running off the DJI'],['cooler_open','Cooler full of cold drinks'],",
     "['dji_wagon_01','DJI Power 1000 en el carrito'],['fan_closeup','Ventilador con el DJI'],['cooler_open','Hielera llena de bebidas frías'],"),
    ("['dji_solar_03','Solar panel on the sand'],['phone_app','DJI app, 48% left'],['dji_wagon_02','Fan on, cooler cold'],",
     "['dji_solar_03','Panel solar en la arena'],['phone_app','App de DJI, queda 48%'],['dji_wagon_02','Ventilador encendido, hielera fría'],"),
    ("['dji_solar_01','Solar charging on the beach'],['dji_wagon_03','Cables to the cooler'],['quest_vr','Trading in VR'],",
     "['dji_solar_01','Carga solar en la playa'],['dji_wagon_03','Cables a la hielera'],['quest_vr','Trading en realidad virtual'],"),
    ("['dji_cooler_03','Cooler from the side'],['dji_solar_02','Cable close-up'],['dji_wagon_04','From above']",
     "['dji_cooler_03','La hielera de lado'],['dji_solar_02','El cable de cerca'],['dji_wagon_04','Desde arriba']"),
    ('<a href="https://www.amazon.com/coupons?tag=broomepicks-20" target="_blank" rel="sponsored noopener">✂️ Amazon Coupons</a>',
     '<a href="https://www.amazon.com/coupons?tag=broomepicks-20&amp;language=es_US" target="_blank" rel="sponsored noopener">✂️ Cupones de Amazon</a>'),
    ('<a href="https://www.amazon.com/deals?tag=broomepicks-20" target="_blank" rel="sponsored noopener">🔥 Today\'s Deals</a>',
     '<a href="https://www.amazon.com/deals?tag=broomepicks-20&amp;language=es_US" target="_blank" rel="sponsored noopener">🔥 Ofertas del día</a>'),
    ("Amazon's own coupons and deals, updated every day. Clip a coupon and save at checkout.",
     "Los cupones y ofertas de Amazon, nuevos cada día. Activa un cupón y ahorra al pagar."),
    ('<p class="clip">✂️ Look for a clip coupon on the Amazon page</p>', '<p class="clip">✂️ Busca un cupón para activar en la página de Amazon</p>'),
    ('title="Buy on Amazon"', 'title="Comprar en Amazon"'),
    ('<span class="tag">I own this</span>', '<span class="tag">Es mío</span>'),
    ("' in video</span>'", "' en el video</span>'"),
    ("'<span class=\"tag beach\">My photo</span>'", "'<span class=\"tag beach\">Mi foto</span>'"),
    ("'<span class=\"tag yr\">Bought '", "'<span class=\"tag yr\">Comprado en '"),
    ("'Was unavailable last time I checked; the button still shows the listing.'",
     "'No estaba disponible la última vez que revisé; el botón igual muestra el anuncio.'"),
    ('noopener">🛒 Buy on Amazon →</a>', 'noopener">🛒 Comprar en Amazon →</a>'),
    ('title="Ask Lewis for a demo">🎥 Demo</button>', 'title="Pídele una demostración a Lewis">🎥 Demo</button>'),
    ("fcount.textContent=n+' of '+ag.children.length;", "fcount.textContent=n+' de '+ag.children.length;"),
    ("'<button data-t=\"0\">0:00 Intro</button>'", "'<button data-t=\"0\">0:00 Inicio</button>'"),
    ("var WORDS=['on the beach','in the truck','at my desk','when the power goes out','every single day']",
     "var WORDS=['en la playa','en la camioneta','en mi escritorio','cuando se va la luz','todos los días']"),
    ("dji:{h:'DJI Power 1000',p:'The grey box with the green light. 1,024 Wh, and it ran the fridge, the fan and my phone all afternoon.',a:'B0CZ6KTYH7'},",
     "dji:{h:'DJI Power 1000',p:'La caja gris con la luz verde. 1,024 Wh, y aguantó el refrigerador, el ventilador y mi teléfono toda la tarde.',a:'B0CZ6KTYH7'},"),
    ("vevor:{h:'VEVOR 12V Fridge (21 qt)',p:'The lid with the two latches. Compressor fridge, not an ice chest. Drinks stay cold off the DJI.',a:'B0H5PM66WN'},",
     "vevor:{h:'VEVOR 12V Fridge (21 qt)',p:'La tapa con los dos seguros. Refrigerador de compresor, no una hielera. Las bebidas siguen frías con el DJI.',a:'B0H5PM66WN'},"),
    ("fan:{h:'Fan on the DJI',p:'A plain box fan plugged into the DJI\\'s outlet, about 50 W. Any fan works; the battery is the trick.',a:'B0CZ6KTYH7'}",
     "fan:{h:'Ventilador con el DJI',p:'Un ventilador común conectado al enchufe del DJI, unos 50 W. Cualquier ventilador sirve; el truco es la batería.',a:'B0CZ6KTYH7'}"),
    ("gh.textContent=h>=48?Math.round(h/24)+' days':h>=1?(Math.round(h*10)/10)+' h':Math.round(h*60)+' min';",
     "gh.textContent=h>=48?Math.round(h/24)+' días':h>=1?(Math.round(h*10)/10)+' h':Math.round(h*60)+' min';"),
    ("gs.textContent='pick a load';", "gs.textContent='elige qué conectar';"),
    ("gs.textContent=h>=24?'more than a full day':h>=8?'a full beach day':h>=3?'an afternoon':'a short session';",
     "gs.textContent=h>=24?'más de un día completo':h>=8?'un día de playa completo':h>=3?'una tarde':'un rato corto';"),
    # Demo form: the visitor reads Spanish; the CRM note tells Lewis to answer in Spanish.
    ("dnote.textContent='Your name and an email so I can reach you.';", "dnote.textContent='Tu nombre y un email para poder contactarte.';"),
    ("dnote.textContent='A live demo needs a phone number too, so Lewis can verify you.';",
     "dnote.textContent='Para una demostración en vivo también necesito tu teléfono, así Lewis puede verificarte.';"),
    ("dnote.textContent='Sending…';", "dnote.textContent='Enviando…';"),
    ("quote_link:'https://www.lewisbroome.com/az',notes:kind+'\\nProduct: '",
     "quote_link:'https://www.lewisbroome.com/az/es',notes:'Language: SPANISH (from /az/es, reply in Spanish)\\n'+kind+'\\nProduct: '"),
    ("'<b>Request received, pending verification.</b> Lewis will confirm who you are first, then set up the live demo of the '+esc(prod)+'.'",
     "'<b>Solicitud recibida, pendiente de verificación.</b> Lewis primero confirmará quién eres y luego agendará la demostración en vivo del '+esc(prod)+'.'"),
    ("'<b>Got it.</b> Lewis will record a demo of the '+esc(prod)+' and email it to you.'",
     "'<b>Listo.</b> Lewis grabará una demostración del '+esc(prod)+' y te la enviará por email.'"),
    ("dnote.innerHTML=\"<b>Couldn't send that automatically.</b> Opening your email instead; please press send.\";",
     "dnote.innerHTML=\"<b>No se pudo enviar automáticamente.</b> Abriendo tu email; por favor presiona enviar.\";"),
    ("encodeURIComponent('Demo request: '+prod)", "encodeURIComponent('Demo request (Spanish): '+prod)"),
]

# ---------------------------------------------------------------- /az/hurricane-kit
KIT = [
    ("<title>My Hurricane Kit — Beach-Tested Gear I Actually Own | Lewis Broome</title>",
     "<title>Mi kit para huracanes — Equipo probado en la playa que de verdad tengo | Lewis Broome</title>"),
    ('content="Lewis Broome\'s hurricane kit from Myrtle Beach: DJI Power 1000, solar, a 2,500W inverter generator, a 12V fridge, CB radio, lanterns, water distiller and more. Every item owned and used. Buy on Amazon."',
     'content="El kit para huracanes de Lewis Broome en Myrtle Beach: DJI Power 1000, panel solar, generador inverter de 2,500W, refrigerador de 12V, radio CB, lámparas, destilador de agua y más. Todo es suyo y lo usa. Compra en Amazon."'),
    ('content="My Hurricane Kit — 13 Things I Actually Own"', 'content="Mi kit para huracanes — 13 cosas que de verdad tengo"'),
    ('content="Charge it before the storm, solar after, talk when the towers are down. Beach-tested in Myrtle Beach."',
     'content="Carga antes de la tormenta, solar después, comunícate cuando caen las torres. Probado en la playa en Myrtle Beach."'),
    ("<i></i> Hurricane season · Myrtle Beach, SC", "<i></i> Temporada de huracanes · Myrtle Beach, SC"),
    ("<h1>It's hurricane season.<br /><span>Be prepared.</span></h1>", "<h1>Llegó la temporada de huracanes.<br /><span>Prepárate.</span></h1>"),
    ("This is the kit I actually own, tested on the beach running off one battery. Charge it before the storm, solar after, talk when the towers are down. Every button buys it on Amazon.",
     "Este es el kit que de verdad tengo, probado en la playa con una sola batería. Carga antes de la tormenta, solar después, comunícate cuando caen las torres. Cada botón lo compra en Amazon."),
    ("🛒 Shop the whole kit</button>", "🛒 Compra todo el kit</button>"),
    ('href="#kit">See all 13 items</a>', 'href="#kit">Ver las 13 cosas</a>'),
    ("</b>Wh in the battery</div>", "</b>Wh en la batería</div>"),
    ("</b>W gas backup</div>", "</b>W de respaldo a gasolina</div>"),
    ("</b>W of solar</div>", "</b>W de energía solar</div>"),
    ("</b>items, all mine</div>", "</b>cosas, todas mías</div>"),
    ("<h2>The plan</h2><p class=\"sub\">Three moves. The gear below is what makes each one work.</p>",
     "<h2>El plan</h2><p class=\"sub\">Tres pasos. El equipo de abajo es lo que hace funcionar cada uno.</p>"),
    ("<h3>Charge up before it hits</h3><p>DJI Power 1000 full from the wall in about 70 minutes. Phones, watch bank, lithium AAs topped off.</p>",
     "<h3>Carga todo antes de que llegue</h3><p>El DJI Power 1000 se llena desde la pared en unos 70 minutos. Teléfonos, batería del reloj y pilas AA de litio, todo cargado.</p>"),
    ("<h3>Run the essentials</h3><p>Fridge, fan, Wi-Fi, lights, the distiller. Generator for the long haul; the DJI runs inside, silent.</p>",
     "<h3>Mantén lo esencial</h3><p>Refrigerador, ventilador, Wi-Fi, luces, el destilador. El generador para apagones largos; el DJI funciona adentro, sin ruido.</p>"),
    ("<h3>Stay connected</h3><p>CB radio when the cell towers are down, Starlink Mini for internet from the sky, power from the truck.</p>",
     "<h3>Mantente conectado</h3><p>Radio CB cuando caen las torres de celular, Starlink Mini para internet desde el cielo, energía desde la camioneta.</p>"),
    ("<h2>The power core</h2><p class=\"sub\">Battery, sun and gas. One of these keeps the lights on no matter how long it takes.</p>",
     "<h2>El corazón de la energía</h2><p class=\"sub\">Batería, sol y gasolina. Uno de estos mantiene la luz prendida sin importar cuánto dure.</p>"),
    ('alt="DJI Power 1000 in my beach wagon"', 'alt="DJI Power 1000 en mi carrito de playa"'),
    ('<span class="tag">The heart of it</span>', '<span class="tag">El corazón del kit</span>'),
    ("<p>1,024 Wh, 2,200 W out, 70 minutes to full, silent, runs indoors. It ran my whole beach day: fridge, fan and phones.</p>",
     "<p>1,024 Wh, 2,200 W de salida, 70 minutos para cargarse, silencioso, funciona adentro. Aguantó todo mi día de playa: refrigerador, ventilador y teléfonos.</p>"),
    ('<span class="chip">70 min charge</span><span class="chip">Fridge + fan ≈ 8 h</span>',
     '<span class="chip">Carga en 70 min</span><span class="chip">Refri + ventilador ≈ 8 h</span>'),
    ('alt="CRAFTSMAN 2,500W inverter generator"', 'alt="Generador inverter CRAFTSMAN de 2,500W"'),
    ('<span class="tag">Long outage</span>', '<span class="tag">Apagón largo</span>'),
    ('<span class="chip">2,500 W start</span><span class="chip">Gas</span>', '<span class="chip">2,500 W de arranque</span><span class="chip">Gasolina</span>'),
    ('alt="DOKIO folding solar panel"', 'alt="Panel solar plegable DOKIO"'),
    ('<span class="tag">After the storm</span>', '<span class="tag">Después de la tormenta</span>'),
    ('<span class="chip">6 lb, folds</span>', '<span class="chip">6 lb, plegable</span>'),
    ("<h2>The whole kit</h2><p class=\"sub\">Thirteen things, all mine, all live on Amazon today.</p>",
     "<h2>Todo el kit</h2><p class=\"sub\">Trece cosas, todas mías, todas disponibles hoy en Amazon.</p>"),
    ("<h3>Looking for something else?</h3>", "<h3>¿Buscas otra cosa?</h3>"),
    ('placeholder="Search all of Amazon…" aria-label="Search Amazon"', 'placeholder="Busca en todo Amazon…" aria-label="Buscar en Amazon"'),
    ('<button type="submit">Search →</button>', '<button type="submit">Buscar →</button>'),
    ("Searching from here still credits me for your order, at no extra cost to you.",
     "Si buscas desde aquí, tu compra igual me apoya, sin costo extra para ti."),
    ("<a href=\"/az/es/dji-power-1000\">DJI Power 1000 deep dive</a>", "<a href=\"/az/es/dji-power-1000\">DJI Power 1000 a fondo</a>"),
    ("<p style=\"margin-top:.6rem\">Myrtle Beach, SC. As an Amazon Associate I earn from qualifying purchases.</p>",
     "<p style=\"margin-top:.6rem\">Myrtle Beach, SC. Como Asociado de Amazon gano con las compras que califican.</p>"),
    ('<span>🌀 <b>My hurricane kit</b> · 13 items</span><button type="button" data-open-kit>Shop it</button>',
     '<span>🌀 <b>Mi kit para huracanes</b> · 13 cosas</span><button type="button" data-open-kit>Comprar</button>'),
    ('aria-label="Shop the whole kit">', 'aria-label="Compra todo el kit">'),
    ("<h3>Shop the whole kit</h3>", "<h3>Compra todo el kit</h3>"),
    ("Each button opens that item on Amazon. Grab what you're missing.", "Cada botón abre esa cosa en Amazon. Consigue lo que te falte."),
    ('data-close style="width:100%;margin-top:1rem">Close</button>', 'data-close style="width:100%;margin-top:1rem">Cerrar</button>'),
    ("🛒 Buy on Amazon →", "🛒 Comprar en Amazon →"),
    ("🛒 Buy →", "🛒 Comprar →"),
    ("<span class=\"own\">I own this</span>", "<span class=\"own\">Es mío</span>"),
    ("b:'1,024 Wh · 2,200 W',p:'The heart of it. Silent, indoors, 70 minutes to full.'",
     "b:'1,024 Wh · 2,200 W',p:'El corazón del kit. Silencioso, para adentro, se llena en 70 minutos.'"),
    ("b:'2,500 W gas',p:'The backup to the backup when the sun is gone for days.'",
     "b:'2,500 W a gasolina',p:'El respaldo del respaldo cuando no hay sol por días.'"),
    ("b:'110 W solar',p:'Six pounds. Recharges the DJI on the hood of the truck.'",
     "b:'110 W solar',p:'Seis libras. Recarga el DJI sobre el cofre de la camioneta.'"),
    ("b:'45 W · ~19 h on the DJI',p:'A real compressor fridge. The cooler from my beach video.'",
     "b:'45 W · ~19 h con el DJI',p:'Un refrigerador de compresor de verdad. La hielera de mi video en la playa.'"),
    ("p:'Two real wall outlets off the truck battery.'", "p:'Dos enchufes de pared de verdad con la batería de la camioneta.'"),
    ("b:'Wi-Fi never blinks',p:'Modem and router ride through the outage.'",
     "b:'El Wi-Fi no se corta',p:'El módem y el router siguen funcionando durante el apagón.'"),
    ("b:'40 ch · NOAA alerts',p:'Talk when the cell towers go down.'",
     "b:'40 canales · alertas NOAA',p:'Comunícate cuando caen las torres de celular.'"),
    ("b:'Internet from the sky',p:'Sticks to the windshield, powered off the truck.'",
     "b:'Internet desde el cielo',p:'Se pega al parabrisas y se alimenta de la camioneta.'"),
    ("b:'750 W · 1.1 gal',p:'Clean water on a boil notice. Runs off the DJI or the generator.'",
     "b:'750 W · 1.1 gal',p:'Agua limpia cuando hay aviso de hervir el agua. Funciona con el DJI o el generador.'"),
    ("b:'20,000 mAh · all night',p:'No power means no AC. Runs all night on low.'",
     "b:'20,000 mAh · toda la noche',p:'Sin luz no hay aire acondicionado. Funciona toda la noche en bajo.'"),
    ("b:'Glow in the dark',p:'One per room, and you can find them in the black.'",
     "b:'Brillan en la oscuridad',p:'Una por cuarto, y las encuentras aunque esté todo oscuro.'"),
    ("b:'1.5 V · USB charger',p:'Flashlights, lanterns, the CB. Charges off the DJI.'",
     "b:'1.5 V · cargador USB',p:'Linternas, lámparas, el radio CB. Se cargan con el DJI.'"),
    ("p:'Phone and watch off one brick, cables built in.'", "p:'Teléfono y reloj con una sola batería, cables integrados.'"),
    ("b:'142 pieces',p:'Tourniquet, fire starter, whistle, flashlight. Lives in the truck.'",
     "b:'142 piezas',p:'Torniquete, encendedor de fuego, silbato, linterna. Vive en la camioneta.'"),
]

# ---------------------------------------------------------------- /az/dji-power-1000
DJI = [
    ("<title>DJI Power 1000 for Hurricane Season — Real Use on the Beach | Gidgets &amp; Gadgets</title>",
     "<title>DJI Power 1000 para la temporada de huracanes — Uso real en la playa | Gidgets &amp; Gadgets</title>"),
    ('content="Lewis Broome\'s DJI Power 1000 power station: 1024Wh, 2200W output, recharges from the wall in about 70 minutes or from solar. Why it\'s his hurricane-season backup, plus a runtime calculator."',
     'content="La estación de energía DJI Power 1000 de Lewis Broome: 1024Wh, 2200W de salida, se recarga desde la pared en unos 70 minutos o con energía solar. Por qué es su respaldo para huracanes, más una calculadora de duración."'),
    ('content="The power station I\'d want when the hurricane knocks the power out"',
     'content="La estación de energía que quiero tener cuando el huracán tumba la luz"'),
    ('content="DJI Power 1000 — hands-on from Myrtle Beach. Runtime calculator inside."',
     'content="DJI Power 1000 — probado en Myrtle Beach. Con calculadora de duración."'),
    ("<span class=\"alert\">Hurricane season runs through Nov 30</span>", "<span class=\"alert\">La temporada de huracanes dura hasta el 30 de noviembre</span>"),
    ("<h1>The power station I'd want when the hurricane knocks the power out</h1>",
     "<h1>La estación de energía que quiero tener cuando el huracán tumba la luz</h1>"),
    ("I live in Myrtle Beach. I own the DJI Power 1000, and I've used it on the beach with a solar panel. Here's why it's my storm backup, what it'll run, and who should skip it.",
     "Vivo en Myrtle Beach. Tengo el DJI Power 1000 y lo he usado en la playa con un panel solar. Aquí te digo por qué es mi respaldo para tormentas, qué puede alimentar y quién no debería comprarlo."),
    ("🛒 Buy the DJI Power 1000 on Amazon →", "🛒 Compra el DJI Power 1000 en Amazon →"),
    ('href="#calc">What will it run?</a>', 'href="#calc">¿Qué puede alimentar?</a>'),
    ("Prices and deals change daily. The button shows the current one.", "Los precios y ofertas cambian a diario. El botón muestra el actual."),
    ("<h3>Best for</h3>", "<h3>Ideal para</h3>"),
    ("<li>Keeping phones, Wi-Fi, lights, fans and a fridge going through an outage</li>",
     "<li>Mantener teléfonos, Wi-Fi, luces, ventiladores y un refrigerador durante un apagón</li>"),
    ("<li>Coastal homes that lose power every storm season</li>", "<li>Casas en la costa que pierden la luz cada temporada de tormentas</li>"),
    ("<li>Beach days, tailgates, camping and job sites</li>", "<li>Días de playa, carnes asadas, camping y el trabajo</li>"),
    ("<h3>Skip it if</h3>", "<h3>No lo compres si</h3>"),
    ("<li>You need to run central AC or the whole house (that's a standby generator)</li>",
     "<li>Necesitas el aire central o toda la casa (para eso es un generador fijo)</li>"),
    ("<li>You only charge phones (a power bank is plenty)</li>", "<li>Solo cargas teléfonos (con una batería portátil basta)</li>"),
    ("<h3>Why a power station instead of a gas generator</h3>", "<h3>Por qué una estación de energía y no un generador a gasolina</h3>"),
    ("<li>No gas, no fumes, no noise. It runs inside the house.</li>", "<li>Sin gasolina, sin humo, sin ruido. Funciona dentro de la casa.</li>"),
    ("<li>Recharges from the wall in about 70 minutes before the storm, then from solar after.</li>",
     "<li>Se recarga desde la pared en unos 70 minutos antes de la tormenta, y con energía solar después.</li>"),
    ("<h2>How I use it</h2>", "<h2>Cómo lo uso</h2>"),
    ('alt="DJI Power 1000 in my beach wagon"', 'alt="DJI Power 1000 en mi carrito de playa"'),
    ('alt="Fan running off the DJI"', 'alt="Ventilador funcionando con el DJI"'),
    ('alt="Solar panel on the sand"', 'alt="Panel solar en la arena"'),
    ('alt="DJI app showing 48% left"', 'alt="App de DJI con 48% restante"'),
    ("We took it to the beach with a solar panel and ran everything off it all day. That's the same setup I'd use after a hurricane: charge it full from the wall while the power's still on, then keep it topped up with the panel once the grid goes down.",
     "Lo llevamos a la playa con un panel solar y funcionó todo el día con él. Es el mismo equipo que usaría después de un huracán: cárgalo completo desde la pared mientras hay luz y mantenlo cargado con el panel cuando se vaya la luz."),
    ("Watch the beach video on my TikTok →", "Mira el video en la playa en mi TikTok →"),
    ("<h2>The numbers</h2>", "<h2>Los números</h2>"),
    ("<tr><td>Battery</td><td>1,024 Wh, LFP (lithium iron phosphate)</td></tr>", "<tr><td>Batería</td><td>1,024 Wh, LFP (litio ferrofosfato)</td></tr>"),
    ("<tr><td>Continuous output</td><td>2,200 W</td></tr>", "<tr><td>Salida continua</td><td>2,200 W</td></tr>"),
    ("<tr><td>Wall recharge</td><td>About 70 min to full, 50 min to 80%</td></tr>", "<tr><td>Recarga en la pared</td><td>Unos 70 min al 100%, 50 min al 80%</td></tr>"),
    ("<tr><td>USB-C</td><td>Two 140 W ports</td></tr>", "<tr><td>USB-C</td><td>Dos puertos de 140 W</td></tr>"),
    ("<tr><td>Recharge options</td><td>Wall, car, solar</td></tr>", "<tr><td>Formas de recarga</td><td>Pared, auto, solar</td></tr>"),
    ("<tr><td>Rated life</td><td>4,000 cycles</td></tr>", "<tr><td>Vida útil</td><td>4,000 ciclos</td></tr>"),
    (">Specs from <a", ">Especificaciones de <a"),
    ("<h2>What will it run, and for how long?</h2>", "<h2>¿Qué puede alimentar y por cuánto tiempo?</h2>"),
    ('<label for="dev">Pick a device or type its watts</label>', '<label for="dev">Elige un aparato o escribe sus watts</label>'),
    ('<option value="">Pick a device…</option>', '<option value="">Elige un aparato…</option>'),
    ("Phone charging (~10 W)", "Teléfono cargando (~10 W)"),
    ("Wi-Fi router (~12 W)", "Router Wi-Fi (~12 W)"),
    ("LED lamp (~10 W)", "Lámpara LED (~10 W)"),
    ("Box fan (~50 W)", "Ventilador (~50 W)"),
    ("TV (~100 W)", "Televisión (~100 W)"),
    ("Refrigerator, average running (~150 W)", "Refrigerador, promedio funcionando (~150 W)"),
    ("Chest freezer + router + lights (~250 W)", "Congelador + router + luces (~250 W)"),
    ('placeholder="Watts"', 'placeholder="Watts"'),
    ('Runtime: <span>—</span>', 'Duración: <span>—</span>'),
    ("Estimate: 1,024 Wh × 85% usable ÷ watts. Wattages are typical. Check the label on your device.",
     "Estimado: 1,024 Wh × 85% utilizable ÷ watts. Los watts son típicos. Revisa la etiqueta de tu aparato."),
    ("<h2>The rest of my storm kit</h2>", "<h2>El resto de mi kit para tormentas</h2>"),
    ("See the full hurricane kit page →", "Ver la página completa del kit para huracanes →"),
    ("Everything here is mine. Every button goes straight to Amazon to buy.", "Todo aquí es mío. Cada botón te lleva directo a Amazon para comprar."),
    ("<span class=\"own\">I own this</span>", "<span class=\"own\">Es mío</span>"),
    ("🛒 Buy on Amazon →", "🛒 Comprar en Amazon →"),
    ('alt="CRAFTSMAN 2,500W inverter generator"', 'alt="Generador inverter CRAFTSMAN de 2,500W"'),
    ('<span class="badge">2,500 W gas</span>', '<span class="badge">2,500 W a gasolina</span>'),
    ("<p>The backup to the backup. Quiet inverter generator for the fridge and the DJI when the sun's gone for days.</p>",
     "<p>El respaldo del respaldo. Generador inverter silencioso para el refrigerador y el DJI cuando no hay sol por días.</p>"),
    ('alt="DOKIO folding solar panel"', 'alt="Panel solar plegable DOKIO"'),
    ("<p>Six pounds, folds like a briefcase, recharges the DJI on the hood of the truck.</p>",
     "<p>Seis libras, se dobla como un portafolio y recarga el DJI sobre el cofre de la camioneta.</p>"),
    ('alt="VEVOR fridge full of cold drinks"', 'alt="Refrigerador VEVOR lleno de bebidas frías"'),
    ('<span class="badge">45 W · ~19 h on the DJI</span>', '<span class="badge">45 W · ~19 h con el DJI</span>'),
    ("<p>A real compressor fridge, not an ice chest. The cooler from my beach video.</p>",
     "<p>Un refrigerador de compresor de verdad, no una hielera. La hielera de mi video en la playa.</p>"),
    ('alt="KRIËGER 1100W power inverter"', 'alt="Inversor de corriente KRIËGER de 1100W"'),
    ("<p>Two real wall outlets off the truck battery.</p>", "<p>Dos enchufes de pared de verdad con la batería de la camioneta.</p>"),
    ('alt="UPS battery backup"', 'alt="Respaldo de batería UPS"'),
    ('<span class="badge">Wi-Fi never blinks</span>', '<span class="badge">El Wi-Fi no se corta</span>'),
    ("<p>Modem and router ride through the outage, surge protection for the rest.</p>",
     "<p>El módem y el router siguen funcionando durante el apagón, y protege lo demás de picos de voltaje.</p>"),
    ('alt="Cobra 75 All Road CB radio"', 'alt="Radio CB Cobra 75 All Road"'),
    ('<span class="badge">40 ch · NOAA alerts</span>', '<span class="badge">40 canales · alertas NOAA</span>'),
    ("<p>Talk when the cell towers go down. Weather alerts built in.</p>", "<p>Comunícate cuando caen las torres de celular. Con alertas del clima integradas.</p>"),
    ('alt="RORRY 3-in-1 power bank"', 'alt="Batería portátil RORRY 3 en 1"'),
    ("<p>Phone and watch off one brick, cables built in.</p>", "<p>Teléfono y reloj con una sola batería, cables integrados.</p>"),
    ('alt="Lithium rechargeable AA batteries"', 'alt="Pilas AA recargables de litio"'),
    ('<span class="badge">1.5 V lithium · USB charger</span>', '<span class="badge">1.5 V litio · cargador USB</span>'),
    ("<p>Flashlights, lanterns, the CB. Charges off the DJI.</p>", "<p>Linternas, lámparas, el radio CB. Se cargan con el DJI.</p>"),
    ('<span class="badge">10 pack · glow in the dark</span>', '<span class="badge">Paquete de 10 · brillan en la oscuridad</span>'),
    ("<p>One per room, and you can find them in the dark.</p>", "<p>Una por cuarto, y las encuentras aunque esté oscuro.</p>"),
    ('<span class="badge">20,000 mAh · all night</span>', '<span class="badge">20,000 mAh · toda la noche</span>'),
    ("<p>No power means no AC. This runs all night on low and charges a phone.</p>",
     "<p>Sin luz no hay aire acondicionado. Este funciona toda la noche en bajo y carga un teléfono.</p>"),
    ("<p>Clean water when the tap is on a boil notice. Runs off the DJI or the generator.</p>",
     "<p>Agua limpia cuando hay aviso de hervir el agua de la llave. Funciona con el DJI o el generador.</p>"),
    ('<span class="badge">142 pieces</span>', '<span class="badge">142 piezas</span>'),
    ("<p>Tourniquet, fire starter, whistle, flashlight. Lives in the truck.</p>", "<p>Torniquete, encendedor de fuego, silbato, linterna. Vive en la camioneta.</p>"),
    ('alt="Starlink Mini mount and car charger"', 'alt="Soporte y cargador de auto para Starlink Mini"'),
    ("<p>Internet from the sky, power from the truck, when the ground lines are gone.</p>",
     "<p>Internet desde el cielo y energía desde la camioneta, cuando no hay líneas en tierra.</p>"),
    ("<h2>Questions</h2>", "<h2>Preguntas</h2>"),
    ("<summary>Can it run my refrigerator?</summary><p>Most household fridges average around 100–200 W once running, so a full charge covers several hours, longer if you keep the door shut. Use the calculator above with your fridge's rating.</p>",
     "<summary>¿Puede alimentar mi refrigerador?</summary><p>La mayoría de los refrigeradores de casa usan en promedio 100–200 W ya funcionando, así que una carga completa dura varias horas, más si mantienes la puerta cerrada. Usa la calculadora de arriba con los watts de tu refrigerador.</p>"),
    ("<summary>Can I use it indoors?</summary><p>Yes. It's a battery with no engine, so there are no fumes. Never run a gas generator indoors.</p>",
     "<summary>¿Lo puedo usar adentro?</summary><p>Sí. Es una batería sin motor, así que no hay humo. Nunca uses un generador a gasolina adentro.</p>"),
    ("<summary>How do I recharge it with the power out?</summary><p>Solar panel or your car. Charge it full from the wall before the storm hits.</p>",
     "<summary>¿Cómo lo recargo si no hay luz?</summary><p>Con panel solar o con tu auto. Cárgalo completo desde la pared antes de que llegue la tormenta.</p>"),
    ("<summary>Will it run central air or a whole house?</summary><p>No. It's for essentials. For the whole house you need a standby generator.</p>",
     "<summary>¿Puede con el aire central o toda la casa?</summary><p>No. Es para lo esencial. Para toda la casa necesitas un generador fijo.</p>"),
    ("🛒 Buy the DJI Power 1000 on Amazon</a>", "🛒 Compra el DJI Power 1000 en Amazon</a>"),
    ("Gidgets &amp; Gadgets is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. As an Amazon Associate I earn from qualifying purchases.",
     "Gidgets &amp; Gadgets participa en el Programa de Asociados de Amazon Services LLC, un programa de publicidad de afiliados diseñado para que los sitios ganen comisiones por publicidad anunciando y enlazando a Amazon.com. Como Asociado de Amazon gano con las compras que califican."),
    ("out.textContent='Over 2,200 W — too much for this unit';", "out.textContent='Más de 2,200 W — es demasiado para este equipo';"),
    ("out.textContent=h>=48?'about '+Math.round(h/24)+' days':(h>=1?'about '+(Math.round(h*10)/10)+' hours':'about '+Math.round(h*60)+' minutes');",
     "out.textContent=h>=48?'unos '+Math.round(h/24)+' días':(h>=1?'unas '+(Math.round(h*10)/10)+' horas':'unos '+Math.round(h*60)+' minutos');"),
]

# The GPTMarketing.us credit line every page carries (Lewis, 10/15).
CREDIT = [(">Website by <a", ">Sitio web por <a")]
AZ += CREDIT
KIT += CREDIT
DJI += CREDIT

PAGES = [
    ("az.html", "az-es.html", "/az", "/az/es", AZ),
    ("az-hurricane-kit.html", "az-es-hurricane-kit.html", "/az/hurricane-kit", "/az/es/hurricane-kit", KIT),
    ("az-dji-power-1000.html", "az-es-dji-power-1000.html", "/az/dji-power-1000", "/az/es/dji-power-1000", DJI),
]

if __name__ == "__main__":
    for src, dst, en_path, es_path, pairs in PAGES:
        html = (ROOT / src).read_text()
        html = common(html, en_path, es_path)
        html = apply(html, pairs, src)
        (ROOT / dst).write_text(html)
        toggle_on_english(src, es_path)
        print(f"{dst}: written")
    # Search-engine layer (meta tags, structured data, A-Z list) on all six pages.
    import subprocess
    subprocess.run([sys.executable, str(ROOT / "scripts" / "make-az-seo.py")], check=True)
