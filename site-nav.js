/* Behaviour for the site header. The markup is static in every page so the
 * links are in the HTML for crawlers; this only handles opening and closing.
 *
 * Desktop: hover opens the mega panel, with a short close delay so a diagonal
 * mouse path from the trigger to the panel does not shut it. Click and keyboard
 * work too, for touch laptops and for anyone tabbing.
 * Mobile: a drawer from the right, with accordions, scroll lock and Escape.
 */
(function () {
  "use strict";
  var OPEN_DELAY = 60, CLOSE_DELAY = 140;

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    var header = document.querySelector("header.elnav");
    if (!header) return;
    var items = [].slice.call(header.querySelectorAll(".eln-item"));
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)");

    function close(item) {
      item.classList.remove("open");
      var t = item.querySelector(".eln-trig");
      if (t) t.setAttribute("aria-expanded", "false");
    }
    function open(item) {
      items.forEach(function (o) { if (o !== item) close(o); });
      item.classList.add("open");
      var t = item.querySelector(".eln-trig");
      if (t) t.setAttribute("aria-expanded", "true");
    }
    function closeAll() { items.forEach(close); }

    items.forEach(function (item) {
      var trig = item.querySelector(".eln-trig");
      var openT = null, closeT = null;

      item.addEventListener("pointerenter", function (e) {
        if (e.pointerType === "touch" || !fine.matches) return;
        clearTimeout(closeT);
        openT = setTimeout(function () { open(item); }, OPEN_DELAY);
      });
      item.addEventListener("pointerleave", function (e) {
        if (e.pointerType === "touch" || !fine.matches) return;
        clearTimeout(openT);
        closeT = setTimeout(function () { close(item); }, CLOSE_DELAY);
      });
      if (trig) {
        trig.addEventListener("click", function (e) {
          e.preventDefault();
          clearTimeout(openT); clearTimeout(closeT);
          if (item.classList.contains("open")) close(item); else open(item);
        });
      }
      /* Tabbing out of the last link in a panel should close it. */
      item.addEventListener("focusout", function (e) {
        if (!item.contains(e.relatedTarget)) close(item);
      });
    });

    document.addEventListener("click", function (e) {
      if (!header.contains(e.target)) closeAll();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeAll(); shut(); }
    });

    /* ---------- drawer ---------- */
    var burger = header.querySelector(".eln-burger");
    var drawer = document.querySelector(".eln-drawer");
    var scrim = document.querySelector(".eln-scrim");
    var body = document.body;
    var savedY = 0, opener = null, inerted = [];
    var FOCUSABLE = "a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])";

    function focusables() {
      return [].slice.call(drawer.querySelectorAll(FOCUSABLE)).filter(function (el) {
        /* a link inside a closed accordion is hidden, and must not take focus */
        if (el.offsetParent === null) return false;
        var acc = el.closest(".eln-panel") && el.closest(".eln-acc");
        return !acc || acc.classList.contains("open");
      });
    }

    function shut(opts) {
      if (!body.classList.contains("eln-open")) return;
      body.classList.remove("eln-open");
      /* scroll lock off first, then the page goes back exactly where it was */
      body.classList.remove("eln-lock");
      body.style.top = "";
      window.scrollTo(0, savedY);
      inerted.forEach(function (el) { el.removeAttribute("inert"); });
      inerted = [];
      if (burger) burger.setAttribute("aria-expanded", "false");
      if (opener && (!opts || !opts.noFocus) && typeof opener.focus === "function") opener.focus({ preventScroll: true });
      opener = null;
    }
    function show() {
      if (body.classList.contains("eln-open")) return;
      opener = document.activeElement || burger;
      savedY = window.pageYOffset || document.documentElement.scrollTop || 0;
      body.style.top = (-savedY) + "px";
      body.classList.add("eln-open", "eln-lock");
      if (burger) burger.setAttribute("aria-expanded", "true");
      /* everything behind the drawer stops taking keyboard focus */
      [].slice.call(body.children).forEach(function (el) {
        if (el === drawer || el === scrim || el.tagName === "SCRIPT") return;
        if (!el.hasAttribute("inert")) { el.setAttribute("inert", ""); inerted.push(el); }
      });
      var first = drawer.querySelector(".eln-dclose") || focusables()[0];
      if (first) first.focus({ preventScroll: true });
    }

    if (burger) {
      burger.addEventListener("click", function () {
        if (body.classList.contains("eln-open")) shut(); else show();
      });
    }
    if (scrim) scrim.addEventListener("click", function () { shut(); });
    var dclose = drawer && drawer.querySelector(".eln-dclose");
    if (dclose) dclose.addEventListener("click", function () { shut(); });
    if (drawer) {
      drawer.addEventListener("click", function (e) {
        var a = e.target.closest("a");
        /* A link to another page navigates anyway; one to an anchor on this
           page would otherwise leave the drawer sitting over the target. */
        if (a && a.getAttribute("href")) shut({ noFocus: true });
      });
      /* keyboard stays inside the open drawer */
      drawer.addEventListener("keydown", function (e) {
        if (e.key !== "Tab") return;
        var f = focusables(); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
      [].slice.call(drawer.querySelectorAll(".eln-acc > button")).forEach(function (b) {
        b.addEventListener("click", function () {
          var acc = b.parentElement;
          var was = acc.classList.contains("open");
          [].slice.call(drawer.querySelectorAll(".eln-acc")).forEach(function (o) {
            if (!o.classList.contains("open")) return;
            /* if focus is in the section that is closing, put it on its toggle */
            var ob = o.querySelector("button");
            if (o.contains(document.activeElement) && document.activeElement !== ob && ob) ob.focus();
            o.classList.remove("open");
            if (ob) ob.setAttribute("aria-expanded", "false");
          });
          if (!was) { acc.classList.add("open"); b.setAttribute("aria-expanded", "true"); }
        });
      });
    }
    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { if (window.innerWidth > 1080) shut({ noFocus: true }); }, 80);
    });

    /* Mark the page we are on, so the header says where you are. */
    var here = location.pathname.replace(/\/$/, "") || "/";
    [].slice.call(header.querySelectorAll("a[href^='/']"))
      .concat(drawer ? [].slice.call(drawer.querySelectorAll("a[href^='/']")) : [])
      .forEach(function (a) {
        if (a.getAttribute("href").replace(/\/$/, "") === here) a.setAttribute("aria-current", "page");
      });
  });
})();

