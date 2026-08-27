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

    function shut() {
      if (!body.classList.contains("eln-open")) return;
      body.classList.remove("eln-open", "eln-lock");
      if (burger) burger.setAttribute("aria-expanded", "false");
    }
    function show() {
      body.classList.add("eln-open", "eln-lock");
      if (burger) burger.setAttribute("aria-expanded", "true");
    }

    if (burger) {
      burger.addEventListener("click", function () {
        if (body.classList.contains("eln-open")) shut(); else show();
      });
    }
    if (scrim) scrim.addEventListener("click", shut);
    var dclose = drawer && drawer.querySelector(".eln-dclose");
    if (dclose) dclose.addEventListener("click", shut);
    if (drawer) {
      drawer.addEventListener("click", function (e) {
        var a = e.target.closest("a");
        /* A link to another page navigates anyway; one to an anchor on this
           page would otherwise leave the drawer sitting over the target. */
        if (a && a.getAttribute("href")) shut();
      });
      [].slice.call(drawer.querySelectorAll(".eln-acc > button")).forEach(function (b) {
        b.addEventListener("click", function () {
          var acc = b.parentElement;
          var was = acc.classList.contains("open");
          [].slice.call(drawer.querySelectorAll(".eln-acc")).forEach(function (o) {
            o.classList.remove("open");
            var ob = o.querySelector("button"); if (ob) ob.setAttribute("aria-expanded", "false");
          });
          if (!was) { acc.classList.add("open"); b.setAttribute("aria-expanded", "true"); }
        });
      });
    }
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1080) shut();
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
