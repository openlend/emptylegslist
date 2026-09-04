/* Floating labels for every form on the site (4 September 2026).
 *
 * Wraps text inputs, textareas and labelled selects in a .mf box and adds a
 * label that sits inside the field until it is focused or filled, then rises
 * into the border (the Material "outlined" text field). The page's own block
 * label, when there is one, gives the text and is hidden; otherwise the
 * placeholder becomes the label and the field gets a hint of its own.
 * Nothing about values, ids or events changes, so the page scripts keep working.
 */
(function () {
  "use strict";
  var SEL = 'input[type="text"],input[type="email"],input[type="tel"],input[type="search"],input[type="url"],input[type="number"],input[type="date"],input:not([type]),textarea,select';

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  function text(el) { return (el.textContent || "").replace(/\s+/g, " ").replace(/[:*]\s*$/, "").trim(); }
  function labelOf(el) {
    if (el.id) { var l = document.querySelector('label[for="' + el.id + '"]:not(.mf-l)'); if (l) return l; }
    return null;
  }
  function skip(el) {
    if (el.closest(".mf") || el.closest("[data-nomf]") || el.hasAttribute("data-nomf")) return true;
    if (el.type === "hidden" || el.tabIndex === -1 || el.getAttribute("aria-hidden") === "true") return true;
    if (el.classList.contains("hp") || el.closest("header, nav, footer")) return true;
    /* the list header controls (sort, currency) are inline text, not form fields */
    if (el.closest("#lhead, .tabsrow, #lsortw, #curwrap")) return true;
    if (el.tagName === "SELECT" && !labelOf(el)) return true;   // bare selects inside tables and lists stay as they are
    return false;
  }
  function guessLabel(el) {
    var ph = el.getAttribute("placeholder") || "";
    if (el.type === "email") return { label: "Email", hint: ph };
    if (el.type === "tel") return { label: "Phone", hint: ph };
    if (ph) return { label: ph, hint: "" };
    return { label: el.getAttribute("aria-label") || el.name || "", hint: "" };
  }
  function wrap(el) {
    var old = labelOf(el), lab, hint;
    if (old) { lab = text(old); hint = el.getAttribute("placeholder") || ""; old.classList.add("mf-hid"); }
    else { var g = guessLabel(el); lab = g.label; hint = g.hint; }
    if (!lab) return;
    var box = document.createElement("div");
    box.className = "mf";
    if (el.tagName === "TEXTAREA") box.className += " mf-ta";
    if (el.tagName === "SELECT" || el.type === "date") box.className += " mf-up";
    if (el.classList.contains("wide")) box.classList.add("wide");
    /* the field's own layout hints move to the box, the field fills the box */
    ["flex", "minWidth", "width", "maxWidth", "gridColumn", "gridArea"].forEach(function (k) {
      if (el.style[k]) { box.style[k] = el.style[k]; el.style[k] = ""; }
    });
    /* whatever vertical room the field had (a margin from the page's own CSS) stays around the box */
    try {
      var cs = getComputedStyle(el);
      if (cs.marginTop && cs.marginTop !== "0px") box.style.marginTop = cs.marginTop;
      if (cs.marginBottom && cs.marginBottom !== "0px") box.style.marginBottom = cs.marginBottom;
    } catch (e) {}
    el.parentNode.insertBefore(box, el);
    box.appendChild(el);
    if (el.tagName !== "SELECT") {
      el.setAttribute("data-hint", hint);
      el.setAttribute("placeholder", hint || " ");   /* a placeholder must exist for :placeholder-shown */
    }
    var l = document.createElement("label");
    l.className = "mf-l";
    if (el.id) l.htmlFor = el.id;
    l.textContent = lab;
    box.appendChild(l);
    /* a field on a tinted panel needs the label to match, or the notch shows */
    try {
      var bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") l.style.setProperty("--mf-bg", bg);
    } catch (e) {}
  }
  function scan(root) {
    var els = (root || document).querySelectorAll(SEL);
    for (var i = 0; i < els.length; i++) if (!skip(els[i])) wrap(els[i]);
  }
  ready(function () {
    scan(document);
    /* forms rendered later by page scripts get the same treatment */
    if (window.MutationObserver) {
      var t = null;
      new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { scan(document); }, 60); })
        .observe(document.body, { childList: true, subtree: true });
    }
    /* a page script may swap the placeholder on resize; keep the label text as the source of truth */
    document.addEventListener("invalid", function (e) {
      var b = e.target && e.target.closest && e.target.closest(".mf"); if (b) b.classList.add("mf-err");
    }, true);
    document.addEventListener("input", function (e) {
      var b = e.target && e.target.closest && e.target.closest(".mf"); if (b) b.classList.remove("mf-err");
    }, true);
  });
})();
