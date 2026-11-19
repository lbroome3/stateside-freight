/* team-fx.js — brings the home page's team section (#team) to life (Lewis, 11/19: "What can you do to
   really wow this section?" -> option 3). Built only from the photos already on the page:
   cards fly in one after another, tilt in 3D with the pointer (or the phone's tilt), each portrait
   breathes with a glowing ring around it, "Hi, I'm …" bubbles pop over each person in turn, and the
   autonomous agents' card runs a hologram scan with a typing line. Nothing here claims a person is
   online or quotes a number: the agents' card says only what the page already says it does.
   Honors prefers-reduced-motion (everything holds still). No dependencies. */
(function () {
  var team = document.getElementById("team");
  if (!team) return;
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cards = [].slice.call(team.querySelectorAll(".team-card"));
  if (!cards.length) return;

  var css = [
    ".tfx .team-grid{perspective:1100px}",
    ".tfx .team-card{position:relative;transform-style:preserve-3d;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease;will-change:transform}",
    ".tfx .team-card.tfx-wait{opacity:0;transform:translateY(46px) rotateX(18deg) scale(.94)}",
    ".tfx .team-card.tfx-go{animation:tfxIn .9s cubic-bezier(.2,.8,.2,1.15) backwards}",
    "@keyframes tfxIn{0%{opacity:0;transform:translateY(46px) rotateX(18deg) scale(.94)}100%{opacity:1;transform:none}}",
    ".tfx .team-card:hover{border-color:rgba(124,196,255,.55);box-shadow:0 18px 50px rgba(14,128,212,.35)}",
    ".tfx .team-card::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(420px circle at var(--mx,50%) var(--my,0%),rgba(124,196,255,.16),transparent 45%);opacity:0;transition:opacity .3s}",
    ".tfx .team-card:hover::after{opacity:1}",
    /* portrait: ring + breathing */
    ".tfx-ava{position:relative;width:96px;height:96px;display:grid;place-items:center;align-self:flex-start;transform:translateZ(40px)}",
    ".tfx-ava::before{content:'';position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,#5ab4ff,transparent 30%,#ffd166 50%,transparent 70%,#5ab4ff);animation:tfxSpin 6s linear infinite;-webkit-mask:radial-gradient(circle,transparent 44px,#000 45px);mask:radial-gradient(circle,transparent 44px,#000 45px)}",
    ".tfx-ava::after{content:'';position:absolute;inset:-8px;border-radius:50%;box-shadow:0 0 26px 4px rgba(90,180,255,.35);animation:tfxGlow 3.2s ease-in-out infinite}",
    ".tfx-ava img,.tfx-ava .bot{position:relative;z-index:1;animation:tfxBreathe 4.2s ease-in-out infinite;transform-origin:50% 80%}",
    "@keyframes tfxSpin{to{transform:rotate(360deg)}}",
    "@keyframes tfxGlow{0%,100%{opacity:.45}50%{opacity:1}}",
    "@keyframes tfxBreathe{0%,100%{transform:scale(1) rotate(0deg)}30%{transform:scale(1.035) rotate(-1.6deg)}65%{transform:scale(1.015) rotate(1.4deg)}}",
    /* hello bubble */
    ".tfx-hi{position:absolute;left:118px;top:22px;z-index:3;background:#fff;color:#0b1f33;font-weight:800;font-size:.86rem;padding:7px 12px;border-radius:14px 14px 14px 4px;box-shadow:0 10px 26px rgba(0,0,0,.3);white-space:nowrap;opacity:0;transform:translateY(8px) scale(.8);transform-origin:0 100%;transition:opacity .35s,transform .45s cubic-bezier(.2,.8,.2,1.4);pointer-events:none}",
    ".tfx-hi.on{opacity:1;transform:none}",
    ".tfx-hi .w{display:inline-block;transform-origin:70% 80%}",
    ".tfx-hi.on .w{animation:tfxWave 1.1s ease-in-out 2}",
    "@keyframes tfxWave{0%,100%{transform:rotate(0)}20%{transform:rotate(18deg)}40%{transform:rotate(-10deg)}60%{transform:rotate(16deg)}80%{transform:rotate(-6deg)}}",
    /* agents card: hologram */
    ".tfx-bot .tfx-ava img{filter:saturate(1.15) contrast(1.05)}",
    ".tfx-scan{position:absolute;inset:4px;border-radius:50%;z-index:2;overflow:hidden;pointer-events:none}",
    ".tfx-scan::before{content:'';position:absolute;left:0;right:0;height:30%;background:linear-gradient(180deg,transparent,rgba(110,220,255,.55),transparent);animation:tfxScan 2.4s linear infinite}",
    ".tfx-scan::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(120,210,255,.12) 0 1px,transparent 1px 3px);animation:tfxFlick 4s steps(1) infinite}",
    "@keyframes tfxScan{0%{top:-30%}100%{top:100%}}",
    "@keyframes tfxFlick{0%,92%,100%{opacity:1}93%{opacity:.3}95%{opacity:1}97%{opacity:.5}}",
    ".tfx-duty{display:inline-flex;align-items:center;gap:7px;font-size:.78rem;font-weight:800;color:#7ef0a8;letter-spacing:.04em}",
    ".tfx-duty i{width:9px;height:9px;border-radius:50%;background:#2ee077;box-shadow:0 0 0 0 rgba(46,224,119,.7);animation:tfxPing 1.8s infinite}",
    "@keyframes tfxPing{0%{box-shadow:0 0 0 0 rgba(46,224,119,.7)}70%{box-shadow:0 0 0 9px rgba(46,224,119,0)}100%{box-shadow:0 0 0 0 rgba(46,224,119,0)}}",
    ".tfx-type{font:700 .86rem/1.4 ui-monospace,Menlo,Consolas,monospace;color:#9fdcff;min-height:1.4em}",
    ".tfx-type .c{display:inline-block;width:.55em;height:1em;vertical-align:-2px;background:#9fdcff;margin-left:2px;animation:tfxBlink 1s steps(1) infinite}",
    "@keyframes tfxBlink{50%{opacity:0}}",
    /* buttons */
    ".tfx .team-contact a{animation:tfxBtn 3s ease-in-out infinite}",
    ".tfx .team-contact a+a{animation-delay:1.5s}",
    "@keyframes tfxBtn{0%,100%{box-shadow:0 6px 18px rgba(14,128,212,.25)}50%{box-shadow:0 0 0 6px rgba(124,196,255,.18),0 10px 34px rgba(14,128,212,.55)}}",
    /* phone: one swipe row so the whole team fits one screen; it steps person to person on its own */
    "@media (max-width:760px){.tfx .team-grid{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:12px;padding:6px 9% 14px;margin:22px -16px 0;scrollbar-width:none;-webkit-overflow-scrolling:touch}.tfx .team-grid::-webkit-scrollbar{display:none}.tfx .team-card{flex:0 0 82%;scroll-snap-align:center;min-height:0}.tfx .team-card p{font-size:.86rem}}",
    ".tfx-dots{display:none;justify-content:center;gap:7px;margin-top:4px}",
    ".tfx-dots button{width:8px;height:8px;border-radius:50%;border:0;padding:0;background:rgba(255,255,255,.3);cursor:pointer;transition:width .3s,background .3s}",
    ".tfx-dots button.on{width:22px;border-radius:5px;background:#5ab4ff}",
    "@media (max-width:760px){.tfx-dots{display:flex}.tfx .team-block h2{font-size:clamp(1.5rem,7vw,2rem)}}",
    "@media (prefers-reduced-motion:reduce){.tfx *{animation:none!important;transition:none!important}.tfx .team-card.tfx-wait{opacity:1;transform:none}}"
  ].join("\n");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  team.classList.add("tfx");

  // Portraits: wrap each in a ringed, breathing frame; add a hello bubble for each person.
  var bubbles = [];
  cards.forEach(function (card, i) {
    var img = card.querySelector("img, .bot");
    if (!img) return;
    var ava = document.createElement("div"); ava.className = "tfx-ava";
    img.parentNode.insertBefore(ava, img); ava.appendChild(img);
    if (img.style) img.style.animationDelay = (-i * 1.1) + "s";
    var isBot = /autonomous/i.test((card.querySelector(".tag") || {}).textContent || "");
    if (isBot) {
      card.classList.add("tfx-bot");
      var scan = document.createElement("span"); scan.className = "tfx-scan"; ava.appendChild(scan);
      var duty = document.createElement("span"); duty.className = "tfx-duty"; duty.innerHTML = "<i></i>On duty 24/7";
      var tag = card.querySelector(".tag"); if (tag) tag.insertAdjacentElement("afterend", duty);
      var type = document.createElement("div"); type.className = "tfx-type"; type.setAttribute("aria-hidden", "true");
      card.appendChild(type); typeLoop(type);
    } else {
      var name = ((card.querySelector("b") || {}).textContent || "").trim().split(/\s+/)[0];
      if (name) {
        var hi = document.createElement("span"); hi.className = "tfx-hi"; hi.setAttribute("aria-hidden", "true");
        hi.innerHTML = '<span class="w">👋</span> Hi, I’m ' + name.replace(/[<&]/g, "");
        card.appendChild(hi); bubbles.push(hi);
      }
    }
  });

  function typeLoop(el) {
    var lines = ["Instant estimates…", "Sending a tracking link…", "Answering the site chat…", "Heads-up sent to the team."];
    if (still) { el.textContent = lines.join(" · "); return; }
    var li = 0, ci = 0, cur = document.createElement("span"), caret = document.createElement("span");
    caret.className = "c"; el.appendChild(cur); el.appendChild(caret);
    (function tick() {
      var s = lines[li];
      if (ci <= s.length) { cur.textContent = s.slice(0, ci++); setTimeout(tick, 45 + Math.random() * 40); }
      else { setTimeout(function () { ci = 0; li = (li + 1) % lines.length; tick(); }, 1600); }
    })();
  }

  // Fly in, one after another, when the team is actually in the middle of the screen (Lewis, 11/19: "By the
  // time I get down there, it's already loaded") — and again each time the walkthrough frames the team.
  var grid = team.querySelector(".team-grid");
  var phone = function () { return window.matchMedia("(max-width:760px)").matches; };
  cards.forEach(function (c) { c.classList.remove("reveal", "d1", "d2", "d3"); if (!still) c.classList.add("tfx-wait"); });
  var hiTimer = null, stepTimer = null, k = 0, touched = false;
  function flyIn() {
    cards.forEach(function (c, i) {
      c.classList.remove("tfx-go"); if (!still) c.classList.add("tfx-wait"); void c.offsetWidth;
      setTimeout(function () { c.classList.remove("tfx-wait"); c.classList.add("tfx-go"); }, still ? 0 : 150 + i * 200);
    });
  }
  function hello(n) {
    bubbles.forEach(function (b) { b.classList.remove("on"); });
    var card = cards[n % cards.length], b = card && card.querySelector(".tfx-hi");
    if (b) b.classList.add("on");
  }
  function cycle() {
    clearTimeout(hiTimer);
    if (phone() && grid && !touched) {
      var c = cards[k % cards.length];
      grid.scrollTo({ left: c.offsetLeft - (grid.clientWidth - c.offsetWidth) / 2, behavior: "smooth" });
    }
    hello(k); setDot(k % cards.length); k++;
    hiTimer = setTimeout(cycle, 2600);
  }
  var dots = document.createElement("div"); dots.className = "tfx-dots";
  cards.forEach(function (c, i) {
    var d = document.createElement("button"); d.type = "button"; d.setAttribute("aria-label", "Show card " + (i + 1));
    d.addEventListener("click", function () { touched = true; k = i; grid.scrollTo({ left: c.offsetLeft - (grid.clientWidth - c.offsetWidth) / 2, behavior: "smooth" }); hello(i); setDot(i); });
    dots.appendChild(d);
  });
  if (grid) grid.insertAdjacentElement("afterend", dots);
  function setDot(n) { [].forEach.call(dots.children, function (d, i) { d.classList.toggle("on", i === n); }); }
  if (grid) {
    ["touchstart", "pointerdown", "wheel"].forEach(function (ev) { grid.addEventListener(ev, function () { touched = true; }, { passive: true }); });
    grid.addEventListener("scroll", function () {
      if (!phone()) return;
      var mid = grid.scrollLeft + grid.clientWidth / 2, best = 0, bd = 1e9;
      cards.forEach(function (c, i) { var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
      setDot(best);
    }, { passive: true });
  }
  var running = false;
  function start() {
    flyIn();
    if (still) return;
    k = 0; touched = false;
    clearTimeout(hiTimer); hiTimer = setTimeout(cycle, 150 + cards.length * 200 + 400);
    running = true;
  }
  if ("IntersectionObserver" in window) {
    // the team block crosses the middle third of the screen = the visitor is really looking at it
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !running) start();
        if (!e.isIntersecting && running) { running = false; clearTimeout(hiTimer); }
      });
    }, { rootMargin: "-38% 0px -38% 0px", threshold: 0 });
    io.observe(grid || team);
  } else start();
  document.addEventListener("team:frame", function () { setTimeout(start, 500); });
  setDot(0);

  // 3D tilt: pointer on a computer, the phone's tilt on a phone (Android; iPhone needs a permission tap, so it simply stays flat).
  if (still) return;
  cards.forEach(function (c) {
    c.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch" || phone()) return;
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty("--mx", (x * 100) + "%"); c.style.setProperty("--my", (y * 100) + "%");
      c.style.transform = "rotateY(" + ((x - .5) * 14) + "deg) rotateX(" + ((.5 - y) * 12) + "deg) translateZ(6px)";
    });
    c.addEventListener("pointerleave", function () { c.style.transform = ""; });
  });
  var raf = 0;
  window.addEventListener("deviceorientation", function (e) {
    if (e.gamma == null || raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var gx = Math.max(-1, Math.min(1, e.gamma / 30)), gy = Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 30));
      if (phone()) return; cards.forEach(function (c) { if (c.classList.contains("tfx-go")) c.style.transform = "rotateY(" + (gx * 8) + "deg) rotateX(" + (-gy * 6) + "deg)"; });
    });
  });
})();
