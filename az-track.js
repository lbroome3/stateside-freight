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
 * video_play, photo_hotspot, leave (scroll depth %, seconds on page), ping (every 30 s while in view).
 *
 * Campaign attribution: every link in a YouTube description carries ?v=<short-id>; the first
 * page of the visit remembers it and every later event carries it. No cookies and no IP; each
 * browser keeps a random visitor id in local storage (see vid below).
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
  var TAGS = { vidA: "broomevida-20", vidB: "broomevidb-20", vidC: "broomevidc-20", vid1: "broomevid1-20", vidR: "broomevidr-20", vidK: "broomevidk-20", vidJ: "broomevidj-20", vidM: "broomevidm-20", deals1014: "broomedeals-20", deals1015: "broomedeals-20", deals1016: "broomedeals-20", deals1019: "broomedeals-20", deals1020: "broomedeals-20", deals1021: "broomedeals-20", channel: "broomechannel-20" };
  function tagFor(c) { return TAGS[c] || (/^[A-Za-z0-9_-]{11}$/.test(c) ? "broomeshorts-20" : ""); }
  var page = location.pathname, T0 = Date.now(), maxDepth = 0;
  var campaign = "";
  try {
    var q = new URLSearchParams(location.search);
    campaign = (q.get("v") || q.get("utm_source") || q.get("utm_campaign") || "").slice(0, 40);
    if (campaign) sessionStorage.setItem("az_campaign", campaign); else campaign = sessionStorage.getItem("az_campaign") || "";
  } catch (e) {}

  // Lewis's own devices: open lewisbroome.com/az?me=1 once on each and that browser never rings
  // his phone with a visitor alert (?me=0 undoes it). Visits are still counted.
  var me = 0;
  try {
    var mq = new URLSearchParams(location.search).get("me");
    if (mq === "1") localStorage.setItem("az_me", "1"); else if (mq === "0") localStorage.removeItem("az_me");
    me = localStorage.getItem("az_me") === "1" ? 1 : 0;
  } catch (e) {}

  var returning = 0, visitN = 1;
  try { visitN = (Number(localStorage.getItem("az_visits")) || 0) + 1; returning = visitN > 1 ? 1 : 0; localStorage.setItem("az_visits", String(visitN)); } catch (e) {}

  // The visitor id (Lewis, 10/12: "the ability to log the visitor and make notes"): a random
  // string kept in this browser only, so the CRM's Visitor log can line one person's visits up
  // into a journey and Lewis can put a name and notes on it. Not derived from anything about them.
  var vid = "";
  try {
    vid = localStorage.getItem("az_vid") || "";
    if (!/^[a-z0-9]{12}$/.test(vid)) { vid = ""; for (var i = 0; i < 12; i++) vid += "abcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.floor(Math.random() * 36)); localStorage.setItem("az_vid", vid); }
  } catch (e) { vid = ""; }
  // Screen, language and time zone, sent once per page on arrive: "390×844 · en-US · America/New_York".
  var env = "";
  try { env = [screen.width + "×" + screen.height, navigator.language, Intl.DateTimeFormat().resolvedOptions().timeZone].filter(Boolean).join(" · "); } catch (e) {}

  // Retag every Amazon link with the tracking ID for the video that sent this visitor.
  // A link with no tag at all gets the store's default, so no Buy tap ever leaves untagged.
  var DEFAULT_TAG = "broomepicks-20";
  function tagHref(href) {
    var tag = tagFor(campaign) || DEFAULT_TAG;
    if (/[?&]tag=/.test(href)) return tagFor(campaign) ? href.replace(/([?&])tag=[^&#]*/, "$1tag=" + tag) : href;
    return href.replace(/^([^#]*?)(\?|(?=#)|$)/, function (m, base, q) { return base + "?tag=" + tag + (q === "?" ? "&" : ""); });
  }
  function tagForm(f) {
    var i = f.querySelector('input[name="tag"]');
    if (!i) { i = document.createElement("input"); i.type = "hidden"; i.name = "tag"; i.value = DEFAULT_TAG; f.appendChild(i); }
    if (tagFor(campaign)) i.value = tagFor(campaign);
  }
  function retag() {
    document.querySelectorAll('a[href*="amazon.com"]').forEach(function (a) { var h = tagHref(a.href); if (h !== a.href) a.href = h; });
    document.querySelectorAll('form[action*="amazon.com"]').forEach(tagForm);
  }
  retag(); setTimeout(retag, 1500); setTimeout(retag, 4000);

  function posOf(a) {
    var t = a.closest && a.closest(".tile, .piece, .kititem, .kit > a"); if (!t) return 0;
    var all = Array.prototype.slice.call(document.querySelectorAll(".tile, .piece, .kititem, .kit > a"));
    return all.indexOf(t) + 1;
  }

  function track(name, data) {
    var d = Object.assign({ page: page }, campaign ? { campaign: campaign } : {}, vid ? { vid: vid } : {}, data || {});
    try { window.va("event", { name: name, data: d }); } catch (e) {}
    try {
      var body = JSON.stringify({ name: name, data: d });
      // text/plain, never application/json: a JSON beacon needs a CORS preflight, and a beacon
      // carries cookies, so Chrome drops it unless the CRM answers Allow-Credentials. It did not,
      // and from 10/11 to 10/12 nearly every visit was lost that way. The CRM parses either.
      var sent = false;
      if (navigator.sendBeacon) sent = navigator.sendBeacon(CRM, new Blob([body], { type: "text/plain;charset=UTF-8" }));
      if (!sent) fetch(CRM, { method: "POST", keepalive: true, mode: "no-cors", headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: body }).catch(function () {});
    } catch (e) {}
  }
  // The product photo on that card, as a site path ("/az-media/img/01-ninja-1.jpg"), so the CRM
  // can show Lewis the product big (10/12: "Show me the product they're looking at. Photo and all.").
  function imgOf(el) {
    try {
      var t = el.closest ? el.closest(".tile, .piece, .kititem, .kit > a, .row, .pop") || el : el;
      var i = t.querySelector && t.querySelector("img");
      var src = i ? (i.currentSrc || i.src || "") : "";
      var u = src ? new URL(src, location.href) : null;
      return u && u.host === location.host ? u.pathname.slice(0, 80) : "";
    } catch (e) { return ""; }
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
      // Tag at the moment of the tap too, so cards drawn after the page settled are covered.
      var th = tagHref(a.href); if (th !== a.href) a.href = th;
      if (/\/s\?/.test(a.href)) track("amazon_search_link", {});
      else if (/amazon\.com\/(coupons|deals)/.test(a.href)) track("deals_click", { page: /coupons/.test(a.href) ? "coupons" : "deals" });
      else track("buy_click", { asin: asinOf(a.href), product: productOf(a), pos: posOf(a), secs: Math.round((Date.now() - T0) / 1000), img: imgOf(a) });
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
    if (/amazon\.com\/s/.test(f.action)) { tagForm(f); var q = f.querySelector('[name="k"]'); track("amazon_search", { q: (q && q.value || "").slice(0, 60) }); }
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
        track("product_view", { asin: a ? asinOf(a.href) : "", product: (h ? h.textContent : "").trim().slice(0, 60), pos: posOf(en.target), img: imgOf(en.target) });
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
  // Each stretch in view is its own leave, so switching apps and coming back never double-counts.
  var segT0 = T0;
  function leave() { if (left) return; left = true; track("leave", { depth: maxDepth, seconds: Math.round((Date.now() - segT0) / 1000) }); }
  addEventListener("pagehide", leave);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) leave();
    else if (left) { left = false; segT0 = Date.now(); pings = 0; track("ping", {}); }
  });

  // Heartbeat (Lewis, 10/12: "So I know if it's live"): a tiny ping every 30 s while the page
  // is open and in view, so the CRM's "On the site now" drops a visitor the moment they go
  // quiet instead of five minutes later. Stops after 30 minutes on one page.
  var pings = 0;
  setInterval(function () { if (!document.hidden && !left && pings < 60) { pings++; track("ping", {}); } }, 30000);

  // Where they came from, once per visit, so YouTube vs Facebook vs search is visible per page.
  try {
    var ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "direct";
    if (!sessionStorage.getItem("az_src")) { sessionStorage.setItem("az_src", ref); track("arrive", { from: ref, returning: returning, visit: visitN, me: me, env: env }); }
    else track("arrive", { from: sessionStorage.getItem("az_src"), again: 1, returning: returning, visit: visitN, me: me, env: env });
  } catch (e) { track("arrive", { from: "direct", returning: returning, visit: visitN, me: me, env: env }); }
})();
