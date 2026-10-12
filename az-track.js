/*
 * az-track.js — private traffic analytics for the gadget pages (/az, /az/hurricane-kit, /az/dji-power-1000).
 *
 * Lewis, 10/11: "monitor the traffic as folks enter the site, give me analytics so I can see it
 * on my side only, pipe it to my CMS. That way I know what product to push more." And later:
 * "Is that all the telemetry I can get? Impress me."
 *
 * Two destinations, nothing shown to visitors:
 *   1. Vercel Web Analytics (page views, referrers, countries, devices) — the Vercel dashboard.
 *   2. The CRM: every event is POSTed straight to broome-crm.vercel.app/api/az-event (not through
 *      the site's /api rewrite, so Vercel's city/region headers describe the visitor, not the
 *      proxy). /api/az-stats and the CRM's Gadget Analytics page turn it into the leaderboard,
 *      the live feed, the funnel and the alerts.
 *
 * Events: arrive (with referrer + campaign), product_view (a card scrolled into view),
 * buy_click (ASIN + product), amazon_search, demo_open / demo_request, kit_sheet_open,
 * video_play, photo_hotspot, leave (scroll depth %, seconds on page).
 *
 * Campaign attribution: every link in a YouTube description carries ?v=<short-id>; the first
 * page of the visit remembers it and every later event carries it. No cookies, no names, no IP.
 *
 * v3 (Lewis, 10/11: "Am I really plugged in? Is there any more telemetry I can get? Deep dive."):
 *   · new vs returning (a flag in this browser only), the visit number
 *   · which card position gets the taps (pos), seconds from landing to the Buy tap (secs)
 *   · video completion milestones (video_progress 25/50/75/100)
 *   · per-video Amazon tracking IDs: when TAGS maps the campaign to an Associates tracking ID,
 *     every Buy link on the page is retagged, so Amazon's own earnings report says which video
 *     earned. Empty until the IDs exist in Associates Central (a tag Amazon doesn't know = no credit).
 */
(function () {
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  var s = document.createElement("script");
  s.defer = true; s.src = "/_vercel/insights/script.js";
  document.head.appendChild(s);

  var CRM = "https://broome-crm.vercel.app/api/az-event";
  // Associates tracking IDs, one per video (created 10/11 by Gizmo). A Short's own ?v= code
  // (its 11-character id) maps to the Shorts tag; nothing else is retagged.
  var TAGS = { vidA: "broomevida-20", vidB: "broomevidb-20", vidC: "broomevidc-20", vid1: "broomevid1-20", vidR: "broomevidr-20", vidK: "broomevidk-20", vidJ: "broomevidj-20", channel: "broomechannel-20" };
  function tagFor(c) { return TAGS[c] || (/^[A-Za-z0-9_-]{11}$/.test(c) ? "broomeshorts-20" : ""); }
  var page = location.pathname, T0 = Date.now(), maxDepth = 0;
  var campaign = "";
  try {
    var q = new URLSearchParams(location.search);
    campaign = (q.get("v") || q.get("utm_source") || q.get("utm_campaign") || "").slice(0, 40);
    if (campaign) sessionStorage.setItem("az_campaign", campaign); else campaign = sessionStorage.getItem("az_campaign") || "";
  } catch (e) {}

  var returning = 0, visitN = 1;
  try { visitN = (Number(localStorage.getItem("az_visits")) || 0) + 1; returning = visitN > 1 ? 1 : 0; localStorage.setItem("az_visits", String(visitN)); } catch (e) {}

  // Retag every Amazon link with the tracking ID for the video that sent this visitor.
  function retag() {
    var tag = tagFor(campaign); if (!tag) return;
    document.querySelectorAll('a[href*="amazon.com"]').forEach(function (a) { a.href = a.href.replace(/([?&])tag=[^&]*/, "$1tag=" + tag); });
    document.querySelectorAll('form[action*="amazon.com"] input[name="tag"]').forEach(function (i) { i.value = tag; });
  }
  retag(); setTimeout(retag, 1500); setTimeout(retag, 4000);

  function posOf(a) {
    var t = a.closest && a.closest(".tile, .piece, .kititem, .kit > a"); if (!t) return 0;
    var all = Array.prototype.slice.call(document.querySelectorAll(".tile, .piece, .kititem, .kit > a"));
    return all.indexOf(t) + 1;
  }

  function track(name, data) {
    var d = Object.assign({ page: page }, campaign ? { campaign: campaign } : {}, data || {});
    try { window.va("event", { name: name, data: d }); } catch (e) {}
    try {
      var body = JSON.stringify({ name: name, data: d });
      if (navigator.sendBeacon) navigator.sendBeacon(CRM, new Blob([body], { type: "application/json" }));
      else fetch(CRM, { method: "POST", keepalive: true, mode: "cors", headers: { "Content-Type": "application/json" }, body: body }).catch(function () {});
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
      else track("buy_click", { asin: asinOf(a.href), product: productOf(a), pos: posOf(a), secs: Math.round((Date.now() - T0) / 1000) });
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

  // Which products were actually SEEN (card at least half on screen), so the funnel is
  // visit → saw the product → tapped Buy. Capped at 25 a page so a long scroll stays cheap.
  var seen = 0;
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting || seen >= 25) return;
        io.unobserve(en.target); seen++;
        var a = en.target.querySelector('a[href*="amazon.com/dp/"]') || (en.target.matches && en.target.matches('a[href*="amazon.com/dp/"]') ? en.target : null);
        var h = en.target.querySelector("h3");
        track("product_view", { asin: a ? asinOf(a.href) : "", product: (h ? h.textContent : "").trim().slice(0, 60), pos: posOf(en.target) });
      });
    }, { threshold: 0.5 });
    var arm = function () { document.querySelectorAll(".tile, .piece, .kit > a").forEach(function (el) { if (!el._azio) { el._azio = 1; io.observe(el); } }); };
    arm(); setTimeout(arm, 1500); setTimeout(arm, 4000);
  }

  // How much of the video they actually watched: one event per quarter, once per visit.
  var player = document.getElementById("player"), hit = {};
  if (player) player.addEventListener("timeupdate", function () {
    if (!player.duration) return;
    var pct = Math.floor(player.currentTime / player.duration * 4) * 25;
    if (pct >= 25 && !hit[pct]) { hit[pct] = 1; track("video_progress", { pct: pct }); }
  });
  if (player) player.addEventListener("ended", function () { if (!hit[100]) { hit[100] = 1; track("video_progress", { pct: 100 }); } });

  // How far they read and how long they stayed, sent once when they leave.
  addEventListener("scroll", function () {
    var h = document.documentElement, p = Math.round((scrollY + innerHeight) / Math.max(1, h.scrollHeight) * 100);
    if (p > maxDepth) maxDepth = Math.min(100, p);
  }, { passive: true });
  var left = false;
  function leave() { if (left) return; left = true; track("leave", { depth: maxDepth, seconds: Math.round((Date.now() - T0) / 1000) }); }
  addEventListener("pagehide", leave); document.addEventListener("visibilitychange", function () { if (document.hidden) leave(); });

  // Where they came from, once per visit, so YouTube vs Facebook vs search is visible per page.
  try {
    var ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "direct";
    if (!sessionStorage.getItem("az_src")) { sessionStorage.setItem("az_src", ref); track("arrive", { from: ref, returning: returning, visit: visitN }); }
    else track("arrive", { from: sessionStorage.getItem("az_src"), again: 1, returning: returning, visit: visitN });
  } catch (e) { track("arrive", { from: "direct", returning: returning, visit: visitN }); }
})();
