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

  /* Run once, however many times the file is included.
   *
   * On 14 September 2026 the commit that put the red sign-in notice above the
   * header left index.html with two <script src="/site-nav.js" defer> tags.
   * Both executed, so the burger got two click listeners: the first opened the
   * drawer, the second saw body.eln-open and shut it again. One tap, nothing
   * happened, and the phone menu on the home page had been dead for two days.
   * The duplicate tag is gone, and this makes the next one harmless. */
  if (window.__elnavBound) return;
  window.__elnavBound = true;

  var OPEN_DELAY = 60, CLOSE_DELAY = 140;

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    var header = document.querySelector("header.elnav");
    if (!header) return;
    /* "My account" meant nothing to a visitor looking for a way to sign in
       (Radu, 14 Sep 2026). Without a member key on this device the link says
       "Sign in"; the page behind it is the same. */
    try {
      if (!localStorage.getItem("el_token")) {
        var accs = document.querySelectorAll('a[href="/account"]');
        for (var ai = 0; ai < accs.length; ai++) {
          if (/^\s*My account\s*$/.test(accs[ai].textContent)) accs[ai].textContent = "Sign in";
        }
      }
    } catch (e) {}
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
    var regs = root.querySelectorAll(".eld-tabs button");
    if (!regs.length) return;
    Array.prototype.forEach.call(regs, function (b) {
      b.addEventListener("click", function () {
        var want = b.getAttribute("data-region");
        Array.prototype.forEach.call(regs, function (o) {
          var on = o === b;
          o.classList.toggle("on", on);
          o.setAttribute("aria-pressed", on ? "true" : "false");
        });
        Array.prototype.forEach.call(root.querySelectorAll(".eld-pan"), function (pn) {
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

/* Live counts, the twelve busiest cities, and search, inside the Destinations
   mega menu.
   ---------------------------------------------------------------------------
   The menu used to be a static list. Every other surface on the site shows
   what is on the board right now, so the navigation was the one place that
   could be confidently wrong: it offered Cannes and Geneva as "popular" while
   Nice sat at none and New York, the busiest place on the board, had no link.

   One POST to public.page_counts fills the panel: every city and every
   country. It is the same function the destination pages count with, so the
   menu and the page can never disagree. "Popular cities" then means the twelve
   with the most legs in that region today, not twelve somebody picked once.

   Nothing is fetched until the menu is opened, and the answer is kept in
   sessionStorage for ten minutes. The number is written to a data attribute
   and drawn by CSS, never into the link text, so the anchor text stays
   "London". If the fetch fails the menu is what it was: a list of links. */
(function () {
  var BASE = "https://wscowiseslaovmmfuzyv.supabase.co";
  var KEY  = "sb_publishable_CZvCh8iZrNsaqOcGonZxLQ_XkEkenSy";
  var CACHE = "el_navcounts_v2";
  var TTL = 10 * 60 * 1000;
  var SHOW = 12;
  var pending = null;

  function cached() {
    try {
      var raw = sessionStorage.getItem(CACHE);
      if (!raw) return null;
      var o = JSON.parse(raw);
      return (o && (Date.now() - o.t) <= TTL) ? o.c : null;
    } catch (e) { return null; }
  }
  function keep(c) {
    try { sessionStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), c: c })); } catch (e) {}
  }
  function counts() {
    if (pending) return pending;
    var have = cached();
    if (have) { pending = Promise.resolve(have); return pending; }
    pending = fetch("/pagespec.json", { cache: "force-cache" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (spec) {
        return fetch(BASE + "/rest/v1/rpc/page_counts", {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: KEY, Authorization: "Bearer " + KEY },
          body: JSON.stringify({ spec: spec })
        });
      })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (c) { keep(c); return c; });
    return pending;
  }

  function paint(root, c) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-elc]"), function (a) {
      var row = c[a.getAttribute("data-elc")];
      var n = (row && row.live) ? row.live : 0;
      a.setAttribute("data-n", String(n));
      a.setAttribute("data-live", n ? "1" : "0");
    });
    // Popular means busiest today. Every city stays in the page for a crawler
    // and for the search box; only twelve are on show.
    Array.prototype.forEach.call(root.querySelectorAll(".eld-cities"), function (pan) {
      var as = [].slice.call(pan.children);
      as.sort(function (x, y) {
        var d = (+y.getAttribute("data-n") || 0) - (+x.getAttribute("data-n") || 0);
        return d || x.textContent.localeCompare(y.textContent);
      });
      as.forEach(function (a, i) { pan.appendChild(a); a.dataset.rank = i; });
      trim(pan);
    });
  }
  function trim(pan) {
    [].slice.call(pan.children).forEach(function (a, i) { a.hidden = i >= SHOW; });
  }

  function search(root) {
    var box = root.querySelector(".eln-find-in");
    if (!box) return;
    var none = root.querySelector(".eln-find-none");
    var pans = root.querySelectorAll(".eld-pan");
    var regs = root.querySelectorAll(".eld-tabs button");

    function run() {
      var q = box.value.trim().toLowerCase();
      root.classList.toggle("finding", !!q);
      var hits = 0;
      Array.prototype.forEach.call(pans, function (pn) {
        var shown = 0;
        Array.prototype.forEach.call(pn.querySelectorAll("a"), function (a) {
          var on = !q || a.textContent.toLowerCase().indexOf(q) > -1;
          a.hidden = !on;
          if (on) shown++;
        });
        hits += shown;
        // While searching every region is open at once: somebody typing
        // "Houston" should not have to know it sits under North America.
        if (q) { pn.hidden = shown === 0; }
      });
      if (none) none.hidden = hits !== 0;
      if (!q) restore(root, regs, pans);
    }
    function restore(root, regs, pans) {
      var want = "0";
      Array.prototype.forEach.call(regs, function (b) {
        if (b.classList.contains("on")) want = b.getAttribute("data-region");
      });
      Array.prototype.forEach.call(pans, function (pn) {
        pn.hidden = pn.getAttribute("data-region") !== want;
      });
      Array.prototype.forEach.call(root.querySelectorAll(".eld-cities"), trim);
    }
    box.addEventListener("input", run);
    box.addEventListener("search", run);
    box.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.value) { e.stopPropagation(); box.value = ""; run(); }
    });
    // A region tab press has to put the twelve back after a search.
    Array.prototype.forEach.call(regs, function (b) {
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(root.querySelectorAll(".eld-cities"), trim);
      });
    });
  }

  function init() {
    var roots = document.querySelectorAll(".mega-dest");
    if (!roots.length) return;
    Array.prototype.forEach.call(roots, function (r) {
      search(r);
      Array.prototype.forEach.call(r.querySelectorAll(".eld-cities"), trim);
    });
    var done = false;
    function load() {
      if (done) return;
      done = true;
      counts().then(function (c) {
        Array.prototype.forEach.call(roots, function (r) { paint(r, c); });
      }).catch(function () { done = false; });
    }
    Array.prototype.forEach.call(roots, function (r) {
      var item = r.parentNode;
      ["mouseenter", "focusin", "click", "touchstart"].forEach(function (ev) {
        item.addEventListener(ev, load, { passive: true });
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
