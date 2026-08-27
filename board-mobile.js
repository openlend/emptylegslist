/* Collapses the city board filters behind one button on a phone.
 * The panel and every control stay exactly where they are in the markup, so
 * nothing about the existing filter code has to change. */
(function () {
  "use strict";
  var MOBILE = "(max-width: 860px)";

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    var panel = document.querySelector(".panel");
    if (!panel || document.querySelector(".bm-toggle")) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bm-toggle";
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<span>Filters</span><span class="bm-right">' +
      '<span class="bm-n" hidden>0</span>' +
      '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">' +
      '<path d="M 5 9 L 12 16 L 19 9" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
    panel.parentNode.insertBefore(btn, panel);

    var mq = window.matchMedia(MOBILE);
    var fields = [].slice.call(panel.querySelectorAll("select, input"));
    var initial = fields.map(function (f) { return f.value; });

    function count() {
      var n = 0;
      fields.forEach(function (f, i) {
        var v = f.value;
        if (v !== initial[i] && v !== "" && v !== "any" && v !== "both") n++;
      });
      return n;
    }
    function paint() {
      var n = count(), tag = btn.querySelector(".bm-n");
      tag.textContent = n;
      tag.hidden = n === 0;
    }
    function collapse(yes) {
      panel.classList.toggle("bm-hide", yes);
      btn.setAttribute("aria-expanded", String(!yes));
    }

    function apply() {
      if (mq.matches) collapse(!panel.classList.contains("bm-hide") ? true : true);
      else { panel.classList.remove("bm-hide"); btn.setAttribute("aria-expanded", "true"); }
    }
    collapse(mq.matches);
    if (mq.addEventListener) mq.addEventListener("change", function () { collapse(mq.matches); });

    btn.addEventListener("click", function () {
      collapse(!panel.classList.contains("bm-hide"));
    });
    fields.forEach(function (f) { f.addEventListener("change", paint); f.addEventListener("input", paint); });
    paint();

    /* Applying a filter on a phone should hand the screen back to the results. */
    panel.addEventListener("click", function (e) {
      var b = e.target.closest("button, .apply, [type=submit]");
      if (!b || !mq.matches) return;
      setTimeout(function () {
        paint();
        if (!/clear/i.test(b.textContent || "")) collapse(true);
      }, 30);
    });
  });
})();
