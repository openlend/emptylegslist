/* Route and city pages: a one-line alert box above the live list, prefilled
   with the page's route (14 September 2026). Markup is static in each page
   (.abar with data-from / data-to); this only submits it. One row per
   direction for a route, one row for a city. Same table and rules as the
   home page form. */
(function () {
  "use strict";
  var BASE = "https://wscowiseslaovmmfuzyv.supabase.co", KEY = "sb_publishable_CZvCh8iZrNsaqOcGonZxLQ_XkEkenSy";
  function track(name, data) { try { if (window.va) window.va("event", { name: name, data: data || {} }); } catch (e) {} }
  function wire(box) {
    var form = box.querySelector("form"), input = box.querySelector("input[type=email]"),
        btn = box.querySelector("button"), note = box.querySelector(".abar-n");
    if (!form || !input || !btn) return;
    var from = box.getAttribute("data-from") || "", to = box.getAttribute("data-to") || "";
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (input.value || "").trim();
      if (email.indexOf("@") < 1 || email.length < 6) { input.focus(); box.classList.add("abar-err"); return; }
      box.classList.remove("abar-err");
      var rows = [{ email: email, from_interest: from || null, to_interest: to || null, consent: true, frequency: "instant" }];
      if (from && to) rows.push({ email: email, from_interest: to, to_interest: from, consent: true, frequency: "instant" });
      btn.disabled = true; btn.textContent = "Saving...";
      fetch(BASE + "/rest/v1/empty_leg_alerts", {
        method: "POST",
        headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(rows)
      }).then(function (r) {
        if (!r.ok) throw 0;
        form.innerHTML = '<span class="abar-ok">Done. You get an email the moment a leg is listed' + (from && to ? ' in either direction' : '') + '. One click to stop.</span>';
        if (note) note.style.display = "none";
        track("alert_subscribed", { from: from || "any", to: to || "any", where: "page bar" });
      }).catch(function () {
        btn.disabled = false; btn.textContent = "Notify me";
        box.classList.add("abar-err");
      });
    });
  }
  function init() { var boxes = document.querySelectorAll(".abar"); for (var i = 0; i < boxes.length; i++) wire(boxes[i]); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
