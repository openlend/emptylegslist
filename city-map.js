/* Empty Leg List — destination map for city pages.
 *
 * Usage on a city page:
 *   <div class="citymap" data-city="London"></div>
 *   <script src="/city-map.js" defer></script>
 *
 * It reads the live flights from the same edge function the listings page uses,
 * works out which corridors actually run from that city, and draws them on a
 * real slippy map. Nothing is hardcoded per city and no corridor is invented:
 * if a line is on the map, those flights are open in the data right now.
 *
 * Leaflet is used rather than an OpenStreetMap <iframe> embed on purpose. The
 * embed picks its own zoom to fit a bbox, so it shows a wider area than asked
 * for and any overlay drawn in percentages drifts off the tiles. Leaflet's
 * fitBounds and latLngToLayerPoint keep markers and lines exactly on geography.
 *
 * Airport coordinates come from the OurAirports public dataset.
 */
(function () {
  "use strict";

  var AP = {"ABZ":[57.2019,-2.1978],"AGP":[36.6749,-4.4991],"AMS":[52.3086,4.7639],"BDS":[40.6576,17.947],"BGI":[13.0747,-59.491],"BHX":[52.4539,-1.748],"BIQ":[43.4684,-1.5232],"BQH":[51.3308,0.0325],"BRE":[53.0468,8.7893],"BZR":[43.3235,3.3539],"CAG":[39.2515,9.0543],"CEQ":[43.548,6.9552],"CGN":[50.8659,7.1427],"CIA":[41.7988,12.5953],"CTT":[43.2525,5.7852],"DBV":[42.5622,18.2655],"DCM":[43.5563,2.2892],"DLM":[36.7131,28.7925],"DTM":[51.5183,7.6122],"DUB":[53.4287,-6.2621],"DUS":[51.2895,6.7668],"EAS":[43.3565,-1.7906],"EDI":[55.9501,-3.3723],"ERF":[50.9783,10.9607],"FAB":[51.2758,-0.7763],"FAO":[37.0159,-7.9709],"FMO":[52.1338,7.6885],"FRA":[50.0267,8.5584],"FSC":[41.5018,9.0971],"GCI":[49.435,-2.602],"GLA":[55.8719,-4.4331],"GOA":[44.412,8.8407],"GRO":[41.9046,2.7618],"GVA":[46.2381,6.109],"HAM":[53.6304,9.9882],"HER":[35.3397,25.1803],"IBZ":[38.8729,1.3731],"INN":[47.2602,11.344],"LBG":[48.9623,2.4365],"LTN":[51.8747,-0.3683],"LYS":[45.726,5.0901],"MGL":[51.2303,6.5044],"NCE":[43.6584,7.2159],"NVS":[47.0029,3.1131],"OLB":[40.899,9.5185],"OXF":[51.8369,-1.32],"PEG":[43.0959,12.5132],"PFO":[34.718,32.4857],"PMI":[39.5517,2.7388],"PSA":[43.6839,10.3927],"PUY":[44.8935,13.9222],"RMI":[44.02,12.6122],"SIR":[46.2192,7.3269],"SPU":[43.5389,16.298],"STN":[51.885,0.235],"SUF":[38.9062,16.246],"SZZ":[53.5847,14.9022],"TFS":[28.0445,-16.5725],"TIV":[42.4047,18.7233],"TLN":[43.0973,6.146],"VCE":[45.5053,12.3519],"VGO":[42.2318,-8.6268],"VIE":[48.1103,16.5697],"ZRH":[47.4581,8.5481],"LCY":[51.5053,0.0553],"LGW":[51.1487,-0.1857],"LHR":[51.4707,-0.4599],"BRU":[50.9014,4.4844],"ANR":[51.1907,4.4632],"KJK":[50.8189,3.2096],"CPT":[-33.974,18.6043],"JNB":[-26.1401,28.2468],"MUB":[-19.9705,23.4314],"YYZ":[43.6759,-79.6294],"YTZ":[43.6279,-79.3955],"LCA":[34.8751,33.6249],"ATH":[37.9364,23.9445],"BFS":[54.6575,-6.2158],"CDG":[49.009,2.5541],"MXP":[45.6306,8.7281],"LIN":[45.4451,9.2767],"MAN":[53.3494,-2.2795],"EMA":[52.8311,-1.3281],"SEN":[51.5706,0.6936],"NWI":[52.6758,1.2828]};

  var FN = "https://wscowiseslaovmmfuzyv.supabase.co/functions/v1/empty-legs";
  var KEY = "sb_publishable_CZvCh8iZrNsaqOcGonZxLQ_XkEkenSy";
  var LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  var LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

  // Multi-airport cities are one place to a traveller.
  var FOLD = {
    "london luton": "London", "london stansted": "London", "london oxford": "London",
    "london biggin hill": "London", "london city": "London", "london heathrow": "London",
    "london gatwick": "London", "farnborough": "London",
    "ibiza (eivissa)": "Ibiza", "eivissa": "Ibiza",
    "milan linate": "Milan", "milan malpensa": "Milan", "milano": "Milan",
    "paris le bourget": "Paris", "le bourget": "Paris",
    "nice cote d'azur": "Nice", "nice côte d'azur": "Nice",
    "birmingham international": "Birmingham", "larnarca": "Larnaca",
    "kortrijk-wevelgem": "Wevelgem"
  };

  function cityOf(name) {
    if (!name) return "";
    var c = String(name).replace(/,\s*[A-Z]{2}$/, "").replace(/\s*\(.*\)\s*$/, "").trim();
    var k = c.toLowerCase();
    if (FOLD[k]) return FOLD[k];
    var m = k.match(/^(london|paris|milan|new york|rome|berlin)\b/);
    if (m) return m[1].replace(/\b\w/g, function (ch) { return ch.toUpperCase(); });
    return c;
  }

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

  function draw(host, city, origin, partners) {
    var wrap = document.createElement("div");
    wrap.className = "cm-wrap";
    host.appendChild(wrap);

    var note = document.createElement("p");
    note.className = "cm-note";
    note.textContent = "Where aircraft actually reposition to and from " + city +
      " on the flights listed right now. The number is how many are open on that corridor.";
    host.appendChild(note);

    var map = L.map(wrap, {
      zoomControl: true, scrollWheelZoom: false, attributionControl: true
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 12, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    function pin(latlng, label, cls) {
      L.marker(latlng, {
        icon: L.divIcon({ className: "", html: '<span class="cm-pin ' + cls + '">' + label + "</span>", iconSize: null }),
        keyboard: false, interactive: false
      }).addTo(map);
    }

    partners.forEach(function (p) {
      L.polyline([origin, p.co], {
        color: "#0D1F36", weight: 1.4, opacity: 0.65, dashArray: "4 4", interactive: false
      }).addTo(map);
      pin(p.co, "<i></i>" + esc(p.city) + " <b>" + p.n + "</b>", "");
    });
    pin(origin, "<i></i>" + esc(city), "cm-origin");

    var bounds = L.latLngBounds([origin].concat(partners.map(function (p) { return p.co; })));
    map.fitBounds(bounds, { padding: [46, 46] });
    setTimeout(function () { map.invalidateSize(); map.fitBounds(bounds, { padding: [46, 46] }); }, 250);
  }

  function boot() {
    var hosts = Array.prototype.slice.call(document.querySelectorAll(".citymap"))
      .filter(function (h) { return !h.querySelector(".cm-wrap"); });
    if (!hosts.length) return;

    fetch(FN, { headers: { apikey: KEY } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var legs = (d && d.legs) || [];
        var jobs = [];

        hosts.forEach(function (host) {
          var city = host.getAttribute("data-city") || "";
          if (!city) return;

          var counts = {}, coords = {}, origin = null;
          legs.forEach(function (l) {
            var f = cityOf(l.from_airport), t = cityOf(l.to_airport);
            var other, otherIata, hereIata;
            if (f === city) { other = t; otherIata = l.to_iata; hereIata = l.from_iata; }
            else if (t === city) { other = f; otherIata = l.from_iata; hereIata = l.to_iata; }
            else return;
            if (!other || other === city) return;
            if (!origin && hereIata && AP[hereIata]) origin = AP[hereIata];
            if (!otherIata || !AP[otherIata]) return;
            counts[other] = (counts[other] || 0) + 1;
            coords[other] = AP[otherIata];
          });

          var partners = Object.keys(counts)
            .map(function (c) { return { city: c, n: counts[c], co: coords[c] }; })
            .sort(function (a, b) { return b.n - a.n; })
            .slice(0, 6);

          if (!origin || !partners.length) return;   // nothing yet; a later retry may find it
          jobs.push({ host: host, city: city, origin: origin, partners: partners });
        });

        if (!jobs.length) return;
        load(function (err) {
          if (err) { jobs.forEach(function (j) { j.host.style.display = "none"; }); return; }
          jobs.forEach(function (j) { draw(j.host, j.city, j.origin, j.partners); });
        });
      })
      .catch(function () { /* leave the slot empty and let the retry try again */ });
  }

  var css =
    ".citymap{margin:22px 0 30px}" +
    ".cm-wrap{position:relative;border-radius:14px;overflow:hidden;border:1px solid #e4eaf0;" +
      "background:#eef3f7;height:420px;z-index:0}" +
    ".cm-wrap .leaflet-container{height:100%;width:100%;background:#eef3f7;font:inherit}" +
    ".cm-pin{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;" +
      "background:rgba(255,255,255,.95);border:1px solid #dde5ed;border-radius:999px;padding:3px 9px;" +
      "font:500 11.5px/1 Raleway,system-ui,sans-serif;color:#16222e;" +
      "box-shadow:0 2px 8px rgba(13,31,54,.18);transform:translate(-50%,-50%)}" +
    ".cm-pin i{width:6px;height:6px;border-radius:999px;background:#C9A24C;display:block;flex:0 0 auto}" +
    ".cm-pin b{font-weight:600;color:#8a6f10}" +
    ".cm-pin.cm-origin{background:#0D1F36;border-color:#0D1F36;color:#fff;font-weight:600}" +
    ".cm-note{margin:10px 2px 0;font:300 12.5px/1.6 Raleway,system-ui,sans-serif;color:#7c8894}" +
    "@media(max-width:560px){.cm-wrap{height:320px}.cm-pin{font-size:10.5px;padding:2px 7px}}";

  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  // The city page renders its own sections after its data arrives, which can
  // replace the container this map lives in. Start after load and re-check a
  // couple of times, rendering only into hosts that are still empty.
  function start() {
    boot();
    var tries = 0;
    var iv = setInterval(function () {
      var pending = Array.prototype.slice.call(document.querySelectorAll(".citymap"))
        .filter(function (h) { return !h.querySelector(".cm-wrap"); });
      if (pending.length) boot();
      if (++tries > 10) clearInterval(iv);
    }, 900);
  }

  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
})();
