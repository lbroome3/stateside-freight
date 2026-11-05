/* Surrogate Funding Foundation: shared motion for every page.
   - Hero backgrounds: a looping video when HERO_VIDEO is set, otherwise a slow light field on canvas.
   - Numbers count up, bars fill and gauges swing when they scroll into view.
   Every number is written in the HTML at its final value, so the page reads correctly with
   no script, in a screenshot, and with reduced motion. */
(function () {
  "use strict";

  /* When Muse's videos arrive, put the files in /surrogate-funding/media/ and set these. */
  var HERO_VIDEO = "/surrogate-funding/media/hero.mp4";          /* e.g. "/surrogate-funding/media/hero.mp4" */
  var HERO_POSTER = "/surrogate-funding/media/hero.jpg";         /* e.g. "/surrogate-funding/media/hero.jpg" */
  /* Muse's hero loop has its headline burned in, so the home hero uses its text-free still until a clean loop arrives. */
  var HERO_IMAGE = "/surrogate-funding/media/hero.jpg";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Hero background ---------- */
  function startVideo(host) {
    var v = document.createElement("video");
    v.className = "bg-video";
    v.src = HERO_VIDEO; if (HERO_POSTER) v.poster = HERO_POSTER;
    v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
    v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
    host.prepend(v);
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }

  function startField(host) {
    var c = document.createElement("canvas");
    c.className = "bg-field"; c.setAttribute("aria-hidden", "true");
    host.prepend(c);
    var ctx = c.getContext("2d");
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, t0 = performance.now();
    var motes = [];
    function size() {
      var r = host.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(90, w * h / 14000));
      motes = [];
      for (var i = 0; i < n; i++) motes.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.4 + .3, s: Math.random() * .25 + .05, p: Math.random() * 6.28 });
    }
    function glow(x, y, rad, rgb, a) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, "rgba(" + rgb + "," + a + ")");
      g.addColorStop(1, "rgba(" + rgb + ",0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible && !reduce) requestAnimationFrame(draw); }).observe(host);
    }
    function draw(now) {
      var t = ((now || performance.now()) - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      /* two slow pools of light: brass low right, cold indigo high left */
      glow(w * (.72 + .06 * Math.sin(t * .07)), h * (.78 + .05 * Math.cos(t * .05)), Math.max(w, h) * .55, "201,164,94", .24);
      glow(w * (.18 + .05 * Math.cos(t * .06)), h * (.2 + .06 * Math.sin(t * .08)), Math.max(w, h) * .6, "70,92,170", .34);
      /* the crossroads: two hairlines that breathe */
      var cx = w * .78, cy = h * .64, a = .18 + .08 * Math.sin(t * .6);
      ctx.strokeStyle = "rgba(201,164,94," + a + ")"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
      /* a slow radar sweep from the crossroads */
      var ang = t * .35, R = Math.hypot(w, h);
      var sw = ctx.createConicGradient ? ctx.createConicGradient(ang, cx, cy) : null;
      if (sw) {
        sw.addColorStop(0, "rgba(201,164,94,.16)"); sw.addColorStop(.08, "rgba(201,164,94,0)"); sw.addColorStop(1, "rgba(201,164,94,0)");
        ctx.fillStyle = sw; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fill();
      }
      for (var k = 1; k <= 4; k++) {
        ctx.strokeStyle = "rgba(201,164,94," + (.12 / k + .04) + ")";
        ctx.beginPath(); ctx.arc(cx, cy, k * Math.min(w, h) * .18, 0, 6.2832); ctx.stroke();
      }
      /* drifting motes of light */
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.y -= m.s; m.x += Math.sin(t * .3 + m.p) * .08;
        if (m.y < -4) { m.y = h + 4; m.x = Math.random() * w; }
        ctx.fillStyle = "rgba(233,214,170," + (.25 + .25 * Math.sin(t + m.p)) + ")";
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.2832); ctx.fill();
      }
      if (visible && !reduce) requestAnimationFrame(draw);
    }
    size(); draw();
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { size(); draw(); }, 120); });
  }

  document.querySelectorAll("[data-bg]").forEach(function (host) {
    if (HERO_VIDEO && host.hasAttribute("data-video") && !reduce) { startVideo(host); return; }
    if (HERO_IMAGE && host.hasAttribute("data-video")) {
      var ph = document.createElement("div"); ph.className = "bg-photo"; ph.setAttribute("aria-hidden", "true");
      ph.style.backgroundImage = "url(" + HERO_IMAGE + ")"; host.prepend(ph);
    }
    startField(host);
  });


  /* ---------- Bonding company finder (bail-fund page) ---------- */
  (function () {
    var root = document.getElementById("finder");
    if (!root) return;
    var $ = function (id) { return document.getElementById(id); };
    var county = $("f-county"), city = $("f-city"), q = $("f-q"), low = $("f-low"), list = $("f-list"), count = $("f-count");
    var all = [], asOf = "";
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function fillCities() {
      var c = county.value, cur = city.value;
      var cities = Array.from(new Set(all.filter(function (b) { return !c || b.county === c; }).map(function (b) { return b.city; }))).filter(Boolean).sort();
      city.innerHTML = ""; city.appendChild(new Option("All cities", ""));
      cities.forEach(function (x) { city.appendChild(new Option(x, x)); });
      if (cities.indexOf(cur) >= 0) city.value = cur;
    }
    function render() {
      var term = q.value.trim().toLowerCase();
      var rows = all.filter(function (b) {
        return (!county.value || b.county === county.value) && (!city.value || b.city === city.value) &&
          (!low.checked || b.low_down_payment) &&
          (!term || (b.name + " " + b.city + " " + b.county).toLowerCase().indexOf(term) >= 0);
      });
      list.innerHTML = "";
      rows.forEach(function (b) {
        var card = el("article", "bond");
        card.appendChild(el("p", "where", b.county + " County · " + b.city));
        card.appendChild(el("h3", "", b.name));
        var meta = el("div", "meta");
        if (b.rating) { var r = el("span"); var st = el("span", "stars", "★ "); r.appendChild(st); var bb = el("b", "", String(b.rating)); r.appendChild(bb); r.appendChild(document.createTextNode(" from " + (b.review_count || "?") + " " + (b.rating_source || "") + " reviews")); meta.appendChild(r); }
        if (b.hours) meta.appendChild(el("span", "", b.hours));
        card.appendChild(meta);
        var contact = el("div", "meta");
        if (b.phone) { var a = el("a", "", b.phone); a.href = "tel:" + b.phone.replace(/[^0-9+]/g, ""); contact.appendChild(a); }
        if (b.website) { var w = el("a", "", "Website"); w.href = b.website; w.target = "_blank"; w.rel = "noopener nofollow"; contact.appendChild(w); }
        card.appendChild(contact);
        if (b.address) card.appendChild(el("p", "meta", b.address));
        if (b.low_down_payment) { card.appendChild(el("span", "low", "Payment plans · low down payment")); if (b.down_payment_terms) card.appendChild(el("p", "terms", "“" + b.down_payment_terms + "”")); }
        list.appendChild(card);
      });
      count.textContent = rows.length ? (rows.length + (rows.length === 1 ? " company" : " companies") + (asOf ? " · ratings as of " + asOf : "")) : "No companies match. Try another county or clear the search.";
    }
    fetch("/surrogate-funding/bondsmen.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
      all = (d.companies || []).filter(function (b) { return b.name; }); asOf = d.as_of || "";
      Array.from(new Set(all.map(function (b) { return b.county; }))).filter(Boolean).sort().forEach(function (c) { county.appendChild(new Option(c + " County", c)); });
      if (!all.length) {
        root.querySelectorAll(".finder-row, .check").forEach(function (r) { r.hidden = true; });
        count.textContent = "We are checking every company's ratings and state license before we list it. The directory opens soon. Until then, ask any licensed bondsman about the payment agreements South Carolina law allows.";
        return;
      }
      fillCities(); render();
    }).catch(function () { count.textContent = "The directory could not load. Please refresh the page."; });
    county.addEventListener("change", function () { fillCities(); render(); });
    [city, low].forEach(function (x) { x.addEventListener("change", render); });
    q.addEventListener("input", render);
  })();

  /* ---------- Short films: play while on screen ---------- */
  document.querySelectorAll("video[data-clip]").forEach(function (v) {
    if (reduce || !("IntersectionObserver" in window)) { v.controls = true; return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { v.preload = "auto"; var p = v.play(); if (p && p.catch) p.catch(function () { v.controls = true; }); }
        else v.pause();
      });
    }, { threshold: .4 }).observe(v);
  });

  /* ---------- Scroll reveals ---------- */
  function fmt(n, d) { return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function countUp(el) {
    var to = parseFloat(el.dataset.to), d = parseInt(el.dataset.dec || "0", 10);
    var pre = el.dataset.pre || "", suf = el.dataset.suf || "", dur = 1600, s = performance.now();
    function step(now) {
      var p = Math.min(1, (now - s) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(to * e, d) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function swing(g) {
    var needle = g.querySelector(".needle"), arc = g.querySelector(".arc-fill");
    var v = parseFloat(g.dataset.value), max = parseFloat(g.dataset.max || "100");
    var deg = -90 + 180 * Math.min(1, v / max);
    if (needle) { needle.style.transition = "none"; needle.style.transform = "rotate(-90deg)"; needle.getBoundingClientRect(); needle.style.transition = ""; needle.style.transform = "rotate(" + deg + "deg)"; }
    if (arc) { var L = arc.getAttribute("pathLength") ? parseFloat(arc.getAttribute("pathLength")) : arc.getTotalLength(); arc.style.transition = "none"; arc.style.strokeDasharray = L; arc.style.strokeDashoffset = L; arc.getBoundingClientRect(); arc.style.transition = ""; arc.style.strokeDashoffset = L * (1 - Math.min(1, v / max)); }
  }

  if (reduce || !("IntersectionObserver" in window)) return;

  var below = function (el) { return el.getBoundingClientRect().top > window.innerHeight * .9; };
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target; io.unobserve(el);
      if (el.matches(".count")) countUp(el);
      else if (el.matches(".gauge")) swing(el);
      else el.classList.remove("pre");
    });
  }, { threshold: .35 });

  document.querySelectorAll(".count").forEach(function (el) { if (below(el)) { el.textContent = (el.dataset.pre || "") + "0" + (el.dataset.suf || ""); io.observe(el); } });
  document.querySelectorAll(".gauge").forEach(function (el) { if (below(el)) { var n = el.querySelector(".needle"), a = el.querySelector(".arc-fill"); if (n) n.style.transform = "rotate(-90deg)"; if (a) a.style.strokeDashoffset = a.getAttribute("pathLength") || 100; io.observe(el); } });
  document.querySelectorAll(".bars, .reveal").forEach(function (el) { if (below(el)) { el.classList.add("pre"); io.observe(el); } });
})();
