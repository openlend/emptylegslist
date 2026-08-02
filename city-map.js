/* Empty Leg List — destination map for city pages.
 *
 * Drop this on a city page together with:
 *   <div class="citymap" data-city="London"></div>
 *   <script src="/city-map.js" defer></script>
 *
 * It reads the live flights from the same gated edge function the listings page
 * uses, works out which corridors actually run from that city, and draws them
 * over an OpenStreetMap embed. Nothing is hardcoded per city and no corridor is
 * invented: if a line is on the map, those flights exist in the data right now.
 *
 * Airport coordinates below come from the OurAirports public dataset.
 */
(function () {
  "use strict";

  var AP = {"ABZ":[57.2019,-2.1978],"AGP":[36.6749,-4.4991],"AMS":[52.3086,4.7639],"BDS":[40.6576,17.947],"BGI":[13.0747,-59.491],"BHX":[52.4539,-1.748],"BIQ":[43.4684,-1.5232],"BQH":[51.3308,0.0325],"BRE":[53.0468,8.7893],"BZR":[43.3235,3.3539],"CAG":[39.2515,9.0543],"CEQ":[43.548,6.9552],"CGN":[50.8659,7.1427],"CIA":[41.7988,12.5953],"CTT":[43.2525,5.7852],"DBV":[42.5622,18.2655],"DCM":[43.5563,2.2892],"DLM":[36.7131,28.7925],"DTM":[51.5183,7.6122],"DUB":[53.4287,-6.2621],"DUS":[51.2895,6.7668],"EAS":[43.3565,-1.7906],"EDI":[55.9501,-3.3723],"ERF":[50.9783,10.9607],"FAB":[51.2758,-0.7763],"FAO":[37.0159,-7.9709],"FMO":[52.1338,7.6885],"FRA":[50.0267,8.5584],"FSC":[41.5018,9.0971],"GCI":[49.435,-2.602],"GLA":[55.8719,-4.4331],"GOA":[44.412,8.8407],"GRO":[41.9046,2.7618],"GVA":[46.2381,6.109],"HAM":[53.6304,9.9882],"HER":[35.3397,25.1803],"IBZ":[38.8729,1.3731],"INN":[47.2602,11.344],"LBG":[48.9623,2.4365],"LTN":[51.8747,-0.3683],"LYS":[45.726,5.0901],"MGL":[51.2303,6.5044],"NCE":[43.6584,7.2159],"NVS":[47.0029,3.1131],"OLB":[40.899,9.5185],"OXF":[51.8369,-1.32],"PEG":[43.0959,12.5132],"PFO":[34.718,32.4857],"PMI":[39.5517,2.7388],"PSA":[43.6839,10.3927],"PUY":[44.8935,13.9222],"RMI":[44.02,12.6122],"SIR":[46.2192,7.3269],"SPU":[43.5389,16.298],"STN":[51.885,0.235],"SUF":[38.9062,16.246],"SZZ":[53.5847,14.9022],"TFS":[28.0445,-16.5725],"TIV":[42.4047,18.7233],"TLN":[43.0973,6.146],"VCE":[45.5053,12.3519],"VGO":[42.2318,-8.6268],"VIE":[48.1103,16.5697],"ZRH":[47.4581,8.5481],"LCY":[51.5053,0.0553],"LGW":[51.1487,-0.1857],"LHR":[51.4707,-0.4599],"BRU":[50.9014,4.4844],"ANR":[51.1907,4.4632],"KJK":[50.8189,3.2096],"CPT":[-33.974,18.6043],"JNB":[-26.1401,28.2468],"MUB":[-19.9705,23.4314],"YYZ":[43.6759,-79.6294],"YTZ":[43.6279,-79.3955],"LCA":[34.8751,33.6249],"ATH":[37.9364,23.9445],"BFS":[54.6575,-6.2158],"CDG":[49.009,2.5541],"MXP":[45.6306,8.7281],"LIN":[45.4451,9.2767],"MAN":[53.3494,-2.2795],"EMA":[52.8311,-1.3281],"SEN":[51.5706,0.6936],"NWI":[52.6758,1.2828]};

  var FN = "https://wscowiseslaovmmfuzyv.supabase.co/functions/v1/empty-legs";
  var KEY = "sb_publishable_CZvCh8iZrNsaqOcGonZxLQ_XkEkenSy";

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
    "kortrijk-wevelgem": "Wevelgem", "wevelgem": "Wevelgem"
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

  // Web Mercator, so the overlay lines sit correctly on the OSM tiles.
  function merc(lat) {
    var r = lat * Math.PI / 180;
    return Math.log(Math.tan(r) + 1 / Math.cos(r));
  }

  function render(host, city, partners) {
    if (!partners.length) { host.style.display = "none"; return; }

    var pts = partners.map(function (p) { return p.co; });
    pts.push(partners[0].origin);

    var lats = pts.map(function (p) { return p[0]; });
    var lons = pts.map(function (p) { return p[1]; });
    var padLat = Math.max(1.2, (Math.max.apply(null, lats) - Math.min.apply(null, lats)) * 0.18);
    var padLon = Math.max(1.6, (Math.max.apply(null, lons) - Math.min.apply(null, lons)) * 0.18);
    var s = Math.min.apply(null, lats) - padLat, n = Math.max.apply(null, lats) + padLat;
    var w = Math.min.apply(null, lons) - padLon, e = Math.max.apply(null, lons) + padLon;

    var mS = merc(s), mN = merc(n);
    function x(lon) { return ((lon - w) / (e - w)) * 100; }
    function y(lat) { return (1 - (merc(lat) - mS) / (mN - mS)) * 100; }

    var o = partners[0].origin;
    var lines = partners.map(function (p) {
      return '<line x1="' + x(o[1]).toFixed(2) + '" y1="' + y(o[0]).toFixed(2) +
             '" x2="' + x(p.co[1]).toFixed(2) + '" y2="' + y(p.co[0]).toFixed(2) + '"/>';
    }).join("");

    var pins = partners.map(function (p) {
      return '<span class="cm-pin" style="left:' + x(p.co[1]).toFixed(2) + '%;top:' + y(p.co[0]).toFixed(2) +
             '%"><i></i>' + esc(p.city) + ' <b>' + p.n + '</b></span>';
    }).join("");

    var bbox = [w.toFixed(3), s.toFixed(3), e.toFixed(3), n.toFixed(3)].join(",");

    host.innerHTML =
      '<div class="cm-wrap">' +
        '<iframe title="Map of empty leg routes from ' + esc(city) + '" loading="lazy" ' +
          'src="https://www.openstreetmap.org/export/embed.html?bbox=' + bbox + '&layer=mapnik"></iframe>' +
        '<svg class="cm-line" viewBox="0 0 100 100" preserveAspectRatio="none">' + lines + '</svg>' +
        '<span class="cm-pin cm-origin" style="left:' + x(o[1]).toFixed(2) + '%;top:' + y(o[0]).toFixed(2) +
          '%"><i></i>' + esc(city) + '</span>' +
        pins +
      '</div>' +
      '<p class="cm-note">Where aircraft actually reposition to and from ' + esc(city) +
      ' on the flights listed right now. The number is how many are open on that corridor.</p>';
  }

  function boot() {
    var hosts = Array.prototype.slice.call(document.querySelectorAll(".citymap"));
    if (!hosts.length) return;

    fetch(FN, { headers: { apikey: KEY } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var legs = (d && d.legs) || [];
        hosts.forEach(function (host) {
          var city = host.getAttribute("data-city") || "";
          if (!city) { host.style.display = "none"; return; }

          var counts = {}, coords = {}, originCo = null;
          legs.forEach(function (l) {
            var f = cityOf(l.from_airport), t = cityOf(l.to_airport);
            var here = null, other = null, otherIata = null, hereIata = null;
            if (f === city) { here = f; other = t; otherIata = l.to_iata; hereIata = l.from_iata; }
            else if (t === city) { here = t; other = f; otherIata = l.from_iata; hereIata = l.to_iata; }
            if (!here || !other || other === city) return;
            if (hereIata && AP[hereIata] && !originCo) originCo = AP[hereIata];
            if (!otherIata || !AP[otherIata]) return;
            counts[other] = (counts[other] || 0) + 1;
            coords[other] = AP[otherIata];
          });

          if (!originCo) { host.style.display = "none"; return; }

          var partners = Object.keys(counts)
            .map(function (c) { return { city: c, n: counts[c], co: coords[c], origin: originCo }; })
            .sort(function (a, b) { return b.n - a.n; })
            .slice(0, 6);

          render(host, city, partners);
        });
      })
      .catch(function () {
        hosts.forEach(function (h) { h.style.display = "none"; });
      });
  }

  var css =
    ".citymap{margin:22px 0 30px}" +
    ".cm-wrap{position:relative;border-radius:14px;overflow:hidden;border:1px solid #e4eaf0;background:#eef3f7;aspect-ratio:16/9;min-height:260px}" +
    ".cm-wrap iframe{position:absolute;inset:0;width:100%;height:100%;border:0;filter:saturate(.9)}" +
    ".cm-line{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}" +
    ".cm-line line{stroke:#0D1F36;stroke-width:1.1;stroke-dasharray:3 2.4;opacity:.75;vector-effect:non-scaling-stroke}" +
    ".cm-pin{position:absolute;transform:translate(-50%,-50%);display:inline-flex;align-items:center;gap:6px;" +
      "background:rgba(255,255,255,.94);border:1px solid #dde5ed;border-radius:999px;padding:3px 9px;" +
      "font:500 11.5px/1 Raleway,system-ui,sans-serif;color:#16222e;white-space:nowrap;pointer-events:none;" +
      "box-shadow:0 2px 8px rgba(13,31,54,.16)}" +
    ".cm-pin i{width:6px;height:6px;border-radius:999px;background:#C9A24C;display:block}" +
    ".cm-pin b{font-weight:600;color:#8a6f10}" +
    ".cm-origin{background:#0D1F36;border-color:#0D1F36;color:#fff;font-weight:600;z-index:2}" +
    ".cm-origin i{background:#C9A24C}" +
    ".cm-note{margin:10px 2px 0;font:300 12.5px/1.6 Raleway,system-ui,sans-serif;color:#7c8894}" +
    "@media(max-width:560px){.cm-pin{font-size:10.5px;padding:2px 7px}.cm-wrap{aspect-ratio:4/3}}";

  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
