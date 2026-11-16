/*
 * facescan.js — the face scan in front of the freight forms.
 *
 * Lewis, 11/16, on the satellite onboarding scan: "add it to the other sites minus the drivers
 * licences ... it makes it super bot proof" / "make sure it's on the others sites" / "i want this
 * video ... minus the license."
 *
 * <script src="/facescan.js" data-form="Request a Truck" [data-click="#saSubmit"] [data-need="#saName,#saEmail"] defer></script>
 *   data-click: a button that sends without a <form> (truckload's Create account).
 *   data-need:  fields that must be filled before the scan opens, so the page shows its own errors first.
 *
 * When the visitor presses Send, this opens a full-screen scan first: the camera in a circle, blue
 * ribbons, "look straight / turn right / turn left", nine seconds. It records a short video and three
 * photos, posts them to /api/face-scan with the name, email and phone already typed, then lets the
 * page's own submit go through untouched.
 *
 * WHAT IT IS NOT. It captures; it does not match a face to an ID. The notice on the first screen says
 * what is recorded and who gets it, before the camera opens.
 * NO CAMERA ON THE DEVICE (many office computers): the request goes through, flagged "no camera".
 * CAMERA REFUSED: the request waits; the visitor can allow it, or call 803-361-1303.
 * STOPPED AT THE SCAN (Cancel, camera refused, page closed): Lewis is told with the name and phone
 * typed so far, so he can call. "I can't miss an opportunity to retain a customer" (9/25).
 * FAIL OPEN: any error in here lets the form send. A broken scan must never cost Lewis a lead.
 */
