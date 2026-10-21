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
    ".sharefab.up{bottom:76px}" +
    ".sharemenu.fab{position:fixed;left:14px;bottom:66px;z-index:9990;width:min(320px,calc(100vw - 28px));margin:0;padding:.5rem;border-radius:16px;background:rgba(10,14,24,.96);box-shadow:0 12px 40px rgba(0,0,0,.5)}" +
    ".sharemenu.fab.up{bottom:128px}";
  document.head.appendChild(css);

  function link(btn) {
    var canon = document.querySelector('link[rel="canonical"]');
    var u = new URL(btn.getAttribute("data-share-url") || (canon && canon.href) || location.pathname, location.origin);
    if (/^\/az(\/|$)/i.test(u.pathname)) u.searchParams.set("v", "share");
    return u.toString();
  }

  // The floating pill, on every page. The /az kit bar sits bottom-centre, so lift above it there.
  var fab = document.createElement("button");
  fab.type = "button"; fab.className = "sharebtn sharefab"; fab.textContent = es ? "📤 Compartir" : "📤 Share";
  fab.setAttribute("aria-label", es ? "Compartir esta página" : "Share this page");
  document.body.appendChild(fab);
  var kit = document.querySelector(".kitbar");
  if (kit) {
    var lift = function () {
      var up = kit.classList.contains("show");
      fab.classList.toggle("up", up);
      var m = fab.nextElementSibling; if (m && m.classList.contains("sharemenu")) m.classList.toggle("up", up);
    };
    new MutationObserver(lift).observe(kit, { attributes: true, attributeFilter: ["class"] }); lift();
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
    if (btn === fab) { menu.classList.add("fab"); if (fab.classList.contains("up")) menu.classList.add("up"); }
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
