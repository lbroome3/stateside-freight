/* lb-fx.js — the same life as the TrueShipping.us team section, on lewisbroome.com (Lewis, 11/19: "Do the
   same on lewisbroome.com"). The hero portrait breathes and a "Hi, I'm Lewis" bubble waves beside it; the
   "What Lewis Broome does" cards, the family and photo galleries and the videos fly in one after another and
   tilt in 3D with the pointer (or the phone's tilt), with a light that follows. Holds still under
   prefers-reduced-motion. No dependencies. */
(function () {
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var css = [
    ".lbfx-wait{opacity:0;transform:translateY(40px) rotateX(16deg) scale(.95)}",
    ".lbfx-go{animation:lbfxIn .85s cubic-bezier(.2,.8,.2,1.15) backwards}",
    "@keyframes lbfxIn{0%{opacity:0;transform:translateY(40px) rotateX(16deg) scale(.95)}100%{opacity:1;transform:none}}",
    ".grid,.gallery,.vids{perspective:1100px}",
    ".lbfx-tilt{position:relative;transform-style:preserve-3d;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease;will-change:transform}",
    ".lbfx-tilt::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(380px circle at var(--mx,50%) var(--my,0%),rgba(14,128,212,.12),transparent 45%);opacity:0;transition:opacity .3s;z-index:2}",
    ".lbfx-tilt:hover::after{opacity:1}",
    ".lbfx-tilt:hover{box-shadow:0 18px 44px rgba(10,31,51,.18)}",
    ".card .role,.card h3{transform:translateZ(24px)}",
    ".portrait img{animation:lbfxBreathe 4.4s ease-in-out infinite;transform-origin:50% 85%}",
    "@keyframes lbfxBreathe{0%,100%{transform:scale(1) rotate(0)}30%{transform:scale(1.04) rotate(-1.4deg)}65%{transform:scale(1.02) rotate(1.2deg)}}",
    ".lbfx-hi{position:absolute;right:-18px;top:6px;z-index:3;background:#fff;color:#0b1f33;font:800 .9rem/1 Inter,system-ui,sans-serif;padding:9px 13px;border-radius:14px 14px 4px 14px;box-shadow:0 12px 28px rgba(0,0,0,.35);white-space:nowrap;opacity:0;transform:translateY(8px) scale(.8);transform-origin:100% 100%;transition:opacity .35s,transform .45s cubic-bezier(.2,.8,.2,1.4);pointer-events:none}",
    ".lbfx-hi.on{opacity:1;transform:none}",
    ".lbfx-hi .w{display:inline-block;transform-origin:70% 80%}",
    ".lbfx-hi.on .w{animation:lbfxWave 1.1s ease-in-out 2}",
    "@keyframes lbfxWave{0%,100%{transform:rotate(0)}20%{transform:rotate(18deg)}40%{transform:rotate(-10deg)}60%{transform:rotate(16deg)}80%{transform:rotate(-6deg)}}",
    "@media (max-width:760px){.lbfx-hi{right:-34px;top:-4px;font-size:.8rem}}",
    "@media (prefers-reduced-motion:reduce){.lbfx-wait{opacity:1;transform:none}.lbfx-go,.portrait img,.lbfx-hi .w{animation:none!important}.lbfx-tilt{transition:none}}"
  ].join("\n");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // Hello bubble by the hero portrait: waves a few seconds after the intro, then every 9 seconds.
  var pw = document.querySelector(".hero .pwrap");
  if (pw) {
    var hi = document.createElement("span"); hi.className = "lbfx-hi"; hi.setAttribute("aria-hidden", "true");
    hi.innerHTML = '<span class="w">👋</span> Hi, I’m Lewis';
    pw.appendChild(hi);
    if (still) hi.classList.add("on");
    else {
      var show = function () { hi.classList.add("on"); setTimeout(function () { hi.classList.remove("on"); }, 3800); };
      setTimeout(function () { show(); setInterval(show, 9000); }, 2600);
    }
  }

  // Fly-in + tilt for each group, one item after another, when the group reaches the screen.
  var groups = [].slice.call(document.querySelectorAll(".grid, .gallery, .vids"));
  groups.forEach(function (g) {
    var items = [].slice.call(g.children).filter(function (el) { return /^(ARTICLE|FIGURE|DIV)$/.test(el.tagName); });
    if (!items.length) return;
    var isGallery = g.classList.contains("gallery");
    items.forEach(function (el) { el.classList.add("lbfx-tilt"); if (!still) el.classList.add("lbfx-wait"); });
    var go = function () {
      items.forEach(function (el, i) {
        setTimeout(function () { el.classList.remove("lbfx-wait"); el.classList.add("lbfx-go"); }, still ? 0 : i * (isGallery ? 90 : 160));
      });
    };
    if ("IntersectionObserver" in window && !still) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { go(); io.disconnect(); } }); }, { threshold: 0, rootMargin: "0px 0px -12% 0px" });
      io.observe(g);
    } else go();
    if (still) return;
    items.forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        if (e.pointerType === "touch") return;
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", (x * 100) + "%"); el.style.setProperty("--my", (y * 100) + "%");
        var k = isGallery ? 8 : 12;
        el.style.transform = "rotateY(" + ((x - .5) * k) + "deg) rotateX(" + ((.5 - y) * k) + "deg) translateZ(6px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  });

  // The phone's tilt (Android; iPhone needs a permission tap, so it stays flat there).
  if (still) return;
  var raf = 0, cards = [].slice.call(document.querySelectorAll(".grid > .lbfx-tilt"));
  window.addEventListener("deviceorientation", function (e) {
    if (e.gamma == null || raf || !cards.length) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var gx = Math.max(-1, Math.min(1, e.gamma / 30)), gy = Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 30));
      cards.forEach(function (c) { if (c.classList.contains("lbfx-go")) c.style.transform = "rotateY(" + (gx * 7) + "deg) rotateX(" + (-gy * 5) + "deg)"; });
    });
  });
})();
