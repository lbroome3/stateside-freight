/*
 * az-track.js — private traffic analytics for the gadget pages (/az, /az/hurricane-kit, /az/dji-power-1000).
 *
 * Lewis, 10/11: "monitor the traffic as folks enter the site, give me analytics so I can see it
 * on my side only." Vercel Web Analytics does that: page views, referrers (YouTube, Facebook,
 * search), countries and devices, visible only to Lewis in the Vercel dashboard for this project
 * (Analytics tab). Nothing is shown to visitors. On top of the page views this file sends custom
 * events for the actions that make money: every Buy on Amazon click (with the ASIN), the
 * "Search all of Amazon" box, demo requests, the kit sheet and the video player.
 *
 * Web Analytics must be switched on once in the Vercel dashboard (Project → Analytics → Enable);
 * until then the script below 404s quietly and nothing breaks.
 */
(function () {
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  var s = document.createElement("script");
  s.defer = true; s.src = "/_vercel/insights/script.js";
  document.head.appendChild(s);

  var page = location.pathname;
  // Two destinations: Vercel's dashboard, and Lewis's own CRM (/api/az-event is rewritten to
  // broome-crm by vercel.json), where /api/az-stats turns it into the product leaderboard.
  function track(name, data) {
    var d = Object.assign({ page: page }, data || {});
    try { window.va("event", { name: name, data: d }); } catch (e) {}
    try {
      var body = JSON.stringify({ name: name, data: d });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/az-event", new Blob([body], { type: "application/json" }));
      else fetch("/api/az-event", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: body }).catch(function () {});
    } catch (e) {}
  }
  function asinOf(href) { var m = /\/dp\/([A-Z0-9]{10})/.exec(href || ""); return m ? m[1] : ""; }
  function productOf(a) {
    var t = a.closest(".tile, .piece, .row, .kititem, .pop, .kit a, .btns, header");
    var h = t && t.querySelector("h3, h4, h1");
    return (h ? h.textContent : a.textContent || "").trim().slice(0, 60);
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (a && /amazon\.com/.test(a.href)) {
      if (/\/s\?/.test(a.href)) track("amazon_search_link", {});
      else track("buy_click", { asin: asinOf(a.href), product: productOf(a) });
      return;
    }
    var b = e.target.closest && e.target.closest("[data-open-kit]");
    if (b) { track("kit_sheet_open", {}); return; }
    var d = e.target.closest && e.target.closest(".demo");
    if (d) { track("demo_open", { asin: d.dataset.asin || "", product: d.dataset.name || "" }); return; }
    var v = e.target.closest && e.target.closest("[data-open-video], .jump, .ph[data-t], #chapters button");
    if (v) { track("video_play", { t: v.dataset.t || v.dataset.openVideo || "0" }); return; }
    var hs = e.target.closest && e.target.closest(".hs");
    if (hs) { track("photo_hotspot", { item: hs.dataset.hs || "" }); }
  }, true);

  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (!f || f.tagName !== "FORM") return;
    if (/amazon\.com\/s/.test(f.action)) { var q = f.querySelector('[name="k"]'); track("amazon_search", { q: (q && q.value || "").slice(0, 60) }); }
    else if (f.id === "dform") { var k = f.querySelector('[name="kind"]:checked'); track("demo_request", { kind: k ? k.value : "video", product: (f.product && f.product.value || "").slice(0, 60) }); }
  }, true);

  // Where they came from, once per visit, so YouTube vs Facebook vs search is visible per page.
  try {
    var ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "direct";
    if (!sessionStorage.getItem("az_src")) { sessionStorage.setItem("az_src", ref); track("arrive", { from: ref }); }
  } catch (e) {}
})();
