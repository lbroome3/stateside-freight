/*
 * share.js — the Share button on every page of lewisbroome.com.
 *
 * Lewis, 10/21: "A website share button." / "This share button is for the entire website."
 * Every page loads <script src="/share.js" defer></script>; it adds a small floating
 * "Share" pill (bottom-left: the site chat sits bottom-right, the /az kit bar bottom-centre)
 * that shares the page it is on (lifted above the kit bar while that bar shows) (its canonical URL when it has one). Pages may also carry a
 * big inline button. On a phone it opens the phone's own share sheet
 * (navigator.share: Messages, email, WhatsApp, anything). Where that doesn't exist (most
 * computers) it opens a small menu: Copy link, Text, Email, X, Facebook.
 *
 * Inline markup: <button class="sharebtn" type="button" data-share-url="/az/hot-picks"
 *          data-share-title="…" data-share-text="…">📤 Share</button>
 * Store links (/az…) carry ?v=share so visits from shares show in Gadget Analytics
 * (az-track.js reads ?v= as the campaign; "share" keeps the default Associates tag); other
 * pages share their clean URL. Taps are logged as a "share" event when az-track.js is loaded.
 */
(function () {
  var es = /^es/.test(document.documentElement.lang);
  var L = es
    ? { copy: "Copiar enlace", copied: "¡Enlace copiado!", text: "Mensaje de texto", email: "Correo", close: "Cerrar" }
    : { copy: "Copy link", copied: "Link copied!", text: "Text message", email: "Email", close: "Close" };
  var css = document.createElement("style");
  css.textContent =
    ".sharebtn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;width:100%;max-width:560px;border:0;border-radius:14px;padding:.95rem 1.2rem;font:800 1.05rem Inter,system-ui,sans-serif;color:#fff;cursor:pointer;background:linear-gradient(90deg,#be185d,#f472b6 60%,#ff9900);box-shadow:0 8px 28px rgba(244,114,182,.35)}" +
    ".sharebtn:active{transform:scale(.98)}" +
    ".sharemenu{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;max-width:560px;margin-top:.6rem}" +
    ".sharemenu a,.sharemenu button{display:flex;align-items:center;justify-content:center;gap:.4rem;border:1.5px solid rgba(120,140,180,.35);background:rgba(20,26,38,.85);color:#eef2f8;border-radius:12px;padding:.7rem .8rem;font:700 .92rem Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none}" +
    ".sharemenu[hidden]{display:none}" +
    ".sharefab{position:fixed;left:14px;bottom:14px;z-index:9990;width:auto;max-width:none;padding:.65rem 1rem;font-size:.92rem;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.35)}" +
    ".sharemenu.fab{position:fixed;left:14px;bottom:66px;z-index:9990;width:min(320px,calc(100vw - 28px));margin:0;padding:.5rem;border-radius:16px;background:rgba(10,14,24,.96);box-shadow:0 12px 40px rgba(0,0,0,.5)}" +
    ".sharefab,.homefab{transition:opacity .2s,bottom .2s}" +
    ".homefab{position:fixed;right:14px;bottom:14px;z-index:9990;display:inline-flex;align-items:center;gap:.4rem;border:1.5px solid rgba(255,153,0,.7);border-radius:999px;padding:.65rem 1rem;font:800 .92rem Inter,system-ui,sans-serif;line-height:normal;color:#fff;background:rgba(10,14,24,.92);cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35)}" +
    ".fabaway{opacity:0!important;pointer-events:none!important}" +
    ".homesheet{position:fixed;right:14px;bottom:66px;z-index:9991;max-height:calc(100vh - 90px);overflow:auto;width:min(320px,calc(100vw - 28px));padding:1rem 1.1rem;border-radius:16px;background:rgba(10,14,24,.97);border:1.5px solid rgba(255,153,0,.5);color:#eef2f8;font:600 .95rem/1.45 Inter,system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.5)}" +
    ".homesheet[hidden]{display:none}.homesheet b{color:#ff9900}.homesheet ol{margin:.5rem 0 .2rem 1.2rem;padding:0}.homesheet li{margin:.3rem 0}" +
    ".homesheet button{margin-top:.6rem;width:100%;border:0;border-radius:10px;padding:.6rem;font:800 .9rem Inter,system-ui,sans-serif;background:#ff9900;color:#111;cursor:pointer}";
  document.head.appendChild(css);

  function link(btn) {
    var canon = document.querySelector('link[rel="canonical"]');
    var u = new URL(btn.getAttribute("data-share-url") || (canon && canon.href) || location.pathname, location.origin);
    if (/^\/az(\/|$)/i.test(u.pathname)) u.searchParams.set("v", "share");
    return u.toString();
  }

  // The floating pill, on every page, bottom-left. On the store (/az…) an "Add to Home Screen"
  // pill sits opposite it, bottom-right, on the same line (Lewis, 10/21). The /az kit bar sits
  // bottom-centre, so both lift above it while it shows.
  var fab = document.createElement("button");
  fab.type = "button"; fab.className = "sharebtn sharefab"; fab.textContent = es ? "📤 Compartir" : "📤 Share";
  fab.setAttribute("aria-label", es ? "Compartir esta página" : "Share this page");
  document.body.appendChild(fab);
  var home = null, sheet = null;
  var standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone;
  if (/^\/az(\/|-|\.|$)/i.test(location.pathname) && !standalone) {
    // The store as a phone app: manifest + icon, so "Add to Home Screen" gives the LB Picks icon.
    [["link", { rel: "manifest", href: "/az.webmanifest" }],
     ["link", { rel: "apple-touch-icon", href: "/az-media/app/icon-180.png" }],
     ["meta", { name: "apple-mobile-web-app-title", content: "LB Picks" }],
     ["meta", { name: "theme-color", content: "#0b0f1a" }]].forEach(function (t) {
      if (document.querySelector(t[0] + "[" + (t[1].rel ? 'rel="' + t[1].rel : 'name="' + t[1].name) + '"]')) return;
      var el = document.createElement(t[0]); for (var k in t[1]) el.setAttribute(k, t[1][k]); document.head.appendChild(el);
    });
    var ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    var phone = ios || /Android|Mobi/.test(navigator.userAgent);
    var prompted = null;
    home = document.createElement("button");
    home.type = "button"; home.className = "homefab"; home.textContent = es ? "📲 Agregar a inicio" : "📲 Add to Home Screen";
    home.setAttribute("aria-label", es ? "Agregar a la pantalla de inicio" : "Add to Home Screen");
    if (!phone) home.hidden = true; // a computer shows it only when the browser offers an install
    document.body.appendChild(home);
    sheet = document.createElement("div");
    sheet.className = "homesheet"; sheet.hidden = true;
    // iPhone: Apple lets no page add itself, so the sheet is a call to action that walks them
    // through Safari (Lewis, 10/21): a big "Show me where to tap" button dims the page and points
    // a bouncing arrow at Safari's own Share button (inside ••• bottom-right on iOS 26+). In an
    // app's built-in browser (Facebook, Instagram, Gmail, a text link preview) the first step is
    // "Open in Safari" (x-safari-https: opens it on iOS 17+).
    var ua = navigator.userAgent, ver = +((ua.match(/Version\/(\d+)/) || [])[1] || 0);
    var inapp = ios && (/FBAN|FBAV|Instagram|Line\/|GSA\/|Twitter|LinkedInApp|Snapchat|TikTok|musical_ly/.test(ua) || !/Safari\//.test(ua));
    var crios = ios && /CriOS|FxiOS|EdgiOS/.test(ua);
    var SHARE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4da3ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
    var PLUS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eef2f8" stroke-width="2" stroke-linecap="round" style="vertical-align:-4px"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
    var T = es
      ? { h: "Pon LB Picks en tu pantalla de inicio", go: "👇 Muéstrame dónde tocar", safari: "🧭 Abrir en Safari", ok: "Cerrar",
          s1: ver >= 26 ? "Toca <b>•••</b> abajo a la derecha y luego <b>Compartir</b> " + SHARE : "Toca <b>Compartir</b> " + SHARE + " en la barra de Safari",
          s1c: "Toca <b>Compartir</b> " + SHARE + " junto a la barra de direcciones",
          s2: "Desliza y toca " + PLUS + " <b>Agregar a inicio</b>", s3: "Toca <b>Agregar</b>. ¡Listo!",
          app: "Primero ábrelo en Safari (aquí no se puede agregar):", app2: "Si no se abre, toca <b>•••</b> o 🧭 arriba y elige <b>Abrir en Safari</b>.",
          tap: "Toca aquí", then: "y luego <b>Agregar a inicio</b>" }
      : { h: "Put LB Picks on your Home Screen", go: "👇 Show me where to tap", safari: "🧭 Open in Safari", ok: "Close",
          s1: ver >= 26 ? "Tap <b>•••</b> at the bottom right, then <b>Share</b> " + SHARE : "Tap <b>Share</b> " + SHARE + " in Safari's bar",
          s1c: "Tap <b>Share</b> " + SHARE + " next to the address bar",
          s2: "Scroll down and tap " + PLUS + " <b>Add to Home Screen</b>", s3: "Tap <b>Add</b>. Done!",
          app: "First open it in Safari (this app's browser can't add it):", app2: "If it doesn't open, tap <b>•••</b> or 🧭 at the top and choose <b>Open in Safari</b>.",
          tap: "Tap here", then: "then <b>Add to Home Screen</b>" };
    var headHtml = '<div style="display:flex;gap:.7rem;align-items:center;margin-bottom:.4rem"><img src="/az-media/app/icon-180.png" alt="" width="52" height="52" style="border-radius:12px;flex:0 0 auto" /><b style="font-size:1.05rem;line-height:1.25">' + T.h + "</b></div>";
    var big = "display:block;width:100%;margin-top:.7rem;border:0;border-radius:12px;padding:.85rem;font:800 1.05rem Inter,system-ui,sans-serif;text-align:center;text-decoration:none;cursor:pointer;";
    if (ios && inapp) {
      sheet.innerHTML = headHtml + "<p>" + T.app + "</p>" +
        '<a data-safari href="x-safari-' + location.href.replace(/[?#].*$/, "") + '?v=homescreen" style="' + big + 'background:#ff9900;color:#111">' + T.safari + "</a>" +
        '<p style="margin-top:.6rem;font-size:.85rem;color:#9aa8bf">' + T.app2 + "</p>" +
        '<button type="button" data-x style="' + big + 'background:transparent;color:#9aa8bf;border:1px solid rgba(120,140,180,.35)">' + T.ok + "</button>";
    } else if (ios) {
      sheet.innerHTML = headHtml + "<ol><li>" + (crios ? T.s1c : T.s1) + "</li><li>" + T.s2 + "</li><li>" + T.s3 + "</li></ol>" +
        (crios ? "" : '<button type="button" data-go style="' + big + 'background:#ff9900;color:#111">' + T.go + "</button>") +
        '<button type="button" data-x style="' + big + 'background:transparent;color:#9aa8bf;border:1px solid rgba(120,140,180,.35)">' + T.ok + "</button>";
    } else {
      sheet.innerHTML = headHtml + (es ? "<ol><li>Toca el menú <b>⋮</b> del navegador (arriba a la derecha).</li><li>Toca <b>Agregar a pantalla principal</b> o <b>Instalar app</b>.</li></ol>"
                                       : "<ol><li>Tap the browser's <b>⋮</b> menu (top right).</li><li>Tap <b>Add to Home screen</b> or <b>Install app</b>.</li></ol>") +
        '<button type="button" data-x style="' + big + 'background:#ff9900;color:#111">' + (es ? "Entendido" : "Got it") + "</button>";
    }
    document.body.appendChild(sheet);
    sheet.querySelector("[data-x]").addEventListener("click", function () { sheet.hidden = true; });
    var sa = sheet.querySelector("[data-safari]"); if (sa) sa.addEventListener("click", function () { log("homescreen_open_safari"); });
    var go = sheet.querySelector("[data-go]");
    if (go) go.addEventListener("click", function () {
      // Dim the page and point at Safari's own button: bottom centre (Share) before iOS 26,
      // bottom right (•••) from iOS 26.
      sheet.hidden = true; log("homescreen_show_me");
      var right = ver >= 26, d = document.createElement("div");
      d.className = "a2hs-point";
      d.innerHTML = '<div style="position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:9995"></div>' +
        '<div style="position:fixed;bottom:22px;' + (right ? "right:10px;text-align:right" : "left:0;right:0;text-align:center") + ';z-index:9996;color:#fff;font:800 1.2rem/1.3 Inter,system-ui,sans-serif">' +
        '<div style="background:#ff9900;color:#111;display:inline-block;border-radius:14px;padding:.6rem .9rem;margin-bottom:.4rem">' + T.tap + (right ? " <b>•••</b>" : " " + SHARE.replace("#4da3ff", "#111")) + "<br><span style='font-size:.9rem;font-weight:700'>" + T.then + "</span></div>" +
        '<div class="a2hs-arrow" style="font-size:3.2rem;line-height:1;' + (right ? "margin-right:.6rem" : "") + '">⬇️</div></div>';
      var st = document.createElement("style");
      st.textContent = "@keyframes a2hsb{0%,100%{transform:translateY(0)}50%{transform:translateY(12px)}}.a2hs-arrow{animation:a2hsb .9s ease-in-out infinite}";
      d.appendChild(st);
      document.body.appendChild(d);
      var done = function () { if (d.parentNode) d.parentNode.removeChild(d); };
      d.addEventListener("click", done); setTimeout(done, 12000);
    });
    window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); prompted = e; home.hidden = false; });
    window.addEventListener("appinstalled", function () { home.hidden = true; sheet.hidden = true; log("homescreen_installed"); });
    home.addEventListener("click", function () {
      if (prompted) { prompted.prompt(); log("homescreen_prompt"); prompted = null; return; }
      sheet.hidden = !sheet.hidden; if (!sheet.hidden) log("homescreen_steps");
    });
  }
  var kit = document.querySelector(".kitbar");
  if (kit) {
    // Lift above the kit bar by its real height (it can wrap to two lines on a small phone).
    var lift = function () {
      var up = kit.classList.contains("show");
      var b = up ? Math.max(76, window.innerHeight - kit.getBoundingClientRect().top + 10) : 14;
      var m = fab.nextElementSibling;
      [fab, home].forEach(function (el) { if (el) el.style.bottom = b + "px"; });
      [m && m.classList.contains("sharemenu") ? m : null, sheet].forEach(function (el) { if (el) el.style.bottom = (b + 52) + "px"; });
      setTimeout(function () { window.dispatchEvent(new Event("resize")); }, 250);
    };
    new MutationObserver(lift).observe(kit, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", function () { if (kit.classList.contains("show")) requestAnimationFrame(lift); });
    setTimeout(lift, 0);
  }
  // Never cover the Amazon Coupons / Today's Deals buttons or the hero buttons (Lewis, 10/21):
  // a pill that sits on top of one fades out until the page scrolls it clear.
  var avoid = document.querySelectorAll('a[href*="amazon.com/coupons"],a[href*="amazon.com/deals"],.btn,form.search,[data-fab-avoid]');
  if (avoid.length) {
    var hit = function (a, b) { return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom; };
    var check = function () {
      [fab, home].forEach(function (p) {
        if (!p || p.hidden) return;
        p.classList.remove("fabaway");
        var r = p.getBoundingClientRect(), pad = 6;
        r = { left: r.left - pad, right: r.right + pad, top: r.top - pad, bottom: r.bottom + pad };
        var open = (p === fab && fab.nextElementSibling && !fab.nextElementSibling.hidden) || (p === home && sheet && !sheet.hidden);
        for (var i = 0; i < avoid.length && !open; i++) if (hit(r, avoid[i].getBoundingClientRect())) { p.classList.add("fabaway"); break; }
      });
    };
    var queued = false, later = function () { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; check(); }); } };
    window.addEventListener("scroll", later, { passive: true }); window.addEventListener("resize", later);
    window.addEventListener("load", later); setTimeout(check, 0); setTimeout(check, 400); setTimeout(check, 1500);
  }
  function log(how) { try { window.azTrack && window.azTrack("share", { how: how, url: location.pathname }); } catch (e) {} }

  document.querySelectorAll(".sharebtn").forEach(function (btn) {
    var url = link(btn), title = btn.getAttribute("data-share-title") || document.title;
    var text = btn.getAttribute("data-share-text") || title;
    var menu = document.createElement("div");
    menu.className = "sharemenu"; menu.hidden = true;
    var enc = encodeURIComponent;
    menu.innerHTML =
      '<button type="button" data-how="copy">🔗 ' + L.copy + "</button>" +
      '<a data-how="sms" href="sms:?&body=' + enc(text + " " + url) + '">💬 ' + L.text + "</a>" +
      '<a data-how="email" href="mailto:?subject=' + enc(title) + "&body=" + enc(text + "\n\n" + url) + '">✉️ ' + L.email + "</a>" +
      '<a data-how="x" target="_blank" rel="noopener" href="https://x.com/intent/post?text=' + enc(text) + "&url=" + enc(url) + '">𝕏 X</a>' +
      '<a data-how="facebook" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + enc(url) + '">📘 Facebook</a>';
    if (btn === fab) menu.classList.add("fab");
    btn.insertAdjacentElement("afterend", menu);
    menu.addEventListener("click", function (ev) {
      var el = ev.target.closest("[data-how]"); if (!el) return;
      log(el.getAttribute("data-how"));
      if (el.getAttribute("data-how") === "copy") {
        var done = function () { el.textContent = "✅ " + L.copied; };
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt(L.copy, url); });
        else prompt(L.copy, url);
      }
    });
    btn.addEventListener("click", function () {
      if (navigator.share) {
        navigator.share({ title: title, text: text, url: url }).then(function () { log("sheet"); }, function () {});
      } else {
        menu.hidden = !menu.hidden;
        if (!menu.hidden) log("menu");
      }
    });
  });
})();
