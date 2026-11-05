// Surrogate Funding intake: posts a form to /api/sf-intake with the bot trap, the fill timer and
// (when a site key is set) Cloudflare Turnstile. Same answer either way; errors shown per field.
(function () {
  var form = document.querySelector("form.sf-form");
  if (!form) return;
  var t0 = Date.now();
  var siteKey = form.getAttribute("data-turnstile-sitekey") || "";
  var tsToken = "";
  if (siteKey) {
    var s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=sfTurnstileReady";
    s.async = true; s.defer = true;
    window.sfTurnstileReady = function () {
      window.turnstile.render("#turnstile", { sitekey: siteKey, callback: function (t) { tsToken = t; }, "expired-callback": function () { tsToken = ""; } });
    };
    document.head.appendChild(s);
  }
  function setErr(name, msg) {
    var el = form.querySelector('[name="' + name + '"]');
    var wrap = el ? el.closest(".f, .check") : null;
    if (wrap) { wrap.classList.toggle("bad", !!msg); var e = wrap.querySelector(".err"); if (e) e.textContent = msg || ""; }
  }
  function clearErrs() { form.querySelectorAll(".bad").forEach(function (w) { w.classList.remove("bad"); }); form.querySelectorAll(".err").forEach(function (e) { e.textContent = ""; }); }
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    clearErrs();
    var btn = form.querySelector('button[type="submit"]');
    var fail = form.querySelector(".fail");
    if (fail) fail.textContent = "";
    var body = { kind: form.getAttribute("data-kind"), fill_ms: Date.now() - t0, turnstile_token: tsToken };
    new FormData(form).forEach(function (v, k) { body[k] = v; });
    form.querySelectorAll('input[type="checkbox"]').forEach(function (c) { body[c.name] = c.checked; });
    if (siteKey && !tsToken) { if (fail) fail.textContent = "Please finish the \"I'm human\" check first."; return; }
    btn.disabled = true;
    fetch("/api/sf-intake", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }).then(function (d) { d.status = r.status; return d; }); })
      .then(function (d) {
        if (d.ok) {
          var sent = document.getElementById("sent");
          form.hidden = true; sent.hidden = false;
          sent.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        var errs = d.errors || {};
        var first = null;
        Object.keys(errs).forEach(function (k) { setErr(k, errs[k]); if (!first) first = form.querySelector('[name="' + k + '"]'); });
        if (errs.turnstile && fail) fail.textContent = errs.turnstile;
        if (!Object.keys(errs).length && fail) fail.textContent = "We couldn't save that just now. Please try again in a minute, or call or text 803-361-1303.";
        if (first && first.focus) first.focus();
        if (window.turnstile && siteKey) { window.turnstile.reset(); tsToken = ""; }
      })
      .catch(function () { if (fail) fail.textContent = "We couldn't reach our server. Please try again, or call or text 803-361-1303."; })
      .then(function () { btn.disabled = false; });
  });
})();