(function () {
  var me = document.currentScript, FORM = (me && me.getAttribute("data-form")) || document.title, CLICK = me && me.getAttribute("data-click"), NEED = ((me && me.getAttribute("data-need")) || "").split(",").filter(Boolean);
  var passed = false, busy = false, pending = null;
  function q(root, sels) { for (var i = 0; i < sels.length; i++) { var e = root.querySelector(sels[i]); if (e && e.value && String(e.value).trim()) return String(e.value).trim().slice(0, 160); } return ""; }
  function who(root) {
    return { name: q(root, ['input[autocomplete="name"]', 'input[name="name"]', "#name", 'input[id$="name"]', 'input[id*="Name"]', 'input[id*="name"]']),
      email: q(root, ['input[type="email"]', 'input[name="email"]']), phone: q(root, ['input[type="tel"]', 'input[name="phone"]', 'input[id*="phone"]']) };
  }
  function release() { passed = true; busy = false; var p = pending; pending = null; close(); if (!p) return;
    try { if (p.form) { if (p.form.requestSubmit) p.form.requestSubmit(p.btn && p.btn.form === p.form ? p.btn : undefined); else p.form.submit(); } else if (p.el) p.el.click(); } catch (x) {}
  }
  function ready() { for (var i = 0; i < NEED.length; i++) { var el = document.querySelector(NEED[i]); if (el && !String(el.value || "").trim()) return false; } return true; }
  function guard(e, p) { if (passed) return; try { if (!ready()) return; e.preventDefault(); e.stopImmediatePropagation(); if (busy) return; busy = true; pending = p; open(); } catch (x) { passed = true; } }
  document.addEventListener("submit", function (e) {
    var f = e.target; if (!f || f.tagName !== "FORM" || f.hasAttribute("data-no-facescan")) return;
    if (f.checkValidity && !f.checkValidity()) return;      // let the page show its own errors first
    guard(e, { form: f, btn: e.submitter || null, root: f });
  }, true);
  if (CLICK) document.addEventListener("click", function (e) { var el = e.target && e.target.closest ? e.target.closest(CLICK) : null; if (el) guard(e, { el: el, root: document }); }, true);

  var ov = null, stream = null, told = false;
  function stopped(why) { if (told || passed) return; told = true; try { var w = who((pending && pending.root) || document);
    navigator.sendBeacon("/api/face-scan", new Blob([JSON.stringify({ declined: true, why: why, form: FORM, path: location.pathname, name: w.name, email: w.email, phone: w.phone })], { type: "application/json" })); } catch (x) {} }
  window.addEventListener("pagehide", function () { if (ov) stopped("left the page"); });
  function close() { try { if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); } catch (x) {} stream = null; if (ov) { ov.remove(); ov = null; } }
  function css() {
    if (document.getElementById("fs-css")) return; var s = document.createElement("style"); s.id = "fs-css";
    s.textContent = "#fs-ov{position:fixed;inset:0;z-index:2147483647;background:radial-gradient(900px 500px at 80% -10%,rgba(10,132,255,.35),transparent 60%),linear-gradient(180deg,#041428,#020b18);color:#eaf4ff;font:16px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;overflow:auto;-webkit-text-size-adjust:100%}" +
      "#fs-ov *{box-sizing:border-box}#fs-ov .in{max-width:460px;margin:0 auto;padding:16px 16px 28px;text-align:center}" +
      "#fs-ov .pl{background:#fff;border-radius:10px;padding:6px 10px;display:inline-block;box-shadow:0 0 24px rgba(10,132,255,.45)}#fs-ov .pl img{height:30px;display:block}" +
      "#fs-ov h2{font-size:24px;font-weight:900;margin:14px 0 4px;color:#fff}#fs-ov p{margin:6px 0;color:#9db7d6;font-size:14px}" +
      "#fs-ov .sc{position:relative;width:min(78vw,300px);aspect-ratio:1;margin:16px auto 8px}" +
      "#fs-ov .fc{position:absolute;inset:11%;border-radius:50%;overflow:hidden;background:#01060e}#fs-ov video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}" +
      "#fs-ov .ln{position:absolute;left:0;right:0;height:26%;background:linear-gradient(180deg,transparent,rgba(90,209,255,.45),transparent);animation:fs-sw 2.2s ease-in-out infinite}@keyframes fs-sw{0%{top:-26%}100%{top:100%}}" +
      "#fs-ov .rb{position:absolute;border-radius:50%;inset:0;-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 7px),#000 calc(100% - 6px));mask:radial-gradient(farthest-side,transparent calc(100% - 7px),#000 calc(100% - 6px))}" +
      "#fs-ov .r1{background:conic-gradient(from 0deg,transparent 0 55%,rgba(10,132,255,.2),#5ad1ff 92%,#fff 100%);animation:fs-sp 2.4s linear infinite;filter:drop-shadow(0 0 10px #5ad1ff)}" +
      "#fs-ov .r2{inset:4.5%;background:conic-gradient(from 180deg,transparent 0 62%,#0a84ff 96%,#bfe9ff 100%);animation:fs-sp 3.6s linear infinite reverse}@keyframes fs-sp{to{transform:rotate(360deg)}}" +
      "#fs-ov .tk{position:absolute;inset:7.5%}#fs-ov .tk svg{width:100%;height:100%;transform:rotate(-90deg)}#fs-ov .tk circle{fill:none;stroke-width:5}#fs-ov .tk .b{stroke:rgba(255,255,255,.14);stroke-dasharray:2 5.85}#fs-ov .tk .f{stroke:#5ad1ff;stroke-dasharray:0 1000;filter:drop-shadow(0 0 6px #5ad1ff)}" +
      "#fs-ov .hd{font-weight:900;font-size:21px;min-height:30px;color:#fff;text-shadow:0 0 16px rgba(90,209,255,.8)}#fs-ov .sb{color:#5ad1ff;font:700 12px/1.5 ui-monospace,Menlo,monospace;letter-spacing:.08em;min-height:20px}" +
      "#fs-ov .ok .rb,#fs-ov .ok .ln{animation:none;opacity:0}#fs-ov .ok .fc{box-shadow:0 0 0 5px #35e08a,0 0 50px rgba(53,224,138,.7)}" +
      "#fs-ov button{display:block;width:100%;border:0;border-radius:14px;padding:16px;font:900 17px/1 system-ui,sans-serif;cursor:pointer;margin-top:12px}#fs-ov .go{color:#02101f;background:linear-gradient(90deg,#5ad1ff,#fff 50%,#5ad1ff);box-shadow:0 0 30px rgba(90,209,255,.55)}#fs-ov .no{background:transparent;color:#9db7d6;border:1px solid rgba(120,190,255,.3);font-weight:700;font-size:15px}" +
      "#fs-ov a{color:#5ad1ff;font-weight:800}";
    document.head.appendChild(s);
  }
  function open() {
    css(); ov = document.createElement("div"); ov.id = "fs-ov";
    ov.innerHTML = '<div class="in"><span class="pl"><img src="/landstar-logo.png" alt="Landstar Agent"></span><h2>One quick step: confirm you\'re a real person</h2>' +
      '<div class="sc" id="fs-sc"><div class="rb r1"></div><div class="rb r2"></div><div class="tk"><svg viewBox="0 0 100 100"><circle class="b" cx="50" cy="50" r="47.5"/><circle class="f" id="fs-fg" cx="50" cy="50" r="47.5"/></svg></div><div class="fc"><video id="fs-v" autoplay playsinline muted></video><div class="ln"></div></div></div>' +
      '<div class="hd" id="fs-hd">A 9-second face scan</div><div class="sb" id="fs-sb"></div>' +
      '<p id="fs-nt">🔴 This records a short video and three photos of your face to confirm a real person is sending this request. They go only to Lewis Broome, Landstar Agency LBR, with your request. By tapping Begin face scan you agree to this.</p>' +
      '<button class="go" id="fs-go">Begin face scan</button><button class="no" id="fs-no">Cancel</button>' +
      '<p>Prefer to talk? <a href="tel:+18033611303">Call 803-361-1303</a></p></div>';
    document.body.appendChild(ov);
    ov.querySelector("#fs-no").onclick = function () { stopped("tapped Cancel"); busy = false; pending = null; close(); };
    ov.querySelector("#fs-go").onclick = begin;
  }
  function send(body) { body.form = FORM; body.path = location.pathname; var w = who((pending && pending.root) || document); body.name = w.name; body.email = w.email; body.phone = w.phone;
    var done = false, fin = function () { if (!done) { done = true; release(); } };
    setTimeout(fin, 9000);                                                    // never hold a lead for the upload
    try { fetch("/api/face-scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(function (r) { return r.json(); }).then(fin, fin); } catch (x) { fin(); }
  }
  function begin() {
    var go = ov.querySelector("#fs-go"), hd = ov.querySelector("#fs-hd"), nt = ov.querySelector("#fs-nt");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { hd.textContent = "Sending your request…"; return send({ noCam: true, why: "unsupported" }); }
    go.disabled = true; go.textContent = "Opening your camera…";
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }).then(function (st) { stream = st; ov.querySelector("#fs-v").srcObject = st; go.style.display = "none"; ov.querySelector("#fs-no").style.display = "none"; setTimeout(run, 900); })
      .catch(function (err) {
        var n = (err && err.name) || "";
        if (n === "NotFoundError" || n === "OverconstrainedError" || n === "NotReadableError") { hd.textContent = "No camera found. Sending your request…"; return send({ noCam: true, why: n }); }
        stopped("camera not allowed"); go.disabled = false; go.textContent = "Try again"; hd.textContent = "Camera access is needed"; nt.textContent = "Please allow the camera for this page, then tap Try again. Or call 803-361-1303 and Lewis will take your request by phone.";
      });
  }
  function run() {
    var v = ov.querySelector("#fs-v"), hd = ov.querySelector("#fs-hd"), sb = ov.querySelector("#fs-sb"), fg = ov.querySelector("#fs-fg"), C = 2 * Math.PI * 47.5, t0 = Date.now(), D = 9000, shots = [], cur = -1;
    var rec = null, chunks = [], vid = null;
    try { if (window.MediaRecorder) { var mt = ["video/mp4", "video/webm;codecs=vp8", "video/webm"].filter(function (m) { return MediaRecorder.isTypeSupported(m); })[0];
      rec = new MediaRecorder(stream, mt ? { mimeType: mt, videoBitsPerSecond: 700000 } : { videoBitsPerSecond: 700000 }); rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = function () { vid = new Blob(chunks, { type: (rec.mimeType || mt || "video/mp4").split(";")[0] }); }; rec.start(); } } catch (x) { rec = null; }
    function snap() { try { var c = document.createElement("canvas"); c.width = c.height = 360; var w = v.videoWidth || 360, h = v.videoHeight || 360, m = Math.min(w, h); c.getContext("2d").drawImage(v, (w - m) / 2, (h - m) / 2, m, m, 0, 0, 360, 360); shots.push(c.toDataURL("image/jpeg", .7)); } catch (x) {} }
    var ph = ["Look straight ahead", "Turn slowly to your right ›", "‹ Now slowly to your left"];
    var tm = setInterval(function () {
      var p = Math.min(1, (Date.now() - t0) / D), i = Math.min(2, Math.floor(p * 3)); fg.style.strokeDasharray = (p * C) + " 1000";
      if (i !== cur) { if (cur >= 0) snap(); cur = i; hd.textContent = ph[i]; }
      sb.textContent = Math.round(p * 100) + "% · SCANNING";
      if (p >= 1) { clearInterval(tm); snap(); ov.querySelector("#fs-sc").className = "sc ok"; hd.textContent = "Captured. Sending your request…"; hd.style.color = "#35e08a"; sb.textContent = "";
        try { if (rec && rec.state !== "inactive") rec.stop(); } catch (x) {}
        setTimeout(function () {
          if (vid && vid.size > 1000 && vid.size < 2600000) { var fr = new FileReader(); fr.onload = function () { send({ photos: shots, mime: vid.type, video: String(fr.result).split(",")[1] }); }; fr.onerror = function () { send({ photos: shots }); }; fr.readAsDataURL(vid); }
          else send({ photos: shots });
        }, 450); }
    }, 80);
  }
})();
