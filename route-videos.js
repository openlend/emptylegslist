/* Videos already published for this route.
 *
 * The daily pipeline posts one short film per empty leg and keeps
 * social-media/videos.json in Supabase Storage up to date, so this page needs no
 * rebuild to show a new one. The section renders only when that route has at
 * least one video; an empty or unreachable file leaves the page exactly as it was.
 *
 * Embeds use youtube-nocookie.com and load on click, so nothing is requested from
 * YouTube until the visitor asks for it.
 */
(function () {
  "use strict";
  var SRC = "https://wscowiseslaovmmfuzyv.supabase.co/storage/v1/object/public/social-media/videos.json";

  function routeSlug() {
    var host = document.querySelector("[data-route]");
    if (host && host.getAttribute("data-route")) return host.getAttribute("data-route");
    var m = location.pathname.replace(/\/+$/, "").match(/\/empty-legs\/([a-z0-9-]+-to-[a-z0-9-]+)$/);
    return m ? m[1] : null;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var css =
    ".rv{margin:34px 0 8px}" +
    ".rv h2{margin-bottom:6px}" +
    ".rv .rvnote{color:#5b6b7c;font-size:14px;margin:0 0 16px}" +
    ".rv .rvgrid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(230px,1fr))}" +
    ".rv figure{margin:0;border:1px solid #e4eaf0;border-radius:14px;overflow:hidden;background:#0D1F36}" +
    ".rv .rvframe{position:relative;aspect-ratio:9/16;background:#0D1F36;cursor:pointer}" +
    ".rv .rvframe img,.rv .rvframe iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;object-fit:cover}" +
    ".rv .rvplay{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:56px;height:56px;border-radius:999px;" +
      "background:rgba(13,31,54,.72);border:1px solid rgba(201,162,76,.7);display:flex;align-items:center;justify-content:center}" +
    ".rv .rvplay::after{content:'';border-left:16px solid #C9A24C;border-top:10px solid transparent;border-bottom:10px solid transparent;margin-left:4px}" +
    ".rv figcaption{padding:10px 12px 12px;color:#fff;font-size:13px;line-height:1.45}" +
    ".rv figcaption b{display:block;font-weight:600}" +
    ".rv figcaption span{color:#c8d0d8}";

  function render(host, list) {
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);
    host.removeAttribute("hidden");
    host.className = "rv";
    host.innerHTML =
      "<h2>Flights we have filmed on this route</h2>" +
      '<p class="rvnote">Each film covers one leg that was listed here, with the operator\'s own price. ' +
      "The flight itself is gone; the route comes back.</p>" +
      '<div class="rvgrid">' +
      list.map(function (v) {
        return '<figure><div class="rvframe" data-id="' + esc(v.id) + '" role="button" tabindex="0" ' +
          'aria-label="Play the film of ' + esc(v.leg) + '">' +
          '<img src="https://i.ytimg.com/vi/' + esc(v.id) + '/hqdefault.jpg" loading="lazy" alt="' + esc(v.leg) + '">' +
          '<span class="rvplay"></span></div>' +
          "<figcaption><b>" + esc(v.leg) + "</b><span>" + esc(v.aircraft || "") +
          (v.price ? " &middot; " + esc(v.price) : "") + "</span></figcaption></figure>";
      }).join("") +
      "</div>";

    host.addEventListener("click", play);
    host.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") play(e); });
    function play(e) {
      var f = e.target.closest ? e.target.closest(".rvframe") : null;
      if (!f || f.dataset.on) return;
      f.dataset.on = "1";
      f.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + f.getAttribute("data-id") +
        '?autoplay=1&rel=0" title="Empty Leg List" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    }
  }

  function start() {
    var host = document.getElementById("route-videos");
    if (!host) return;
    var slug = routeSlug();
    if (!slug) return;
    fetch(SRC, { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (all) {
        var list = all && all[slug];
        if (list && list.length) render(host, list.slice(0, 6));
      })
      .catch(function () { /* the page is fine without it */ });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
