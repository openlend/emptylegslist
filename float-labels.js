/* Floating labels for the form fields on this site.
 *
 * The label starts inside the empty field and lifts to the top edge when the
 * field is focused or already holds a value, which is the pattern people know
 * from every modern form. Nothing in the page markup has to change: the script
 * finds each control, finds its label, and takes over the positioning.
 *
 * Two shapes, chosen from the field's own styling:
 *   - a field with a border gets the label notched into that border
 *   - a flat field (background only, no border) gets it seated inside the top
 *
 * Left alone: fields with no label, hidden fields, checkboxes, radios, buttons,
 * the honeypot, and anything under data-nofloat.
 */
(function () {
  "use strict";
  var ALWAYS_UP = { date: 1, "datetime-local": 1, month: 1, week: 1, time: 1, color: 1 };
  var SKIP = { hidden: 1, checkbox: 1, radio: 1, submit: 1, button: 1, reset: 1, image: 1, file: 1, range: 1 };
  var VISIBLE = "input:not([type=hidden]), select, textarea";

  function esc(id) {
    return window.CSS && CSS.escape ? CSS.escape(id) : String(id).replace(/([^\w-])/g, "\\$1");
  }

  function usable(l, el) {
    return !!l && l.tagName === "LABEL" && !l.closest(".ffl") &&
      !l.querySelector("input,select,textarea") && l.textContent.trim() !== "" &&
      (!l.htmlFor || l.htmlFor === el.id);
  }

  function findLabel(el) {
    if (el.id) {
      var l = document.querySelector('label[for="' + esc(el.id) + '"]');
      if (usable(l, el)) return l;
    }
    /* Some fields have an icon between the label and the input, so look back a
       few siblings rather than only at the one immediately before. */
    var p = el.previousElementSibling, hops = 0;
    while (p && hops < 3) {
      if (usable(p, el)) return p;
      if (p.tagName === "LABEL") return null;
      p = p.previousElementSibling; hops++;
    }
    return null;
  }

  function skip(el) {
    return !!(el.closest("[data-nofloat]") || (el.type && SKIP[el.type]) ||
      el.getAttribute("aria-hidden") === "true" || el.tabIndex === -1 ||
      el.classList.contains("hp") || el.closest(".ffl"));
  }

  /* Prefer the element the field already sits in. Wrapping a field in a new div
     detaches any icon or dropdown that was positioned against that container,
     so we only wrap when there is nothing to break. */
  function context(el, label) {
    var par = el.parentElement;
    if (!par || par === label || par.tagName === "FORM" || par.tagName === "LABEL") return null;
    var controls = par.querySelectorAll(VISIBLE);
    if (controls.length !== 1 || controls[0] !== el) return null;
    if (!par.contains(label)) return null;
    return par;
  }

  function makeWrapper(el, label) {
    var wrap = document.createElement("div");
    wrap.className = "ffl ffl-wrap";
    var s = el.style;
    ["flex", "flexBasis", "flexGrow", "flexShrink", "width", "minWidth", "maxWidth",
     "margin", "marginTop", "marginBottom", "marginLeft", "marginRight",
     "gridColumn", "gridRow"].forEach(function (k) {
      if (s[k]) { wrap.style[k] = s[k]; s[k] = ""; }
    });
    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(label);
    wrap.appendChild(el);
    return wrap;
  }

  /* An icon that was placed by hand against the old label-above-field layout is
     now sitting below the field. Re-centre it on the control it belongs to. */
  function fixIcons(host, el) {
    var kids = host.children;
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (k === el || k.tagName === "LABEL") continue;
      var cs = getComputedStyle(k);
      if (cs.position !== "absolute") continue;
      if (k.querySelector(VISIBLE)) continue;            // a dropdown panel, not an icon
      if (k.style.top === "100%" || k.style.bottom) continue;
      var h = k.offsetHeight || parseFloat(k.getAttribute("height")) || 16;
      if (h > 60) continue;
      k.style.top = Math.round(el.offsetTop + el.offsetHeight / 2 - h / 2) + "px";
    }
  }

  function build(el) {
    var label = findLabel(el);
    if (!label) return;

    var host = context(el, label);
    if (host) { host.classList.add("ffl"); host.appendChild(label); host.appendChild(el); }
    else { host = makeWrapper(el, label); }
    if (el.tagName === "TEXTAREA") host.classList.add("ffl-area");

    /* Whatever the page said about this label as a block heading above the
       field no longer applies now that it sits inside the field. */
    ["display", "fontSize", "fontWeight", "margin", "marginBottom", "marginTop",
     "color", "letterSpacing", "textTransform", "lineHeight", "position", "top", "left", "width"]
      .forEach(function (k) { label.style[k] = ""; });

    var cs = getComputedStyle(el);
    var flat = parseFloat(cs.borderTopWidth) < 1;
    if (flat) {
      host.classList.add("ffl-flat");
      el.style.paddingTop = (parseFloat(cs.paddingTop) + 11) + "px";
      if (el.tagName !== "TEXTAREA") {
        el.style.paddingBottom = Math.max(6, parseFloat(cs.paddingBottom) - 4) + "px";
      }
    } else {
      /* The notch is painted in the field's own background colour, so it reads
         as a gap in the border and not as a white box on a coloured field. */
      var bg = cs.backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") label.style.background = bg;
    }

    /* Fields with a leading icon inset their text; the label lines up with it. */
    var padL = parseFloat(cs.paddingLeft);
    if (padL > 14) label.style.left = (padL - (flat ? 0 : 4)) + "px";

    var ph = el.getAttribute("placeholder");
    if (ph) el.setAttribute("data-ph", ph);

    var sync = function () {
      var floated = !!(ALWAYS_UP[el.type] || el.tagName === "SELECT" ||
        document.activeElement === el || (el.value !== "" && el.value != null));
      host.classList.toggle("is-float", floated);
      if (ph) el.setAttribute("placeholder", floated ? ph : "");
    };
    ["focus", "blur", "input", "change"].forEach(function (ev) { el.addEventListener(ev, sync); });
    sync();
    fixIcons(host, el);
    /* Browsers restore values and autofill after load without firing input. */
    setTimeout(function () { sync(); fixIcons(host, el); }, 80);
    setTimeout(function () { sync(); fixIcons(host, el); }, 500);
  }

  function run() {
    var list = document.querySelectorAll("input, textarea, select");
    for (var i = 0; i < list.length; i++) {
      if (!skip(list[i])) { try { build(list[i]); } catch (e) { /* never break a form */ } }
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