/* Region tabs in the Destinations menu. Plain buttons, no framework: the panel
   is already in the HTML, this only shows one region at a time. */
(function () {
  function wire(root) {
    var regs = root.querySelectorAll(".eln-regs button");
    if (!regs.length) return;
    Array.prototype.forEach.call(regs, function (b) {
      b.addEventListener("click", function () {
        var want = b.getAttribute("data-region");
        Array.prototype.forEach.call(regs, function (o) {
          var on = o === b;
          o.classList.toggle("on", on);
          o.setAttribute("aria-pressed", on ? "true" : "false");
        });
        Array.prototype.forEach.call(root.querySelectorAll(".eln-pan"), function (pn) {
          var on = pn.getAttribute("data-region") === want;
          pn.hidden = !on;
          pn.classList.toggle("on", on);
        });
      });
    });
  }
  function init() {
    Array.prototype.forEach.call(document.querySelectorAll(".mega-dest"), wire);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

/* Footer columns collapse on a phone. Done here rather than in the markup so
   that with JavaScript off they stay open, which is what they were before. */
(function () {
  function fold() {
    var small = window.matchMedia("(max-width: 820px)").matches;
    Array.prototype.forEach.call(
      document.querySelectorAll("#bigfoot details.bf-col"),
      function (d) { if (small) d.removeAttribute("open"); else d.setAttribute("open", ""); }
    );
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fold);
  else fold();
  var t; window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(fold, 200); });
})();
