/* holo.js — Lewis as a hologram that walks out onto the page and talks (Lewis, 11/21: "embed this video on my
   site, kind of like a hologram almost, like me walking out saying that instead of a video").

   The clip is ONE mp4 with the picture on top and its cut-out mask underneath (made once from his Grok clip),
   so the browser keys him out of the background itself on every device, iPhone included, with no special codec.
   He materializes out of a projector base bottom-right, speaks with captions (muted, as every browser requires
   until a tap), and folds into a small "Hear Lewis" button that replays him with sound.

   <script src="/holo.js" data-src="/assets/holo/lewis-holo.mp4" data-after="#intro" defer></script>
   data-after: wait until this element (the page's opening intro) has gone before he appears.
   Holds still for reduced-motion visitors (shows the button only). Once per visit, then the button. */
(function () {
  var me = document.currentScript; if (!me) return;
  var SRC = me.getAttribute("data-src"), AFTER = me.getAttribute("data-after");
  var CAPS = [[0, 2.7, "Freight forwarders, 3PLs: I got you covered."], [3.6, 8.6, "Instant access to Landstar's capacity, seamlessly."]];
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var KEY = "lbr_holo_seen";

  var css = document.createElement("style");
  css.textContent =
    "#holo{position:fixed;right:clamp(8px,2vw,26px);bottom:clamp(92px,13vh,120px);width:clamp(170px,19vw,270px);z-index:60;pointer-events:none;opacity:0;transition:opacity .4s}" +
    "#holo.on{opacity:1}#holo .stage{position:relative;width:100%;aspect-ratio:512/620}" +
    "#holo canvas{position:absolute;left:0;top:0;width:100%;height:auto;transform-origin:50% 100%;filter:drop-shadow(0 0 14px rgba(80,180,255,.65))}" +
    "#holo .base{position:absolute;left:8%;right:8%;bottom:0;height:13%;border-radius:50%;background:radial-gradient(ellipse at 50% 50%,rgba(140,215,255,.95),rgba(47,155,255,.45) 45%,rgba(47,155,255,0) 72%);box-shadow:0 0 30px rgba(47,155,255,.7)}" +
    "#holo .beam{position:absolute;left:14%;right:14%;bottom:5%;height:96%;background:linear-gradient(0deg,rgba(90,190,255,.32),rgba(90,190,255,0) 80%);clip-path:polygon(18% 0,82% 0,100% 100%,0 100%);opacity:0;transition:opacity .6s}" +
    "#holo.beamon .beam{opacity:1}" +
    "#holo .cap{position:absolute;left:-30%;right:-6%;bottom:-2px;transform:translateY(100%);margin-top:6px;padding:7px 10px;border-radius:10px;background:rgba(4,14,30,.82);border:1px solid rgba(124,196,255,.35);color:#eaf3ff;font:600 13px/1.35 Inter,system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .25s}" +
    "#holo .cap.on{opacity:1}" +
    "#holo .ctl{position:absolute;top:2%;right:-4%;display:flex;gap:6px;pointer-events:auto}" +
    "#holo .ctl button,#holoBtn{background:rgba(6,22,42,.85);border:1px solid rgba(124,196,255,.45);color:#cfe8ff;font:700 12px Inter,system-ui,sans-serif;border-radius:99px;padding:6px 10px;cursor:pointer;backdrop-filter:blur(6px)}" +
    "#holoBtn{position:fixed;right:clamp(8px,2vw,26px);bottom:clamp(92px,13vh,120px);z-index:60;display:none;align-items:center;gap:7px;padding:8px 13px 8px 8px;box-shadow:0 0 18px rgba(47,155,255,.45)}" +
    "#holoBtn img{width:26px;height:26px;border-radius:50%;object-fit:cover;object-position:50% 12%;border:1px solid rgba(124,196,255,.6)}" +
    "#holoBtn.on{display:flex}";
  document.head.appendChild(css);

  var wrap = document.createElement("div"); wrap.id = "holo"; wrap.setAttribute("aria-label", "Lewis Broome, hologram");
  wrap.innerHTML = '<div class="stage"><div class="beam"></div><div class="base"></div><canvas></canvas><div class="cap" aria-live="polite"></div>' +
    '<div class="ctl"><button type="button" class="snd">🔊 Sound</button><button type="button" class="x" aria-label="Close">✕</button></div></div>';
  var btn = document.createElement("button"); btn.id = "holoBtn"; btn.type = "button";
  btn.innerHTML = '<img alt="" src="/assets/holo/lewis-holo-face.jpg">▶ Hear Lewis';
  document.body.appendChild(wrap); document.body.appendChild(btn);

  var v = document.createElement("video"); v.src = SRC; v.playsInline = true; v.muted = true; v.preload = "auto"; v.crossOrigin = "anonymous";
  v.setAttribute("playsinline", ""); v.setAttribute("muted", "");
  var cv = wrap.querySelector("canvas"), cx = cv.getContext("2d", { willReadFrequently: true }), cap = wrap.querySelector(".cap");
  var buf = document.createElement("canvas"), bx = buf.getContext("2d", { willReadFrequently: true });
  var W = 512, H = 576, running = false, born = 0, scan = null;

  function frame(now) {
    if (!running) return;
    if (v.readyState >= 2 && v.videoWidth) {
      W = v.videoWidth; H = v.videoHeight / 2;
      if (cv.width !== W) { cv.width = W; cv.height = H; buf.width = W; buf.height = H * 2; scan = null; }
      bx.drawImage(v, 0, 0);
      var top = bx.getImageData(0, 0, W, H), mask = bx.getImageData(0, H, W, H), d = top.data, m = mask.data;
      var t = (now - born) / 1000, rise = Math.min(1, t / 1.1);             // materialize from the base upward
      var edge = H * (1 - rise), flick = 0.9 + Math.random() * 0.1;
      for (var y = 0, i = 0; y < H; y++) {
        var line = (y % 4 === 0) ? 0.78 : 1, rowA = y < edge ? 0 : (y < edge + 18 ? (y - edge) / 18 : 1), band = Math.abs(y - edge) < 3 && rise < 1;
        for (var xx = 0; xx < W; xx++, i += 4) {
          var a = m[i] / 255 * rowA;
          if (band && a > 0.05) { d[i] = 160; d[i + 1] = 230; d[i + 2] = 255; d[i + 3] = 255; continue; }
          // a light hologram tint: his true colours kept, a cool cast and scan lines laid over them
          d[i] = d[i] * 0.82 * line; d[i + 1] = (d[i + 1] * 0.9 + 14) * line; d[i + 2] = Math.min(255, d[i + 2] * 0.95 + 38) * line;
          d[i + 3] = a * 255 * flick * (t > 1.1 ? 0.92 : 1);
        }
      }
      cx.putImageData(top, 0, 0);
      // a glitch slice now and then
      if (Math.random() < 0.035) { var sy = Math.random() * H, sh = 4 + Math.random() * 10; cx.drawImage(cv, 0, sy, W, sh, (Math.random() - .5) * 14, sy, W, sh); }
      var s = 0.86 + 0.14 * (rise < 1 ? rise : 1);                             // he steps forward as he arrives
      cv.style.transform = "scale(" + s + ")";
      var ct = v.currentTime, c = CAPS.filter(function (q) { return ct >= q[0] && ct < q[1]; })[0];
      if (c) { if (cap.textContent !== c[2]) cap.textContent = c[2]; cap.classList.add("on"); } else cap.classList.remove("on");
    }
    requestAnimationFrame(frame);
  }
  function show(withSound) {
    btn.classList.remove("on"); wrap.classList.add("on", "beamon"); running = true; born = performance.now();
    v.currentTime = 0; v.muted = !withSound; wrap.querySelector(".snd").style.display = withSound ? "none" : "";
    var p = v.play(); if (p && p.catch) p.catch(function () { v.muted = true; v.play().catch(function () { fold(); }); });
    requestAnimationFrame(frame);
  }
  function fold() {
    running = false; v.pause(); wrap.classList.remove("on", "beamon"); cap.classList.remove("on");
    setTimeout(function () { btn.classList.add("on"); }, 350);
  }
  v.addEventListener("ended", function () { setTimeout(fold, 700); });
  wrap.querySelector(".x").onclick = fold;
  wrap.querySelector(".snd").onclick = function () { show(true); };
  btn.onclick = function () { show(true); };

  var seen = false; try { seen = sessionStorage.getItem(KEY) === "1"; } catch (e) {}
  if (reduce || seen) { btn.classList.add("on"); return; }
  try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
  function go() { setTimeout(function () { show(false); }, 900); }
  var gate = AFTER && document.querySelector(AFTER);
  if (gate && !gate.hidden && document.body.contains(gate)) {
    var t = setInterval(function () { var g = document.querySelector(AFTER); if (!g || g.hidden || g.classList.contains("out")) { clearInterval(t); go(); } }, 200);
  } else go();
})();
