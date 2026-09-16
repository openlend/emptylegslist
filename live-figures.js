/* Every written figure on the site, read from the board as the page loads.
 *
 * 17 September 2026. Radu: "I want the site done done, not an article that says
 * up to x date we had these. That is not evergreen."
 *
 * He was right and it was worse than untidy. The guides quoted "1,091 upcoming
 * legs, 848 with no published price, recorded on 3 September 2026" while the
 * board held 2,264. A reader got half the truth with a date beside it that made
 * it look deliberate.
 *
 * Rewriting those sentences to a newer snapshot would be wrong again in a
 * fortnight. So a figure in prose is now written as
 *
 *     <span data-el="legs">2,264</span>
 *
 * and this replaces the text with the live value. The number in the HTML is the
 * fallback, not the source: if the call fails, or a crawler does not run
 * JavaScript, the page still reads correctly with the figure it was built with.
 * That is why the build writes today's real number in there rather than a dash.
 *
 * Keys come from public.site_stats(). Anything not in the response is left
 * alone, so a span can be added to a page before the figure exists here.
 */
(function () {
  "use strict";
  if (window.__elFiguresBound) return;
  window.__elFiguresBound = true;

  var BASE = "https://wscowiseslaovmmfuzyv.supabase.co";
  var KEY = "sb_publishable_CZvCh8iZrNsaqOcGonZxLQ_XkEkenSy";

  function nodes() { return document.querySelectorAll("[data-el]"); }
  if (!nodes().length) return;

  var fmt = function (n) { return Number(n).toLocaleString("en-GB"); };

  /* A few keys read better as words than as digits in the middle of a sentence,
     and a couple are dates rather than counts. */
  function render(key, v) {
    if (v === null || v === undefined) return null;
    if (key === "record_since") {
      var d = new Date(String(v) + "T12:00:00");
      return isNaN(d) ? null : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    }
    if (typeof v === "number") return fmt(v);
    return String(v);
  }

  fetch(BASE + "/rest/v1/rpc/site_stats", {
    method: "POST",
    headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
    body: "{}"
  })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (s) {
      if (!s || typeof s !== "object") return;
      nodes().forEach(function (el) {
        var key = el.getAttribute("data-el");
        var out = render(key, s[key]);
        if (out !== null && out !== "") el.textContent = out;
      });
      /* Anything that only makes sense once the real figures are in, such as a
         line that says the page updates itself, is revealed here. */
      document.querySelectorAll("[data-el-when]").forEach(function (el) { el.hidden = false; });
    })
    .catch(function () { /* the built-in figures stand */ });
})();
