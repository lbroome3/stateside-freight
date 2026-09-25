/*
 * engage.js — "someone is filling in your form", sent the moment it starts.
 *
 * Lewis, 9/25: "Make sure I'm notified on all forms this same way. I can't miss an
 * opportunity to retain a customer. I really need new customers."
 *
 * The Request a Truck page proved the pattern: the visitor is anonymous at exactly the
 * moment the live chat opens, so an alert that waits for a name arrives after the chance
 * to say hello is gone. This does the same thing for every form on the site. Four seconds
 * after a visitor first types or picks something, it sends the form's name and whatever
 * they have filled in so far to /api/web-lead (stage "engaged"). Lewis's phone lights up
 * and the chat is one tap away. Once per page load. Nothing is saved as a lead.
 *
 * Include with:  <script src="/engage.js" data-form="Container Quote" defer></script>
 *
 * The spam trap goes with it. Every form here has a field no person can see (#company_website
 * on the customer pages, .hp on the driver pages); a script that fills every input fills that
 * one too, and the server drops the alert. The time on the page goes with it as well.
 */
(function () {
  var me = document.currentScript;
  var FORM = (me && me.getAttribute("data-form")) || document.title || location.pathname;
  var API = "/api/web-lead";
  var T0 = Date.now();
  var WAIT_MS = 4000;
  var armed = false, sent = false;
  var touched = [];

  function isTrap(el) {
    return el.id === "company_website" || el.name === "company_website"
      || (el.classList && el.classList.contains("hp"))
      || (el.tabIndex === -1 && el.getAttribute("aria-hidden") === "true");
  }
  function trapValue() {
    var t = document.querySelectorAll('#company_website, input[name="company_website"], input.hp');
    for (var i = 0; i < t.length; i++) if ((t[i].value || "").trim()) return t[i].value;
    return "";
  }
  function labelOf(el) {
    var t = "";
    if (el.labels && el.labels[0]) t = el.labels[0].textContent;
    else {
      var box = el.closest && el.closest(".fld, .field, .af");
      var l = box && box.querySelector("label");
      if (l) t = l.textContent;
      else if (el.previousElementSibling && el.previousElementSibling.tagName === "LABEL") t = el.previousElementSibling.textContent;
    }
    t = (t || el.placeholder || el.name || el.id || "field").replace(/\*/g, "").replace(/\s+/g, " ").trim();
    return t.slice(0, 40);
  }
  function valueOf(el) {
    if (el.type === "checkbox" || el.type === "radio") return el.checked ? "yes" : "";
    if (el.tagName === "SELECT") {
      var o = el.options[el.selectedIndex];
      return (el.value && o) ? o.text.trim() : "";
    }
    return (el.value || "").trim();
  }
  function snapshot() {
    var out = [];
    for (var i = 0; i < touched.length && out.length < 10; i++) {
      var v = valueOf(touched[i]);
      if (v) out.push([labelOf(touched[i]), v.slice(0, 80)]);
    }
    return out;
  }
  function fire() {
    if (sent) return;
    var fields = snapshot();
    if (!fields.length) { armed = false; return; }   // they cleared it; wait for real input
    sent = true;
    try {
      fetch(API, {
        method: "POST", keepalive: true, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "engaged", form: FORM, fields: fields, page: location.pathname,
          company_website: trapValue(), fill_ms: Date.now() - T0,
        }),
      }).catch(function () {});
    } catch (x) {}
  }
  function onInput(e) {
    var el = e.target;
    if (!el || !/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
    if (el.type === "hidden" || el.type === "submit" || el.type === "button" || isTrap(el)) return;
    if (touched.indexOf(el) < 0) touched.push(el);
    if (!armed && !sent) { armed = true; setTimeout(fire, WAIT_MS); }
  }
  document.addEventListener("input", onInput, true);
  document.addEventListener("change", onInput, true);
  // Leaving before the four seconds are up still counts: that is the visitor most worth a hello.
  window.addEventListener("pagehide", function () { if (armed && !sent) fire(); });
})();
