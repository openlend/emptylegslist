/* Empty Leg List — route map for corridor pages.
 *
 * Usage:
 *   <div class="routemap"
 *        data-from="London" data-from-lat="51.5074" data-from-lon="-0.1278"
 *        data-to="Nice"     data-to-lat="43.6584"   data-to-lon="7.2159"></div>
 *   <script src="/route-map.js" defer></script>
 *
 * Draws the two endpoints and the corridor between them on real tiles.
 *
 * Leaflet rather than an OpenStreetMap <iframe> embed, for the same reason
 * city-map.js uses it: the embed picks its own zoom to fit a bbox, so it shows
 * a wider area than asked for, and it cannot draw an overlay at all. A line
 * positioned in percentages over an embed drifts off the tiles as soon as the
 * zoom differs. Leaflet's fitBounds and latLngToLayerPoint keep the pins and
 * the line exactly on geography.
 *
 * The line is the great-circle-ish direct corridor, drawn dashed because it is
 * an indication of the sector, not a filed flight plan.
 */
(function () {
  "use strict";

  var LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  var LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function load(cb) {
    if (window.L) return cb();
    var css = document.createElement("link");
    css.rel = "stylesheet"; css.href = LEAFLET_CSS;
    document.head.appendChild(css);
    var js = document.createElement("script");
    js.src = LEAFLET_JS;
    js.onload = cb;
    js.onerror = function () { cb(new Error("leaflet failed")); };
    document.head.appendChild(js);
  }

  /* Interpolate along the great circle so long sectors curve the way they
     actually fly, rather than cutting a straight line across the projection. */
  function arc(a, b, n) {
    var toRad = Math.PI / 180, toDeg = 180 / Math.PI;
    var lat1 = a[0] * toRad, lon1 = a[1] * toRad, lat2 = b[0] * toRad, lon2 = b[1] * toRad;
    var d = 2 * Math.asin(Math.sqrt(
      Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)));
    if (!d) return [a, b];
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var f = i / n;
      var A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
      var x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
      var y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
      var z = A * Math.sin(lat1) + B * Math.sin(lat2);
      pts.push([Math.atan2(z, Math.sqrt(x * x + y * y)) * toDeg, Math.atan2(y, x) * toDeg]);
    }
    return pts;
  }

  function draw(host) {
    var from = [parseFloat(host.dataset.fromLat), parseFloat(host.dataset.fromLon)];
    var to = [parseFloat(host.dataset.toLat), parseFloat(host.dataset.toLon)];
    if (isNaN(from[0]) || isNaN(to[0])) { host.style.display = "none"; return; }

    var wrap = document.createElement("div");
    wrap.className = "rm-wrap";
    host.appendChild(wrap);

    /* The one-line note that follows the map is written into the page, not here.
       Give it the map's width so the two line up instead of the text running the
       full column while the map sits at 520px. */
    var cap = host.nextElementSibling;
    if (cap && cap.tagName === "P") {
      cap.className += " rm-cap";
      cap.style.marginTop = "";      // several pages pull it up inline; undo that
      cap.style.marginBottom = "";
    }

    var map = L.map(wrap, { zoomControl: true, scrollWheelZoom: false, attributionControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 12,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    var line = arc(from, to, 64);
    L.polyline(line, {
      color: "#0D1F36", weight: 1.6, opacity: 0.7, dashArray: "5 5", interactive: false
    }).addTo(map);

    function pin(latlng, label, cls) {
      L.marker(latlng, {
        icon: L.divIcon({ className: "", html: '<span class="rm-pin ' + cls + '"><i></i>' + esc(label) + "</span>", iconSize: null }),
        keyboard: false, interactive: false
      }).addTo(map);
    }
    pin(from, host.dataset.from || "From", "rm-a");
    pin(to, host.dataset.to || "To", "rm-b");

    var bounds = L.latLngBounds(line);
    /* Fit once the container has a size. Calling fitBounds against a box that
       has not been laid out yet throws, and that exception was being caught
       upstream and hiding the finished map. */
    /* One level wider than the tight fit. The corridor reads better with the
       surrounding countries visible, and the two pins stop crowding the edges. */
    function fit() {
      try { map.invalidateSize(); map.fitBounds(bounds, { padding: [64, 64] }); } catch (e) {}
    }
    map.setView(bounds.getCenter(), 5);
    requestAnimationFrame(fit);
    setTimeout(fit, 250);
    setTimeout(fit, 900);
  }

  var css =
    ".routemap{margin:10px 0 8px}" +
    ".rm-wrap{position:relative;border-radius:14px;overflow:hidden;border:1px solid #e4eaf0;" +
      /* 4:5 portrait. Most of these corridors run north to south, so a tall frame
         holds both cities with far less empty sea than a wide one. Width is capped
         so the frame stays sane on a desktop; on a phone it fills the column. */
      "background:#eef3f7;aspect-ratio:4/5;width:100%;max-width:520px;margin:0 auto;z-index:0}" +
    ".rm-wrap .leaflet-container{height:100%;width:100%;background:#eef3f7;font:inherit}" +
    ".rm-cap{max-width:520px;margin:18px auto 30px;font-size:13px;line-height:1.65;color:#5b6b7c}" +
    ".rm-pin{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;" +
      "background:rgba(255,255,255,.96);border:1px solid #dde5ed;border-radius:999px;padding:5px 13px;" +
      "font:600 15px/1 Raleway,system-ui,sans-serif;color:#16222e;" +
      "box-shadow:0 3px 10px rgba(13,31,54,.22);transform:translate(-50%,-50%)}" +
    ".rm-pin i{width:7px;height:7px;border-radius:999px;background:#C9A24C;display:block;flex:0 0 auto}" +
    ".rm-pin.rm-b{background:#0D1F36;border-color:#0D1F36;color:#fff;font-weight:600}" +
    ".rm-pin.rm-b i{background:#C9A24C}" +
    "@media(max-width:560px){.rm-wrap{max-width:none}.rm-cap{max-width:none}.rm-pin{font-size:13.5px;padding:4px 11px}}";

  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  /* Init defensively. The corridor pages vary in how much they render after
     their own data arrives, and a single load listener proved unreliable, so
     run immediately, again on the usual events, and retry a few times for any
     host that is still empty. */
  /* A map that has rendered must never be hidden again. An earlier version
     hid the host on any error, and a late failing pass was wiping out a map
     that had already drawn, so the rule is now explicit and checked at every
     exit: only an empty host is ever hidden. */
  function hideIfEmpty(h) {
    if (!h.querySelector(".rm-wrap")) h.style.display = "none";
  }

  function start() {
    var hosts = Array.prototype.slice.call(document.querySelectorAll(".routemap"))
      .filter(function (h) { return !h.querySelector(".rm-wrap") && !h.dataset.rmBusy; });
    if (!hosts.length) return;
    hosts.forEach(function (h) {
      h.dataset.rmBusy = "1";
      h.style.removeProperty("display");   // clear a hide left by an earlier pass
    });
    load(function (err) {
      hosts.forEach(function (h) {
        delete h.dataset.rmBusy;
        if (err) { hideIfEmpty(h); return; }
        if (!h.querySelector(".rm-wrap")) {
          try { draw(h); } catch (e) {}
          hideIfEmpty(h);
        }
      });
    });
  }

  start();
  document.addEventListener("DOMContentLoaded", start);
  window.addEventListener("load", start);
  var tries = 0;
  var iv = setInterval(function () {
    start();
    if (++tries > 8 || document.querySelector(".rm-wrap")) clearInterval(iv);
  }, 700);
})();
